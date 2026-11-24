// Translated from Scripts/PlayerUIController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// A seat's panels and animators. Upstream sets animator triggers as events arrive, so a client that missed an event
// shows the wrong thing (Q7, Q8). Here `Apply` compares the seat's state with what this client last showed and calls
// the same upstream methods for what changed; on arrival (`instant`) it puts the animators into the state's
// position without sounds. The animator calls reach the kit through the relay graph.

import { Behaviour, type AnimatorRef, type GameObject, type TextRef } from "../portkit/src/index.ts";
import { ENDED_BUST, RESULT_DRAW, RESULT_LOSE, RESULT_NONE, RESULT_WIN, type Player } from "./Player.ts";

interface Seen {
  round: number;
  cards: number;
  startGame: boolean;
  turn: boolean;
  split: boolean;
  normalBust: boolean;
  splitBust: boolean;
  finished: boolean;
  bustEnd: boolean;
  wantNormal: boolean;
  wantSplit: boolean;
  result0: number;
  result1: number;
}

function freshSeen(round: number): Seen {
  return { round, cards: 0, startGame: false, turn: false, split: false, normalBust: false, splitBust: false, finished: false, bustEnd: false, wantNormal: false, wantSplit: false, result0: RESULT_NONE, result1: RESULT_NONE };
}

export class PlayerUIController extends Behaviour {
  Running = true;

  // From bindings.json.
  PlayerController!: Player;
  OwnerUI: GameObject | null = null;
  DealerUI: GameObject | null = null;
  NotOwnerUI: GameObject | null = null;
  PlayerName: GameObject | null = null;
  PlayerUIAnimator: AnimatorRef | null = null;
  DealerUIAnimator: AnimatorRef | null = null;
  PlayerOwner: TextRef | null = null;
  NormalHelper: TextRef | null = null;
  SplitHelper: TextRef | null = null;

  private isStood = false;
  private seen: Seen = freshSeen(-1);
  private readonly actives = new Map<GameObject, boolean>();

  private SetActive(obj: GameObject | null, on: boolean): void {
    if (!obj || this.actives.get(obj) === on) return;
    this.actives.set(obj, on);
    obj.SetActive(on);
  }

  /** Upstream Update (PlayerUIController.cs:57-119): which panels this client shows, and the helper totals. */
  override Update(): void {
    const p = this.PlayerController;
    const ctrl = p?.BlackjackController;
    if (!ctrl) return;
    if (!this.Running) {
      this.SetActive(this.OwnerUI, false);
      this.SetActive(this.NotOwnerUI, false);
      this.SetActive(this.DealerUI, false);
      this.SetActive(this.PlayerName, false);
      return;
    }
    const isOwner = p.isOwner;
    this.SetActive(this.OwnerUI, isOwner);
    this.SetActive(this.NotOwnerUI, !isOwner && !p.IsActive && !ctrl.localGameActive);
    this.SetActive(this.DealerUI, ctrl.IsTableOwner(ctrl.LocalSid()) && ctrl.ManualPlay);
    this.SetActive(this.PlayerName, !isOwner && p.IsActive);
    if (this.PlayerOwner) this.PlayerOwner.text = p.ownerName;
    const helpers = ctrl.HelpersEnabled;
    if (this.NormalHelper) {
      this.SetActive(this.NormalHelper.gameObject, helpers);
      const v = p.NormalDeck.TotalDeckValue;
      this.NormalHelper.text = helpers && v > 0 ? String(v) : "";
    }
    if (this.SplitHelper) {
      this.SetActive(this.SplitHelper.gameObject, helpers);
      const v = p.SplitDeck.TotalDeckValue;
      this.SplitHelper.text = helpers && v > 0 ? String(v) : "";
    }
  }

  /** Called by Player.Apply on every client after the seat's state changed. */
  Apply(instant: boolean): void {
    const p = this.PlayerController;
    const ctrl = p.BlackjackController;
    const audio = ctrl.AudioController;
    if (ctrl.round !== this.seen.round) {
      // ResetPlayer at the start of a round (Player.cs:430-448), on every client.
      if (!instant && this.seen.round !== -1) this.ResetAnimator();
      this.seen = freshSeen(ctrl.round);
    }
    const s = this.seen;

    // One draw sound per new card on this seat (Q17: the hitter heard it twice). A split moves a card; it adds none.
    const cards = p.NormalDeck.cards.length + p.SplitDeck.cards.length;
    if (!instant) for (let k = s.cards; k < cards; k++) audio.PlayDrawCard();
    s.cards = cards;

    // The holder's controls (StartMatchSecondCard, StartTurn, CheckIfCanSplit) on the holder's client only.
    if (p.isOwner && p.inRound && p.NormalDeck.cards.length >= 2 && !s.startGame) {
      s.startGame = true;
      this.StartGame();
    }
    this.CanSplit(p.isOwner && p.myTurn && p.CanSplit && p.SplitAffordable());
    this.Active(p.myTurn);
    this.MyTurn(p.myTurn);
    const turnOpen = ctrl.phase === "turns" && p.inRound && !p.HasFinishedTurn;
    if (turnOpen && !s.turn) {
      s.turn = true;
      if (p.isOwner) this.PlayerUIAnimator?.ResetTrigger("Reset");
      if (ctrl.IsTableOwner(ctrl.LocalSid())) this.ActivateDealerUI();
    }

    if (p.HasSplit && !s.split) {
      s.split = true;
      this.SplitDeck();
    }
    if (p.NormalDeck.IsBust && !s.normalBust) {
      s.normalBust = true;
      this.NormalBust();
    }
    if (p.SplitDeck.IsBust && !s.splitBust) {
      s.splitBust = true;
      this.SplitBust();
    }
    if (p.inRound && p.HasFinishedTurn && !s.finished && ctrl.round > 0) {
      s.finished = true;
      // EndTurn on every client (Player.cs:255-267), and Bust's sound when that is how it ended (Player.cs:403-410).
      if (p.endedBy === ENDED_BUST && !instant) audio.PlayBust();
      this.Active(false);
      this.MyTurn(false);
      this.Stand();
    }

    if (p.wantNormal !== s.wantNormal) {
      if (p.wantNormal && !instant) audio.PlayDealerWantToHit();
      s.wantNormal = p.wantNormal;
    }
    if (p.wantSplit !== s.wantSplit) {
      if (p.wantSplit && !instant) audio.PlayDealerWantToHit();
      s.wantSplit = p.wantSplit;
    }
    this.SetWantToHitNormal(p.wantNormal);
    this.SetWantToHitSplit(p.wantSplit);

    // SetWinState's banners, for everyone (Q7: upstream showed the split hand's banner on the splitter's client only).
    if (p.result[0] !== s.result0) {
      s.result0 = p.result[0]!;
      if (s.result0 === RESULT_WIN) this.SetWin();
      else if (s.result0 === RESULT_DRAW) this.SetDraw();
      else if (s.result0 === RESULT_LOSE) this.SetLose();
    }
    if (p.result[1] !== s.result1) {
      s.result1 = p.result[1]!;
      if (s.result1 === RESULT_WIN) this.SplitWin();
      else if (s.result1 === RESULT_DRAW) this.SplitDraw();
      else if (s.result1 === RESULT_LOSE) this.SplitLose();
    }
  }

