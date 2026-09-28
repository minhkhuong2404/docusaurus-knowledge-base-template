import os
import math
from PIL import Image, ImageDraw, ImageFont

def generate_social_preview():
    width = 1200
    height = 630
    
    # 1. Base RGB Image
    img = Image.new("RGB", (width, height), (10, 15, 29))
    draw = ImageDraw.Draw(img)

    # Gradient background from top-left (15, 23, 42) to bottom-right (4, 7, 15)
    for y in range(height):
        ratio_y = y / height
        for x in range(0, width, 4):
            ratio_x = x / width
            mix = (ratio_x + ratio_y) / 2.0
            r = int(14 * (1 - mix) + 4 * mix)
            g = int(22 * (1 - mix) + 7 * mix)
            b = int(42 * (1 - mix) + 15 * mix)
            draw.rectangle([x, y, x + 4, y + 1], fill=(r, g, b))

    # Glow effects (radial circles)
    # Cyan glow top-left
    for r in range(260, 0, -6):
        factor = (1 - r / 260.0) ** 2
        glow_r = int(12 + factor * 25)
        glow_g = int(24 + factor * 50)
        glow_b = int(48 + factor * 90)
        draw.ellipse([100 - r, 100 - r, 100 + r, 100 + r], outline=(glow_r, glow_g, glow_b), width=4)

    # Purple glow bottom-right
    for r in range(240, 0, -6):
        factor = (1 - r / 240.0) ** 2
        glow_r = int(12 + factor * 50)
        glow_g = int(18 + factor * 20)
        glow_b = int(42 + factor * 80)
        draw.ellipse([1100 - r, 530 - r, 1100 + r, 530 + r], outline=(glow_r, glow_g, glow_b), width=4)

    # Subtle tech grid pattern (BEFORE text & cards so lines are underneath)
    for x in range(0, width, 50):
        draw.line([(x, 0), (x, height)], fill=(18, 27, 44), width=1)
    for y in range(0, height, 50):
        draw.line([(0, y), (width, y)], fill=(18, 27, 44), width=1)

    # Outer rounded container
    draw.rounded_rectangle([24, 24, width - 24, height - 24], radius=24, outline=(56, 189, 248), width=2)
    draw.rounded_rectangle([28, 28, width - 28, height - 28], radius=20, outline=(30, 41, 59), width=1)

    # Fonts
    font_title_bold = "/System/Library/Fonts/HelveticaNeue.ttc"
    font_mono = "/System/Library/Fonts/Menlo.ttc"

    title_font = ImageFont.truetype(font_title_bold, 60, index=1) # Bold
    sub_font = ImageFont.truetype(font_title_bold, 24, index=0)
    badge_font = ImageFont.truetype(font_mono, 15, index=1)
    card_title_font = ImageFont.truetype(font_title_bold, 18, index=1)
    card_desc_font = ImageFont.truetype(font_title_bold, 14, index=0)
    foot_url_font = ImageFont.truetype(font_mono, 19, index=1)
    foot_author_font = ImageFont.truetype(font_title_bold, 17, index=0)

    # 2. Category Pill
    badge_text = "// PRINCIPAL ARCHITECTURE & SYSTEMS"
    bx, by = 70, 60
    bw, bh = 400, 34
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=8, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    draw.text((bx + 16, by + 8), badge_text, font=badge_font, fill=(56, 189, 248))

    # 3. Main Title
    draw.text((70, 118), "Engineering Knowledge Base", font=title_font, fill=(255, 255, 255))

    # Gradient line under title
    for i in range(540):
        ratio = i / 540.0
        cr = int(56 * (1 - ratio) + 168 * ratio)
        cg = int(189 * (1 - ratio) + 85 * ratio)
        cb = int(248 * (1 - ratio) + 247 * ratio)
        draw.line([(70 + i, 198), (70 + i, 201)], fill=(cr, cg, cb), width=3)

    # 4. Subtitle / Description
    draw.text((70, 222), "Deep-dive documentation, engine internals & architectural patterns", font=sub_font, fill=(241, 245, 249))
    draw.text((70, 260), "Distributed Systems • JVM Concurrency • SQL Indexing • Kafka & System Design", font=sub_font, fill=(148, 163, 184))

    # 5. Four Feature Cards
    cards = [
        ("Core Java & JVM", "Memory models, GC algorithms & thread coordination", (245, 158, 11)),
        ("SQL & Engine Internals", "B-Tree execution plans, locking & query tuning", (52, 211, 153)),
        ("Distributed Systems", "Kafka pipelines, event streaming & consensus", (56, 189, 248)),
        ("Galactic Arcade", "Outage Boss, Spot The Bug & Architecture Puzzles", (168, 85, 247)),
    ]

    card_w = 250
    card_h = 118
    start_x = 70
    start_y = 345
    gap = 20

    for idx, (head, desc, color) in enumerate(cards):
        cx = start_x + idx * (card_w + gap)
        cy = start_y
        
        # Solid dark Card Background
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=12, fill=(13, 20, 36), outline=color, width=1)
        
        # Color bar on top of card
        draw.rounded_rectangle([cx + 14, cy + 12, cx + 28, cy + 16], radius=2, fill=color)
        
        # Card Header
        draw.text((cx + 14, cy + 26), head, font=card_title_font, fill=(255, 255, 255))
        
        # Card Desc (2 lines)
        words = desc.split(" ")
        line1 = " ".join(words[:4])
        line2 = " ".join(words[4:])
        draw.text((cx + 14, cy + 62), line1, font=card_desc_font, fill=(148, 163, 184))
        draw.text((cx + 14, cy + 86), line2, font=card_desc_font, fill=(100, 116, 139))

    # 6. Footer
    foot_y = 515
    draw.line([(70, foot_y), (width - 70, foot_y)], fill=(30, 41, 59), width=1)

    # Domain
    draw.text((70, foot_y + 24), "https://luminhkhuong.dev", font=foot_url_font, fill=(56, 189, 248))

    # Author
    author_text = "Curated by Khuong Lu • Production Architecture"
    bbox = foot_author_font.getbbox(author_text)
    author_w = bbox[2] - bbox[0]
    draw.text((width - 70 - author_w, foot_y + 24), author_text, font=foot_author_font, fill=(148, 163, 184))

    out_path = "static/img/social-preview.png"
    img.save(out_path, "PNG", quality=95)
    print(f"Generated clean social preview image at: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    generate_social_preview()
