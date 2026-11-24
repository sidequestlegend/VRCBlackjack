// Translated from Scripts/Dealer.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Upstream the table owner's client drew the dealer's cards, announced each (the hole card included) to everyone by
// event name, and synced the full total after every card, so any client could read the hole card (Q13). Here:
//   - `cards[0]` is HIDDEN (-1) until the flip; the referee keeps the hole card on its own client with a commitment,
//     published as `holeHash`, and publishes the opening with the card at the flip;
//   - `TotalDeckValue` counts the face-up cards only until the flip;
//   - DealerPlay's chain of delayed self-calls (`:61-94`) is a step the Controller runs against the shared clock, so a
//     new referee carries on from state.
// A referee that took over before the flip does not know the hole card: it draws a new one at the flip from a
// deal of its own (`holeRedrawn`), so nobody ever learns the discarded card.

import { Behaviour, type DeserializationResult, type Opening } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";
import { HIDDEN, type DeckManager } from "./DeckManager.ts";
import type { DealerUIController } from "./DealerUIController.ts";
import { MAX_CARDS, ScoreCards } from "./PlayerDeck.ts";

/** DealerPlay's test (Dealer.cs:75): the dealer draws while not bust and under 17, so it stands on every 17, soft 17 included. */
export function DealerShouldDraw(total: number, isBust: boolean): boolean {
  return !isBust && total < 17;
}

export class Dealer extends Behaviour {
  static override synced = ["cards", "TotalDeckValue", "IsBust", "flipped", "holeHash", "holeOpening", "holeRedrawn"];

  /** Added: card types by position; position 0 is the hole card, HIDDEN until the flip. */
  cards: number[] = [];
  /** [UdonSynced] upstream. Face-up cards only until the flip. */
  TotalDeckValue = 0;
  IsBust = false;
  /** Added: the hole card has been turned. */
  flipped = false;
  /** Added: commitment to the hole card, published when it is dealt. */
  holeHash = "";
  /** Added: its opening, published at the flip. */
  holeOpening: Opening | null = null;
  /** Added: the referee changed before the flip and the hole card was drawn anew. */
  holeRedrawn = false;

  // From bindings.json.
  GameController!: Controller;
  Deck!: DeckManager;
  DealerUI!: DealerUIController;

  /** This client's check of the hole card against its commitment (null before the flip). */
  holeVerified: boolean | null = null;

  /** Upstream GetDeckValue: the total this client knows. */
  GetDeckValue(): number {
    return this.TotalDeckValue;
  }

  get NextDeckPosition(): number {
    return this.cards.length;
  }

  override OnDeserialization(result: DeserializationResult): void {
    this.CheckHole();
    this.GameController?.Redraw(result.isSnapshot);
  }

  /** Every client: at the flip, the card shown must be the one committed to at the deal. */
  CheckHole(): void {
    if (!this.flipped || !this.holeOpening || this.holeVerified !== null) return;
    const ok = this.Secrets.verify(this.holeHash, this.holeOpening) && this.Secrets.valueOf<number>(this.holeOpening) === this.cards[0];
    this.holeVerified = ok;
    if (!ok) this.Debug.LogError("the dealer's hole card does not match its commitment");
  }

  /** Referee: StartMatch and StartMatchSecondCard. The first card is the hole card. */
  SummonCard(onTable: readonly number[]): void {
    if (this.NextDeckPosition > MAX_CARDS - 1) return;
    const hole = this.cards.length === 0;
    const card = this.Deck.NextCard(onTable, hole);
    if (card < 0) return; // "No free cards left!"
    if (hole) {
      this.cards.push(HIDDEN);
      this.holeHash = this.Deck.HiddenHash();
    } else this.cards.push(card);
    this.Recount();
  }

  /** Referee: GlobalFlip. Turns the hole card, or draws it anew if this referee never knew it. */
  Flip(onTable: readonly number[]): void {
    if (this.flipped) return;
    this.flipped = true;
    if (this.cards.length === 0 || this.cards[0] !== HIDDEN) {
      this.Recount();
      return;
    }
    const known = this.Deck.RevealHidden();
    if (known) {
      this.cards[0] = known.card;
      this.holeOpening = known.opening;
    } else {
      const card = this.Deck.NextCard(onTable);
      if (card < 0) {
        this.cards.splice(0, 1);
      } else {
        // Committed and opened in the same write: the card did not exist before this moment.
        const commitment = this.Secrets.commit(card);
        this.cards[0] = card;
        this.holeHash = commitment.hash;
        this.holeOpening = commitment.reveal();
        this.holeRedrawn = true;
      }
    }
    this.Recount();
    this.holeVerified = null;
    this.CheckHole();
  }

  /** Referee: the total of what is face up (everything after the flip). */
  Recount(): void {
    const hand = ScoreCards(this.cards);
    this.TotalDeckValue = hand.localDeckValue;
    this.IsBust = hand.IsBust;
  }

  /** Referee: ResetEverything (Dealer.cs:939-977), without the card objects. */
  ResetEverything(): void {
    this.cards = [];
    this.TotalDeckValue = 0;
    this.IsBust = false;
    this.flipped = false;
    this.holeHash = "";
    this.holeOpening = null;
    this.holeRedrawn = false;
    this.holeVerified = null;
  }
}
