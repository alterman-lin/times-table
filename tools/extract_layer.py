"""
Extract just the "changed" region between a base reference character image
and a variant image (same pose, one clothing item changed) as a standalone
transparent-background layer.

Usage:
    python extract_layer.py <base.png> <variant.png> <output.png> [--threshold 28] [--min-area 400]

    --threshold  per-pixel color distance above which a pixel counts as
                 "changed" (i.e. belongs to the new garment)
    --min-area   connected components smaller than this many pixels are
                 dropped (cleans up JPEG-compression noise so only the real
                 garment region survives)
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def extract_layer(base_path, variant_path, out_path, threshold=28, min_area=400, feather=2):
    base = Image.open(base_path).convert("RGB")
    variant = Image.open(variant_path).convert("RGB")
    if variant.size != base.size:
        variant = variant.resize(base.size, Image.LANCZOS)

    b = np.array(base).astype(np.int32)
    v = np.array(variant).astype(np.int32)

    dist = np.sqrt(((b - v) ** 2).sum(axis=2).astype(np.float64))
    changed = dist > threshold

    labeled, n = ndimage.label(changed, structure=np.ones((3, 3)))
    if n > 0:
        sizes = ndimage.sum(changed, labeled, range(1, n + 1))
        keep_labels = [i + 1 for i, s in enumerate(sizes) if s >= min_area]
        mask = np.isin(labeled, keep_labels)
    else:
        mask = changed

    # close small gaps, then fill any interior holes (e.g. a patch of the
    # garment whose color happened to be close to the base image there) so
    # the garment silhouette is solid, not speckled
    mask = ndimage.binary_closing(mask, structure=np.ones((7, 7)))
    mask = ndimage.binary_fill_holes(mask)

    alpha = (mask.astype(np.uint8) * 255)
    alpha_img = Image.fromarray(alpha)
    if feather > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather))

    out = np.array(variant.convert("RGBA"))
    out[:, :, 3] = np.array(alpha_img)

    Image.fromarray(out).save(out_path)
    kept_pct = 100.0 * mask.sum() / mask.size
    print(f"ok: {out_path} ({base.size[0]}x{base.size[1]}, kept {kept_pct:.1f}% of pixels as the changed layer, {n} raw components)")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("base")
    p.add_argument("variant")
    p.add_argument("output")
    p.add_argument("--threshold", type=float, default=28)
    p.add_argument("--min-area", type=float, default=400)
    p.add_argument("--feather", type=float, default=2)
    args = p.parse_args()
    extract_layer(args.base, args.variant, args.output, args.threshold, args.min_area, args.feather)


if __name__ == "__main__":
    main()
