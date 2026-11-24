// Translated from Scripts/DeckManager.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Upstream keeps per-client counts of each card type, reset at every round start and lowered by 1,166 generated
// network events. Here the referee is the only one who draws, the counts follow from the cards on the table, and
// the "random" start index of every draw comes from the runtime's dealt draw (Secrets.beginDeal): the referee commits
// to a seed, every seated player's runtime commits to a contribution and reveals it, and the deal is the hash of all
// of them, so the referee cannot grind seeds and no player can steer a card. After the round the referee reveals its
// seed and every client checks the round (Verify): the deal's contributors must be the players seated in the round,
// the seed must be the committed one, and every hand on the table must hold exactly the cards the deal gave it
// (`drawTo` records where each draw went). A deal with no contributor but the referee (the fallback when a seated
// player's page never answers, or a referee playing alone) cannot be checked, and every client shows that.
//
// The probe that turns a start index into a card (GetUnusedCardIndex) is upstream's, unchanged, and so is the
// fact that every draw is a fresh pick over card types (no shoe order).

import { Behaviour, type Commitment, type DeserializationResult, type Draw, type Opening } from "../portkit/src/index.ts";
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

// Where each draw went (DeckManager.drawTo, beside drawLog), so that every client can hold the hands on the table
// against the deal: seat i's normal hand is 2i, its split hand 2i+1; the dealer's first card (the hole card) and
// its other cards have codes of their own; a draw that found no card went nowhere.
/** drawTo code of seat `seat`'s normal or split hand. */
export function HandCode(seat: number, split: boolean): number {
  return seat * 2 + (split ? 1 : 0);
}
/** drawTo code of the dealer's cards after the first. */
export const TO_DEALER = 100;
/** drawTo code of the dealer's first card (the hole card, dealt face down). */
export const TO_HOLE = 101;
/** drawTo code of a draw that found no card. */
export const TO_NONE = -1;

/**
 * The outcome of checking a round's deal. `checked`: every card on the table is the deal's; `unverifiable`: the deal
 * was the referee's alone (no other contributor), so the cards may be its choice; `mismatch`: something does not
 * match (a forged hand, a contributor list other than the seated players, a seed that is not the committed one).
 */
export type DealStatus = "checked" | "unverifiable" | "mismatch";
export interface Verification {
  ok: boolean;
  status: DealStatus;
  reason: string;
}

export function Checked(): Verification {
  return { ok: true, status: "checked", reason: "" };
}
function Unverifiable(reason: string): Verification {
  return { ok: false, status: "unverifiable", reason };
}
function Mismatch(reason: string): Verification {
  return { ok: false, status: "mismatch", reason };
}

/** The cards a deal gives, draw by draw (-1 for a draw that finds none), after the cards already on the table. */
export function ReplayCards(draw: Draw, numberOfDecks: number, baseCards: readonly number[], draws: number): number[] {
  const counts = InitializeCounts(numberOfDecks);
  for (const c of baseCards) if (c >= 0) counts[c]!--;
  const out: number[] = [];
  for (let k = 0; k < draws; k++) {
    const card = GetUnusedCardIndex(counts, draw.Int(CARD_TYPES, k));
    out.push(card);
    if (card >= 0) counts[card]!--;
  }
  return out;
}

/** Checks a segment's log of draws: every logged card is what the deal gives. */
export function ReplaySegment(draw: Draw, numberOfDecks: number, baseCards: readonly number[], drawLog: readonly number[]): Verification {
  const cards = ReplayCards(draw, numberOfDecks, baseCards, drawLog.length);
  for (let k = 0; k < drawLog.length; k++) {
    const logged = drawLog[k]!;
    if (logged === HIDDEN) return Mismatch(`draw ${k} was never turned face up`);
    if ((logged === NO_CARD ? -1 : logged) !== cards[k]) return Mismatch(`draw ${k} is ${logged}, the deal gives ${cards[k]}`);
  }
  return Checked();
}

/** The hands on the table as a client holds them: each seat's normal and split hand, and the dealer's cards. */
export interface TableHands {
  seats: Array<{ normal: readonly number[]; split: readonly number[] }>;
  dealer: readonly number[];
}

/**
 * Checks the hands on the table against the deal: the cards each hand got in this segment (by `drawTo`, in draw order)
 * are the ones the deal gives, and what each hand held before the segment began adds up to `baseCards`. So a hand the
 * referee changed, a card given to another hand than the one it was drawn for, a draw left out or a card nobody drew
 * all show, whatever the referee wrote in `drawLog`.
 */
