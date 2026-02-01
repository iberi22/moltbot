---
name: system-guardian
description: Automated error detection, notification, and recovery system. Wraps commands to monitor execution and alert via Telegram.
metadata:
  openclaw:
    emoji: "🛡️"
    requires:
      anyBins: ["python", "python.exe"]
---

# System Guardian

A robust wrapper for system commands that detects failures, notifies via Telegram, and uses AI (Jules) to analyze errors.

## Setup

1.  **Dependencies**:
    ```bash
    pip install requests
    ```
2.  **Configuration**:
    The first time you run the tool, it may prompt you for configuration, or you can manually create `config.json` in this directory:
    ```json
    {
      "telegram_bot_token": "YOUR_BOT_TOKEN",
      "telegram_chat_id": "YOUR_CHAT_ID"
    }
    ```

## Usage

Wrap any command you want to monitor with `guard.py`:

```bash
python skills/system-guardian/guard.py <your_command> <args>
```

**Example:**

```bash
python skills/system-guardian/guard.py python skills/gui_control/send_whatsapp_message.py
```

## Features

-   **Telegram Notifications**: Instant alerts when a command fails (non-zero exit code).
-   **Smart Error Detection**: auto-detects `OAuth` errors, `ModuleNotFoundError`, etc.
-   **AI Analysis**: Uses the `jules` tool to provide a professional breakdown of the error.
-   **Auto-Recovery**: Suggests specific commands to fix detected issues.
