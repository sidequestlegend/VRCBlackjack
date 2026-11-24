// Rung 1, who may know and do what: the hole card stays unreadable until the flip, a bystander cannot act for a
// seat, and two tables in one room stay apart.

import assert from "node:assert/strict";
import { test } from "node:test";
import { CardValue, HIDDEN } from "../src/DeckManager.ts";
import { RESULT_NONE } from "../src/Player.ts";
import {
  assertAgree,
  ctrl,
  dealer,
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
  until,
  untilPhase,
} from "./helpers.ts";

test("the hole card is unreadable to every client, the referee's page included, until the flip", async () => {
  const w = newWorld(21);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  await w.settle();
  // Everything that reaches the room: state writes (public and protected), user-state writes and one-shots.
  const wire: string[] = [];
  const room = w.room as unknown as Record<string, (...args: unknown[]) => unknown>;
  for (const name of ["serverStateBatch", "serverUserSet", "serverOneShot"]) {
    const original = room[name]!.bind(w.room);
    room[name] = (...args: unknown[]) => {
      wire.push(JSON.stringify(args.slice(1, 3)));
      return original(...args);
    };
  }
  await seatPlayers(w, [
    [bob, 1],
    [cat, 2],
  ]);
  await startRound(w, ann);
  await untilPhase(w, ann, "turns");
  await w.run(STEP);

  const ref = referee(w);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const secret = (deck(w, ref) as any).secret as { label: string; hidden: { k: number; card: number; commitment: { reveal(): { s: string } } } };
  assert.ok(secret && secret.hidden, "the referee holds the hole card privately");
  const holeNonce = secret.hidden.commitment.reveal().s;
  // the referee's own seed of the dealt draw, held by its runtime until the round ends
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dealSeed = (w.instance(ref).secrets as any).dealSeed as { label: string; seed: string };
  assert.equal(dealSeed.label, secret.label, "the round's cards come from a dealt draw");
  for (const needle of [dealSeed.seed, holeNonce]) {
    assert.ok(!wire.some((text) => text.includes(needle)), "neither the referee's seed nor the hole card's opening has gone out");
  }
  // the seated players contributed: the deal is not the referee's alone
  for (const c of [bob, cat]) {
    const contribution = w.room.userStateOf(c.sid);
    assert.ok(JSON.stringify(contribution).includes(secret.label), `${c.name}'s runtime contributed to the deal`);
  }
  const hole = { k: secret.hidden.k, card: secret.hidden.card }; // the flip clears secret.hidden
  for (const c of w.clients) {
    const d = dealer(w, c);
    assert.equal(d.cards.length, 2);
    assert.equal(d.cards[0], HIDDEN, `${c.name}: the hole card is face down in state`);
    assert.equal(d.TotalDeckValue, CardValue(d.cards[1]!), `${c.name}: the dealer's total counts the up card only`);
    assert.equal(d.holeOpening, null);
    assert.ok(d.holeHash.length > 0, "the hole card is committed to");
    assert.equal(deck(w, c).drawLog[hole.k], HIDDEN);
    assert.equal(deck(w, c).dealRevealed, false);
    const sent = c.graph(SLUG).floats.get("d0f/_CardIndex");
    assert.ok(sent === undefined || sent === "-1", `${c.name}'s page never sent the hole card's face (the slot's face is blank: ${sent})`);
  }
  // The room's whole state, as anyone can read it, holds the commitment and not the card.
  const everything = JSON.stringify(w.room.stateSnapshot()) + JSON.stringify(w.clients.map((c) => w.room.userStateOf(c.sid)));
  assert.ok(everything.includes(dealer(w, ann).holeHash));
  assert.ok(!everything.includes(holeNonce) && !everything.includes(dealSeed.seed));

  for (const [c, i] of [
    [bob, 1],
    [cat, 2],
  ] as const)
    seatButton(c, i, "Stand");
  await until(w, () => w.clients.every((c) => dealer(w, c).flipped), 30000, "the flip");
  await w.run(STEP);
  for (const c of w.clients) {
    assert.equal(dealer(w, c).cards[0], hole.card, `${c.name} sees the committed card at the flip`);
    assert.equal(dealer(w, c).holeVerified, true, `${c.name} checked it against the commitment`);
    assert.equal(c.graph(SLUG).floats.get("d0f/_CardIndex"), String(hole.card));
  }
  await untilPhase(w, ann, "settled");
  await w.run(STEP);
  for (const c of w.clients) assert.deepEqual(deck(w, c).verified, { ok: true, status: "checked", reason: "" });
  assertAgree(w);
  assert.deepEqual(w.problems(), []);
});

