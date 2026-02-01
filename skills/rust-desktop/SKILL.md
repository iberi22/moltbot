---
name: rust-desktop
description: High-performance desktop automation using Rust.
metadata: {"openclaw":{"emoji":"🦀","requires":{"anyBins":["C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe"]}}}
---

# Rust Desktop Automation

A high-performance implementation of desktop controls using native Windows API.

## Commands

### Window Management

#### List Windows
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe window --action list
```
Returns a JSON list of all visible windows.

#### Find Window
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe window --action find --name "titlestring"
```
Returns details of windows matching the name.

#### Focus Window
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe window --action focus --name "titlestring"
```
Forces the window to the foreground.

#### Move Window
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe window --action move --name "titlestring" --x 0 --y 0
```
Moves the window to coordinates.

#### Resize Window
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe window --action resize --name "titlestring" --width 800 --height 600
```

### Input Control (Enigo)

#### Mouse Move
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe mouse --action move --x 100 --y 100
```

#### Mouse Click
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe mouse --action click --button left
```

#### Type Text
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe keyboard --action type --text "Hello World"
```

#### Press Key
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe keyboard --action press --key "enter"
```
Supported: enter, tab, space.

### Process Management

#### List Processes
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe proc --action list
```

#### Kill Process
```bash
C:/Users/belal/clawd/skills/rust-desktop/rust-desktop.exe proc --action kill --name "calculator"
```
Or use `--pid 1234`.
