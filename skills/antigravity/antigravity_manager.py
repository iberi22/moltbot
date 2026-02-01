import os
import sys
import time
import subprocess
import threading
from pathlib import Path

# Añadir el directorio actual al path para importar los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from windows_notification_handler import WindowsNotificationHandler
from antigravity_auto_responder import AntigravityAutoResponder
from antigravity_hotkeys import AntigravityHotkeyManager
from safe_control_manager import SafeAntigravityController

class AntigravityManager:
    """
    Administrador completo para el IDE Antigravity que incluye:
    - Detección de instancias
    - Manejo de notificaciones
    - Apertura de proyectos
    - Monitoreo automático
    - Teclas de acceso rápido
    - Control seguro del mouse y teclado
    """
    
    def __init__(self):
        self.handler = WindowsNotificationHandler()
        self.auto_responder = AntigravityAutoResponder()
        self.hotkey_manager = AntigravityHotkeyManager()
        self.safe_controller = SafeAntigravityController()
        self.active_projects = []
        self.is_monitoring = False
        self.hotkey_monitoring = False
        self.safe_control_enabled = True  # Habilitado por defecto
        self.monitor_thread = None
        self.hotkey_thread = None
        self.safe_control_thread = None
    
    def get_antigravity_processes(self):
        """Obtiene procesos de Antigravity usando PowerShell"""
        try:
            result = subprocess.run([
                'powershell', '-ExecutionPolicy', 'Bypass', '-Command', 
                'Get-WmiObject -Class Win32_Process -Filter "Name=\'Antigravity.exe\'" | Select-Object ProcessId, Name'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                processes = []
                for i, line in enumerate(lines):
                    # Saltar encabezados
                    if i == 0 or '----' in line:
                        continue
                    if line.strip():
                        # Dividir la línea y extraer PID y nombre
                        parts = line.split()
                        if len(parts) >= 2:
                            try:
                                pid = int(parts[0])
                                name = parts[1]
                                processes.append({'pid': pid, 'name': name})
                            except (ValueError, IndexError):
                                continue
                        elif len(parts) == 1 and parts[0].isdigit():
                            # Caso donde solo hay un número (PID)
                            pid = int(parts[0])
                            processes.append({'pid': pid, 'name': 'Antigravity.exe'})
                return processes
            return []
        except Exception as e:
            print(f"Error obteniendo procesos de Antigravity: {e}")
            # Alternativa: usar tasklist
            try:
                result = subprocess.run([
                    'tasklist', '/FI', 'IMAGENAME eq Antigravity.exe', '/FO', 'CSV'
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    processes = []
                    for i, line in enumerate(lines):
                        if i == 0:  # Saltar encabezado
                            continue
                        if '"Antigravity.exe"' in line:
                            # Extraer PID de la línea CSV
                            import csv
                            from io import StringIO
                            csv_reader = csv.reader(StringIO(line))
                            row = next(csv_reader, None)
                            if row and len(row) >= 2:
                                try:
                                    pid = int(row[1])  # PID está en la segunda columna
                                    processes.append({'pid': pid, 'name': row[0]})
                                except (ValueError, IndexError):
                                    continue
                    return processes
            except Exception as e2:
                print(f"Error alternativo obteniendo procesos de Antigravity: {e2}")
            
            return []
    
    def open_project(self, project_path):
        """Abre un proyecto en Antigravity"""
        project_path = Path(project_path).resolve()
        
        if not project_path.exists():
            print(f"Error: El proyecto no existe: {project_path}")
            return False
        
        print(f"Intentando abrir proyecto: {project_path}")
        
        # Primero verificar si hay instancias de Antigravity disponibles
        processes = self.get_antigravity_processes()
        
        if processes:
            print(f"Usando instancia existente de Antigravity (PID: {processes[0]['pid']})")
            # Aquí iría la lógica específica para enviar el comando al proceso existente
            # Por ahora, simplemente registramos que queremos abrir este proyecto
            self.active_projects.append(str(project_path))
            return True
        else:
            print("No se encontraron instancias de Antigravity, intentando abrir una nueva...")
            try:
                # Intentar abrir una nueva instancia con el proyecto
                subprocess.Popen(['antigravity', str(project_path)])
                self.active_projects.append(str(project_path))
                return True
            except FileNotFoundError:
                print("Error: No se encontró el comando 'antigravity'. ¿Está instalado y en el PATH?")
                return False
    
    def start_auto_responder(self):
        """Inicia el sistema de respuesta automática"""
        if not self.is_monitoring:
            print("Iniciando sistema de respuesta automática...")
            self.monitor_thread = self.auto_responder.start_monitoring()
            self.is_monitoring = True
            print("Sistema de respuesta automática iniciado")
        else:
            print("El sistema de respuesta automática ya está activo")
    
    def stop_auto_responder(self):
        """Detiene el sistema de respuesta automática"""
        if self.is_monitoring:
            print("Deteniendo sistema de respuesta automática...")
            self.auto_responder.stop_monitoring()
            self.is_monitoring = False
            print("Sistema de respuesta automática detenido")
    
    def bring_antigravity_to_front(self):
        """Trae la ventana de Antigravity al frente"""
        antigravity_windows = self.handler.find_antigravity_windows()
        
        if antigravity_windows:
            # Traer la primera ventana encontrada al frente
            self.handler.bring_window_to_front(antigravity_windows[0]['hwnd'])
            print(f"Ventana de Antigravity traída al frente: {antigravity_windows[0]['title']}")
            return True
        else:
            print("No se encontraron ventanas de Antigravity")
            return False
    
    def get_active_projects(self):
        """Devuelve la lista de proyectos activos"""
        return self.active_projects.copy()
    
    def has_pending_dialogs(self):
        """Verifica si hay diálogos pendientes"""
        dialogs = self.handler.find_dialog_windows()
        antigravity_dialogs = []
        
        for dialog in dialogs:
            # Verificar si está relacionado con Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            # Verificar si el diálogo o su padre está relacionado con Antigravity
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                antigravity_dialogs.append(dialog)
        
        return antigravity_dialogs
    
    def force_handle_pending_dialogs(self):
        """Fuerza el manejo de diálogos pendientes"""
        pending_dialogs = self.has_pending_dialogs()
        
        if pending_dialogs:
            print(f"Encontrados {len(pending_dialogs)} diálogos pendientes de Antigravity:")
            for dialog in pending_dialogs:
                print(f"  - {dialog['title']}")
                self.auto_responder.smart_dialog_handler(dialog)
            return len(pending_dialogs)
        else:
            print("No se encontraron diálogos pendientes de Antigravity")
            return 0
    
    def continuous_monitor_with_handling(self):
        """Monitoreo continuo con manejo automático de diálogos"""
        print("Iniciando monitoreo continuo con manejo automático...")
        
        try:
            while True:
                # Capturar eventos de notificación
                notification_handled = self.capture_notification_event()
                
                # Verificar y manejar diálogos pendientes
                handled_count = self.force_handle_pending_dialogs()
                
                if notification_handled:
                    print("Notificación de Antigravity capturada y manejada")
                
                if handled_count > 0:
                    print(f"Manejados {handled_count} diálogos")
                
                # Breve pausa para no sobrecargar el sistema
                time.sleep(0.5)
                
        except KeyboardInterrupt:
            print("\nMonitoreo continuo interrumpido por el usuario")
    
    def start_hotkey_monitoring(self):
        """Inicia el monitoreo de teclas de acceso rápido"""
        if not self.hotkey_monitoring:
            print("Iniciando sistema de teclas de acceso rápido...")
            self.hotkey_manager.start_listening()
            self.hotkey_monitoring = True
            print("Sistema de teclas de acceso rápido iniciado")
        else:
            print("El sistema de teclas de acceso rápido ya está activo")
    
    def stop_hotkey_monitoring(self):
        """Detiene el monitoreo de teclas de acceso rápido"""
        if self.hotkey_monitoring:
            print("Deteniendo sistema de teclas de acceso rápido...")
            self.hotkey_manager.stop_listening()
            self.hotkey_monitoring = False
            print("Sistema de teclas de acceso rápido detenido")
    
    def run_command_in_antigravity(self, command):
        """Envía un comando al IDE Antigravity (si es posible)"""
        # Esta función dependería de la API específica de Antigravity
        # Por ahora, solo registramos el comando
        print(f"Comando enviado a Antigravity: {command}")
        
        # Verificar si hay diálogos pendientes después del comando
        time.sleep(1)  # Pequeña espera para que se abran posibles diálogos
        self.force_handle_pending_dialogs()
    
    def quick_launch_app(self, app_name, path=None, args=None):
        """
        Función para abrir rápidamente aplicaciones
        :param app_name: Nombre del ejecutable (por ejemplo, 'notepad', 'antigravity', etc.)
        :param path: Ruta donde se ejecutará la aplicación (opcional)
        :param args: Argumentos adicionales para la aplicación (opcional)
        """
        import subprocess
        import os
        
        try:
            cmd = [app_name]
            if args:
                if isinstance(args, str):
                    cmd.append(args)
                else:
                    cmd.extend(args)
            
            if path:
                original_cwd = os.getcwd()
                os.chdir(path)
            
            print(f"Ejecutando: {' '.join(cmd)}")
            if path:
                print(f"En la ruta: {path}")
            
            process = subprocess.Popen(cmd)
            
            if path:
                os.chdir(original_cwd)
            
            print(f"Aplicación '{app_name}' lanzada con PID: {process.pid}")
            return process.pid
            
        except FileNotFoundError:
            print(f"Error: La aplicación '{app_name}' no se encontró en el sistema")
            return None
        except Exception as e:
            print(f"Error al lanzar la aplicación '{app_name}': {e}")
            return None
    
    def open_antigravity_project(self, project_path):
        """Abre un proyecto específico en Antigravity"""
        print(f"Abriendo proyecto en Antigravity: {project_path}")
        return self.quick_launch_app('antigravity', path=project_path, args='.')
    
    def enable_safe_control(self):
        """Habilita el control seguro (con advertencias al usuario)"""
        self.safe_control_enabled = True
        print("Control seguro habilitado - Se mostrarán advertencias antes de tomar control")
    
    def disable_safe_control(self):
        """Deshabilita el control seguro (sin advertencias)"""
        self.safe_control_enabled = False
        print("Control seguro deshabilitado - No se mostrarán advertencias")
    
    def safe_perform_action(self, action_name, *args, **kwargs):
        """Realiza una acción de forma segura con advertencias al usuario"""
        if self.safe_control_enabled:
            # Verificar si el controlador tiene soporte visual
            if hasattr(self.safe_controller, 'safe_perform_antigravity_action_with_visual'):
                return self.safe_controller.safe_perform_antigravity_action_with_visual(action_name, *args, **kwargs)
            else:
                return self.safe_controller.safe_perform_antigravity_action(action_name, *args, **kwargs)
        else:
            # Si el control seguro está deshabilitado, ejecutar directamente
            print(f"Ejecutando acción directamente (control seguro deshabilitado): {action_name}")
            # Aquí iría la lógica directa para cada acción
            if action_name == "click_continue":
                print("Simulando clic en botón 'Continuar' de Antigravity")
                return True
            elif action_name == "click_next":
                print("Simulando clic en botón 'Siguiente' de Antigravity")
                return True
            elif action_name == "click_accept":
                print("Simulando clic en botón 'Aceptar' de Antigravity")
                return True
            elif action_name == "maximize_window":
                print("Simulando maximización de ventana de Antigravity")
                return True
            else:
                print(f"Acción desconocida: {action_name}")
                return False
    
    def capture_notification_event(self):
        """Captura eventos de notificación específicos"""
        return self.hotkey_manager.capture_notification_event()

def init_antigravity_manager():
    """Inicializa y devuelve una instancia del manager"""
    return AntigravityManager()

# Función principal para interactuar con el IDE Antigravity
def main():
    manager = init_antigravity_manager()
    
    print("Administrador de Antigravity iniciado")
    print("Opciones disponibles:")
    print("1. open_project <ruta_proyecto>")
    print("2. start_auto_responder")
    print("3. stop_auto_responder")
    print("4. start_hotkeys")
    print("5. stop_hotkeys")
    print("6. enable_safe_control")
    print("7. disable_safe_control")
    print("8. safe_action <accion>")
    print("9. quick_launch <app_name> [ruta] [args]")
    print("10. open_antigravity_project <ruta_proyecto>")
    print("11. bring_to_front")
    print("12. check_dialogs")
    print("13. continuous_monitor")
    print("14. run_command <comando>")
    print("15. quit")
    
    while True:
        try:
            command = input("\n> ").strip().split()
            
            if not command:
                continue
            
            cmd = command[0].lower()
            
            if cmd == 'quit' or cmd == 'exit':
                manager.stop_auto_responder()
                manager.stop_hotkey_monitoring()
                break
            elif cmd == 'open_project' and len(command) > 1:
                project_path = ' '.join(command[1:])
                manager.open_project(project_path)
            elif cmd == 'start_auto_responder':
                manager.start_auto_responder()
            elif cmd == 'stop_auto_responder':
                manager.stop_auto_responder()
            elif cmd == 'start_hotkeys':
                manager.start_hotkey_monitoring()
            elif cmd == 'stop_hotkeys':
                manager.stop_hotkey_monitoring()
            elif cmd == 'enable_safe_control':
                manager.enable_safe_control()
            elif cmd == 'disable_safe_control':
                manager.disable_safe_control()
            elif cmd == 'safe_action' and len(command) > 1:
                action = command[1]
                manager.safe_perform_action(action)
            elif cmd == 'visual_test':
                print("Probando sistema de notificación visual...")
                manager.safe_perform_action('click_continue')  # Esto activará el sistema visual
            elif cmd == 'quick_launch':
                if len(command) > 1:
                    app_name = command[1]
                    path = command[2] if len(command) > 2 else None
                    args = command[3:] if len(command) > 3 else None
                    manager.quick_launch_app(app_name, path, args)
                else:
                    print("Uso: quick_launch <app_name> [ruta] [args]")
            elif cmd == 'open_antigravity_project' and len(command) > 1:
                project_path = ' '.join(command[1:])
                manager.open_antigravity_project(project_path)
            elif cmd == 'bring_to_front':
                manager.bring_antigravity_to_front()
            elif cmd == 'check_dialogs':
                dialogs = manager.has_pending_dialogs()
                if dialogs:
                    print(f"Diálogos pendientes encontrados ({len(dialogs)}):")
                    for dialog in dialogs:
                        print(f"  - {dialog['title']}")
                else:
                    print("No hay diálogos pendientes")
            elif cmd == 'continuous_monitor':
                print("Iniciando monitoreo continuo (presiona Ctrl+C para detener)")
                manager.continuous_monitor_with_handling()
            elif cmd == 'run_command' and len(command) > 1:
                command_str = ' '.join(command[1:])
                manager.run_command_in_antigravity(command_str)
            else:
                print(f"Comando desconocido: {cmd}")
                
        except KeyboardInterrupt:
            print("\nSaliendo...")
            manager.stop_auto_responder()
            manager.stop_hotkey_monitoring()
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()