test("a bystander cannot act for a seat, even from a modified client", async () => {
  const w = newWorld(22);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  await w.settle();
  await seatPlayers(w, [[ann, 0]]);
  await startRound(w, ann);
  await untilPhase(w, bob, "turns");
  await w.run(STEP);
  const snapshot = () => JSON.stringify([seat(w, ann, 0).IsActive, seat(w, ann, 0).ownerName, seat(w, ann, 0).HasFinishedTurn, hand(w, ann, 0).cards, ctrl(w, ann).phase, ctrl(w, ann).round, ctrl(w, ann).tableOwnerName]);
  const before = snapshot();

  // The seat's buttons are not live for Bob: clicking them sends nothing.
  for (const b of ["Stand", "HitNormal", "Split", "Leave"]) seatButton(bob, 0, b);
  await w.run(STEP);
  assert.equal(snapshot(), before);

  // A modified client sends the commands anyway: the referee checks who sent them.
  const p = seat(w, bob, 0);
  for (const name of ["Stand", "AutoNormalHitMe", "AutoSplitHitMe", "Split", "ReleaseControl", "TakeControl", "ManualNormalHitMe", "ManualSplitHitMe"]) p.SendCommand(name);
  const k = ctrl(w, bob);
  for (const name of ["GlobalStartMatch", "ForceGlobalReset", "TakeOwnership", "ToggleManualPlay", "ActivateHelpers"]) k.SendCommand(name);
  // ... and as network events to everyone.
  p.SendCustomNetworkEvent("All", "Stand");
  p.SendCustomNetworkEvent("All", "ReleaseControl");
  k.SendCustomNetworkEvent("All", "ForceGlobalReset");
  await w.run(STEP * 4);
  assert.equal(snapshot(), before, "nothing changed");
  assert.ok(w.instance(ann).commands.run >= 13, "the referee did run (and refuse) Bob's commands");
  assertAgree(w);

  // Ann herself can.
  seatButton(ann, 0, "Stand");
  await untilPhase(w, ann, "settled");
  await w.run(STEP);
  assert.notEqual(seat(w, bob, 0).result[0], RESULT_NONE);
  assert.deepEqual(w.problems(), []);
});

