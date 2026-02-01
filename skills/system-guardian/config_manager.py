import json
import os
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / "config.json"

def load_config():
    """Load configuration from config.json"""
    if not CONFIG_FILE.exists():
        return None
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Guardian Config] Error loading config: {e}")
        return None

def save_config(token, chat_id):
    """Save configuration to config.json"""
    config = {
        "telegram_bot_token": token,
        "telegram_chat_id": chat_id
    }
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        print(f"[Guardian Config] Configuration saved to {CONFIG_FILE}")
        return True
    except Exception as e:
        print(f"[Guardian Config] Error saving config: {e}")
        return False

def get_telegram_config():
    """Get telegram credentials, ensuring they exist"""
    config = load_config()
    if config and config.get("telegram_bot_token") and config.get("telegram_chat_id"):
        return config["telegram_bot_token"], config["telegram_chat_id"]

    # If not found, we return None. The main script should handle prompting or warning.
    return None, None
