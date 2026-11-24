// Translated from Scripts/Player.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// One seat. Upstream mixes three roles in this class: the holder's client (draws its own cards, pays itself), the
// table owner's client (frees seats) and every client (banners, sounds), joined by 11 network events and 8 ownership
// transfers. Here every method a button calls has two halves:
//   - on the presser's client (`Networking.CallingSession` is null): local feedback, then a command to the referee,
//     named as upstream's method without its leading "_" (a "_" method cannot be a command, as in UdonSharp);
//   - on the referee (the command, with `CallingSession` set): checks who asked against the seat's holder or the
//     table owner and the phase, then changes state.
// Everything else is drawn from state on every client (`Apply`), so late joiners see the seat as it is.
// Chips stay on the holder's client, as upstream: the holder pays itself from the results the referee writes.

import { Behaviour, Mathf, type AnimatorRef, type DeserializationResult, type GameObject, type TextRef } from "../portkit/src/index.ts";
import type { Controller } from "./Controller.ts";
import { HandCode, PENDING, type DeckManager } from "./DeckManager.ts";
import type { InteractableController } from "./InteractableController.ts";
import { MAX_CARDS, type HandMath, type PlayerDeck } from "./PlayerDeck.ts";
import type { PlayerUIController } from "./PlayerUIController.ts";

export const RESULT_NONE = 0;
export const RESULT_WIN = 1;
export const RESULT_DRAW = 2;
export const RESULT_LOSE = 3;

/** How a turn ended (added; upstream only knew that it had). */
export const ENDED_NONE = 0;
export const ENDED_STAND = 1;
export const ENDED_BUST = 2;
export const ENDED_TIMEOUT = 3;
export const ENDED_LEFT = 4;

/** SetWinState's comparison (Player.cs:477-527, the split hand at :533-572): over 21 loses; beating the dealer or a dealer bust wins; equal draws. */
export function SettleHand(value: number, dealerValue: number): number {
  if (value > 21) return RESULT_LOSE;
  if (value > dealerValue || dealerValue > 21) return RESULT_WIN;
  if (value === dealerValue) return RESULT_DRAW;
  return RESULT_LOSE;
}

/** Every win pays 1 to 1 (Player.cs:491-503); a loss costs the bet; a draw nothing. */
export function ChipChange(result: number, bet: number): number {
  if (result === RESULT_WIN) return bet;
  if (result === RESULT_LOSE) return -bet;
  return 0;
}

/**
 * Upstream's split arithmetic (Player.cs:366-369), kept for the golden vectors: the second card's value moves from
 * the first hand's total to the split hand's, and the ace count stays where it was. For a pair of aces that leaves
 * the first hand at 1 with an 11-ace on record and the split hand at 11 with none (Q4). The port scores each hand
 * from its own cards instead (PlayerDeck.Recount).
 */
export function SplitLiteral(normal: HandMath, split: HandMath, SecondCardValue: number): void {
  normal.localDeckValue -= SecondCardValue;
  split.localDeckValue += SecondCardValue;
}

export class Player extends Behaviour {
  /** The referee halves of the seat's buttons: the only names a command (or network event) may run here. */
  static override networkCallable = [
    "TakeControl",
    "ReleaseControl",
    "AutoNormalHitMe",
    "AutoSplitHitMe",
    "ManualNormalHitMe",
    "ManualSplitHitMe",
    "Stand",
    "Split",
  ];
  static override synced = [
    "IsActive",
    "HasFinishedTurn",
    "currentOwnerID",
    "ownerSid",
    "ownerName",
    "inRound",
    "CanSplit",
    "HasSplit",
    "splitAt",
    "splitDealt",
    "wantNormal",
    "wantSplit",
    "endedBy",
    "result",
  ];

