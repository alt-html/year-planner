#!/usr/bin/env python3
"""
scripts/lib/pack-ico.py

Pack a multi-resolution ICO file from a set of PNG images.

Usage:
    python3 scripts/lib/pack-ico.py --output path/to/output.ico 16.png 24.png 32.png ...

PNG frames are embedded directly in the ICO container (modern ICO format: Windows Vista+,
all current browsers and OS icon APIs accept this). Frames are written in the order supplied
and should be provided in ascending size order (smallest first).

ICO binary layout
-----------------
ICONDIR (6 bytes):
    idReserved  uint16 LE = 0
    idType      uint16 LE = 1  (1 = ICO, 2 = CUR)
    idCount     uint16 LE = number of images

Per-image ICONDIRENTRY (16 bytes each):
    bWidth      uint8        width in pixels  (0 means 256)
    bHeight     uint8        height in pixels (0 means 256)
    bColorCount uint8        0 for PNG frames (>= 8 bpp)
    bReserved   uint8        0
    wPlanes     uint16 LE    1
    wBitCount   uint16 LE    32  (RGBA)
    dwBytesInRes uint32 LE   byte length of this image's data
    dwImageOffset uint32 LE  byte offset of image data from start of file

Image data follows the full directory (PNG bytes, same order as directory entries).

Validations performed before writing:
    - All input files exist and are non-empty.
    - All input files have valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A).
    - Dimensions are read from each PNG IHDR chunk.

Validations performed on the written output:
    - First 4 bytes match ICO magic (00 00 01 00).
    - Declared image count matches the number of input files.
"""

import argparse
import struct
import sys
from pathlib import Path

ICO_RESERVED = 0
ICO_TYPE_ICO = 1
PNG_MAGIC    = b'\x89PNG\r\n\x1a\n'


def die(phase: str, msg: str) -> None:
    print(f"[{phase}] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def read_png_dimensions(data: bytes) -> tuple:
    """Read width and height from a PNG IHDR chunk (offsets 16-24)."""
    if len(data) < 24:
        return 0, 0
    w = struct.unpack('>I', data[16:20])[0]
    h = struct.unpack('>I', data[20:24])[0]
    return w, h


def pack_ico(output_path: str, png_paths: list) -> None:
    if not png_paths:
        die("package", "No input PNG files provided.")

    images = []
    for p in png_paths:
        fp = Path(p)
        if not fp.exists():
            die("package", f"Input PNG not found: {p}")
        data = fp.read_bytes()
        if len(data) == 0:
            die("package", f"Input PNG is zero bytes: {p}")
        if not data.startswith(PNG_MAGIC):
            die("package", f"Not a valid PNG (bad magic bytes): {p}")
        w, h = read_png_dimensions(data)
        images.append((w, h, data))

    count = len(images)
    # Header: 6 bytes ICONDIR + 16 bytes per entry
    header_bytes = 6 + 16 * count
    offsets = []
    cursor = header_bytes
    for _, _, data in images:
        offsets.append(cursor)
        cursor += len(data)

    out = bytearray()

    # ICONDIR
    out += struct.pack('<HHH', ICO_RESERVED, ICO_TYPE_ICO, count)

    # ICONDIRENTRY for each image
    for (w, h, data), img_offset in zip(images, offsets):
        # bWidth/bHeight: 0 encodes 256 in the ICO spec
        bw = 0 if w >= 256 else w
        bh = 0 if h >= 256 else h
        out += struct.pack('<BBBBHHII',
            bw,          # bWidth
            bh,          # bHeight
            0,           # bColorCount (0 for PNG / >= 8 bpp)
            0,           # bReserved
            1,           # wPlanes
            32,          # wBitCount (RGBA)
            len(data),   # dwBytesInRes
            img_offset,  # dwImageOffset
        )

    # Image data (same order as directory)
    for _, _, data in images:
        out += data

    # Write
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(out)

    # Post-write validation
    written = out_path.read_bytes()
    if written[:4] != b'\x00\x00\x01\x00':
        die("package", f"ICO header validation failed: expected 00000100, got {written[:4].hex()}")
    written_count = struct.unpack('<H', written[4:6])[0]
    if written_count != count:
        die("package", f"ICO entry count mismatch: expected {count}, got {written_count}")

    print(f"[package] OK: ICO written with {count} frames → {output_path}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pack a multi-resolution ICO file from PNG images."
    )
    parser.add_argument('--output', required=True, help='Output .ico file path')
    parser.add_argument('pngs', nargs='+',
                        help='Input PNG files, one per ICO frame, in size order (smallest first)')
    args = parser.parse_args()
    pack_ico(args.output, args.pngs)


if __name__ == '__main__':
    main()
