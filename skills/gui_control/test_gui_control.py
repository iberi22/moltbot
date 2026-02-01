#!/usr/bin/env python3
"""
Script de prueba para el sistema de control de interfaces gráficas
"""

import sys
import time
from pathlib import Path

# Añadir el directorio actual al path para importar los módulos
sys.path.insert(0, str(Path(__file__).parent.parent))  # Añadir el directorio skills

def test_gui_control():
    print("Probando sistema de control de interfaces gráficas...")
    
    try:
        from gui_control.gui_controller import GUIController
        
        print("Inicializando controlador de GUI...")
        controller = GUIController()
        
        print("Tomando captura de pantalla...")
        screenshot = controller.take_screenshot()
        print(f"Captura tomada. Dimensiones: {screenshot.shape}")
        
        print("\nProbando búsqueda de elementos...")
        
        # Buscar elementos en la pantalla actual (esto probablemente no encuentre nada específico
        # a menos que haya texto conocido en la pantalla)
        print("Buscando posibles botones en la pantalla...")
        button_candidates = controller.element_finder.find_button_like_elements(screenshot)
        print(f"Botones potenciales encontrados: {len(button_candidates)}")
        
        if button_candidates:
            print("Primer candidato a botón:")
            first_button = button_candidates[0]
            print(f"  Posición: {first_button['center']}")
            print(f"  Área: {first_button['area']}")
            print(f"  Relación de aspecto: {first_button['aspect_ratio']}")
        
        print("\nEl sistema está listo para interactuar con aplicaciones como WhatsApp Desktop.")
        print("Puede buscar elementos por texto, imágenes, color o características visuales.")
        
        # Mostrar opciones de uso
        print("\nOpciones principales:")
        print("- controller.find_element_by_text('texto_a_buscar')")
        print("- controller.find_element_by_image('ruta_imagen.png')")
        print("- controller.click_at(x, y)")
        print("- controller.type_text('texto a escribir')")
        print("- controller.safe_click_on_text('texto')")
        
        print("\nPrueba completada.")
        
    except Exception as e:
        print(f"Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gui_control()