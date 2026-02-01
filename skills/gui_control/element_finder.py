import cv2
import numpy as np
from PIL import Image
import pytesseract
from gui_control.screenshot_analyzer import ScreenshotAnalyzer

class ElementFinder:
    """
    Buscador de elementos en capturas de pantalla
    """
    
    def __init__(self):
        self.analyzer = ScreenshotAnalyzer()
    
    def find_text_element(self, screenshot, target_text, threshold=0.7):
        """Busca un elemento basado en texto"""
        if isinstance(screenshot, str):
            screenshot = cv2.imread(screenshot)
        
        # Buscar el texto en la captura de pantalla
        text_elements = self.analyzer.find_text_in_screenshot(screenshot, target_text)
        
        if text_elements:
            # Tomar el elemento con mayor confianza
            best_match = max(text_elements, key=lambda x: x['confidence'])
            
            x, y, w, h = best_match['bbox']
            center_x = x + w // 2
            center_y = y + h // 2
            
            return {
                'type': 'text',
                'text': best_match['text'],
                'bbox': (x, y, w, h),
                'center': (center_x, center_y),
                'confidence': best_match['confidence']
            }
        
        return None
    
    def find_image_element(self, screenshot, template_path, threshold=0.8):
        """Busca un elemento basado en coincidencia de imagen"""
        if isinstance(screenshot, str):
            screenshot = cv2.imread(screenshot)
        
        if isinstance(template_path, str):
            template = cv2.imread(template_path, cv2.IMREAD_COLOR)
        else:
            template = template_path
        
        if template is None:
            raise ValueError(f"No se pudo cargar la plantilla: {template_path}")
        
        # Realizar coincidencia de plantilla
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        
        # Encontrar las ubicaciones donde la coincidencia supera el umbral
        locations = np.where(result >= threshold)
        
        if len(locations[0]) > 0:
            # Tomar la mejor coincidencia
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            
            if max_val >= threshold:
                h, w = template.shape[:2]
                x, y = max_loc
                center_x = x + w // 2
                center_y = y + h // 2
                
                return {
                    'type': 'image',
                    'bbox': (x, y, w, h),
                    'center': (center_x, center_y),
                    'confidence': max_val
                }
        
        return None
    
    def find_elements_by_color(self, screenshot, target_color, tolerance=30):
        """Busca elementos basados en color específico"""
        if isinstance(screenshot, str):
            screenshot = cv2.imread(screenshot)
        
        # Convertir color objetivo a BGR si es RGB
        if isinstance(target_color, tuple) and len(target_color) == 3:
            target_bgr = (target_color[2], target_color[1], target_color[0])
        else:
            target_bgr = target_color
        
        # Crear máscara para el rango de color
        lower_bound = np.array([max(0, c - tolerance) for c in target_bgr], dtype=np.uint8)
        upper_bound = np.array([min(255, c + tolerance) for c in target_bgr], dtype=np.uint8)
        
        mask = cv2.inRange(screenshot, lower_bound, upper_bound)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        results = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Filtrar áreas pequeñas
                x, y, w, h = cv2.boundingRect(contour)
                center_x = x + w // 2
                center_y = y + h // 2
                
                results.append({
                    'type': 'color',
                    'bbox': (x, y, w, h),
                    'center': (center_x, center_y),
                    'area': area,
                    'contour': contour
                })
        
        return results
    
    def find_button_like_elements(self, screenshot):
        """Busca elementos que parezcan botones basados en características visuales"""
        if isinstance(screenshot, str):
            screenshot = cv2.imread(screenshot)
        
        gray = cv2.cvtColor(screenshot, cv2.COLOR_BGR2GRAY)
        
        # Detectar bordes
        edges = cv2.Canny(gray, 50, 150)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        button_candidates = []
        for contour in contours:
            # Calcular propiedades del contorno
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            
            if perimeter == 0:
                continue
                
            # Calcular la relación de aspecto y circularidad
            approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w) / h if h != 0 else 0
            
            # Considerar candidatos que tengan forma rectangular y tamaño razonable
            if len(approx) >= 4 and 0.2 < aspect_ratio < 5 and area > 100:
                center_x = x + w // 2
                center_y = y + h // 2
                
                button_candidates.append({
                    'type': 'button_candidate',
                    'bbox': (x, y, w, h),
                    'center': (center_x, center_y),
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'approx_points': len(approx)
                })
        
        return button_candidates