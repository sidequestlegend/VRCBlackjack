// Rung 1, rules: the TypeScript arithmetic against golden vectors from upstream's own C#.
//
// vectors/upstream.json is written by golden/upstream (dotnet 8): golden/extract.ts copies upstream's rule methods
// verbatim by line range (DeckManager.cs:53-87, PlayerDeck.cs:150-261, Dealer.cs:61-94 and 196-295,
// Player.cs:353-378, 403-428, 468-576, 599-602, ChipController.cs:38-110, Controller.cs:204-215) and compiles them
// against stubs. Each test checks the port in upstream's literal mode first; where the port changes the rules on
// purpose (Q1, Q4, Q5), the test then asserts the difference.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ChipBank } from "../src/ChipController.ts";
import { DealSchedule } from "../src/Controller.ts";
import { DealerShouldDraw } from "../src/Dealer.ts";
import { AddDeckCount, CardName, CardValue, CheckHands, GetUnusedCardIndex, HandCode, InitializeCounts, ReplayCards, ReplaySegment, SubtractDeckCount, TO_DEALER, TO_HOLE } from "../src/DeckManager.ts";
import { ChipChange, RESULT_DRAW, RESULT_LOSE, RESULT_NONE, RESULT_WIN, SettleHand, SplitLiteral } from "../src/Player.ts";
import { AddCardValue, NewHand, ScoreValues, type HandMath } from "../src/PlayerDeck.ts";
import { Draw } from "../portkit/src/index.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const V: any = JSON.parse(readFileSync(fileURLToPath(new URL("../vectors/upstream.json", import.meta.url)), "utf8"));
const triple = (h: HandMath) => [h.localDeckValue, h.NumOfAces, h.IsBust ? 1 : 0];

test("vectors come from upstream's compiled C#", () => {
  assert.match(V.source, /83f05db/);
  assert.match(V.source, /dotnet 8/);
});

test("card values and names follow the prefab's card list (B.prefab:8064)", () => {
  assert.deepEqual([0, 1, 2, 3].map(CardValue), [2, 2, 2, 2]);
  assert.equal(CardValue(32), 10); // the tens
  assert.equal(CardValue(36), 10); // jacks
  assert.equal(CardValue(40), 10); // kings
  assert.equal(CardValue(44), 10); // queens
  assert.deepEqual([48, 49, 50, 51].map(CardValue), [11, 11, 11, 11]);
  assert.equal(CardName(0), "2 of Clubs");
  assert.equal(CardName(48), "Ace of Diamonds");
  assert.equal(CardName(51), "Ace of Spades");
  const counts = new Map<number, number>();
  for (let t = 0; t < 52; t++) counts.set(CardValue(t), (counts.get(CardValue(t)) ?? 0) + 1);
  assert.equal(counts.get(10), 16);
  assert.equal(counts.get(11), 4);
});

test("V1 InitializeDeck: literal counts match; the port fixes the two of clubs (Q1)", () => {
  for (const c of V.deck.init) {
    assert.deepEqual(InitializeCounts(c.decks, true), c.counts, `decks ${c.decks}`);
    const fixed = InitializeCounts(c.decks);
    assert.equal(c.counts[0], 999, "upstream: the two of clubs never runs out");
    assert.equal(fixed[0], c.decks, "port: the two of clubs has NumberOfDecks copies like every card");
    assert.deepEqual(fixed.slice(1), c.counts.slice(1));
  }
});

test("V1 AddDeck and SubtractDeck: no upper limit, never below 2", () => {
  for (const run of V.deck.ops) {
    let n = 2;
    const after: number[] = [];
    for (const op of run.ops as string) {
      n = op === "+" ? AddDeckCount(n) : SubtractDeckCount(n);
      after.push(n);
    }
    assert.deepEqual(after, run.after, run.ops);
  }
});

test("V2 GetUnusedCardIndex: every start index against 32 count arrays (the dealer's copy agreed in C#)", () => {
  let n = 0;
  for (const c of V.unused) {
    for (let start = 0; start < 52; start++) {
      assert.equal(GetUnusedCardIndex(c.counts, start), c.results[start], `start ${start} counts ${c.counts.join(",")}`);
      n++;
    }
  }
  assert.equal(n, 52 * V.unused.length);
});

test("V3 hand scoring: soft and hard aces and bust, after every card of 2,610 sequences", () => {
  let cards = 0;
  for (const c of V.add) {
    const hand = NewHand();
    c.cards.forEach((v: number, k: number) => {
      AddCardValue(hand, v);
      assert.deepEqual(triple(hand), c.steps[k], `cards ${c.cards.slice(0, k + 1).join(",")}`);
      // The port scores a hand from its cards; for a hand that was never split that is the same arithmetic.
      assert.deepEqual(triple(ScoreValues(c.cards.slice(0, k + 1))), c.steps[k]);
      cards++;
    });
  }
  assert.ok(cards > 10000);
});

