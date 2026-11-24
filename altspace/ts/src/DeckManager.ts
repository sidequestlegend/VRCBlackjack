// Translated from Scripts/DeckManager.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Upstream keeps per-client counts of each card type, reset at every round start and lowered by 1,166 generated
// network events. Here the referee is the only one who draws, the counts follow from the cards on the table, and
// the "random" start index of every draw comes from a seed the referee committed to when the round began
// (Draw from the runtime). After the round the seed is published and every client replays the round's draws.
//
// The probe that turns a start index into a card (GetUnusedCardIndex) is upstream's, unchanged, and so is the
// fact that every draw is a fresh pick over card types (no shoe order).

import { Behaviour, Draw, type Commitment, type DeserializationResult, type Opening } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";

export const CARD_TYPES = 52;

// The order of DeckManager.CardReferences in the table prefab (B.prefab:8064): 2, 3, ... 10, Jack, King, Queen, Ace;
// each rank as clubs, diamonds, hearts, spades, except the aces: diamonds, clubs, hearts, spades.
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "King", "Queen", "Ace"];
const SUITS = ["Clubs", "Diamonds", "Hearts", "Spades"];
const ACE_SUITS = ["Diamonds", "Clubs", "Hearts", "Spades"];

/** The value upstream reads from the card prefab's name, "[v] ...": 2 to 10, 10 for faces, 11 for an ace. */
export function CardValue(type: number): number {
  const rank = Math.floor(type / 4);
  if (rank <= 8) return rank + 2;
  return rank <= 11 ? 10 : 11;
}

export function CardName(type: number): string {
  if (type < 0 || type >= CARD_TYPES) return "?";
  const rank = Math.floor(type / 4);
  return `${RANKS[rank]} of ${(rank === 12 ? ACE_SUITS : SUITS)[type % 4]}`;
}

/**
 * DeckManager.InitializeDeck (DeckManager.cs:72-87): each card type gets NumberOfDecks copies.
 * `literal`: upstream gives index 0 a count of 999 (written for a 53-entry list whose entry 0 was an empty card; the
 * prefab's list has 52 entries, so the two of clubs never runs out, Q1). The port gives it NumberOfDecks.
 */
export function InitializeCounts(numberOfDecks: number, literal = false): number[] {
  const counts: number[] = new Array<number>(CARD_TYPES);
  for (let i = 0; i < counts.length; i++) counts[i] = i === 0 && literal ? 999 : numberOfDecks;
  return counts;
}

/**
 * GetUnusedCardIndex (PlayerDeck.cs:199-261, the same text at Dealer.cs:233-295), with the start index passed in
 * instead of `Random.Range(0, 52)`: the type at the start index if any copy is left, else the next higher type that
 * has one, wrapping once; -1 when none is left.
 */
export function GetUnusedCardIndex(NumOfEachCardLeft: readonly number[], startIndex: number): number {
  const length = NumOfEachCardLeft.length;
  let unusedCard = -1;
  let index = startIndex;
  if (NumOfEachCardLeft[index]! > 0) {
    unusedCard = index;
  } else {
    while (index < length - 1) {
      if (NumOfEachCardLeft[index]! < 1) index++;
      else return index;
    }
    if (index >= length - 1) {
      if (NumOfEachCardLeft[index]! < 1) index = 0;
      else return index;
    }
    while (index < startIndex) {
      if (NumOfEachCardLeft[index]! < 1) index++;
      else return index;
    }
    if (index === startIndex) return -1;
  }
  return unusedCard;
}

/** AddDeck (DeckManager.cs:53-57): no upper limit. */
export function AddDeckCount(numberOfDecks: number): number {
  return numberOfDecks + 1;
}

/** SubtractDeck (DeckManager.cs:59-70): never below 2. */
export function SubtractDeckCount(numberOfDecks: number): number {
  return numberOfDecks <= 2 ? 2 : numberOfDecks - 1;
}

/** drawLog entry for a draw that found no card left (upstream: "No free cards left!", nothing dealt). */
export const NO_CARD = -2;
/** drawLog entry for the hole card while it is face down. */
export const HIDDEN = -1;

/** The outcome of replaying a round's draws against the published seed. */
export interface Verification {
  ok: boolean;
  reason: string;
}

