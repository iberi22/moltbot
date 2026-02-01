#!/usr/bin/env python3
"""
Script de prueba para el sistema de notificación visual
"""

import sys
import time
from pathlib import Path

# Añadir el directorio actual al path para importar los módulos
sys.path.append(str(Path(__file__).parent))

def test_visual_notification():
    print("Probando sistema de notificación visual...")
    
    try:
        from antigravity_manager import init_antigravity_manager
        
        print("Inicializando sistema de control...")
        manager = init_antigravity_manager()
        
        # Habilitar control seguro
        manager.enable_safe_control()
        print("Control seguro habilitado")
        
        print("\nIMPORTANTE: Se mostrará una notificación visual y una ventana de advertencia.")
        print("Por favor, observe ambas notificaciones que aparecerán.")
        print("Tendrá que dar permiso para continuar con la demostración.")
        input("\nPresione Enter para continuar con la prueba...")
        
        # Probar el sistema de notificación visual
        print("Iniciando acción con notificación visual...")
        result = manager.safe_perform_action('click_continue')
        
        print(f"Resultado de la acción: {result}")
        print("Prueba completada.")
        
    except Exception as e:
        print(f"Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_visual_notification()