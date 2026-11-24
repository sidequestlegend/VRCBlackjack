# Third-party notices: blackjack for Altspace

Written 2026-11-24 with the port. A copy of this file, followed by the font and Kenney licence texts, travels in
every kit bundle (`Assets/Kit/THIRD-PARTY-NOTICES.md`, made by `altspace/tools/make_notices.py`). Nothing has been
released.

## What this covers

The Altspace snippet `blackjack` (proposed slug, not registered) is a port of **VRCBlackjack** by CentauriCore:

- Upstream: https://github.com/Centauri2442/VRCBlackjack, commit `83f05db20b3bb60d1fa38767d0d4839b857b20fd`
  (2025-04-30; last code change `71fff93`, "v1.0.4", 2022-11-14).
- Licence: Apache License, Version 2.0. The full text is at the end of this file and in `LICENSE` at the root of
  the fork. Upstream has **no NOTICE file**, so section 4(d) of the licence has nothing to carry; this port adds
  none.
- The port's code is under the same licence. It is not affiliated with or endorsed by CentauriCore, and does not
  use the names "VRCBlackjack", "CentauriCore" or "Centauri" except to say where it comes from (licence section 6).

What is distributed, and where the obligations are met:

| Form | Licence copy (4(a)) | Change notice (4(b)) | Retained notices (4(c)) |
|---|---|---|---|
| The fork (source) | `LICENSE` at the root, unchanged | this file; `altspace/PORT.md` sections "Status" and 10 | upstream files untouched on the `altspace` branch; notices repeated below |
| `altspace/ts/src/*.ts` (translated source) | `LICENSE`; the notice in `src/notice.ts` | every file's header: "Translated from Scripts/<file>.cs ... changed for the Altspace port" | `src/notice.ts` holds upstream's copyright notice; each file's header names it |
| `pk-blackjack.js` (built script, object form) | a link in its banner (`script-header.txt`), and this file in the fork | the banner says it was translated and changed, and where the changes are listed | the banner carries "Copyright 2022 CentauriCore" and the licence notice |
| The kit bundles (object form) | this file with the full licence text, as a text asset in each bundle | "Changes made" below, in the same text asset | the in-world credits panel (copyright line, credits, licence, where the changes are listed) and the same text asset |
| In the world | the credits panel at the back of the table names the licence and its address | it says the port was changed and how | it carries "Copyright 2022 CentauriCore" and every credit |

## Notices retained from upstream

The copyright notice, as in upstream's `README.md:52-62` and `README.txt:42-52`:

```
Copyright 2022 CentauriCore

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

The same notice heads these upstream files: `Scripts/DeckManager.cs`, `DisableFixer.cs`, `DistanceOptimizer.cs`,
`Interactable.cs`, `InteractableController.cs`, `Player.cs`, `PlayerDebug.cs`, `PlayerDeck.cs`,
`PlayerUIController.cs` and `Editor/BlackjackWorldControllerEditor.cs`. `AudioController.cs`,
`BlackjackWorldController.cs`, `ChipController.cs`, `Controller.cs`, `Dealer.cs` and `DealerUIController.cs` carry
no header; their translations carry the notice all the same.

Credits, as upstream's `README.md:46-49` gives them:

- Centauri: developer
- Sentinel373: blackjack table mesh
- FiyCsf: table textures
- Three Ribbon Studios: audio

## Changes made (licence section 4(b))

### Code

The UdonSharp (C#) game code was translated to TypeScript on the portkit runtime and changed. File by file:

| Port file | From upstream | Changed |
|---|---|---|
| `src/DeckManager.ts` | `Scripts/DeckManager.cs`, plus `GetUnusedCardIndex` from `PlayerDeck.cs:199-261` and `Dealer.cs:233-295` | counts follow from the cards in state; draws start from a dealt draw every seated player contributes to (portkit `beginDeal`); the two of clubs no longer has 999 copies |
| `src/PlayerDeck.ts` | `Scripts/PlayerDeck.cs` | cards held in state; the 583 generated event handlers removed; totals scored from the hand's cards |
| `src/Dealer.ts` | `Scripts/Dealer.cs` | the hole card hidden by commit and reveal; the dealer's play is a step on a shared clock; the 583 generated handlers removed |
| `src/Player.ts` | `Scripts/Player.cs` | presses become commands checked by a referee; split aces scored correctly; split hands paid at the round's bet |
| `src/Controller.ts` | `Scripts/Controller.cs` | the round is state with a schedule on a shared clock; the table owner is a field; a reset frees every seat |
| `src/ChipController.ts` | `Scripts/ChipController.cs` | one balance per page; the table is a key instead of an index |
| `src/AudioController.ts` | `Scripts/AudioController.cs` | clips are indices; the source stays at the table; sounds fire from state |
| `src/PlayerUIController.ts` | `Scripts/PlayerUIController.cs` | animators driven from state through a relay graph |
| `src/DealerUIController.ts` | `Scripts/DealerUIController.cs` | toggles follow state; the height slider is two buttons; the dealer's card slots added |
| `src/Interactable.ts` | `Scripts/Interactable.cs` | pressed by a click instead of a fingertip |
| `src/InteractableController.ts` | `Scripts/InteractableController.cs` | gated by the table's range; field `Player` renamed `Seat` |
| `src/DistanceOptimizer.ts` | `Scripts/DistanceOptimizer.cs` | head distance instead of a trigger sphere |
| `src/DisableFixer.ts` | `Scripts/DisableFixer.cs` | runs when the snippet element leaves the page |
| `src/BlackjackWorldController.ts` | `Scripts/BlackjackWorldController.cs` | reads the snippet element's attributes |
| `golden/upstream/Extracted.cs` (generated, test only, not shipped) | rule methods of `DeckManager.cs`, `PlayerDeck.cs`, `Dealer.cs`, `Player.cs`, `ChipController.cs`, `Controller.cs`, copied verbatim | wrapped in partial classes and compiled against stubs to make test vectors |

Not translated: `Scripts/PlayerDebug.cs` (an inactive debug panel) and `Editor/BlackjackWorldControllerEditor.cs`
(its job goes to the kit builder). The full list of behaviour changes, with reasons, is in `altspace/PORT.md`:
the "Status" section (Q1 to Q21, D1 to D10) and section 10 (C1 to C22, L1 to L9).

### Assets

Made by `altspace/Assets/Kit/Editor/BlackjackKitBuilder.cs` (new file) and `altspace/tools/make_art.py` (new file)
from the fork's own files. The kit prefab `blackjack.prefab` is one table of upstream's `Prefabs/Internal DO NOT
TOUCH/Blackjack.prefab` (with its seven `Player 0.prefab` seats) and the chip controller of `Prefabs/Blackjack
System.prefab`, changed as follows:

- **Felt** (`Meshes/Table/Textures/Surfaces/Green/..._Table_Surface_AlbedoTransparency.png`, FiyCsf): the line
  "BLACKJACK PAYS 2 TO 1" painted out (every win pays 1 to 1, as upstream's code pays), and the CentauriCore logo and
  handle painted out (the credit stays on the credits panel and here); reduced to 2048 px
  (`Assets/Kit/Textures/FeltAlbedo.jpg`).
- **Table textures**: reduced to 512 to 2048 px for Quest (ASTC 6x6 on Android); metallic, smoothness and occlusion
  packed into one mask per material (`Assets/Kit/Textures/*_Mask.png`).
- **Materials**: upstream's six Standard-shader table materials remade as URP Lit; the card material remade with a
  new shader (`Assets/Kit/Shaders/BlackjackCard.shader`, written for the port).
- **Cards**: upstream's card model and atlas (`Meshes/DeckOfCards/`) carry no credit or licence anywhere and their
  origin could not be established, so they are **not shipped**: the kit draws cards with two generated quads
  (`Assets/Kit/Meshes/`) and an atlas made from Kenney's Boardgame Pack v2 (below). The card prefabs' animator
  controller (`Animations/Card Zoom In.controller`) and clips are upstream's.
- **Fonts**: upstream's Arcane Nine, Roman Gradient and Riesling are **not shipped** (no licence); the texts use
  Cinzel, Cinzel Decorative and Limelight (OFL, below) and Liberation Sans.
- **Prefab**: the per-seat debug panels, the inactive particle popups, the overhead camera and its screen, and the
  trigger volumes removed; a card slot at each of the 165 card positions instead of cards instantiated at run time;
  every button given a click box; the dealer-height slider replaced by two buttons; seat 0's dealer panel given the
  missing height constraint; the two missing "your turn" sprites replaced by upstream's `UI/Circle.png`; a credits
  panel added; VRChat components and the scripts removed (the behaviour is in the script).
- **Left out**: the blue, purple and red felts, `DeckOfCards.png`, the six Quest materials, unreferenced clips,
  controllers and fonts, the inspector logo.

## Third-party material shipped with the kit

| Material | Author | Licence | Source | Replaces |
|---|---|---|---|---|
| Card faces and back (`Assets/Kit/Textures/CardAtlas.png`, made from `PNG/Cards/*.png`) | Kenney (www.kenney.nl), Boardgame Pack v2 | CC0 1.0 (the pack's `license.txt`, copied to `Assets/Kit/Textures/Kenney-Boardgame-Pack-License.txt`) | https://kenney.nl/assets/boardgame-pack (downloaded 2026-11-24) | `Meshes/DeckOfCards/DeckOfCardsMarked.png` and `DeckOfCards.fbx` (no credit) |
| Cinzel (`Assets/Kit/Fonts/Cinzel.ttf`) | The Cinzel Project Authors (Natanael Gama) | SIL Open Font License 1.1 (`Cinzel-OFL.txt`) | https://github.com/google/fonts/tree/main/ofl/cinzel | Arcane Nine (labels) |
| Cinzel Decorative Bold (`Assets/Kit/Fonts/CinzelDecorative-Bold.ttf`) | Natanael Gama, Reserved Font Name "Cinzel" | SIL OFL 1.1 (`CinzelDecorative-OFL.txt`) | https://github.com/google/fonts/tree/main/ofl/cinzeldecorative | Roman Gradient (Bust, Win, Draw, Lost) |
| Limelight (`Assets/Kit/Fonts/Limelight-Regular.ttf`) | Sorkin Type Co, Reserved Font Name "Limelight" | SIL OFL 1.1 (`Limelight-OFL.txt`) | https://github.com/google/fonts/tree/main/ofl/limelight | Riesling (Hit Me, Stand, Split) |
| Sounds (`Assets/Kit/Audio/card-*.ogg`, `chip*.ogg`: 24 files) | Kenney (www.kenney.nl), Casino Audio 1.1 | CC0 1.0 (`Assets/Kit/Audio/Kenney-Casino-Audio-License.txt`) | https://kenney.nl/assets/casino-audio (downloaded 2026-11-24) | upstream's deal, flip, shuffle, split and chip clips (`Audio/Cards`, `Audio/Chips`) |
| Sounds (`Assets/Kit/Audio/click_*`, `confirmation_*`, `error_*`, `question_001`, `tick_001`, `drop_002`: 9 files) | Kenney (www.kenney.nl), Interface Sounds | CC0 1.0 (`Assets/Kit/Audio/Kenney-Interface-Sounds-License.txt`) | https://kenney.nl/assets/interface-sounds (downloaded 2026-11-24) | upstream's UI, bleep, win, lose, draw, bust and new-round clips (`Audio/Additional Sounds`, `Random UI_*`) |
| Liberation Sans (TextMesh Pro's default asset) | Red Hat | SIL OFL 1.1 | TextMesh Pro essentials | upstream's copy of the same font |

The font assets in the bundle hold static atlases baked from these fonts (a modified version under the OFL; the
reserved names are not used for them).

## Not covered by the Apache licence

- **Audio**: upstream's 97 clips (credited to Three Ribbon Studios; sample-library names, origin not verifiable from the
  repo) are **not shipped**; the kit uses Kenney's CC0 sounds (table above).
- **Table model** (Sentinel373) and **table textures** (FiyCsf): credited upstream, covered only by the repository's
  licence and the credit.

## Apache License, Version 2.0 (copied from the fork's LICENSE)

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

## Cinzel: SIL Open Font License 1.1

```
Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Cinzel Decorative: SIL Open Font License 1.1

```
Copyright (c) 2012 Natanael Gama (info@ndiscovered.com), with Reserved Font Name 'Cinzel'

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Limelight: SIL Open Font License 1.1

```
Copyright (c) 2011 by Sorkin Type Co (www.sorkintype.com),
with Reserved Font Name "Limelight".

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Kenney, Boardgame Pack v2 (card art): licence

```
Boardgame pack v2 by Kenney Vleugels (www.kenney.nl)

	------------------------------

	CC0 License (Creative Commons Zero)
	http://creativecommons.org/publicdomain/zero/1.0/

	You may use these graphics in personal and commercial projects.
	Credit (Kenney or www.kenney.nl) would be nice but is not mandatory.

	------------------------------

	More information:
	www.kenney.nl
```

## Kenney, Casino Audio (sounds): licence

```
Casino Audio (1.1)

	by  Kenney Vleugels (Kenney.nl)

			------------------------------

	License (Creative Commons Zero, CC0)
	http://creativecommons.org/publicdomain/zero/1.0/

	You may use these assets in personal and commercial projects.
	Credit (Kenney or www.kenney.nl) would be nice but is not mandatory.

			------------------------------

	Donate:   http://support.kenney.nl
	Request:  http://request.kenney.nl

	Follow on Twitter for updates:
	@KenneyNL
```

## Kenney, Interface Sounds (sounds): licence

```
Interface Sounds (1.0)

	Created/distributed by Kenney (www.kenney.nl)
	Creation date: 11-02-2020

			------------------------------

	License: (Creative Commons Zero, CC0)
	http://creativecommons.org/publicdomain/zero/1.0/

	This content is free to use in personal, educational and commercial projects.

	Support us by crediting Kenney or www.kenney.nl (this is not mandatory)

			------------------------------

	Donate:   http://support.kenney.nl
	Patreon:  http://patreon.com/kenney/

	Follow on Twitter for updates:
	http://twitter.com/KenneyNL
```