  /** [UdonSynced] upstream: the seat is taken. */
  IsActive = false;
  /** [UdonSynced] upstream. */
  HasFinishedTurn = true;
  /** [UdonSynced] upstream: the holder's player id. */
  currentOwnerID = 0;
  /** Added: the holder's session; presses for this seat are taken from it alone. */
  ownerSid = "";
  /** Added: the holder's name, for late joiners. */
  ownerName = "";
  /** Added: the seat was dealt into the current round (upstream's ActivePlayers). */
  inRound = false;
  /** Upstream local, synced here (Q21: it follows the hand). The holder's client adds the chip check. */
  CanSplit = false;
  /** Upstream local to the splitter, synced here (Q7). */
  HasSplit = false;
  /** Added: shared-clock second of the split; each hand gets its card 1 s later, and no hits before that. */
  splitAt = 0;
  splitDealt = false;
  /** Added: "wants to hit" marks for the dealer in manual play (upstream: animator bools set by events). */
  wantNormal = false;
  wantSplit = false;
  /** Added: why the turn ended (stand, bust, timeout, left), so every client shows it (Q8). */
  endedBy = ENDED_NONE;
  /** Added: SetWinState's verdict per hand (normal, split), written by the referee at the end of the round. */
  result: number[] = [RESULT_NONE, RESULT_NONE];

  // From bindings.json.
  BlackjackController!: Controller;
  PlayerNum = 0;
  NormalDeck!: PlayerDeck;
  SplitDeck!: PlayerDeck;
  Deck!: DeckManager;
  PlayerUI!: PlayerUIController;
  Interactables: InteractableController | null = null;
  PlayerName: TextRef | null = null;
  BetPanel: GameObject | null = null;
  ChipAnimator: AnimatorRef | null = null;
  CurrentBet: TextRef | null = null;
  TotalChips: TextRef | null = null;
  Timer: TextRef | null = null;

  // Local, as upstream.
  /** The local player holds this seat (upstream: Networking.IsOwner(gameObject) && ImInThis). */
  isOwner = false;
  myTurn = false;
  Running = true;
  TotalBet = 0;
  CanBet = true;
  private justReleasedControl = false;
  /** The bet each hand of this seat plays for this round (taken when the round starts). */
  private roundBet = 0;
  private paidRound = 0;
  private seenRound = -1;
  private seenSplit = false;

  // The referee's own debounces (upstream: JustHitNormal, JustHitSplit, justReleasedControl on the presser's client).
  private lastHitNormalAt = -Infinity;
  private lastHitSplitAt = -Infinity;
  private readonly releasedAt = new Map<string, number>();

  get isRunningProperty(): boolean {
    return this.Running;
  }
  set isRunningProperty(value: boolean) {
    this.Running = value;
    this.PlayerUI.Running = value;
  }

  override OnDeserialization(result: DeserializationResult): void {
    this.BlackjackController?.Redraw(result.isSnapshot);
  }

  override Update(): void {
    const ctrl = this.BlackjackController;
    if (!ctrl || !this.Running) return;
    const bank = ctrl.ChipController;
    if (this.PlayerName) this.PlayerName.text = this.ownerName;
    if (this.CurrentBet) this.CurrentBet.text = String(this.TotalBet);
    if (this.TotalChips) this.TotalChips.text = String(bank.CurrentChipCount);
    this.BetPanel?.SetActive(this.isOwner && ctrl.UsingChips);
    this.ChipAnimator?.SetBool("Active", !ctrl.localGameActive);
    if (this.isOwner) {
      this.TotalBet = bank.GetBet();
      // The turn timer is the round's shared deadline (upstream: a per-client countdown of Time.deltaTime).
      const left = this.myTurn ? Math.max(0, ctrl.deadline - ctrl.Now()) : ctrl.turnSeconds;
      if (this.Timer) this.Timer.text = String(Mathf.RoundToInt(left));
    }
  }

  // ---- what every client draws from state ---------------------------------------------------------------------

