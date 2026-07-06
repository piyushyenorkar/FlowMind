import sys
import os
from PIL import Image, ImageDraw

def create_rounded_bg(input_path, output_path, box_width=100, box_height=100, corner_radius=20, logo_max_size=60):
    if not os.path.exists(input_path):
        print("Image not found:", input_path)
        return

    # Load the logo
    img = Image.open(input_path).convert("RGBA")

    # Resize logo if it's too big, maintaining aspect ratio
    img.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)

    # Create transparent background for the box
    bg = Image.new("RGBA", (box_width, box_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)

    # Skillicons dark theme background color
    color = (36, 41, 56, 255)
    
    # Draw rounded rectangle
    draw.rounded_rectangle((0, 0, box_width, box_height), radius=corner_radius, fill=color)

    # Paste the logo in center
    offset_x = (box_width - img.width) // 2
    offset_y = (box_height - img.height) // 2
    
    # Use it as a mask
    bg.paste(img, (offset_x, offset_y), img)

    # Save as new file
    bg.save(output_path)
    print("Saved to", output_path)

if __name__ == "__main__":
    # Create fixed size 100x100 square badges with 20px border radius
    # logo max size 64x64 inside
    create_rounded_bg("flowmind/src/assets/agora.png", "flowmind/src/assets/agora_badge.png", box_width=120, box_height=100, corner_radius=25, logo_max_size=64)
    create_rounded_bg("flowmind/src/assets/groq.png", "flowmind/src/assets/groq_badge.png", box_width=120, box_height=100, corner_radius=25, logo_max_size=64)
    create_rounded_bg("flowmind/src/assets/render.png", "flowmind/src/assets/render_badge.png", box_width=120, box_height=100, corner_radius=25, logo_max_size=64)
