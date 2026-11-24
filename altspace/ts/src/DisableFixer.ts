// Translated from Scripts/DisableFixer.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Upstream: when the table object is disabled, the local player's seats are stood and released, and a table owner
// resets the table. A snippet has no switch for that; the nearest thing is its element leaving the page, which ends
// the instance (OnDestroy). The local player then leaves the instance as far as everyone else is concerned, and the
// referee does the rest (frees the seats, stands a hand mid-turn, replaces a table owner and resets the table). The
// requests below are sent as upstream sends them; they may not get out before the instance is gone (L7).

import { Behaviour } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";
import type { Player } from "./Player.ts";

export class DisableFixer extends Behaviour {
  // From bindings.json.
  Players: Player[] = [];
  Controller!: Controller;

  override OnDestroy(): void {
    for (const player of this.Players) {
      if (player.isOwner) player.ReleaseControl();
    }
  }
}
