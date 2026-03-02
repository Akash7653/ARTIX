#!/usr/bin/env python3
"""
IoT Animation Video Generator
Generates a 20-second IoT-themed animated video for ARTIX landing page
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
    import imageio
except ImportError as e:
    print(f"Error: Missing required packages. Install them with:")
    print("  pip install pillow imageio")
    print(f"  Original error: {e}")
    sys.exit(1)

def create_gradient_frame(width, height, frame_num, total_frames, start_color, end_color):
    """Create a frame with animated gradient and IoT elements"""
    
    # Create base image
    img = Image.new('RGB', (width, height), 'black')
    draw = ImageDraw.Draw(img)
    
    # Animation progress (0.0 to 1.0)
    progress = frame_num / total_frames
    
    # Create gradient background with animation
    for y in range(height):
        # Interpolate between colors based on animation progress
        r = int(start_color[0] * (1 - progress) + end_color[0] * progress)
        g = int(start_color[1] * (1 - progress) + end_color[1] * progress)
        b = int(start_color[2] * (1 - progress) + end_color[2] * progress)
        
        # Draw horizontal line
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Draw animated circles (IoT nodes)
    num_circles = 5
    for i in range(num_circles):
        angle = (progress * 360 + (i * 360 / num_circles)) % 360
        
        # Calculate position on circle
        import math
        rad = math.radians(angle)
        cx = int(width / 2 + 200 * math.cos(rad))
        cy = int(height / 2 + 150 * math.sin(rad))
        
        # Draw circle with pulsing effect
        radius = int(20 + 10 * math.sin(progress * 6.28))
        draw.ellipse(
            [(cx - radius, cy - radius), (cx + radius, cy + radius)],
            fill=(100, 180, 255),
            outline=(150, 200, 255)
        )
        
        # Draw connecting lines
        draw.line(
            [(width // 2, height // 2), (cx, cy)],
            fill=(50, 150, 220),
            width=2
        )
    
    # Draw center circle
    center_radius = int(30 + 15 * math.sin(progress * 6.28 + 1.57))
    draw.ellipse(
        [(width // 2 - center_radius, height // 2 - center_radius),
         (width // 2 + center_radius, height // 2 + center_radius)],
        fill=(200, 100, 255),
        outline=(220, 150, 255)
    )
    
    # Draw animated particles
    for i in range(20):
        particle_progress = (progress + i * 0.05) % 1.0
        px = int(width * (0.2 + 0.6 * math.sin(particle_progress * 6.28)))
        py = int(height * (0.3 + 0.4 * math.sin(particle_progress * 6.28 + float(i))))
        
        particle_size = int(3 + 2 * math.sin(particle_progress * 6.28 * 2))
        draw.ellipse(
            [(px - particle_size, py - particle_size),
             (px + particle_size, py + particle_size)],
            fill=(100 + int(155 * math.sin(particle_progress * 6.28)), 200, 255)
        )
    
    # Draw animated text in lower portion
    try:
        # Try to use default font, fall back to default if not available
        font_size = 60
        text = "ARTIX 2026"
        text_bbox = draw.textbbox((0, 0), text)
        text_width = text_bbox[2] - text_bbox[0]
        text_x = (width - text_width) // 2
        text_y = height - 150
        
        draw.text(
            (text_x, text_y),
            text,
            fill=(255, 255, 255),
            font=None
        )
        
        # Subtitle with fade effect
        subtitle = "IoT Innovation Exchange"
        subtitle_alpha = int(255 * (0.5 + 0.5 * math.sin(progress * 6.28)))
        draw.text(
            (text_x - 100, text_y + 80),
            subtitle,
            fill=(200, 200, 255),
            font=None
        )
    except Exception as e:
        print(f"Note: Could not render text: {e}")
    
    return img

def generate_video(output_path, width=1920, height=1080, fps=30, duration_seconds=20):
    """Generate IoT animation video"""
    
    print(f"🎬 Generating IoT Animation Video...")
    print(f"   Resolution: {width}x{height}")
    print(f"   Duration: {duration_seconds} seconds")
    print(f"   FPS: {fps}")
    
    total_frames = fps * duration_seconds
    
    # Create color pairs for animation
    colors = [
        ((20, 30, 60), (100, 150, 255)),      # Blue theme
        ((100, 150, 255), (150, 100, 255)),   # Blue to Purple
        ((150, 100, 255), (100, 150, 255)),   # Purple to Blue
        ((100, 150, 255), (20, 30, 60)),      # Blue to Dark
    ]
    
    frames = []
    
    for frame_num in range(total_frames):
        # Determine which color pair to use
        cycle = (frame_num // (total_frames // len(colors))) % len(colors)
        start_color, end_color = colors[cycle]
        
        # Create frame
        frame = create_gradient_frame(
            width, height, 
            frame_num % (total_frames // len(colors)),
            total_frames // len(colors),
            start_color, 
            end_color
        )
        
        frames.append(frame)
        
        # Progress indicator
        progress_pct = (frame_num + 1) / total_frames * 100
        if (frame_num + 1) % (total_frames // 10) == 0:
            print(f"   ✓ Progress: {progress_pct:.0f}% ({frame_num + 1}/{total_frames} frames)")
    
    # Save video
    print(f"\n💾 Saving video to: {output_path}")
    imageio.mimsave(output_path, frames, fps=fps)
    
    # Get file size
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Video created: {file_size_mb:.2f} MB")
    
    return True

def generate_poster(output_path, width=1920, height=1080):
    """Generate poster image (first frame)"""
    
    print(f"\n🖼️  Generating Poster Image...")
    
    img = Image.new('RGB', (width, height), 'black')
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(height):
        ratio = y / height
        r = int(20 + 80 * ratio)
        g = int(30 + 120 * ratio)
        b = int(60 + 195 * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Draw circles
    import math
    num_circles = 5
    for i in range(num_circles):
        angle = (i * 360 / num_circles) % 360
        rad = math.radians(angle)
        cx = int(width / 2 + 200 * math.cos(rad))
        cy = int(height / 2 + 150 * math.sin(rad))
        
        draw.ellipse(
            [(cx - 20, cy - 20), (cx + 20, cy + 20)],
            fill=(100, 180, 255),
            outline=(150, 200, 255)
        )
        
        draw.line(
            [(width // 2, height // 2), (cx, cy)],
            fill=(50, 150, 220),
            width=2
        )
    
    # Center circle
    draw.ellipse(
        [(width // 2 - 30, height // 2 - 30),
         (width // 2 + 30, height // 2 + 30)],
        fill=(200, 100, 255),
        outline=(220, 150, 255)
    )
    
    # Add text
    try:
        draw.text(
            (width // 2 - 150, height - 150),
            "ARTIX 2026",
            fill=(255, 255, 255),
            font=None
        )
    except:
        pass
    
    img.save(output_path, 'JPEG', quality=95)
    print(f"✅ Poster saved: {output_path}")

if __name__ == "__main__":
    # Determine output paths
    script_dir = Path(__file__).parent.resolve()
    
    # Create directories if needed
    video_dir = script_dir / "artix-frontend" / "public" / "assets" / "videos"
    image_dir = script_dir / "artix-frontend" / "public" / "assets" / "images"
    
    video_dir.mkdir(parents=True, exist_ok=True)
    image_dir.mkdir(parents=True, exist_ok=True)
    
    video_path = video_dir / "iot-animation.mp4"
    poster_path = image_dir / "iot-poster.jpg"
    
    print("=" * 60)
    print("🚀 ARTIX IoT Animation Video Generator")
    print("=" * 60)
    
    try:
        # Generate video
        generate_video(str(video_path), width=1920, height=1080, fps=30, duration_seconds=20)
        
        # Generate poster
        generate_poster(str(poster_path), width=1920, height=1080)
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Video assets generated:")
        print(f"   📹 Video: {video_path}")
        print(f"   🖼️  Poster: {poster_path}")
        print("\n🎉 Your landing page is ready with video animation!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTo fix this, install required packages:")
        print("  pip install pillow imageio")
        sys.exit(1)
