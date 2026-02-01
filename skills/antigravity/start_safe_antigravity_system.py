#!/usr/bin/env python3
"""
Sistema seguro de administracion de Antigravity
Este script inicia todos los componentes del sistema con control seguro
"""

import sys
import time
import threading
from pathlib import Path

# Añadir el directorio actual al path para importar los modulos
sys.path.append(str(Path(__file__).parent))

from antigravity_manager import init_antigravity_manager

def main():
    print("=" * 60)
    print("SISTEMA SEGURO DE ADMINISTRACION DE ANTIGRAVITY")
    print("=" * 60)

    print("\nInicializando sistema...")
    manager = init_antigravity_manager()

    # Habilitar control seguro por defecto
    manager.enable_safe_control()
    print("[OK] Control seguro habilitado")

    # Obtener procesos de Antigravity
    processes = manager.get_antigravity_processes()
    print(f"[OK] Se detectaron {len(processes)} procesos de Antigravity")

    # Iniciar el sistema de respuesta automatica
    print("[OK] Iniciando sistema de respuesta automatica...")
    manager.start_auto_responder()

    # Iniciar el sistema de teclas de acceso rapido
    print("[OK] Iniciando sistema de teclas de acceso rapido...")
    manager.start_hotkey_monitoring()

    print("\n" + "=" * 60)
    print("SISTEMA COMPLETO ACTIVO")
    print("=" * 60)
    print("Funcionalidades disponibles:")
    print("- [OK] Teclas rapidas para acciones comunes")
    print("- [OK] Monitoreo automatico de notificaciones")
    print("- [OK] Respuesta automatica a dialogos")
    print("- [OK] Gestion de ventanas de Antigravity")
    print("- [OK] Control seguro del mouse y teclado")
    print("- [OK] Advertencias antes de tomar control")
    print("=" * 60)
    print("\nTeclas de acceso rapido disponibles:")
    print("- Ctrl+Shift+F: Enfocar ventana de Antigravity")
    print("- Ctrl+Shift+N: Enfocar notificacion")
    print("- Ctrl+Shift+C: Hacer clic en boton Continuar")
    print("- Ctrl+Shift+A: Hacer clic en boton Aceptar")
    print("- Ctrl+Shift+S: Hacer clic en boton Siguiente")
    print("- Ctrl+Shift+M: Maximizar ventana de Antigravity")
    print("- Ctrl+Shift+T: Enviar tecla Tab")
    print("\nNOTA: Antes de tomar control del mouse o teclado,")
    print("el sistema mostrara una advertencia y solicitara permiso.")
    print("=" * 60)

    # Mantener el sistema activo
    try:
        print("\nSistema activo. Presiona Ctrl+C para detener.")

        while True:
            time.sleep(0.5)
            # Verificar y manejar eventos de notificacion
            notification_handled = manager.capture_notification_event()
            if notification_handled:
                print("[INFO] Notificacion de Antigravity capturada y manejada")

    except KeyboardInterrupt:
        print('\n\n' + '=' * 60)
        print('DETENIENDO SISTEMA...')
        print('=' * 60)
        manager.stop_auto_responder()
        manager.stop_hotkey_monitoring()
        print("[OK] Sistema detenido correctamente")
        print('=' * 60)

if __name__ == "__main__":
    main()