import pyautogui
import time
import cv2
import numpy as np
from PIL import ImageGrab
import mss
from gui_control.screenshot_analyzer import ScreenshotAnalyzer
from gui_control.element_finder import ElementFinder

class GUIController:
    """
    Controlador para interfaces gráficas mediante captura de pantalla y control de mouse
    """
    
    def __init__(self):
        self.analyzer = ScreenshotAnalyzer()
        self.element_finder = ElementFinder()
        pyautogui.FAILSAFE = True  # Mover mouse a la esquina superior izquierda para abortar
        pyautogui.PAUSE = 0.1  # Pausa entre comandos para mayor fiabilidad
        
    def take_screenshot(self):
        """Toma una captura de pantalla completa"""
        with mss.mss() as sct:
            screenshot = sct.grab(sct.monitors[0])  # monitors[0] es la pantalla primaria
            img = np.array(screenshot)
            # Convertir de BGR a RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)
            return img
    
    def find_element_by_text(self, text, screenshot=None):
        """Busca un elemento en la pantalla por texto"""
        if screenshot is None:
            screenshot = self.take_screenshot()
        
        return self.element_finder.find_text_element(screenshot, text)
    
    def find_element_by_image(self, template_path, screenshot=None, threshold=0.8):
        """Busca un elemento en la pantalla por coincidencia de imagen"""
        if screenshot is None:
            screenshot = self.take_screenshot()
        
        return self.element_finder.find_image_element(screenshot, template_path, threshold)
    
    def move_mouse_to(self, x, y, duration=0.5):
        """Mueve el mouse a una posición específica"""
        pyautogui.moveTo(x, y, duration=duration)
    
    def click_at(self, x, y):
        """Hace clic en una posición específica"""
        pyautogui.click(x, y)
    
    def click_on_element(self, element_info):
        """Hace clic en un elemento encontrado"""
        if element_info and 'center' in element_info:
            center_x, center_y = element_info['center']
            self.click_at(center_x, center_y)
            return True
        return False
    
    def type_text(self, text):
        """Escribe texto en la posición actual del cursor"""
        pyautogui.typewrite(text)
    
    def press_key(self, key):
        """Presiona una tecla específica"""
        pyautogui.press(key)
    
    def double_click_at(self, x, y):
        """Hace doble clic en una posición específica"""
        pyautogui.doubleClick(x, y)
    
    def right_click_at(self, x, y):
        """Hace clic derecho en una posición específica"""
        pyautogui.rightClick(x, y)
    
    def scroll(self, clicks):
        """Realiza un desplazamiento vertical"""
        pyautogui.scroll(clicks)
    
    def focus_window(self, window_title):
        """Enfoca una ventana específica"""
        import pygetwindow as gw
        try:
            windows = gw.getWindowsWithTitle(window_title)
            if windows:
                window = windows[0]
                window.activate()
                return True
        except Exception as e:
            print(f"Error enfocando ventana {window_title}: {e}")
        return False
    
    def safe_click_on_text(self, text, screenshot=None):
        """Busca texto en pantalla y hace clic en él de forma segura"""
        element = self.find_element_by_text(text, screenshot)
        if element:
            print(f"Texto '{text}' encontrado en: {element['bbox']}")
            return self.click_on_element(element)
        else:
            print(f"No se encontró el texto '{text}' en la pantalla")
            return False
    
    def safe_click_on_image(self, template_path, threshold=0.8, screenshot=None):
        """Busca una imagen en pantalla y hace clic en ella de forma segura"""
        element = self.find_element_by_image(template_path, screenshot, threshold)
        if element:
            print(f"Imagen encontrada en: {element['bbox']}")
            return self.click_on_element(element)
        else:
            print(f"No se encontró la imagen en la pantalla")
            return False
    
    def wait_for_element(self, text, timeout=10, interval=1):
        """Espera a que aparezca un elemento en pantalla"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            screenshot = self.take_screenshot()
            element = self.find_element_by_text(text, screenshot)
            if element:
                return element
            time.sleep(interval)
        return None