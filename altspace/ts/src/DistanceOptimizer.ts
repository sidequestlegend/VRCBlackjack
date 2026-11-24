// Translated from Scripts/DistanceOptimizer.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// The table's UI, sounds and buttons are live only for a player within `range` metres (default 5, the trigger
// sphere's radius) of the middle seat's standing place; walking out releases any seat the player holds (F69, F70).
// Upstream uses a trigger sphere; here the local head's distance (C10). While the page does not know where the head
// or the table is (no pose reported yet), the table counts as in range.

import { Behaviour, Vector3, type GameObject } from "../portkit/src/index.ts";
import type { AudioController } from "./AudioController.ts";
import type { Controller } from "./Controller.ts";
import type { DealerUIController } from "./DealerUIController.ts";
import type { Player } from "./Player.ts";

export class DistanceOptimizer extends Behaviour {
  // From bindings.json.
  GameController!: Controller;
  AudioController!: AudioController;
  Players: Player[] = [];
  DealerUI!: DealerUIController;
  TurnOff: Array<GameObject | null> = [];

  private inRange: boolean | null = null;

  /** The radius, from the snippet's `range` attribute. */
  get Radius(): number {
    const value = Number(this.Settings.get("range"));
    return Number.isFinite(value) && value > 0 ? value : 5;
  }

  override Start(): void {
    this.SendCustomEventDelayedFrames("DelayedStart", 20);
  }

  DelayedStart(): void {
    this.Set(this.IsInRange());
  }

  override Update(): void {
    if (this.inRange === null || this.Time.frameCount % 5 !== 0) return;
    const now = this.IsInRange();
    if (now === this.inRange) return;
    if (!now) {
      // OnPlayerTriggerExit (DistanceOptimizer.cs:94-111): seats the local player holds are released.
      for (const player of this.GameController.Players) if (player.isOwner) player.ReleaseControl();
    }
    this.Set(now);
  }

  IsInRange(): boolean {
    const head = this.Input.Position;
    const centre = this.transform.known ? this.transform.position : null;
    if (!head || !centre) return true;
    return Vector3.Distance(head, centre) <= this.Radius;
  }

  private Set(on: boolean): void {
    this.inRange = on;
    for (const item of this.TurnOff) item?.SetActive(on);
    this.AudioController.isActive = on;
    for (const player of this.Players) player.isRunningProperty = on;
    this.DealerUI.Running = on;
  }
}
