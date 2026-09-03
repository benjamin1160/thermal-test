"""Generate the placeholder image pair used by the thermal magnifier demo.

Renders one synthetic room twice from the same geometry: once with ordinary
albedo colours (public/room.png) and once as an infrared false-colour map of a
per-object temperature (public/room-thermal.png). Swap both files for a real
photo pair and the component needs no changes.

Usage: python3 scratch/make_placeholders.py
"""

import math
import struct
import zlib

W, H = 1200, 800

# (x0, y0, x1, y1, (r, g, b) albedo, temperature 0..1)
SCENE = [
    (0.00, 0.00, 1.00, 1.00, (228, 220, 205), 0.34),  # back wall
    (0.00, 0.00, 1.00, 0.14, (240, 236, 228), 0.26),  # ceiling
    (0.00, 0.58, 1.00, 1.00, (198, 154, 100), 0.46),  # wood floor
    (0.02, 0.18, 0.22, 0.60, (176, 198, 222), 0.06),  # cold window
    (0.24, 0.20, 0.44, 0.56, (236, 232, 224), 0.30),  # shutters
    (0.50, 0.30, 0.70, 0.58, (208, 198, 186), 0.38),  # fireplace surround
    (0.54, 0.40, 0.66, 0.55, (255, 236, 176), 0.98),  # fire
    (0.76, 0.10, 1.00, 0.52, (104, 66, 44), 0.32),    # upper cabinets
    (0.76, 0.56, 1.00, 1.00, (104, 66, 44), 0.34),    # lower cabinets
    (0.80, 0.50, 0.94, 0.58, (60, 58, 58), 0.86),     # coffee maker
    (0.12, 0.62, 0.68, 0.72, (226, 214, 196), 0.30),  # counter top
    (0.14, 0.72, 0.66, 0.99, (48, 48, 54), 0.24),     # island cabinetry
    (0.60, 0.76, 0.72, 0.84, (176, 132, 88), 0.62),   # stool
]

LAMPS = [(0.29, 0.26), (0.38, 0.24), (0.47, 0.22)]
LAMP_R = 0.022


def cover(x, y, rect):
    x0, y0, x1, y1 = rect
    return x0 * W <= x < x1 * W and y0 * H <= y < y1 * H


def shade(x, y):
    """Return (albedo, temperature) for one pixel, topmost object wins."""
    colour, temp = (0, 0, 0), 0.3
    for x0, y0, x1, y1, c, t in SCENE:
        if cover(x, y, (x0, y0, x1, y1)):
            colour, temp = c, t

    for lx, ly in LAMPS:
        d = math.hypot(x / W - lx, (y / H - ly) * H / W)
        if d < LAMP_R:
            colour, temp = (255, 244, 214), 0.95
        elif d < LAMP_R * 2.4:  # glow falloff
            k = 1 - (d - LAMP_R) / (LAMP_R * 1.4)
            colour = tuple(round(c + (255 - c) * k * 0.55) for c in colour)
            temp += (0.95 - temp) * k * 0.8

    # floor boards and cabinet doors, so edges survive the false-colour pass
    if y > 0.58 * H and (y // 26) % 2 == 0:
        colour = tuple(round(c * 0.94) for c in colour)
    if x > 0.76 * W and (x // 60) % 2 == 0:
        colour = tuple(round(c * 0.9) for c in colour)

    # soft vignette + a touch of grain so it does not read as flat vector art
    v = 1 - 0.22 * math.hypot(x / W - 0.5, y / H - 0.5)
    g = ((x * 7 + y * 13) % 11 - 5) * 0.004
    colour = tuple(max(0, min(255, round(c * v + c * g))) for c in colour)
    return colour, max(0.0, min(1.0, temp + g))


THERMAL = [(28, 8, 96), (24, 74, 208), (26, 176, 206), (118, 214, 92),
           (246, 212, 62), (250, 138, 40), (232, 54, 38)]


def ramp(t, stops):
    t = max(0.0, min(1.0, t)) * (len(stops) - 1)
    i = min(int(t), len(stops) - 2)
    f = t - i
    a, b = stops[i], stops[i + 1]
    return [round(a[k] + (b[k] - a[k]) * f) for k in range(3)]


def write_png(path, rows):
    raw = b"".join(b"\x00" + bytes(row) for row in rows)

    def chunk(tag, data):
        body = tag + data
        return (struct.pack(">I", len(data)) + body
                + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF))

    header = struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n"
                + chunk(b"IHDR", header)
                + chunk(b"IDAT", zlib.compress(raw, 9))
                + chunk(b"IEND", b""))


normal_rows, thermal_rows = [], []
for y in range(H):
    normal_row, thermal_row = [], []
    for x in range(W):
        colour, temp = shade(x, y)
        normal_row += list(colour)
        thermal_row += ramp(temp, THERMAL)
    normal_rows.append(normal_row)
    thermal_rows.append(thermal_row)

write_png("public/room.png", normal_rows)
write_png("public/room-thermal.png", thermal_rows)
print("wrote public/room.png and public/room-thermal.png")