/** Checks a segment of draws: the seed matches its commitment and every logged card is what the seed gives. */
export function ReplaySegment(seed: string, numberOfDecks: number, baseCards: readonly number[], drawLog: readonly number[]): Verification {
  const counts = InitializeCounts(numberOfDecks);
  for (const c of baseCards) if (c >= 0) counts[c]!--;
  const draw = new Draw(seed);
  for (let k = 0; k < drawLog.length; k++) {
    const expected = GetUnusedCardIndex(counts, draw.Int(CARD_TYPES, k));
    const logged = drawLog[k]!;
    if (logged === HIDDEN) return { ok: false, reason: `draw ${k} was never turned face up` };
    if ((logged === NO_CARD ? -1 : logged) !== expected) return { ok: false, reason: `draw ${k} is ${logged}, the seed gives ${expected}` };
    if (expected >= 0) counts[expected]!--;
  }
  return { ok: true, reason: "" };
}

interface SegmentSecret {
  round: number;
  segment: number;
  seed: string;
  commitment: Commitment;
  /** The hole card while it is face down: its draw number, the card, and the commitment published for it. */
  hidden: { k: number; card: number; commitment: Commitment } | null;
}

export class DeckManager extends Behaviour {
  static override synced = ["NumberOfDecks", "round", "segment", "seedHash", "seedOpening", "drawLog", "baseCards", "lostSegments"];

  /** [UdonSynced] upstream. Copies of each card type per round, at least 2. */
  NumberOfDecks = 2;
  /** Added: the round these draws belong to. */
  round = 0;
  /** Added: 1 for the round's first referee; a new referee mid-round starts the next one with a new seed. */
  segment = 0;
  /** Added: the commitment to this segment's seed (Secrets.commit). */
  seedHash = "";
  /** Added: the seed and its nonce, published when the round ends. Null until then. */
  seedOpening: Opening | null = null;
  /** Added: every card this segment drew, in order (HIDDEN for the hole card while face down, NO_CARD for none). */
  drawLog: number[] = [];
  /** Added: the cards already on the table when this segment began. */
  baseCards: number[] = [];
  /** Added: segments of this round whose seed was lost with their referee (they cannot be checked). */
  lostSegments = 0;

  // From bindings.json.
  BlackjackController!: Controller;

  /** This client's check of the last published seed: null before one was published. */
  verified: Verification | null = null;
  /** Upstream's per-client counts, kept for the deck-count display and tests. Derived, never synced. */
  NumOfEachCardLeft: number[] = InitializeCounts(2);

  private secret: SegmentSecret | null = null;
  private checked = "";

  override OnDeserialization(result: DeserializationResult): void {
    this.CheckReveal();
    this.BlackjackController?.Redraw(result.isSnapshot);
  }

  /** Upstream InitializeDeck: the counts as a client sees them (the hole card is not counted until it is face up). */
  InitializeDeck(): void {
    this.NumOfEachCardLeft = InitializeCounts(this.NumberOfDecks);
    for (const c of this.baseCards) if (c >= 0) this.NumOfEachCardLeft[c]!--;
    for (const c of this.drawLog) if (c >= 0) this.NumOfEachCardLeft[c]!--;
  }

  // ---- buttons (table owner, between rounds, when settings may change) ---------------------------------------

  AddDeck(): void {
    if (!this.Networking.CallingSession) {
      this.BlackjackController.AudioController.PlayUIInteract();
      this.SendCommand("AddDeck");
      return;
    }
    const caller = this.Networking.IsReferee ? this.Networking.CallingSession : null;
    if (!caller || !this.BlackjackController.MayChangeSettings(caller.sid)) return;
    this.NumberOfDecks = AddDeckCount(this.NumberOfDecks);
    this.BlackjackController.Changed();
  }

  SubtractDeck(): void {
    if (!this.Networking.CallingSession) {
      this.BlackjackController.AudioController.PlayUIInteract();
      this.SendCommand("SubtractDeck");
      return;
    }
    const caller = this.Networking.IsReferee ? this.Networking.CallingSession : null;
    if (!caller || !this.BlackjackController.MayChangeSettings(caller.sid)) return;
    this.NumberOfDecks = SubtractDeckCount(this.NumberOfDecks);
    this.BlackjackController.Changed();
  }

  // ---- the referee's draws ------------------------------------------------------------------------------------

  /** Referee: a new round. The first segment is opened by the first draw. */
  StartRound(): void {
    this.round++;
    this.segment = 0;
    this.seedHash = "";
    this.seedOpening = null;
    this.drawLog = [];
    this.baseCards = [];
    this.lostSegments = 0;
    this.secret = null;
    this.verified = null;
  }

