"""
Skill para control de interfaces gráficas mediante captura de pantalla y control de mouse
"""
from .gui_controller import GUIController
from .screenshot_analyzer import ScreenshotAnalyzer
from .element_finder import ElementFinder

__version__ = "1.0.0"
__author__ = "OpenClaw AI Assistant"
__description__ = "Herramientas para controlar interfaces gráficas mediante análisis visual"

def get_available_tools():
    """Devuelve las herramientas disponibles en este módulo"""
    return {
        'gui_controller': GUIController,
        'screenshot_analyzer': ScreenshotAnalyzer,
        'element_finder': ElementFinder
    }