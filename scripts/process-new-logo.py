import os
from PIL import Image

SRC_PATH = 'C:/Users/HP/.gemini/antigravity/brain/db8ccb7e-f05b-44f2-a8e4-1c5f6a1a69b4/.user_uploaded/media_1788233001378.jpg'

def generate_assets():
    # 1. Load source image
    src = Image.open(SRC_PATH).convert('RGB')
    w, h = src.size
    print(f"[logo] Loaded source image {w}x{h}")

    # Dominant background and foreground colors
    bg_color = (99, 2, 37)       # #630225
    yellow_color = (252, 198, 8) # #FCC608

    # 2. Generate transparent version of the yellow beet logo with smooth anti-aliasing
    transparent_logo = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    t_pixels = transparent_logo.load()
    s_pixels = src.load()

    # The green channel is the cleanest discriminator: background G~2, yellow G~198
    for y in range(h):
        for x in range(w):
            r, g, b = s_pixels[x, y]
            # Calculate alpha from green channel
            if g <= 10:
                alpha = 0
            elif g >= 160:
                alpha = 255
            else:
                alpha = int(255 * (g - 10) / (160 - 10))

            if alpha > 0:
                # Use smooth blending towards pure Remo yellow
                factor = alpha / 255.0
                out_r = int(yellow_color[0] * factor + r * (1 - factor))
                out_g = int(yellow_color[1] * factor + g * (1 - factor))
                out_b = int(yellow_color[2] * factor + b * (1 - factor))
                t_pixels[x, y] = (out_r, out_g, out_b, alpha)

    # Crop the tight bounding box of the transparent logo
    bbox = transparent_logo.getbbox()
    cropped_logo = transparent_logo.crop(bbox)
    print(f"[logo] Transparent logo bbox: {bbox}, size: {cropped_logo.size}")

    # 3. Save standard full icon (1024x1024) with bordeaux background
    full_icon_1024 = src.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # 4. Generate Adaptive Icon Foreground (1024x1024 transparent, logo scaled to ~600px height inside safe zone)
    target_h = 600
    aspect = cropped_logo.width / cropped_logo.height
    target_w = int(target_h * aspect)
    scaled_logo = cropped_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)

    adaptive_foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    offset_x = (1024 - target_w) // 2
    offset_y = (1024 - target_h) // 2
    adaptive_foreground.paste(scaled_logo, (offset_x, offset_y), scaled_logo)

    # 5. Generate Notification Icon (pure white silhouette on transparent, 96x96)
    notif_canvas = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
    notif_scaled = cropped_logo.resize((int(72 * aspect), 72), Image.Resampling.LANCZOS)
    notif_white = Image.new('RGBA', notif_scaled.size, (255, 255, 255, 0))
    
    # Extract alpha from notif_scaled
    _, _, _, a_channel = notif_scaled.split()
    notif_white.putalpha(a_channel)
    
    n_offset_x = (96 - notif_white.width) // 2
    n_offset_y = (96 - notif_white.height) // 2
    notif_canvas.paste(notif_white, (n_offset_x, n_offset_y), notif_white)

    # 6. Generate Favicon (64x64) and 512x512 Store Icon
    favicon_64 = full_icon_1024.resize((64, 64), Image.Resampling.LANCZOS)
    icon_512 = full_icon_1024.resize((512, 512), Image.Resampling.LANCZOS)

    # 7. Write files to destinations
    os.makedirs('assets/images', exist_ok=True)
    os.makedirs('admin-frontend/public/assets', exist_ok=True)
    os.makedirs('store-assets', exist_ok=True)

    destinations = [
        ('assets/images/logoRemo.png', full_icon_1024),
        ('assets/images/icon.png', full_icon_1024),
        ('assets/images/splash-icon.png', full_icon_1024),
        ('assets/images/logo.png', full_icon_1024),
        ('assets/images/adaptive-icon.png', adaptive_foreground),
        ('assets/images/logo-remo-adaptive-foreground.png', adaptive_foreground),
        ('assets/images/logo-remo-notification.png', notif_canvas),
        ('assets/images/favicon.png', favicon_64),
        ('assets/images/logo-remo-transparent.png', transparent_logo),
        ('admin-frontend/public/assets/logo-remo.png', full_icon_1024),
        ('admin-frontend/public/favicon.ico', favicon_64),
        ('store-assets/play-icon-512.png', icon_512),
    ]

    # Also update admin-frontend/build if it exists
    if os.path.exists('admin-frontend/build/assets'):
        destinations.append(('admin-frontend/build/assets/logo-remo.png', full_icon_1024))
    if os.path.exists('admin-frontend/build'):
        destinations.append(('admin-frontend/build/favicon.ico', favicon_64))

    for path, img_obj in destinations:
        img_obj.save(path, optimize=True)
        print(f"[logo] Saved -> {path} ({img_obj.size}, {img_obj.mode})")

    print("[logo] All logo assets generated successfully!")

if __name__ == '__main__':
    generate_assets()
