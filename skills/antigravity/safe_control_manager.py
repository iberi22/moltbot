import time
import threading
import tkinter as tk
from tkinter import messagebox
import sys
import os

# Importar el sistema de notificación visual si está disponible
try:
    from .visual_notifier import SafeVisualControlManager
    VISUAL_NOTIFIER_AVAILABLE = True
except ImportError:
    try:
        from visual_notifier import SafeVisualControlManager
        VISUAL_NOTIFIER_AVAILABLE = True
    except ImportError:
        VISUAL_NOTIFIER_AVAILABLE = False

class SafeControlManager:
    """
    Sistema seguro de control del mouse y teclado para evitar conflictos
    cuando el sistema de IA toma control del dispositivo
    """
    
    def __init__(self):
        self.control_active = False
        self.control_thread = None
        self.warning_displayed = False
        self.user_permission = False
        self.root = None
        self.use_visual_notifier = VISUAL_NOTIFIER_AVAILABLE
        if self.use_visual_notifier:
            self.visual_controller = SafeVisualControlManager()
        
    def show_warning_dialog(self):
        """Muestra un diálogo de advertencia antes de tomar control"""
        root = tk.Tk()
        root.withdraw()  # Ocultar la ventana principal
        
        # Mostrar diálogo de advertencia
        result = messagebox.askyesno(
            "Advertencia de Control",
            "El sistema de IA va a tomar control temporal del mouse y teclado.\n\n"
            "Durante este tiempo, usted no podrá usar el mouse ni el teclado.\n\n"
            "¿Desea continuar?",
            icon='warning'
        )
        
        root.destroy()
        return result
    
    def show_control_notification(self):
        """Muestra una notificación cuando el sistema toma control"""
        root = tk.Tk()
        root.withdraw()
        
        messagebox.showinfo(
            "Control Activado",
            "El sistema de IA ha tomado control del mouse y teclado.\n\n"
            "Por favor, no intente usar el mouse o teclado durante esta operación.\n\n"
            "La operación terminará automáticamente.",
            icon='info'
        )
        
        root.destroy()
    
    def show_control_released(self):
        """Muestra una notificación cuando el sistema libera control"""
        root = tk.Tk()
        root.withdraw()
        
        messagebox.showinfo(
            "Control Liberado",
            "El sistema de IA ha liberado el control del mouse y teclado.\n\n"
            "Ya puede usar normalmente su dispositivo.",
            icon='info'
        )
        
        root.destroy()
    
    def request_user_permission(self):
        """Solicita permiso al usuario antes de tomar control"""
        if self.warning_displayed:
            return self.user_permission
        
        self.warning_displayed = True
        
        # Usar el notificador visual si está disponible
        if self.use_visual_notifier:
            permission = self.visual_controller.show_warning_and_request_permission()
            self.user_permission = permission
        else:
            # Usar diálogo estándar si no hay notificador visual
            self.user_permission = self.show_warning_dialog()
        
        return self.user_permission
    
    def activate_safe_control(self):
        """Activa el control seguro con advertencia al usuario"""
        print("Solicitando permiso para tomar control del dispositivo...")
        
        if not self.request_user_permission():
            print("Usuario negó permiso para tomar control del dispositivo")
            return False
        
        print("Usuario concedió permiso. Tomando control seguro...")
        self.show_control_notification()
        
        self.control_active = True
        return True
    
    def activate_safe_control_with_visual_feedback(self, action_func, *args, **kwargs):
        """Activa el control seguro con notificación visual"""
        if self.use_visual_notifier:
            print("Usando notificador visual para control seguro...")
            result = self.visual_controller.safe_control_with_visual_feedback(
                action_func, *args, **kwargs
            )
            self.control_active = result != False
            return result
        else:
            # Fallback al método estándar
            return self.activate_safe_control()
    
    def deactivate_safe_control(self):
        """Desactiva el control y notifica al usuario"""
        if self.control_active:
            print("Liberando control del dispositivo...")
            self.show_control_released()
            self.control_active = False
            self.warning_displayed = False
            self.user_permission = False
    
    def is_control_active(self):
        """Verifica si el control está activo"""
        return self.control_active
    
    def run_with_safety(self, action_func, *args, **kwargs):
        """Ejecuta una acción con el sistema de control seguro"""
        if not self.activate_safe_control():
            return False
        
        try:
            result = action_func(*args, **kwargs)
            return result
        finally:
            self.deactivate_safe_control()