export function CheckHands(cards: readonly number[], drawTo: readonly number[], baseCards: readonly number[], hands: TableHands): Verification {
  if (drawTo.length !== cards.length) return Mismatch(`${cards.length} draws but ${drawTo.length} destinations`);
  const valid = new Set<number>([TO_DEALER, TO_HOLE, TO_NONE]);
  hands.seats.forEach((_, i) => (valid.add(HandCode(i, false)), valid.add(HandCode(i, true))));
  for (let k = 0; k < drawTo.length; k++) {
    if (!valid.has(drawTo[k]!)) return Mismatch(`draw ${k} went to an unknown place (${drawTo[k]})`);
    if ((drawTo[k] === TO_NONE) !== (cards[k]! < 0)) return Mismatch(`draw ${k}: the deal gives ${cards[k]}, but it went to ${drawTo[k]}`);
  }
  const base: number[] = [];
  const hand = (code: number, held: readonly number[], what: string): string => {
    const mine: number[] = [];
    drawTo.forEach((to, k) => {
      if (to === code) mine.push(cards[k]!);
    });
    if (mine.length > held.length) return `${what} holds ${held.length} cards, but ${mine.length} were drawn for it`;
    const before = held.length - mine.length;
    for (let j = 0; j < mine.length; j++) {
      if (held[before + j] !== mine[j]) return `${what}'s card ${before + j + 1} is ${held[before + j]}, the deal gives ${mine[j]}`;
    }
    base.push(...held.slice(0, before));
    return "";
  };
  for (let i = 0; i < hands.seats.length; i++) {
    const seat = hands.seats[i]!;
    const why = hand(HandCode(i, false), seat.normal, `seat ${i + 1}'s hand`) || hand(HandCode(i, true), seat.split, `seat ${i + 1}'s split hand`);
    if (why) return Mismatch(why);
  }
  const holes = drawTo.filter((to) => to === TO_HOLE).length;
  if (holes > 1) return Mismatch(`${holes} hole cards were drawn`);
  let dealerRest = hands.dealer;
  if (holes === 1) {
    const k = drawTo.indexOf(TO_HOLE);
    if (hands.dealer[0] !== cards[k]) return Mismatch(`the dealer's first card is ${hands.dealer[0]}, the deal gives ${cards[k]}`);
    dealerRest = hands.dealer.slice(1);
  }
  const why = hand(TO_DEALER, dealerRest, "the dealer");
  if (why) return Mismatch(why);
  if (base.some((c) => c < 0)) return Mismatch("a card on the table is face down");
  const a = base.slice().sort((x, y) => x - y).join(",");
  const b = baseCards.filter((c) => c >= 0).slice().sort((x, y) => x - y).join(",");
  if (a !== b) return Mismatch(`the cards held from before this deal (${a}) are not the ones it began with (${b})`);
  return Checked();
}

/** NextCard's answer while the deal is not ready yet (the seated players' contributions are on their way). */
export const PENDING = -3;
/**
 * A deal that is not ready after this many seconds is begun again without contributions (a player who never answers).
 * Such a deal is the referee's alone: every client shows it as not checkable (a modified referee could do the same at
 * once and pick its seed, so nobody can tell the two apart).
 */
export const DEAL_TIMEOUT = 10;

interface SegmentSecret {
  round: number;
  segment: number;
  label: string;
  /** Shared-clock second the deal was begun (for DEAL_TIMEOUT). */
  begunAt: number;
  /** The hole card while it is face down: its draw number, the card, and the commitment published for it. */
  hidden: { k: number; card: number; commitment: Commitment } | null;
}

export class DeckManager extends Behaviour {
  /** The referee halves of the deck-count buttons. */
  static override networkCallable = ["AddDeck", "SubtractDeck"];
  static override synced = ["NumberOfDecks", "round", "segment", "dealLabel", "dealRevealed", "drawLog", "drawTo", "baseCards", "segmentDecks", "lostSegments", "unfairDeals"];

