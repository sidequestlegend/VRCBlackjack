"""Textures the blackjack kit builds from: written into Assets/Kit/Textures (checked in), made from the fork's own
upstream files and from Kenney's Boardgame Pack v2 (CC0).

    python altspace/tools/make_art.py <kenney boardgame pack folder>    (the unzipped pack: it holds PNG/Cards/)

1. CardAtlas.png (2048 x 1024): the 52 faces and one back of Kenney's Boardgame Pack v2 (CC0, www.kenney.nl), replacing
   upstream's uncredited DeckOfCards atlas. Cell i (the port's card type, DeckManager.ts CARD_TYPES order; 52 is the
   back) is column i % 14, row i // 14 of 146 x 256 px cells counted from the top left; the 140 x 190 card sits 3 px in.
   The card shader (Assets/Kit/Shaders/BlackjackCard.shader) uses the same numbers.
2. FeltAlbedo.jpg (2048): upstream's green felt (FiyCsf, Apache-2.0 with the repo) with two changes: the line
   "BLACKJACK PAYS 2 TO 1" is painted out (every win pays 1 to 1 here, as upstream's code does), and the CentauriCore
   logo and handle are painted out (the credit stays on the credits panel and in THIRD-PARTY-NOTICES.md); the same
   areas are painted out of its smoothness map (Table_Surface_Mask.png), where the line also shows as a shine.
3. <Material>_Mask.png: URP Lit masks packed from upstream's maps: metallic in R, occlusion in G, smoothness in A
   (URP reads metallic and smoothness from _MetallicGlossMap, occlusion from G of _OcclusionMap; both point here).
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ALTSPACE = HERE.parent
FORK = ALTSPACE.parent
OUT = ALTSPACE / "Assets" / "Kit" / "Textures"
TEX = FORK / "Meshes" / "Table" / "Textures"

RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"]
SUITS = ["Clubs", "Diamonds", "Hearts", "Spades"]
ACE_SUITS = ["Diamonds", "Clubs", "Hearts", "Spades"]
CELL_W, CELL_H, COLS, PAD = 146, 256, 14, 3
CARD_BACK = "cardBack_red2.png"


def card_atlas(pack: Path) -> None:
    cards = pack / "PNG" / "Cards"
    atlas = Image.new("RGBA", (2048, 1024), (255, 255, 255, 0))
    names = []
    for t in range(52):
        rank = t // 4
        suit = (ACE_SUITS if rank == 12 else SUITS)[t % 4]
        names.append(f"card{suit}{RANKS[rank]}.png")
    names.append(CARD_BACK)
    for i, name in enumerate(names):
        im = Image.open(cards / name).convert("RGBA")
        assert im.size == (140, 190), (name, im.size)
        x, y = (i % COLS) * CELL_W + PAD, (i // COLS) * CELL_H + PAD
        # the card's edge colour runs into the gutter, so mip levels do not bleed white into the corners
        edge = im.resize((140 + 2 * PAD, 190 + 2 * PAD), Image.NEAREST)
        atlas.paste(edge, (x - PAD, y - PAD))
        atlas.paste(im, (x, y))
    atlas.save(OUT / "CardAtlas.png")


def felt_mask() -> np.ndarray:
    """Where the felt carries the "2 TO 1" line and the logo (4096 x 4096, 255 there), read from the green albedo."""
    src = next((TEX / "Surfaces" / "Green").glob("*AlbedoTransparency.png"))
    im = cv2.imread(str(src), cv2.IMREAD_COLOR)  # BGR, 4096
    b, g, r = (im[:, :, k].astype(np.int32) for k in range(3))
    mask = np.zeros(im.shape[:2], np.uint8)
    # the white line "BLACKJACK PAYS 2 TO 1" (the yellow dealer rule below it is kept: it matches the code)
    y0, y1, x0, x1 = 1350, 1800, 950, 3150
    white = (r > 140) & (b > 140) & (g > 140)
    mask[y0:y1, x0:x1][white[y0:y1, x0:x1]] = 255
    # the logo and handle, top right: everything there that is not felt green
    y0, y1, x0, x1 = 0, 260, 3150, 3700
    notfelt = ~((g > r + 25) & (g > b + 5))
    mask[y0:y1, x0:x1][notfelt[y0:y1, x0:x1]] = 255
    return cv2.dilate(mask, np.ones((9, 9), np.uint8))


def felt() -> None:
    src = next((TEX / "Surfaces" / "Green").glob("*AlbedoTransparency.png"))
    im = cv2.imread(str(src), cv2.IMREAD_COLOR)  # BGR, 4096
    mask = felt_mask()
    filled = cv2.inpaint(im, mask, 9, cv2.INPAINT_TELEA)
    # the felt's grain, from a clean patch, laid over the painted-out areas
    patch = im[2600:3000, 2000:2400].astype(np.float32)  # plain felt (the lower middle panel)
    grain = patch - cv2.GaussianBlur(patch, (0, 0), 6)
    h, w = im.shape[:2]
    tiled = np.tile(grain, (h // 400 + 1, w // 400 + 1, 1))[:h, :w]
    soft = cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 3)[:, :, None]
    out = filled.astype(np.float32) + tiled * soft
    out = np.clip(out, 0, 255).astype(np.uint8)
    out = cv2.resize(out, (2048, 2048), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(OUT / "FeltAlbedo.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 92])


def mask(name: str, metallic_smoothness: Path, occlusion: Path, size: int, paint_out: np.ndarray | None = None) -> None:
    ms = Image.open(metallic_smoothness).convert("RGBA")
    if paint_out is not None:
        # the felt's smoothness map carries the same line and logo (they shine): painted out the same way
        arr = np.array(ms)
        for k in range(4):
            arr[:, :, k] = cv2.inpaint(np.ascontiguousarray(arr[:, :, k]), paint_out, 9, cv2.INPAINT_TELEA)
        ms = Image.fromarray(arr, "RGBA")
    ms = ms.resize((size, size), Image.LANCZOS)
    ao = Image.open(occlusion).convert("L").resize((size, size), Image.LANCZOS)
    r, _, _, a = ms.split()
    Image.merge("RGBA", (r, ao, Image.new("L", (size, size), 0), a)).save(OUT / f"{name}_Mask.png")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pack = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    card_atlas(pack)
    felt()
    surf = TEX / "Surfaces"
    mask("Table_Surface", next(surf.glob("*Table_Surface_MetallicSmoothness.png")), surf / "Table_Surface_AmbientOcclusion.png", 1024, felt_mask())
    for name, size in (("Table_Outer", 512), ("Table_ArmRest", 512), ("Table_Hard_Surface", 512), ("Pockets_Outer", 256), ("Pockets_Bottom_Icon", 256)):
        mask(name, TEX / f"{name}_MetallicSmoothness.png", TEX / f"{name}_AmbientOcclusion.png", size)
    for f in sorted(p for p in OUT.glob("*.*") if p.suffix in (".png", ".jpg")):
        print(f"{f.name}: {Image.open(f).size}, {f.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
