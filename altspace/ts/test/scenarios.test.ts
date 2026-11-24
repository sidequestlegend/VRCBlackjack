// Rung 1, the table: several players on the fake room with virtual time. Draws come from a committed random seed
// (WebCrypto), so no two runs deal the same cards; every check below holds for any deal.

import assert from "node:assert/strict";
import { test } from "node:test";
import type { AudioController } from "../src/AudioController.ts";
import { HIDDEN } from "../src/DeckManager.ts";
import { ChipChange, ENDED_LEFT, RESULT_NONE } from "../src/Player.ts";
import { SLOT_OFF } from "../src/PlayerDeck.ts";
import {
  assertAgree,
  ctrl,
  dealer,
  dealerUI,
  deck,
  hand,
  newWorld,
  playRound,
  press,
  referee,
  seat,
  seatButton,
  seatPlayers,
  SLUG,
  startRound,
  STEP,
  tableText,
  until,
  untilPhase,
} from "./helpers.ts";

const CHIPS = { chips: "true", helpers: "true" };

test("three players play four rounds with chips: every client agrees, chips follow the results, every round's draws check out", async () => {
  const w = newWorld(11);
  const ann = w.join({ name: "Ann", elements: [CHIPS] });
  const bob = w.join({ name: "Bob", elements: [CHIPS] });
  const cat = w.join({ name: "Cat", elements: [CHIPS] });
  await w.settle();
  await w.run(STEP);
  assert.equal(ctrl(w, bob).tableOwnerName, "Ann", "the referee's player is the first table owner (C17)");
  assert.equal(ctrl(w, cat).UsingChips, true, "the snippet's attribute became the table's state");
  const players: Array<[typeof ann, number]> = [
    [ann, 0],
    [bob, 3],
    [cat, 6],
  ];
  await seatPlayers(w, players);

  for (let round = 1; round <= 4; round++) {
    const before = new Map(players.map(([c]) => [c, ctrl(w, c).ChipController.CurrentChipCount]));
    for (const [c, i] of players) seatButton(c, i, "Add10");
    await w.run(STEP);
    for (const [c, i] of players) {
      assert.equal(ctrl(w, c).ChipController.GetBet(), 10, `${c.name} bet 10`);
      assert.equal(seat(w, c, i).TotalBet, 10);
    }
    assert.equal(await startRound(w, ann), round);
    // Nobody can bet once the round runs (F20).
    seatButton(bob, 3, "Add10");
    await w.run(STEP);
    assert.equal(ctrl(w, bob).ChipController.GetBet(), 10);
    await playRound(w, players);
    assertAgree(w);
    for (const c of w.clients) {
      assert.equal(ctrl(w, c).round, round);
      assert.deepEqual(deck(w, c).verified, { ok: true, status: "checked", reason: "" }, `${c.name} replayed round ${round}`);
      assert.equal(dealer(w, c).holeVerified, true);
    }
    for (const [c, i] of players) {
      const p = seat(w, c, i);
      assert.notEqual(p.result[0], RESULT_NONE, `${c.name} settled`);
      const expected = ChipChange(p.result[0]!, 10) + (p.HasSplit ? ChipChange(p.result[1]!, 10) : 0);
      assert.equal(ctrl(w, c).ChipController.CurrentChipCount - before.get(c)!, expected, `${c.name}'s chips in round ${round}`);
      assert.equal(ctrl(w, c).ChipController.GetBet(), 0, "the bet resets after the round (F23)");
    }
  }
  // Q16: the "new round" sound once per round, not once per seat.
  for (const c of w.clients) assert.equal(w.behaviour<AudioController>(c, "audio").played.filter((s) => s === "StartActivePlay").length, 4);
  assert.deepEqual(w.problems(), []);
});