test("two tables in one room stay separate; one chip balance serves both on a page", async () => {
  const w = newWorld(23);
  const tables = [
    { room: "north", chips: "true" },
    { room: "south", chips: "true" },
  ];
  const ann = w.join({ name: "Ann", elements: tables });
  const bob = w.join({ name: "Bob", elements: tables });
  await w.settle("north");
  await w.settle("south");
  await seatPlayers(w, [[ann, 0], [bob, 1]], "north");
  await seatPlayers(w, [[ann, 0]], "south");
  // One balance per page across tables (upstream: one per world): 100 chips, 60 on north, so only 40 more on south.
  for (let k = 0; k < 6; k++) seatButton(ann, 0, "Add10", "north");
  await w.run(STEP);
  for (let k = 0; k < 6; k++) seatButton(ann, 0, "Add10", "south");
  await w.run(STEP);
  assert.equal(ctrl(w, ann, "north").ChipController.GetBet(), 60);
  assert.equal(ctrl(w, ann, "south").ChipController.GetBet(), 40, "the bets on both tables stay within the chips (F21)");
  assert.equal(ctrl(w, ann, "north").ChipController.Bank, ctrl(w, ann, "south").ChipController.Bank);
  assert.notEqual(ctrl(w, ann, "north").ChipController.Bank, ctrl(w, bob, "north").ChipController.Bank, "each player has their own chips");

  await startRound(w, ann, "north");
  await playRound(w, [[ann, 0], [bob, 1]], 15, "north");
  for (const c of [ann, bob]) {
    assert.equal(ctrl(w, c, "north").phase, "settled");
    assert.equal(ctrl(w, c, "south").phase, "idle", "south did not move");
    assert.equal(ctrl(w, c, "south").round, 0);
    assert.equal(dealer(w, c, "south").cards.length, 0);
    assert.equal(seat(w, c, 1, "south").IsActive, false, "Bob's north seat is not a south seat");
    assert.equal(seat(w, c, 0, "south").ownerName, "Ann");
  }
  assertAgree(w, "north");
  assertAgree(w, "south");
  assert.notEqual(w.digests("north")[0], w.digests("south")[0]);
  assert.equal(ctrl(w, ann, "north").ChipController.GetBet(), 0, "north's bet settled and reset");
  assert.equal(ctrl(w, ann, "south").ChipController.GetBet(), 40, "south's bet untouched");
  const north = w.room.stateKeys("pk1.blackjack.north.");
  const south = w.room.stateKeys("pk1.blackjack.south.");
  assert.ok(north.length > 0 && south.length > 0);
  assert.ok(!north.some((key) => south.includes(key)));
  // Each kit has its own holder; the relay never crosses (the fake graph reports payloads it could not place).
  assert.ok(ann.graph(SLUG, "north").payloads.length > 0);
  assert.ok(ann.graph(SLUG, "south").payloads.every((p) => p.startsWith("blackjack:south|")));
  assert.deepEqual(w.problems(), []);
});

test("Start Game and the table's settings are the table owner's alone, and only between rounds", async () => {
  const w = newWorld(24);
  const settings = { "allow-change": "true", chips: "true" };
  const ann = w.join({ name: "Ann", elements: [settings] });
  const bob = w.join({ name: "Bob", elements: [settings] });
  await w.settle();
  await seatPlayers(w, [[bob, 2]]);
  press(bob, "startGame");
  press(bob, "deckAdd");
  press(bob, "helpersOnBtn");
  press(bob, "swapToManual");
  press(bob, "resetTable");
  await w.run(STEP * 3);
  assert.equal(ctrl(w, ann).GameActive, false, "Bob cannot start");
  assert.equal(deck(w, ann).NumberOfDecks, 2);
  assert.equal(ctrl(w, ann).HelpersEnabled, false);
  assert.equal(ctrl(w, ann).ManualPlay, false);
  assert.equal(seat(w, ann, 2).ownerName, "Bob", "Bob cannot reset the table");
  press(ann, "deckAdd");
  await w.run(STEP);
  press(ann, "deckAdd");
  await w.run(STEP);
  press(ann, "deckSub");
  press(ann, "helpersOnBtn");
  press(ann, "chipsOffBtn");
  await w.run(STEP * 2);
  assert.equal(deck(w, bob).NumberOfDecks, 3);
  assert.equal(ctrl(w, bob).HelpersEnabled, true);
  assert.equal(ctrl(w, bob).UsingChips, false);
  // The toggles show the button that switches back, from state (C18).
  assert.equal(bob.graph(SLUG).active.get("helpersOffBtn"), true);
  assert.equal(bob.graph(SLUG).active.get("helpersOnBtn"), false);
  for (let k = 0; k < 4; k++) {
    press(ann, "deckSub");
    await w.run(STEP);
  }
  assert.equal(deck(w, bob).NumberOfDecks, 2, "never below 2 (F8)");
  await startRound(w, ann);
  press(ann, "deckAdd");
  press(ann, "swapToManual");
  await w.run(STEP * 2);
  assert.equal(deck(w, bob).NumberOfDecks, 2, "no changes during a round");
  assert.equal(ctrl(w, bob).ManualPlay, false);
  assert.deepEqual(w.problems(), []);
});

