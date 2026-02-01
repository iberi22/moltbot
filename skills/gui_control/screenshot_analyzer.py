import cv2
import numpy as np
from PIL import Image
import pytesseract
import re

class ScreenshotAnalyzer:
    """
    Analizador de capturas de pantalla para reconocimiento de texto e imágenes
    """
    
    def __init__(self):
        # Configurar tesseract si está disponible
        try:
            # Intentar configurar la ruta de tesseract si es necesario
            # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            pass
        except:
            print("Tesseract no disponible. OCR limitado.")
    
    def analyze_screenshot(self, screenshot):
        """Analiza una captura de pantalla para extraer información"""
        if isinstance(screenshot, str):
            # Si es una ruta de archivo, cargar la imagen
            screenshot = cv2.imread(screenshot)
        
        height, width = screenshot.shape[:2]
        
        analysis = {
            'dimensions': (width, height),
            'text_elements': [],
            'color_analysis': {},
            'dominant_colors': []
        }
        
        # Extraer texto usando OCR si está disponible
        try:
            gray = cv2.cvtColor(screenshot, cv2.COLOR_RGB2GRAY) if len(screenshot.shape) == 3 else screenshot
            text_data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
            
            for i, text in enumerate(text_data['text']):
                if text.strip():  # Solo procesar texto no vacío
                    x = text_data['left'][i]
                    y = text_data['top'][i]
                    w = text_data['width'][i]
                    h = text_data['height'][i]
                    
                    element = {
                        'text': text.strip(),
                        'bbox': (x, y, w, h),
                        'confidence': text_data['conf'][i]
                    }
                    
                    if element['confidence'] > 30:  # Solo texto con buena confianza
                        analysis['text_elements'].append(element)
                        
        except Exception as e:
            print(f"Error en OCR: {e}")
        
        return analysis
    
    def find_text_in_screenshot(self, screenshot, target_text, case_sensitive=False):
        """Busca un texto específico en una captura de pantalla"""
        analysis = self.analyze_screenshot(screenshot)
        
        results = []
        target = target_text if case_sensitive else target_text.lower()
        
        for element in analysis['text_elements']:
            text = element['text'] if case_sensitive else element['text'].lower()
            
            if target in text:
                results.append({
                    'text': element['text'],
                    'bbox': element['bbox'],
                    'confidence': element['confidence'],
                    'matched_text': target_text
                })
        
        return results
    
    def calculate_color_histogram(self, screenshot):
        """Calcula el histograma de colores de la imagen"""
        if len(screenshot.shape) == 3:
            colors = ('b', 'g', 'r')
            hist_info = {}
            
            for i, color in enumerate(colors):
                hist = cv2.calcHist([screenshot], [i], None, [256], [0, 256])
                hist_info[color] = hist.flatten()
            
            return hist_info
        return {}
    
    def detect_edges(self, screenshot, threshold1=50, threshold2=150):
        """Detecta bordes en la imagen"""
        gray = cv2.cvtColor(screenshot, cv2.COLOR_RGB2GRAY) if len(screenshot.shape) == 3 else screenshot
        edges = cv2.Canny(gray, threshold1, threshold2)
        return edges