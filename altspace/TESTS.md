# blackjack: test evidence

Everything here ran on 2026-11-24 and 2026-11-25 on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity
editor. The latest results are the third pass (2026-11-25, next section): re-synced to portkit `c971100`. The rung
sections after it are from the second pass of 2026-11-25: re-synced to portkit `812f285`
(`portkit/tools/sync.sh blackjack`) and with the review's findings fixed (`REVIEW-FINDINGS.md`, blackjack). Nothing ran
in the Altspace app, on a Quest, or with controllers (rung 5: not run; worlds stay Private).

How to run each rung again:

```
cd altspace/ts && npm test                                                    rungs 0 and 1
cd altspace/ts && npm run golden                                              remake vectors/upstream.json (dotnet 8)
portkit/tools/remote.sh altspace menu "PortKit/Kit/Check"                    rung 2 (Logs/portkit_check.txt)
portkit/tools/playtest.sh altspace altspace/playtest/single.json blackjack     rung 3
portkit/tools/playtest.sh altspace altspace/playtest/multi.json blackjack      rung 4
```

`playtest.sh` takes the machine's Play slot, clears the local relay's saved room, and for `"players": 2` activates
Player 2 and waits until `PortKit/Multiplayer/Report` says it launched (the game's own wait and slot loop are gone).
Player 2 is a Multiplayer Play Mode clone (`Library/VP/mppmf0d15246`, its log `Logs/Editor.log-mppmf0d15246.txt`).
It shares the main project's Library (`-library-redirect ../..`), so it does not import anything of its own.

## Page script on portkit 552622c, 2026-11-25 evening

Re-synced `ts/portkit` and the package to portkit `552622c`. That commit includes `425bd55`: the page loads kit
items one at a time, because overlapping loads lost relay graphs and Variables in the app. It also includes
`0880bf5`: a referee claimant starts only once its claim has stood for 1.5 s, which fixes the equal-term double
claim, and user-state flushes go one at a time. The bundles are unchanged from the rebuild below. `npm test`:
**38 of 38** (0 failed). `npm run build`: 703520 bytes. Export Artifacts -> `dist/`: 14 files (9 licence texts), footprint 3.95 x 1.7 x 2.19 m, bindings dacc020a362cd24696a285d71de32c2c617533fe.

## Canvas colliders, 2026-11-25 evening (portkit 476075d)

In world 9d7311 the SDK's `BSKitItem` gave every world-space canvas without a BoxCollider a solid one when the kit
loaded: rect x scale, on the canvas's layer. rp-toolkit's head-label canvas then pushed its wearer about (measured in
the hub's Play mode, portkit GAPS.md "Fourth pass"). Re-synced to portkit `476075d`, whose builder gives every
world-space canvas a trigger box of its own first, and whose `PortKit/Kit/Check` fails a canvas that would end up
solid. Rebuilt:

- Build Prefabs: 8 trigger boxes added to world-space canvases, 40 canvas boxes made triggers.
- rung 0/1: `npm test` **38 of 38** (0 failed). `npm run build`: 701970 bytes.
- rung 2: Check all PASS (bindings `dacc020a`, the new "canvas colliders" line, both bundles). Android 7152 KiB, Windows 8823 KiB.
- rung 3 (`playtest/single.json`, blackjack-single): **22 passed, 0 failed**, 0 console error lines (`playtest/evidence_single.txt`).
- rung 4 (`playtest/multi.json`, blackjack-multi): **39 passed, 0 failed**, 0 console error lines (`playtest/evidence_multi.txt`).
- `dist/` exported: 14 files (9 licence texts), footprint 3.95 x 1.7 x 2.19 m, bindings dacc020a362cd24696a285d71de32c2c617533fe.

## Third pass: re-sync to portkit `c971100` (2026-11-25)

`portkit/tools/sync.sh blackjack` (unity and ts), then:

- **Breaking change taken:** the kit's `verifyDeal` now returns null for a deal this page cannot check. `DeckManager`
  calls `Secrets.checkDeal(label, expected)` instead: `ok` replays the deal as before, `solo` and `unknown` are
  `unverifiable` (not checkable, never a failed check), `failed` is a `mismatch`, and `pending` (a contribution not
  here yet) leaves the round unchecked until the next update.
- **Workaround dropped:** the game's guess that a mismatch involving a listed player this page never saw seated meant
  "cannot check". Test 32 (Cat contributes and leaves, Dan joins) is kept unchanged and now passes on the kit's
  `unknown`.
- **Kit option used:** `stage.StartOff` on `Table/Dealer Camera/Dealer Card Canvas` (bound as `dealerValuesCanvas`),
  so the photo and the footprint leave out its empty dark-green panel. bindings.json now has `"active": false` on it
  (hash `dacc020a...`); the photo log says 195 bound objects off (194 before).

| Rung | Result |
|---|---|
| 0 | typecheck and lint clean (`lint: src, portkit/src clean`) |
| 1 | `npm test`: **38 of 38** (no test changed) |
| 2 | `PortKit/Kit/Check`: PASS graphs (0 nodes the app will not run); PASS bindings, 869 objects resolve, hash `dacc020a362cd24696a285d71de32c2c617533fe`; PASS android and windows bundles (objects 2170/7972, graph blobs 5, 364 KiB) |
| 3 | **21 of 21, then 22 of 22, 0 console error lines each** (run 1 was a bust round, which has no STAND check). Both say the solo deal is not checkable, on the table too |
| 4 | **39 of 39, twice in a row, 0 console error lines** (main 16, Player 2 23). Round 1 `checked` on both pages; round 2: the owner `checked`, and the reloaded page `unverifiable` ("a player who contributed to this deal left before this page arrived"), now from the kit's `unknown`, with `Deal NOT checkable here: a contributor left before this page came` on the table; digests equal at equal `version()` after round 1, at the reload and at the end |

Evidence: `playtest/evidence_single.txt` (rung 3 run 2) with `evidence_single_deal.jpg` and
`evidence_single_settled.jpg`, and `playtest/evidence_multi.txt` (rung 4 run 2).

The rebuilt kit (`Logs/portkit_kits.txt`): 1,874 objects, 869 bound (115 clickable, 0 synced, 0 grabbable, so the
new grabbable click events do not apply), 548 refs, 115 behaviours, 44 events. The relay graph: 620 units, 245
control and 613 value connections, 52 distinct members, all on the allow list of 29,061 (565, 231, 555 and 49 before);
its ops now include `pkHead`.

Bundles and artifacts (`Take Photos`, `Export Artifacts`; `dist/`, not committed):

| File | Before (bytes) | After (bytes) | sha1 after |
|---|---|---|---|
| `android/blackjack` | 7,320,545 | 7,324,341 (7,153 KiB) | `03f1d39b6095a474aa43491a2baa977a13f3f896` |
| `windows/blackjack` | 9,024,863 | 9,034,677 (8,823 KiB) | `c15cb0b45f9399774d7bb39df8daf07f72f8d28a` |
| `pk-blackjack.js` | 687,326 | 700,703 | `a7b0370f89820fbe7a113ddb69b688aecd79a78f` (same as `Assets/WebRoot`) |
| `blackjack.jpg` | 60,457 | 55,302 | `8924c41e35309cf0a9bfc68f82cbcd6afc289d1f` |
| `blackjack.snippet.html` | 523 | 523 | `61f1d6f51afebba3d74b784eefd14efa94bd0c72` (box gizmo `4.0 0.2 2.3`) |

New in `dist/`: `licenses/blackjack/` with the nine licence texts the bundles carry (Apache-2.0-VRCBlackjack,
Cinzel, Cinzel Decorative, Limelight and Liberation Sans OFL, the three Kenney licences, portkit MIT), each with its
sha1 in `manifest.json`. The footprint is now 3.95 x 1.70 x 2.19 m (3.95 x 0.92 x 2.07 before): the kit now counts
world-space uGUI (the seat panels and the dealer's canvases). The photo no longer shows the empty dark-green box
above the table; it is framed on the taller footprint, so the table is a little smaller in it.

## Rung 0: static

`npm run typecheck` (tsc, strict) and `npm run lint` (only the platform adapters touch the page or the clock): clean.

```
lint: src, portkit/src clean (page and clock rules)
```

## Rung 1: Node (no Unity)

`npm test` in `altspace/ts`: **38 tests, 38 pass, 0 fail** (golden 16, scenarios 6, security 10, table 6).

The five tests added in the review pass fail on the code before the fix (checked by putting the old check back:
the forged hand, the forged contributor list and the deck count fail; and the late joiner after a contributor left
fails without its "cannot check" case):

- 16: `CheckHands` unit cases: a changed card, two seats' cards swapped (same cards on the table), a seat's card given
  to the dealer, a card nobody drew, a destination left out, a split, cards held from before a segment.
- 29: a modified referee changes Bob's second card in state, leaving `drawLog` as the deal gave it: Bob and Cat show
  `mismatch` ("seat 2's hand's card 2 is ..."), the table line says DEAL CHECK FAILED, and an error is logged.
- 30: a modified referee lists an accomplice who is not seated, then (round 2) only one of the two seated players:
  every other page shows `mismatch` ("the deal's contributors are not the players seated in the round").
- 31: a referee alone at the table: the line says during the round that the deal is the referee's alone, and Bob's
  check after it is `unverifiable` ("the only player"); then a two-player round checks, and the replay still checks
  with the live deck count set to anything else (it uses the count recorded with the segment, finding 6).
- 32: Cat contributes and leaves mid-round, Dan joins: Ann and Bob check the deal; Dan says he cannot (a contributor
  left before his page arrived) instead of a false alarm.

Changed: 28 (a seated player withholds its contribution) now asserts that the 10 s fallback deal is shown as **not
checkable** on every page and on the table (it asserted a passing replay before); 18 (split) now also checks the
split hands against the deal.

### Golden vectors (`test/golden.test.ts`, 16 tests)

`golden/extract.ts` copies upstream's rule methods **verbatim by line range** (each range checks its first line) from
`DeckManager.cs`, `PlayerDeck.cs`, `Dealer.cs`, `Player.cs`, `ChipController.cs` and `Controller.cs` into
`golden/upstream/Extracted.cs`, which dotnet 8 compiles against small stubs. `Harness.cs` writes
`vectors/upstream.json` (526,387 bytes): 2,610 scoring sequences, 1,664 probe cases, 120 split cases, 1,170 settlement
cases, 30 chip runs, 7 deal schedules, 100 dealer plays. The TypeScript gives the same results through its own
calls. The only differences allowed are the three fixes Shane approved (K3), and each test asserts both upstream's
literal value and the port's: Q1 (upstream has 999 copies of the two of clubs), Q4 (split aces score 11 upstream and
21 in the port), Q5 (upstream pays a split's doubled bet on each hand, so +40 against the port's +20).

```
ok 1 - vectors come from upstream's compiled C#
ok 2 - card values and names follow the prefab's card list (B.prefab:8064)
ok 3 - V1 InitializeDeck: literal counts match; the port fixes the two of clubs (Q1)
ok 4 - V1 AddDeck and SubtractDeck: no upper limit, never below 2
ok 5 - V2 GetUnusedCardIndex: every start index against 32 count arrays (the dealer's copy agreed in C#)
ok 6 - V3 hand scoring: soft and hard aces and bust, after every card of 2,610 sequences
ok 7 - V3 the dealer's AddCardValue (Dealer.cs:196-231) is the same arithmetic
ok 8 - hand scoring, hand-derived cases (PlayerDeck.cs:150-176)
ok 9 - V4 split: upstream's arithmetic matches; the port scores each hand from its cards (Q4)
ok 10 - V4 split's bet: doubled when affordable, unchanged when not (Q6), as upstream
ok 11 - V6 SetWinState: verdicts and sounds match; split hands pay the round's bet, not the doubled one (Q5)
ok 12 - V7 ChipController: balances, bets per table and sounds over 30 random runs
ok 13 - V8 the deal schedule for 1 to 7 seats
ok 14 - V9 DealerPlay: stands on every 17 (soft 17 too), draws every 0.5 s after a 1 s flip
ok 15 - draws replay from the revealed deal, and a changed card is caught
ok 16 - the hands on the table are held against the deal: a changed, swapped, extra or missing card is caught
```

### Multi-player scenarios on the fake room (22 tests)

Players act through the inputs a player has: clicks on the click boxes (layer 5) and the kit's commands. The fake
room records every state write, user-state write and one-shot, so a test can show what each client could have read.

```
ok 17 - three players play four rounds with chips: every client agrees, chips follow the results, every round's draws check out
ok 18 - a split: two hands, each dealt a card after 1 s, settled separately for everyone, each at the round's bet
ok 19 - a player leaving mid-hand: the seat is freed, the hand not settled, the round goes on
ok 20 - a late joiner mid-hand sees the cards and totals as they are, and cannot take a seat until the round ends
ok 21 - the referee leaves mid-hand: the next referee finishes the round, draws the unknown hole card anew, and the new segment checks out
ok 22 - the referee who is also the table owner leaves: the table resets and every seat is freed (F73, Q12)
ok 23 - the hole card is unreadable to every client, the referee's page included, until the flip
ok 24 - a bystander cannot act for a seat, even from a modified client
ok 25 - two tables in one room stay separate; one chip balance serves both on a page
ok 26 - Start Game and the table's settings are the table owner's alone, and only between rounds
ok 27 - without allow-change, even the table owner cannot change chips, helpers or decks (F7)
ok 28 - the deal: every seated player contributes; one whose runtime never answers cannot hang the table
ok 29 - a referee that changes a hand (not the drawLog) is caught by every other client after the round
ok 30 - a referee that lists other contributors than the seated players is caught
ok 31 - a deal of the referee alone is shown as not checkable; the check replays with the round's own deck count (finding 6)
ok 32 - a page that arrives after a contributor left cannot check that deal and says so; the others check it
ok 33 - the table owner leaves: the referee's player takes the table, which resets; bets at the table go to 0 (F6, F73)
ok 34 - Reset Table frees every seat, whoever holds it (Q12), at most once per 2 s
ok 35 - the turn timer: nobody acts, every turn ends at the deadline on every client, and the dealer plays
ok 36 - manual dealing: a player's HIT raises a mark; the table owner deals and stands players from the dealer's panel
ok 37 - what one table costs the room: one sync group, a few leaves, small writes, under the rate limit
ok 38 - walking out of range releases the player's seat (F70)
```

Every scenario ends with all clients holding the same state digest and no error logged (except 29 and 30, where
the error is the point: a page that catches a forged deal logs it). A refused network event is
logged as an error, so a missing `networkCallable` entry fails the run. The tests run on the real `bindings.json` that
the kit builder writes (hash `7a402ba3...`), not the provisional one.

## Rung 2: the kit in edit mode (`PortKit/Kit/Check`)

Re-run 2026-11-25 (review pass) on the rebuilt kit and bundles:

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS blackjack bindings: 869 objects resolve by path; hash matches (7a402ba3bc0b11ca214fc58ef6eb26adfd445529)
PASS blackjack android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 2170/7972, behaviours 2105, scripts 11, calls 0, animation events 0, graph blobs 5 (332 KiB), decompressed 21 blocks / 2 MiB of 14 MiB (LZ4), ...
PASS blackjack windows bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 2170/7972, behaviours 2105, scripts 11, calls 0, animation events 0, graph blobs 5 (332 KiB), decompressed 21 blocks / 2 MiB of 20 MiB (LZ4), ...
DONE
```

The kit (`Logs/portkit_kits.txt`): 1,874 objects, 869 bound (115 clickable, 0 synced, 0 grabbable), 548 refs, 115
behaviours, 44 events (the review pass added the deal-check line: its backing `dealCheck` and its text
`dealCheckText`). The relay graph (rebuilt by the re-synced kit) has 565 units, 231 control and 555 value connections
and 49 distinct members, all on the SDK's allow list of 29,061. It carries the standard ops only; the game defines no
relay ops of its own and relays no events. Bundles: Android 7,149 KiB, Windows 8,813 KiB (before the review pass
7,122 and 8,790), each with the third-party notices and, as files of their own, the licence texts
(`Logs/portkit_bundles.txt`): Apache-2.0-VRCBlackjack.txt, Cinzel-OFL.txt, CinzelDecorative-OFL.txt,
Kenney-Boardgame-Pack-License.txt, Kenney-Casino-Audio-License.txt, Kenney-Interface-Sounds-License.txt,
Limelight-OFL.txt, portkit-MIT.txt and TextMesh Pro's `LiberationSans - OFL.txt`.

**Click boxes against uGUI buttons**, measured by building the kit both ways (`Logs/portkit_kits_click.txt` and
`portkit_kits_uibutton.txt`). With the 41 seat and table buttons as `uiButton` events, the relay graph has 1,011 units,
248 control and 928 value connections, and 41 relayed events: 546,558 bytes, against 289,524 bytes for the click boxes.
Click boxes were chosen: half the graph, and nothing for every instance to run on each press.

Artifacts (`PortKit/Kit/Take Photos`, then `PortKit/Kit/Export Artifacts`, `altspace/dist/`, not committed):

| File | Bytes | sha1 |
|---|---|---|
| `android/blackjack` | 7,320,545 | `76862f5aa8a65d1ac55f52a2540a30893d283679` |
| `windows/blackjack` | 9,024,863 | `1659febfd952f34d7ebb93ad4e7dab6f031e9bcb` |
| `pk-blackjack.js` (Apache-2.0 banner, then portkit's MIT notice) | 687,326 | `c3d0c178fd1bc2c11f72e10a2e4e76a1ff51cec9` |
| `blackjack.jpg` | 60,457 | `d8c1f73a7ec116372df45854fb88cd67b9e65c92` |
| `blackjack.snippet.html` (the game's settings, `position="0 0 0"`) | 523 | `f2fb8cb65af04aca1f69d773c3f54bf3865b6ef5` |

`manifest.json`: checks android PASS, windows PASS, bindings `7a402ba3bc0b11ca214fc58ef6eb26adfd445529`, footprint
3.95 x 0.92 x 2.07 m (review pass; before it the bundles were 7,293,189 and 9,001,367 bytes and the script 651,521).
Export copies files and builds nothing: the bundles are the ones the Play-mode runs below were served from the test
server, and the script is byte for byte `Assets/WebRoot/pk-blackjack.js` (same sha1). The editor loads only the
Windows bundle. The Android bundle passed the check but was never loaded.

## Rung 3: Play mode, one player (`playtest/single.json`)

A hand-written `<bs-snippet name="blackjack" ... chips="true">` with the built script and both bundles from the
test's local server, and `Assets/WebRoot/playtest/blackjack-playtest.js`. The driver works the table through the SDK's
desktop player with portkit's InputSim: a mouse of the test's own, with which the SDK casts its own rays and raises the
clicks. It reads Unity back with the `probe` command.

**Review pass (2026-11-25), on the rebuilt bundles: RESULT 22 passed, 0 failed; 0 console error lines, twice in a
row** (runs 4 and 5 below; `playtest/evidence_single.txt` is run 5, screenshots `evidence_single_deal.jpg` and
`evidence_single_settled.jpg`). A round in which the hand busts has no STAND check, so it counts 21. Alone at the
table, this page is the referee and the only player: its deal is its own, and the page now says so instead of
calling it checked (the first pass asserted `{"ok":true}` here).

```
PASS the kit loads from a hand-written bs-snippet and the instance starts
PASS the kit is in the scene: the table, card slots off: table True, dealer slot 0 active False, seat 3's join box active True
PASS the first player owns the table: Main Editor
PASS the element's settings: chips on, 100 to start: chips true, 100
PASS Join Game takes seat 3 (click box on the UI layer, real mouse)
PASS the seat's name reached Unity (relay op text): Main Editor
PASS two chip buttons make a bet of 15, shown on the chip panel: bet 15, panel '15', total '100'
PASS Start Game starts a round: round 1, phase dealing
PASS the deal: two cards to the seat, two to the dealer, the hole card face down: phase turns, seat [30,7], dealer [-1,31], deal bj1.1.163b44d6
PASS the seat's two cards are on in Unity with the faces in state (matFloat _CardIndex): state [30,7]; Unity True/30 True/7; next slot active False
PASS the dealer's up card shows its face; the hole card's face is blank in Unity: d0 True/-1, d1 True/31 (state 31)
PASS HIT deals a third card: [30,7,19] total 18
PASS the third card is on in Unity with its face: state [30,7,19]; Unity True/30 True/7 True/19; next slot active False
PASS STAND ends the turn
PASS the dealer flips and plays; the round settles: dealer [7,31,0,3,27] = 24, seat [30,7,19] = 18, result win
PASS the flipped hole card's face reached Unity and matches its commitment: Unity 7, state 7, verified true
PASS the verdict follows the totals: win (by the totals: win)
PASS the chips change by the bet (1 to 1): 100 -> 115 (+15)
PASS the chip panel shows the new total: 115
PASS a deal with no contributor but the referee is not checkable (the only player dealt alone): {"ok":false,"status":"unverifiable","reason":"the dealer's page was the only player: nobody else took part in the deal"}
PASS the table shows every player that this deal could not be checked (Unity text, its backing on): Deal NOT checkable: the dealer's page was the only player; backing True
PASS the credits panel opens and closes: True, False
```

Runs of the review pass: 1 (22 passed) found the new line under the credits button hidden behind the table's rail in
the screenshot; 2 (22 passed) had it above the buttons but pale against the sky and cut to two lines; 3 (21, a bust
round) with short texts; then a backing panel shown only while there is a line, and runs 4 and 5 passed (22 each).
The driver also prints, as information only, the new probes `animstate` on a dealt card's animator (`short 370891857
... transition False`: the zoom's state after its trigger) and `audioplaying` on the table's source (False when
asked, a second after the deal sounds ended); neither is counted.

Every click went through a click box on the UI layer and registered on the first try. Fixes made on the way to this
result: the felt's smoothness map also carried the "2 to 1" line (painted out); the card faces were mirrored (fixed
in the shader); and the credits button moved to the dealer canvas that players read.

What ran without a probe to assert it: the card zoom (the `NotHidden` trigger on each dealt slot's animator, through
the relay's `animTrigger` op) and the sounds (the `audio` op playing Kenney clips on the table's source). Both ran
with 0 console errors, but the probe cannot read an animator's state or whether a source is playing, and nobody
listened.

## Rung 4: two Local Multiplayer players (`playtest/multi.json`)

The main editor and Player 2, a Multiplayer Play Mode clone, open the same page. The table owner (the referee's
player, here the main editor) takes seat 3 and the guest seat 4. They exchange checkpoints as one-shots in an envelope
of their own, which the runtime ignores.

- **Round 1** is a full round in which both players act. Before the flip, each page snapshots everything it holds;
  after the flip, each checks the hole card against that snapshot.
- **Round 2:** the guest reloads its page mid-hand, comes back as a late joiner, and must hold the owner's state.
  Before the flip it checks the hole card again, this time from the state it was sent on joining. Both pages compare
  digests and views at the end.

**Review pass (2026-11-25), on the rebuilt bundles: RESULT 39 passed, 0 failed (main 16, Player 2 23); 0 console
error lines, twice in a row**, each on the first try after the changes (`playtest/evidence_multi.txt` is the second
run). `playtest.sh` started Player 2 itself and waited for it ("Player 2: Launched (Clone)"). New or changed in this
pass:

- the round's deal is checked the new way on both pages (contributors are the seated players, the draws replay, every
  hand holds the deal's cards: `checked`), and the line on the table says so in Unity;
- in round 2 the owner's page checks the deal, and the reloaded page, whose old session contributed and left, says it
  cannot check it (`unverifiable`, "left before this page arrived"), on the table too, rather than raising a false
  alarm (the first pass did not check the deal on the reloaded page);
- digests are compared at equal `version()` (portkit `bf8b5c6`) instead of within one 2 s poll epoch, after round 1,
  at the reload and at the end.

```
[main] PASS two players in the room: ["Main Editor","Player 2"]
[both] PASS both players are seated, on both pages: -,-,-,Main Editor,Player 2,-,-
[both] PASS before the flip this page holds the hole card face down, and Unity's slot face is blank: state [-1,51], Unity -1
[both] PASS the hole card was unreadable on this page before the flip, and the flipped card matches its commitment: hole 31 (value 9); before: cards [-1,51], total 11, hash -r_3QwVa92IO..., Unity -1
[both] PASS the round's deal checks: contributors are the seated players, the draws replay, every hand holds the deal's cards: {"ok":true,"status":"checked","reason":""} bj1.1.d4b57711
[both] PASS the table shows every player that the deal was checked (Unity text): Deal checked: every card came from the shared shuffle
[both] PASS round 1: seat 3's cards are on in this page's Unity with the faces in state: state [7,7,6,43]; Unity True/7 True/7 True/6 True/43; next slot active False
[both] PASS round 1: seat 4's cards are on in this page's Unity with the faces in state: state [40,10,49]; Unity True/40 True/10 True/49; next slot active False
[both] PASS both pages reach the same state after round 1 (equal version() and digest): 613de6ba / 613de6ba at 19:a81f184e / 19:a81f184e
[vp-..] PASS after reloading mid-hand the guest sees the same table (late join): turns r2 dealer -1,16=6 | - | - | - | Main Editor:27,46=18 00 | - | - | - / (the owner's view, identical)
[vp-..] PASS the guest's old seat was freed when its session left (C21, F72)
[vp-..] PASS the reloaded page joined before the flip: flipped false, dealer [-1,16]
[main] PASS the reloaded guest's page holds the same state as the owner's (digest at equal version()): 9b2fc67a / 9b2fc67a at version 33:3985a8be (guest sample 1; 0 samples of another version skipped)
[vp-..] PASS round 2: the hole card was unreadable on the reloaded page (late join state) before the flip, and the flipped card matches its commitment: hole 26 (value 8); before: cards [-1,16], total 6, ...
[vp-..] PASS round 2: the reloaded page cannot check a deal its old session contributed to, and shows that (not a false alarm): {"ok":false,"status":"unverifiable","reason":"a player who contributed to this deal left before this page arrived: ..."}
[main] PASS round 2: the owner's page checks the deal (it saw the guest's old session contribute): {"ok":true,"status":"checked","reason":""}
[main] PASS both pages agree at the end of round 2 (equal version() and digest): 1ae9db72 / 1ae9db72 at 37:2e6b078a / 37:2e6b078a; settled r2 dealer 26,16,12=19 | - | - | - | Main Editor:27,46=18 30 | - | - | -
```

The first pass (portkit `1118ef0`): 35 passed, 0 failed (main 14, Player 2 21), twice in a row; its runs and their
causes are in the table below.

**What the hole-card check asserts**, on each page (`holeCheck` in the driver):

- before the flip, the dealer's synced cards held `[-1, up card]`;
- the public total counted the up card only;
- no opening was held, and a commitment was;
- Unity's slot showed the blank face (-1);
- the opening's nonce, published at the flip and the only thing that ties the commitment to a card, appears nowhere
  in the whole state this page held before the flip;
- after the flip, the commitment was unchanged (no redraw) and the card shown matches it.

Round 2 runs the same check on the reloaded page, so the late-join snapshot it was sent held no more than any other
page.

### Runs, failures and their causes (first pass)

| Run | Result | Cause | Fix |
|---|---|---|---|
| 1 | 26 passed, 1 failed | after the reload, the driver ran the fresh-table check ("card slots off") on a page that joined mid-hand, where the dealer's slot is rightly on | a reloaded page checks the slot against the state it joined: on when the dealer has cards |
| 2 | 35 passed | (more checks added: both seats' cards in each page's Unity after round 1, the other hand settled, the hole-card check on the reloaded page) | |
| 3 | 34 passed, 1 failed | the digest of the reloaded guest differed from the owner's (`4b70e49a / 5e5123c0`), while their views were equal. While turns run, the referee moves the synced poll time `nextCheckAt` on every 2 s (`POLL_SECONDS`, upstream's `GameActiveRefresh` cadence), so the whole-state digest changes every 2 s. The guest sampled before a tick and the owner read after it (run 4's state dumps: samples 0.4 s apart) | digests are compared within one poll epoch. The guest sends samples (digest and `nextCheckAt`, read together); the owner compares the first sample from its own current epoch, also read together, and any difference fails. Samples from another epoch are counted and reported, and none are compared |
| 4 | 34 passed, 1 failed | on the guest, `dealVerified` was still null when checked: each page replays the deal when the referee's seed arrives, a moment after the round settles. `single()` already waited for this; `multi()` did not | wait up to 8 s for `dealVerified` before checking it |
| 5 | **35 passed, 0 failed** | | |
| 6 | **35 passed, 0 failed** | | |

No check was loosened. In runs 5 and 6 the first guest sample was already in the owner's epoch, so no sample was
skipped. Run 6, the evidence file, also had two HIT clicks that registered on the second try ("not yet after try 1").

## What remains unverified

- **Everything in the app and in a headset (rung 5).** That covers laser clicks on the 115 click boxes, card faces
  chosen by `_CardIndex` on Quest (R1), the URP card shader and ASTC textures on Quest, and frame time with about 48
  canvases and 94 animators (R3). It also covers relay traffic at the start of a round (R4), and the Android bundle
  loading at all (it passed the bundle check only).
- **Sounds and the card zoom:** they ran in Play mode but no probe asserted them (rung 3, above), and nobody listened.
- **In Play mode, only in Node:** split, manual dealing and the dealer's panel, the height buttons, Reset Table, the
  turn timer running out, walking out of range, settings changed by the owner, and two tables in one page.
- **A referee or table-owner change with two real clients:** in Node only. In rung 4 the guest, not the referee,
  reloaded, so the referee never changed.
- **More than two players, and simultaneous presses within one 50 ms tick:** in Node only (three players).
- **A deal where a seated player's runtime withholds its contribution, and the forged-deal cases (a changed hand, a
  forged contributor list):** in Node only. Play mode shows the two honest outcomes (checked; not checkable, alone and
  after a reload), not a mismatch.
