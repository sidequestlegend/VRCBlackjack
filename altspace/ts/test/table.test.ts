// Rung 1, the table's own rules: table owner, reset, the turn timer, manual dealing, and what the game costs the
// room.

import assert from "node:assert/strict";
import { test } from "node:test";
import { leafBudget } from "../portkit/src/index.ts";
import type { AudioController } from "../src/AudioController.ts";
import { ENDED_STAND, ENDED_TIMEOUT, RESULT_NONE } from "../src/Player.ts";
import {
  assertAgree,
  ctrl,
  game,
  hand,
  newWorld,
  press,
  referee,
  seat,
  seatButton,
  seatPlayers,
  SLUG,
  startRound,
  STEP,
  until,
  untilPhase,
} from "./helpers.ts";

test("the table owner leaves: the referee's player takes the table, which resets; bets at the table go to 0 (F6, F73)", async () => {
  const w = newWorld(31);
  const chips = { chips: "true" };
  const ann = w.join({ name: "Ann", elements: [chips] });
  const bob = w.join({ name: "Bob", elements: [chips] });
  const cat = w.join({ name: "Cat", elements: [chips] });
  await w.settle();
  press(bob, "takeOwnership");
  await w.run(STEP * 2);
  assert.equal(ctrl(w, ann).tableOwnerName, "Bob");
  await seatPlayers(w, [
    [ann, 0],
    [cat, 4],
  ]);
  seatButton(cat, 4, "Add10");
  await w.run(STEP);
  assert.equal(ctrl(w, cat).ChipController.GetBet(), 10);
  await startRound(w, bob);
  await untilPhase(w, ann, "turns");
  w.leave(bob);
  await until(w, () => ctrl(w, cat).tableOwnerName === "Ann" && ctrl(w, cat).phase === "idle", 30000, "Ann to own a reset table");
  await w.run(STEP);
  assertAgree(w);
  for (const c of [ann, cat]) for (let i = 0; i < 7; i++) assert.equal(seat(w, c, i).IsActive, false, "Q12: every seat is freed");
  assert.equal(ctrl(w, cat).ChipController.GetBet(), 0, "Cat's bet at this table went to 0");
  assert.equal(ctrl(w, cat).ChipController.CurrentChipCount, 100, "an aborted round moves no chips");
  assert.deepEqual(w.problems(), []);
});

test("Reset Table frees every seat, whoever holds it (Q12), at most once per 2 s", async () => {
  const w = newWorld(32);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  await w.settle();
  await seatPlayers(w, [
    [ann, 0],
    [bob, 1],
    [bob, 2],
  ]);
  await startRound(w, ann);
  await untilPhase(w, bob, "turns");
  const resets = ctrl(w, ann).resets;
  press(ann, "resetTable");
  press(ann, "resetTable");
  await w.run(STEP * 2);
  assert.equal(ctrl(w, bob).resets, resets + 1, "one reset, not two");
  assert.equal(ctrl(w, bob).phase, "idle");
  for (const i of [0, 1, 2]) {
    assert.equal(seat(w, bob, i).IsActive, false, `seat ${i} is free`);
    assert.equal(hand(w, bob, i).cards.length, 0);
  }
  // Bob can sit again at once: nothing is left stuck (upstream left other players' seats taken).
  await seatPlayers(w, [[bob, 1]]);
  // LEAVE GAME (F15) frees it again, and the seat can be taken again once 2 s have passed (F13).
  seatButton(bob, 1, "Leave");
  await w.run(STEP);
  assert.equal(seat(w, ann, 1).IsActive, false);
  await w.run(1000);
  seatButton(bob, 1, "Join");
  await w.run(STEP * 2);
  assert.equal(seat(w, ann, 1).IsActive, true, "after the 2 s the seat can be taken again");
  assertAgree(w);
  assert.deepEqual(w.problems(), []);
});

test("the turn timer: nobody acts, every turn ends at the deadline on every client, and the dealer plays", async () => {
  const w = newWorld(33);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  await w.settle();
  await seatPlayers(w, [
    [ann, 0],
    [bob, 3],
  ]);
  await startRound(w, ann);
  await untilPhase(w, ann, "turns");
  const opened = w.room.now;
  await w.run(25000);
  assert.equal(ctrl(w, bob).phase, "turns", "still running after 25 s");
  assert.match(bob.graph(SLUG).text.get("p3_timer") ?? "", /^[0-9]$/, "Bob's timer counts down");
  await untilPhase(w, ann, "settled", "0", 30000);
  const took = (w.room.now - opened) / 1000;
  assert.ok(took >= 30 && took < 40, `settled ${took.toFixed(1)} s after the turns opened`);
  await w.run(STEP);
  for (const c of [ann, bob]) {
    for (const i of [0, 3]) {
      const p = seat(w, c, i);
      if (!p.NormalDeck.IsBust && p.NormalDeck.TotalDeckValue !== 21) assert.equal(p.endedBy, ENDED_TIMEOUT, `${c.name}: seat ${i} timed out (Q8: everyone sees it)`);
      assert.notEqual(p.result[0], RESULT_NONE);
    }
  }
  assertAgree(w);
});