test("V3 the dealer's AddCardValue (Dealer.cs:196-231) is the same arithmetic", () => {
  for (const c of V.dealerAdd) {
    const hand = NewHand();
    c.cards.forEach((v: number, k: number) => {
      AddCardValue(hand, v);
      assert.deepEqual(triple(hand), c.steps[k]);
    });
  }
});

test("hand scoring, hand-derived cases (PlayerDeck.cs:150-176)", () => {
  // Soft hands: an ace counts 11 while the total is below 11.
  assert.deepEqual(triple(ScoreValues([11, 6])), [17, 1, 0]); // soft 17
  assert.deepEqual(triple(ScoreValues([11, 6, 10])), [17, 0, 0]); // the ace drops to 1: hard 17
  assert.deepEqual(triple(ScoreValues([11, 11])), [12, 1, 0]); // a second ace arrives at 11 and counts 1
  assert.deepEqual(triple(ScoreValues([11, 11, 9])), [21, 1, 0]);
  assert.deepEqual(triple(ScoreValues([10, 11])), [21, 1, 0]); // an ace at 10 counts 11
  assert.deepEqual(triple(ScoreValues([5, 6, 11])), [12, 0, 0]); // an ace at 11 counts 1
  // Bust: over 21 with no 11-ace left.
  assert.deepEqual(triple(ScoreValues([10, 6, 10])), [26, 0, 1]);
  assert.deepEqual(triple(ScoreValues([11, 5, 10, 10])), [26, 0, 1]);
  // "Blackjack detection": upstream has none (F43). A two-card 21 is a 21 like any other: it pays 1 to 1 and
  // draws against a dealer's 21 of three cards.
  const natural = ScoreValues([11, 10]);
  assert.equal(natural.localDeckValue, 21);
  assert.equal(SettleHand(21, 21), RESULT_DRAW);
  assert.equal(SettleHand(21, 20), RESULT_WIN);
  assert.equal(ChipChange(SettleHand(natural.localDeckValue, 20), 10), 10, "1 to 1, not 3 to 2 or 2 to 1");
});

test("V4 split: upstream's arithmetic matches; the port scores each hand from its cards (Q4)", () => {
  let differ = 0;
  for (const c of V.split) {
    const normal = NewHand();
    const split = NewHand();
    AddCardValue(normal, c.pair);
    AddCardValue(normal, c.pair);
    SplitLiteral(normal, split, c.pair);
    assert.deepEqual([triple(normal), triple(split)], c.afterSplit, `pair ${c.pair}`);
    AddCardValue(split, c.splitCards[0]);
    AddCardValue(normal, c.normalCards[0]);
    for (const v of c.splitCards.slice(1)) AddCardValue(split, v);
    for (const v of c.normalCards.slice(1)) AddCardValue(normal, v);
    assert.deepEqual(triple(normal), c.normal, `pair ${c.pair} normal ${c.normalCards}`);
    assert.deepEqual(triple(split), c.split, `pair ${c.pair} split ${c.splitCards}`);

    // The port: each hand is its own cards, scored afresh.
    const fixedNormal = ScoreValues([c.pair, ...c.normalCards]);
    const fixedSplit = ScoreValues([c.pair, ...c.splitCards]);
    if (c.pair !== 11) {
      assert.deepEqual(triple(fixedNormal), c.normal, "only split aces are affected");
      assert.deepEqual(triple(fixedSplit), c.split);
    } else if (JSON.stringify(triple(fixedNormal)) !== JSON.stringify(c.normal) || JSON.stringify(triple(fixedSplit)) !== JSON.stringify(c.split)) differ++;
  }
  assert.ok(differ > 0, "split aces differ from upstream");
  // Q4's example: split aces, then a ten to each hand.
  const aces = V.split.find((c: { pair: number; splitCards: number[]; normalCards: number[] }) => c.pair === 11 && c.splitCards.join() === "10" && c.normalCards.join() === "10");
  assert.ok(aces);
  assert.deepEqual(aces.normal, [11, 1, 0], "upstream: the first hand shows 11, with an 11-ace still on record");
  assert.deepEqual(aces.split, [21, 0, 0]);
  assert.deepEqual(triple(ScoreValues([11, 10])), [21, 1, 0], "port: ace and ten is 21 in either hand");
});

test("V4 split's bet: doubled when affordable, unchanged when not (Q6), as upstream", () => {
  for (const c of V.split) {
    const bank = new ChipBank<number>(c.chipCount);
    bank.CurrentBet.set(0, 10);
    if (c.usingChips) bank.AddToBet(0, 10);
    assert.equal(bank.Bet(0), c.betAfterSplit, `chips ${c.chipCount} using ${c.usingChips}`);
  }
});