test("a split: two hands, each dealt a card after 1 s, settled separately for everyone, each at the round's bet", async () => {
  const w = newWorld(12);
  const ann = w.join({ name: "Ann", elements: [CHIPS] });
  const bob = w.join({ name: "Bob", elements: [CHIPS] });
  await w.settle();
  const players: Array<[typeof ann, number]> = [
    [ann, 0],
    [ann, 1],
    [bob, 2],
    [bob, 4],
  ];
  await seatPlayers(w, players);
  let splitter: [typeof ann, number] | null = null;
  for (let round = 0; round < 40 && !splitter; round++) {
    for (const c of [ann, bob]) {
      seatButton(c, c === ann ? 0 : 2, "Add10");
    }
    await w.run(STEP);
    await startRound(w, ann);
    await untilPhase(w, ann, "turns");
    await w.run(STEP);
    splitter = players.find(([c, i]) => seat(w, c, i).CanSplit && seat(w, c, i).myTurn) ?? null;
    if (splitter) break;
    for (const [c, i] of players) seatButton(c, i, "Stand");
    await untilPhase(w, ann, "settled");
    await w.run(STEP);
  }
  assert.ok(splitter, "no pair in 40 rounds");
  const [c, i] = splitter;
  const other = c === ann ? bob : ann;
  const pair = hand(w, c, i).cards.slice();
  const chipsBefore = ctrl(w, c).ChipController.CurrentChipCount;
  const roundBet = seat(w, c, i).roundBetForTests;
  seatButton(c, i, "Split");
  await w.run(400);
  assert.equal(seat(w, other, i).HasSplit, true, "everyone sees the split (Q7)");
  assert.deepEqual(hand(w, other, i, true).cards, [pair[1]], "the second card is the split hand's first");
  assert.deepEqual(hand(w, other, i).cards, [pair[0]]);
  // Hits are refused during the second after a split (Player.cs:321, 334).
  seatButton(c, i, "HitNormal");
  await w.run(300);
  assert.equal(hand(w, other, i).cards.length, 1);
  await w.run(STEP);
  assert.equal(hand(w, other, i, true).cards.length, 2, "the split hand got its card");
  assert.equal(hand(w, other, i).cards.length, 2, "the first hand got its card");
  assert.equal(ctrl(w, c).ChipController.GetBet(), roundBet === 0 ? 0 : roundBet * 2, "the splitter's table bet doubled (Player.cs:359-362)");
  // Both hands are scored from their own cards (Q4).
  for (const split of [false, true]) {
    const h = hand(w, other, i, split);
    assert.ok(h.TotalDeckValue >= 4 && h.TotalDeckValue <= 21);
  }
  for (const [pc, pi] of players) if (!(pc === c && pi === i)) seatButton(pc, pi, "Stand");
  seatButton(c, i, "Stand");
  await untilPhase(w, ann, "settled");
  await w.run(STEP);
  assertAgree(w);
  // The split card's draw moved with it (DeckManager.Moved): every hand still checks against the deal.
  for (const viewer of [ann, bob]) assert.deepEqual(deck(w, viewer).verified, { ok: true, status: "checked", reason: "" }, `${viewer.name} checks the split hands`);
  for (const viewer of [ann, bob]) {
    const p = seat(w, viewer, i);
    assert.notEqual(p.result[0], RESULT_NONE);
    assert.notEqual(p.result[1], RESULT_NONE, `${viewer.name} sees the split hand's result (Q7)`);
  }
  const p = seat(w, c, i);
  // The splitter's chips: both hands at the round's bet (Q5), plus whatever the splitter's other seat did.
  const otherSeat = players.find(([pc, pi]) => pc === c && pi !== i)!;
  const o = seat(w, c, otherSeat[1]);
  const expected = ChipChange(p.result[0]!, roundBet) + ChipChange(p.result[1]!, roundBet) + ChipChange(o.result[0]!, roundBet) + (o.HasSplit ? ChipChange(o.result[1]!, roundBet) : 0);
  assert.equal(ctrl(w, c).ChipController.CurrentChipCount - chipsBefore, expected);
  // The split row is drawn from state on the other client.
  assert.equal(other.graph(SLUG).active.get(`p${i}_s0`), true);
  assert.equal(other.graph(SLUG).floats.get(`p${i}_s0f/_CardIndex`), String(pair[1]));
  assert.deepEqual(w.problems(), []);
});