  /** [UdonSynced] upstream. Copies of each card type per round, at least 2. */
  NumberOfDecks = 2;
  /** Added: the round these draws belong to. */
  round = 0;
  /** Added: 1 for the round's first referee; a new referee mid-round starts the next one with a deal of its own. */
  segment = 0;
  /**
   * Added: the label of this segment's dealt draw (Secrets.beginDeal): the referee committed to a seed, every seated
   * player's runtime added a committed contribution, and the cards come from all of them, so the referee cannot grind
   * seeds and no player can steer a card.
   */
  dealLabel = "";
  /** Added: the referee has published its seed (revealDeal), at the end of the round. */
  dealRevealed = false;
  /** Added: every card this segment drew, in order (HIDDEN for the hole card while face down, NO_CARD for none). */
  drawLog: number[] = [];
  /** Added: where each draw of drawLog went (HandCode, TO_DEALER, TO_HOLE, TO_NONE); a split moves its card's entry. */
  drawTo: number[] = [];
  /** Added: the cards already on the table when this segment began. */
  baseCards: number[] = [];
  /** Added: NumberOfDecks when this segment began (the count may change after the round, before a late check). */
  segmentDecks = 2;
  /** Added: segments of this round whose seed was lost with their referee (they cannot be checked). */
  lostSegments = 0;
  /** Added: deals begun again without contributions because a seated player's runtime never answered. */
  unfairDeals = 0;

  // From bindings.json.
  BlackjackController!: Controller;

  /** This client's check of the last revealed deal: null before one was revealed and checked. */
  verified: Verification | null = null;
  /** Upstream's per-client counts, kept for the deck-count display and tests. Derived, never synced. */
  NumOfEachCardLeft: number[] = InitializeCounts(2);

  private secret: SegmentSecret | null = null;
  private checked = "";
  /**
   * Who this client saw seated in the round when it first saw each deal's label (the label and the seats arrive in
   * one write). Nobody can take a seat during a round, so the seated players only shrink after that.
   */
  private readonly seatedAt = new Map<string, string[]>();

  override OnDeserialization(result: DeserializationResult): void {
    this.NoteSeated();
    this.CheckReveal();
    this.BlackjackController?.Redraw(result.isSnapshot);
  }

  override Update(): void {
    this.NoteSeated();
    // The reveal lives in the referee's user state, which may arrive after the space state that says it was made.
    if (this.dealRevealed && this.checked !== this.dealLabel) this.CheckReveal();
  }

