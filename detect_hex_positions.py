from PIL import Image, ImageDraw, ImageFont
import numpy as np
from collections import defaultdict

def detect_hex_labels():
    """Try to detect hex label positions using image analysis"""
    try:
        img = Image.open('gameboard.png')
        width, height = img.size
        print(f"Analyzing gameboard: {width}x{height} pixels\n")
        
        # Convert to grayscale for analysis
        gray = img.convert('L')
        pixels = np.array(gray)
        
        # Try to identify text regions by looking for high contrast areas
        # Text typically has sharp edges
        from scipy import ndimage
        
        # Edge detection to find text-like regions
        try:
            from scipy.ndimage import sobel
            edges_x = sobel(pixels, axis=1)
            edges_y = sobel(pixels, axis=0)
            edges = np.hypot(edges_x, edges_y)
            
            # Threshold for text regions (high edge density)
            threshold = np.percentile(edges, 85)
            text_regions = edges > threshold
            
            print("Edge detection completed. Looking for text-like regions...")
            
        except ImportError:
            print("scipy not available. Using simpler method...")
            # Simple threshold-based approach
            threshold = np.percentile(pixels, 20)  # Dark regions (text)
            text_regions = pixels < threshold
        
        # Find connected components (potential text regions)
        from scipy.ndimage import label
        try:
            labeled, num_features = label(text_regions)
            
            # Get centroids of text regions
            centers = []
            for i in range(1, num_features + 1):
                coords = np.where(labeled == i)
                if len(coords[0]) > 10 and len(coords[0]) < 500:  # Filter by size
                    center_x = np.mean(coords[1])
                    center_y = np.mean(coords[0])
                    centers.append((center_x, center_y))
            
            print(f"Found {len(centers)} potential text regions")
            
            # Convert to percentages
            hex_coords = {}
            for i, (x, y) in enumerate(centers[:50]):  # Limit to first 50
                x_pct = (x / width) * 100
                y_pct = (y / height) * 100
                # Use placeholder labels - user will need to verify
                hex_coords[f"HEX_{i+1}"] = {
                    'x': round(x_pct, 2),
                    'y': round(y_pct, 2)
                }
            
            return hex_coords, width, height
            
        except ImportError:
            print("scipy not available. Cannot perform advanced analysis.")
            return None, width, height
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None, None, None

if __name__ == "__main__":
    print("=" * 60)
    print("Hex Position Detection")
    print("=" * 60)
    print("\nThis script attempts to automatically detect hex label positions.")
    print("For best results, use the interactive HTML tool: hex-coordinate-picker.html\n")
    
    coords, width, height = detect_hex_labels()
    
    if coords:
        print(f"\nDetected {len(coords)} potential hex positions:")
        print("\nNote: These are estimated positions. Manual verification required!")
        print("\nTo use the interactive tool:")
        print("1. Open 'hex-coordinate-picker.html' in a web browser")
        print("2. Click on each hex label on the gameboard")
        print("3. Export the coordinates to JavaScript format")
    else:
        print("\nAutomatic detection not available.")
        print("Please use the interactive tool: hex-coordinate-picker.html")
        print("\nTo use it:")
        print("1. Open hex-coordinate-picker.html in your browser")
        print("2. Enter a hex label (e.g., 'A1')")
        print("3. Click on the gameboard where that label appears")
        print("4. Repeat for all hexes")
        print("5. Click 'Export to JavaScript' and copy the code")
