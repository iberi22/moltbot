import win32gui
import win32con
import win32api
import time
import threading
from typing import Optional, Callable

class WindowsNotificationHandler:
    """
    Handler para detectar y gestionar notificaciones de Windows y ventanas emergentes
    específicamente para interactuar con el IDE Antigravity
    """
    
    def __init__(self):
        self.notification_callbacks = {}
        self.running = False
        self.monitor_thread = None
        
    def find_antigravity_windows(self):
        """Encuentra todas las ventanas del IDE Antigravity"""
        antigravity_windows = []
        
        def enum_windows_callback(hwnd, windows):
            if win32gui.IsWindowVisible(hwnd):
                window_title = win32gui.GetWindowText(hwnd)
                class_name = win32gui.GetClassName(hwnd)
                
                # Buscar ventanas que parezcan ser del IDE Antigravity
                if "antigravity" in window_title.lower() or "antigravity" in class_name.lower():
                    windows.append({
                        'hwnd': hwnd,
                        'title': window_title,
                        'class': class_name
                    })
            return True
            
        win32gui.EnumWindows(enum_windows_callback, antigravity_windows)
        return antigravity_windows
    
    def find_dialog_windows(self):
        """Encuentra ventanas de diálogo que podrían requerir atención"""
        dialog_windows = []
        
        def enum_windows_callback(hwnd, windows):
            if win32gui.IsWindowVisible(hwnd):
                window_title = win32gui.GetWindowText(hwnd)
                class_name = win32gui.GetClassName(hwnd)
                
                # Tipos comunes de ventanas de diálogo
                if (class_name in ["#32770", "Dialog", "MessageBox"] or  # Ventanas de diálogo estándar
                    any(keyword in window_title.lower() for keyword in 
                        ["alert", "warning", "error", "confirm", "continue", 
                         "next", "ok", "accept", "attention", "requiere"])):
                    
                    parent_hwnd = win32gui.GetParent(hwnd)
                    parent_title = win32gui.GetWindowText(parent_hwnd) if parent_hwnd else ""
                    
                    # Verificar si el diálogo está asociado con Antigravity
                    if ("antigravity" in parent_title.lower() or 
                        any("antigravity" in win32gui.GetWindowText(h).lower() 
                            for h in self.get_all_window_handles())):
                        
                        windows.append({
                            'hwnd': hwnd,
                            'title': window_title,
                            'class': class_name,
                            'parent_hwnd': parent_hwnd,
                            'parent_title': parent_title
                        })
            return True
            
        win32gui.EnumWindows(enum_windows_callback, dialog_windows)
        return dialog_windows
    
    def get_all_window_handles(self):
        """Obtiene todos los handles de ventanas"""
        def enum_handler(hwnd, lst):
            lst.append(hwnd)
            return True
        handles = []
        win32gui.EnumWindows(enum_handler, handles)
        return handles
    
    def click_button_in_dialog(self, dialog_hwnd, button_text_or_id=None):
        """Hace clic en un botón específico en un diálogo"""
        try:
            # Buscar controles hijos (botones) en el diálogo
            child_windows = []
            
            def enum_child_proc(hwnd, child_windows):
                class_name = win32gui.GetClassName(hwnd)
                if class_name == "Button":
                    btn_text = win32gui.GetWindowText(hwnd)
                    child_windows.append({
                        'hwnd': hwnd,
                        'text': btn_text
                    })
                return True
                
            win32gui.EnumChildWindows(dialog_hwnd, enum_child_proc, child_windows)
            
            # Buscar el botón específico
            target_button = None
            if button_text_or_id:
                if isinstance(button_text_or_id, int):
                    # Si es un ID numérico
                    for btn in child_windows:
                        if win32api.GetDlgCtrlID(btn['hwnd']) == button_text_or_id:
                            target_button = btn
                            break
                else:
                    # Si es texto, buscar coincidencias
                    for btn in child_windows:
                        if button_text_or_id.lower() in btn['text'].lower():
                            target_button = btn
                            break
            
            # Si no se especificó botón, buscar uno común como "OK", "Siguiente", "Continuar"
            if not target_button:
                for btn in child_windows:
                    btn_text_lower = btn['text'].lower()
                    if any(word in btn_text_lower for word in ["ok", "yes", "next", "continue", "aceptar", "continuar", "siguiente", "sí"]):
                        target_button = btn
                        break
            
            # Hacer clic en el botón encontrado
            if target_button:
                print(f"Haciendo clic en el botón: {target_button['text']}")
                win32gui.PostMessage(target_button['hwnd'], win32con.BM_CLICK, 0, 0)
                return True
            else:
                print("No se encontró un botón apropiado para hacer clic")
                return False
                
        except Exception as e:
            print(f"Error al hacer clic en el botón: {e}")
            return False
    
    def bring_window_to_front(self, hwnd):
        """Trae una ventana al frente"""
        try:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(hwnd)
            return True
        except Exception as e:
            print(f"Error al traer la ventana al frente: {e}")
            return False
    
    def monitor_notifications_and_dialogs(self, callback: Optional[Callable] = None):
        """Monitorea continuamente las notificaciones y diálogos"""
        if self.running:
            print("El monitor ya está en ejecución")
            return
            
        self.running = True
        print("Iniciando monitor de notificaciones y diálogos...")
        
        while self.running:
            try:
                # Buscar ventanas de diálogo que requieran atención
                dialog_windows = self.find_dialog_windows()
                
                for dialog in dialog_windows:
                    print(f"Diálogo encontrado: {dialog['title']} (HWND: {dialog['hwnd']})")
                    
                    # Intentar manejar el diálogo
                    if self.click_button_in_dialog(dialog['hwnd']):
                        print(f"Diálogo manejado: {dialog['title']}")
                        
                        # Si se proporcionó un callback, llamarlo
                        if callback:
                            callback(dialog)
                
                time.sleep(1)  # Esperar 1 segundo antes de la próxima verificación
                
            except KeyboardInterrupt:
                print("Monitor interrumpido por el usuario")
                break
            except Exception as e:
                print(f"Error en el monitor: {e}")
                time.sleep(1)
    
    def start_monitoring(self, callback: Optional[Callable] = None):
        """Inicia el monitoreo en un hilo separado"""
        if self.running:
            print("El monitor ya está en ejecución")
            return
            
        self.monitor_thread = threading.Thread(
            target=self.monitor_notifications_and_dialogs,
            args=(callback,)
        )
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        print("Monitor de notificaciones iniciado en segundo plano")
    
    def stop_monitoring(self):
        """Detiene el monitoreo"""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        print("Monitor de notificaciones detenido")

# Función para inicializar y usar el handler
def init_notification_handler():
    """Inicializa y devuelve una instancia del handler"""
    return WindowsNotificationHandler()

if __name__ == "__main__":
    # Ejemplo de uso
    handler = init_notification_handler()
    
    def dialog_callback(dialog_info):
        print(f"Callback: Diálogo manejado - {dialog_info['title']}")
    
    try:
        print("Presiona Ctrl+C para detener el monitoreo")
        handler.monitor_notifications_and_dialogs(dialog_callback)
    except KeyboardInterrupt:
        print("\nDeteniendo monitor...")
        handler.stop_monitoring()