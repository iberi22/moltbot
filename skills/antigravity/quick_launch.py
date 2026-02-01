import subprocess
import os
import sys
from pathlib import Path

def quick_launch_app(app_name, path=None, args=None):
    """
    Función para abrir rápidamente aplicaciones
    :param app_name: Nombre del ejecutable (por ejemplo, 'notepad', 'code', etc.)
    :param path: Ruta donde se ejecutará la aplicación (opcional)
    :param args: Argumentos adicionales para la aplicación (opcional)
    """
    try:
        cmd = [app_name]
        if args:
            if isinstance(args, str):
                cmd.append(args)
            else:
                cmd.extend(args)
        
        original_cwd = None
        if path:
            original_cwd = os.getcwd()
            os.chdir(path)
        
        print(f"Ejecutando: {' '.join(cmd)} en la ruta: {path or os.getcwd()}")
        
        process = subprocess.Popen(cmd, cwd=path)
        
        if original_cwd:
            os.chdir(original_cwd)
        
        print(f"Aplicación '{app_name}' lanzada con PID: {process.pid}")
        return process.pid
        
    except FileNotFoundError:
        print(f"Error: La aplicación '{app_name}' no se encontró en el sistema")
        return None
    except Exception as e:
        print(f"Error al lanzar la aplicación '{app_name}': {e}")
        return None

def open_antigravity_project(project_path):
    """Abre un proyecto específico en Antigravity"""
    print(f"Abriendo proyecto en Antigravity: {project_path}")
    
    # Primero verificar si el directorio existe
    if not os.path.exists(project_path):
        print(f"Error: La ruta del proyecto no existe: {project_path}")
        return None
    
    # Intentar abrir Antigravity en el directorio del proyecto
    return quick_launch_app('Antigravity.exe', path=project_path, args=['.'])

def quick_open_vscode_folder(folder_path):
    """Abre rápidamente una carpeta en VS Code"""
    return quick_launch_app('code', path=folder_path, args=['.'])

def quick_open_notepad(filepath=None):
    """Abre rápidamente el bloc de notas, opcionalmente con un archivo"""
    args = [filepath] if filepath else []
    return quick_launch_app('notepad', args=args)

def list_quick_commands():
    """Lista los comandos disponibles"""
    print("Comandos disponibles:")
    print("1. open_antigravity_project(project_path) - Abre un proyecto en Antigravity")
    print("2. quick_open_vscode_folder(folder_path) - Abre una carpeta en VS Code")
    print("3. quick_open_notepad(filepath) - Abre notepad, opcionalmente con un archivo")
    print("4. quick_launch_app(app_name, path, args) - Lanza cualquier aplicación")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "antigravity" and len(sys.argv) > 2:
            project_path = sys.argv[2]
            open_antigravity_project(project_path)
        elif command == "vscode" and len(sys.argv) > 2:
            folder_path = sys.argv[2]
            quick_open_vscode_folder(folder_path)
        elif command == "list":
            list_quick_commands()
        else:
            print("Uso:")
            print("  python quick_launch.py antigravity <ruta_proyecto> - Abre proyecto en Antigravity")
            print("  python quick_launch.py vscode <ruta_carpeta> - Abre carpeta en VS Code")
            print("  python quick_launch.py list - Lista comandos disponibles")
    else:
        print("Quick Launch Tool - Para comandos rápidos de apertura de aplicaciones")
        list_quick_commands()