  /** Called by Controller.Redraw on every client after state changed. `instant`: the state as found on arrival. */
  Apply(instant: boolean): void {
    const ctrl = this.BlackjackController;
    const me = ctrl.LocalSid();
    this.isOwner = this.IsActive && this.ownerSid === me;
    this.myTurn = this.isOwner && ctrl.phase === "turns" && this.inRound && !this.HasFinishedTurn;
    const bank = ctrl.ChipController;

    if (ctrl.round !== this.seenRound) {
      // A round began (or this client arrived): the holder's bet for each hand is what is on the table now.
      if (!instant && this.isOwner && this.inRound && ctrl.GameActive) {
        this.CanBet = false;
        this.roundBet = bank.GetBet();
      }
      if (instant) this.paidRound = ctrl.round;
      this.seenRound = ctrl.round;
      this.seenSplit = this.HasSplit;
    }
    if (this.HasSplit && !this.seenSplit) {
      this.seenSplit = true;
      // Split (Player.cs:359-364) on the splitter's client: the table bet is doubled and the split sound plays.
      if (!instant && this.isOwner) {
        if (ctrl.UsingChips) bank.AddToBet(this.roundBet);
        ctrl.AudioController.PlaySplitDeck();
      }
    }
    if (!this.HasSplit) this.seenSplit = false;

    // SetWinState (Player.cs:468-576) on the holder's client: chips move once per round, at the bet the round
    // started with for each hand (Q5: upstream settled each split hand at the doubled bet).
    if (ctrl.phase === "settled" && this.paidRound !== ctrl.round) {
      this.paidRound = ctrl.round;
      this.CanBet = true;
      if (!instant && this.isOwner && this.IsActive && this.result[0] !== RESULT_NONE) {
        const r = this.result[0]!;
        if (r === RESULT_WIN) ctrl.AudioController.PlayWinMatch();
        else if (r === RESULT_LOSE) ctrl.AudioController.PlayLoseMatch();
        else ctrl.AudioController.PlayDrawMatch();
        if (ctrl.UsingChips) {
          let change = ChipChange(r, this.roundBet);
          if (this.HasSplit) change += ChipChange(this.result[1]!, this.roundBet);
          if (change > 0) bank.AddChips(change);
          else if (change < 0) bank.RemoveChips(-change);
        }
      }
    }
    if (ctrl.phase !== "settled" && !ctrl.GameActive) this.CanBet = true;

    this.NormalDeck.Show(instant);
    this.SplitDeck.Show(instant);
    this.PlayerUI.Apply(instant);
  }

  // ---- buttons on the seat -------------------------------------------------------------------------------------

  /**
   * The sender of the command being run, on the referee; null for a local call, and null on any other client (a
   * network event of the same name from a modified client changes nothing there).
   */
  private Caller(): { sid: string; uid: string } | null {
    return this.Networking.IsReferee ? this.Networking.CallingSession : null;
  }

  /** "Join Game" (Player.cs:172-189), the presser's half. */
  _TakeControl(): void {
    if (this.BlackjackController.localGameActive || this.justReleasedControl) return;
    this.BlackjackController.AudioController.PlayTakeControl();
    // A method whose name starts with "_" cannot be a command (as in UdonSharp), so the referee's half drops it.
    this.SendCommand("TakeControl");
  }

  /** The referee's half of _TakeControl. */
  TakeControl(): void {
    const caller = this.Caller();
    const who = this.Networking.CallingPlayer;
    const ctrl = this.BlackjackController;
    // Q11: nobody takes a seat during a round. A taken seat is not taken over (upstream left that to the UI).
    if (!caller || !who || ctrl.GameActive || this.IsActive) return;
    const released = this.releasedAt.get(caller.sid);
    if (released !== undefined && ctrl.Now() - released < 2) return; // Player.cs:174, 203
    this.IsActive = true;
    this.ownerSid = caller.sid;
    this.ownerName = who.displayName;
    this.currentOwnerID = who.playerId;
    this.HasFinishedTurn = true;
    this.inRound = false;
    ctrl.Changed();
  }

