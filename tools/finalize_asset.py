"""
Shrink + palette-quantize a background-removed RGBA character PNG down to
production size, keeping transparency and avoiding visible banding.

Usage:
    python finalize_asset.py <input.png> <output.png> [--width 282] [--height 420] [--colors 160]
"""
import argparse
from PIL import Image


def finalize(in_path, out_path, width=282, height=420, colors=160):
    img = Image.open(in_path).convert("RGBA")
    img = img.resize((width, height), Image.LANCZOS)
    quantized = img.quantize(colors=colors, method=Image.FASTOCTREE)
    quantized.save(out_path)
    import os
    size_kb = os.path.getsize(out_path) / 1024
    print(f"ok: {out_path} ({width}x{height}, {colors} colors, {size_kb:.1f}KB)")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--width", type=int, default=282)
    p.add_argument("--height", type=int, default=420)
    p.add_argument("--colors", type=int, default=160)
    args = p.parse_args()
    finalize(args.input, args.output, args.width, args.height, args.colors)


if __name__ == "__main__":
    main()