  /** Referee: clears everything (a table reset). */
  Clear(): void {
    this.StartRound();
    this.round--;
  }

  /** True when this client holds the seed of the segment in state. */
  private HoldsSegment(): boolean {
    const s = this.secret;
    return s !== null && s.round === this.round && s.segment === this.segment && s.commitment.hash === this.seedHash;
  }

  /**
   * Referee: makes sure this client can draw. A referee that took over mid-round does not know the old seed, so it
   * opens a new segment with a seed of its own, counting from the cards on the table (`onTable`).
   */
  EnsureSegment(onTable: readonly number[]): void {
    if (this.HoldsSegment()) return;
    if (this.segment > 0 && this.seedHash !== "") this.lostSegments++;
    this.segment++;
    this.baseCards = onTable.filter((c) => c >= 0);
    this.drawLog = [];
    // A seed of 32 random bytes: the runtime's commitment nonces come from crypto.getRandomValues, and game code may
    // not reach crypto itself (portkit lint). Two nonces, base64.
    const seed = this.Secrets.commit(0).reveal().s + this.Secrets.commit(1).reveal().s;
    const commitment = this.Secrets.commit(seed);
    this.secret = { round: this.round, segment: this.segment, seed, commitment, hidden: null };
    this.seedHash = commitment.hash;
    this.seedOpening = null;
  }

  /**
   * Referee: draws one card (upstream GetUnusedCardIndex with the seeded start index). `hidden`: the hole card, which
   * is logged as HIDDEN and kept on this client with a commitment until it is turned. -1 when no card is left.
   */
  NextCard(onTable: readonly number[], hidden = false): number {
    this.EnsureSegment(onTable);
    const secret = this.secret!;
    const counts = InitializeCounts(this.NumberOfDecks);
    for (const c of this.baseCards) counts[c]!--;
    this.drawLog.forEach((c, k) => {
      const card = c === HIDDEN && secret.hidden && secret.hidden.k === k ? secret.hidden.card : c;
      if (card >= 0) counts[card]!--;
    });
    const k = this.drawLog.length;
    const card = GetUnusedCardIndex(counts, new Draw(secret.seed).Int(CARD_TYPES, k));
    if (card < 0) {
      this.drawLog.push(NO_CARD);
      return -1;
    }
    if (hidden) {
      secret.hidden = { k, card, commitment: this.Secrets.commit(card) };
      this.drawLog.push(HIDDEN);
    } else this.drawLog.push(card);
    return card;
  }

  /** Referee: the commitment to the face-down card, for the Dealer's state. */
  HiddenHash(): string {
    return this.HoldsSegment() && this.secret!.hidden ? this.secret!.hidden.commitment.hash : "";
  }

  /**
   * Referee: turns the hole card face up. Returns the card and the opening of its commitment, or null when this
   * client does not know it (it took over after the deal): then the caller draws a new one.
   */
  RevealHidden(): { card: number; opening: Opening } | null {
    if (!this.HoldsSegment()) return null;
    const hidden = this.secret!.hidden;
    if (!hidden) return null;
    this.drawLog[hidden.k] = hidden.card;
    this.secret!.hidden = null;
    return { card: hidden.card, opening: hidden.commitment.reveal() };
  }

  /** Referee, at the end of the round: publishes the seed so everyone can check the draws. */
  RevealSeed(): void {
    if (this.HoldsSegment()) this.seedOpening = this.secret!.commitment.reveal();
    else if (this.seedHash !== "") this.lostSegments++;
    this.CheckReveal();
  }

  /** Every client: checks a newly published seed against its commitment and replays the segment. */
  CheckReveal(): void {
    if (!this.seedOpening) return;
    const key = `${this.round}/${this.segment}/${this.seedHash}`;
    if (key === this.checked) return;
    this.checked = key;
    this.verified = this.Verify();
    if (!this.verified.ok) this.Debug.LogError(`round ${this.round}: the dealt cards do not match the published seed: ${this.verified.reason}`);
  }

  /** Checks the published seed of the current segment. */
  Verify(): Verification {
    if (!this.seedOpening) return { ok: false, reason: "no seed published" };
    if (!this.Secrets.verify(this.seedHash, this.seedOpening)) return { ok: false, reason: "the seed does not match its commitment" };
    const seed = this.Secrets.valueOf<string>(this.seedOpening);
    if (typeof seed !== "string") return { ok: false, reason: "the seed is not text" };
    return ReplaySegment(seed, this.NumberOfDecks, this.baseCards, this.drawLog);
  }
}