test("V6 SetWinState: verdicts and sounds match; split hands pay the round's bet, not the doubled one (Q5)", () => {
  let q5 = 0;
  for (const c of V.settle) {
    const log: string[] = c.log;
    if (!c.active) {
      assert.deepEqual(log, [], "a free seat is not settled (F61)");
      assert.equal(c.chipDelta, 0);
      continue;
    }
    const r0 = SettleHand(c.normal, c.dealer);
    const banner = { [RESULT_WIN]: "ui:Win", [RESULT_DRAW]: "ui:Draw", [RESULT_LOSE]: "ui:Lose" }[r0];
    const sound = { [RESULT_WIN]: "sound:Win", [RESULT_DRAW]: "sound:DrawMatch", [RESULT_LOSE]: "sound:Lose" }[r0];
    assert.equal(log[0], banner, `normal ${c.normal} dealer ${c.dealer}`);
    assert.equal(log[1], sound, "the holder hears the first hand's result");
    let r1 = RESULT_NONE;
    if (c.split !== null) {
      r1 = SettleHand(c.split, c.dealer);
      const splitBanner = { [RESULT_WIN]: "ui:SplitWin", [RESULT_DRAW]: "ui:SplitDraw", [RESULT_LOSE]: "ui:SplitLose" }[r1];
      assert.equal(log[2], splitBanner);
      assert.ok(!log.slice(3).some((l) => l.startsWith("sound:")), "no sound for the split hand");
    }
    assert.equal(log[log.length - 1], "frames:Player.DelayedResetBet:5", "the bet resets 5 frames later");
    // Literal: each hand settles at the table's current bet.
    const literal = ChipChange(r0, c.bet) + (c.split !== null ? ChipChange(r1, c.bet) : 0);
    assert.equal(literal, c.chipDelta, JSON.stringify(c));
    // Port: after a split upstream has doubled the bet (10 -> 20); each hand still plays for the 10 of the round.
    if (c.split !== null && c.bet === 20) {
      const port = ChipChange(r0, 10) + ChipChange(r1, 10);
      assert.equal(port * 2, c.chipDelta);
      if (port !== c.chipDelta) q5++;
    }
  }
  assert.ok(q5 > 0);
  // Q5's example: bet 10, split, both hands win: upstream +40, the port +20.
  const both = V.settle.find((c: { normal: number; dealer: number; split: number | null; bet: number }) => c.normal === 20 && c.dealer === 18 && c.split === 20 && c.bet === 20);
  assert.equal(both.chipDelta, 40);
  assert.equal(ChipChange(SettleHand(20, 18), 10) + ChipChange(SettleHand(20, 18), 10), 20);
});

test("V7 ChipController: balances, bets per table and sounds over 30 random runs", () => {
  for (const run of V.chips) {
    const bank = new ChipBank<number>(100);
    for (const t of [0, 1, 2]) bank.CurrentBet.set(t, 0);
    let sounds: string[] = [];
    bank.play = (clip) => sounds.push(`sound:${clip}`);
    for (const step of run) {
      sounds = [];
      const [op, a, b] = (step.op as string).split(" ");
      if (op === "AddToBet") bank.AddToBet(Number(a), Number(b));
      else if (op === "TakeFromBet") bank.TakeFromBet(Number(a), Number(b));
      else if (op === "AddChips") bank.AddChips(Number(a));
      else if (op === "RemoveChips") bank.RemoveChips(Number(a));
      else if (op === "ResetChips") bank.ResetChips();
      else bank.ResetBet(Number(a));
      assert.equal(bank.CurrentChipCount, step.chips, step.op);
      assert.deepEqual([0, 1, 2].map((t) => bank.Bet(t)), step.bets, step.op);
      assert.deepEqual(sounds, step.sounds, step.op);
    }
  }
});

test("V8 the deal schedule for 1 to 7 seats", () => {
  for (const c of V.schedule) {
    const expected = (c.events as Array<[string, string, number]>).map(([who, name, at]) => `${at.toFixed(3)} ${who} ${name}`).sort();
    const port: string[] = [];
    for (const s of DealSchedule(c.n)) {
      if (s.kind === "player1") port.push(`${s.at.toFixed(3)} Player${s.i} GlobalStartFirstCard`);
      else if (s.kind === "player2") port.push(`${s.at.toFixed(3)} Player${s.i} GlobalStartSecondCard`);
      else if (s.kind === "dealer1") port.push(`${s.at.toFixed(3)} Dealer GlobalStartFirstCard`);
      else if (s.kind === "dealer2") port.push(`${s.at.toFixed(3)} Dealer GlobalStartSecondCard`);
      else port.push(`${s.at.toFixed(3)} Controller StartActivePlay`, `${s.at.toFixed(3)} Controller GameActiveRefresh`);
    }
    assert.deepEqual(port.sort(), expected, `n ${c.n}`);
  }
});