class SafeMouseController:
    """
    Controlador seguro del mouse que verifica permisos antes de actuar
    """
    
    def __init__(self, safe_manager):
        self.safe_manager = safe_manager
    
    def safe_click(self, x=None, y=None, button='left'):
        """Hace clic de forma segura si el control está activo"""
        if not self.safe_manager.is_control_active():
            print("Error: No se puede hacer clic. Control no está activo.")
            return False
        
        try:
            import pyautogui
            if x is not None and y is not None:
                pyautogui.click(x, y, button=button)
            else:
                pyautogui.click(button=button)
            print(f"Clic realizado en ({x}, {y}) con botón {button}" if x is not None else f"Clic realizado en posición actual con botón {button}")
            return True
        except ImportError:
            print("pyautogui no está disponible")
            return False
    
    def safe_move_to(self, x, y):
        """Mueve el cursor de forma segura si el control está activo"""
        if not self.safe_manager.is_control_active():
            print("Error: No se puede mover el cursor. Control no está activo.")
            return False
        
        try:
            import pyautogui
            pyautogui.moveTo(x, y)
            print(f"Cursor movido a ({x}, {y})")
            return True
        except ImportError:
            print("pyautogui no está disponible")
            return False
    
    def safe_key_press(self, key):
        """Presiona una tecla de forma segura si el control está activo"""
        if not self.safe_manager.is_control_active():
            print("Error: No se puede presionar tecla. Control no está activo.")
            return False
        
        try:
            import pyautogui
            pyautogui.press(key)
            print(f"Tecla '{key}' presionada")
            return True
        except ImportError:
            print("pyautogui no está disponible")
            return False

class SafeAntigravityController:
    """
    Controlador seguro para interacciones con Antigravity
    """
    
    def __init__(self):
        self.safe_manager = SafeControlManager()
        self.mouse_controller = SafeMouseController(self.safe_manager)
    
    def safe_perform_antigravity_action(self, action_name, *args, **kwargs):
        """Realiza una acción de Antigravity de forma segura"""
        print(f"Iniciando acción segura: {action_name}")
        
        def perform_action():
            try:
                if action_name == "click_continue":
                    # Aquí iría la lógica específica para hacer clic en "Continuar"
                    # en una ventana de Antigravity
                    print("Simulando clic en botón 'Continuar' de Antigravity")
                    return True
                elif action_name == "click_next":
                    # Aquí iría la lógica específica para hacer clic en "Siguiente"
                    print("Simulando clic en botón 'Siguiente' de Antigravity")
                    return True
                elif action_name == "click_accept":
                    # Aquí iría la lógica específica para hacer clic en "Aceptar"
                    print("Simulando clic en botón 'Aceptar' de Antigravity")
                    return True
                elif action_name == "maximize_window":
                    # Aquí iría la lógica específica para maximizar ventana
                    print("Simulando maximización de ventana de Antigravity")
                    return True
                else:
                    print(f"Acción desconocida: {action_name}")
                    return False
            except Exception as e:
                print(f"Error realizando acción {action_name}: {e}")
                return False
        
        # Usar el sistema visual si está disponible
        if self.safe_manager.use_visual_notifier:
            return self.safe_manager.activate_safe_control_with_visual_feedback(perform_action)
        else:
            return self.safe_manager.run_with_safety(perform_action)
    
    def safe_perform_antigravity_action_with_visual(self, action_name, *args, **kwargs):
        """Realiza una acción de Antigravity con notificación visual"""
        print(f"Iniciando acción segura con visual: {action_name}")
        
        def perform_action():
            try:
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
            except Exception as e:
                print(f"Error realizando acción {action_name}: {e}")
                return False
        
        return self.safe_manager.activate_safe_control_with_visual_feedback(perform_action)

def init_safe_antigravity_controller():
    """Inicializa y devuelve una instancia del controlador seguro"""
    return SafeAntigravityController()

if __name__ == "__main__":
    controller = init_safe_antigravity_controller()
    
    print("Sistema de control seguro de Antigravity iniciado")
    print("Este sistema pedirá permiso antes de tomar control del mouse y teclado")
    print("Opciones:")
    print("1. safe_perform_antigravity_action('click_continue')")
    print("2. safe_perform_antigravity_action('click_next')")
    print("3. safe_perform_antigravity_action('click_accept')")
    print("4. safe_perform_antigravity_action('maximize_window')")
    print("5. Salir")
    
    while True:
        try:
            choice = input("\nSeleccione una opción (1-5): ").strip()
            
            if choice == "1":
                controller.safe_perform_antigravity_action('click_continue')
            elif choice == "2":
                controller.safe_perform_antigravity_action('click_next')
            elif choice == "3":
                controller.safe_perform_antigravity_action('click_accept')
            elif choice == "4":
                controller.safe_perform_antigravity_action('maximize_window')
            elif choice == "5":
                print("Saliendo...")
                break
            else:
                print("Opción inválida")
                
        except KeyboardInterrupt:
            print("\nSaliendo...")
            break