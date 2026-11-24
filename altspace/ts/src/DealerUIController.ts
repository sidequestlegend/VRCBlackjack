// Translated from Scripts/DealerUIController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// The dealer's side: the automatic and manual canvases, the settings toggles, the deck count, the dealer's total
// after the round, the table's Bust banner, and (added here) the dealer's card slots. Upstream sets 49 objects
// active every frame; here only changes are sent. The chips and helpers toggles follow the synced values (C18, Q15)
// instead of being swapped by the button press, and the height slider is two buttons (C12).

import { Behaviour, type AnimatorRef, type GameObject, type RendererRef, type TextRef } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";
import type { Dealer } from "./Dealer.ts";
import { HIDDEN } from "./DeckManager.ts";
import { MAX_CARDS, SLOT_OFF } from "./PlayerDeck.ts";

export class DealerUIController extends Behaviour {
  Running = true;

  // From bindings.json.
  BlackjackController!: Controller;
  DealerController!: Dealer;
  AutoCanvas: GameObject | null = null;
  AutoCanvasAnimator: AnimatorRef | null = null;
  OwnerUI: GameObject | null = null;
  ManualOwnerUI: GameObject | null = null;
  ManualOwnerSettings: GameObject | null = null;
  ManualNotOwnerUI: GameObject | null = null;
  OwnerSlider: GameObject | null = null;
  UIHeightAnimator: AnimatorRef | null = null;
  DeckCount: TextRef | null = null;
  DeckCountManual: TextRef | null = null;
  NotOwnerUI: GameObject | null = null;
  TableUIAnimator: AnimatorRef | null = null;
  ChipToggle: GameObject | null = null;
  ChipOn: GameObject | null = null;
  ChipOff: GameObject | null = null;
  DeckChanger: GameObject | null = null;
  DeckSubtractArrow: GameObject | null = null;
  HelpersChanger: GameObject | null = null;
  HelpersOn: GameObject | null = null;
  HelpersOff: GameObject | null = null;
  ChipToggleManual: GameObject | null = null;
  ChipOnManual: GameObject | null = null;
  ChipOffManual: GameObject | null = null;
  DeckChangerManual: GameObject | null = null;
  DeckSubtractArrowManual: GameObject | null = null;
  HelpersChangerManual: GameObject | null = null;
  HelpersOnManual: GameObject | null = null;
  HelpersOffManual: GameObject | null = null;
  DealerValuesCanvas: GameObject | null = null;
  DealerValues: TextRef | null = null;
  /** Added: the dealer's 11 card slots (upstream: Dealer.DeckPositions with instantiated cards). */
  Slots: Array<GameObject | null> = [];
  SlotRenderers: Array<RendererRef | null> = [];
  SlotAnimators: Array<AnimatorRef | null> = [];

  private readonly actives = new Map<GameObject, boolean>();
  private shown: number[] = [];
  private seen = { round: -1, resets: -1, bust: false };

  private SetActive(obj: GameObject | null, on: boolean): void {
    if (!obj || this.actives.get(obj) === on) return;
    this.actives.set(obj, on);
    obj.SetActive(on);
  }

  /** What dealer slot k shows on this client: a card type, HIDDEN (the back), or SLOT_OFF. For tests. */
  Showing(k: number): number {
    return this.shown[k] ?? SLOT_OFF;
  }

