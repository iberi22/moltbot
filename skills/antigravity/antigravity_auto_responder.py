import time
import subprocess
import win32gui
import win32con
from windows_notification_handler import WindowsNotificationHandler
import threading

class AntigravityAutoResponder:
    """
    Sistema para responder automáticamente a las solicitudes del IDE Antigravity
    """
    
    def __init__(self):
        self.handler = WindowsNotificationHandler()
        self.antigravity_process_ids = []
        self.is_active = False
        self.response_callbacks = {
            'continue': self.handle_continue_request,
            'next': self.handle_next_request,
            'ok': self.handle_ok_request,
            'accept': self.handle_accept_request
        }
    
    def find_antigravity_instances(self):
        """Encuentra instancias del IDE Antigravity"""
        try:
            # Usar PowerShell para encontrar procesos de Antigravity
            result = subprocess.run([
                'powershell', '-Command', 
                'Get-Process | Where-Object {$_.ProcessName -like "*antigravity*"} | Select-Object Id, ProcessName'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                # Saltar encabezados
                processes = []
                for i, line in enumerate(lines):
                    # Buscar líneas que contengan información de proceso (saltar encabezados)
                    if i > 0 and line.strip() and '---' not in line and 'Id' not in line and 'ProcessName' not in line:
                        # Dividir por espacios, pero ser más cuidadoso con el parsing
                        parts = line.split()
                        if len(parts) >= 2:
                            try:
                                # Buscar el PID (número) en las partes
                                for part in parts:
                                    if part.isdigit():
                                        pid = int(part)
                                        processes.append(pid)
                                        break
                            except ValueError:
                                continue
                return processes
            return []
        except Exception as e:
            print(f"Error buscando instancias de Antigravity: {e}")
            return []
    
    def handle_continue_request(self, dialog_info):
        """Maneja solicitudes de continuar"""
        print(f"Manejando solicitud de continuar: {dialog_info['title']}")
        self.handler.click_button_in_dialog(dialog_info['hwnd'])
    
    def handle_next_request(self, dialog_info):
        """Maneja solicitudes de siguiente"""
        print(f"Manejando solicitud de siguiente: {dialog_info['title']}")
        self.handler.click_button_in_dialog(dialog_info['hwnd'], "Next")
    
    def handle_ok_request(self, dialog_info):
        """Maneja solicitudes de OK"""
        print(f"Manejando solicitud de OK: {dialog_info['title']}")
        self.handler.click_button_in_dialog(dialog_info['hwnd'], "OK")
    
    def handle_accept_request(self, dialog_info):
        """Maneja solicitudes de aceptar"""
        print(f"Manejando solicitud de aceptar: {dialog_info['title']}")
        self.handler.click_button_in_dialog(dialog_info['hwnd'], "Aceptar")
    
    def smart_dialog_handler(self, dialog_info):
        """Manejador inteligente de diálogos"""
        title = dialog_info['title'].lower()
        
        # Determinar el tipo de diálogo basado en el título
        if any(word in title for word in ['continue', 'continuar', 'proceed', 'proceder']):
            self.handle_continue_request(dialog_info)
        elif any(word in title for word in ['next', 'siguiente', 'siguiente paso']):
            self.handle_next_request(dialog_info)
        elif any(word in title for word in ['ok', 'aceptar', 'accept', 'okay']):
            self.handle_ok_request(dialog_info)
        elif any(word in title for word in ['accept', 'confirm', 'confirmar']):
            self.handle_accept_request(dialog_info)
        else:
            # Si no es un diálogo estándar, intentar encontrar y hacer clic en un botón apropiado
            self.handler.click_button_in_dialog(dialog_info['hwnd'])
    
    def monitor_antigravity_interactions(self):
        """Monitorea interacciones con Antigravity"""
        print("Iniciando monitor de interacciones con Antigravity...")
        
        while self.is_active:
            try:
                # Buscar ventanas de diálogo de Antigravity
                dialog_windows = self.handler.find_dialog_windows()
                
                for dialog in dialog_windows:
                    # Verificar si el diálogo está relacionado con Antigravity
                    parent_hwnd = dialog['parent_hwnd']
                    if parent_hwnd:
                        parent_title = win32gui.GetWindowText(parent_hwnd)
                        if 'antigravity' in parent_title.lower():
                            print(f"Diálogo de Antigravity detectado: {dialog['title']}")
                            self.smart_dialog_handler(dialog)
                
                time.sleep(0.5)  # Intervalo corto para respuesta rápida
                
            except Exception as e:
                print(f"Error en el monitor de interacciones: {e}")
                time.sleep(1)
    
    def start_monitoring(self):
        """Inicia el monitoreo de interacciones"""
        if self.is_active:
            print("El monitoreo ya está activo")
            return
        
        print("Iniciando sistema de respuesta automática para Antigravity...")
        
        # Encontrar instancias de Antigravity
        self.antigravity_process_ids = self.find_antigravity_instances()
        print(f"Instancias de Antigravity encontradas: {len(self.antigravity_process_ids)}")
        
        self.is_active = True
        
        # Iniciar monitoreo en un hilo separado
        monitor_thread = threading.Thread(target=self.monitor_antigravity_interactions)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        print("Sistema de respuesta automática iniciado")
        return monitor_thread
    
    def stop_monitoring(self):
        """Detiene el monitoreo"""
        self.is_active = False
        print("Sistema de respuesta automática detenido")

def init_auto_responder():
    """Inicializa y devuelve una instancia del auto-responder"""
    return AntigravityAutoResponder()

# Ejemplo de uso
if __name__ == "__main__":
    responder = init_auto_responder()
    
    try:
        monitor_thread = responder.start_monitoring()
        print("Sistema activo. Presiona Ctrl+C para detener.")
        monitor_thread.join()  # Esperar indefinidamente
    except KeyboardInterrupt:
        print("\nDeteniendo sistema...")
        responder.stop_monitoring()