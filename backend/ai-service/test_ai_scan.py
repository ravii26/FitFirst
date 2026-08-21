import urllib.request
import json
import io
from PIL import Image, ImageDraw

def test_scan():
    # Create a synthetic red garment image
    img = Image.new('RGB', (300, 500), color=(180, 20, 40))
    draw = ImageDraw.Draw(img)
    # Add gold motif accents (jewel/embroidered pattern simulation)
    draw.rectangle([50, 50, 250, 450], fill=(160, 15, 30))
    draw.ellipse([100, 100, 200, 200], fill=(212, 175, 55))
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    image_bytes = buf.getvalue()

    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="file"; filename="test_garment.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode('utf-8') + image_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

    req = urllib.request.Request(
        'http://localhost:8000/scan',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )

    try:
        res = urllib.request.urlopen(req)
        result = json.loads(res.read().decode('utf-8'))
        print("=== LIVE AI SCAN RESULT FROM http://localhost:8000/scan ===")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error calling AI scanner: {e}")

if __name__ == "__main__":
    test_scan()
