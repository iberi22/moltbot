import tkinter as tk
from tkinter import ttk
import threading
import time
import ctypes
from PIL import Image, ImageTk
import io
import base64

class VisualNotifier:
    """
    Sistema de notificación visual que avisa cuando el sistema va a tomar control
    del mouse y teclado, con efecto de blur y animación
    """
    
    def __init__(self):
        self.root = None
        self.is_shown = False
        self.working_animation = None
        
    def create_blur_overlay(self):
        """Crea una superposición con efecto de blur"""
        if self.root:
            self.root.destroy()
        
        self.root = tk.Tk()
        self.root.title("Sistema de IA trabajando...")
        self.root.attributes('-fullscreen', True)
        self.root.attributes('-topmost', True)
        self.root.configure(bg='#000000')
        self.root.attributes('-alpha', 0.8)  # Transparencia para efecto de blur
        
        # Centrar el mensaje
        frame = tk.Frame(self.root, bg='#1a1a1a', relief='raised', bd=2)
        frame.place(relx=0.5, rely=0.4, anchor='center')
        
        # Mensaje principal
        label = tk.Label(
            frame, 
            text="Sistema de IA trabajando...",
            font=('Arial', 24, 'bold'),
            fg='#00ff00',
            bg='#1a1a1a'
        )
        label.pack(pady=20, padx=20)
        
        # Mensaje secundario
        sublabel = tk.Label(
            frame,
            text="Tomando control temporal del sistema",
            font=('Arial', 14),
            fg='#ffffff',
            bg='#1a1a1a'
        )
        sublabel.pack(pady=(0, 20))
        
        # Barra de progreso simulada
        self.progress = ttk.Progressbar(
            frame,
            mode='indeterminate',
            length=300
        )
        self.progress.pack(pady=10)
        
        # Botón de cancelar (opcional)
        cancel_btn = tk.Button(
            frame,
            text="Cancelar",
            command=self.hide_overlay,
            bg='#ff4444',
            fg='white',
            font=('Arial', 10)
        )
        cancel_btn.pack(pady=(0, 20))
        
        self.root.update()
        
    def show_working_notification(self, duration=None):
        """Muestra la notificación visual de trabajo"""
        if self.is_shown:
            return
            
        self.create_blur_overlay()
        self.is_shown = True
        
        # Iniciar la barra de progreso
        self.progress.start(10)
        
        if duration:
            # Auto ocultar después de la duración
            self.root.after(duration * 1000, self.hide_overlay)
        
        # Permitir que la interfaz se actualice
        self.root.update()
        
    def hide_overlay(self):
        """Oculta la superposición"""
        if self.root and self.is_shown:
            self.progress.stop()
            self.root.destroy()
            self.root = None
            self.is_shown = False
            
    def run_with_visual_notification(self, func, *args, **kwargs):
        """Ejecuta una función con notificación visual"""
        # Mostrar notificación
        self.show_working_notification()
        
        try:
            # Ejecutar la función en un hilo separado para no bloquear la UI
            result = func(*args, **kwargs)
            return result
        finally:
            # Ocultar notificación después de completar
            time.sleep(1)  # Pequeña pausa para que se note que terminó
            self.hide_overlay()

class SafeVisualControlManager:
    """
    Integración del control seguro con notificación visual
    """
    
    def __init__(self):
        self.visual_notifier = VisualNotifier()
        self.control_active = False
        
    def show_warning_and_request_permission(self):
        """Muestra advertencia visual y solicita permiso"""
        # Crear ventana de advertencia
        warning_root = tk.Tk()
        warning_root.title("Advertencia de Control")
        warning_root.geometry("500x200")
        warning_root.configure(bg='#2c2c2c')
        warning_root.attributes('-topmost', True)
        
        # Centrar la ventana
        warning_root.update_idletasks()
        x = (warning_root.winfo_screenwidth() // 2) - (500 // 2)
        y = (warning_root.winfo_screenheight() // 2) - (200 // 2)
        warning_root.geometry(f"+{x}+{y}")
        
        # Mensaje de advertencia
        msg_label = tk.Label(
            warning_root,
            text="El sistema de IA tomará control del mouse y teclado",
            font=('Arial', 14, 'bold'),
            fg='#ffff00',
            bg='#2c2c2c'
        )
        msg_label.pack(pady=20)
        
        detail_label = tk.Label(
            warning_root,
            text="Durante esta operación, no podrá usar el mouse ni teclado.\n¿Desea continuar?",
            font=('Arial', 10),
            fg='#ffffff',
            bg='#2c2c2c'
        )
        detail_label.pack(pady=10)
        
        # Variable para almacenar la respuesta
        self.permission_result = None
        
        def on_yes():
            self.permission_result = True
            warning_root.destroy()
            
        def on_no():
            self.permission_result = False
            warning_root.destroy()
        
        # Botones de confirmación
        button_frame = tk.Frame(warning_root, bg='#2c2c2c')
        button_frame.pack(pady=20)
        
        yes_btn = tk.Button(
            button_frame,
            text="Sí, continuar",
            command=on_yes,
            bg='#4CAF50',
            fg='white',
            font=('Arial', 10, 'bold'),
            width=12
        )
        yes_btn.pack(side=tk.LEFT, padx=10)
        
        no_btn = tk.Button(
            button_frame,
            text="No, cancelar",
            command=on_no,
            bg='#f44336',
            fg='white',
            font=('Arial', 10, 'bold'),
            width=12
        )
        no_btn.pack(side=tk.LEFT, padx=10)
        
        # Esperar a que se cierre la ventana
        warning_root.wait_window()
        
        return self.permission_result
    
    def safe_control_with_visual_feedback(self, action_func, *args, **kwargs):
        """Realiza una acción con control seguro y feedback visual"""
        # Primero solicitar permiso
        permission = self.show_warning_and_request_permission()
        
        if not permission:
            print("Usuario denegó permiso para tomar control")
            return False
        
        # Mostrar notificación visual de trabajo
        print("Mostrando notificación visual y tomando control...")
        result = self.visual_notifier.run_with_visual_notification(
            action_func, *args, **kwargs
        )
        
        return result

def example_action():
    """Ejemplo de acción que simula trabajo del sistema"""
    import time
    print("Iniciando acción del sistema...")
    time.sleep(3)  # Simular trabajo
    print("Acción completada")
    return "Éxito"

def main():
    """Ejemplo de uso"""
    print("Sistema de notificación visual - Ejemplo")
    print("Este sistema mostrará advertencias antes de tomar control")
    
    controller = SafeVisualControlManager()
    
    while True:
        try:
            choice = input("\nPresione Enter para probar acción con notificación visual (o 'q' para salir): ")
            if choice.lower() == 'q':
                break
                
            result = controller.safe_control_with_visual_feedback(example_action)
            print(f"Resultado: {result}")
            
        except KeyboardInterrupt:
            print("\nSaliendo...")
            break

if __name__ == "__main__":
    main()