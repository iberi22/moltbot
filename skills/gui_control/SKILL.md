# Skill: GUI Control

Este skill proporciona herramientas para controlar interfaces gráficas mediante captura de pantalla y control de mouse, permitiendo interactuar con cualquier aplicación basándose en reconocimiento visual.

## Funcionalidades

- Captura de pantalla completa de la pantalla activa
- Reconocimiento de texto en pantallas mediante OCR
- Búsqueda de elementos por coincidencia de imágenes
- Control preciso del mouse y teclado
- Detección de elementos con características visuales (botones, campos de texto, etc.)
- Interacción segura con interfaces gráficas
- Soporte para automatizar aplicaciones como WhatsApp Desktop

## Herramientas disponibles

- `take_screenshot`: Toma una captura de pantalla completa
- `find_element_by_text`: Busca un elemento en la pantalla por texto
- `find_element_by_image`: Busca un elemento en la pantalla por coincidencia de imagen
- `move_mouse_to`: Mueve el mouse a una posición específica
- `click_at`: Hace clic en una posición específica
- `click_on_element`: Hace clic en un elemento encontrado previamente
- `type_text`: Escribe texto en la posición actual del cursor
- `press_key`: Presiona una tecla específica
- `safe_click_on_text`: Busca texto y hace clic en él de forma segura
- `wait_for_element`: Espera a que aparezca un elemento en pantalla

## Componentes principales

### GUIController
Controlador principal que coordina todas las operaciones de control de GUI

### ScreenshotAnalyzer
Analizador de capturas de pantalla que realiza OCR y análisis visual

### ElementFinder
Buscador de elementos que localiza componentes en la interfaz gráfica

### WhatsAppController
Controlador específico para interactuar con WhatsApp Desktop

## Casos de uso

- Automatización de tareas en aplicaciones de escritorio
- Interacción con aplicaciones que no tienen API
- Control de interfaces gráficas complejas
- Envío de mensajes a través de clientes de mensajería como WhatsApp Desktop
- Automatización de flujos de trabajo en aplicaciones GUI

## Requisitos

- Python 3.x
- pyautogui
- opencv-python
- numpy
- pillow
- mss
- pytesseract
- pygetwindow

## Configuración

El sistema requiere privilegios adecuados para controlar el mouse y teclado. En algunos sistemas puede requerir permisos especiales de accesibilidad.

## Seguridad

- El sistema incluye un modo seguro que permite cancelar operaciones moviendo el mouse a la esquina superior izquierda
- Se recomienda supervisión constante durante la automatización
- Las operaciones se realizan con pausas para mayor fiabilidad