test("a player leaving mid-hand: the seat is freed, the hand not settled, the round goes on", async () => {
  const w = newWorld(13);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  await w.settle();
  await seatPlayers(w, [
    [ann, 0],
    [bob, 2],
    [cat, 4],
  ]);
  await startRound(w, ann);
  await untilPhase(w, ann, "turns");
  w.leave(bob);
  await w.run(STEP * 2);
  for (const c of [ann, cat]) {
    const p = seat(w, c, 2);
    assert.equal(p.IsActive, false, `${c.name}: Bob's seat is free`);
    assert.equal(p.HasFinishedTurn, true);
    assert.equal(p.endedBy, ENDED_LEFT);
  }
  await playRound(w, [
    [ann, 0],
    [cat, 4],
  ]);
  assertAgree(w);
  assert.deepEqual(seat(w, ann, 2).result, [RESULT_NONE, RESULT_NONE], "a seat freed during the round is not settled (F61)");
  assert.notEqual(seat(w, ann, 0).result[0], RESULT_NONE);
  assert.notEqual(seat(w, cat, 4).result[0], RESULT_NONE);
  assert.deepEqual(w.problems(), []);
});

test("a late joiner mid-hand sees the cards and totals as they are, and cannot take a seat until the round ends", async () => {
  const w = newWorld(14);
  const ann = w.join({ name: "Ann", elements: [CHIPS] });
  const bob = w.join({ name: "Bob", elements: [CHIPS] });
  await w.settle();
  await seatPlayers(w, [
    [ann, 0],
    [bob, 5],
  ]);
  await startRound(w, ann);
  await untilPhase(w, ann, "turns");
  await w.run(STEP);
  if (hand(w, bob, 5).TotalDeckValue < 21) seatButton(bob, 5, "HitNormal");
  await w.run(STEP);

  const dan = w.join({ name: "Dan", elements: [CHIPS] });
  await w.settle();
  await w.run(STEP);
  assert.equal(tableText(w, dan), tableText(w, ann), "Dan's table is Ann's");
  assertAgree(w);
  assert.equal(ctrl(w, dan).GameActive, true, "Dan knows a round runs (F78)");
  const g = dan.graph(SLUG);
  for (const i of [0, 5]) {
    const h = hand(w, dan, i);
    h.cards.forEach((card, k) => {
      assert.equal(g.active.get(`p${i}_n${k}`), true, `seat ${i} card ${k} shown`);
      assert.equal(g.floats.get(`p${i}_n${k}f/_CardIndex`), String(card), `seat ${i} card ${k} face`);
      assert.equal(h.Showing(k), card);
    });
    assert.equal(g.text.get(`p${i}_normalHelper`), String(h.TotalDeckValue), "the helper total (F64)");
    assert.equal(g.text.get(`p${i}_normalCount`), String(h.TotalDeckValue), "the dealer panel's count");
  }
  assert.equal(g.text.get("p5_nameText"), "Bob");
  // The dealer: the hole card's back and the up card's face.
  assert.equal(dealerUI(w, dan).Showing(0), HIDDEN);
  assert.equal(g.active.get("d0"), true);
  assert.ok([undefined, "-1"].includes(g.floats.get("d0f/_CardIndex")), "no face is ever sent for the hole card (its face is blank)");
  assert.equal(g.floats.get("d1f/_CardIndex"), String(dealer(w, dan).cards[1]));
  assert.equal(dealerUI(w, dan).Showing(2), SLOT_OFF);

  // Q11: no seat mid-round.
  seatButton(dan, 3, "Join");
  await w.run(STEP * 2);
  assert.equal(seat(w, ann, 3).IsActive, false);

  for (const [c, i] of [
    [ann, 0],
    [bob, 5],
  ] as const)
    seatButton(c, i, "Stand");
  await untilPhase(w, dan, "settled");
  await w.run(STEP);
  assertAgree(w);
  assert.deepEqual(deck(w, dan).verified, { ok: true, status: "checked", reason: "" }, "the late joiner checks the round's draws too");
  const banners = dan.graph(SLUG).events.filter((e) => e.op === "animTrigger" && e.target === "p0_uiAnim").map((e) => e.args[0]);
  assert.ok(banners.some((b) => b === "Win" || b === "Lose" || b === "Draw"), "the late joiner sees the result banner");
  // Now Dan may sit.
  seatButton(dan, 3, "Join");
  await w.run(STEP * 2);
  assert.equal(seat(w, ann, 3).ownerName, "Dan");
  assert.deepEqual(w.problems(), []);
});

