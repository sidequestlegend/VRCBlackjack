# blackjack: test evidence

Everything here ran on 2026-11-24 and 2026-11-25 on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity
editor. The results below are from the second pass of 2026-11-25: re-synced to portkit `812f285`
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
```

### Multi-player scenarios on the fake room (18 tests)

Players act through the inputs a player has: clicks on the click boxes (layer 5) and the kit's commands. The fake
room records every state write, user-state write and one-shot, so a test can show what each client could have read.

```
ok 16 - three players play four rounds with chips: every client agrees, chips follow the results, every round's draws check out
ok 17 - a split: two hands, each dealt a card after 1 s, settled separately for everyone, each at the round's bet
ok 18 - a player leaving mid-hand: the seat is freed, the hand not settled, the round goes on
ok 19 - a late joiner mid-hand sees the cards and totals as they are, and cannot take a seat until the round ends
ok 20 - the referee leaves mid-hand: the next referee finishes the round, draws the unknown hole card anew, and the new segment checks out
ok 21 - the referee who is also the table owner leaves: the table resets and every seat is freed (F73, Q12)
ok 22 - the hole card is unreadable to every client, the referee's page included, until the flip
ok 23 - a bystander cannot act for a seat, even from a modified client
ok 24 - two tables in one room stay separate; one chip balance serves both on a page
ok 25 - Start Game and the table's settings are the table owner's alone, and only between rounds
ok 26 - without allow-change, even the table owner cannot change chips, helpers or decks (F7)
ok 27 - the deal: every seated player contributes; one whose runtime never answers cannot hang the table
ok 28 - the table owner leaves: the referee's player takes the table, which resets; bets at the table go to 0 (F6, F73)
ok 29 - Reset Table frees every seat, whoever holds it (Q12), at most once per 2 s
ok 30 - the turn timer: nobody acts, every turn ends at the deadline on every client, and the dealer plays
ok 31 - manual dealing: a player's HIT raises a mark; the table owner deals and stands players from the dealer's panel
ok 32 - what one table costs the room: one sync group, a few leaves, small writes, under the rate limit
ok 33 - walking out of range releases the player's seat (F70)
```

Every scenario ends with all clients holding the same state digest and no error logged. A refused network event is
logged as an error, so a missing `networkCallable` entry fails the run. The tests run on the real `bindings.json` that
the kit builder writes (hash `b3d4ca74...`), not the provisional one.

## Rung 2: the kit in edit mode (`PortKit/Kit/Check`)

Re-run 2026-11-25 on the final bundles:

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS blackjack bindings: 867 objects resolve by path; hash matches (b3d4ca74e481132f555e2917343de28c3ec5a686)
PASS blackjack android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 2166/7953, behaviours 2101, scripts 11, calls 0, animation events 0, graph blobs 5 (308 KiB), decompressed 21 blocks / 2 MiB of 14 MiB (LZ4), ...
PASS blackjack windows bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 2166/7953, behaviours 2101, scripts 11, calls 0, animation events 0, graph blobs 5 (308 KiB), decompressed 21 blocks / 2 MiB of 20 MiB (LZ4), ...
DONE
```

The kit (`Logs/portkit_kits.txt`): 1,872 objects, 867 bound (115 clickable, 0 synced, 0 grabbable), 546 refs, 115
behaviours, 44 events. The relay graph has 519 units, 207 control and 518 value connections and 49 distinct members,
all on the SDK's allow list of 29,061. It carries the standard ops only; the game defines no relay ops of its own and
relays no events. Bundles: Android 7,122 KiB, Windows 8,790 KiB, each with the third-party notices inside.

**Click boxes against uGUI buttons**, measured by building the kit both ways (`Logs/portkit_kits_click.txt` and
`portkit_kits_uibutton.txt`). With the 41 seat and table buttons as `uiButton` events, the relay graph has 1,011 units,
248 control and 928 value connections, and 41 relayed events: 546,558 bytes, against 289,524 bytes for the click boxes.
Click boxes were chosen: half the graph, and nothing for every instance to run on each press.

Artifacts (`PortKit/Kit/Take Photos`, then `PortKit/Kit/Export Artifacts`, `altspace/dist/`, not committed):

