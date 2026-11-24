// Test helpers: players at a blackjack table in the fake room, pressing the kit's buttons the way a player does
// (a click on the button's box), and reading the table back from each player's copy.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import { TestWorld } from "../portkit/src/testing.ts";
import type { Controller } from "../src/Controller.ts";
import type { Dealer } from "../src/Dealer.ts";
import type { DealerUIController } from "../src/DealerUIController.ts";
import type { DeckManager } from "../src/DeckManager.ts";
import game from "../src/index.ts";
import type { Player } from "../src/Player.ts";
import type { PlayerDeck } from "../src/PlayerDeck.ts";

export const bindings = JSON.parse(readFileSync(fileURLToPath(new URL("../bindings.json", import.meta.url)), "utf8"));
export const SLUG = game.slug;
export { game };

/** About a round trip through the fake room, its write batching and a command's acknowledgement, with room to spare. */
export const STEP = 1500;

export function newWorld(seed = 1): TestWorld {
  return new TestWorld(game, bindings, { seed });
}

export const ctrl = (w: TestWorld, c: FakeClient, inst = "0") => w.behaviour<Controller>(c, "ctrl", inst);
export const seat = (w: TestWorld, c: FakeClient, i: number, inst = "0") => w.behaviour<Player>(c, `p${i}`, inst);
export const hand = (w: TestWorld, c: FakeClient, i: number, split = false, inst = "0") => w.behaviour<PlayerDeck>(c, `p${i}${split ? "s" : "n"}`, inst);
export const dealer = (w: TestWorld, c: FakeClient, inst = "0") => w.behaviour<Dealer>(c, "dealer", inst);
export const deck = (w: TestWorld, c: FakeClient, inst = "0") => w.behaviour<DeckManager>(c, "deck", inst);
export const dealerUI = (w: TestWorld, c: FakeClient, inst = "0") => w.behaviour<DealerUIController>(c, "dealerUI", inst);

/** Clicks a kit object by its bindings key; fails the test when the object is not clickable. */
export function press(c: FakeClient, key: string, inst = "0"): void {
  assert.ok(c.click(SLUG, inst, key), `${c.name}: ${key} is not clickable`);
}

/** A seat's button (its touch box, clicked): Join, Leave, Stand, Split, HitNormal, HitSplit, Add10, Add5, Remove10, Remove5. */
export function seatButton(c: FakeClient, i: number, button: string, inst = "0"): void {
  press(c, `p${i}_b${button}`, inst);
}

/** The client that is referee. */
export function referee(w: TestWorld, inst = "0"): FakeClient {
  const found = w.clients.find((c) => w.started(c, inst) && w.instance(c, inst).networking.IsReferee);
  assert.ok(found, "nobody is referee");
  return found;
}

/** Runs until the round reaches `phase` (or fails after `maxMs`). */
export async function until(w: TestWorld, what: () => boolean, maxMs = 60000, label = "condition"): Promise<void> {
  const ok = await w.room.runUntil(what, maxMs);
  assert.ok(ok, `timed out waiting for ${label}`);
}

export async function untilPhase(w: TestWorld, c: FakeClient, phase: string, inst = "0", maxMs = 90000): Promise<void> {
  await until(w, () => ctrl(w, c, inst).phase === phase, maxMs, `phase ${phase} on ${c.name}`);
}

/** Every client's view of the table as text: equal views mean equal tables. */
export function tableText(w: TestWorld, c: FakeClient, inst = "0"): string {
  const k = ctrl(w, c, inst);
  const seats = k.Players.map((p) => `${p.IsActive ? p.ownerName : "-"}:${p.NormalDeck.cards.join(",")}|${p.SplitDeck.cards.join(",")}=${p.NormalDeck.TotalDeckValue}/${p.SplitDeck.TotalDeckValue} r${p.result.join("")}`);
  return `${k.phase} round ${k.round} dealer ${dealer(w, c, inst).cards.join(",")}=${dealer(w, c, inst).TotalDeckValue} | ${seats.join(" | ")}`;
}

export function assertAgree(w: TestWorld, inst = "0"): void {
  assert.ok(w.agree(inst), `digests differ: ${w.digests(inst).join(" ")}`);
  const texts = w.clients.filter((c) => w.started(c, inst)).map((c) => tableText(w, c, inst));
  for (const t of texts) assert.equal(t, texts[0]);
}

/** A table with players seated by clicking Join, ready to start (run long enough for every command to land). */
export async function seatPlayers(w: TestWorld, who: Array<[FakeClient, number]>, inst = "0"): Promise<void> {
  for (const [c, i] of who) seatButton(c, i, "Join", inst);
  await w.run(STEP * 2);
  for (const [c, i] of who) assert.equal(seat(w, c, i, inst).ownerName, c.name, `${c.name} holds seat ${i}`);
}

/** The table owner presses Start Game. */
export async function startRound(w: TestWorld, owner: FakeClient, inst = "0"): Promise<number> {
  const before = ctrl(w, owner, inst).round;
  press(owner, "startGame", inst);
  const everyone = () => w.clients.filter((c) => w.started(c, inst));
  await until(w, () => everyone().every((c) => ctrl(w, c, inst).round === before + 1), 10000, "every client to see the round start");
  return before + 1;
}

/** Plays every seat the same simple way: hit below `standOn`, then stand. Returns when the round has settled. */
export async function playRound(w: TestWorld, players: Array<[FakeClient, number]>, standOn = 15, inst = "0"): Promise<void> {
  const owner = w.clients.find((c) => ctrl(w, c, inst).IsTableOwner(c.sid))!;
  await untilPhase(w, owner, "turns", inst);
  await w.run(STEP);
  for (let guard = 0; guard < 40 && ctrl(w, owner, inst).phase === "turns"; guard++) {
    for (const [c, i] of players) {
      const p = seat(w, c, i, inst);
      if (!p.myTurn) continue;
      if (p.HasSplit && !p.SplitDeck.IsBust && p.SplitDeck.TotalDeckValue < standOn && p.SplitDeck.cards.length >= 2) seatButton(c, i, "HitSplit", inst);
      else if (!p.NormalDeck.IsBust && p.NormalDeck.TotalDeckValue < standOn) seatButton(c, i, "HitNormal", inst);
      else seatButton(c, i, "Stand", inst);
    }
    await w.run(STEP);
  }
  await untilPhase(w, owner, "settled", inst);
  await w.run(STEP);
}
