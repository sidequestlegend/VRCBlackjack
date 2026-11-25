# Blackjack: port notes

Written 2026-11-24 from a read of the upstream sources, prefab YAML and asset files. The two status sections below
were added later: the rules port to TypeScript, tested in Node (2026-11-24), then the Unity kit and the editor rungs 2
to 4 (2026-11-24 and 25, evidence in `altspace/TESTS.md`). Nothing has run in the Altspace app or on a Quest.
Statements marked **(reading)** are conclusions from reading code that was not executed. Where something could not be
determined, it says so.

Paths are relative to the fork root `C:\workspace\AltspaceGames\blackjack\` at upstream commit `83f05db`.
Short names used below:

- `B.prefab` = `Prefabs/Internal DO NOT TOUCH/Blackjack.prefab` (one table, 15,083 lines)
- `P0.prefab` = `Prefabs/Internal DO NOT TOUCH/Player 0.prefab` (one seat, 42,869 lines)
- `S.prefab` = `Prefabs/Blackjack System.prefab` (entry prefab, 347 lines)
- "table owner" = the player who owns the `Controller`, `Dealer` and `Deck` objects (upstream's dealer role)
- "holder" = the player who has taken a seat

Contents: Status of the port · 1 Upstream at a glance · 2 Feature checklist · 3 State and messages · 4 Platform-call census ·
5 Object model · 6 Assets · 7 Translation map · 8 Snippet design · 9 Test plan · 10 Changed, left out,
risks and questions.

## Status: the Unity kit and the editor rungs (2026-11-24 and 25)

Rungs 0 to 4 pass in the Unity editor; `altspace/TESTS.md` has the evidence and how to run each again. Re-run on
2026-11-25 after the re-sync to portkit `812f285` and the fixes for the independent review (`REVIEW-FINDINGS.md`,
blackjack: the deal check, licences, notices, docs), and again after the re-sync to portkit **`c971100`** (third
pass, below).

**Third pass (portkit `c971100`).** `DeckManager` checks the deal with the kit's `checkDeal` (`verifyDeal` now returns
null for a deal a page cannot check): `solo` and `unknown` are shown as not checkable, `failed` as a failed check,
and `pending` is checked again later. Removed workaround: the game's guess that a mismatch involving a contributor
this page never saw meant "cannot check" (the kit now says `unknown` itself; Node test 32 and the rung-4 reload
check pass on it). `stage.StartOff` on `Dealer Camera/Dealer Card Canvas`: the photo no longer shows its empty
dark-green box. Newly verified: the reloaded page's "cannot check" in Play mode comes from the kit; `dist/` carries the
licence texts (`dist/licenses/blackjack/`, nine files); the footprint counts the world-space uGUI (3.95 x 1.70 x
2.19 m). Results: 38 of 38 in Node, rung 2 PASS (bindings `dacc020a...`), rung 3 21 of 21 (a bust round) then 22 of 22, rung 4 39 of
39 twice, 0 console errors. Bundles: Android 7,324,341 bytes, Windows 9,034,677 (were 7,320,545 and 9,024,863).

| Rung | Result |
|---|---|
| 0/1 static and Node | `npm test`: typecheck and lint clean, 38 of 38 (16 golden-vector and rule tests, 22 scenarios, among them the forged-hand and forged-contributor tests) |
| 2 `PortKit/Kit/Check` | 0 disallowed graph nodes; 869 bindings resolve (hash `dacc020a...` since `c971100`); Android 7,153 KiB and Windows 8,823 KiB since `c971100` (7,149 and 8,813 before), both PASS, notices and licence texts inside |
| 3 Play mode, one player | 22 of 22, twice in a row (third pass: 21 of 21 in a bust round, then 22 of 22), 0 console errors: seat, bet, deal, hit, stand, the flip, result, chips, the deal shown as not checkable (one player who is also the referee) on the table, and the credits panel, through the desktop player's mouse |
| 4 two Local Multiplayer players | 39 of 39, twice in a row (again in the third pass), 0 console errors: both seated, a full round checked the new way on both pages and shown on the table, the hole card unreadable on both pages before the flip, a guest reload mid-hand in round 2 (same table, same digest at equal `version()`, hole card unreadable on the reloaded page too, the reloaded page saying it cannot check that deal), digests and views equal at the end |

Artifacts: `PortKit/Kit/Take Photos` and `PortKit/Kit/Export Artifacts` wrote `altspace/dist/` (not committed): both
bundles, `pk-blackjack.js`, `blackjack.jpg`, `blackjack.snippet.html` and `manifest.json` (both checks PASS). The
Play-mode runs loaded these same files, identified by their sha1 (TESTS.md).

### Kit as built (`Assets/Kit/Editor/BlackjackKitBuilder.cs`)

- **Source:** one table of upstream's `Blackjack.prefab` (with its seven `Player 0.prefab` seats) and the chip
  controller of `Blackjack System.prefab`, copied as upstream's custom inspector did. The importer config is
  `upstream_import.json`; no upstream C# is compiled (stand-in scripts are stripped: 267).
- **Removed:** the per-seat debug panels (L1), the particle popups (L2) and the overhead camera and its screen (K9,
  F56), 22 objects in all; the trigger volumes (C10: range is head distance). The touch boxes became click boxes (L5).
- **Cards (C5):** a slot at each of the 165 card positions (7 seats x 2 hands x 11, plus 11 for the dealer). Each slot
  has upstream's `Card Zoom In` animator over two new quads, and its face is chosen per renderer by the material float
  `_CardIndex` (0 to 51; -1 is the back, for the hole card) from an atlas made from Kenney's CC0 Boardgame Pack. The
  shader is new (`Assets/Kit/Shaders/BlackjackCard.shader`). The faces read correctly after one fix in rung 3: they
  had been mirrored.
- **Clicks (F65):** every one of the 115 buttons is a click box on the UI layer (layer 5); uGUI raycasters and
  persistent calls are stripped. The dealer-height slider is two buttons (C12, F49). A credits panel on the dealer
  canvas the players read opens and closes for the viewer.
- **Materials and textures (C15, C22):** six table materials remade as URP Lit, with URP's own keyword setup.
  Textures are 512 to 2048 px (ASTC 6x6 on Android); metallic, smoothness and occlusion are packed into one mask per
  material. The felt has the "BLACKJACK PAYS 2 TO 1" line (K2) and the CentauriCore logo painted out, both in the
  albedo and, after rung 3, in the smoothness map too.
- **Fonts (K1):** 176 texts moved from the unlicensed Arcane Nine, Roman Gradient and Riesling to Cinzel, Cinzel
  Decorative and Limelight (OFL), plus Liberation Sans.
- **Sounds (K8):** upstream's 97 clips are not shipped. 31 Kenney CC0 sounds (Casino Audio, Interface Sounds) are
  on the table's audio source.
- **Q14:** seat 0's dealer panel was given its missing height constraint. **Q19:** the two missing "your turn"
  sprites became upstream's `UI/Circle.png`.
- **Bindings:** `ts/bindings.json` is real (hash `b3d4ca74e481132f555e2917343de28c3ec5a686`): 1,872 objects, 867
  bound (115 clickable), 546 refs, 115 behaviours, 44 events. 445 upstream fields the port does not read are left out,
  as are the deck's 52 card-prefab references (cards are slots now). The keys and behaviour ids are the ones the
  Node tests use, and the tests pass on this file.
- **Relay graph:** the kit's standard ops only. It has 519 units, 207 control and 518 value connections, and 49
  members, all on the SDK's allow list.

**Click boxes over uGUI buttons (R2), measured.** The kit was built both ways. With the 41 seat and table buttons as
uGUI `uiButton` events, the relay graph has 1,011 units (248 control, 928 value connections, 41 relayed events) and
546,558 bytes. With click boxes it has 519 units and 289,524 bytes. Click boxes were chosen: the graph is half the
size, and no relayed event runs through every instance's graph on each press. Spike S6's finding that uGUI is
clickable only from the side it is read from, and needs a GraphicRaycaster, also no longer applies.

Art replacements, with sources and licences, are in `THIRD-PARTY-NOTICES.md` ("Third-party material shipped with
the kit"), with each licence file kept beside the asset: the card atlas (Kenney Boardgame Pack v2, CC0),
the three fonts (Google Fonts, OFL 1.1) and 31 sounds (22 from Kenney Casino Audio, 9 from Interface Sounds, CC0). The notices said 24 Casino Audio files; there are 22. `THIRD-PARTY-NOTICES.md` is corrected, but the copy inside the current bundles (`Assets/Kit/THIRD-PARTY-NOTICES.md`, from `tools/make_notices.py`) still says 24 until the next kit build.

### Left out in the kit, beyond 10.2

| # | Left out | Reason |
|---|---|---|
| L10 | Upstream's card model and atlas (`Meshes/DeckOfCards/`) | no credit or licence anywhere in the repo; replaced (above) |
| L11 | Upstream's 97 audio clips | sample-library origin not verifiable (K8); replaced by Kenney CC0 sounds, fewer and different |
| L12 | Arcane Nine, Roman Gradient, Riesling | no licence (K1); replaced by OFL fonts |
| L13 | The overhead dealer screen (F56) | K9: an extra camera pass per table per frame; the dealer's cards and total are on the table and its canvas |

### Play mode against the test plan (9.3, 9.4)

What ran in Play mode: 9.3 items 1 to 5 and 8 (a reload mid-round, done with two players in rung 4), and 10 (rung 2).
For 9.4: item 1 (with digests at the checkpoints after round 1, after the reload and at the end of round 2, rather
than after every action), item 2 (on both pages, and on the reloaded page) and item 3. Not run in Play mode: 9.3
items 6 (split), 7 (manual mode) and 9 (two instances), and 9.4 items 4 (referee change), 5 (presses in one tick) and
6 (timers side by side). Each of these is covered in Node only.

One finding from rung 4, about the game rather than the test: during turns, the referee moves the synced poll time
(`nextCheckAt`) on every 2 s, because upstream polls `GameActiveRefresh` every 2 s and a new referee must keep that
cadence. That is one state write every 2 s per table during turns. It is within the room budget (test 32), but it
means a whole-state digest is only comparable within one 2-second epoch.

### Still unverified

- **Everything in the app and on a Quest (rung 5).** That covers laser clicks on the click boxes, `_CardIndex` faces
  and the card shader on Quest (R1), frame time (R3), relay traffic at a round's start (R4), and the Android bundle
  loading at all (it passed the bundle check only).
- **The card zoom (F28) and the sounds (F68):** both ran in Play mode with 0 console errors; the kit's new probes
  (`animstate`, `audioplaying`) were printed for information but are not asserted (timing of short clips), and nobody
  listened.
- **Only in Node, never in Play mode:** split, manual dealing and the dealer's panel, the height buttons (F49), Reset
  Table, the turn timer running out, range, the owner's settings, two tables in one page, a referee or table-owner
  change, more than two players, a withheld deal contribution, and a deal check that fails (a forged hand or
  contributor list needs a modified referee page).
- **The deal-check line in a headset:** its place above the dealer's buttons was checked in an editor screenshot only;
  in manual mode the canvas it is on is shown to the table owner alone (as upstream's automatic canvas), so other
  players then read the outcome only in the console.

### Trust: what a modified client can still do (compared with upstream)

Upstream trusts every client: each holder's client picks its own cards (`PlayerDeck.cs:203`), the table owner's client
picks the dealer's and sees the hole card, and every client is sent the hole card (Q13). The port trusts the referee's
page for the order of play and nothing else it can avoid. After the 2026-11-25 review fix:

| Who | Can | Cannot |
|---|---|---|
| A player's page (not referee) | leave once a loss is certain (Q10, as upstream); withhold its deal contribution, which after 10 s makes the round's deal the referee's alone (shown as not checkable); set its own chip count (chips are local, as upstream) | act for another seat, start or reset the table, change settings (commands are checked by the referee); steer a card (its contribution is committed before it sees the others); read the hole card before the flip |
| The referee's page | know every card it deals, the hole card included (it is the dealer, as upstream's table owner); restart a deal (a new label, visible); deal from its own seed alone by faking the 10 s fallback at once (every client then shows "Deal NOT checkable"); with an accomplice who is listed and leaves before a page first sees the deal, pass that page's check (pages present at the deal catch it); give a draw to a different hand than the one whose turn it was and record it so (the card then visibly lands in that hand at that moment); delay or refuse commands; never reveal its seed (every page then shows that it is waiting for the reveal) | pick its seed (contributions come after its commitment); change a card in any hand, swap cards between hands, give a card nobody drew or drop one without every other page showing **DEAL CHECK FAILED** after the round; list an accomplice or leave a seated player out of the contributors without every page present showing it; change the hole card after dealing it (commitment) |
| Any page | overwrite synced public state (as with VRChat's synced variables); the referee writes it back, and a forged hand is caught by the deal check after the round | the checks run on each page from what that page saw, so forging another page's view is not possible |

Limits of the check: it runs only after the round (the seed is secret until then), so a forged hand is caught when
the round settles, not when it happens, and nothing undoes the round; only the current segment is checked (a segment
lost with a referee who left is counted, not checked); a page that arrived after a contributor left cannot check that
deal (it says so); a deal of the referee alone (the fallback, or a referee playing alone) cannot be checked.

## Status: the TypeScript rules port (2026-11-24)

The rules run in Node on the fake room. The section above covers the Unity side. Everything below this section is
the analysis the port was built from, with section 10's questions now answered (10.4).

### What exists

- `altspace/ts/` from `portkit/ts/game-template` (slug `blackjack`), with `portkit/ts` copied into
  `altspace/ts/portkit/` (no `node_modules`, no `dist`). Nothing under `C:\workspace\AltspaceGames\portkit\` was
  changed.
- One file per upstream file, as section 7 maps them: `src/DeckManager.ts`, `PlayerDeck.ts`, `Dealer.ts`,
  `Player.ts`, `Controller.ts`, `ChipController.ts`, `AudioController.ts`, `PlayerUIController.ts`,
  `DealerUIController.ts`, `Interactable.ts`, `InteractableController.ts`, `DistanceOptimizer.ts`,
  `DisableFixer.ts`, `BlackjackWorldController.ts`; plus `index.ts` (the game definition) and `notice.ts` (the
  Apache notice every file refers to). `PlayerDebug.cs` is not translated (L1). The 1,166 generated event handlers
  are gone: cards are arrays in state. Each file's header names its upstream file and says it was changed.
- `bindings.json` is **PROVISIONAL**: written by `tools/provisional-bindings.ts` from section 5's object model
  (527 objects, 379 refs, 114 behaviours, 43 click events; paths are upstream's names, `root` is `Blackjack`). It
  says so in a `provisional` member. The kit builder replaces it.
- `script-header.txt`: the Apache notice and the change notice at the top of the built `pk-blackjack.js`.
- `golden/`: `extract.ts` copies upstream's rule methods **verbatim by line range** (each range checks its first
  line) into `golden/upstream/Extracted.cs`, compiled with dotnet 8 against `Stubs.cs`; `Harness.cs` writes
  `vectors/upstream.json`. Regenerate with `npm run golden`. This replaces the full-class stubs of 9.1: only the rule
  methods are compiled, so the stubs are small (about 200 lines).

### How it works (as built)

- **State held by the referee (C1).** Every synced behaviour (Controller, DeckManager, Dealer, 7 Players, 14
  PlayerDecks) is in one sync group, `table`: one leaf, one owner (the referee), one atomic write per change. Every
  client draws the table from state; a late joiner gets the same table as everyone.
- **Presses are commands.** A button runs upstream's method on the presser's client (local sound, local checks),
  which sends a numbered command to the referee (`SendCommand`); the referee checks the sender
  (`Networking.CallingSession`) against the seat's holder or the table owner and the phase, then writes state. A
  method whose name starts with `_` cannot be a command (runtime rule, as in UdonSharp), so `_TakeControl` sends
  `TakeControl`, and so on. Every referee half also checks `IsReferee`, so the same name sent as a network event by
  a modified client changes nothing anywhere.
- **Timers on the shared clock.** The round is `phase` (idle, dealing, turns, dealer, settled), `t0` and a `step`
  counter; the deal schedule (V8), the 2 s poll, the 30 s deadline and the dealer's steps (V9) run on the referee
  each tick against `GetServerTimeInSeconds`, so a new referee carries on from state with nothing done twice.
- **Fair draws (C2), as re-synced.** Fresh random cards per draw, as upstream (no shoe): draw k of a segment starts
  upstream's probe at `deal.Int(52, k)`, where the deal is the kit's dealt draw (`Secrets.beginDeal(label, seated
  sessions)`, begun by Start Game's command): the referee commits to a seed, each seated player's runtime commits to a
  contribution and reveals it, and the deal is SHA-256 of all of them, so the referee cannot grind seeds. The deal
  schedule waits until the deal is ready. The referee logs every draw (`drawLog`), where it went (`drawTo`: a seat's
  normal or split hand, the dealer's hole card or other cards; a split moves its card's entry) and the deck count of
  the segment (`segmentDecks`). At the end of the round the referee reveals its seed (`revealDeal`), and every client
  checks the round (`DeckManager.Verify`, rewritten 2026-11-25 after the review):
  1. the contributor list (`dealContributors`) must be the players this client saw seated in the round, plus listed
     players who have since left; `checkDeal(label, expected)` gets exactly that list, so a referee that lists an
     accomplice or leaves a seated player out is caught;
  2. the runtime's `checkDeal(label, expected)` (since the re-sync to portkit `c971100`): the seed must match its
     commitment, and the deal is recomputed from the contributions this client saw. Its `failed` is a mismatch; its
     `solo` and `unknown` are **not checkable** here, never a failed check; `pending` (a contribution not here yet)
     is checked again on the next update;
  3. the logged draws must be the deal's, and **every hand on the table** must hold exactly the cards the deal gave it,
     in order, with what each hand held from before the segment adding up to `baseCards` (`CheckHands`). So a hand the
     referee changed, a card given to another hand, a card nobody drew or a draw left out shows, whatever the referee
     wrote in `drawLog`.

  The outcome is `checked`, `unverifiable` or `mismatch` (`DeckManager.verified.status`), logged (an error on a
  mismatch, a warning when not checkable) and shown to everyone in range on a line under the credits button (the
  `dealCheck` text). A deal with no contributor but the referee is **not checkable**: the 10 s fallback for a seated
  player whose page never answers (a modified referee could fake that at once and pick its seed, and nobody can tell
  the two apart), and a referee alone at the table. During such a round the line says so too. A page that arrived
  after a contributor left never saw that contribution: it says it cannot check that deal rather than raising a false
  alarm. Since portkit `c971100` the runtime says so itself (`checkDeal` is `unknown` there); the game's own guess
  (a mismatch with a listed player this page never saw turned into "not checkable") is gone. A referee that takes over mid-round does not know the seed: it begins segment 2 with a deal of its own, and
  the lost segment is counted in `lostSegments` (only the current segment is checked).
- **The hole card (C3).** The referee draws it from the committed seed, keeps it on its own client with its own
  commitment (`Dealer.holeHash`), and shows `-1` in state; the dealer's public total counts the up card only. At
  the flip it publishes the card and the opening, and every client checks it (`Dealer.holeVerified`). A referee
  that took over before the flip never knew the card: it draws a new one at the flip (`holeRedrawn`).
- **Chips (decision: keep upstream's behaviour).** Upstream never saves chips (each world load starts at
  `StartingChips`), so the port saves nothing either: no `localStorage`. They stay local to the holder's client,
  one balance per page across tables (upstream: per world), and the holder pays itself from the referee's results.

### Coordinator decisions applied (answers to 10.4)

| # | Decision |
|---|---|
| K2 | Rules unchanged: every win pays 1 to 1. The felt's "BLACKJACK PAYS 2 TO 1" will be repainted in the kit (not done yet) |
| K3 | Fixed: Q1 (two of clubs), Q4 (split aces), Q5 (split payouts), and Q12 (seats stuck after reset), each listed below as a deliberate difference; upstream's literal arithmetic is kept for the golden vectors |
| K4 | No double down, insurance or surrender (F43) |
| K6 | No saved chips: upstream saves none |
| K10 | One player may hold several seats, as upstream |
| Hidden information | Commit and reveal for the hole card; fresh draws made checkable with the runtime's `Draw` |

### Checklist status (section 2)

Status: **tested** = asserted by a Node test (scenario or golden vector); **ported** = in the TypeScript, not
asserted on its own; **kit** = the TypeScript side is done, the effect needs the Unity kit; **left out** = as
section 10.2 says.

**78 items: 51 tested, 20 ported, 3 play, 1 kit, 3 left out.** (**play**: ran in Play mode in the Unity editor, rungs 3 and 4; "play, ran" = it ran, but no probe asserted it. Many **tested** items also ran in Play mode: TESTS.md. Not an item of section 2: the credits panel the port adds for the licence opened and closed in Play mode, rung 3.)

| # | Status | Evidence or note |
|---|---|---|
| F1 | tested | two tables in one room (security.test.ts) |
| F2 | tested | attributes chips, chip-system, decks, helpers, manual, allow-change, turn-seconds, range (BlackjackWorldController.ts) |
| F3 | tested | defaults: chips off, 2 decks, 100 chips, helpers off, manual off, no changes |
| F4 | tested | the table is the instance; bets are per table |
| F5 | tested | take the table (TakeOwnership) |
| F6 | tested | a new table owner resets the table |
| F7 | tested | owner-only settings, allow-change |
| F8 | tested | vectors V1 and the settings test |
| F9 | tested | Reset Table, owner only, once per 2 s |
| F10 | tested | ChipBank.ResetChips against vectors V7 |
| F11 | ported | PlayUIInteract on the presser's half |
| F12 | tested | Join Game |
| F13 | tested | refused mid-round; the 2 s after leaving is enforced by the referee |
| F14 | tested | name on the seat and the dealer's panel |
| F15 | tested | LEAVE GAME; a mid-turn hand is stood |
| F16 | tested | one player, two seats (split test) |
| F17 | ported | no BS.Seat |
| F18 | ported | join and leave sounds for the actor |
| F19 | tested | local chips, one balance per page |
| F20 | tested | bets refused once the round runs |
| F21 | tested | bets across tables stay within the chips |
| F22 | tested | holder pays itself from the referee's results |
| F23 | tested | bet back to 0 after each round |
| F24 | ported | chips off hides the panel and moves nothing |
| F25 | tested | Start Game: owner, a seat, no round |
| F26 | ported | round start clears the table, shuffle sound |
| F27 | tested | vectors V8; schedule run against the shared clock |
| F28 | play, ran | each dealt slot gets the NotHidden trigger through the relay (rungs 3 and 4, 0 console errors); faces asserted by probe, the zoom animation not |
| F29 | ported | at most 11 cards per hand |
| F30 | ported | counts per round, from the cards on the table |
| F31 | tested | vectors V2 and the seed replay |
| F32 | tested | card table test |
| F33 | tested | vectors V3 |
| F34 | tested | all seats act at once |
| F35 | tested | timer text, one new-round sound |
| F36 | tested | no hits in the second after a split |
| F37 | ported | no automatic stand on 21 |
| F38 | ported | bust banner and end of turn |
| F39 | tested | stand ends the turn |
| F40 | tested | split offered on equal values |
| F41 | tested | split: two hands, a card each after 1 s, bet doubled |
| F42 | ported | no re-split; split aces not limited |
| F43 | tested | golden test: no natural bonus; no double, insurance or surrender |
| F44 | tested | manual play is state |
| F45 | tested | the mark and the bleep |
| F46 | tested | dealer's per-seat panel: count text, marks |
| F47 | tested | dealer's Hit Me and Stand |
| F48 | ported | deal and dealer's play are automatic in both modes |
| F49 | kit | two click boxes drive the Height parameter (C12); built, not run in Play mode |
| F50 | ported | marks cleared on stand and at start |
| F51 | ported | 2 s poll from n+2 s |
| F52 | tested | vectors V9; flip at the shared time |
| F53 | tested | vectors V9 (soft 17 stands) |
| F54 | ported | dealer plays when all bust; Bust banner |
| F55 | ported | dealer's total after the round |
| F56 | left out | overhead camera and screen removed in the kit (K9, L13) |
| F57 | tested | settlement |
| F58 | tested | split hand settled separately (Q5 fixed) |
| F59 | tested | 1 to 1 (vectors V6) |
| F60 | ported | holder hears the first hand's sound |
| F61 | tested | freed seat not settled |
| F62 | ported | cards stay until the next start or a reset |
| F63 | tested | 30 s timer by shared deadline |
| F64 | tested | helper totals |
| F65 | play | every press in rungs 3 and 4 was a real mouse click on a layer-5 click box (Join, +10, +5, Start Game, HIT, STAND, Credits) |
| F66 | left out | touch buttons (L5) |
| F67 | ported | Press trigger on a click |
| F68 | play, ran | sounds fire from state through the relay audio op onto Kenney CC0 clips (rungs 3 and 4, 0 console errors); not probed, nobody listened |
| F69 | tested | range by head distance |
| F70 | tested | walking out releases the seat |
| F71 | ported | fixed sound source (C10) |
| F72 | tested | holder leaves mid-hand |
| F73 | tested | table owner leaves: reset |
| F74 | ported | element removed: DisableFixer, best effort (L7) |
| F75 | tested | covered by F72 |
| F76 | left out | debug panel (L1) |
| F77 | tested | late joiner sees the table (C1) |
| F78 | tested | GameActive is in state from the start |

### Quirks (Q1 to Q21): what the port does

| # | Port | Evidence |
|---|---|---|
| Q1 | **Fixed**: the two of clubs has NumberOfDecks copies | V1 asserts upstream's 999 and the port's count |
| Q2 | Kept: uniform over card types, next index up when used up | V2 |
| Q3 | Replaced: counts follow from the cards in state | seed replay |
| Q4 | **Fixed**: each hand is scored from its own cards | V4 asserts upstream's 11 and the port's 21 for split aces and a ten |
| Q5 | **Fixed**: each split hand settles at the bet the round started with (the panel still shows the doubled bet, as upstream) | V6 (upstream +40, port +20 on two wins of a 10 bet); split scenario |
| Q6 | **Fixed**: split is offered only when the doubled bet fits next to the bets on every table | ported |
| Q7 | **Fixed**: everyone sees the split and both results | split scenario |
| Q8 | **Fixed**: a timeout ends the turn in state, for everyone | timer scenario |
| Q9 | **Fixed**: the referee deals no card to a bust or finished hand | ported |
| Q10 | Kept: leaving mid-round avoids settlement (F61). That includes leaving once the loss is certain: after the dealer's flip shows a stronger hand, or after one's own hand went bust (the seat is freed, its result stays "none", and the holder's chips, which live on its own page, never pay the bet). Upstream is the same (`Player.cs:549-552`: a freed seat is not settled) | leave scenario |
| Q11 | **Fixed**: no seat is taken during a round | late-joiner scenario |
| Q12 | **Fixed**: a reset frees every seat | reset and owner-leaves scenarios |
| Q13 | **Fixed**: the hole card is in no channel before the flip | hole-card scenario |
| Q14 | Kit: the missing constraint source on seat 0 | kit builder |
| Q15 | **Fixed**: toggles follow the synced values | settings scenario |
| Q16 | **Fixed**: the new-round sound plays once per round | three-player scenario |
| Q17 | **Fixed**: one draw sound per card | ported |
| Q18 | Kept 1 to 1 (K2); the felt is to be repainted | kit |
| Q19 | Kit: replace the two missing sprites | kit builder |
| Q20 | Gone with C1 | |
| Q21 | **Fixed**: CanSplit follows the hand: two cards of equal value, before any other card | ported |

### Deliberate differences from upstream (beyond section 10.1)

| # | Difference | Why |
|---|---|---|
| D1 | A table reset also clears the dealer's cards (upstream's ResetTable left them on the table) | a reset clears the table |
| D2 | A taken seat cannot be taken by someone else (upstream left it to the UI; a touch press could take it) | Q12, and a bystander must not act for a seat |
| D3 | The dealer panel's Stand is accepted from the table owner or the holder only | upstream relied on the panel being visible to the owner alone |
| D4 | Command names drop the leading `_` of upstream's method names | runtime rule |
| D5 | "5 frames" is 0.25 s (a frame is one 50 ms tick) | runtime tick |
| D6 | The chips toggle is shown whenever settings may change (upstream: only if chips were on when that client started) | C18; upstream's rule differed per client |
| D7 | A referee that takes over before the flip draws a new hole card | it cannot know the old one, and nobody may learn it |
| D8 | Draws come from a dealt draw (the referee's committed seed and every seated player's contribution); the referee draws every card (C2) | one writer; after the round every client checks the contributor list against the players seated in the round, the seed against its commitment, and every hand on the table against the deal, and shows the outcome on the table. A deal with no contributor but the referee (the 10 s fallback, or a referee alone at the table) is shown as not checkable |
| D9 | The flip sound and the hole card's deal sound play for everyone in range (C19) | sounds follow state |
| D10 | Settings come from snippet attributes, applied once by the first referee (C20) | no inspector in someone else's world |

### Runtime gaps: closed by the fixed kit (re-sync of 2026-11-24, portkit `1118ef0`)

| # | Gap | Now |
|---|---|---|
| G1 | No object shared by every instance on a page | `this.Shared` holds the page's one chip bank, keyed by `this.InstanceKey`; the module-level map is gone |
| G2 | No strong random value for game code | `this.Random.Bytes` (deal labels); the nonce-seed hack is gone |
| G3 | The referee could grind seeds for the deck | the deck uses the kit's **dealt draws** (`beginDeal` / `dealDraw` / `revealDeal` / `checkDeal(label, expected)`): the referee commits to a seed, every seated player's runtime commits to a contribution and reveals it, and the cards come from all of them. The deal schedule waits for it (the shuffle sound covers it); a new referee mid-round begins a deal of its own (segment 2); a deal some seated player's runtime never answers is begun again after 10 s from the referee's seed alone, logged and counted in `DeckManager.unfairDeals` (so a modified client cannot hang the table, but it can make that round's deal the referee's alone). Since portkit `9b7c447` such a deal never verifies: every client shows the round as **not checkable** |
| G4 | `Behaviour.Player` clashed with upstream's field | kept as `Seat` (the kit's convention allows either) |
| G5 | Game code could not read its instance key | `this.InstanceKey` keys the bet |
| G6 | Commands from one sender run one at a time | intended; nothing to change |
| G7 | Controls live only after the first tick | the first `Update` runs in the start turn; the tests' one-tick wait is gone |

Every class whose methods are reached by a command declares `static networkCallable` (Controller 8 names, Player 8,
DeckManager 2). Found while re-syncing (kit gap, reported): publishing a user-state record from inside a command
handler (here `Secrets.beginDeal`) made the kit's command runner run the same command again, recursively; the deal was
therefore begun from the Controller's tick. Fixed in portkit `30881dd`; since the re-sync to `812f285`
(2026-11-25) the deal begins in Start Game's command again (the tick still begins a new segment after a change of
referee).

### Tests (`npm test`: typecheck, lint, then the Node tests)

38 tests, all passing (review pass, 2026-11-25; 33 before it); the scenario files were also run six times in a row
(draws differ every run) without a failure in the first pass.

- `test/golden.test.ts` (16): vectors V1 to V9 from upstream's compiled C# (2,610 scoring sequences, 1,664 probe
  cases, 120 split cases, 1,170 settlement cases, 30 chip runs, 7 schedules, 100 dealer plays); hand-derived soft,
  hard, bust and two-card-21 cases; the seed replay catching a changed card; the hands held against the deal
  (`CheckHands`: a changed, swapped, extra or missing card). Q1, Q4 and Q5 asserted as differences.
- `test/scenarios.test.ts` (6): three players, four rounds with chips (chips follow results, every round replays,
  one new-round sound per round); a split; a player leaving mid-hand; a late joiner mid-hand (cards, faces, totals,
  the hole card's back, no seat mid-round, the result banner); the referee leaving mid-hand (round finishes, hole
  card redrawn, segment 2 replays); the referee who is also table owner leaving (reset).
- `test/security.test.ts` (10): the hole card unreadable before the flip (every state write, user-state write and
  one-shot recorded; neither the seed nor either opening goes out; every client, the referee's page included, holds
  -1 and sends no face; the flip matches the commitment); a bystander's clicks, commands and network events change
  nothing; two tables in one room stay apart and share one chip balance; settings are the owner's, between rounds;
  allow-change; a seated player whose runtime withholds its deal contribution cannot hang the table (and that deal is
  shown as not checkable); a referee that changes a hand without touching `drawLog` is caught by every other page; a
  referee that lists an accomplice, or leaves a seated player out, is caught; a referee alone at the table is shown
  as not checkable, and the replay uses the segment's own deck count; a page that arrived after a contributor left
  says it cannot check instead of raising a false alarm.
- `test/table.test.ts` (6): the table owner leaving; Reset Table freeing every seat, LEAVE GAME, the 2 s rejoin; the
  30 s timer; manual dealing; the room budget (one group, 5 space leaves; with seven players the largest leaf was 1,557 bytes
  and the busiest second saw 3 state writes, against 16,384 bytes and 20 a second); walking out of range.

`npm run build` writes `../Assets/WebRoot/pk-blackjack.js`; built to a scratch folder for this check: 531,193 bytes,
licence banner first.

### Not done yet

Done since: the Unity side and rungs 2 to 4 (see "Status: the Unity kit and the editor rungs" above). In the editor,
this game's own Play-mode runs settled S6 (clicks on layer-5 boxes) and R1 (faces by `_CardIndex`, read back by
probe). R7 (clip one-shots overlapping) is not settled: the audio op ran without errors, but nobody listened.

## 0. What the analysis found, in short

- The rules engine is small. 15 runtime scripts, 4,263 lines by `wc -l`, of which 1,166 lines are two
  identical blocks of generated one-line network-event handlers (`Dealer.cs:299-881`,
  `PlayerDeck.cs:265-847`). About 2,540 non-blank code lines remain. The 410-line custom inspector is
  replaced by the kit builder.
- Upstream has **no double down, no insurance, no surrender, no bonus for a two-card 21 and no dealer
  peek**. Hit, stand and one split are the only player actions. The felt texture nevertheless prints
  "BLACKJACK PAYS 2 TO 1" (section 2, Q18).
- Upstream has **no deck order**. Each draw is a fresh `Random.Range(0, 52)` on the client that draws,
  checked against per-client counts that reset every round (`PlayerDeck.cs:199-261`,
  `DeckManager.cs:72-87`). The hole card's identity and the dealer's full total are sent to every client at
  deal time (`Dealer.cs:141`, `Dealer.cs:895-898`).
- Chips are local to each client, never synced, never saved (`ChipController.cs:10`, `:27-31`).
- There are no pickups, no stations (chairs) and no synced transforms. All interaction is 111 uGUI
  buttons on 62 world-space canvases, plus 70 VR finger-touch trigger boxes.
- Licence: Apache-2.0 with **no NOTICE file**. Three fonts used by the UI carry "All Rights Reserved" or a
  bare copyright string; audio, card art and table art have credits or nothing, and no licence text of
  their own (section 1.3, section 6.6).

## 1. Upstream at a glance

### 1.1 Repository

| Item | Value | Source |
|---|---|---|
| Upstream | Centauri2442/VRCBlackjack | git remote `upstream` |
| Commit | `83f05db20b3bb60d1fa38767d0d4839b857b20fd`, 2025-04-30, "Update README.md" | `git log -1` |
| Last code change | `71fff93` "v1.0.4", 2022-11-14. Later commits touch only `README.md` and add `LICENSE` (`fc377e0`, 2024-02-15) | `git log`, `git diff --name-status 71fff93 83f05db` |
| Branches | `main`, `v1.0.4-legacy`, `v2.0.0-develop` all point at `83f05db`: no v2 code is published | `git rev-parse` |
| Local branch | `altspace`, same commit, clean before this file | `git status` |
| Unity version | **Not stated.** No `ProjectSettings/`, no scene, no package manifest. Importer versions (`TextureImporter serializedVersion: 11` at `Meshes/Table/Textures/Table_Outer_Normal.png.meta:6`; `ModelImporter serializedVersion: 19301` at `Meshes/DeckOfCards/DeckOfCards.fbx.meta:4`) fit Unity 2019.4, VRChat's editor in 2022. Inferred, not verified | meta files |
| SDK | VRCSDK3 Worlds "Latest" and UdonSharp 1.0 or higher, TextMeshPro (`README.md:15-17`); "VRCSDK3 2022.1.1 or newer" (`README.txt:19-20`) | readmes |
| Version | v1.0.4 (`CHANGELOG.txt:1`) | changelog |
| Entry prefab | `Prefabs/Blackjack System.prefab` (GUID `b904fa7d86f5b2a4a87721c077658918`): root `Blackjack System` with `BlackjackWorldController` (`S.prefab:174-201`), an empty child `Tables - DELETE THROUGH SCRIPT NOT MANUALLY -`, and `Chip Controller` with a child `Audio` | prefab YAML |
| Tables | Not in the entry prefab. The custom inspector instantiates `B.prefab` once per table (`Editor/BlackjackWorldControllerEditor.cs:185-208`), points it at the chip controller (`:193`), and creates a 1024 x 256 render texture plus an `Unlit/Texture` material per table under `Assets/BlackjackGeneratedAssets` (`:225-277`) | editor script |
| Scene | None in the repo | file listing |
| Layout | The repo root is the package folder itself (meant to sit under `Assets/`): `Animations/`, `Audio/`, `Editor/`, `Fonts/`, `Meshes/`, `Prefabs/`, `Resources/`, `Scripts/`, `UI/` | file listing |

### 1.2 Licences found in the repo

| Thing | Licence or statement | Where |
|---|---|---|
| Whole repo | Apache License 2.0, full text | `LICENSE:1-201` |
| Copyright notice | "Copyright 2022 CentauriCore" with the Apache boilerplate | `README.md:52-62`, `README.txt:42-52` |
| Per-file headers | The same notice at the top of 10 files: `Scripts/DeckManager.cs:1-15`, `DisableFixer.cs:1-15`, `DistanceOptimizer.cs:1-15`, `Interactable.cs:1-15`, `InteractableController.cs:1-15`, `Player.cs:1-15`, `PlayerDebug.cs:1-15`, `PlayerDeck.cs:1-15`, `PlayerUIController.cs:1-15`, `Editor/BlackjackWorldControllerEditor.cs:3-17` | sources |
| Files without a header | `AudioController.cs`, `BlackjackWorldController.cs`, `ChipController.cs`, `Controller.cs`, `Dealer.cs`, `DealerUIController.cs` | sources |
| NOTICE file | **None** (`git ls-files` has no file named notice, credits or third-party; only `LICENSE`) | file listing |
| Credits | Centauri (developer), Sentinel373 (table mesh), FiyCsf (table textures), Three Ribbon Studios (audio). Credits only, no licence text per contributor | `README.md:46-49` |
| Also sold | Gumroad link | `README.md:8`. Whether the paid package differs from the repo could not be determined |
| Card model and atlas | No credit and no licence statement (section 6.6) | `Meshes/DeckOfCards/` |
| Fonts | Five font files with embedded copyright strings, no licence files (section 6.5) | `Fonts/` |
| TextMeshPro default font copy | `Fonts/LiberationSans SDF.asset` is the TMP essentials asset (Liberation Sans is SIL OFL 1.1; the OFL text is not in the repo) | `Fonts/` |
| Shaders | None in the repo. Materials point at Unity built-ins and at one external shader GUID from the VRChat SDK (section 6.4) | `.mat` files |

### 1.3 What Apache-2.0 obliges a modified redistribution to carry

Section 4 of the licence (`LICENSE:89-128`; conditions (a) to (d) at `:94`, `:97`, `:100`, `:106`) sets
four conditions. Applied to this port:

1. **4(a), a copy of the licence to every recipient**, for source or object form. The fork keeps
   `LICENSE` at its root. The asset bundles and the bundled script are object forms that travel without
   the repo, so each needs the licence with it: the full text as a text asset inside each bundle, a
   preserved banner comment in `pk-blackjack.js` naming the licence and the fork URL, and the in-world
   credits panel. A link alone is common practice; the text says "a copy", so the bundle should hold one.
2. **4(b), modified files must carry prominent notices that they were changed.** No upstream file needs
   editing in place (the importer copies assets into a git-ignored folder). The TypeScript files are new
   files derived from upstream files, so each gets a header: the upstream path and commit, "Copyright 2022
   CentauriCore", the Apache notice, and a line stating it was translated and changed, by whom and when.
   Re-encoded textures, converted materials and the kit prefab cannot hold a notice, so they are listed
   in `altspace/THIRD-PARTY-NOTICES.md` and in section 10 of this file (the change list).
3. **4(c), keep all copyright, patent, trademark and attribution notices of the source form.** That is the
   ten file headers, the copyright block in both readmes, and the credits list. Upstream files stay
   untouched on the `altspace` branch; the notices are repeated in the translated files and in
   `THIRD-PARTY-NOTICES.md`.
4. **4(d), NOTICE file.** Applies only "if the Work includes a NOTICE text file". It does not, so there
   is nothing to propagate. If the port adds its own NOTICE, later redistributors must carry that one.

Other clauses that matter here:

- **Section 6, trademarks** (`LICENSE:138-141`): no right to the names "VRCBlackjack", "CentauriCore" or
  "Centauri" beyond describing origin. The snippet must not be titled with them. The default felt texture
  has the CentauriCore logo and handle painted into it (top right of
  `Meshes/Table/Textures/Surfaces/Green/..._AlbedoTransparency.png`); see question K5.
- **Section 4, last paragraph**: the port may add its own copyright statement and may license its own
  changes under other terms; the plan keeps Apache-2.0.
- **Sections 7 and 8**: the "AS IS" disclaimer is retained with the notice.
- `LICENSE:189` is the unfilled appendix template ("Copyright [yyyy] [name of copyright owner]"). It is
  boilerplate, not the notice; the real notice is the one in the readmes and headers.
- The licence covers what the licensor could license. Third-party fonts, audio and card art inside the
  repo are not made Apache-2.0 by sitting in it (section 6.6).

## 2. Feature checklist

Numbered statements of what upstream does. `Port` says what the Altspace version does: **same**, or a
reference to section 10. Quirks (things upstream does that look unintended) are listed separately as Q1
to Q21, each with a proposed decision.

### A. World and table

| # | Upstream does | Where | Port |
|---|---|---|---|
| F1 | A world can hold several independent tables; each has 7 seats and one dealer side | `README.md:6`, `README.md:23` (advises 4 or fewer); 7 instances of `P0.prefab` under `Blackjack/Players/Players` (`B.prefab:11779-14994`) | One table per snippet instance; several instances per world |
| F2 | Per-table build options: use chips, use helpers, deck count (2 or more), allow changes at run time. A world-wide "Use Chip System" switch overrides the per-table one | `Editor/BlackjackWorldControllerEditor.cs:93-96`, `:137-166`, `:366-374`; `BlackjackWorldController.cs:21-32` | Snippet attributes (section 8) |
| F3 | Defaults in the prefabs: world chip switch on (`S.prefab:313`), table chips off (`B.prefab:7689`), manual play off (`:7693`), helpers off (`:7706`), allow change off (`:7707`), 2 decks (`:8063`), 100 starting chips (`S.prefab:316`) | prefab YAML | Same defaults (question K7 on chips) |
| F4 | Each table gets an index used to key the player's bet per table | `BlackjackWorldController.cs:25`, `Controller.cs:31`, `ChipController.cs:18` | Instance key |

### B. Table owner

| # | Upstream does | Where | Port |
|---|---|---|---|
| F5 | One player owns the table. At world start that is the instance master (VRChat default; no code). A non-owner sees "Take Control of Table" on the dealer side while no round runs | `DealerUIController.cs:146-147`; buttons `Auto Canvas/Mask/Idle/Take Ownership` and `Manual Canvas/Manual Dealer Canvas/Mask/Not Owner/Take Ownership` call `_TakeOwnership`; `Controller.cs:40-45` | Same; first table owner is the referee's player (C17) |
| F6 | Any change of table owner resets the table on every client: round aborted, cards and banners cleared, every bet at this table set to 0, seats released | `Controller.cs:301-304`, `:257-269`; `Player.cs:578-597` | Same, with Q12 fixed |
| F7 | Owner controls between rounds, automatic mode: Start Game, Swap to Manual Play, and, only if "allow change" is set, Helpers on/off, Use Chips on/off (shown only if chips were on at start), Deck Count plus and minus (minus hidden at 2) | `DealerUIController.cs:80-129`, `:139-151`; `Controller.cs:47-79`; `DeckManager.cs:53-70`; button wiring in `B.prefab` (section 5.3) | Same |
| F8 | Deck count has a lower limit of 2 and no upper limit | `DeckManager.cs:53-70`; `Editor/...Editor.cs:159-162` | Same |
| F9 | "Reset Table" at the back of the table: table owner only, at most once per 2 s; resets as F6 without changing owner | `Controller.cs:271-289`; `B.prefab` `Reset Button/Take Ownership` (label "Reset Table"); `CHANGELOG.txt:17` | Same |
| F10 | "Reset Chips" beside it: sets the pressing player's chips back to the starting amount and all their bets to 0. Local only, any player | `Controller.cs:316-320`; `ChipController.cs:50-58`; `CHANGELOG.txt:8` | Same |
| F11 | Every dealer-side button plays the UI click sound for the presser | second persistent call on each button in `B.prefab`; `AudioController.cs:129-132` | Same |

### C. Seats

| # | Upstream does | Where | Port |
|---|---|---|---|
| F12 | A free seat shows "Join Game" to everyone while no round runs. Pressing takes the seat | `PlayerUIController.cs:64`; `Player.cs:172-189` | Same |
| F13 | Joining is refused during a round and for 2 s after the same client released that seat | `Player.cs:174`, `:193-209` | Same |
| F14 | A taken seat shows the holder's name to everyone else, and on the dealer's per-seat panel | `PlayerUIController.cs:66-67`; `Player.cs:101` | Same; name stored in state |
| F15 | The holder sees "LEAVE GAME" at all times, also mid-round. Leaving mid-turn stands the hand, then the table owner's client frees the seat | `PlayerUIController.cs:63`; `Player.cs:191-235` | Same; the referee frees it |
| F16 | Nothing limits a player to one seat. The bet is per table, so two seats of one holder share one bet **(reading)** | `Player.cs:172-189`; `ChipController.cs:18`; `Player.cs:110` | Same (question K10) |
| F17 | Seats are standing places. There is no station component in either prefab | class census of `B.prefab` and `P0.prefab` (section 5) | Same: no `BS.Seat` |
| F18 | Join and leave play a chip sound for the acting player only | `Player.cs:186`, `:198` | Same |

### D. Chips and bets

| # | Upstream does | Where | Port |
|---|---|---|---|
| F19 | Chips are per player and local: each client starts at 100 on every world load; not synced, not saved; one balance for all tables of the world; nobody else sees the balance or the bet | `ChipController.cs:10`, `:13-18`, `:27-31`; `Player.cs:58` (`TotalBet` has no `[UdonSynced]`), `Player.cs:105` | Same; one balance per page across instances (C16) |
| F20 | Bet panel, holder only, chips on: shows Current Bet and Total Chips; buttons +10, +5, -10, -5 work only between rounds; the panel folds away during a round | `Player.cs:103-106`, `:606-644`; `Animations/Chips Animator.controller` | Same |
| F21 | A raise is refused with a low bleep if the player's bets on all tables plus the raise would exceed their chips. A cut below 0 is ignored. There is no minimum bet: a round can be played at 0 | `ChipController.cs:60-73`, `:103-110`; `Player.cs:628`, `:638` | Same |
| F22 | Chips move only at settlement, on the holder's client: win +bet, lose -bet, draw 0. The bet is not taken up front | `Player.cs:481-527` | Same |
| F23 | Five frames after settlement the table bet is set to 0 on every client, so players bet again each round | `Player.cs:575`, `:599-602` | Same |
| F24 | With chips off, the bet panel is hidden and chips never change | `Player.cs:105`, `:485`, `:499`, `:522` | Same |

### E. Round start and deal

| # | Upstream does | Where | Port |
|---|---|---|---|
| F25 | Start Game works when at least one seat is taken and no round is active | `Controller.cs:91-109` | Same |
| F26 | On start every client clears the last round (cards, banners, split state, "wants to hit" marks), plays the shuffle sound, and seats not taken are closed for the round | `Controller.cs:111-163`; `Dealer.cs:939-977`; `Player.cs:430-448`, `:133-139`; `PlayerUIController.cs:147-166` | Same |
| F27 | Deal order and timing, with n taken seats in seat order 0 to 6: first card to player i at (i+1)/2 s; dealer's first card, face down, at (n+1)/2 s; second card to player i at (i+2+n)/2 s; dealer's second card, face up, at n+1 s; turns open at n+2 s | `Controller.cs:204-215`; `Player.cs:141-170`; `Dealer.cs:101-129`, `:171-178` | Same times, driven from state (C1) |
| F28 | Each card slides in and zooms; a draw sound plays for everyone in range | `PlayerDeck.cs:71-82`; `Dealer.cs:159-178`; `Animations/Card Zoom In.controller` | Same |
| F29 | A hand holds at most 11 cards; a 12th is not dealt | `PlayerDeck.cs:61`; `Dealer.cs:135`; 11 position transforms per hand | Same |
| F30 | Deck: each of 52 card types has "deck count" copies per round; counts reset at every round start; no shoe carries over | `DeckManager.cs:72-87`; `Controller.cs:134` | Same |
| F31 | A draw picks a uniformly random type index; if that type is used up it takes the next higher index that has copies, wrapping once; if none, no card | `PlayerDeck.cs:199-261` (identical copy at `Dealer.cs:233-295`) | Same algorithm, seeded (C2) |
| F32 | Card values: 2 to 10 face value; jack, queen, king 10; ace 11. Read from the prefab name `[v] ...` | `PlayerDeck.cs:84-88`; `Dealer.cs:182-186`; list order at `B.prefab:8064` | Same; a table in `bindings.json` |
| F33 | Hand total: an arriving ace counts 11 if the total is below 11, else 1; when the total passes 21 and an 11-ace is held, 10 comes off; bust when over 21 with no 11-ace left | `PlayerDeck.cs:150-176`; `Dealer.cs:196-223` | Same |

### F. Player actions

| # | Upstream does | Where | Port |
|---|---|---|---|
| F34 | All taken seats act at the same time; there is no turn order | `Controller.cs:218-224` | Same |
| F35 | When turns open the holder gets HIT and STAND, a "your turn" marker and a timer; a "new round" sound plays for everyone in range | `Player.cs:237-253`; `Animations/Player UI Animator.controller` (`Active`, `MyTurn`) | Same |
| F36 | Hit, automatic mode: one card to that hand at once; at most one hit per hand per second; none during the 1 s after a split | `Player.cs:281-303`, `:317-351`, `:376-377` | Same |
| F37 | No automatic stand on 21 **(reading)** | nothing checks for it | Same |
| F38 | A bust hand shows "Bust" to everyone. The turn ends when the only hand, or both hands after a split, are bust; a click sound plays for everyone in range | `PlayerDeck.cs:174-187`; `Player.cs:403-428`; `PlayerUIController.cs:198-208` | Same |
| F39 | Stand ends the turn for both hands; the dealer's panel shows "HAS STOOD" | `Player.cs:394-401`, `:255-267`; `PlayerUIController.cs:233-252` | Same |
| F40 | Split is offered when the first two cards have equal value (so king and ten qualify) and, with chips on, when twice the bet is at most the chip balance | `PlayerDeck.cs:95-101`, `:128-148` | Same |
| F41 | Split, once per round: the second card moves to the split row; after 1 s each hand gets one card; with chips on the table bet is doubled if affordable; a sound plays for the splitter; a second HIT button appears | `Player.cs:353-392`; `PlayerUIController.cs:192-196` | Same (Q5, Q6) |
| F42 | No re-split. Split aces are not limited to one card **(reading)** | `Player.cs:355` | Same |
| F43 | **Not present:** double down, insurance, surrender, even money, a bonus for a two-card 21, dealer peek | a search of `Scripts/*.cs` for `double`, `insur`, `surrender`, `natural` finds only licence text | Not added (question K4) |

### G. Manual dealing

| # | Upstream does | Where | Port |
|---|---|---|---|
| F44 | The table owner swaps between automatic ("AI") play and manual play between rounds; the setting is synced | `Controller.cs:47-51`; `DealerUIController.cs:140`, `:159-202` | Same |
| F45 | In manual play a player's HIT does not deal. It raises a "wants to hit" mark for that hand on the dealer's panel, with a high bleep for everyone in range | `Player.cs:281-315`; `PlayerUIController.cs:254-272` | Same |
| F46 | The dealer's per-seat panel, visible only to the table owner in manual play, shows the player's name, each hand's total, "Hit Me" per hand and "Stand" | `PlayerUIController.cs:65-76`; `PlayerDeck.cs:107-114`; `P0.prefab` `Dealer Player UI Canvas` | Same |
| F47 | The dealer's "Hit Me" deals one card to that hand whether or not the player asked; the dealer's "Stand" ends that player's turn | `Player.cs:269-279`, `:317-341`, `:394-401` | Same |
| F48 | The first four deal steps and the dealer's own play are automatic in both modes | `Controller.cs:204-216`, `:226-247` | Same |
| F49 | "Adjust Dealer Height" slider (owner, manual play, during a round) moves all per-seat dealer panels up or down on the owner's client only | `DealerUIController.cs:141`, `:204-213`; `Animations/Height Adjustment.controller`; `CHANGELOG.txt:14` | Two step buttons (C12) |
| F50 | A pending "wants to hit" mark is cleared on stand and at the next start | `PlayerUIController.cs:164-165`, `:237-238`; `CHANGELOG.txt:18` | Same |

### H. Dealer

| # | Upstream does | Where | Port |
|---|---|---|---|
| F51 | From n+2 s the table owner's client checks every 2 s whether all seats in the round have finished; then the dealer plays | `Controller.cs:226-247` | Same cadence |
| F52 | The hole card flips for everyone (flip sound on the table owner's client only); 1 s later the dealer draws one card every 0.5 s while the total is under 17 and not bust | `Dealer.cs:61-83`, `:96-99` | Same; the flip sound plays for everyone in range (C19) |
| F53 | The dealer stands on every 17, soft 17 included **(reading)** | `Dealer.cs:75` with `:196-223` | Same |
| F54 | The dealer plays even when every player is bust **(reading)**. A dealer bust shows "Bust" on the table for everyone | `Dealer.cs:85-89`; `DealerUIController.cs:250-254` | Same |
| F55 | After the round the dealer's total is shown on the overhead screen whenever it is above 0, with helpers on or off | `DealerUIController.cs:154-156`; `CHANGELOG.txt:15` | Same |
| F56 | Overhead screen: an orthographic camera above the dealer's first card row renders into a 1024 x 256 texture shown on the `Dealer Screen` mesh | `Controller.cs:32-35`; `B.prefab:8920-8952`; `Editor/...Editor.cs:225-277` | Question K9 |

### I. Settlement

| # | Upstream does | Where | Port |
|---|---|---|---|
| F57 | For each taken seat at round end: over 21 loses; else beating the dealer, or a dealer bust, wins; equal totals draw; else lose. A "Win", "Draw" or "Lost" banner shows per hand | `Controller.cs:249-255`, `:291-299`; `Player.cs:468-527`; `PlayerUIController.cs:168-190` | Same |
| F58 | The split hand is settled the same way, separately | `Player.cs:529-573` | Same (Q5, Q7) |
| F59 | Every win pays 1 to 1 | `Player.cs:491-503`, `:545-555` | Same (Q18) |
| F60 | The holder hears a win, lose or draw sound for the first hand only | `Player.cs:483`, `:497`, `:511`, `:520` | Same |
| F61 | A seat freed during the round is not settled | `Player.cs:475` | Same (Q10) |
| F62 | Cards, banners and the dealer total stay until the next start or a reset | no clearing code outside `Controller.cs:111-119`, `:257-269` | Same |

### J. Timer, helpers, input, sound, range

| # | Upstream does | Where | Port |
|---|---|---|---|
| F63 | 30 s per round per player for all their actions, counted down on the holder's panel; at 0 the turn ends as a stand. Actions do not restart it | `Player.cs:61`, `:112-128` | Same length, by shared clock (C9) |
| F64 | Helpers, when on: each hand's total is shown above it to everyone in range | `PlayerUIController.cs:78-110`; `CHANGELOG.txt:13` | Same |
| F65 | Pointer input: every button is a uGUI `Button` on a world-space canvas with VRChat's UI-shape component, usable by VR laser and desktop mouse | 111 buttons, section 5.3 | Click on layer 5 (section 8.4) |
| F66 | Touch input, VR only: inside a seat's capsule (radius 1.25 m, height 4 m) the holder can press the ten seat buttons with an index fingertip; a haptic tick and a press animation follow | `Interactable.cs:54-121`; `InteractableController.cs:55-124`; `P0.prefab` `Interactable Controller` | Left out at first (L5) |
| F67 | Buttons animate when pressed | `Animations/Button.controller` (`Press` trigger); `Interactable.cs:91-94`, `:110-113` | Same |
| F68 | Sounds, see section 5.5 for clip, trigger and audience | `AudioController.cs:50-132`; `ChipController.cs:79-82`, `:95`, `:103-110` | Same, C19 |
| F69 | The table's UI, camera and sounds are active only for a player within 5 m of a point at the middle seat's standing place; checked 20 frames after load for players who spawn inside | `DistanceOptimizer.cs:36-121`; sphere radius at `B.prefab:4751`; `CHANGELOG.txt:7`, `:19` | Same radius, by head distance (C10) |
| F70 | Walking out of range releases any seat the player holds | `DistanceOptimizer.cs:105-111` | Same |
| F71 | The table's sound source follows the listener along a box above the table; chip sounds play at the player | `AudioController.cs:43-48`; `ChipController.cs:33-36` | Fixed source at the table (C10) |

### K. Leaving and other edge cases

| # | Upstream does | Where | Port |
|---|---|---|---|
| F72 | A holder leaves the world: every remaining client stands that hand if it was mid-turn, and the table owner's client frees the seat; the round goes on | `Player.cs:459-465`, `:211-235`; `CHANGELOG.txt:16` | Same; done by the referee |
| F73 | The table owner leaves the world: VRChat hands the objects to another player, which triggers the reset of F6 **(reading)** | `Controller.cs:301-304` | Same |
| F74 | The table object is disabled at run time: the local player's seats are stood and released; if the local player is table owner the table is reset | `DisableFixer.cs:32-51`; `README.md:34` | Maps to removing the snippet element (L7) |
| F75 | A seat object changing owner mid-turn releases the seat | `Player.cs:450-457` | Covered by F72 |
| F76 | A debug panel per seat (inactive in the prefab) shows owner, flags and animator states | `PlayerDebug.cs:42-54`; `P0.prefab` `Debug Panel (inactive)` | Left out (L1) |

### L. Late joiners, as upstream behaves

| # | Upstream does | Where | Port |
|---|---|---|---|
| F77 | A late joiner receives only the ten synced fields of section 3.1. They do not receive the cards on the table, split state, banners, the "wants to hit" marks or the deck counts, because those travel as one-off events | sections 3.1 and 3.2 | **Changed on purpose** (C1): a late joiner sees the whole table as it is |
| F78 | The round-in-progress flag is not sent at round start: `GameActive = true` is set without a serialization request, so a late joiner's client believes no round is running | `Controller.cs:165` (no `RequestSerialization` until `:252`) | Fixed by C1 |

### Quirks in upstream (all **reading**, none run) and the proposed decision

"Keep" means the port reproduces it and a golden vector pins it. "Fix" means the port differs; the
literal behaviour stays available behind a constant so the golden vectors still compare. Every "fix" that
changes money or cards needs Shane's yes (question K3).

| # | Quirk | Where | Proposal |
|---|---|---|---|
| Q1 | The two of clubs never runs out. `InitializeDeck` gives index 0 a count of 999, written for a 53-entry list whose entry 0 is an empty card (`DeckManager.cs:32-44`), but the serialized list has 52 entries and entry 0 is `[2] 2 Clubs` | `DeckManager.cs:78-81`; `B.prefab:8064` | Fix (one line), ask |
| Q2 | Draws are uniform over card types, not over remaining cards, and a used-up type passes its chance to the next index up | `PlayerDeck.cs:203-258` | Keep |
| Q3 | Remaining counts are kept per client and changed only by events, so clients that joined late or missed an event disagree | `Dealer.cs:299` and the 1,165 handlers like it | Replaced by counts derived from the cards in state (C1) |
| Q4 | Splitting aces miscounts. The two aces total 12 with one 11-ace recorded; split moves 11 to the split hand, leaving the first hand at 1 with an 11-ace on record and the split hand at 11 with none. Example: first hand then draws a ten and shows 11, not 21 | `Player.cs:366-369` with `PlayerDeck.cs:150-173` | Fix, ask |
| Q5 | After a split the table bet is doubled and **each** hand is settled at the doubled bet, so two wins pay four times the original bet and two losses cost four times. Chips can go below 0 | `Player.cs:359-362`, `:487`, `:501`, `:541`, `:553` | Fix (settle each hand at the original bet), ask |
| Q6 | A split goes ahead even when the raise is refused because of bets on other tables; the hands then play at the undoubled bet | `Player.cs:359-362`; `ChipController.cs:69-73` | Keep unless Q5 is fixed, then moot |
| Q7 | Only the splitter's client knows the hand was split (`HasSplit` is local), so other clients never show the split hand's result banner | `Player.cs:41`, `:357`, `:529` | Fix: everyone sees it (C7) |
| Q8 | A timeout ends the turn through a local call, so other clients do not see the "stood" visuals for it | `Player.cs:118-123` | Fix (C7) |
| Q9 | The touch button can hit a hand that is already bust; only the pointer button is disabled by the bust animation | `Player.cs:317-341`; `Animations/NormalBust.anim` | Fix: the referee refuses it |
| Q10 | Leaving mid-round avoids a loss, because a freed seat is not settled | `Player.cs:475` | Keep (it is F61) |
| Q11 | A client that believes no round is running (F78) can take a free seat mid-round and is then settled with a total of 0: it wins when the dealer busts | `Player.cs:174`; `:468-527` | Fix: join is refused by the referee |
| Q12 | After a table reset, seats held by players other than the table owner keep `IsActive` while their holders lose control: the name stays, "Join Game" stays hidden, and only a VR touch press can retake the seat | `Player.cs:211-235`, `:591-594`; `PlayerUIController.cs:64`; `InteractableController.cs:84` | Fix: a reset frees every seat (C6) |
| Q13 | The hole card's identity is in the event name sent to all clients, and the dealer's total including the hole card is synced after each dealer card | `Dealer.cs:141`, `:230`, `:895-898` | Fix (C3) |
| Q14 | Seat 0's dealer panel does not follow the height slider: its instance lacks the constraint-source override the other six have | instance `4782549284858119980` ("Player 0") at `B.prefab:13761-13958` has no `sourceTransform` override; the other six instances each have one | Fix in the kit builder |
| Q15 | The chips and helpers toggle graphics are swapped by the button press itself, not by the synced value, so a new owner or late joiner sees the default graphic | button wiring, section 5.3 | Fix: derived from state (C18) |
| Q16 | `StartTurn` is sent once per taken seat, so the "new round" sound plays n times at once | `Controller.cs:220-223`; `Player.cs:252` | Fix: once |
| Q17 | The hitter hears the draw sound twice (once from the press, once from the card arriving) | `Player.cs:325`, `:338`; `PlayerDeck.cs:75` | Fix: one sound per card |
| Q18 | The felt prints "BLACKJACK PAYS 2 TO 1" and "DEALER MUST DRAW ON 16 AND STAND ON 17". The second matches the code; the first does not: no code pays more than 1 to 1 | felt albedo texture; `Player.cs:491-503` | Question K2 |
| Q19 | Two sprites used by the "your turn" marker are not in the repo (GUIDs `033336c308c8eb048a200b88b4c9012f`, `4e424f4b39c7f494faefd764418e86a3`) | `P0.prefab` `Player UI/Player UI Canvas/Player UI/Player/ACTIVE` | Replace with a repo sprite |
| Q20 | Every client that handles a release re-sends the stand event, so one leave makes up to N squared events | `Player.cs:213-216`, `:400` | Gone with C1 |
| Q21 | The split-allowed animator flag is raised again when the first hand's new second card matches its first; `Split()` refuses because the hand was already split | `PlayerDeck.cs:95-101`; `Player.cs:355` | Fix: flag follows state |

## 3. State and messages

### 3.1 Synced variables (10)

All synced behaviours use manual sync. "Requests" lists every `RequestSerialization()` that sends the
field.

| Behaviour | Field | Type | Writer | Written when | Requests |
|---|---|---|---|---|---|
| `Controller` | `UsingChips` (`Controller.cs:14`) | bool | table owner | chips toggle (`:65-79`). Also forced false locally, unsent, when the world switch is off (`BlackjackWorldController.cs:27-30`) | `:70`, `:78` |
| `Controller` | `GameActive` (`:17`) | bool | table owner | true at round start (`:165`, **not requested**); false at finish (`:251`) and reset (`:261`) | `:252`, `:262` |
| `Controller` | `ManualPlay` (`:19`) | bool | table owner | mode swap (`:47-51`) | `:50` |
| `Controller` | `HelpersEnabled` (`:28`) | bool | table owner | helpers toggle (`:53-63`) | `:56`, `:62` |
| `DeckManager` | `NumberOfDecks` (`DeckManager.cs:30`) | int | table owner (the deck object changes owner with the controller, `Controller.cs:44`) | plus and minus buttons | `:56`, `:64`, `:69` |
| `Dealer` | `TotalDeckValue` (`Dealer.cs:20`) | int | table owner | copied from the local total just before every send (`:895-898`) | `:230` (each dealer card), `:973` (reset), `Controller.cs:253` (finish) |
| `Player` x7 | `IsActive` (`Player.cs:36`) | bool | holder at join; table owner at release | `:182`, `:230` | `:184`, `:234` |
| `Player` x7 | `HasFinishedTurn` (`:37`) | bool | holder; table owner at release | true `:121`, `:259`, `:231`; false at round start `:445`. Starts true locally, unsent (`:91`) | `:260`, `:446`, `:234` |
| `Player` x7 | `currentOwnerID` (`:38`) | int | holder | join (`:183`) | `:184` |
| `PlayerDeck` x14 | `TotalDeckValue` (`PlayerDeck.cs:34`) | int | holder | copied from the local total before every send (`:861-863`); also changed directly by split (`Player.cs:366-369`) | `:190` (each card), `:921` (reset) |

Receivers copy the synced total into a local field in `OnDeserialization` (`Controller.cs:311-314`,
`Dealer.cs:900-910`, `PlayerDeck.cs:875-894`). The local copies exist because of a VRChat defect the
changelog cites (`CHANGELOG.txt:20`).

Four more requests send nothing useful: `Player.cs:613`, `:623`, `:633`, `:643` follow a change to
`TotalBet`, which is not synced.

Sync mode by behaviour: manual for `Controller`, `Dealer`, `DealerUIController`, `DeckManager`, `Player`,
`PlayerDebug`, `PlayerDeck`, `PlayerUIController`; none for `AudioController`,
`BlackjackWorldController`, `ChipController`, `DisableFixer`, `DistanceOptimizer`, `Interactable`,
`InteractableController` (the `UdonBehaviourSyncMode` attribute on each class).

### 3.2 Network events (24 call sites, all to everyone, none with arguments)

| Event | Sent at | Sender | Effect on each client |
|---|---|---|---|
| `Controller.ResetDelayStart` | `Controller.cs:107` | whoever pressed Start | mark round active locally, clear the table, run `StartMatch` 5 frames later (`:121-130`) |
| `Player.StartTurn` (on each seat in the round) | `Controller.cs:222` | table owner | holder: open controls; table owner: slide in the dealer panel; sound (`Player.cs:237-253`) |
| `Controller.GlobalFinishMatch` | `Controller.cs:254` | table owner | round inactive locally; settle every seat (`:291-299`) |
| `Controller.ResetTable` | `Controller.cs:277`, `:283` | table owner | reset (`:257-269`) |
| `Dealer.StartMatch`, `Dealer.StartMatchSecondCard` | `Dealer.cs:103`, `:108` | table owner | table owner draws (`:111-129`); everyone marks the next dealer card as the hole card (`:115`) |
| `Dealer.GlobalFlip` | `Dealer.cs:65` | table owner | flip the hole card (`:96-99`) |
| `Dealer.NetworkSpawnCard{c}DeckPos{p}` | `Dealer.cs:141` | table owner | create card c at dealer position p; lower that type's count. 583 generated handlers, c 0 to 52, p 0 to 10 (`:299-881`; generator in the comment at `:884-890`) |
| `DealerUIController.Bust` | `Dealer.cs:88` | table owner | table "Bust" banner (`DealerUIController.cs:250-254`) |
| `Player.StartMatch`, `Player.StartMatchSecondCard` | `Player.cs:143`, `:148` | table owner | holder draws (`:151-170`) |
| `Player.GlobalReleaseControl` | `Player.cs:202` | holder | stand if mid-turn; table owner takes the seat objects and frees the seat (`:211-235`) |
| `Player.HitMeNormal`, `Player.HitMeSplit` | `Player.cs:271`, `:277` | table owner (manual play) | holder draws (`:317-341`) |
| `Player.MarkNormalHit`, `Player.MarkSplitHit` | `Player.cs:285`, `:297` | holder (manual play) | "wants to hit" mark and bleep (`:305-315`) |
| `Player.SyncedSplit` | `Player.cs:371` | holder | move the second card to the split row, split visuals (`:380-387`) |
| `Player.EndTurn` | `Player.cs:400` | whoever called `Stand` | holder sets finished; everyone hides the controls (`:255-267`) |
| `Player.Bust` | `Player.cs:418`, `:425` | holder | bust sound, then as `EndTurn` (`:403-410`) |
| `PlayerDeck.NetworkSpawnCard{c}DeckPos{p}` | `PlayerDeck.cs:67` | holder | as the dealer's, for a player hand. 583 handlers (`:265-847`), text-identical to the dealer's block |
| `PlayerUIController.NormalBust`, `.SplitBust` | `PlayerDeck.cs:184`, `:180` | holder | bust banner on that hand (`PlayerUIController.cs:198-208`) |

### 3.3 Ownership transfers

| Call | Objects | New owner | When |
|---|---|---|---|
| `Controller.cs:42-44` | controller, dealer, deck | presser | "Take Control of Table" |
| `Player.cs:176-179` | seat, its two hands, its UI controller | joiner | "Join Game" |
| `Player.cs:225-228` | the same four | table owner | on release, run on the table owner's client |

Callbacks: `Controller.OnOwnershipTransferred` resets the table (`Controller.cs:301-304`);
`Player.OnOwnershipTransferred` releases a seat that changed hands mid-turn (`Player.cs:450-457`). There
is no ownership-request handler, so every transfer is granted.

### 3.4 Delayed events and per-frame work

| Where | Event | Delay |
|---|---|---|
| `Controller.cs:129` | `StartMatch` | 5 frames |
| `Controller.cs:206`, `:207` | per seat in the round: `GlobalStartFirstCard`, `GlobalStartSecondCard` | (i+1)/2 s, (i+2+n)/2 s |
| `Controller.cs:211`, `:212` | dealer: `GlobalStartFirstCard`, `GlobalStartSecondCard` | (n+1)/2 s, n+1 s |
| `Controller.cs:214`, `:215` | `StartActivePlay`, `GameActiveRefresh` | n+2 s |
| `Controller.cs:242` | `GameActiveRefresh` again | 2 s |
| `Controller.cs:278` | `ResetReset` (reset debounce) | 2 s |
| `Dealer.cs:71`, `:81` | `DealerPlay` | 1 s after the flip, 0.5 s per draw |
| `Player.cs:203` | `ResetJustReleasedControl` | 2 s |
| `Player.cs:327`, `:340` | `ResetJustHitNormal`, `ResetJustHitSplit` | 1 s |
| `Player.cs:373`, `:374`, `:377` | split: `SummonCard` on each hand, `ResetIsSplitting` | 1 s |
| `Player.cs:575` | `DelayedResetBet` | 5 frames |
| `PlayerUIController.cs:242` | `StandDelayed` | 0.75 s |
| `DealerUIController.cs:77`, `:165` | `DelayedStart`; `SetLayerToMirrorReflection` | 20 frames; 0.75 s |
| `DistanceOptimizer.cs:38`, `InteractableController.cs:46` | `DelayedStart` | 20 frames |

`Update` runs every frame in `AudioController`, `ChipController`, `DealerUIController`,
`InteractableController`, `Player`, `PlayerDebug` and `PlayerUIController`; `Interactable` uses
`PostLateUpdate` (`Interactable.cs:54`). The only use of frame time is the turn timer (`Player.cs:114`).

### 3.5 Random numbers

| Draw | Who draws | Where |
|---|---|---|
| Card type for a player hand, `Random.Range(0, 52)` | that seat's holder, on their own client | `PlayerDeck.cs:203` |
| Card type for the dealer | table owner | `Dealer.cs:237` |
| Which of 35 deal sounds, which of 48 flip sounds | each client for itself | `AudioController.cs:66`, `:126` |

No seeds are set. A holder's client chooses its own cards.

### 3.6 Persistence

None. No VRChat player-data, player-object or persistence call appears in `Scripts/` (search for
`persist`, `PlayerData`, `VRCPlayerObject`: no hits). Chips return to 100 on every world load
(`ChipController.cs:29`).

### 3.7 The port: state held by a referee

Upstream's weakness is section 3.2: the table is drawn from events, so anyone who was not there for an
event has a different table (F77, F78, Q3, Q7, Q8, Q11, Q12, Q15). The port keeps every fact needed to
draw the table in space state, written by one client.

**Roles**

| Role | Who | Does |
|---|---|---|
| Referee | elected by the runtime, one per instance | the only writer of game state. Runs the deal schedule, draws every card, plays the dealer, publishes results, frees seats of players who left. Takes over the work upstream split between the table owner's client and each holder's client |
| Table owner | a field, `Controller.tableOwnerSid` | the only player whose dealer-side presses are accepted |
| Holder | a field per seat, `Player.ownerSid` | the only player whose presses for that seat are accepted |

**Requests.** A press that upstream turned into a local call or an event to everyone becomes a one-shot
to the referee carrying the target behaviour id and the upstream event name, unchanged: `_TakeControl`,
`ReleaseControl`, `_AutoNormalHitMe`, `_AutoSplitHitMe`, `Stand`, `Split`, `_ManualNormalHitMe`,
`_ManualSplitHitMe`, `_TakeOwnership`, `GlobalStartMatch`, `_ToggleManualPlay`, `_ActivateHelpers`,
`_DeactivateHelpers`, `_ActivateChips`, `_DeactivateChips`, `AddDeck`, `SubtractDeck`,
`ForceGlobalReset`. The referee checks the sender against the role fields and the phase, then writes
state. The referee's own presses skip the wire. Chip presses (`_Add5ToBet` and the rest, `ResetChips`)
stay local, as upstream. A request lost while the referee changes is simply pressed again; the 30 s timer
guarantees a round cannot hang on a lost stand.

If spikes show one-shots are lost more often than at a referee change, the fallback is an intent queue
in one user-state leaf per player (sequence-numbered, last few entries), which the referee reads and
acknowledges in state. That uses one of the four user-state leaves.

**State** (all leaves under `pk1.blackjack.<inst>.`; one leaf per behaviour as the README defines):

| Leaf | Upstream fields kept | Fields added | Why added |
|---|---|---|---|
| `Controller` | `UsingChips`, `GameActive`, `ManualPlay`, `HelpersEnabled` | `tableOwnerSid`, `tableOwnerName`, `phase` (idle, dealing, turns, dealer, settled), `round`, `t0` (shared-clock second the phase began), `activeMask`, `step` | owner as data; a new referee or a late joiner resumes the schedule from `phase`, `t0`, `step` |
| `DeckManager` | `NumberOfDecks` | `commit`, `draws`, `seed` (empty until round end), `segment` | hidden information, below |
| `Dealer` | `TotalDeckValue` (face-up cards only until the flip) | `cards[]` (type index per position; -1 for a face-down card), `IsBust`, `flipped` | cards as state instead of events |
| `Player` x7 | `IsActive`, `HasFinishedTurn`, `currentOwnerID` as `ownerSid` | `ownerName`, `HasSplit`, `CanSplit`, `wantNormal`, `wantSplit`, `stood`, `result[2]` | Q7, Q8, Q15, Q21; names for late joiners |
| `PlayerDeck` x14 | `TotalDeckValue` | `cards[]`, `IsBust`, `NumOfAces` | cards as state; a new referee continues the same arithmetic |

24 leaves plus the runtime's `ref`, each well under 1 KB, against limits of 2,048 keys and 16,384 bytes
per leaf. Writes peak at about four per second during the deal, against the shared bucket of 20 per
second. No networked objects are needed: the kit has no synced transform, grabbable or seat.

**Drawing the table.** Each client derives everything it shows from state: a card index appearing in a
`cards[]` array turns that slot on and plays the deal sound; `flipped` turning true plays the flip;
`result` sets the banners; role fields decide which panels are on. One function applies the whole state
without animation, used when a client starts. That function is what makes a late joiner see the table
exactly.

**Timers.** `t0` plus the upstream offsets of section 3.4 replaces delayed events, so a new referee
continues a half-finished deal or dealer turn. The turn timer is `t0 + 30` on the shared clock; every
client shows the same number and the referee ends unfinished turns at the deadline.

**When someone leaves**

| Who leaves | Port |
|---|---|
| A holder | the referee stands the hand if mid-turn and frees the seat; not settled (F61, F72) |
| The table owner | the referee makes its own player table owner and resets the table (F73) |
| The referee | the runtime elects another; it reconciles first (frees seats whose holder is gone, replaces a gone table owner, which resets the table) and then resumes from state |
| Everyone | state stays for 24 h; the next player becomes referee, finds holders gone, frees the seats and resets |

### 3.8 The port: hidden information

Two things need hiding, and every shared channel is readable by all.

1. **The hole card.** No player is entitled to see it before the flip, the dealer included (upstream has
   no peek, F43). So it needs **commit and reveal, not sealed delivery**: nothing has to be delivered to
   anyone.
2. **Future cards.** Upstream has no deck order to hide (F30, F31): the future does not exist until a
   draw. The port keeps that algorithm and feeds it from a seed, which gives the "deck order" the plan
   speaks of and makes dealing checkable afterwards.

Design:

- At round start the referee makes a 32-byte seed with `crypto.getRandomValues` and publishes the
  runtime's `commit(value)` of it, bound to the round number and instance key, in the `DeckManager` leaf.
- Draw number k of the round takes its start index from a keyed function of the seed and k, in place of
  `Random.Range(0, 52)` (`PlayerDeck.cs:203`), then runs upstream's probe unchanged.
- The hole card is draw number n of the round. The referee writes `Dealer.cards[0] = -1` and leaves the
  hole card's value out of `Dealer.TotalDeckValue` until the flip (C3). Until then the public counts do
  not include it; the referee uses the true counts, and the replay after the reveal uses them too.
- At the flip the referee writes the real index. At settlement it calls `reveal()`, publishing the seed.
  Any client can then replay every draw of the round against the commitment. The Node tests always do; a
  mismatch in the app is logged.

What this buys and what it does not:

- A referee cannot change a card after the fact, and cannot pick cards as the round develops. Upstream
  lets every holder's client choose its own cards as it draws (`PlayerDeck.cs:203` runs on the holder's
  client), and the table owner's client choose the dealer's (`Dealer.cs:237`).
- The referee's client knows the seed, so a modified referee client knows the hole card and the start
  index of every later draw of the round. That is the plan's stated trust level ("the referee's client
  knows what it deals"). Upstream is weaker: it hands the hole card to every client (Q13).
- **If the referee leaves before the reveal, the seed is gone.** The new referee starts segment 2 with a
  new seed and commitment, and treats a still-hidden hole card as not yet drawn: it is drawn from the new
  segment at the flip. Nobody gains from it, since the card the old referee knew is discarded, but the
  first segment can no longer be checked, and state says so (`segment`, with the first marked unverified).
- **Where sealed delivery helps:** escrow. The referee can `seal(standbyUid, seed)` for the next-ranked
  candidate and store the sealed blob in the `DeckManager` leaf. On a referee change the standby
  `open()`s it and finishes the same seed, so the round stays checkable. Cost: two clients know the seed,
  and each client must publish a key (one user-state leaf, if the runtime's `seal` works that way). This is
  optional and can come after the first working version.

## 4. Platform-call census

Counts are live call sites in `Scripts/*.cs`, without the generated handlers and without commented-out
code. "README" means `portkit/README.md`, "types.ts" means `portkit/ts/src/types.ts`.

| VRChat / Udon API | Count | Files (count) | portkit equivalent | Gap and what it costs the player |
|---|---|---|---|---|
| `[UdonSynced]` | 10 | Controller 4, Player 3, Dealer 1, DeckManager 1, PlayerDeck 1 | `synced` fields, one leaf per behaviour | none |
| `RequestSerialization()` | 23 | Controller 8 (one of them on the dealer, `:253`), Player 8, DeckManager 3, Dealer 2, PlayerDeck 2 | `RequestSerialization()` | none |
| `OnDeserialization` | 3 | Controller, Dealer, PlayerDeck | `OnDeserialization()` | none |
| `OnPreSerialization` | 3 overrides, 1 direct call (`PlayerDeck.cs:194`) | Controller, Dealer, PlayerDeck | not in the README's runtime shape | none: inlined before the request |
| `SendCustomNetworkEvent(All, ...)` | 24 sites, 1,166 generated handlers plus 20 written ones | Player 11, Controller 5, Dealer 5, PlayerDeck 3 | `SendCustomNetworkEvent(target, name)` | 18 become requests to the referee; the rest become state. The handler must learn who sent the event; the README does not say it can (R9) |
| `SendCustomEvent` | 2, plus 111 button calls in prefabs | Interactable 2 | `events` in `bindings.json` | none |
| `SendCustomEventDelayedSeconds` | 18 | Controller 8, Player 6, Dealer 2, DealerUIController 1, PlayerUIController 1 | same name | none |
| `SendCustomEventDelayedFrames` | 5 | Controller, DealerUIController, DistanceOptimizer, InteractableController, Player | not in the README | none: 5 frames becomes 0.1 s, 20 frames 0.3 s |
| `Networking.LocalPlayer` | 13 | nine files | `Networking.LocalPlayer` | none |
| `Networking.IsOwner` | 22 | Player 7, Dealer 5, Controller 3, PlayerDeck 3, four files 1 each | `Networking.IsOwner`, `Networking.IsReferee` | none; most become a role check |
| `Networking.SetOwner` | 11 | Player 8, Controller 3 | role fields written by the referee | none |
| `Networking.GetOwner(...).displayName` | 3 | Player, PlayerDebug, PlayerUIController | `PlatformPlayer.name` (types.ts:38-43), stored in state at join | none |
| `OnOwnershipTransferred` | 2 | Controller, Player | not in the README; the platform has no such event | none: the port compares the role fields in `OnDeserialization` |
| `OnPlayerLeft` | 1 | Player | `Platform.onPlayers` exists (types.ts:191); a behaviour hook is not in the README | none once the runtime passes it on (R9) |
| `OnPlayerTriggerEnter` / `Exit` | 4 | DistanceOptimizer 2, InteractableController 2 | `triggerEnter` / `triggerExit` with `playerSid` (types.ts:81-94), or head pose (types.ts:230) | none; the port uses head distance |
| `VRCPlayerApi.GetPlayerCount()` | 5 | PlayerDeck 4, Dealer 1 | `Platform.players()` | none; the solo-player branches disappear with C1 |
| `GetTrackingData(Head)` | 3 | DistanceOptimizer 2, AudioController 1 | `LocalPoses.head` | none |
| `GetTrackingData(LeftHand / RightHand)` | 2 | Interactable | `LocalPoses.leftHand`, `.rightHand` | none for the local player |
| `GetBonePosition(IndexDistal)` | 4 | Interactable | **gap**: no finger bones | touch buttons would test the hand, not the fingertip (L5) |
| `IsUserInVR()` | 1 | Interactable | not in types.ts. The SDK documents `scene.IsVR()` (`Docs/javascript-api/scene-api.md:340`) | none once exposed |
| `PlayHapticEventInHand` | 2 | Interactable | not in types.ts. The SDK documents `scene.SendHapticImpulse` (`Docs/javascript-api/scene-settings.md:163`), which contradicts the plan's "no haptics" | only matters for touch buttons (L5) |
| `GetPosition()` | 1 | ChipController | head pose | none |
| `.playerId` | 2 | Player | `PlatformPlayer.sid` | none |
| `Instantiate` / `Destroy` (cards) | 2 / 2 | Dealer, PlayerDeck | **no op for it** | none visible if pooled slots work (section 8.3, R1) |
| `SetParent`, `SetPositionAndRotation` | 3 / 3 | Dealer, Player, PlayerDeck | not needed with slots | a split card reappears in the split row instead of moving there |
| `Animator.SetTrigger` / `SetBool` / `SetFloat` | 23 / 20 / 2 | PlayerUIController 33, DealerUIController 6, Dealer 2, Interactable 2, Player 1, PlayerDeck 1 | relay `animTrigger`, `animBool`, `animFloat` | none |
| `Animator.ResetTrigger` | 13 | PlayerUIController 11, DealerUIController 1, Player 1 | **not in the relay op table** | without it stale triggers fire late (a banner from the last round); needs a new op `animResetTrigger` |
| `Animator.CrossFadeInFixedTime` | 2 | Controller, PlayerUIController | **not in the relay op table** | the dealer panel could stay slid in after a reset; needs a new op `animPlay` |
| `Animator.GetBool` | 5 | PlayerDebug | none | none: debug panel is left out |
| `GameObject.SetActive` | 75 | DealerUIController 49, InteractableController 11, PlayerUIController 10, DistanceOptimizer 4, Player 1 | `HostObject.setActive` or relay `active` | none |
| `.layer = 0 / 18` | 5 | DealerUIController 3, PlayerUIController 2 | `active` (upstream uses layer 18 to hide a canvas and stop the pointer) | none |
| TMP `.text =` | 31 | PlayerDebug 9, PlayerDeck 8, PlayerUIController 7, Player 4, DealerUIController 3 | relay `text`, sent only on change | none |
| `AudioSource.PlayOneShot` | 17 | AudioController 14, ChipController 3 | `HostObject.playClip(index)` (types.ts:117); the SDK's `PlayOneShot(index)` (`Docs/components/audio.md:43`) | none if clips may overlap (R7) |
| `AudioSource.isPlaying` | 2 | ChipController | **gap** | none: a clip-length timer stands in |
| `Collider.ClosestPoint` | 7 | Interactable 5, AudioController 1, DistanceOptimizer 1 | arithmetic on poses | none |
| `Random.Range` | 4 | AudioController 2, Dealer 1, PlayerDeck 1 | seeded stream for cards; `Platform.random()` for sounds | none |
| `Time.deltaTime` | 1 | Player | shared-clock deadline | none; timers agree across clients |
| `Button.interactable`, `Slider.value` | 1 / 1 | DealerUIController | no slider event in `bindings.json` | height control becomes two buttons (C12) |
| `Update` per frame | 7 behaviours | section 3.4 | `Update()` at 20 Hz | none for UI. Too slow for fingertip tests (L5) |
| `PostLateUpdate` | 1 | Interactable | none | L5 |
| `Debug.Log` | 25 | seven files | `Platform.log` | none |
| `[FieldChangeCallback]` | 1 | `Player.cs:30` | a setter | none |
| `OnDisable` | 1 | DisableFixer | `SnippetElement.connected` (types.ts:158-166) | L7 |
| UI-shape component on canvases | 11 in prefabs (script inside a DLL, GUID `661092b4961be7145bfbe56e1e62337b`; taken to be VRChat's `VRCUiShape`, not resolvable from the repo) | `B.prefab`, `P0.prefab` | layer 5 colliders with `click`, or `uiButton` | none (section 8.4) |
| Camera into a render texture | 1 per table | `B.prefab:8920-8952` | a Unity component in the kit; whether the bundle check accepts it is not known (R6) | question K9 |

Not used anywhere: stations, pickups, object sync, object pools, player data, URL or video loading,
`IsMaster`, `OnPlayerJoined`, `OnOwnershipRequest`.

## 5. Object model

Read from the prefab YAML, scripts matched by the GUIDs in `Scripts/*.cs.meta`. UdonSharp 1.x stores
each behaviour twice: a proxy `MonoBehaviour` whose `m_Script` is the `.cs` file and which holds the
serialized fields, and an `UdonBehaviour` (GUID `45115577ef41a5b4ca741ed302693907`) that the buttons call.

### 5.1 Hierarchy

Entry prefab (`S.prefab`):

```
Blackjack System                [BlackjackWorldController]            S.prefab:174
  Tables - DELETE THROUGH SCRIPT NOT MANUALLY -      (empty; tables are added here by the inspector)
  Chip Controller               [ChipController]                      S.prefab:292
    Audio                       [AudioSource]                         S.prefab:35
```

One table (`B.prefab`; 134 objects of its own, 9 nested prefab instances):

```
Blackjack                       [DisableFixer]                        B.prefab:7587
  Game Controller               [Controller]                          B.prefab:7676
  Deck                          [DeckManager]                         B.prefab:8050
  Dealer                        [Dealer]                              B.prefab:5815
    Card Positions/1..11        11 transforms: 5 at z 0.315, 5 at z 0.478, 1 at z 0.666, y 0.91
    Dealer UI Controller        [DealerUIController]                  B.prefab:6267
      Dealer Table Canvas       canvas, Animator (Dealer Table Canvas.controller); child BUST banner
      Auto Canvas               canvas, Animator (Auto Canvas.controller)
        Mask/Idle/Take Ownership                       button
        Mask/Owner/Start Game                          button
        Mask/Owner/Game Settings/Manual Play/Swap to Manual        button
        Mask/Owner/Game Settings/Helpers/Use Helpers On, Use Helpers Off   buttons
        Mask/Owner/Game Settings/Use Chips/Use Chips On, Use Chips Off     buttons
        Mask/Owner/Game Settings/Deck Count/Add, Subtract, Count/Text      buttons, text
      Manual Canvas
        Manual Dealer Canvas    canvas: Mask/Owner (Start Game, Swap to AI Play),
                                Mask/Height Adjustment/Slider, Mask/Not Owner/Take Ownership
        Height Adjustment       Animator (Height Adjustment.controller); child Height
        Settings                canvas: Helpers, Use Chips, Deck Count (same six buttons again)
      Reset Button              canvas: Take Ownership (label "Reset Table"), Reset Chips
  Players
    Positions/Position 0..6     7 empty markers
    Players/Player 0..6         7 instances of P0.prefab                B.prefab:11779-14994
  Viz                           table mesh (FBX instance)               B.prefab:14995
  Dealer Camera
    Camera                      orthographic, size 0.08, near 0.05, far 0.25, Default layer only
    Dealer Screen               screen mesh (FBX instance, B.prefab:11678); material assigned by the inspector
    Dealer Card Canvas          canvas: two images, Dealer Values text
  Audio Controller              [AudioController], trigger box 2.3 x 0 x 1.2   B.prefab:5621
    Audio                       [AudioSource]
  Distance Optimizer            [DistanceOptimizer], trigger sphere r 5 at (0, 0.75, 1.25)   B.prefab:4684
```

One seat (`P0.prefab`; 206 objects):

```
Player N                        [Player]                              P0.prefab:17362
  Normal Deck                   [PlayerDeck]                          P0.prefab:16710
  Split Deck                    [PlayerDeck]                          P0.prefab:7137
  Player UI                     [PlayerUIController]                  P0.prefab:14684
    Player UI Canvas            canvas
      Player UI                 Animator (Player UI Animator.controller)
        Player/Buttons          HIT NORMAL, HIT SPLIT, SPLIT, STAND (button + Button.controller each)
        Player/Normal Adjustment, Split Adjustment   HELPER text; Bust, Win, Draw, Lose banners
        Player/ACTIVE           "your turn" marker (two sprites missing, Q19)
        Player/Timer            timer text
        Player/Manual Hits (two groups)   5 inactive popups, each ParticleSystem + UI Popup.controller;
                                           nothing references them (L2)
    Owner UI/Player UI Canvas (1)       canvas: LEAVE button
    Not Owner UI/Player Idle            canvas: JOIN button
    Not Owner UI/Player Name            canvas: name text
  Card Position Animator
    Positions/1..11             ParentConstraint to "Normal Adjustment"; 11 transforms
    Split Positions/1..11       ParentConstraint to "Split Adjustment"; 11 transforms
  Dealer Player UI Canvas       canvas, Animator (Manual Viz Animator.controller), PositionConstraint
                                to the table's Height transform: PLAYER NAME, Normal and Split
                                (COUNT text, HIT button, Bust), Stand button, StoodViz
  Interactable Controller       [InteractableController], trigger capsule r 1.25 h 4   P0.prefab:35678
    Join Game, Stand, Split, Hit Split, Hit Normal, Leave Game, Add 10, Add 5, Remove 10, Remove 5
                                each: trigger box, [Interactable], ParentConstraint to its UI button
  Debug Panel (inactive)        [PlayerDebug], two canvases           P0.prefab:7685
  Chip Panel                    canvas, Chips Animator (Chips Animator.controller):
                                Add 10, Add 5, Remove 10, Remove 5 buttons; Current Bet; Total Chips
```

Totals for one table with seven seats: about 1,576 game objects, 62 canvases (6 + 7 x 8), 111 uGUI
buttons (20 + 7 x 13), 129 animators (3 + 7 x 18), 119 Udon behaviours, 125 box colliders, 70 touch
boxes, 165 card positions (7 x 22 + 11), 35 particle systems (all in the dead popups).

Layout in table space (computed from the transforms): seat roots lie on a circle of radius 0.9 m about
(0, 0, -0.9), yawed -67.5, -44, -22.5, 0, 22.5, 44 and 67.5 degrees; each holder stands 1.25 m out along
the seat's forward axis, so the middle seat's player stands at about (0, 0, 1.25). Player cards lie about
0.6 to 0.77 m out from the seat root at y 0.85. The dealer's canvases are near z -1.07; the overhead
screen is at (0, 2.06, -1.18). The table mesh's bounds were not read (binary FBX); the footprint
including standing players is roughly a 2.3 m radius about (0, 0, -0.1).

### 5.2 Serialized fields of each behaviour

`->` means a reference inside the same prefab; "inst" means it is set per instance in `B.prefab`.

| Behaviour (object) | Fields and what they reference |
|---|---|
| `BlackjackWorldController` (`Blackjack System`) | `TablePrefab` -> `B.prefab`; `ChipController` -> Chip Controller; `BlackjackTables`, `TableGameObjects`, `TableCameraMaterials`, `TableRenderTextures`: empty, filled by the inspector (`S.prefab:195-201`) |
| `ChipController` (`Chip Controller`) | `UseChipSystem` 1; `BlackjackTables` empty; `StartingChips` 100; `Audio` -> child `Audio`; `NotEnoughChipsClip` -> `Audio/Additional Sounds/Bleep Low - Big Room.ogg`; `AddToBetClip` -> `Audio/Chips/Bet chip 1.ogg` (`S.prefab:313-321`) |
| `Controller` (`Game Controller`) | `UsingChips` 0; `ChipController` null (inspector sets it, `Editor:193`); `GameActive` 0; `ManualPlay` 0; `AudioController` -> Audio Controller; `Dealer` -> Dealer; `Players` -> the 7 seat `Player` components in seat order; `ActivePlayers` empty; `Deck` -> Deck; `HelpersEnabled` 0; `CanChangeSettings` 0; `TableIndex` 0; `Camera` -> Dealer Camera/Camera; `CameraRenderer` -> the Dealer Screen mesh renderer; `RendererMaterial`, `RenderTexture` null (`B.prefab:7676-7714`) |
| `DeckManager` (`Deck`) | `NumberOfDecks` 2; `CardReferences`: 52 card prefabs in the order 2, 3, ... 10, Jack, King, Queen, Ace, each rank as clubs, diamonds, hearts, spades (aces as diamonds, clubs, hearts, spades); `NumOfEachCardLeft` null (`B.prefab:8063-8064`) |
| `Dealer` (`Dealer`) | `DeckPositions` -> Card Positions/1..11; `GameController` -> Game Controller; `Deck` -> Deck; `DealerUI` -> Dealer UI Controller; counters 0 |
| `DealerUIController` (`Dealer UI Controller`) | `BlackjackController`, `DealerController`; `AutoCanvas` and its animator; `AutoCanvasButtons` -> the 9 auto-canvas buttons; `OwnerUI` -> Auto Canvas/Mask/Owner; `ManualOwnerUI` -> Manual Dealer Canvas/Mask/Owner; `ManualOwnerSettings` -> Manual Canvas/Settings; `ManualNotOwnerUI` -> .../Mask/Not Owner; `OwnerSlider` -> .../Mask/Height Adjustment; `UIHeightSlider` -> its Slider; `UIHeightAnimator` -> Manual Canvas/Height Adjustment; `DeckCount`, `DeckCountManual` -> the two count texts; `NotOwnerUI` -> Auto Canvas/Mask/Idle; `TableUIAnimator` -> Dealer Table Canvas; `ChipToggle`, `ChipOn`, `ChipOff`, `DeckChanger`, `DeckSubtractArrow`, `HelpersChanger`, `HelpersOn`, `HelpersOff` and their `...Manual` twins -> the toggle objects (in the auto canvas `ChipOn` points at the object named "Use Chips Off" and `ChipOff` at "Use Chips On"; same for helpers; the manual set is the other way round, and `DealerUIController.cs:183-201` mirrors one set from the other); `DealerValuesCanvas` -> Dealer Camera/Dealer Card Canvas; `DealerValues` -> its text |
| `DisableFixer` (`Blackjack`) | `Players` -> 7 seats; `Controller` |
| `AudioController` (`Audio Controller`) | `isActive` 0; `Audio` -> child source; 14 clip fields, section 5.5 |
| `DistanceOptimizer` (`Distance Optimizer`) | `GameController`, `AudioController`, `Players` -> 7 seats, `DealerUI`; `TurnOff` -> Dealer Camera, Manual Canvas, Auto Canvas, Dealer Table Canvas, Reset Button (`B.prefab:4708`) |
| `Player` (seat root) | `BlackjackController` and `Deck`: inst; `PlayerNum` 0 (set at start, `Controller.cs:85-88`); `NormalDeck`, `SplitDeck`, `PlayerUI` -> children; `PlayerName` -> Dealer Player UI Canvas/.../PLAYER NAME; `BetPanel` -> Chip Panel; `ChipAnimator` -> Chips Animator; `CurrentBet`, `TotalChips` -> chip panel texts; `Timer` -> timer text; flags 0 |
| `PlayerDeck` (Normal Deck, Split Deck) | `PlayerController` -> seat; `DeckPositions` -> Positions/1..11 (normal) or Split Positions/1..11 (split); `DealerValueDisplay` -> the matching COUNT text on the dealer panel; `isSplitDeck` 0 on both (set at `Player.cs:89-90`) |
| `PlayerUIController` (`Player UI`) | `PlayerController`; `OwnerUI` -> Owner UI; `DealerUI` -> Dealer Player UI Canvas/Mask; `DealerUICanvas` -> Dealer Player UI Canvas; `NotOwnerUI` -> Not Owner UI/Player Idle; `PlayerName` -> Not Owner UI/Player Name; `PlayerUIAnimator` -> Player UI Canvas/Player UI; `DealerUIAnimator` -> Dealer Player UI Canvas; `PlayerOwner` -> name text; `NormalHelper`, `SplitHelper` -> the two HELPER texts |
| `InteractableController` | `Player` -> seat; ten `Interactable` references; `Controller` null (taken from the seat at start, `InteractableController.cs:51`) |
| `Interactable` x10 | `Event` and `PressViz`: Join Game `_TakeControl` / JOIN; Leave Game `ReleaseControl` / LEAVE; Hit Normal `_AutoNormalHitMe` / HIT NORMAL; Hit Split `_AutoSplitHitMe` / HIT SPLIT; Stand `Stand` / STAND; Split `Split` / SPLIT; Add 10 `_Add10ToBet`; Add 5 `_Add5ToBet`; Remove 10 `_Remove10FromBet`; Remove 5 `_Remove5FromBet` (each with its chip button's animator); `TargetBehaviour` -> seat; `PressName` "Press"; `Fingie`, `ClosestPoint` null. Box sizes: join 0.3 x 0.1 x 0.025; leave 0.15 x 0.05 x 0.025; hit, stand, split 0.1 x 0.1 x 0.025; chips 0.035 x 0.035 x 0.025 |
| `PlayerDebug` (`Debug Panel`) | `PlayerController` and nine texts |

Per-instance overrides in `B.prefab` for each seat: name `Player 0` to `Player 6`, position and yaw,
`Player.BlackjackController` -> Game Controller, `Player.Deck` -> Deck, and (six of seven, Q14) the
`PositionConstraint` source on `Dealer Player UI Canvas` -> `Manual Canvas/Height Adjustment/Height`.

### 5.3 Button wiring

Every button's `onClick` calls `UdonBehaviour.SendCustomEvent(string)`. Table buttons add a second call,
`PlayUIInteract` on the audio controller; toggles add two `GameObject.SetActive` calls that swap the on
and off graphics.

| Button (in `B.prefab`) | Target and event |
|---|---|
| Auto Canvas `Idle/Take Ownership`; Manual `Not Owner/Take Ownership` | Game Controller `_TakeOwnership` |
| Auto `Owner/Start Game`; Manual `Owner/Start Game` | Game Controller `GlobalStartMatch` (no click sound) |
| Auto `Swap to Manual`; Manual `Swap to AI Play` | Game Controller `_ToggleManualPlay` |
| `Use Helpers On` / `Use Helpers Off` (auto and manual) | Game Controller `_ActivateHelpers` / `_DeactivateHelpers`, plus graphic swap |
| `Use Chips On` / `Use Chips Off` (auto and manual) | Game Controller `_ActivateChips` / `_DeactivateChips`, plus graphic swap |
| `Deck Count/Add` / `Subtract` (auto and manual) | Deck `AddDeck` / `SubtractDeck` |
| `Reset Button/Take Ownership` | Game Controller `ForceGlobalReset` |
| `Reset Button/Reset Chips` | Game Controller `ResetChips` |
| `Height Adjustment/Slider` (`onValueChanged`) | target is null, event `_DealerHeightAdjustment`: does nothing; the value is polled at `DealerUIController.cs:204` |

| Button (in `P0.prefab`) | Target and event |
|---|---|
| `Player Idle/JOIN` | seat `_TakeControl` |
| `Owner UI/.../LEAVE` | seat `ReleaseControl` |
| `Buttons/HIT NORMAL`, `HIT SPLIT` | seat `_AutoNormalHitMe`, `_AutoSplitHitMe` |
| `Buttons/SPLIT`, `STAND` | seat `Split`, `Stand` |
| Chip Panel `Add 10`, `Add 5`, `Remove 10`, `Remove 5` | seat `_Add10ToBet`, `_Add5ToBet`, `_Remove10FromBet`, `_Remove5FromBet` |
| Dealer panel `Normal/HIT`, `Split/HIT` | seat `_ManualNormalHitMe`, `_ManualSplitHitMe` |
| Dealer panel `Stand` | seat `Stand` |

### 5.4 Animators and parameters

No clip has animation events. Nine of the eleven controllers are referenced by a prefab; code drives
eight of them.

| Controller | On | Parameters | Set by |
|---|---|---|---|
| `Player UI Animator` (8 layers) | each seat's `Player UI` | bools `CanSplit`, `HasSplit`, `MyTurn`, `Active`; triggers `Reset`, `Win`, `Draw`, `Lose`, `Split`, `StartGame`, `NormalBust`, `SplitBust`, `SplitWin`, `SplitDraw`, `SplitLose`, `ResetBust` | `PlayerUIController.cs:121-231`; `Player.cs:241` |
| `Manual Viz Animator` (7 layers) | each seat's `Dealer Player UI Canvas` | bools `Split`, `Stood`, `NormalBust`, `SplitBust`, `Active` (never set), `WantToHitNormal`, `WantToHitSplit`; triggers `Activate`, `Deactivate`; state `Active.PlayerDealerIdleOff` entered by cross-fade | `PlayerUIController.cs:129`, `:144`, `:158-162`, `:201`, `:207`, `:235-236`, `:251`, `:261`, `:271`; `Controller.cs:201` |
| `Chips Animator` | each seat's chip panel | bool `Active` | `Player.cs:106` |
| `Button` | 10 buttons per seat | trigger `Press` | `Interactable.cs:93`, `:112` |
| `Card Zoom In` (3 layers) | every card prefab | triggers `Flip`, `NotHidden`, `Reset` (never set) | `Dealer.cs:98`, `:177`; `PlayerDeck.cs:82` |
| `Dealer Table Canvas` | table | triggers `Reset`, `Bust` | `DealerUIController.cs:247-253` |
| `Auto Canvas` | table | bool `Active` | `DealerUIController.cs:170`, `:194` |
| `Height Adjustment` | table | float `Height`, used as the clip time of a paused state | `DealerUIController.cs:208`, `:212` |
| `UI Popup` | 5 dead popups per seat | none | nothing (L2) |
| `Card Flip`, `OWNERSHIPJUSTTRANSFERRED` | nothing | `Shown`; `OwnershipTransferred` | unused (L4) |

Clips drive rect positions and sizes, object active flags, the `enabled` flag of a `Button`, and colour
alpha of images and TMP text. Card rows follow the animated UI through `ParentConstraint`s, so the card
rows shift when a hand splits.

### 5.5 Audio sources and clips

| Source | Settings |
|---|---|
| `Audio Controller/Audio` (`B.prefab`) | volume 0.25, fully 3D, min 0 m, max 4 m, custom rolloff, priority 190, no clip, no play on awake. Moved every frame to the point of the trigger box nearest the listener (`AudioController.cs:47`) |
| `Chip Controller/Audio` (`S.prefab:35-46`) | volume 0.4, 3D, min 1 m, max 5 m, linear rolloff, priority 230. Moved every frame to the player (`ChipController.cs:35`) |

| Field | Clip | Played at | Heard by |
|---|---|---|---|
| `StartMatch` | `Audio/Cards/Shuffle Cards 5.ogg` | `Controller.cs:136` | everyone in range |
| `StartActivePlay` | `Audio/Additional Sounds/New Round.ogg` | `Player.cs:252` | everyone in range, once per seat in the round (Q16) |
| `DrawCard[35]` | `Audio/Cards/Deal A Card 1..35.ogg`, random | `PlayerDeck.cs:75`, `Dealer.cs:163`; again for the actor at `Player.cs:325`, `:338`, `Dealer.cs:79` | everyone in range |
| `FlipCard[48]` | `Audio/Cards/Flip Card 1..48.ogg`, random | `Dealer.cs:69` | table owner only |
| `SplitDeck` | `Audio/Cards/Random UI_5.ogg` | `Player.cs:364` | splitter |
| `Stand` | `Audio/Cards/Random UI_1.ogg` | `Player.cs:398` | whoever caused the stand |
| `Bust` | `Audio/Additional Sounds/Click - Big Room.ogg` | `Player.cs:407` | everyone in range |
| `WinMatch`, `LoseMatch`, `DrawMatch` | `Win round.ogg`, `Lose round.ogg`, `Castanets - Dembow.ogg` (all in `Additional Sounds`) | `Player.cs:497`, `:483` and `:520`, `:511` | holder |
| `DealerWantToHit` | `Audio/Additional Sounds/Bleep High - Big Room.ogg` | `Player.cs:308`, `:314` | everyone in range |
| `TakeControl`, `ReleaseControl` | `Audio/Chips/Bet chip 2.ogg`, `Bet chip 5.ogg` | `Player.cs:186`, `:198` | actor |
| `UIInteract` | `Audio/Cards/Random UI_3.ogg` | table buttons | presser, even out of range (`AudioController.cs:129-132`) |
| `AddToBetClip` | `Audio/Chips/Bet chip 1.ogg` | `ChipController.cs:81` (skipped while another chip sound plays), `:95` | bettor |
| `NotEnoughChipsClip` | `Audio/Additional Sounds/Bleep Low - Big Room.ogg` | `ChipController.cs:109` | bettor |

## 6. Assets

### 6.1 Counts and sizes (tracked files, without `.meta`)

| Kind | Files | Bytes | Reachable from the entry prefab |
|---|---|---|---|
| PNG | 36 | 135,211,227 | 31 files, 75,615,498 |
| TMP font assets and Udon program assets (`.asset`) | 22 | 34,483,322 | 19 files, 15,330,317 (4 fonts, 15 program assets) |
| Prefabs | 108 | 2,297,305 | all |
| OGG | 119 | 1,500,650 | 97 files, 1,136,483 |
| FBX | 4 | 707,008 | all |
| Fonts (`.ttf`, `.otf`) | 5 | 770,364 | 3 |
| Animation clips | 58 | 499,947 | 55 |
| Animator controllers | 11 | 123,536 | 9 (8 driven by code) |
| Materials | 14 | 38,037 | 7 |
| C# | 16 | 230,048 | not shipped |

Prefabs: the entry prefab, the table, the seat, 52 card prefabs (`Prefabs/Card Prefabs/[v] Name.prefab`)
and 53 card mesh prefabs (`Prefabs/Card Prefabs/Card Meshes/`, 52 faces and `Empty Card`): 108 in all.

### 6.2 Models

| File | Bytes | Content |
|---|---|---|
| `Meshes/Table/Blackjack_table._Fiy_Edit_2_83__Preped_ForPaint.fbx` | 456,748 | one mesh `BlackJack_Table`, 3,784 control points, 22,164 polygon corners (between about 7,400 and 11,100 triangles; triangulation not determined), 6 material slots, so 6 draw calls |
| `Meshes/DeckOfCards/DeckOfCards.fbx` | 215,468 | 54 meshes (52 cards, two jokers), 40 control points and 120 polygon corners each, one material `Card`; each mesh's UVs select its cell of the atlas |
| `Meshes/DeckOfCards/Empty Card.fbx` | 19,420 | the card back, 40 control points |
| `Meshes/Dealer Screen/Dealer Screen.fbx` | 15,372 | one mesh `Screen`, 32 control points |

All four were exported from Blender (2.93 to 3.3, per the FBX headers). No author or source fields are
filled in.

Each card prefab is an `Animator` (`Card Zoom In.controller`) over `Viz` with two children: the face
mesh prefab (named `Card`) and the back (`Empty Card`). All 105 card prefabs share `Card.mat`.

### 6.3 Textures

Every PNG is imported at a maximum of 2048 with crunch compression and no per-platform override
(for example `Meshes/Table/Textures/Table_Outer_AlbedoTransparency.png.meta`). So the 4096 sources never
reach a GPU above 2048 upstream.

**Sources over 2048 px (14 files, all 4096 x 4096, 121.2 MB of the 135.2 MB):**

| File (under `Meshes/`) | Bytes | Used |
|---|---|---|
| `Table/Textures/Surfaces/Purple/..._Table_Surface_AlbedoTransparency.png` | 19,052,866 | no material uses it |
| `Table/Textures/Surfaces/Blue/..._AlbedoTransparency.png` | 18,879,816 | no |
| `Table/Textures/Surfaces/Green/..._AlbedoTransparency.png` | 18,628,717 | yes (felt) |
| `Table/Textures/Surfaces/Red/..._AlbedoTransparency.png` | 18,334,889 | no |
| `Table/Textures/Table_Outer_AlbedoTransparency.png` | 10,803,000 | yes |
| `Table/Textures/Table_Outer_Normal.png` | 9,117,398 | yes |
| `Table/Textures/Surfaces/..._Table_Surface_MetallicSmoothness.png` | 8,434,864 | yes |
| `Table/Textures/Table_Outer_MetallicSmoothness.png` | 3,607,285 | yes |
| `Table/Textures/Table_Outer_AmbientOcclusion.png` | 3,533,784 | yes |
| `DeckOfCards/DeckOfCardsMarked.png` | 3,369,086 | yes (all card faces and the back) |
| `DeckOfCards/DeckOfCards.png` | 3,315,383 | no |
| `Table/Textures/Surfaces/..._Table_Surface_Normal.png` | 2,749,200 | yes |
| `Table/Textures/Surfaces/Table_Surface_AmbientOcclusion.png` | 1,264,753 | yes |
| `Table/Textures/Table_Outer_Emission.png` | 133,760 | yes |

The rest: eight 2048 x 2048 maps for `Table_ArmRest` and `Table_Hard_Surface` (11.0 MB), eight
1024 x 1024 maps for the two `Pockets_*` materials (2.9 MB), five 256 x 256 UI sprites
(`UI/Arrow.png`, `Circle.png`, `Inner.png`, `Outer.png`, `X.png`), and `Resources/BlackjackLogo.PNG`
(128 x 128, inspector only).

Not needed at all: the blue, purple and red felts (56.3 MB), `DeckOfCards.png` and the logo. 59.6 MB of
the 135 MB is unreferenced.

**The card atlas is already one texture.** `DeckOfCardsMarked.png` holds 13 columns by 5 rows of cells
of about 315 x 458 px (52 faces, two jokers, one back with a blackjack logo) in the top 56 % of the
image; the bottom 44 % is black.

**Budget for Quest.** Sizes are GPU memory with mipmaps, in MiB. ASTC 6x6 costs 3.56 bits per pixel.

| Texture | Source | Ship at | Format | MiB |
|---|---|---|---|---|
| Felt albedo (green; carries the printed rules) | 4096 | 2048 | ASTC 6x6 | 2.38 |
| Felt normal | 4096 | 1024 | ASTC 6x6 | 0.59 |
| Felt mask: metallic in R, occlusion in G, smoothness in A, packed from two 4096 maps | 4096 x2 | 1024 | ASTC 6x6 | 0.59 |
| Outer albedo | 4096 | 1024 | ASTC 6x6 | 0.59 |
| Outer normal | 4096 | 1024 | ASTC 6x6 | 0.59 |
| Outer mask | 4096 x2 | 512 | ASTC 6x6 | 0.15 |
| Outer emission (nearly black: 134 KB as PNG) | 4096 | 512 | ASTC 8x8 | 0.08 |
| Arm rest albedo, normal, mask | 2048 x4 | 1024, 512, 512 | ASTC 6x6 | 0.89 |
| Hard surface albedo, normal, mask | 2048 x4 | 1024, 512, 512 | ASTC 6x6 | 0.89 |
| Pockets (two materials): albedo, normal, mask | 1024 x8 | 512, 256, 256 | ASTC 6x6 | 0.46 |
| Card atlas | 4096 | 2048 | ASTC 6x6 | 2.38 |
| UI sprites, one atlas | 5 x 256 | 512 | ASTC 6x6, no mips | 0.11 |
| Font atlases after the font change (section 6.5) | | 2 x 1024 | Alpha8 | 2.00 |
| **Total** | | | | **11.7** |

- **Target: 12 MiB of texture memory and about 10 MB of texture data in the Android bundle per kit.
  Ceiling: 16 MiB**, which allows the card atlas at ASTC 4x4 (5.33 MiB) if pips look soft at 6x6.
- For comparison: upstream as imported for PC is about 77 MiB of maps (18 maps at 2048, 8 at 1024, DXT1
  and DXT5) plus 7 MiB of font atlases and a 2 MiB render target. The same import settings on Android in
  ASTC 6x6 would be about 48 MiB.
- Packing occlusion into the green channel of the metallic map removes six textures: URP Lit reads
  metallic from R and smoothness from A of one map and occlusion from G of another, and both slots can
  point at the same texture. 26 maps become 20.
- Further cuts if needed: crop the card atlas to its used 56 % (saves about 1 MiB, needs the 54 meshes'
  V coordinates rescaled by the kit builder); drop normal maps on the two pocket materials; merge the six
  table materials into fewer (needs new UVs, not planned).
- Copies of the snippet in one world should share one loaded bundle. That is assumed, not verified.
- The SDK's own checks warn above 2048 px on Android and on uncompressed textures of 1024 px or more
  (`com.sidequest.creator-sdk/Docs/reference/performance.md:34`); this budget passes both.
- The dealer camera's 1024 x 256 target is not in the table: see K9.

### 6.4 Shaders

There are no shader files in the repo.

| Used by | Shader reference | Port |
|---|---|---|
| 6 PC table materials (`Meshes/Table/PC/*.mat`), the ones the table FBX maps to (`...ForPaint.fbx.meta:6-36`) | Unity built-in Standard (`fileID: 46`), metallic workflow with normal, metallic-smoothness and occlusion maps; `Table_Outer` also emissive, HDR colour (3.0, 1.6, 0) | **Re-make** as URP Lit, with the packed mask of section 6.3 |
| `Meshes/DeckOfCards/Card.mat` and the 6 unused `Meshes/Table/Quest/*.mat` | external shader GUID `0b7113dea2069fc4e8943843eff19f70`, not in the repo. The property set (`_DFG`, `_LightmapSpecular`, `_ExposureOcclusion`) and `CHANGELOG.txt:25` point at leftovers of Filamented; the GUID is taken to be a VRChat SDK mobile shader. Not resolved | **Re-make** the card material: a small URP Shader Graph with the atlas as base and emission (upstream emission 0.717 grey with the same texture) and a per-renderer cell offset (section 8.3) |
| Dealer screen | `Unlit/Texture`, created by the inspector (`Editor/...Editor.cs:231`) | URP Unlit, if the screen is kept |
| TMP text | TMP distance-field shaders, referenced by GUID from the TextMeshPro package | the project template's TMP shaders |
| uGUI images | default UI material (every `m_Material` is empty) | works in URP as is |
| 5 particle renderers per seat | no material, renderer disabled | removed with the popups (L2) |

### 6.5 Fonts

| File | Embedded copyright string | TMP asset, atlas | References in prefabs |
|---|---|---|---|
| `Fonts/Arcane Nine.otf` | "Typeface by Chequered Ink. 2021. All Rights Reserved" (designer Allison J James) | `Arcane Nine SDF`, 1024 x 1024 | 88 (most labels) |
| `Fonts/RomanGradient.ttf` | "Copyright (c) 2021 by Vladimir Nikolic. All rights reserved." | `RomanGradient SDF`, 1024 x 1024 | 22 (Bust, Win, Draw, Lost) |
| `Fonts/riesling.ttf` | "(c) Bright Ideas" | `riesling SDF`, 2048 x 2048 (4 MiB as Alpha8) | 24 (Hit Me, Stand, Split) |
| TMP default | Liberation Sans, SIL OFL 1.1 | `LiberationSans SDF`, 1024 x 1024 | 31 (numbers) |
| `Fonts/UpperEastSide.ttf` | "(c) 1990 by David Rakowski" | `UpperEastSide SDF`, 2048 x 2048 | 0 |
| `Fonts/Bernardo Moda contrast.ttf` | none | `Bernardo Moda contrast SDF`, 2048 x 2048 | 0 |
| | | `Arcane Nine SDF LOGO`, `LiberationSans SDF - Outline.mat` | 0 |

The repo holds no licence file for any of these. The terms of Arcane Nine, Roman Gradient and Riesling
were not looked up; from the embedded strings alone they cannot be assumed free to redistribute, and a
TMP atlas baked from a font is a copy of its glyphs.

### 6.6 Third-party material: licence or lack of one

| Asset | Origin | Licence in the repo | Assessment |
|---|---|---|---|
| Scripts, prefabs, animations | CentauriCore | Apache-2.0 | clear |
| Table mesh | Sentinel373 (`README.md:47`) | covered only by the repo licence and a credit | usable with the credit; no separate grant on record |
| Table textures | FiyCsf (`README.md:48`); the felt carries the CentauriCore logo | same | same; K5 on the logo |
| Audio, 119 clips | Three Ribbon Studios (`README.md:49`). Names such as "Click - Big Room", "Castanets - Dembow", "Conga Mid - Arcade Frenzy" read like sample-library names | same | origin of the samples not determinable from the repo; K8 |
| Card meshes and atlas | **no credit anywhere**. Mesh names ("10th Of Clubs", "8th of Clubs", "10th OfDiamonds", "Black Joker") suggest a stock deck; the "Marked" atlas adds a custom back | none stated | origin unknown; K8 |
| Fonts | section 6.5 | none | replace three (K1) |
| Two sprites | missing from the repo (Q19) | n/a | replace |
| Shader for cards and Quest materials | VRChat SDK, not in the repo | n/a | re-made |
| UI-shape component, Udon | VRChat SDK | n/a | not shipped |

## 7. Translation map

Porting order follows dependencies and how early each file can be tested. "Lines" is `wc -l`; "code" is
non-blank, non-comment lines without the generated handlers.

| # | Upstream file | Lines / code | Target | Hard parts |
|---|---|---|---|---|
| 1 | `Scripts/DeckManager.cs` | 89 / 77 | `ts/src/DeckManager.ts` | Small. Gains the seeded draw stream, the commitment, and counts derived from the cards in state. `GetUnusedCardIndex` exists twice upstream, text-identical (`Dealer.cs:233-295`, `PlayerDeck.cs:199-261`); keep one copy here and call it from both. The index-0 rule (Q1) behind a constant |
| 2 | `Scripts/PlayerDeck.cs` | 934 / 292 | `ts/src/PlayerDeck.ts` | The 583 handlers vanish: `SpawnCard(c, p)` becomes "the referee appends c to `cards[]`"; clients react to the array. `AddCardValue` must match upstream bit for bit, including the stale ace count after a split (Q4). Card value comes from a table, not from a prefab name. `CheckIfCanSplit` splits in two: equal values (referee) and affordability (holder's client, chips are private) |
| 3 | `Scripts/Dealer.cs` | 979 / 314 | `ts/src/Dealer.ts` | `DealerPlay` is a chain of delayed self-calls (`:61-94`); it becomes a step function of `t0` so a new referee resumes it. The hole card: -1 in state, value withheld from the total, real index at the flip, checked against the commitment. About 40 lines of commented-out code are dropped |
| 4 | `Scripts/ChipController.cs` | 112 / 90 | `ts/src/ChipController.ts` | One object per page serving every instance (upstream is one per world); `CurrentBet` keyed by instance. `isPlaying` emulated |
| 5 | `Scripts/Player.cs` | 648 / 520 | `ts/src/Player.ts` | **The hardest file.** 11 event sends, 8 ownership calls and 7 owner checks mix three roles in one class: what the holder's client does, what the table owner's client does, what everyone does. Each method has to be cut into request (holder), validation and state write (referee), and reaction (everyone). `SetWinState` (`:468-576`) runs on every client upstream and mixes banners, sounds and money; in the port the referee writes `result[]`, and the holder's client pays itself from it. The 30 s timer moves to a deadline. Local debounces (`JustHitNormal`, `isSplitting`, `justReleasedControl`) are enforced by the referee as well |
| 6 | `Scripts/Controller.cs` | 322 / 263 | `ts/src/Controller.ts` | The deal schedule (`:204-215`) and the 2 s poll (`:226-247`) become a table of steps evaluated against `t0` every tick, idempotent, so a referee change mid-deal loses nothing. Reset paths (`:257-289`, `:301-304`) must free every seat (Q12). `GameActive` gains a `phase`. Table owner as a field |
| 7 | `Scripts/AudioController.cs` | 134 / 113 | `ts/src/AudioController.ts` | Clip fields become indices into the audio source's clip list. The per-frame follow is dropped (C10). Sounds fire from state changes |
| 8 | `Scripts/PlayerUIController.cs` | 274 / 233 | `ts/src/PlayerUIController.ts` | 33 animator calls go through the relay; 11 `ResetTrigger` and 1 cross-fade need new relay ops. Upstream sets triggers as things happen; the port also needs a function that puts both animators into the state a late joiner should see (which layer states for split, stood, bust, win) without replaying the round |
| 9 | `Scripts/DealerUIController.cs` | 256 / 209 | `ts/src/DealerUIController.ts` | 49 `SetActive` calls per frame become a diff against the last sent values. The on and off toggle objects are cross-wired between the two canvases (section 5.2); derive all four from the synced value instead. Slider becomes two buttons |
| 10 | `Scripts/InteractableController.cs`, `Scripts/Interactable.cs` | 126 / 107, 123 / 101 | `ts/src/InteractableController.ts`, `ts/src/Interactable.ts` | The enable rules (`InteractableController.cs:84-93`) are kept as the single place that says which button is live. The fingertip test is replaced by click events on the same boxes (section 8.4) |
| 11 | `Scripts/DistanceOptimizer.cs` | 123 / 98 | `ts/src/DistanceOptimizer.ts` | Head distance to the table instead of a trigger; same radius and the same release rule |
| 12 | `Scripts/DisableFixer.cs` | 53 / 44 | `ts/src/DisableFixer.ts` | Runs when the snippet element leaves the page |
| 13 | `Scripts/BlackjackWorldController.cs` | 34 / 30 | `ts/src/BlackjackWorldController.ts` | Becomes the entry point: reads the element's attributes, builds the behaviours from `bindings.json`, registers the instance |
| 14 | `Scripts/PlayerDebug.cs` | 56 / 49 | not translated (L1) | |
| 15 | `Editor/BlackjackWorldControllerEditor.cs` | 410 / 324 | not TypeScript: `altspace/Assets/Kit/Editor/BlackjackKitBuilder.cs` | What the inspector did by hand (one table under the system, chip controller reference, screen material) plus the conversions of sections 6 and 8 |

Estimate: about 2,600 lines of TypeScript for game code, 1,500 for tests, 600 to 700 of C# for the kit
builder.

Kit builder tasks, in order: import with stand-in scripts; instantiate the entry prefab and one table as
the inspector would; strip the debug panels and dead popups; replace each of the 165 card positions with
a pooled slot (upstream card prefab structure, generic face); build the card-face shader and the cell
table from the 52 meshes' UVs; convert seven materials to URP and pack masks; resize and compress
textures; swap fonts if K1 is yes; move click boxes to layer 5 and add boxes for the 20 table buttons;
remove the three large trigger volumes and the UI-shape components; fix Q14 and Q19; put the 97 used
clips on audio sources; write `bindings.json`; strip the stand-ins; build both bundles and run the
bundle check.

## 8. Snippet design

### 8.1 Settings

Slug `blackjack` (proposed in the plan; not registered). `single`: **no**. Several tables may share a
world; upstream advises four or fewer (`README.md:23`), and the same advice holds because every relay
message is parsed by every instance's graph.

| Attribute | Default | Upstream source of the default | Meaning |
|---|---|---|---|
| `position` | `0 0 0` | | world position of the table's floor point |
| `rotation` | `0 0 0` | | Euler degrees; the players' side faces +Z at 0 |
| `scale` | `1` | | uniform scale |
| `room` | empty | | instance key (README, "Names"); two elements with the same `room` would be one table |
| `chips` | `false` | `B.prefab:7689` | chip system on for this table (K7) |
| `starting-chips` | `100` | `S.prefab:316` | starting balance; read from the first instance on the page |
| `decks` | `2` | `B.prefab:8063` | copies of each card per round, minimum 2 |
| `helpers` | `false` | `B.prefab:7706` | show hand totals |
| `manual` | `false` | `B.prefab:7693` | start in manual dealing |
| `allow-change` | `false` | `B.prefab:7707` | let the table owner change chips, helpers and decks in the world |
| `turn-seconds` | `30` | `Player.cs:61` | turn timer |
| `range` | `5` | `B.prefab:4751` | metres within which the table is active for a player |
| `persist-chips` | `false` | none: upstream saves nothing | keep the balance in `localStorage` (K6) |
| `windows`, `android` | empty | | bundle addresses for tests (README) |

Attribute values set the first state when an instance has none; after that, state wins, as the synced
values did upstream.

### 8.2 Gizmos

```html
<bs-gizmo type="position" attribute="position"/>
<bs-gizmo type="sphere" attribute="position" radius="2.3"/>
<bs-gizmo type="sphere" attribute="position" radius="5"/>
```

The 2.3 m sphere is the footprint including standing players; the 5 m sphere is the activity range. A
box or plane for the table itself would mislead: a gizmo has a fixed rotation of its own and does not
follow the snippet's `rotation` setting (`Docs/building-in-unity/snippets.md:91-105`), and this table is a
half circle with a front and a back. The kit builder should move the kit's origin to the middle of the
footprint so the spheres sit right. Exact radii need the table mesh's bounds, which were not read.

### 8.3 What is per instance and what is per page

| Per instance | Per page, shared by all instances |
|---|---|
| holder object `pk1:blackjack:<inst>`, the kit, the relay graph | the script and `bindings.json` |
| every state leaf, the referee, the seed and commitment | the chip balance and the bet per instance (upstream: one balance per world) |
| table owner, seats, timers | the asset bundle (assumed loaded once) |
| settings read from that element | `window.__pk1` registry |

No network ids are needed: nothing in the kit has a synced transform.

**Cards without `Instantiate`.** Upstream creates a card prefab per card and destroys it at reset
(`PlayerDeck.cs:73`, `:902`). The page cannot instantiate kit prefabs through any listed op, so the kit
holds 165 slots, one per card position, each with the upstream card structure (`Animator`, `Viz`, a face
quad, the back mesh) and switched with `active`. Turning a slot on restarts its animator, which replays
the slide-in. The face is chosen by a per-renderer cell offset in the card shader, sent through the
existing relay `color` op (it calls `Renderer.material.SetColor`, `portkit/unity/Editor/Graphs/RelayGraph.cs:98-104`,
and a vector property takes a colour). The cell table comes from the 52 meshes' UVs. Fallback if that
does not work in the app: an integer animator parameter on each slot with 53 one-frame clips that set the
same material property (`animInt` is already an op).

The dealer's hole card is a slot showing only the back, with no cell set, until the flip.

### 8.4 Player actions in VR and on desktop

Clicks reach only layers 5 and 22 (`Docs/building-in-unity/layers.md`). Two routes exist for a button:

- `uiButton`: the relay graph gets one event unit per button (`RelayGraph.cs:123-125`). With 111 buttons
  that is 111 units in a graph the README wants small.
- `click` on a collider on layer 5, which the page hears directly. Upstream already has a box at every
  seat button (the 70 touch boxes, held in place by constraints); the kit builder adds 20 for the table
  buttons.

Proposed: collider boxes with `click` for all 111, press animation through the relay. Whether a click
reaches a trigger collider, and whether it reaches a collider behind a canvas, is for spike S6 to settle;
if not, fall back to `uiButton`.

| Action | VR | Desktop | Who may | Notes |
|---|---|---|---|---|
| Take a seat | point and trigger on "Join Game" at a free seat | click it | anyone, between rounds | request `_TakeControl` |
| Leave a seat | "LEAVE GAME"; or walk beyond `range`; or leave the world | same | holder | request `ReleaseControl`; the referee also frees seats of absent players |
| Bet +10, +5, -10, -5 | chip buttons on the bet panel | same | holder, chips on, between rounds | local, no network |
| Hit, first or split hand | "Hit Me" on the seat panel | same | holder, own turn | automatic mode: card at once; manual: raises the mark |
| Stand | "Stand" | same | holder | also on timeout |
| Split | "Split" when shown | same | holder | affordability checked on the holder's client |
| Take the table | "Take Control of Table" on the dealer side | same | anyone but the owner, between rounds | resets the table (F6) |
| Start a round | "Start Game" | same | table owner | |
| Manual or automatic dealing, helpers, chips, deck count | dealer-side buttons | same | table owner, between rounds; the last three need `allow-change` | |
| Deal to a player, stand a player (manual) | "Hit Me" and "Stand" on that seat's dealer panel | same | table owner | |
| Raise or lower the dealer panels | two buttons in place of the slider | same | table owner | local only |
| Reset table; reset chips | buttons at the back of the table | same | table owner; anyone | |

Touching buttons with a finger (F66) is not in the first version (L5).

Seats: 7 logical seats, no chairs, up to 7 players plus the table owner, who may also hold a seat.
Remote players show as a head only (plan, "Facts"), so who stands where is carried by the name plates.

## 9. Test plan

### 9.1 Golden vectors (upstream C# compiled with `dotnet` against stubs)

The rule code is plain C# once `UdonSharpBehaviour`, `Networking`, `VRCPlayerApi`, `Animator`,
`AudioSource`, `Transform`, TMP text and `UnityEngine.Random` are stubbed. Stubs record calls and take a
scripted random sequence. Expect about 500 lines of stubs, including `SendCustomEvent` by reflection,
network events delivered at once, and delayed events on a virtual clock.

| # | Unit under test | Inputs | Compared output |
|---|---|---|---|
| V1 | `DeckManager.InitializeDeck`, `AddDeck`, `SubtractDeck` (`DeckManager.cs:53-87`) | deck counts 2 to 8, sequences of plus and minus | counts array, `NumberOfDecks` |
| V2 | `GetUnusedCardIndex` (`PlayerDeck.cs:199-261`) | every start index 0 to 51 against generated count arrays: full, one type left, none left, exhausted runs across the wrap, index 0 at 999 and at 0 | returned index |
| V3 | `AddCardValue` (`PlayerDeck.cs:150-197`, `Dealer.cs:196-231`) | every sequence of values 2 to 11 up to length 6 (about 1.1 million), plus random sequences to length 11 | total, ace count and bust flag after each card |
| V4 | Split arithmetic (`Player.cs:353-378` with V3) | each equal-value pair, then scripted cards to each hand | both totals, ace counts, bust flags. Pins Q4 |
| V5 | `CheckIfCanSplit` (`PlayerDeck.cs:128-148`) | value pairs, chips on and off, bet and balance grids | allowed or not |
| V6 | `SetWinState` (`Player.cs:468-576`) | player 0 to 31, dealer 0 to 31, split or not with split total 0 to 31, chips on and off, active or not, holder or not | banner per hand, chip change, sound. Pins Q5 |
| V7 | `ChipController` (`ChipController.cs:38-110`) | random operation sequences over three tables | balance, bets, refusals |
| V8 | Deal schedule (`Controller.cs:132-216`) | each non-empty set of taken seats (127 sets) | ordered list of time, target, event |
| V9 | `DealerPlay` (`Dealer.cs:61-94`) | hole and up card values, then a scripted draw stream | number of draws, final total, bust |
| V10 | One whole solo round: all five rule classes in one process, the single player being table owner and holder | scripted presses with times, scripted random sequence, chips on and off, with and without a split | ordered trace of cards, totals, animator calls, texts, chip balance |

V10 is compared against the TypeScript in a one-client fake room where the same player is referee, table
owner and holder. Each vector file records the upstream commit. Vectors run in literal mode; any fix
agreed under K3 gets its own vectors, written by hand.

### 9.2 Node scenarios (fake room, several clients, virtual time)

After every step each client's state digest must match the others'.

| # | Scenario | Checks |
|---|---|---|
| N1 | Three clients, two seated, automatic dealing, hit, stand, dealer plays, settle | F25 to F39, F51 to F62 |
| N2 | A fourth client joins during turns, during the dealer's play and after settlement | digest equals the others'; card count and banners right; cannot take a seat mid-round (Q11) |
| N3 | Hole card secrecy: record every leaf write, one-shot and user-state write up to the flip | no value outside the referee holds the hole index or a total that includes it; after the reveal the commitment opens and every draw of the round replays |
| N4 | A holder leaves mid-turn | hand stood, seat freed, not settled; the round ends |
| N5 | The referee leaves during the deal, during turns, during the dealer's play | the next referee finishes; no step done twice or skipped; segment 2 committed; old segment marked unverified |
| N6 | The table owner leaves; a player takes the table | reset: all seats free, bets 0, phase idle (F6, F73, Q12) |
| N7 | Timer: nobody acts for 30 s | all turns end at the deadline on every client; the dealer plays |
| N8 | Manual dealing: mark raised, dealer deals, dealer stands a player, dealer deals unasked | F44 to F50 |
| N9 | Split: plain pair, ten-valued mixed pair, aces, split with too few chips, stand inside the 1 s window | F40 to F42, Q4 to Q7 as decided |
| N10 | Chips over four rounds on two instances: bet, refusal, win, lose, draw, bet back to 0, reset chips | F19 to F24; one balance across instances |
| N11 | Deck exhaustion: 2 decks, a scripted stream that keeps hitting used-up types; an 11-card hand | F29 to F31 |
| N12 | Settings: chips, helpers, decks and mode changed by the owner; refused from others; refused mid-round | F7, F8 |
| N13 | Two blackjack instances and one other game in one room | no key, one-shot or relay payload crosses over; deleting one prefix resets one table only |
| N14 | Fuzz: random joins, leaves, presses and referee losses for 10,000 virtual seconds | every round ends within a bound; no seat held by an absent player for more than a tick; card arrays and totals agree |
| N15 | Budgets | largest leaf under 16,384 bytes; writes under 20 per second; at most four user-state leaves |

### 9.3 Play mode, one player (rung 3)

A hand-written `<bs-snippet>` with the script and bundles from a local server; a scenario bot presses
buttons by raising the same events a click does; PASS and FAIL lines go to the console.

1. Kit loads; every binding resolves; the relay graph answers a `clock` request.
2. Take the middle seat; the name plate and LEAVE appear; the join sound plays.
3. Start: four cards appear at the upstream times within 0.1 s; the dealer's first card shows its back.
4. Hit until bust or 21, then stand: card faces match state (read back the cell values sent); totals and
   helper text are right.
5. The dealer flips and draws; the banner matches the result; chips change by the bet.
6. Split a forced pair (test seed): rows shift, the second HIT button appears, both hands settle.
7. Manual mode: the mark appears on the dealer panel; the dealer's button deals.
8. Reload the page mid-round: the table is redrawn from state with no animation replay.
9. Two instances in the scene: pressing on one changes only that one.
10. The bundle check, the allow-list check and "no missing scripts" pass at rung 2 before any of this.

### 9.4 Local Multiplayer, two players (rung 4)

1. Player 1 is referee and table owner; player 2 takes a seat. Digests match after join, deal, each
   action, the dealer's play and settlement.
2. Hole card: player 2's page never holds the hole index before the flip (assert in the page).
3. Late join by reload: player 2 reloads during turns. Their seat is freed (F72), the table redraws
   from state, digests match.
4. Referee change: player 1's page closes mid-round; player 2 becomes referee and table owner, and the
   table resets (F73). Then the same with player 2 as table owner beforehand: the round continues.
5. Both hold seats and act within the same 50 ms tick; neither press is lost or doubled.
6. Timers: both pages show the same second, within one, through the round.

## 10. Changed, left out, risks and questions

### 10.1 Changed, and why

| # | Change | Reason |
|---|---|---|
| C1 | The table is state held by a referee; events carry only requests | late joiners and reconnects see the real table (F77, F78, Q3, Q11, Q20); the platform has no host and no private channel |
| C2 | The referee draws every card from a dealt draw (its committed seed and the seated players' contributions); holders no longer draw their own | one writer removes the race on counts; every hand can be checked against the deal after the round (see "Trust" in the status section for what that does and does not catch); upstream lets each client pick its own cards |
| C3 | The hole card's identity and value stay out of every channel until the flip | Q13; every channel is readable by all |
| C4 | 1,166 generated event handlers become two arrays in state | no need for one event name per card and position |
| C5 | Cards are 165 pooled slots, not instantiated prefabs | no op creates kit prefabs at run time |
| C6 | A reset frees every seat | Q12 leaves seats stuck upstream |
| C7 | Split results and timeout stands show for everyone | Q7, Q8 were side effects of local-only flags |
| C8 | Nobody can take a seat mid-round | Q11 |
| C9 | The turn timer is a deadline on the shared clock | per-frame countdowns on one client do not survive a referee change and the runtime ticks at 20 Hz |
| C10 | Range by head distance; the table's sound source stays at the table | avoids trigger volumes that react to every body, and a per-frame motion graph for a 2.3 m box |
| C12 | The dealer-height slider becomes two step buttons | `bindings.json` has no slider event |
| C15 | Materials re-made for URP; card shader re-made | built-in and VRChat shaders do not exist in URP |
| C16 | One chip balance per page across instances | matches upstream's one balance per world; the README's storage prefix is per instance, so saving it needs a decision (K6) |
| C17 | Table owner is a field; the first one is the referee's player | no instance master on this platform |
| C18 | Toggle graphics follow the synced value | Q15 |
| C19 | Sounds fire from state changes; sounds upstream played only for the actor stay that way, except the hole-card flip, which everyone in range hears | events no longer exist to hang them on; the flip was table-owner-only by accident of where the call sat |
| C20 | Settings come from snippet attributes | the custom inspector cannot run in someone else's world |
| C21 | Seats are tied to the session id and freed when that session leaves | same as upstream's player id; a reload gives the seat up |
| C22 | Textures reduced to the budget of section 6.3 | Quest memory |
| Q-fixes | Q9, Q14, Q16, Q19, Q21 fixed without asking; Q1, Q4, Q5 fixed as approved by Shane (K3) | section 2 |

### 10.2 Left out, and why

| # | Left out | Reason |
|---|---|---|
| L1 | The per-seat debug panel (`PlayerDebug`) | inactive upstream; two canvases and about 25 texts per seat |
| L2 | Five popup objects per seat with particle systems and `UI Popup` animators | inactive upstream and referenced by nothing |
| L3 | Blue, purple and red felts | no material uses them; 56 MB of source; a fourth of the felt memory each if shipped |
| L4 | Unreferenced assets: 22 clips, `Card Flip.controller`, `OWNERSHIPJUSTTRANSFERRED.controller` and three clips, two fonts and two font assets, `DeckOfCards.png`, the six `QUEST` materials, the inspector logo, the two joker meshes | unreachable from the entry prefab |
| L5 | Touch-to-press buttons and their haptic tick (F66) | no fingertip position; 20 Hz is too slow to catch a hand passing through a 2.5 cm box. Could return if a hand-collider trigger event proves usable: upstream's layer 18 is a layer the local hands collide with here, and the SDK documents a haptic call |
| L6 | The custom inspector | replaced by the kit builder and attributes |
| L7 | Disabling a table at run time (F74) | a snippet has no such switch; the same clean-up runs when its element is removed |
| L8 | VRChat-only code: UI-shape components, the layer-18 hiding trick, the solo-player branches (`GetPlayerCount() < 2`), the `UNITY_EDITOR` branch | no meaning here |
| L9 | Double down, insurance, surrender | not in upstream (F43) |

### 10.3 Open risks, ranked

| # | Risk | If it goes wrong |
|---|---|---|
| R1 | Choosing a card face through the relay (`color` on a per-renderer material instance) is untested in the app | fall back to the animator-parameter route; worst case 165 slots need another way to show 52 faces |
| R2 | Click delivery for 111 buttons: collider `click` versus `uiButton` | 111 relay event units, or a spike to find what a click can hit |
| R3 | Quest frame time: about 48 canvases after stripping, some 700 UI graphics, 94 animators, masks that break batching | switch panels off harder by state and distance; flatten per-seat canvases |
| R4 | Relay traffic: each payload is split and compared by every instance's graph; about 40 messages in the first seconds of a round | batch ops; advise few tables, as upstream does |
| R5 | A referee change mid-round loses the seed and any request in flight | accepted: unverified segment, press again. Escrow by sealed delivery later |
| R6 | Bundle rules: camera with render texture, constraints, UI masks, a Shader Graph shader | each needs the bundle check's verdict; all have fallbacks except constraints, which hold the card rows to the animated UI |
| R7 | `playClip` semantics: do one-shots overlap, and does a list of 97 clips on one source work | use three or four sources by kind |
| R8 | Licences of fonts, audio and card art (section 6.6) | replace assets before release |
| R9 | Runtime additions this game needs (below) | game code works around each, at a cost in fidelity to the upstream line order |
| R10 | The shared clock through the relay graph is unproven (spike S3) | timers fall back to the referee's wall clock in state |

Additions asked of the port kit (the README says to extend the op table as games need):

1. Relay ops `animResetTrigger` (13 upstream uses) and `animPlay` (cross-fade to a state, 2 uses).
2. The sender's session id available to a network-event handler.
3. Behaviour hooks for a player leaving and for a referee change; `SendCustomEventDelayedFrames`.
4. `scene.IsVR()` and `scene.SendHapticImpulse` on the platform interface, if L5 is ever lifted.
5. A storage key outside the per-instance prefix, if K6 is yes.

### 10.4 Questions for Shane, ranked

| # | Question | Default if unanswered |
|---|---|---|
| K1 | Replace Arcane Nine, Roman Gradient and Riesling with openly licensed fonts? | yes |
| K2 | The felt says "Blackjack pays 2 to 1"; the code pays 1 to 1. Add the 2 to 1 payout for a two-card 21 (not upstream), repaint the felt, or leave the mismatch? | leave it, and say so on the credits board |
| K3 | Fix the three money-and-cards defects: payouts after a split (Q5), split aces (Q4), endless two of clubs (Q1)? | fix all three; literal behaviour stays in the tests |
| K4 | Add double down or insurance? The brief listed them; upstream has neither | no |
| K5 | Keep the CentauriCore logo painted on the felt? It credits the author; it is also their mark | keep |
| K6 | Save chips in `localStorage`? Upstream saves nothing; saved chips are per device and editable | no |
| K7 | Should a table placed with no settings have chips on? Upstream's table default is off | off |
| K8 | Audio (credited, origin of samples unknown) and card art (uncredited): ship under the repo's licence with credits, or replace before release? | ship in the Private world; decide before release |
| K9 | Dealer overhead screen: keep the camera and render texture (an extra camera pass per table per frame, about 2 MiB), or show the dealer's cards there with five extra card slots? | card slots |
| K10 | Allow one player to hold several seats, as upstream does? | yes |