| File | Bytes | sha1 |
|---|---|---|
| `android/blackjack` | 7,293,189 | `532e00e503e57020543cd6763e64c03b07983aeb` |
| `windows/blackjack` | 9,001,367 | `89f9f56664ff50590e220917cdbc9a770a7529e6` |
| `pk-blackjack.js` (Apache-2.0 banner) | 651,521 | `df8efe8cf5a3595f216436500e7db06d1667b5bf` |
| `blackjack.jpg` | 61,658 | `815ea0b04610adc95f83d956b9c7187a00f88870` |
| `blackjack.snippet.html` (the game's settings, `position="0 0 0"`) | 523 | `f2fb8cb65af04aca1f69d773c3f54bf3865b6ef5` |

`manifest.json`: checks android PASS, windows PASS, bindings `b3d4ca74e481132f555e2917343de28c3ec5a686`, footprint
3.95 x 0.92 x 2.07 m. Export copies files and builds nothing, so the Play-mode runs below loaded these same files. The
pages asked for the Windows bundle as `kits/windows/blackjack?v=89f9f56664`, the start of the exported sha1, and the
script is byte for byte `Assets/WebRoot/pk-blackjack.js`. The editor loads only the Windows bundle. The Android
bundle passed the check but was never loaded.

## Rung 3: Play mode, one player (`playtest/single.json`)

A hand-written `<bs-snippet name="blackjack" ... chips="true">` with the built script and both bundles from the
test's local server, and `Assets/WebRoot/playtest/blackjack-playtest.js`. The driver works the table through the SDK's
desktop player with portkit's InputSim: a mouse of the test's own, with which the SDK casts its own rays and raises the
clicks. It reads Unity back with the `probe` command. **RESULT 21 passed, 0 failed; 0 console error lines**
(`playtest/evidence_single.txt`, screenshots `evidence_single_deal.jpg` and `evidence_single_settled.jpg`).

```
PASS the kit loads from a hand-written bs-snippet and the instance starts
PASS the kit is in the scene: the table, card slots off: table True, dealer slot 0 active False, seat 3's join box active True
PASS the first player owns the table: Main Editor
PASS the element's settings: chips on, 100 to start: chips true, 100
PASS Join Game takes seat 3 (click box on the UI layer, real mouse)
PASS the seat's name reached Unity (relay op text): Main Editor
PASS two chip buttons make a bet of 15, shown on the chip panel: bet 15, panel '15', total '100'
PASS Start Game starts a round: round 1, phase dealing
PASS the deal: two cards to the seat, two to the dealer, the hole card face down: phase turns, seat [51,5], dealer [-1,16], deal bj1.1.f0964ed7
PASS the seat's two cards are on in Unity with the faces in state (matFloat _CardIndex): state [51,5]; Unity True/51 True/5; next slot active False
PASS the dealer's up card shows its face; the hole card's face is blank in Unity: d0 True/-1, d1 True/16 (state 16)
PASS HIT deals a third card: [51,5,24] total 12
PASS the third card is on in Unity with its face: state [51,5,24]; Unity True/51 True/5 True/24; next slot active False
PASS STAND ends the turn
PASS the dealer flips and plays; the round settles: dealer [51,16] = 17, seat [51,5,24] = 12, result lose
PASS the flipped hole card's face reached Unity and matches its commitment: Unity 51, state 51, verified true
PASS the verdict follows the totals: lose (by the totals: lose)
PASS the chips change by the bet (1 to 1): 100 -> 85 (-15)
PASS the chip panel shows the new total: 85
PASS the round's draws replay from the revealed deal: {"ok":true,"reason":""}
PASS the credits panel opens and closes: True, False
```

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

**RESULT 35 passed, 0 failed (main 14, Player 2 21); 0 console error lines**, twice in a row on the exported bundles
(runs 5 and 6 below). The file `playtest/evidence_multi.txt` is run 6.

```
[main] PASS two players in the room: ["Main Editor","Player 2"]
[main] PASS this player takes seat 3                     [vp-..] PASS this player takes seat 4
[both] PASS both players are seated, on both pages: -,-,-,Main Editor,Player 2,-,-
[both] PASS before the flip this page holds the hole card face down, and Unity's slot face is blank: state [-1,11], Unity -1
[both] PASS the hole card was unreadable on this page before the flip, and the flipped card matches its commitment: hole 11 (value 4); before: cards [-1,11], total 4, hash OgtkaQDiCSSH..., Unity -1
[both] PASS the round's draws replay from the revealed deal (both seats contributed): {"ok":true,"reason":""} bj1.1.ab1bf97f
[both] PASS round 1: seat 3's cards are on in this page's Unity with the faces in state: state [36,26]; Unity True/36 True/26; next slot active False
[both] PASS round 1: seat 4's cards are on in this page's Unity with the faces in state: state [16,6,2,27]; Unity True/16 True/6 True/2 True/27; next slot active False
[main] PASS round 1: the other player's hand was played and settled, as this page sees it: Player 2 [16,6,2,27] = 19, win
[vp-..] PASS round 1: the other player's hand was played and settled, as this page sees it: Main Editor [36,26] = 18, draw
[both] PASS both pages reach the same state digest after round 1: f89e5ba1 / f89e5ba1
[vp-..] INFO the guest reloads its page mid-hand
[vp-..] PASS the kit is in the scene after the reload, the dealer's first slot as the state says: table True, dealer slot 0 active True, dealer [-1,32]
[vp-..] PASS after reloading mid-hand the guest sees the same table (late join): turns r2 dealer -1,32=10 | - | - | - | Main Editor:25,7=11 00 | - | - | - / (the owner's view, identical)
[vp-..] PASS the reloaded page shows the other seat's cards in Unity with their faces: state [25,7]; Unity True/25 True/7; next slot active False
[vp-..] PASS the reloaded page shows the dealer's cards as they are (hole card still blank unless flipped): d1 True/32, dealer [-1,32]
[vp-..] PASS the guest's old seat was freed when its session left (C21, F72)
[vp-..] PASS the reloaded page joined before the flip: flipped false, dealer [-1,32]
[main] PASS the reloaded guest's page holds the same state as the owner's (digest, same poll epoch): 8d395d1c / 8d395d1c at poll epoch 1795550480.11364 (guest sample 1; 0 samples from another epoch skipped)
[vp-..] PASS round 2: the hole card was unreadable on the reloaded page (late join state) before the flip, and the flipped card matches its commitment: hole 39 (value 10); before: cards [-1,32], total 10, hash ZKKW3TZlxRlW..., Unity -1
[main] PASS both pages agree at the end of round 2: 8be559a6 / 8be559a6; settled r2 dealer 39,32=20 | - | - | - | Main Editor:25,7,35=21 10 | - | - | -
```

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

### Runs, failures and their causes

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
- **A deal where a seated player's runtime withholds its contribution:** in Node only.
