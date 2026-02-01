---
name: desktop-automation
description: Control mouse and windows on the host machine.
metadata: {"openclaw":{"emoji":"🖱️","requires":{"anyBins":["python","python.exe"]}}}
---

# Desktop Automation

Control the mouse and manage application windows on the local machine.

## Commands

### Keyboard Control

#### Write Text
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" keyboard --action write --text "Hello world"
```

#### Press Keys
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" keyboard --action press --key "ctrl+c"
```
Supports combinations like `ctrl+v`, `alt+tab`.

### Mouse Control

#### Move Mouse
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" mouse --action move --x 100 --y 100
```
Optional: `--duration 1.0` (seconds to take for movement)

#### Click Mouse
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" mouse --action click --button left
```
Options:
- `--button`: left, right, middle (default: left)
- `--clicks`: Number of clicks (default: 1)
- `--x --y`: Coordinates to click at (optional, defaults to current position)

#### Scroll
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" mouse --action scroll --amount 10
```
Positive for up, negative for down.

### Window Control

#### Find Window
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" window --action find --name "Notepad"
```
Returns list of matching window titles and handles.

#### Move Window
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" window --action move --name "Notepad" --x 500 --y 500
```
Moves the first matching window to the specified coordinates.

#### Resize Window
```bash
python "e:/scripts-python/clawdbot-new/skills/desktop-automation/scripts/desktop_control.py" window --action resize --name "Notepad" --width 800 --height 600
```
Resizes the first matching window.