test("V9 DealerPlay: stands on every 17 (soft 17 too), draws every 0.5 s after a 1 s flip", () => {
  for (const c of V.dealerPlay) {
    const hand = ScoreValues([c.hole, c.up]);
    let drawn = 0;
    const delays = [1];
    while (DealerShouldDraw(hand.localDeckValue, hand.IsBust)) {
      AddCardValue(hand, c.stream[drawn]);
      drawn++;
      delays.push(0.5);
    }
    assert.equal(drawn, c.drawn, `hole ${c.hole} up ${c.up}`);
    assert.equal(hand.localDeckValue, c.total);
    assert.equal(hand.IsBust, c.bust);
    assert.equal(c.bustEvent, c.bust, "the table's Bust banner goes with a dealer bust");
    assert.ok(c.finished);
    assert.deepEqual(delays, c.delays);
  }
  const soft17 = ScoreValues([11, 6]);
  assert.equal(DealerShouldDraw(soft17.localDeckValue, soft17.IsBust), false, "soft 17 stands");
});

test("draws replay from the revealed deal, and a changed card is caught", () => {
  const seed = "test-seed";
  const counts = InitializeCounts(2);
  const log: number[] = [];
  const draw = new Draw(seed);
  for (let k = 0; k < 30; k++) {
    const card = GetUnusedCardIndex(counts, draw.Int(52, k));
    log.push(card);
    counts[card]!--;
  }
  assert.deepEqual(ReplaySegment(draw, 2, [], log), { ok: true, status: "checked", reason: "" });
  const forged = log.slice();
  forged[5] = (forged[5]! + 1) % 52;
  assert.equal(ReplaySegment(draw, 2, [], forged).ok, false);
  assert.equal(ReplaySegment(new Draw("another seed"), 2, [], log).ok, false);
  // Fresh random cards per draw, as upstream: every type stays possible, with 2 decks a type runs out after 2.
  assert.ok(new Set(log).size > 15);
});

test("the hands on the table are held against the deal: a changed, swapped, extra or missing card is caught", () => {
  const draw = new Draw("hands-seed");
  // seat 0 and seat 1 get a card each, the dealer's hole card, again each seat, the dealer's up card, a hit for seat 1
  const to = [HandCode(0, false), HandCode(1, false), TO_HOLE, HandCode(0, false), HandCode(1, false), TO_DEALER, HandCode(1, false)];
  const cards = ReplayCards(draw, 2, [], to.length);
  const hands = () => ({
    seats: [
      { normal: [cards[0]!, cards[3]!], split: [] as number[] },
      { normal: [cards[1]!, cards[4]!, cards[6]!], split: [] as number[] },
    ],
    dealer: [cards[2]!, cards[5]!],
  });
  assert.equal(CheckHands(cards, to, [], hands()).status, "checked");
  const changed = hands();
  changed.seats[1]!.normal[2] = (cards[6]! + 1) % 52;
  assert.equal(CheckHands(cards, to, [], changed).status, "mismatch", "a hand's card changed");
  const swapped = hands();
  [swapped.seats[0]!.normal[0], swapped.seats[1]!.normal[0]] = [cards[1]!, cards[0]!];
  if (cards[0] !== cards[1]) assert.equal(CheckHands(cards, to, [], swapped).status, "mismatch", "two seats' cards swapped (same cards on the table)");
  const toDealer = hands();
  toDealer.seats[1]!.normal.pop();
  toDealer.dealer = [...toDealer.dealer, cards[6]!];
  assert.equal(CheckHands(cards, to, [], toDealer).status, "mismatch", "a seat's card given to the dealer");
  const extra = hands();
  extra.seats[0]!.normal.push(7);
  assert.equal(CheckHands(cards, to, [], extra).status, "mismatch", "a card nobody drew");
  assert.equal(CheckHands(cards, to.slice(0, 6), [], hands()).status, "mismatch", "a destination left out");
  // a split: the second card's draw moves to the split hand
  const split = to.slice();
  split[3] = HandCode(0, true);
  const splitHands = hands();
  splitHands.seats[0] = { normal: [cards[0]!], split: [cards[3]!] };
  assert.equal(CheckHands(cards, split, [], splitHands).status, "checked");
  // cards from before the segment (a referee change) come first in their hands and must add up to baseCards
  const later = ReplayCards(draw, 2, [5, 9], 1);
  assert.equal(CheckHands(later, [HandCode(0, false)], [5, 9], { seats: [{ normal: [5, later[0]!], split: [] }], dealer: [9] }).status, "checked");
  assert.equal(CheckHands(later, [HandCode(0, false)], [5, 9], { seats: [{ normal: [6, later[0]!], split: [] }], dealer: [9] }).status, "mismatch", "a card held from before changed");
});
