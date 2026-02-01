# Skill: antigravity IDE Automation

Este skill proporciona herramientas para automatizar y gestionar el IDE antigravity.

## Funcionalidades

- Detectar instancias existentes de Antigravity en ejecución
- Abrir y gestionar el IDE antigravity
- Navegar por proyectos y archivos
- Ejecutar comandos dentro del IDE
- Automatizar tareas comunes de desarrollo
- Detectar y manejar notificaciones y diálogos emergentes
- Responder automáticamente a solicitudes del IDE
- Control seguro del mouse y teclado con advertencias al usuario
- Apertura rápida de aplicaciones y proyectos
- Teclas de acceso rápido para acciones comunes

## Herramientas disponibles

- `antigravity_scan`: Detecta procesos de Antigravity en ejecución
- `antigravity_open`: Abre el IDE antigravity
- `antigravity_project`: Maneja operaciones de proyecto
- `antigravity_file`: Gestión de archivos dentro del IDE
- `antigravity_run`: Ejecuta comandos o tareas en el IDE
- `antigravity_monitor`: Inicia el monitoreo de notificaciones
- `antigravity_handle_dialogs`: Maneja diálogos emergentes automáticamente
- `quick_launch_app`: Abre rápidamente cualquier aplicación
- `open_antigravity_project`: Abre un proyecto específico en Antigravity
- `safe_control_enable/disable`: Habilita/deshabilita control seguro con advertencias

## Teclas de Acceso Rápido

- `Ctrl+Shift+F`: Enfocar ventana de Antigravity
- `Ctrl+Shift+N`: Enfocar notificación
- `Ctrl+Shift+C`: Hacer clic en botón Continuar
- `Ctrl+Shift+A`: Hacer clic en botón Aceptar
- `Ctrl+Shift+S`: Hacer clic en botón Siguiente
- `Ctrl+Shift+M`: Maximizar ventana de Antigravity
- `Ctrl+Shift+T`: Enviar tecla Tab

## Configuración

El IDE Antigravity ya está corriendo en múltiples instancias en el sistema como se puede ver con el comando `Get-Process | Where-Object {$_.ProcessName -like "*antigravity*"}`.

Además, se han implementado herramientas para:
- Detectar ventanas de diálogo emergentes
- Hacer clic en botones como "Continuar", "Siguiente", "Aceptar", etc.
- Monitorear continuamente las interacciones del IDE
- Traer ventanas al frente cuando sea necesario
- Control seguro del mouse y teclado con advertencias al usuario
- Apertura rápida de aplicaciones y proyectos