  /** "LEAVE GAME" (Player.cs:191-204); also sent when the player walks out of range or the table leaves the page. */
  ReleaseControl(): void {
    if (!this.Networking.CallingSession) {
      if (this.justReleasedControl) return;
      this.justReleasedControl = true;
      this.BlackjackController.AudioController.PlayReleaseControl();
      this.SendCommand("ReleaseControl");
      this.SendCustomEventDelayedSeconds("ResetJustReleasedControl", 2);
      return;
    }
    const caller = this.Caller();
    if (!caller || !this.IsActive || caller.sid !== this.ownerSid) return;
    this.GlobalReleaseControl(ENDED_LEFT);
    this.BlackjackController.Changed();
  }

  ResetJustReleasedControl(): void {
    this.justReleasedControl = false;
  }

  /** Referee: GlobalReleaseControl (Player.cs:211-235): stands a hand that is mid-turn, then frees the seat. */
  GlobalReleaseControl(reason: number): void {
    if (this.IsActive && !this.HasFinishedTurn && this.inRound && this.BlackjackController.GameActive) this.EndTurn(reason);
    if (this.ownerSid) this.releasedAt.set(this.ownerSid, this.BlackjackController.Now());
    this.IsActive = false;
    this.HasFinishedTurn = true;
    this.ownerSid = "";
    this.ownerName = "";
    this.currentOwnerID = 0;
    this.wantNormal = false;
    this.wantSplit = false;
  }

  /** The holder's HIT for the first hand (Player.cs:281-291), the presser's half. */
  _AutoNormalHitMe(): void {
    this.SendCommand("AutoNormalHitMe");
  }

  AutoNormalHitMe(): void {
    const caller = this.Caller();
    if (!caller || !this.IsActive || caller.sid !== this.ownerSid) return;
    if (this.BlackjackController.ManualPlay) this.MarkNormalHit();
    else this.HitMeNormal();
    this.BlackjackController.Changed();
  }

  /** The holder's HIT for the split hand (Player.cs:293-303), the presser's half. */
  _AutoSplitHitMe(): void {
    this.SendCommand("AutoSplitHitMe");
  }

  AutoSplitHitMe(): void {
    const caller = this.Caller();
    if (!caller || !this.IsActive || caller.sid !== this.ownerSid || !this.HasSplit) return;
    if (this.BlackjackController.ManualPlay) this.MarkSplitHit();
    else this.HitMeSplit();
    this.BlackjackController.Changed();
  }

  /** The dealer's "Hit Me" for this seat's first hand (manual play; Player.cs:269-273), the presser's half. */
  _ManualNormalHitMe(): void {
    this.SendCommand("ManualNormalHitMe");
  }

  ManualNormalHitMe(): void {
    const caller = this.Caller();
    if (!caller || !this.BlackjackController.IsTableOwner(caller.sid)) return;
    this.wantNormal = false;
    this.HitMeNormal();
    this.BlackjackController.Changed();
  }

  _ManualSplitHitMe(): void {
    this.SendCommand("ManualSplitHitMe");
  }

  ManualSplitHitMe(): void {
    const caller = this.Caller();
    if (!caller || !this.BlackjackController.IsTableOwner(caller.sid)) return;
    this.wantSplit = false;
    this.HitMeSplit();
    this.BlackjackController.Changed();
  }

  /** The holder's STAND, or the dealer's "Stand" for this seat in manual play (Player.cs:394-401). */
  Stand(): void {
    if (!this.Networking.CallingSession) {
      this.BlackjackController.AudioController.PlayStand();
      this.SendCommand("Stand");
      return;
    }
    const caller = this.Caller();
    const ctrl = this.BlackjackController;
    if (!caller || !this.IsActive || (caller.sid !== this.ownerSid && !ctrl.IsTableOwner(caller.sid))) return;
    if (!this.InTurn()) return;
    this.EndTurn(ENDED_STAND);
    ctrl.Changed();
  }