  /** Upstream Update (DealerUIController.cs:131-237). */
  override Update(): void {
    const ctrl = this.BlackjackController;
    if (!ctrl) return;
    const panels = [this.ManualOwnerUI, this.OwnerSlider, this.DeckSubtractArrow, this.DeckSubtractArrowManual, this.NotOwnerUI, this.ManualNotOwnerUI, this.ManualOwnerSettings, this.DealerValuesCanvas];
    if (!this.Running) {
      for (const panel of panels) this.SetActive(panel, false);
      return;
    }
    const isOwner = ctrl.IsTableOwner(ctrl.LocalSid());
    const gameState = ctrl.localGameActive;
    const manual = ctrl.ManualPlay;
    this.SetActive(this.ManualOwnerUI, isOwner && manual && !gameState);
    this.SetActive(this.OwnerSlider, isOwner && manual && gameState);
    const decks = ctrl.Deck.NumberOfDecks;
    this.SetActive(this.DeckSubtractArrow, decks > 2);
    this.SetActive(this.DeckSubtractArrowManual, decks > 2);
    this.SetActive(this.NotOwnerUI, !isOwner && !gameState);
    this.SetActive(this.ManualNotOwnerUI, !isOwner && !gameState && manual);
    if (this.DeckCount) this.DeckCount.text = String(decks);
    if (this.DeckCountManual) this.DeckCountManual.text = String(decks);
    this.SetActive(this.ManualOwnerSettings, isOwner && manual && !gameState);

    const dealerVal = this.DealerController.GetDeckValue();
    this.SetActive(this.DealerValuesCanvas, !gameState && dealerVal > 0);
    if (this.DealerValues) this.DealerValues.text = String(dealerVal);

    this.AutoCanvasAnimator?.SetBool("Active", !manual);
    this.SetActive(this.AutoCanvas, !manual || isOwner);
    this.SetActive(this.OwnerUI, isOwner && !manual && !gameState);

    // C18: the toggles follow the synced values. A toggle object is the button that switches the setting the other
    // way, so "Use Chips Off" shows while chips are on (upstream's ChipOn field points at it).
    const change = ctrl.CanChangeSettings;
    for (const [toggle, on, off] of [
      [this.ChipToggle, this.ChipOn, this.ChipOff],
      [this.ChipToggleManual, this.ChipOnManual, this.ChipOffManual],
    ] as const) {
      this.SetActive(toggle, change);
      this.SetActive(on, ctrl.UsingChips);
      this.SetActive(off, !ctrl.UsingChips);
    }
    for (const [toggle, on, off] of [
      [this.HelpersChanger, this.HelpersOn, this.HelpersOff],
      [this.HelpersChangerManual, this.HelpersOnManual, this.HelpersOffManual],
    ] as const) {
      this.SetActive(toggle, change);
      this.SetActive(on, ctrl.HelpersEnabled);
      this.SetActive(off, !ctrl.HelpersEnabled);
    }
    this.SetActive(this.DeckChanger, change);
    this.SetActive(this.DeckChangerManual, change);
  }

  /** Called by Controller.Redraw: the dealer's cards, the flip, and the table banner, from state. */
  Apply(instant: boolean): void {
    const ctrl = this.BlackjackController;
    const dealer = this.DealerController;
    const audio = ctrl.AudioController;
    if (ctrl.round !== this.seen.round || ctrl.resets !== this.seen.resets) {
      if (!instant && this.seen.round !== -1) this.ResetTableUI();
      this.seen = { round: ctrl.round, resets: ctrl.resets, bust: false };
    }
    for (let k = 0; k < MAX_CARDS; k++) {
      const card = k < dealer.cards.length ? dealer.cards[k]! : SLOT_OFF;
      const was = this.shown[k] ?? SLOT_OFF;
      if (was === card) continue;
      this.shown[k] = card;
      const slot = this.Slots[k] ?? null;
      if (card === SLOT_OFF) {
        this.SetActive(slot, false);
        continue;
      }
      this.SetActive(slot, true);
      if (card === HIDDEN) {
        // The hole card: the back only, and no face is ever sent for it (the face is blanked, so a slot used for a
        // face-up card last round does not keep that face underneath).
        this.SlotRenderers[k]?.SetFloat("_CardIndex", -1);
        if (!instant) audio.PlayDrawCard();
        continue;
      }
      this.SlotRenderers[k]?.SetFloat("_CardIndex", card);
      if (was === HIDDEN) {
        // GlobalFlip (Dealer.cs:96-99); C19: everyone in range hears it, not only the table owner.
        this.SlotAnimators[k]?.SetTrigger("Flip");
        if (!instant) audio.PlayFlipCard();
      } else {
        this.SlotAnimators[k]?.SetTrigger("NotHidden");
        if (!instant) audio.PlayDrawCard();
      }
    }
    if (dealer.IsBust && !this.seen.bust) {
      this.seen.bust = true;
      this.Bust();
    }
  }

  /** The dealer-height slider's value (C12: set by two buttons on the table owner's client). */
  SetHeight(value: number): void {
    this.UIHeightAnimator?.SetFloat("Height", Math.min(0.99, value));
  }

  ResetTableUI(): void {
    this.TableUIAnimator?.SetTrigger("Reset");
  }

  Bust(): void {
    this.TableUIAnimator?.ResetTrigger("Reset");
    this.TableUIAnimator?.SetTrigger("Bust");
  }
}
