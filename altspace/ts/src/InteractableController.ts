// Translated from Scripts/InteractableController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022
// CentauriCore, Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// The single place that says which of a seat's buttons are live (InteractableController.cs:84-93). Upstream also
// switches the touch boxes off while the local player is outside the seat's capsule; here that is the table's range
// (DistanceOptimizer), since the boxes are clicked, not touched.

import { Behaviour } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";
import type { Interactable } from "./Interactable.ts";
import type { Player } from "./Player.ts";

export class InteractableController extends Behaviour {
  // From bindings.json.
  Controller!: Controller;
  /** Upstream field `Player`; renamed because Behaviour.Player is the runtime's per-player accessor. */
  Seat!: Player;
  JoinGame: Interactable | null = null;
  Stand: Interactable | null = null;
  Split: Interactable | null = null;
  HitSplit: Interactable | null = null;
  HitNormal: Interactable | null = null;
  LeaveGame: Interactable | null = null;
  Add10: Interactable | null = null;
  Add5: Interactable | null = null;
  Remove10: Interactable | null = null;
  Remove5: Interactable | null = null;

  override Update(): void {
    this.Refresh();
  }

  Refresh(): void {
    const player = this.Seat;
    const controller = this.Controller ?? player?.BlackjackController;
    if (!player || !controller) return;
    const set = (button: Interactable | null, active: boolean) => {
      if (button) button.Active = player.Running && active;
    };
    const isOwner = player.isOwner;
    const gameActive = controller.localGameActive;
    const usingChips = controller.UsingChips;
    set(this.JoinGame, !isOwner && !gameActive);
    set(this.Stand, isOwner && gameActive && player.myTurn);
    // The chip check joins CanSplit on the holder's client (Q6).
    set(this.Split, isOwner && gameActive && player.myTurn && player.CanSplit && player.SplitAffordable());
    set(this.HitSplit, isOwner && gameActive && player.myTurn && player.HasSplit);
    set(this.HitNormal, isOwner && gameActive && player.myTurn);
    set(this.LeaveGame, isOwner);
    set(this.Add10, isOwner && !gameActive && usingChips);
    set(this.Add5, isOwner && !gameActive && usingChips);
    set(this.Remove10, isOwner && !gameActive && usingChips);
    set(this.Remove5, isOwner && !gameActive && usingChips);
  }
}
