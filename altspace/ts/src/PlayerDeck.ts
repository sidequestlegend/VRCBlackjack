// Translated from Scripts/PlayerDeck.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// One hand of one seat (each seat has a normal hand and a split hand). Upstream the holder's client drew its own
// cards and announced each through one of 583 generated events (`NetworkSpawnCard{c}DeckPos{p}`), keeping the total
// in a local copy. Here the referee appends cards to `cards` and writes the total; every client draws the hand from
// that array, so a late joiner sees the same hand. The generated handlers are gone.

import { Behaviour, type AnimatorRef, type DeserializationResult, type GameObject, type RendererRef, type TextRef } from "../portkit/src/index.ts";
import { CardValue } from "./DeckManager.ts";
import type { Player } from "./Player.ts";

/** A hand's arithmetic as upstream keeps it: the total, how many aces still count 11, and whether it is bust. */
export interface HandMath {
  localDeckValue: number;
  NumOfAces: number;
  IsBust: boolean;
}

export function NewHand(): HandMath {
  return { localDeckValue: 0, NumOfAces: 0, IsBust: false };
}

/**
 * AddCardValue (PlayerDeck.cs:150-197; the dealer's copy is Dealer.cs:196-231): an arriving ace counts 11 if the
 * total is below 11, else 1; when the total passes 21 and an 11-ace is held, 10 comes off; over 21 with none: bust.
 * Returns true when this card made the hand bust.
 */
export function AddCardValue(hand: HandMath, value: number): boolean {
  if (value !== 11) hand.localDeckValue += value;
  else if (hand.localDeckValue >= 11) hand.localDeckValue += 1;
  else {
    hand.localDeckValue += 11;
    hand.NumOfAces++;
  }
  if (hand.localDeckValue > 21 && hand.NumOfAces > 0) {
    hand.localDeckValue -= 10;
    hand.NumOfAces--;
  } else if (hand.localDeckValue > 21) {
    hand.IsBust = true;
    return true;
  }
  return false;
}

/** The arithmetic of a hand holding these card values, added in order (how the port always computes a total). */
export function ScoreValues(values: readonly number[]): HandMath {
  const hand = NewHand();
  for (const v of values) AddCardValue(hand, v);
  return hand;
}

/** A hand's arithmetic from card types; face-down cards (negative) are left out. */
export function ScoreCards(cards: readonly number[]): HandMath {
  return ScoreValues(cards.filter((c) => c >= 0).map(CardValue));
}

/** A card slot with nothing in it. */
export const SLOT_OFF = -3;

/** Upstream deals at most 11 cards to a hand (11 card positions; `NextDeckPosition > 10` refuses). */
export const MAX_CARDS = 11;

export class PlayerDeck extends Behaviour {
  static override synced = ["cards", "TotalDeckValue", "IsBust", "NumOfAces"];

  /** Added: the card types in this hand, in deal order (upstream: card objects under the 11 positions). */
  cards: number[] = [];
  /** [UdonSynced] upstream. */
  TotalDeckValue = 0;
  IsBust = false;
  NumOfAces = 0;

  // From bindings.json.
  PlayerController!: Player;
  isSplitDeck = false;
  /** The 11 card slots of this hand (upstream: DeckPositions with an instantiated card prefab under each). */
  Slots: Array<GameObject | null> = [];
  SlotRenderers: Array<RendererRef | null> = [];
  SlotAnimators: Array<AnimatorRef | null> = [];
  /** The hand's total on the dealer's per-seat panel. */
  DealerValueDisplay: TextRef | null = null;

  /** What each slot shows on this client (-3: off). */
  private shown: number[] = [];

  /** Upstream's name for the total, kept for translated code that reads it. */
  get localDeckValue(): number {
    return this.TotalDeckValue;
  }

  /** Upstream's NextDeckPosition: where the next card goes. */
  get NextDeckPosition(): number {
    return this.cards.length;
  }

  /** The card value at each position (upstream DeckValue[]). */
  get DeckValue(): number[] {
    return this.cards.map(CardValue);
  }

  override OnDeserialization(result: DeserializationResult): void {
    this.PlayerController?.BlackjackController?.Redraw(result.isSnapshot);
  }

  /**
   * Every client: SpawnCard's visible part (PlayerDeck.cs:71-115) for the whole hand. A slot that changes is
   * switched on, given its face (the kit's card material reads `_CardIndex`) and its zoom-in; the hand's total goes
   * on the dealer's panel. Sounds are the seat's business (one per new card, Q17).
   */
  Show(_instant: boolean): void {
    for (let k = 0; k < MAX_CARDS; k++) {
      const card = k < this.cards.length ? this.cards[k]! : SLOT_OFF;
      if (this.shown[k] === card) continue;
      this.shown[k] = card;
      const slot = this.Slots[k] ?? null;
      if (card === SLOT_OFF) {
        slot?.SetActive(false);
        continue;
      }
      slot?.SetActive(true);
      this.SlotRenderers[k]?.SetFloat("_CardIndex", card);
      this.SlotAnimators[k]?.SetTrigger("NotHidden");
    }
    if (this.DealerValueDisplay) this.DealerValueDisplay.text = String(this.TotalDeckValue);
  }

  /** What slot k shows on this client: a card type, or SLOT_OFF. For tests. */
  Showing(k: number): number {
    return this.shown[k] ?? SLOT_OFF;
  }

  /**
   * Referee: SpawnCard plus AddCardValue for a card the referee drew. Returns true when it made the hand bust.
   * The total is the whole hand scored again, so it cannot go stale (see Q4 in PORT.md).
   */
  AddCard(card: number): boolean {
    const wasBust = this.IsBust;
    this.cards.push(card);
    this.Recount();
    return this.IsBust && !wasBust;
  }

  /** Referee: the hand's total, aces and bust flag from its cards. */
  Recount(): void {
    const hand = ScoreCards(this.cards);
    this.TotalDeckValue = hand.localDeckValue;
    this.NumOfAces = hand.NumOfAces;
    this.IsBust = hand.IsBust;
  }

  /** Referee: PlayerDeck.Reset (PlayerDeck.cs:896-933) without the card objects, which the drawing follows. */
  Reset(): void {
    this.cards = [];
    this.TotalDeckValue = 0;
    this.NumOfAces = 0;
    this.IsBust = false;
  }
}