test("without allow-change, even the table owner cannot change chips, helpers or decks (F7)", async () => {
  const w = newWorld(25);
  const ann = w.join({ name: "Ann", elements: [{ decks: "4" }] });
  await w.settle();
  await w.run(STEP);
  assert.equal(deck(w, ann).NumberOfDecks, 4, "the decks attribute");
  press(ann, "deckAdd");
  press(ann, "helpersOnBtn");
  press(ann, "chipsOnBtn");
  await w.run(STEP * 3);
  assert.equal(deck(w, ann).NumberOfDecks, 4);
  assert.equal(ctrl(w, ann).HelpersEnabled, false);
  assert.equal(ctrl(w, ann).UsingChips, false);
  press(ann, "swapToManual");
  await w.run(STEP);
  assert.equal(ctrl(w, ann).ManualPlay, true, "manual play needs no allow-change (Controller.cs:47-51)");
});

test("the deal: every seated player contributes; one whose runtime never answers cannot hang the table", async () => {
  const w = newWorld(27);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  await w.settle();
  await seatPlayers(w, [
    [bob, 1],
    [cat, 2],
  ]);
  // Cat's page withholds its contribution (a modified client): its runtime never answers a deal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (w.instance(cat).secrets as any).reviewDeal = () => {};
  await startRound(w, ann);
  await w.run(5000);
  assert.equal(ctrl(w, ann).phase, "dealing", "no card is dealt while a listed contribution is missing");
  assert.equal(seat(w, ann, 1).NormalDeck.cards.length, 0);
  await untilPhase(w, ann, "turns", "0", 30000);
  for (const c of w.clients) assert.equal(deck(w, c).unfairDeals, 1, `${c.name} sees the deal begun again without contributions`);
  await playRound(w, [
    [bob, 1],
    [cat, 2],
  ]);
  // The fallback deal is the referee's alone (a modified referee could do the same at once and pick its seed): it
  // never verifies, and every player is shown that the round could not be checked.
  for (const c of [ann, bob]) {
    assert.equal(deck(w, c).verified?.status, "unverifiable", `${c.name} cannot check the fallback deal`);
    assert.match(deck(w, c).CheckText(), /^Deal NOT checkable/, `${c.name} is shown it`);
    assert.match(c.graph(SLUG).text.get("dealCheckText") ?? "", /^Deal NOT checkable/, `${c.name}'s table shows it`);
  }
  assert.ok(ann.logged("warn").some((line) => line.includes("contribution never came")), "the referee logs the fallback");
});

