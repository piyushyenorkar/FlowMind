from PIL import Image

def convert_black_to_white(image_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    data = img.getdata()
    
    new_data = []
    for item in data:
        # item is (R, G, B, A)
        r, g, b, a = item
        
        # Check if the pixel is black or very dark (r < 50, g < 50, b < 50)
        # The Neo4j logo has black text and blue geometric shapes.
        # Blue is roughly (0, 140, 193) or similar, so it has higher B/G values.
        # Black is (0,0,0).
        if r < 50 and g < 50 and b < 50 and a > 0:
            # Change black to white
            new_data.append((255, 255, 255, a))
        else:
            # Keep other colors (like the blue part) as they are
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(image_path)
    print("Image processed successfully!")

if __name__ == "__main__":
    convert_black_to_white(r"c:\Users\piyus\Downloads\flowmind\flowmind\src\assets\neo4j.png")
