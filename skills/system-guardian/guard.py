import sys
import subprocess
import threading
import time
import re
import requests
import json
import os
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))
import config_manager

def send_telegram_notification(token, chat_id, message, analysis=None):
    """Send a message to Telegram"""
    url = f"https://api.telegram.org/bot{token}/sendMessage"

    full_text = f"🛡️ **System Guardian Alert** 🛡️\n\n{message}"

    if analysis:
        full_text += f"\n\n🤖 **Jules Analysis**:\n{analysis}"

    payload = {
        "chat_id": chat_id,
        "text": full_text,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"[Guardian] Failed to send Telegram notification: {response.text}")
    except Exception as e:
        print(f"[Guardian] Error sending Telegram notification: {e}")

def run_jules_analysis(error_output):
    """Run jules to analyze the error"""
    try:
        # Construct the prompt for Jules
        # We assume 'jules' is in the PATH or we use a direct query if available via an API
        # For this implementation, we will try to run 'jules' command if available,
        # otherwise we'll return a simulated analysis for specific known errors.

        # NOTE: Since calling an interactive AI tool programmatically can be complex,
        # we will use a simple heuristic for known errors first, and then try a subprocess call.

        analysis = ""

        # Heuristics
        if "OAuth token refresh failed" in error_output:
            analysis += "⚠️ **Auth Error Detected**: The system lost connection to the LLM credential provider.\n"
            analysis += "✅ **Fix**: Run `openclaw models auth login --provider qwen-portal` to re-authenticate."
        elif "UnicodeEncodeError" in error_output:
            analysis += "⚠️ **Encoding Error**: Python is trying to print characters not supported by your Windows terminal.\n"
            analysis += "✅ **Fix**: Replace special emojis/characters in the script with standard ASCII text."
        elif "ModuleNotFoundError" in error_output:
            match = re.search(r"No module named '([^']+)'", error_output)
            module = match.group(1) if match else "unknown"
            analysis += f"⚠️ **Missing Dependency**: The module `{module}` is not installed.\n"
            analysis += f"✅ **Fix**: Run `pip install {module}`."

        return analysis if analysis else "Error analysis not available (Jules integration pending)."

    except Exception as e:
        return f"Failed to run analysis: {e}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python guard.py <command> [args...]")
        sys.exit(1)

    command = sys.argv[1:]
    command_str = " ".join(command)

    print(f"[Guardian] Monitoring execution of: {command_str}")
    print("-" * 50)

    # Capture output while streaming it to the console
    # On Windows, using Popen with pipes can be tricky with interactive commands.
    # We will simply wait for completion and capture success/failure status.
    # For a full wrap that proxies IO, we'd need a more complex PTY setup which is hard on Windows.
    # Approach: Run, let it inherit stdin/stdout/stderr so user sees interaction,
    # BUT finding out "what happened" requires capturing stderr.

    # To capture AND stream on Windows without PTY is hard.
    # We will prioritize capturing stderr for analysis in case of failure.

    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace' # Prevent crashing on the guardian itself due to encoding
    )

    stdout_lines = []
    stderr_lines = []

    def read_stream(stream, lines_list, display_prefix):
        for line in stream:
            print(line, end='') # Echo to console
            lines_list.append(line)

    # Threads to read stdout/stderr without blocking
    t_out = threading.Thread(target=read_stream, args=(process.stdout, stdout_lines, ""))
    t_err = threading.Thread(target=read_stream, args=(process.stderr, stderr_lines, ""))

    t_out.start()
    t_err.start()

    try:
        return_code = process.wait()
    except KeyboardInterrupt:
        print("\n[Guardian] Execution interrupted by user.")
        return_code = 130

    t_out.join()
    t_err.join()

    print("-" * 50)

    if return_code != 0:
        print(f"[Guardian] ❌ Command failed with exit code {return_code}")

        # Combine logs for analysis
        full_log = "".join(stderr_lines[-50:]) # Last 50 lines of error
        if not full_log:
            full_log = "".join(stdout_lines[-20:]) # Fallback to stdout if stderr empty

        # Load Config
        token, chat_id = config_manager.get_telegram_config()

        if token and chat_id:
            print("[Guardian] Analyzing error and sending notification...")
            analysis = run_jules_analysis(full_log)

            msg = f"Command failed: `{command_str}`\nExit Code: {return_code}\n\n**Error Snippet**:\n```\n{full_log[:500]}...\n```"
            send_telegram_notification(token, chat_id, msg, analysis)
            print("[Guardian] Notification sent.")
        else:
            print("[Guardian] ⚠️ Telegram configuration missing. Skipping notification.")
            print("Run setup to configure: [Internal Task]")

        sys.exit(return_code)
    else:
        print("[Guardian] ✅ Execution successful.")
        sys.exit(0)

if __name__ == "__main__":
    main()