  // ---- upstream's methods (PlayerUIController.cs:121-272) -------------------------------------------------------

  CanSplit(value: boolean): void {
    this.PlayerUIAnimator?.SetBool("CanSplit", value);
  }

  HasSplit(value: boolean): void {
    this.PlayerUIAnimator?.SetBool("HasSplit", value);
    this.DealerUIAnimator?.SetBool("Split", true);
  }

  MyTurn(value: boolean): void {
    this.PlayerUIAnimator?.SetBool("MyTurn", value);
  }

  Active(value: boolean): void {
    this.PlayerUIAnimator?.SetBool("Active", value);
  }

  ActivateDealerUI(): void {
    this.DealerUIAnimator?.SetTrigger("Activate");
  }

  ResetAnimator(): void {
    const a = this.PlayerUIAnimator;
    a?.ResetTrigger("Win");
    a?.ResetTrigger("Draw");
    a?.ResetTrigger("Lose");
    a?.SetTrigger("Reset");
    a?.SetBool("CanSplit", false);
    a?.SetBool("HasSplit", false);
    a?.ResetTrigger("StartGame");
    a?.ResetTrigger("ResetBust");
    const d = this.DealerUIAnimator;
    d?.SetBool("Stood", false);
    d?.SetBool("Split", false);
    d?.SetBool("NormalBust", false);
    d?.SetBool("SplitBust", false);
    d?.CrossFade("Active.PlayerDealerIdleOff", 0);
    this.isStood = false;
    this.SetWantToHitNormal(false);
    this.SetWantToHitSplit(false);
  }

  SetWin(): void {
    this.PlayerUIAnimator?.SetTrigger("ResetBust");
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("Win");
  }

  SetDraw(): void {
    this.PlayerUIAnimator?.SetTrigger("ResetBust");
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("Draw");
  }

  SetLose(): void {
    this.PlayerUIAnimator?.SetTrigger("ResetBust");
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("Lose");
  }

  SplitDeck(): void {
    this.PlayerUIAnimator?.SetTrigger("Split");
    this.HasSplit(true);
  }

  NormalBust(): void {
    this.PlayerUIAnimator?.SetTrigger("NormalBust");
    this.DealerUIAnimator?.SetBool("NormalBust", true);
  }

  SplitBust(): void {
    this.PlayerUIAnimator?.SetTrigger("SplitBust");
    this.DealerUIAnimator?.SetBool("SplitBust", true);
  }

  SplitWin(): void {
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("SplitWin");
  }

  SplitDraw(): void {
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("SplitDraw");
  }

  SplitLose(): void {
    this.PlayerUIAnimator?.ResetTrigger("StartGame");
    this.PlayerUIAnimator?.SetTrigger("SplitLose");
  }

  StartGame(): void {
    this.PlayerUIAnimator?.SetTrigger("StartGame");
  }

  Stand(): void {
    this.DealerUIAnimator?.SetBool("Stood", true);
    this.DealerUIAnimator?.SetBool("Split", false);
    this.SetWantToHitNormal(false);
    this.SetWantToHitSplit(false);
    if (!this.isStood && this.PlayerController.BlackjackController.localGameActive) {
      this.SendCustomEventDelayedSeconds("StandDelayed", 0.75);
      this.isStood = true;
    }
  }

  StandDelayed(): void {
    this.SetWantToHitNormal(false);
    this.SetWantToHitSplit(false);
    this.DealerUIAnimator?.SetTrigger("Deactivate");
  }

  SetWantToHitNormal(value: boolean): void {
    this.DealerUIAnimator?.SetBool("WantToHitNormal", this.isStood ? false : value);
  }

  SetWantToHitSplit(value: boolean): void {
    this.DealerUIAnimator?.SetBool("WantToHitSplit", this.isStood ? false : value);
  }
}
