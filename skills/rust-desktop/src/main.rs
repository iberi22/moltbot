use clap::{Parser, Subcommand};
use serde::Serialize;
use std::{thread, time};

#[cfg(windows)]
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, RECT};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowRect, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible, MoveWindow,
    SetForegroundWindow, ShowWindow, SW_MAXIMIZE, SW_MINIMIZE, SW_RESTORE,
};

#[cfg(target_os = "windows")]
use enigo::{Enigo, Key, Keyboard, Mouse, Settings, Direction, Button};
#[cfg(target_os = "windows")]
use sysinfo::{Pid, System, ProcessesToUpdate}; // Removed ProcessExt, SystemExt

#[derive(Parser)]
#[command(name = "rust-desktop")]
#[command(about = "High performance desktop automation tool", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Window management commands
    Window {
        #[arg(long)]
        action: String,
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        x: Option<i32>,
        #[arg(long)]
        y: Option<i32>,
        #[arg(long)]
        width: Option<i32>,
        #[arg(long)]
        height: Option<i32>,
    },
    /// Mouse control
    Mouse {
        #[arg(long)]
        action: String,
        #[arg(long)]
        x: Option<i32>,
        #[arg(long)]
        y: Option<i32>,
        #[arg(long)]
        button: Option<String>, // left, right, middle
    },
    /// Keyboard control
    Keyboard {
        #[arg(long)]
        action: String, // type, press
        #[arg(long)]
        text: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },
    /// Process management
    Proc {
        #[arg(long)]
        action: String, // list, kill
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        pid: Option<u32>,
    },
}

#[derive(Serialize)]
struct WindowInfo {
    handle: usize,
    title: String,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

#[derive(Serialize)]
struct ProcessInfo {
    pid: u32,
    name: String,
    memory: u64,
}

#[derive(Serialize)]
struct CommandResult {
    status: String,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

#[cfg(windows)]
fn get_window_title(hwnd: HWND) -> String {
    unsafe {
        let len = GetWindowTextLengthW(hwnd);
        if len == 0 {
            return String::new();
        }
        let mut buffer = vec![0u16; (len + 1) as usize];
        GetWindowTextW(hwnd, &mut buffer);
        String::from_utf16_lossy(&buffer[..len as usize])
    }
}

#[cfg(windows)]
extern "system" fn enum_window_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
    unsafe {
        if IsWindowVisible(hwnd).as_bool() {
            let title = get_window_title(hwnd);
            if !title.is_empty() {
                let list = &mut *(lparam.0 as *mut Vec<WindowInfo>);
                let mut rect = RECT::default();
                GetWindowRect(hwnd, &mut rect);

                list.push(WindowInfo {
                    handle: hwnd.0 as usize,
                    title,
                    x: rect.left,
                    y: rect.top,
                    width: rect.right - rect.left,
                    height: rect.bottom - rect.top,
                });
            }
        }
        BOOL(1)
    }
}

#[cfg(windows)]
fn list_windows() -> Vec<WindowInfo> {
    let mut windows = Vec::new();
    unsafe {
        EnumWindows(Some(enum_window_proc), LPARAM(&mut windows as *mut _ as isize));
    }
    windows
}

fn main() {
    let cli = Cli::parse();

    #[cfg(target_os = "windows")]
    match &cli.command {
        Commands::Window { action, name, x, y, width, height } => {
            handle_window(action, name.as_deref(), *x, *y, *width, *height);
        }
        Commands::Mouse { action, x, y, button } => {
            handle_mouse(action, *x, *y, button.as_deref());
        }
        Commands::Keyboard { action, text, key } => {
            handle_keyboard(action, text.as_deref(), key.as_deref());
        }
        Commands::Proc { action, name, pid } => {
            handle_proc(action, name.as_deref(), *pid);
        }
    }

    #[cfg(not(target_os = "windows"))]
    println!("{{\"error\": \"Only Windows is supported\"}}");
}

#[cfg(target_os = "windows")]
fn handle_mouse(action: &str, x: Option<i32>, y: Option<i32>, button: Option<&str>) {
    // Enigo 0.2+ usage
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    if action == "move" {
        if let (Some(tx), Some(ty)) = (x, y) {
             let _ = enigo.move_mouse(tx, ty, enigo::Coordinate::Abs);
             print_success("moved", None);
        } else {
             print_error("x and y required");
        }
        return;
    }

    if action == "click" {
        let btn = match button.unwrap_or("left") {
            "right" => Button::Right,
            "middle" => Button::Middle,
            "scroll_up" => Button::ScrollUp,
            "scroll_down" => Button::ScrollDown,
            _ => Button::Left,
        };
        let _ = enigo.button(btn, Direction::Click);
        print_success("clicked", None);
        return;
    }

    // Fallback
    print_error("unknown mouse action");
}

#[cfg(target_os = "windows")]
fn handle_keyboard(action: &str, text: Option<&str>, key: Option<&str>) {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    if action == "type" {
        if let Some(txt) = text {
            let _ = enigo.text(txt);
            print_success("typed", None);
        } else {
            print_error("text required");
        }
        return;
    }

    if action == "press" {
        if let Some(k) = key {
             let key_code = match k.to_lowercase().as_str() {
                "enter" => Key::Return,
                "tab" => Key::Tab,
                "space" => Key::Space,
                "backspace" => Key::Backspace,
                "escape" => Key::Escape,
                _ => Key::Return // Default/Fallback
             };
             let _ = enigo.key(key_code, Direction::Click);
             print_success("pressed", None);
        } else {
             print_error("key required");
        }
        return;
    }

     print_error("unknown keyboard action");
}

#[cfg(target_os = "windows")]
fn handle_proc(action: &str, name: Option<&str>, pid_arg: Option<u32>) {
    // Sysinfo 0.32+ usage
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    if action == "list" {
        let mut list = Vec::new();
        for (pid, process) in sys.processes() {
            list.push(ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(), // OsStr to String
                memory: process.memory(),
            });
        }
        // Limit output size roughly
        list.truncate(100);
        println!("{}", serde_json::to_string_pretty(&CommandResult {
            status: "success".to_string(),
            data: Some(serde_json::to_value(list).unwrap()),
            error: None
        }).unwrap());
        return;
    }