  /** SPLIT (Player.cs:353-378). */
  Split(): void {
    if (!this.Networking.CallingSession) {
      // Upstream CheckIfCanSplit (PlayerDeck.cs:128-148) asks the holder's chips; they are on this client only. The
      // port asks whether the doubled bet fits next to the bets on other tables too (Q6).
      if (!this.SplitAffordable()) {
        this.BlackjackController.ChipController.NotEnoughChips();
        return;
      }
      this.SendCommand("Split");
      return;
    }
    const caller = this.Caller();
    if (!caller || !this.IsActive || caller.sid !== this.ownerSid) return;
    if (!this.CanSplit || this.HasSplit || !this.InTurn()) return;
    this.CanSplit = false;
    this.HasSplit = true;
    // SyncedSplit: the second card goes to the split row; each hand is scored from its own cards (Q4). The deal's
    // record of where each card went follows it.
    this.Deck.Moved(HandCode(this.PlayerNum, false), this.NormalDeck.cards, 1, HandCode(this.PlayerNum, true));
    const second = this.NormalDeck.cards.splice(1, 1)[0]!;
    this.NormalDeck.Recount();
    this.SplitDeck.Reset();
    this.SplitDeck.AddCard(second);
    this.splitAt = this.BlackjackController.Now();
    this.splitDealt = false;
    this.BlackjackController.Changed();
  }

  /** The holder's client: with chips on, the split's doubled bet must fit (upstream: TotalBet * 2 <= chips). */
  SplitAffordable(): boolean {
    const ctrl = this.BlackjackController;
    if (!ctrl.UsingChips) return true;
    return ctrl.ChipController.CanAddToBet(this.roundBet);
  }

  // ---- chip buttons (local only, as upstream) -----------------------------------------------------------------

  _Add5ToBet(): void {
    this.ChangeBet(5);
  }
  _Add10ToBet(): void {
    this.ChangeBet(10);
  }
  _Remove5FromBet(): void {
    this.ChangeBet(-5);
  }
  _Remove10FromBet(): void {
    this.ChangeBet(-10);
  }

  private ChangeBet(amount: number): void {
    const ctrl = this.BlackjackController;
    if (!this.CanBet || ctrl.localGameActive || !this.isOwner || !ctrl.UsingChips) return;
    const bank = ctrl.ChipController;
    if (amount > 0) bank.AddToBet(amount);
    else {
      if (bank.GetBet() + amount < 0) return;
      bank.TakeFromBet(-amount);
    }
    this.TotalBet = bank.GetBet();
  }

  // ---- the referee's side --------------------------------------------------------------------------------------

  /** In the round, turns open, not finished. */
  InTurn(): boolean {
    return this.IsActive && this.inRound && !this.HasFinishedTurn && this.BlackjackController.phase === "turns";
  }

  private IsSplitting(now: number): boolean {
    return this.HasSplit && !this.splitDealt && now < this.splitAt + 1;
  }

  /** Q9: a bust hand, a full hand, or a finished turn takes no card. */
  private CanTakeCard(deck: PlayerDeck): boolean {
    return this.InTurn() && !deck.IsBust && deck.NextDeckPosition <= MAX_CARDS - 1;
  }

  MarkNormalHit(): void {
    if (!this.InTurn()) return;
    this.wantNormal = true;
  }

  MarkSplitHit(): void {
    if (!this.InTurn() || !this.HasSplit) return;
    this.wantSplit = true;
  }

  /** Referee: HitMeNormal (Player.cs:317-328): one card, at most one per hand per second, none while splitting. */
  HitMeNormal(): void {
    this.wantNormal = false;
    const now = this.BlackjackController.Now();
    if (now - this.lastHitNormalAt < 1 || this.IsSplitting(now) || !this.CanTakeCard(this.NormalDeck)) return;
    this.lastHitNormalAt = now;
    this.DealTo(this.NormalDeck);
  }

  HitMeSplit(): void {
    this.wantSplit = false;
    const now = this.BlackjackController.Now();
    if (!this.HasSplit || now - this.lastHitSplitAt < 1 || this.IsSplitting(now) || !this.CanTakeCard(this.SplitDeck)) return;
    this.lastHitSplitAt = now;
    this.DealTo(this.SplitDeck);
  }

