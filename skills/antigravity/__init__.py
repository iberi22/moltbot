"""
Módulo de integración con el IDE Antigravity
Proporciona herramientas para interactuar con el IDE Antigravity,
manejar notificaciones y automatizar tareas.
"""

from .antigravity_manager import AntigravityManager, init_antigravity_manager
from .antigravity_auto_responder import AntigravityAutoResponder, init_auto_responder
from .windows_notification_handler import WindowsNotificationHandler, init_notification_handler
from .quick_launch import quick_launch_app, open_antigravity_project, quick_open_vscode_folder, quick_open_notepad, list_quick_commands

__version__ = "1.1.0"
__author__ = "OpenClaw AI Assistant"
__description__ = "Herramientas para integrar y automatizar el IDE Antigravity"

def get_available_tools():
    """Devuelve las herramientas disponibles en este módulo"""
    return {
        'manager': AntigravityManager,
        'auto_responder': AntigravityAutoResponder,
        'notification_handler': WindowsNotificationHandler,
        'quick_launch_app': quick_launch_app,
        'open_antigravity_project': open_antigravity_project,
        'quick_open_vscode_folder': quick_open_vscode_folder,
        'quick_open_notepad': quick_open_notepad
    }

def create_default_manager():
    """Crea una instancia predeterminada del manager de Antigravity"""
    return init_antigravity_manager()

def quick_open_app(app_name, path=None, args=None):
    """
    Función auxiliar para abrir rápidamente aplicaciones
    """
    return quick_launch_app(app_name, path, args)