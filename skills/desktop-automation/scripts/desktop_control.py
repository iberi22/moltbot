import argparse
import sys
import json
import time

try:
    import pyautogui
    # Fail-safe to prevent mouse from going out of control (move to corner to abort)
    pyautogui.FAILSAFE = True
except ImportError:
    print(json.dumps({"error": "pyautogui not installed. Run pip install pyautogui"}))
    sys.exit(1)

try:
    import win32gui
    import win32con
except ImportError:
    print(json.dumps({"error": "pywin32 not installed. Run pip install pywin32"}))
    sys.exit(1)

def handle_mouse(args):
    if args.action == "move":
        if args.x is None or args.y is None:
            return {"error": "x and y coordinates required for move"}
        duration = args.duration if args.duration else 0.0
        pyautogui.moveTo(float(args.x), float(args.y), duration=float(duration))
        return {"status": "moved", "x": args.x, "y": args.y}

    elif args.action == "click":
        x, y = pyautogui.position()
        if args.x is not None and args.y is not None:
            x, y = float(args.x), float(args.y)

        pyautogui.click(x=x, y=y, button=args.button, clicks=int(args.clicks))
        return {"status": "clicked", "x": x, "y": y, "button": args.button}

    elif args.action == "scroll":
        if args.amount is None:
            return {"error": "amount required for scroll"}
        pyautogui.scroll(int(args.amount))
        return {"status": "scrolled", "amount": args.amount}

    return {"error": "unknown mouse action"}

def _window_enum_handler(hwnd, result_list):
    if win32gui.IsWindowVisible(hwnd):
        title = win32gui.GetWindowText(hwnd)
        if title:
            result_list.append((hwnd, title))

def handle_window(args):
    windows = []
    win32gui.EnumWindows(_window_enum_handler, windows)

    target_name = args.name.lower() if args.name else ""
    matched_windows = []

    for hwnd, title in windows:
        if target_name in title.lower():
            rect = win32gui.GetWindowRect(hwnd)
            matched_windows.append({
                "handle": hwnd,
                "title": title,
                "x": rect[0],
                "y": rect[1],
                "width": rect[2] - rect[0],
                "height": rect[3] - rect[1]
            })

    if args.action == "find":
        return {"matches": matched_windows}

    if not matched_windows:
        return {"error": f"No window found matching '{args.name}'"}

    # Operate on the first match
    first_match = matched_windows[0]
    hwnd = first_match["handle"]

    if args.action == "move":
        if args.x is None or args.y is None:
            return {"error": "x and y coordinates required for move"}

        # Keep current size
        win32gui.MoveWindow(hwnd, int(args.x), int(args.y), first_match["width"], first_match["height"], True)
        return {"status": "moved", "hwnd": hwnd, "title": first_match["title"]}

    elif args.action == "resize":
        if args.width is None or args.height is None:
            return {"error": "width and height required for resize"}

        # Keep current position
        win32gui.MoveWindow(hwnd, first_match["x"], first_match["y"], int(args.width), int(args.height), True)
        return {"status": "resized", "hwnd": hwnd, "title": first_match["title"]}

    elif args.action == "maximize":
        win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
        return {"status": "maximized", "hwnd": hwnd}

    elif args.action == "minimize":
        win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)
        return {"status": "minimized", "hwnd": hwnd}

    elif args.action == "restore":
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        return {"status": "restored", "hwnd": hwnd}

    return {"error": "unknown window action"}

def main():
    parser = argparse.ArgumentParser(description="Desktop Automation Script")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Mouse parser
    mouse_parser = subparsers.add_parser("mouse")
    mouse_parser.add_argument("--action", choices=["move", "click", "scroll"], required=True)
    mouse_parser.add_argument("--x", type=float)
    mouse_parser.add_argument("--y", type=float)
    mouse_parser.add_argument("--duration", type=float, default=0.0)
    mouse_parser.add_argument("--button", choices=["left", "middle", "right"], default="left")
    mouse_parser.add_argument("--clicks", type=int, default=1)
    mouse_parser.add_argument("--amount", type=int)

    # Window parser
    window_parser = subparsers.add_parser("window")
    window_parser.add_argument("--action", choices=["find", "move", "resize", "maximize", "minimize", "restore"], required=True)
    window_parser.add_argument("--name", type=str, help="Substring of window title")
    window_parser.add_argument("--x", type=int)
    window_parser.add_argument("--y", type=int)
    window_parser.add_argument("--width", type=int)
    window_parser.add_argument("--height", type=int)

    args = parser.parse_args()

    result = {}
    try:
        if args.command == "mouse":
            result = handle_mouse(args)
        elif args.command == "window":
            result = handle_window(args)
    except Exception as e:
        result = {"error": str(e)}

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
