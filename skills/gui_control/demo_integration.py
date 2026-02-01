#!/usr/bin/env python3
"""
Demo de integración entre el sistema de control de Antigravity
y el nuevo sistema de control de interfaces gráficas
"""

import sys
import time
from pathlib import Path

# Añadir el directorio de skills al path
sys.path.insert(0, str(Path(__file__).parent.parent))

def demonstrate_integration():
    print("Demo de integracion entre sistemas")
    print("="*50)

    print("\n1. Demostracion del sistema de control de Antigravity:")
    try:
        from antigravity.antigravity_manager import init_antigravity_manager

        print("   Inicializando sistema de control de Antigravity...")
        antigravity_manager = init_antigravity_manager()

        # Verificar procesos de Antigravity
        processes = antigravity_manager.get_antigravity_processes()
        print(f"   [OK] Procesos de Antigravity detectados: {len(processes)}")

        # Habilitar control seguro con notificaciones visuales
        antigravity_manager.enable_safe_control()
        print("   [OK] Control seguro de Antigravity habilitado")

    except Exception as e:
        print(f"   [ERROR] Error con sistema Antigravity: {e}")

    print("\n2. Demostracion del sistema de control de interfaces graficas:")
    try:
        from gui_control.gui_controller import GUIController

        print("   Inicializando sistema de control de GUI...")
        gui_controller = GUIController()

        print("   Tomando captura de pantalla...")
        screenshot = gui_controller.take_screenshot()
        print(f"   [OK] Captura tomada. Dimensiones: {screenshot.shape}")

        print("   Buscando elementos visuales...")
        button_candidates = gui_controller.element_finder.find_button_like_elements(screenshot)
        print(f"   [OK] Elementos tipo boton detectados: {len(button_candidates)}")

    except Exception as e:
        print(f"   [ERROR] Error con sistema GUI: {e}")

    print("\n3. Demostracion combinada:")
    print("   Los dos sistemas pueden trabajar juntos para:")
    print("   - Controlar el IDE Antigravity con notificaciones visuales")
    print("   - Interactuar con interfaces graficas de forma segura")
    print("   - Automatizar tareas en aplicaciones como WhatsApp Desktop")
    print("   - Proporcionar retroalimentacion visual al usuario")

    print("\n4. Funcionalidades avanzadas:")
    print("   - Control seguro con advertencias y confirmacion")
    print("   - Efecto de blur y animaciones durante operaciones")
    print("   - Deteccion de elementos por texto, imagen y caracteristicas visuales")
    print("   - Integracion con sistemas de automatizacion de escritorio")

    print("\nDemo completada exitosamente!")

def run_whatsapp_demo():
    """Demo específica para WhatsApp"""
    print("\n" + "="*50)
    print("Demo de control de WhatsApp Desktop")
    print("="*50)

    try:
        from gui_control.whatsapp_controller import WhatsAppController

        print("Inicializando controlador de WhatsApp...")
        wa_controller = WhatsAppController()

        print("\nEl controlador está listo para:")
        print("- Abrir WhatsApp Desktop")
        print("- Buscar contactos por nombre")
        print("- Enviar mensajes automáticamente")
        print("- Interactuar con la interfaz mediante reconocimiento visual")

        print("\nPara usarlo, simplemente llame a las funciones:")
        print("wa_controller.send_message('nombre_contacto', 'mensaje')")
        print("wa_controller.search_contact('nombre_contacto')")

    except Exception as e:
        print(f"Error en demo de WhatsApp: {e}")

if __name__ == "__main__":
    demonstrate_integration()
    run_whatsapp_demo()