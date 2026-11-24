// The game's definition: the slug and the classes bindings.json names by `type`. The build reads the default export.
//
// A port of Centauri2442/VRCBlackjack (Apache License 2.0, Copyright 2022 CentauriCore); see notice.ts.

import type { GameDefinition, GameInstance } from "../portkit/src/index.ts";
import { AudioController } from "./AudioController.ts";
import { BlackjackWorldController } from "./BlackjackWorldController.ts";
import { ChipController } from "./ChipController.ts";
import { Controller } from "./Controller.ts";
import { CreditsPanel } from "./CreditsPanel.ts";
import { Dealer } from "./Dealer.ts";
import { DealerUIController } from "./DealerUIController.ts";
import { DeckManager } from "./DeckManager.ts";
import { DisableFixer } from "./DisableFixer.ts";
import { DistanceOptimizer } from "./DistanceOptimizer.ts";
import { Interactable } from "./Interactable.ts";
import { InteractableController } from "./InteractableController.ts";
import { Player } from "./Player.ts";
import { PlayerDeck } from "./PlayerDeck.ts";
import { PlayerUIController } from "./PlayerUIController.ts";

const game: GameDefinition = {
  slug: "blackjack",
  behaviours: {
    AudioController,
    BlackjackWorldController,
    ChipController,
    Controller,
    CreditsPanel,
    Dealer,
    DealerUIController,
    DeckManager,
    DisableFixer,
    DistanceOptimizer,
    Interactable,
    InteractableController,
    Player,
    PlayerDeck,
    PlayerUIController,
  },
  debug: (instance: GameInstance) => debugHooks(instance),
};

/** Readers for Play-mode tests (window.__pk1.debug["blackjack:<inst>"]): the table as this page holds it. */
function debugHooks(instance: GameInstance): Record<string, unknown> {
  const ctrl = () => instance.behaviour<Controller>(instance.bindings.behaviours.find((b) => b.type === "Controller")!.id);
  return {
    pathOf: (key: string) => instance.bindings.objects[key]?.path ?? "",
    me: () => ({ sid: instance.networking.LocalPlayer.sid, uid: instance.networking.LocalPlayer.uid, name: instance.networking.LocalPlayer.displayName }),
    table: () => {
      const c = ctrl();
      const d = c.Dealer;
      return {
        phase: c.phase,
        round: c.round,
        owner: c.tableOwnerName,
        usingChips: c.UsingChips,
        dealer: d.cards.slice(),
        dealerTotal: d.TotalDeckValue,
        flipped: d.flipped,
        holeVerified: d.holeVerified,
        dealVerified: c.Deck.verified,
        dealLabel: c.Deck.dealLabel,
        unfairDeals: c.Deck.unfairDeals,
        dealCheck: c.Deck.CheckText(),
        dealStatus: c.Deck.verified?.status ?? "",
        chips: c.ChipController.CurrentChipCount,
        bet: c.ChipController.GetBet(),
        seats: c.Players.map((p) => ({
          active: p.IsActive,
          name: p.ownerName,
          sid: p.ownerSid,
          mine: p.isOwner,
          myTurn: p.myTurn,
          finished: p.HasFinishedTurn,
          normal: p.NormalDeck.cards.slice(),
          split: p.SplitDeck.cards.slice(),
          normalTotal: p.NormalDeck.TotalDeckValue,
          bust: p.NormalDeck.IsBust,
          canSplit: p.CanSplit,
          result: p.result.slice(),
        })),
      };
    },
    /** The dealer's synced fields as this page holds them (for the hole-card check). */
    dealer: () => {
      const d = ctrl().Dealer;
      return { cards: d.cards.slice(), total: d.TotalDeckValue, flipped: d.flipped, holeHash: d.holeHash, holeOpening: d.holeOpening, holeRedrawn: d.holeRedrawn };
    },
    /** What dealer slot k and seat i's slot k show on this page (a card, -1 the back, -3 off). */
    dealerShowing: (k: number) => c0(() => ctrl().DealerUI.Showing(k)),
    seatShowing: (i: number, k: number) => c0(() => ctrl().Players[i]!.NormalDeck.Showing(k)),
  };
}

function c0(f: () => number): number {
  try {
    return f();
  } catch {
    return -9;
  }
}

export default game;