    if action == "kill" {
        if let Some(target_pid) = pid_arg {
             let pid = Pid::from_u32(target_pid);
             if let Some(p) = sys.process(pid) {
                 p.kill(); // 0.32 kill() usually takes no args or signal? Check if compiles.
                 print_success("killed", None);
             } else {
                 print_error("pid not found");
             }
             return;
        }

        if let Some(target_name) = name {
            let mut killed = 0;
            for (_pid, process) in sys.processes() {
                 if process.name().to_string_lossy().to_lowercase().contains(&target_name.to_lowercase()) {
                      process.kill();
                      killed += 1;
                 }
            }
             print_success("killed", Some(serde_json::json!({"count": killed})));
             return;
        }
        print_error("pid or name required");
        return;
    }

    print_error("unknown proc action");
}


fn print_success(status: &str, data: Option<serde_json::Value>) {
    let result = CommandResult {
        status: status.to_string(),
        data,
        error: None,
    };
    println!("{}", serde_json::to_string_pretty(&result).unwrap());
}

fn print_error(msg: &str) {
    let result = CommandResult {
        status: "error".to_string(),
        data: None,
        error: Some(msg.to_string()),
    };
    println!("{}", serde_json::to_string_pretty(&result).unwrap());
}


#[cfg(windows)]
fn handle_window(action: &str, name: Option<&str>, x: Option<i32>, y: Option<i32>, width: Option<i32>, height: Option<i32>) {
    let windows = list_windows();

    if action == "list" {
         print_success("success", Some(serde_json::to_value(windows).unwrap()));
        return;
    }

    let target_name = name.unwrap_or("").to_lowercase();
    let matches: Vec<&WindowInfo> = windows.iter().filter(|w| w.title.to_lowercase().contains(&target_name)).collect();

    if action == "find" {
         print_success("success", Some(serde_json::to_value(matches).unwrap()));
        return;
    }

    if matches.is_empty() {
        print_error(&format!("No window found matching '{}'", target_name));
        return;
    }

    let target = matches[0];
    let hwnd = HWND(target.handle as isize);

    let status = match action {
        "move" => {
            if let (Some(new_x), Some(new_y)) = (x, y) {
                unsafe { MoveWindow(hwnd, new_x, new_y, target.width, target.height, true); }
                "moved"
            } else {
                "error: missing x/y"
            }
        },
        "focus" => {
            unsafe {
                ShowWindow(hwnd, SW_RESTORE);
                SetForegroundWindow(hwnd);
            }
            "focused"
        },
         "maximize" => {
            unsafe { ShowWindow(hwnd, SW_MAXIMIZE); }
            "maximized"
        },
        "minimize" => {
             unsafe { ShowWindow(hwnd, SW_MINIMIZE); }
             "minimized"
        },
        _ => "unknown action"
    };

     if status.starts_with("error") {
          print_error(status);
     } else {
          print_success(status, Some(serde_json::json!({ "handle": target.handle, "title": target.title })));
     }
}
