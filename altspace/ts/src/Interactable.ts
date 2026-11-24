// Translated from Scripts/Interactable.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// One of a seat's ten buttons. Upstream presses it when a VR fingertip enters its box (PostLateUpdate, bone
// positions, a haptic tick). The page has no fingertip position and ticks at 20 Hz, so here the same box is pressed
// by a click (VR laser or desktop mouse) on layer 5 (L5 in PORT.md). What a press does is unchanged: when the
// button is live, send its event to the seat and play its press animation.

import { Behaviour, type AnimatorRef } from "../portkit/src/index.ts";

export class Interactable extends Behaviour {
  /** Set by InteractableController: the button may be pressed now. */
  Active = false;

  // From bindings.json.
  Event = "";
  TargetBehaviour: Behaviour | null = null;
  PressName = "Press";
  PressViz: AnimatorRef | null = null;

  override Interact(): void {
    if (!this.Active || !this.TargetBehaviour) return;
    this.TargetBehaviour.SendCustomEvent(this.Event);
    this.PressViz?.SetTrigger(this.PressName);
  }
}