test("a referee that changes a hand (not the drawLog) is caught by every other client after the round", async () => {
  const w = newWorld(31);
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
  await w.run(STEP);
  assert.equal(referee(w), ann);
  // Ann's page is modified: it gives Bob a different second card. Its own drawLog stays as the deal gave it.
  const log = deck(w, ann).drawLog.slice();
  const h = hand(w, ann, 1);
  const was = h.cards[1]!;
  h.cards[1] = (was + 4) % 52;
  h.Recount();
  ctrl(w, ann).Changed();
  await w.run(STEP);
  assert.equal(hand(w, bob, 1).cards[1], (was + 4) % 52, "everyone holds the changed hand");
  assert.deepEqual(deck(w, bob).drawLog, log, "the log of draws is untouched");
  seatButton(bob, 1, "Stand");
  seatButton(cat, 2, "Stand");
  await untilPhase(w, ann, "settled");
  await until(w, () => [bob, cat].every((c) => deck(w, c).verified !== null), 10000, "the checks");
  await w.run(STEP);
  for (const c of [bob, cat]) {
    const v = deck(w, c).verified!;
    assert.equal(v.status, "mismatch", `${c.name} catches the changed hand`);
    assert.match(v.reason, /seat 2's hand/);
    assert.match(c.graph(SLUG).text.get("dealCheckText") ?? "", /^DEAL CHECK FAILED/, `${c.name}'s table shows it`);
    assert.equal(c.graph(SLUG).active.get("dealCheck"), true, `${c.name}: the line's backing is on`);
  }
  assert.ok(w.problems().some((line) => line.startsWith("Bob:") && line.includes("do not match")));
});

test("a referee that lists other contributors than the seated players is caught", async () => {
  const w = newWorld(32);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  const cat = w.join({ name: "Cat" });
  const dan = w.join({ name: "Dan" });
  await w.settle();
  await seatPlayers(w, [
    [bob, 1],
    [cat, 2],
  ]);
  const k = ctrl(w, ann);
  for (const [lists, what] of [
    [[dan.sid], "an accomplice who is not seated"],
    [[bob.sid], "one seated player left out"],
  ] as const) {
    // Ann's page is modified: the deal's contributors are its choice (with an accomplice it could steer the deal).
    k.RoundSids = () => lists.slice();
    await startRound(w, ann);
    await w.run(STEP);
    assert.deepEqual(w.instance(bob).secrets.dealContributors(deck(w, bob).dealLabel), lists.slice(), "the list went out as the referee chose");
    await playRound(w, [
      [bob, 1],
      [cat, 2],
    ]);
    await until(w, () => [bob, cat, dan].every((c) => deck(w, c).verified !== null), 10000, "the checks");
    for (const c of [bob, cat, dan]) {
      const v = deck(w, c).verified!;
      assert.equal(v.status, "mismatch", `${c.name} catches ${what}`);
      assert.match(v.reason, /contributors are not the players seated/);
    }
  }
});

test("a deal of the referee alone is shown as not checkable; the check replays with the round's own deck count (finding 6)", async () => {
  const w = newWorld(33);
  const ann = w.join({ name: "Ann" });
  const bob = w.join({ name: "Bob" });
  await w.settle();
  await seatPlayers(w, [[ann, 0]]);
  await startRound(w, ann);
  await w.run(STEP);
  assert.match(deck(w, bob).CheckText(), /dealer's page's alone/, "shown during the round");
  await playRound(w, [[ann, 0]]);
  await until(w, () => deck(w, bob).verified !== null, 10000, "Bob's check");
  assert.equal(deck(w, bob).verified!.status, "unverifiable", "the only player was the referee");
  assert.match(deck(w, bob).verified!.reason, /only player/);

  // With another seated player the round checks; a deck count changed afterwards does not change the replay.
  await seatPlayers(w, [[bob, 1]]);
  await startRound(w, ann);
  await playRound(w, [
    [ann, 0],
    [bob, 1],
  ]);
  await until(w, () => deck(w, bob).verified !== null, 10000, "Bob's check");
  assert.equal(deck(w, bob).verified!.status, "checked");
  const d = deck(w, bob);
  d.NumberOfDecks = 0; // any count other than the round's: a late check after the owner changed it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (d as any).checked = "";
  d.CheckReveal();
  assert.equal(d.verified!.status, "checked", "the replay uses the deck count recorded with the segment");
});

test("a page that arrives after a contributor left cannot check that deal and says so; the others check it", async () => {
  const w = newWorld(34);
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
  await w.run(STEP);
  w.leave(cat); // Cat's contribution was revealed and used; Cat's user state goes with Cat
  await w.run(STEP);
  const dan = w.join({ name: "Dan" });
  await w.settle();
  await w.run(STEP);
  await playRound(w, [[bob, 1]]);
  await until(w, () => [ann, bob, dan].every((c) => deck(w, c).verified !== null), 10000, "the checks");
  for (const c of [ann, bob]) assert.equal(deck(w, c).verified!.status, "checked", `${c.name} saw Cat's contribution and checks the deal`);
  assert.equal(deck(w, dan).verified!.status, "unverifiable", "Dan never saw Cat's contribution");
  assert.match(deck(w, dan).verified!.reason, /left before this page arrived/);
  assert.deepEqual(w.problems(), []);
});
