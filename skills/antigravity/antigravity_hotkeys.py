import keyboard
import pyautogui
import win32gui
import win32con
import time
import threading
from pynput import mouse
from windows_notification_handler import WindowsNotificationHandler

class AntigravityHotkeyManager:
    """
    Sistema para gestionar teclas de acceso rápido y eventos de notificación
    para el IDE Antigravity
    """
    
    def __init__(self):
        self.handler = WindowsNotificationHandler()
        self.hotkeys_registered = False
        self.notification_callbacks = {}
        self.is_listening = False
        self.mouse_listener = None
        self.keyboard_listener = None
        
        # Configuración de teclas personalizadas
        self.custom_hotkeys = {
            'ctrl+shift+f': self.focus_antigravity_window,
            'ctrl+shift+n': self.focus_notification,
            'ctrl+shift+c': self.click_continue_button,
            'ctrl+shift+a': self.click_accept_button,
            'ctrl+shift+s': self.click_next_button,
            'ctrl+shift+m': self.maximize_antigravity_window,
            'ctrl+shift+t': self.send_tab_focus,
        }
    
    def register_hotkeys(self):
        """Registra las teclas de acceso rápido"""
        if self.hotkeys_registered:
            return
            
        for hotkey, callback in self.custom_hotkeys.items():
            keyboard.add_hotkey(hotkey, callback)
        
        self.hotkeys_registered = True
        print("Teclas de acceso rápido registradas:")
        for hotkey in self.custom_hotkeys.keys():
            print(f"  - {hotkey}")
    
    def unregister_hotkeys(self):
        """Desregistra las teclas de acceso rápido"""
        if not self.hotkeys_registered:
            return
            
        for hotkey in self.custom_hotkeys.keys():
            try:
                keyboard.remove_hotkey(hotkey)
            except:
                pass
        
        self.hotkeys_registered = False
        print("Teclas de acceso rápido desregistradas")
    
    def focus_antigravity_window(self):
        """Trae la ventana de Antigravity al frente"""
        print("Buscando ventana de Antigravity...")
        antigravity_windows = self.handler.find_antigravity_windows()
        
        if antigravity_windows:
            window = antigravity_windows[0]  # Tomar la primera ventana encontrada
            self.handler.bring_window_to_front(window['hwnd'])
            print(f"Ventana de Antigravity traída al frente: {window['title']}")
        else:
            print("No se encontraron ventanas de Antigravity")
    
    def focus_notification(self):
        """Busca y enfoca una notificación de Antigravity"""
        print("Buscando notificaciones de Antigravity...")
        dialogs = self.handler.find_dialog_windows()
        
        antigravity_dialogs = []
        for dialog in dialogs:
            # Verificar si está relacionado con Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                antigravity_dialogs.append(dialog)
        
        if antigravity_dialogs:
            dialog = antigravity_dialogs[0]
            self.handler.bring_window_to_front(dialog['hwnd'])
            print(f"Notificación de Antigravity enfocada: {dialog['title']}")
        else:
            print("No se encontraron notificaciones de Antigravity")
    
    def click_continue_button(self):
        """Hace clic en el botón 'Continuar' en diálogos"""
        print("Buscando botón 'Continuar'...")
        dialogs = self.handler.find_dialog_windows()
        
        for dialog in dialogs:
            # Verificar si está relacionado con Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                
                # Intentar hacer clic en un botón de continuar
                success = self.handler.click_button_in_dialog(dialog['hwnd'], "Continuar")
                if not success:
                    success = self.handler.click_button_in_dialog(dialog['hwnd'], "Continue")
                
                if success:
                    print(f"Botón 'Continuar' clickeado en: {dialog['title']}")
                    return
                else:
                    print(f"No se pudo hacer clic en botón de continuar en: {dialog['title']}")
        
        print("No se encontró un diálogo de Antigravity con botón 'Continuar'")
    
    def click_accept_button(self):
        """Hace clic en el botón 'Aceptar' en diálogos"""
        print("Buscando botón 'Aceptar'...")
        dialogs = self.handler.find_dialog_windows()
        
        for dialog in dialogs:
            # Verificar si está relacionado con Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                
                # Intentar hacer clic en un botón de aceptar
                success = self.handler.click_button_in_dialog(dialog['hwnd'], "Aceptar")
                if not success:
                    success = self.handler.click_button_in_dialog(dialog['hwnd'], "Accept")
                    if not success:
                        success = self.handler.click_button_in_dialog(dialog['hwnd'], "OK")
                
                if success:
                    print(f"Botón 'Aceptar' clickeado en: {dialog['title']}")
                    return
                else:
                    print(f"No se pudo hacer clic en botón de aceptar en: {dialog['title']}")
        
        print("No se encontró un diálogo de Antigravity con botón 'Aceptar'")
    
    def click_next_button(self):
        """Hace clic en el botón 'Siguiente' en diálogos"""
        print("Buscando botón 'Siguiente'...")
        dialogs = self.handler.find_dialog_windows()
        
        for dialog in dialogs:
            # Verificar si está relacionado con Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                
                # Intentar hacer clic en un botón de siguiente
                success = self.handler.click_button_in_dialog(dialog['hwnd'], "Siguiente")
                if not success:
                    success = self.handler.click_button_in_dialog(dialog['hwnd'], "Next")
                
                if success:
                    print(f"Botón 'Siguiente' clickeado en: {dialog['title']}")
                    return
                else:
                    print(f"No se pudo hacer clic en botón de siguiente en: {dialog['title']}")
        
        print("No se encontró un diálogo de Antigravity con botón 'Siguiente'")
    
    def maximize_antigravity_window(self):
        """Maximiza la ventana de Antigravity"""
        print("Buscando ventana de Antigravity para maximizar...")
        antigravity_windows = self.handler.find_antigravity_windows()
        
        if antigravity_windows:
            window = antigravity_windows[0]
            hwnd = window['hwnd']
            
            # Maximizar la ventana
            win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
            self.handler.bring_window_to_front(hwnd)
            print(f"Ventana de Antigravity maximizada: {window['title']}")
        else:
            print("No se encontraron ventanas de Antigravity")
    
    def send_tab_focus(self):
        """Envía una tecla Tab para cambiar foco"""
        print("Enviando tecla Tab para cambiar foco")
        pyautogui.press('tab')
    
    def start_listening(self):
        """Inicia la escucha de eventos"""
        if self.is_listening:
            print("La escucha ya está activa")
            return
        
        print("Iniciando escucha de teclas de acceso rápido...")
        self.register_hotkeys()
        self.is_listening = True
        
        # Iniciar listeners
        self.keyboard_listener = keyboard.hook(lambda event: None)  # Solo para mantener el sistema activo
        print("Sistema de teclas de acceso rápido activo")
    
    def stop_listening(self):
        """Detiene la escucha de eventos"""
        if not self.is_listening:
            return
        
        print("Deteniendo escucha de teclas de acceso rápido...")
        self.unregister_hotkeys()
        self.is_listening = False
        
        if self.keyboard_listener:
            keyboard.unhook_all()
        
        print("Sistema de teclas de acceso rápido detenido")
    
    def capture_notification_event(self):
        """Captura eventos de notificación específicos"""
        # Esta función puede ser extendida para capturar eventos específicos
        # de notificación del sistema operativo o del IDE
        dialogs = self.handler.find_dialog_windows()
        
        for dialog in dialogs:
            # Verificar si es una notificación de Antigravity
            parent_hwnd = dialog['parent_hwnd']
            if parent_hwnd:
                parent_title = dialog['parent_title']
            else:
                parent_title = ""
            
            if ('antigravity' in dialog['title'].lower() or 
                'antigravity' in parent_title.lower()):
                
                print(f"Notificación capturada: {dialog['title']}")
                
                # Determinar automáticamente qué acción tomar basada en el título
                title_lower = dialog['title'].lower()
                
                if any(word in title_lower for word in ['continue', 'continuar', 'proceed', 'proceder']):
                    self.click_continue_button()
                elif any(word in title_lower for word in ['accept', 'aceptar', 'confirm', 'confirmar']):
                    self.click_accept_button()
                elif any(word in title_lower for word in ['next', 'siguiente']):
                    self.click_next_button()
                else:
                    # Por defecto, intentar hacer clic en cualquier botón apropiado
                    self.handler.click_button_in_dialog(dialog['hwnd'])
                
                return True
        
        return False

def init_hotkey_manager():
    """Inicializa y devuelve una instancia del manager de teclas"""
    return AntigravityHotkeyManager()

if __name__ == "__main__":
    manager = init_hotkey_manager()
    
    print("Sistema de teclas de acceso rápido para Antigravity")
    print("Teclas disponibles:")
    for hotkey in manager.custom_hotkeys.keys():
        print(f"  - {hotkey}")
    
    try:
        manager.start_listening()
        print("Sistema activo. Presiona Ctrl+C para salir...")
        
        # Bucle de monitoreo
        while True:
            # Capturar eventos de notificación
            manager.capture_notification_event()
            time.sleep(0.5)  # Breve pausa para no sobrecargar el sistema
            
    except KeyboardInterrupt:
        print("\nDeteniendo sistema...")
        manager.stop_listening()