  private NoteSeated(): void {
    if (this.dealLabel !== "" && !this.seatedAt.has(this.dealLabel) && this.BlackjackController) {
      this.seatedAt.set(this.dealLabel, this.BlackjackController.RoundSids());
    }
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

  /** Referee: a new round. The Controller begins its first deal at once (EnsureSegment). */
  StartRound(): void {
    this.round++;
    this.Forget();
  }

  /** Referee: clears everything (a table reset). */
  Clear(): void {
    this.Forget();
  }

  private Forget(): void {
    this.segment = 0;
    this.dealLabel = "";
    this.dealRevealed = false;
    this.drawLog = [];
    this.drawTo = [];
    this.baseCards = [];
    this.lostSegments = 0;
    this.unfairDeals = 0;
    this.secret = null;
    this.verified = null;
  }

  /** True when this client is the referee that began the segment in state, and its deal still stands. */
  HoldsSegment(): boolean {
    const s = this.secret;
    return (
      s !== null &&
      s.round === this.round &&
      s.segment === this.segment &&
      s.label === this.dealLabel &&
      this.Networking.IsReferee &&
      this.Secrets.dealState(s.label) !== "none"
    );
  }

  /**
   * Referee: makes sure this client has a deal to draw from. A referee that took over mid-round does not know the
   * old seed (a change of referee voids the deal), so it begins a new segment with a deal of its own, counting from
   * the cards on the table (`onTable`). Returns true when it changed state.
   */
  EnsureSegment(onTable: readonly number[], contributors: readonly string[]): boolean {
    if (this.HoldsSegment()) return false;
    if (this.segment > 0 && this.dealLabel !== "") this.lostSegments++;
    this.segment++;
    this.baseCards = onTable.filter((c) => c >= 0);
    this.drawLog = [];
    this.drawTo = [];
    this.segmentDecks = this.NumberOfDecks;
    this.Begin(contributors);
    return true;
  }

  private Begin(contributors: readonly string[]): void {
    // A label of its own for every deal: the round and segment, and random bytes so that a reset's reused round
    // number never meets an earlier deal of the same name.
    const tag = Array.from(this.Random.Bytes(4), (b) => b.toString(16).padStart(2, "0")).join("");
    const label = `bj${this.round}.${this.segment}.${tag}`;
    this.Secrets.beginDeal(label, contributors.slice());
    this.seatedAt.set(label, this.BlackjackController.RoundSids());
    this.secret = { round: this.round, segment: this.segment, label, begunAt: this.BlackjackController.Now(), hidden: null };
    this.dealLabel = label;
    this.dealRevealed = false;
  }

  /**
   * Referee: true when the deal can be drawn from. A deal that some seated player's runtime has not answered for
   * DEAL_TIMEOUT seconds is begun again with no contributors (logged, and counted in `unfairDeals`): the table must
   * not hang on a modified client that withholds its contribution. That deal never verifies: every client shows the
   * round as not checkable. "changed" when it wrote state.
   */
  Ready(): boolean | "changed" {
    if (!this.HoldsSegment()) return false;
    const s = this.secret!;
    if (this.Secrets.dealDraw(s.label) !== null) return true;
    if (this.drawLog.length === 0 && this.BlackjackController.Now() - s.begunAt > DEAL_TIMEOUT) {
      this.Debug.LogWarning(`deal ${s.label}: a seated player's contribution never came; dealing from the referee's seed alone (not checkable)`);
      this.unfairDeals++;
      this.Begin([]);
      return "changed";
    }
    return false;
  }

  /**
   * Referee: draws one card (upstream GetUnusedCardIndex with the dealt start index) for the hand `to` (HandCode,
   * TO_DEALER, TO_HOLE). The hole card (TO_HOLE) is logged as HIDDEN and kept on this client with a commitment until
   * it is turned, unless `faceUp` (a hole card drawn at the flip). -1 when no card is left; PENDING while the deal is
   * not ready (the caller tries again on a later tick).
   */
  NextCard(to: number, faceUp = false): number {
    // (a new segment is begun by the Controller's tick, never from here)
    if (!this.HoldsSegment()) return PENDING;
    const secret = this.secret!;
    const draw = this.Secrets.dealDraw(secret.label);
    if (!draw) return PENDING;
    const counts = InitializeCounts(this.segmentDecks);
    for (const c of this.baseCards) counts[c]!--;
    this.drawLog.forEach((c, k) => {
      const card = c === HIDDEN && secret.hidden && secret.hidden.k === k ? secret.hidden.card : c;
      if (card >= 0) counts[card]!--;
    });
    const k = this.drawLog.length;
    const card = GetUnusedCardIndex(counts, draw.Int(CARD_TYPES, k));
    if (card < 0) {
      this.drawLog.push(NO_CARD);
      this.drawTo.push(TO_NONE);
      return -1;
    }
    this.drawTo.push(to);
    if (to === TO_HOLE && !faceUp) {
      secret.hidden = { k, card, commitment: this.Secrets.commit(card) };
      this.drawLog.push(HIDDEN);
    } else this.drawLog.push(card);
    return card;
  }

  /**
   * Referee: card `position` of hand `from` (its held cards: `held`) moves to the front of hand `to` (a split). If this
   * segment drew it, its destination follows it.
   */
  Moved(from: number, held: readonly number[], position: number, to: number): void {
    const mine: number[] = [];
    this.drawTo.forEach((code, k) => {
      if (code === from) mine.push(k);
    });
    const before = held.length - mine.length;
    if (position < before) return; // dealt before this segment: it is one of baseCards
    const k = mine[position - before];
    if (k !== undefined) this.drawTo[k] = to;
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

  /** Referee, at the end of the round: publishes its seed so that everyone can check the draws. */
  RevealSeed(): void {
    if (this.HoldsSegment()) {
      this.Secrets.revealDeal(this.dealLabel);
      this.dealRevealed = true;
    } else if (this.dealLabel !== "") this.lostSegments++;
    this.CheckReveal();
  }

  /** Every client: once the referee's seed is out, recomputes the deal from what it saw and replays the segment. */
  CheckReveal(): void {
    if (!this.dealRevealed || this.dealLabel === "" || this.checked === this.dealLabel) return;
    const state = this.Secrets.dealState(this.dealLabel);
    if (state !== "revealed" && state !== "invalid") return; // not here yet
    this.checked = this.dealLabel;
    this.verified = this.Verify();
    if (this.verified.status === "mismatch") this.Debug.LogError(`round ${this.round}: the dealt cards do not match the revealed deal: ${this.verified.reason}`);
    else if (this.verified.status === "unverifiable") this.Debug.LogWarning(`round ${this.round}: the deal cannot be checked: ${this.verified.reason}`);
  }

  /**
   * The line every player sees under the dealer's buttons: the outcome of this client's check after the round, and,
   * during a round, a warning when the deal is the referee's alone.
   */
  CheckText(): string {
    const ctrl = this.BlackjackController;
    if (!ctrl || this.dealLabel === "") return "";
    if (ctrl.phase === "settled") {
      const v = this.verified;
      if (!v) return this.dealRevealed ? "Checking the deal..." : "Waiting for the dealer's page to reveal the deal";
      if (v.status === "checked") return this.lostSegments > 0 ? "Deal checked (part of it was lost with a dealer who left)" : "Deal checked: every card came from the shared shuffle";
      if (v.status === "unverifiable") {
        if (/only player/.test(v.reason)) return "Deal NOT checkable: the dealer's page was the only player";
        if (/left before/.test(v.reason)) return "Deal NOT checkable here: a contributor left before this page came";
        return "Deal NOT checkable: the dealer's page dealt from its own seed alone";
      }
      return `DEAL CHECK FAILED: ${v.reason}`;
    }
    const listed = this.Secrets.dealContributors(this.dealLabel);
    const referee = this.Networking.Master?.sid ?? "";
    if (listed && !listed.some((sid) => sid !== referee)) return "This deal is the dealer's page's alone: it cannot be checked";
    return "";
  }

  /**
   * The session ids that must have contributed to the deal under `label`, as this client knows them: whoever it saw
   * seated in the round (when it first saw the label, and now), and listed players who are no longer here (a player
   * who left counts as absent in the deal; a late joiner never saw them seated). A listed player who is here but not
   * seated in the round (an accomplice) is not expected, nor is a seated player the referee left out.
   */
  ExpectedContributors(label: string): string[] {
    const present = new Set(this.Networking.GetPlayers().map((p) => p.sid));
    const want = new Set<string>([...(this.seatedAt.get(label) ?? []), ...this.BlackjackController.RoundSids()]);
    for (const sid of this.Secrets.dealContributors(label) ?? []) if (!present.has(sid)) want.add(sid);
    return [...want];
  }

  /**
   * Checks the revealed deal of the current segment: the contributor list is the seated players (a list of nobody but
   * the referee is its own choice: not checkable), the seed is the committed one, the logged draws are the deal's,
   * and every hand on the table holds exactly the cards the deal gave it.
   */
  Verify(): Verification {
    if (!this.dealRevealed) return Mismatch("no deal revealed");
    const label = this.dealLabel;
    const listed = this.Secrets.dealContributors(label);
    if (!listed) return Mismatch("the referee's deal record is missing");
    const referee = this.Networking.Master?.sid ?? "";
    if (!listed.some((sid) => sid !== referee)) {
      const others = this.ExpectedContributors(label).filter((sid) => sid !== referee);
      return Unverifiable(
        others.length
          ? "the dealer's page dealt from its own seed alone (it says a seated player's page never answered)"
          : "the dealer's page was the only player: nobody else took part in the deal",
      );
    }
    const expected = this.ExpectedContributors(label);
    const want = expected.slice().sort().join(",");
    const got = [...new Set(listed)].sort().join(",");
    if (want !== got) return Mismatch("the deal's contributors are not the players seated in the round");
    // A contributor who left before this page first saw the deal took its contribution with it: this page computes
    // the deal with that part absent, which is not the deal that was dealt. Such a page cannot check the round.
    const present = new Set(this.Networking.GetPlayers().map((p) => p.sid));
    const sawSeated = this.seatedAt.get(label) ?? [];
    const missed = listed.filter((sid) => !present.has(sid) && !sawSeated.includes(sid));
    const result = this.Replay(label, expected);
    if (result.status === "mismatch" && missed.length > 0) {
      return Unverifiable("a player who contributed to this deal left before this page arrived: its part is not known here");
    }
    return result;
  }

  private Replay(label: string, expected: string[]): Verification {
    const draw = this.Secrets.verifyDeal(label, expected);
    if (!draw) return Mismatch("the referee's seed does not match its commitment, or a contribution is missing");
    const log = ReplaySegment(draw, this.segmentDecks, this.baseCards, this.drawLog);
    if (!log.ok) return log;
    const ctrl = this.BlackjackController;
    const cards = ReplayCards(draw, this.segmentDecks, this.baseCards, this.drawLog.length);
    return CheckHands(cards, this.drawTo, this.baseCards, {
      seats: ctrl.Players.map((p) => ({ normal: p.NormalDeck.cards, split: p.SplitDeck.cards })),
      dealer: ctrl.Dealer.cards,
    });
  }
}