test("manual dealing: a player's HIT raises a mark; the table owner deals and stands players from the dealer's panel", async () => {
  const w = newWorld(34);
  const ann = w.join({ name: "Ann", elements: [{ manual: "true" }] });
  const bob = w.join({ name: "Bob", elements: [{ manual: "true" }] });
  await w.settle();
  await w.run(STEP);
  assert.equal(ctrl(w, bob).ManualPlay, true);
  await seatPlayers(w, [[bob, 3]]);
  await startRound(w, ann);
  await untilPhase(w, bob, "turns");
  await w.run(STEP);
  const cards = hand(w, bob, 3).cards.length;
  seatButton(bob, 3, "HitNormal");
  await w.run(STEP);
  assert.equal(seat(w, ann, 3).wantNormal, true, "the mark is up for the dealer (F45)");
  assert.equal(hand(w, ann, 3).cards.length, cards, "no card without the dealer");
  assert.ok(w.behaviour<AudioController>(ann, "audio").played.includes("DealerWantToHit"), "the dealer hears the bleep");
  assert.equal(ann.graph(SLUG).anim.get("p3_dealerCanvas")?.WantToHitNormal, "1");
  // Bob cannot use the dealer's buttons.
  press(bob, "p3_dHitNormal");
  await w.run(STEP);
  assert.equal(hand(w, ann, 3).cards.length, cards);
  press(ann, "p3_dHitNormal");
  await w.run(STEP);
  if (!hand(w, ann, 3).IsBust) {
    assert.equal(hand(w, bob, 3).cards.length, cards + 1, "the dealer dealt (F47)");
    assert.equal(seat(w, bob, 3).wantNormal, false);
    press(ann, "p3_dStand");
    await w.run(STEP);
    assert.equal(seat(w, bob, 3).HasFinishedTurn, true);
    assert.equal(seat(w, bob, 3).endedBy, ENDED_STAND);
  }
  await untilPhase(w, ann, "settled");
  await w.run(STEP);
  assertAgree(w);
  assert.deepEqual(w.problems(), []);
});

test("what one table costs the room: one sync group, a few leaves, small writes, under the rate limit", async () => {
  const w = newWorld(35);
  const budget = leafBudget(w.bindings, (type) => {
    const cls = game.behaviours[type];
    return cls ? { synced: (cls.synced ?? []).length, perPlayer: cls.perPlayer === true } : null;
  });
  assert.equal(budget.slots, 1, "all synced behaviours share the group 'table'");
  assert.equal(budget.spaceLeaves, 5);
  assert.ok(budget.userLeavesPerPlayer <= 6);

  const writes: number[] = [];
  const room = w.room as unknown as Record<string, (...args: unknown[]) => unknown>;
  const original = room.serverStateBatch!.bind(w.room);
  room.serverStateBatch = (...args: unknown[]) => {
    writes.push(w.room.now);
    return original(...args);
  };
  const players = Array.from({ length: 7 }, (_, i) => w.join({ name: `P${i}` }));
  await w.settle();
  await seatPlayers(
    w,
    players.map((c, i) => [c, i]),
  );
  await startRound(w, players[0]!);
  await untilPhase(w, players[0]!, "turns");
  for (const [i, c] of players.entries()) seatButton(c, i, "HitNormal");
  await w.run(STEP);
  for (const [i, c] of players.entries()) seatButton(c, i, "Stand");
  await untilPhase(w, players[0]!, "settled");
  await w.run(STEP);
  const values = w.room.stateKeys("pk1.blackjack.0.").map((key) => JSON.stringify(w.room.stateSnapshot()[key] ?? "").length);
  const largest = Math.max(...values);
  assert.ok(largest < 8000, `largest leaf ${largest} bytes (limit 16,384)`);
  console.log(`budget: largest leaf ${largest} bytes`);
  // The referee's writes in any one second, against the room's 20 per second.
  const ref = referee(w);
  assert.ok(ref);
  let peak = 0;
  for (const t of writes) peak = Math.max(peak, writes.filter((u) => u >= t && u < t + 1000).length);
  assert.ok(peak <= 20, `${peak} state batches in one second`);
  console.log(`budget: peak ${peak} state batches in one second (all clients)`);
  assertAgree(w);
  assert.deepEqual(w.problems(), []);
});

test("walking out of range releases the player's seat (F70)", async () => {
  const w = newWorld(36);
  const ann = w.join({ name: "Ann", elements: [{ range: "5" }] });
  const bob = w.join({ name: "Bob", elements: [{ range: "5" }] });
  await w.settle();
  await seatPlayers(w, [[bob, 2]]);
  const { Vector3 } = await import("../portkit/src/index.ts");
  bob.pose(new Vector3(0, 1.6, 1));
  await w.run(STEP);
  assert.equal(seat(w, ann, 2).ownerName, "Bob", "near the table: still seated");
  bob.pose(new Vector3(0, 1.6, 40));
  await until(w, () => !seat(w, ann, 2).IsActive, 10000, "the seat to be released");
  assert.equal(w.behaviour<AudioController>(bob, "audio").isActive, false, "out of range, the table is silent for Bob");
});
