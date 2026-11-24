"""Assets/Kit/THIRD-PARTY-NOTICES.md, the copy of the notices that travels inside each kit bundle: altspace/THIRD-PARTY-NOTICES.md
(with the Apache License 2.0 text) followed by the licence texts of the fonts and of Kenney's packs.

    python altspace/tools/make_notices.py
"""
from pathlib import Path

ALT = Path(__file__).resolve().parent.parent
KIT = ALT / "Assets" / "Kit"
parts = [(ALT / "THIRD-PARTY-NOTICES.md").read_text(encoding="utf-8")]
for title, path in [
    ("Cinzel: SIL Open Font License 1.1", KIT / "Fonts" / "Cinzel-OFL.txt"),
    ("Cinzel Decorative: SIL Open Font License 1.1", KIT / "Fonts" / "CinzelDecorative-OFL.txt"),
    ("Limelight: SIL Open Font License 1.1", KIT / "Fonts" / "Limelight-OFL.txt"),
    ("Kenney, Boardgame Pack v2 (card art): licence", KIT / "Textures" / "Kenney-Boardgame-Pack-License.txt"),
    ("Kenney, Casino Audio (sounds): licence", KIT / "Audio" / "Kenney-Casino-Audio-License.txt"),
    ("Kenney, Interface Sounds (sounds): licence", KIT / "Audio" / "Kenney-Interface-Sounds-License.txt"),
]:
    parts.append(f"\n## {title}\n\n```\n{path.read_text(encoding='utf-8', errors='replace').strip()}\n```\n")
(KIT / "THIRD-PARTY-NOTICES.md").write_text("".join(parts), encoding="utf-8")
print("wrote", KIT / "THIRD-PARTY-NOTICES.md")
