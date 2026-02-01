# Sistema Avanzado de Control de Interfaces Gráficas

## Descripción
Este sistema proporciona herramientas para controlar interfaces gráficas mediante captura de pantalla y control de mouse, permitiendo interactuar con cualquier aplicación basándose en reconocimiento visual. Combina técnicas de OCR, coincidencia de imágenes y análisis visual para automatizar tareas en aplicaciones de escritorio.

## Características Principales

### 1. Captura y Análisis Visual
- Captura de pantalla en tiempo real
- Reconocimiento de texto mediante OCR
- Búsqueda de elementos por coincidencia de imágenes
- Detección de elementos con características visuales

### 2. Control de Interfaz
- Control preciso del mouse y teclado
- Interacción segura con interfaces gráficas
- Sistema de advertencias y confirmaciones
- Efecto de blur y notificaciones visuales durante operaciones

### 3. Automatización Inteligente
- Identificación automática de botones y controles
- Interacción con aplicaciones sin API específica
- Sistema robusto de recuperación de errores

## Componentes Principales

### GUIController
Controlador principal que coordina todas las operaciones de control de GUI, incluyendo captura de pantalla, movimiento del mouse y pulsación de teclas.

### ScreenshotAnalyzer
Analizador de capturas de pantalla que realiza OCR y análisis visual para identificar elementos en la interfaz.

### ElementFinder
Buscador de elementos que localiza componentes en la interfaz gráfica por texto, imagen o características visuales.

### WhatsAppController
Controlador específico para interactuar con WhatsApp Desktop, demostrando la capacidad del sistema.

## Uso

### Instalación de dependencias:
```bash
pip install pyautogui opencv-python numpy pillow mss pytesseract pygetwindow
```

### Ejemplo básico de uso:
```python
from gui_control.gui_controller import GUIController

controller = GUIController()

# Tomar captura de pantalla
screenshot = controller.take_screenshot()

# Buscar un elemento por texto
element = controller.find_element_by_text("Texto a buscar", screenshot)

# Hacer clic en el elemento
if element:
    controller.click_on_element(element)

# Escribir texto
controller.type_text("Hola, mundo!")
```

### Enviar mensaje por WhatsApp:
```bash
python send_whatsapp_message.py
```

## Seguridad

El sistema incluye múltiples capas de seguridad:
- Modo seguro con detección de movimiento de mouse a la esquina superior izquierda
- Advertencias visuales antes de tomar control del sistema
- Confirmación del usuario para operaciones importantes
- Pauses entre operaciones para mayor fiabilidad

## Aplicaciones

- Automatización de tareas en aplicaciones de escritorio
- Interacción con interfaces sin API disponible
- Control de aplicaciones como WhatsApp Desktop, navegadores, editores, etc.
- Pruebas automatizadas de interfaces gráficas
- Asistentes de automatización de escritorio

## Limitaciones

- Depende de la apariencia visual de los elementos
- Puede verse afectado por cambios en la interfaz de las aplicaciones
- Requiere privilegios de acceso a la interfaz de usuario
- La precisión de OCR puede variar según la calidad visual

## Compatibilidad

- Windows, macOS y Linux
- Python 3.6+
- Requiere privilegios de accesibilidad en algunos sistemas

## Integración

Este sistema puede integrarse con otros módulos como el sistema de control seguro de Antigravity para proporcionar una experiencia de automatización completa con notificaciones visuales y controles de seguridad.