import sys
sys.path.append('E:/scripts-python/clawdbot-new/skills/antigravity')
from antigravity_manager import init_antigravity_manager

print('Probando detección corregida de procesos de Antigravity...')
manager = init_antigravity_manager()

# Verificar procesos con el método corregido
processes = manager.get_antigravity_processes()
print(f'Procesos de Antigravity detectados con método corregido: {len(processes)}')

if processes:
    print('Algunos ejemplos:')
    for i, proc in enumerate(processes[:5]):  # Mostrar primeros 5
        print(f'  {i+1}. PID: {proc["pid"]}, Nombre: {proc["name"]}')
    if len(processes) > 5:
        print(f'  ... y {len(processes)-5} más')
else:
    print('No se detectaron procesos de Antigravity con el nuevo método')

print('Verificación completada.')