"""Assets/Kit/THIRD-PARTY-NOTICES.md, the copy of the notices that travels inside each kit bundle: altspace/THIRD-PARTY-NOTICES.md
(with the Apache License 2.0 text) followed by the licence texts of the fonts, of Kenney's packs and of the portkit runtime.
The same licence texts are also packed as files (Assets/Kit/Licenses/, and TextMesh Pro's Liberation Sans OFL, which the
kit adds itself).

    python altspace/tools/make_notices.py
"""
from pathlib import Path

ALT = Path(__file__).resolve().parent.parent
KIT = ALT / "Assets" / "Kit"
LIC = KIT / "Licenses"
parts = [(ALT / "THIRD-PARTY-NOTICES.md").read_text(encoding="utf-8")]
for title, path in [
    ("Cinzel: SIL Open Font License 1.1", LIC / "Cinzel-OFL.txt"),
    ("Cinzel Decorative: SIL Open Font License 1.1", LIC / "CinzelDecorative-OFL.txt"),
    ("Limelight: SIL Open Font License 1.1", LIC / "Limelight-OFL.txt"),
    ("Liberation Sans: SIL Open Font License 1.1 (TextMesh Pro's copy)", ALT / "Assets" / "TextMesh Pro" / "Fonts" / "LiberationSans - OFL.txt"),
    ("Kenney, Boardgame Pack v2 (card art): licence", LIC / "Kenney-Boardgame-Pack-License.txt"),
    ("Kenney, Casino Audio (sounds): licence", LIC / "Kenney-Casino-Audio-License.txt"),
    ("Kenney, Interface Sounds (sounds): licence", LIC / "Kenney-Interface-Sounds-License.txt"),
    ("portkit runtime (in the script pk-blackjack.js): MIT License", LIC / "portkit-MIT.txt"),
]:
    parts.append(f"\n## {title}\n\n```\n{path.read_text(encoding='utf-8', errors='replace').strip()}\n```\n")
(KIT / "THIRD-PARTY-NOTICES.md").write_text("".join(parts), encoding="utf-8")
print("wrote", KIT / "THIRD-PARTY-NOTICES.md")