test("the referee leaves mid-hand: the next referee finishes the round, draws the unknown hole card anew, and the new segment checks out", async () => {
  const w = newWorld(15);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  await w.settle();
  assert.equal(referee(w), ann);
  // Bob takes the table, so the referee is not the table owner.
  press(bob, "takeOwnership");
  await w.run(STEP * 2);
  assert.equal(ctrl(w, cat).tableOwnerName, "Bob");
  await seatPlayers(w, [
    [ann, 0],
    [bob, 1],
    [cat, 2],
  ]);
  await startRound(w, bob);
  await untilPhase(w, bob, "turns");
  await w.run(STEP);
  const before = tableText(w, bob);
  assert.equal(dealer(w, bob).cards[0], HIDDEN);
  w.leave(ann);
  await until(w, () => w.clients.some((c) => w.instance(c).networking.IsReferee), 20000, "a new referee");
  await w.run(STEP * 2);
  const ref = referee(w);
  assert.notEqual(ref, ann);
  assert.equal(seat(w, bob, 0).IsActive, false, "the old referee's seat is freed");
  assert.equal(ctrl(w, cat).phase, "turns", "the round goes on (the table owner is still here)");
  assert.equal(ctrl(w, cat).tableOwnerName, "Bob");
  assert.ok(before.length > 0);
  await playRound(w, [
    [bob, 1],
    [cat, 2],
  ]);
  assertAgree(w);
  for (const c of [bob, cat]) {
    assert.equal(dealer(w, c).holeRedrawn, true, "the hole card the old referee knew is never used");
    assert.equal(dealer(w, c).holeVerified, true);
    assert.ok(deck(w, c).segment >= 2, "a new segment with a new committed seed");
    assert.ok(deck(w, c).lostSegments >= 1, "the old segment is marked as not checkable");
    assert.deepEqual(deck(w, c).verified, { ok: true, status: "checked", reason: "" }, "the new segment replays");
    assert.notEqual(seat(w, c, 1).result[0], RESULT_NONE);
    assert.deepEqual(seat(w, c, 0).result, [RESULT_NONE, RESULT_NONE]);
  }
  assert.deepEqual(w.problems(), []);
});

test("the referee who is also the table owner leaves: the table resets and every seat is freed (F73, Q12)", async () => {
  const w = newWorld(16);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  await w.settle();
  await seatPlayers(w, [
    [bob, 1],
    [cat, 2],
  ]);
  await startRound(w, ann);
  await untilPhase(w, ann, "turns");
  w.leave(ann);
  await until(w, () => ctrl(w, bob).phase === "idle", 30000, "the reset");
  await w.run(STEP);
  assertAgree(w);
  const owner = ctrl(w, cat).tableOwnerName;
  assert.ok(owner === "Bob" || owner === "Cat", "the new referee's player owns the table");
  for (const c of [bob, cat]) {
    assert.equal(ctrl(w, c).GameActive, false);
    for (let i = 0; i < 7; i++) assert.equal(seat(w, c, i).IsActive, false, `${c.name}: seat ${i} is free`);
    assert.equal(dealer(w, c).cards.length, 0);
  }
  // The table works again.
  await seatPlayers(w, [[cat, 3]]);
  const newOwner = owner === "Bob" ? bob : cat;
  await startRound(w, newOwner);
  await playRound(w, [[cat, 3]]);
  assert.notEqual(seat(w, bob, 3).result[0], RESULT_NONE);
  assert.deepEqual(w.problems(), []);
});
