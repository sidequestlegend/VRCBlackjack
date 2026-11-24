// The credits panel: an addition of the Altspace port (no upstream file). A small button at the back of the table
// opens the licence notices (VRCBlackjack's Apache-2.0 notice and change notice, the credited table art and sounds,
// the CC0 cards, the OFL fonts); a click on the panel closes it. Each viewer opens it for themselves: nothing is shared.

import { Behaviour, type GameObject } from "../portkit/src/index.ts";

export class CreditsPanel extends Behaviour {
  panel!: GameObject;
  private open = false;

  override Start(): void {
    this.panel.SetActive(false);
  }

  override Interact(): void {
    this.Toggle();
  }

  Toggle(): void {
    this.open = !this.open;
    this.panel.SetActive(this.open);
  }

  get IsOpen(): boolean {
    return this.open;
  }
}
