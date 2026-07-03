from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO = Path(r"C:\Users\felipe\OneDrive\Documents\Financia\Logo\Logo-mejor\financia.png")
OUT_DIR = ROOT / "output"
OUT = OUT_DIR / "afiche-finanzas-saludables-hoy.png"

W, H = 1080, 1920
NAVY = (12, 14, 49)
DEEP = (7, 25, 50)
TEAL = (52, 215, 201)
MINT = (111, 226, 218)
WHITE = (250, 250, 248)
MUTED = (199, 231, 231)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    fonts = Path(r"C:\Windows\Fonts")
    return ImageFont.truetype(str(fonts / name), size=size)


FONT_BLACK = font("arialbd.ttf", 124)
FONT_TITLE = font("arialbd.ttf", 118)
FONT_BIG = font("arialbd.ttf", 92)
FONT_MED = font("arialbd.ttf", 44)
FONT_BODY = font("arial.ttf", 39)
FONT_BODY_BOLD = font("arialbd.ttf", 39)
FONT_SMALL = font("arialbd.ttf", 28)
FONT_TINY = font("arial.ttf", 24)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def make_background() -> Image.Image:
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            diagonal = (x * 0.22 + y * 0.78) / H
            t = max(0, min(1, diagonal))
            base = tuple(lerp(NAVY[i], DEEP[i], min(1, t * 1.25)) for i in range(3))

            glow1 = max(0, 1 - (((x + 190) / 650) ** 2 + ((y - 1380) / 860) ** 2))
            glow2 = max(0, 1 - (((x - 80) / 430) ** 2 + ((y - 520) / 520) ** 2))
            glow = min(1, glow1 * 0.92 + glow2 * 0.42)
            color = tuple(lerp(base[i], TEAL[i], glow) for i in range(3))
            px[x, y] = color

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse((-300, 1190, 620, 2160), fill=(85, 236, 222, 56))
    d.ellipse((660, -250, 1320, 490), fill=(3, 8, 34, 98))
    d.line((110, 0, 980, 1920), fill=(91, 237, 220, 28), width=2)
    overlay = overlay.filter(ImageFilter.GaussianBlur(34))
    return Image.alpha_composite(bg.convert("RGBA"), overlay)


def extract_wordmark() -> Image.Image:
    src = Image.open(LOGO).convert("RGBA")
    alpha = Image.new("L", src.size, 0)
    pix = src.load()
    mask = alpha.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = pix[x, y]
            if a and r > 205 and g > 205 and b > 205:
                mask[x, y] = min(255, int((r + g + b) / 3))

    bbox = alpha.getbbox()
    if not bbox:
        return src

    pad = 6
    x0, y0, x1, y1 = bbox
    crop_box = (max(0, x0 - pad), max(0, y0 - pad), min(src.width, x1 + pad), min(src.height, y1 + pad))
    mark_alpha = alpha.crop(crop_box)
    mark = Image.new("RGBA", mark_alpha.size, WHITE + (0,))
    mark.putalpha(mark_alpha)
    return mark


def centered_text(draw, xy, text, font_obj, fill, spacing=8):
    x, y = xy
    lines = text.split("\n")
    line_heights = []
    widths = []
    for line in lines:
        box = draw.textbbox((0, 0), line, font=font_obj)
        widths.append(box[2] - box[0])
        line_heights.append(box[3] - box[1])
    total_h = sum(line_heights) + spacing * (len(lines) - 1)
    cy = y - total_h / 2
    for line, width, height in zip(lines, widths, line_heights):
        draw.text((x - width / 2, cy), line, font=font_obj, fill=fill)
        cy += height + spacing


def draw_schedule(draw):
    classes = [
        ("01", "Finanzas saludables", "25/06/2026"),
        ("02", "Ahorro inteligente", "02/07/2026"),
        ("03", "Pago deuda efectivo", "09/07/2026"),
        ("04", "Inversiones eficientes", "16/07/2026"),
    ]
    x, y = 92, 1080
    row_w, row_h, gap = 896, 132, 22
    for idx, title, date in classes:
        top = y
        draw.rounded_rectangle(
            (x, top, x + row_w, top + row_h),
            radius=26,
            fill=(13, 28, 55, 232),
            outline=(52, 215, 201, 112),
            width=2,
        )
        draw.ellipse((x + 34, top + 34, x + 98, top + 98), fill=TEAL)
        num_box = draw.textbbox((0, 0), idx, font=FONT_SMALL)
        draw.text(
            (x + 66 - (num_box[2] - num_box[0]) / 2, top + 66 - (num_box[3] - num_box[1]) / 2 - 2),
            idx,
            font=FONT_SMALL,
            fill=NAVY,
        )
        draw.text((x + 130, top + 34), title, font=FONT_BODY_BOLD, fill=WHITE)
        draw.text((x + 130, top + 82), date, font=FONT_BODY, fill=MUTED)
        y += row_h + gap


def main():
    OUT_DIR.mkdir(exist_ok=True)
    img = make_background()
    draw = ImageDraw.Draw(img)

    wordmark = extract_wordmark()
    target_w = 430
    wordmark = wordmark.resize((target_w, int(wordmark.height * target_w / wordmark.width)), Image.Resampling.LANCZOS)
    img.alpha_composite(wordmark, ((W - wordmark.width) // 2, 142))

    pill = (286, 308, 794, 372)
    draw.rounded_rectangle(pill, radius=32, fill=(52, 215, 201, 245))
    label = "HOY | JUEVES 25 JUN 2026"
    box = draw.textbbox((0, 0), label, font=FONT_SMALL)
    draw.text(((W - (box[2] - box[0])) / 2, 325), label, font=FONT_SMALL, fill=NAVY)

    centered_text(draw, (W / 2, 590), "Clase de\nfinanzas\nsaludables", FONT_TITLE, WHITE, spacing=4)
    centered_text(draw, (W / 2, 855), "4 encuentros para ordenar, ahorrar,\npagar deudas e invertir mejor.", FONT_BODY, MUTED, spacing=12)

    draw.text((92, 1000), "Agenda", font=FONT_MED, fill=WHITE)
    draw.text((752, 1012), "Todos los jueves", font=FONT_TINY, fill=MUTED)
    draw_schedule(draw)

    footer = "FinancialA"
    box = draw.textbbox((0, 0), footer, font=FONT_MED)
    draw.text(((W - (box[2] - box[0])) / 2, 1788), footer, font=FONT_MED, fill=WHITE)
    draw.rounded_rectangle((435, 1858, 645, 1868), radius=5, fill=TEAL)

    img.convert("RGB").save(OUT, quality=96)
    print(OUT)


if __name__ == "__main__":
    main()