  /** Referee: SummonCard on one of this seat's hands (PlayerDeck.cs:55-69), then the bust and split checks. */
  DealTo(deck: PlayerDeck): void {
    if (deck.NextDeckPosition > MAX_CARDS - 1) return;
    const card = this.BlackjackController.DrawCard(HandCode(this.PlayerNum, deck === this.SplitDeck));
    if (card === PENDING) {
      // the deal is not ready (a new referee's deal is gathering contributions): this card comes once it is
      this.BlackjackController.Defer(() => {
        if (this.IsActive && this.inRound && !this.HasFinishedTurn && !deck.IsBust) this.DealTo(deck);
      });
      return;
    }
    if (card < 0) return;
    const busted = deck.AddCard(card);
    this.CheckIfCanSplit();
    if (busted) this.CheckBust();
  }

  /** Referee: the first two cards of equal value (king and ten included) may split, once, before any other card (Q21). */
  CheckIfCanSplit(): void {
    const values = this.NormalDeck.DeckValue;
    this.CanSplit = !this.HasSplit && !this.HasFinishedTurn && values.length === 2 && values[0] === values[1];
  }

  /** Referee: CheckBust (Player.cs:412-428): the turn ends when the only hand, or both after a split, are bust. */
  CheckBust(): void {
    const done = this.HasSplit ? this.NormalDeck.IsBust && this.SplitDeck.IsBust : this.NormalDeck.IsBust;
    if (done) this.EndTurn(ENDED_BUST);
  }

  /** Referee: EndTurn (Player.cs:255-267). */
  EndTurn(reason: number): void {
    if (this.HasFinishedTurn) return;
    this.HasFinishedTurn = true;
    this.endedBy = reason;
    this.CanSplit = false;
    this.wantNormal = false;
    this.wantSplit = false;
  }

  /** Referee: the split hands' cards, 1 s after the split (Player.cs:373-374), split hand first. */
  DealSplitCards(now: number): boolean {
    if (!this.HasSplit || this.splitDealt || now < this.splitAt + 1) return false;
    this.splitDealt = true;
    if (!this.HasFinishedTurn) {
      this.DealTo(this.SplitDeck);
      this.DealTo(this.NormalDeck);
    }
    return true;
  }

  /** Referee: ResetPlayer (Player.cs:430-448), at the start of a round. */
  ResetPlayer(): void {
    this.HasSplit = false;
    this.CanSplit = false;
    this.NormalDeck.Reset();
    this.SplitDeck.Reset();
    this.splitAt = 0;
    this.splitDealt = false;
    this.wantNormal = false;
    this.wantSplit = false;
    this.endedBy = ENDED_NONE;
    this.result = [RESULT_NONE, RESULT_NONE];
    this.inRound = this.IsActive;
    this.HasFinishedTurn = !this.IsActive;
    this.lastHitNormalAt = -Infinity;
    this.lastHitSplitAt = -Infinity;
  }

  /** Referee: ForceResetPlayer (Player.cs:578-597). Q12: every seat is freed, whoever holds it. */
  ForceResetPlayer(): void {
    this.ResetPlayer();
    this.GlobalReleaseControl(ENDED_NONE);
    this.inRound = false;
    this.endedBy = ENDED_NONE;
  }

  /** Referee: SetWinState's verdicts (Player.cs:468-576). A seat freed during the round is not settled (F61). */
  SetWinState(dealerValue: number): void {
    if (!this.IsActive || !this.inRound) {
      this.result = [RESULT_NONE, RESULT_NONE];
      return;
    }
    this.result = [SettleHand(this.NormalDeck.TotalDeckValue, dealerValue), this.HasSplit ? SettleHand(this.SplitDeck.TotalDeckValue, dealerValue) : RESULT_NONE];
  }

  /** The table's bet resets on every client after a round that settled any seat (Player.cs:575, 599-602). */
  get roundBetForTests(): number {
    return this.roundBet;
  }
}
