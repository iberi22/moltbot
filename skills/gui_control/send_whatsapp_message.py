#!/usr/bin/env python3
"""
Script para enviar mensaje por WhatsApp Desktop usando control de GUI
"""

import sys
import time
from pathlib import Path

# Añadir el directorio de skills al path
sys.path.insert(0, str(Path(__file__).parent.parent))

def send_message_to_brother():
    print("Sistema de envío de mensaje por WhatsApp Desktop")
    print("="*50)

    try:
        from gui_control.whatsapp_controller import WhatsAppController

        print("Inicializando sistema de control de WhatsApp...")
        wa_controller = WhatsAppController()

        # Obtener información del usuario
        brother_name = input("Por favor, introduce el nombre de tu hermano en WhatsApp: ")

        # Mensaje especial como solicitaste
        message = "Hola, soy el futuro. Deja de resistirte."

        print(f"\nEnviando mensaje a: {brother_name}")
        print(f"Contenido del mensaje: \"{message}\"")

        print("\nNOTA: Se mostrarán notificaciones visuales durante la operación")
        print("y se solicitará permiso antes de tomar control del sistema.")
        input("\nPresiona Enter para continuar...")

        # Enviar el mensaje
        success = wa_controller.send_message(brother_name, message)

        if success:
            print("\n[OK] Mensaje enviado exitosamente!")
            print("El sistema utilizó reconocimiento visual para interactuar con WhatsApp Desktop")
            print("y aplicó controles de seguridad durante la operación.")
        else:
            print("\n[ERROR] Falló el envío del mensaje.")
            print("Verifica que WhatsApp Desktop esté abierto y que el nombre sea correcto.")

    except ImportError as e:
        print(f"Error de importación: {e}")
        print("Asegúrate de que todos los módulos estén disponibles.")
    except Exception as e:
        print(f"Error durante el envío del mensaje: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("Sistema Avanzado de Control de Interfaces Gráficas")
    print("Módulo: Envío de Mensajes por WhatsApp")
    print()

    while True:
        print("\nOpciones:")
        print("1. Enviar mensaje especial a tu hermano")
        print("2. Enviar mensaje personalizado")
        print("3. Salir")

        choice = input("\nSelecciona una opción (1-3): ")

        if choice == "1":
            send_message_to_brother()
        elif choice == "2":
            send_custom_message()
        elif choice == "3":
            print("Saliendo...")
            break
        else:
            print("Opción no válida.")

def send_custom_message():
    """Enviar un mensaje personalizado"""
    try:
        from gui_control.whatsapp_controller import WhatsAppController

        wa_controller = WhatsAppController()

        contact_name = input("Nombre del contacto en WhatsApp: ")
        message = input("Mensaje a enviar: ")

        print(f"\nEnviando mensaje a: {contact_name}")
        print(f"Contenido: \"{message}\"")

        input("\nPresiona Enter para continuar...")

        success = wa_controller.send_message(contact_name, message)

        if success:
            print("\n✅ Mensaje enviado exitosamente!")
        else:
            print("\n❌ Falló el envío del mensaje.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()