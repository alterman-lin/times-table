"""
Background removal for flat-illustration character art (e.g. Gemini-generated
PNGs on a solid white background).

Approach: flood-fill the near-white region starting from the image border
(so only the connected *background* is removed, not white pixels that are
part of the character itself, like a white shirt or an eye highlight), then
soften the cut edge with a partial-alpha ramp based on distance-from-white so
edges don't look hard-jagged.

Usage:
    python bg_remove.py <input.png> <output.png> [--bg 255,255,255] [--hard 12] [--soft 55]

    --bg    background color to key out, as R,G,B (default: 255,255,255 = white)
    --hard  pixels within this color-distance of --bg are fully transparent
    --soft  pixels beyond this color-distance are fully opaque; pixels between
            --hard and --soft get a linear alpha ramp (only within the
            flood-filled background region's edge band)
"""
import sys
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage


def remove_background(in_path, out_path, bg=(255, 255, 255), hard=12, soft=55):
    img = Image.open(in_path).convert("RGBA")
    arr = np.array(img).astype(np.int32)
    rgb = arr[:, :, :3]
    bg_arr = np.array(bg, dtype=np.int32)

    dist = np.sqrt(((rgb - bg_arr) ** 2).sum(axis=2).astype(np.float64))

    near_bg = dist <= soft
    labeled, _ = ndimage.label(near_bg, structure=np.ones((3, 3)))

    h, w = near_bg.shape
    border_labels = set(labeled[0, :]) | set(labeled[-1, :]) | set(labeled[:, 0]) | set(labeled[:, -1])
    border_labels.discard(0)

    bg_mask = np.isin(labeled, list(border_labels))

    alpha = arr[:, :, 3].astype(np.float64)
    ramp = np.clip((dist - hard) / max(soft - hard, 1e-6), 0.0, 1.0)
    new_alpha = np.where(bg_mask, alpha * ramp, alpha)

    out = arr.copy()
    out[:, :, 3] = np.clip(new_alpha, 0, 255).astype(np.uint8)

    Image.fromarray(out.astype(np.uint8)).save(out_path)
    removed_pct = 100.0 * bg_mask.sum() / (h * w)
    print(f"ok: {out_path} ({w}x{h}, background pixels flagged: {removed_pct:.1f}%)")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--bg", default="255,255,255")
    p.add_argument("--hard", type=float, default=12)
    p.add_argument("--soft", type=float, default=55)
    args = p.parse_args()
    bg = tuple(int(x) for x in args.bg.split(","))
    remove_background(args.input, args.output, bg=bg, hard=args.hard, soft=args.soft)


if __name__ == "__main__":
    main()
