#!/usr/bin/env python3
"""
Controlador específico para WhatsApp Desktop
"""

import sys
import time
from pathlib import Path
import pygetwindow as gw

# Añadir el directorio de skills al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from gui_control.gui_controller import GUIController


class WhatsAppController:
    """
    Controlador específico para interactuar con WhatsApp Desktop
    """
    
    def __init__(self):
        self.controller = GUIController()
        
    def open_whatsapp(self):
        """Abre WhatsApp Desktop"""
        try:
            # Intentar abrir WhatsApp Desktop
            import subprocess
            subprocess.Popen(["start", "whatsapp"], shell=True)
            print("Intentando abrir WhatsApp Desktop...")
            time.sleep(3)  # Esperar a que se abra
            return True
        except Exception as e:
            print(f"Error abriendo WhatsApp: {e}")
            return False
    
    def focus_whatsapp_window(self):
        """Enfoca la ventana de WhatsApp"""
        # Intentar enfocar la ventana de WhatsApp
        whatsapp_windows = gw.getWindowsWithTitle("WhatsApp")
        if whatsapp_windows:
            whatsapp_windows[0].activate()
            time.sleep(1)
            return True
        else:
            print("No se encontró la ventana de WhatsApp")
            return False
    
    def search_contact(self, contact_name):
        """Busca un contacto en WhatsApp"""
        if not self.focus_whatsapp_window():
            print("No se pudo enfocar WhatsApp")
            return False
        
        # Presionar Ctrl+K para abrir la búsqueda
        self.controller.press_key('ctrl')
        self.controller.press_key('k')
        time.sleep(0.5)
        
        # Limpiar campo de búsqueda y escribir el nombre
        self.controller.press_key('ctrl')
        self.controller.press_key('a')  # Seleccionar todo
        time.sleep(0.1)
        self.controller.press_key('backspace')  # Eliminar texto
        time.sleep(0.1)
        
        # Escribir el nombre del contacto
        self.controller.type_text(contact_name)
        time.sleep(1)
        
        # Hacer clic en el primer resultado
        screenshot = self.controller.take_screenshot()
        contact_element = self.controller.find_element_by_text(contact_name, screenshot)
        
        if contact_element:
            print(f"Contacto '{contact_name}' encontrado, haciendo clic...")
            self.controller.click_on_element(contact_element)
            time.sleep(1)
            return True
        else:
            print(f"No se encontró el contacto '{contact_name}'")
            return False
    
    def send_message(self, contact_name, message):
        """Envía un mensaje a un contacto"""
        print(f"Enviando mensaje a {contact_name}...")
        
        # Buscar y seleccionar el contacto
        if not self.search_contact(contact_name):
            return False
        
        time.sleep(1)  # Esperar a que se cargue la conversación
        
        # Hacer clic en el campo de texto
        # Buscar visualmente el campo de texto de mensajes (típicamente tiene placeholder "Type a message")
        screenshot = self.controller.take_screenshot()
        
        # Buscar por texto común en el campo de entrada
        message_field_elements = self.controller.find_element_by_text("Type a message", screenshot)
        if not message_field_elements:
            # En español puede decir "Escribe un mensaje"
            message_field_elements = self.controller.find_element_by_text("Escribe un mensaje", screenshot)
        
        if message_field_elements:
            print("Campo de mensaje encontrado, escribiendo texto...")
            self.controller.click_on_element(message_field_elements)
            time.sleep(0.2)
            self.controller.type_text(message)
            time.sleep(0.5)
            self.controller.press_key('enter')  # Enviar mensaje
            print("Mensaje enviado!")
            return True
        else:
            # Si no encontramos el campo por texto, intentamos hacer clic en el área inferior
            # Aproximadamente donde debería estar el campo de texto (parte inferior de la pantalla)
            height, width = screenshot.shape[:2]
            # Hacer clic aproximadamente en la parte inferior central
            self.controller.click_at(width // 2, int(height * 0.9))
            time.sleep(0.2)
            self.controller.type_text(message)
            time.sleep(0.5)
            self.controller.press_key('enter')  # Enviar mensaje
            print("Mensaje enviado (método alternativo)!")
            return True
    
    def send_special_message_to_brother(self):
        """Envía el mensaje especial a tu hermano como solicitaste"""
        # Aquí puedes personalizar el nombre de tu hermano
        brother_name = input("Por favor, introduce el nombre de tu hermano en WhatsApp: ")
        
        message = "Hola, soy el futuro. Deja de resistirte."
        
        print(f"Enviando mensaje a {brother_name}: '{message}'")
        
        success = self.send_message(brother_name, message)
        
        if success:
            print("Mensaje enviado exitosamente!")
        else:
            print("Falló el envío del mensaje.")
        
        return success


def main():
    """Función principal para interactuar con WhatsApp"""
    print("Controlador de WhatsApp Desktop")
    print("Este sistema puede enviar mensajes usando reconocimiento visual")
    
    wa_controller = WhatsAppController()
    
    # Preguntar al usuario qué quiere hacer
    print("\nOpciones:")
    print("1. Enviar mensaje especial a tu hermano")
    print("2. Buscar un contacto")
    print("3. Enviar mensaje a un contacto")
    
    choice = input("\nSelecciona una opción (1-3): ")
    
    if choice == "1":
        wa_controller.send_special_message_to_brother()
    elif choice == "2":
        contact = input("Nombre del contacto a buscar: ")
        wa_controller.search_contact(contact)
    elif choice == "3":
        contact = input("Nombre del contacto: ")
        message = input("Mensaje a enviar: ")
        wa_controller.send_message(contact, message)
    else:
        print("Opción no válida")


if __name__ == "__main__":
    main()