// Translated from Scripts/Controller.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// The table. Upstream drives a round with delayed events on the table owner's client (the deal schedule at
// :204-215, a 2 s poll at :226-247) and announces everything by event. Here:
//   - the table owner is a field (`tableOwnerSid`), not object ownership; the referee writes all state;
//   - the round is a `phase` with a start time `t0` and a `step` counter on the shared clock, so a new referee
//     resumes a half-finished deal or dealer turn from state, and a late joiner sees the table as it is;
//   - every press is a command to the referee, checked against the table owner and the phase.
// All synced behaviours of a table share one sync group ("table"), so a state change is one atomic write.

import { Behaviour, type DeserializationResult, type Player as PlayerApi, type StartKind } from "../portkit/src/index.ts";
import type { AudioController } from "./AudioController.ts";
import type { ChipController } from "./ChipController.ts";
import { DealerShouldDraw, type Dealer } from "./Dealer.ts";
import type { DealerUIController } from "./DealerUIController.ts";
import type { DeckManager } from "./DeckManager.ts";
import type { DistanceOptimizer } from "./DistanceOptimizer.ts";
import { ENDED_LEFT, ENDED_TIMEOUT, RESULT_NONE, type Player } from "./Player.ts";

export type Phase = "idle" | "dealing" | "turns" | "dealer" | "settled";

export interface DealStep {
  /** Seconds after the round's start. */
  at: number;
  kind: "player1" | "player2" | "dealer1" | "dealer2" | "turns";
  /** Position in the round's roster (ActivePlayers), for the player steps. */
  i: number;
}

/**
 * The deal schedule of Controller.StartMatch (Controller.cs:204-215) for n seats in the round: first card to player
 * i at (i+1)/2 s; the dealer's face-down card at (n+1)/2 s; second card to player i at (i+2+n)/2 s; the dealer's
 * second card at n+1 s; turns open (StartActivePlay, and the first GameActiveRefresh) at n+2 s.
 */
export function DealSchedule(n: number): DealStep[] {
  const steps: DealStep[] = [];
  for (let i = 0; i < n; i++) {
    steps.push({ at: (i + 1) / 2, kind: "player1", i });
    steps.push({ at: (i + 2 + n) / 2, kind: "player2", i });
  }
  steps.push({ at: (n + 1) / 2, kind: "dealer1", i: -1 });
  steps.push({ at: n + 1, kind: "dealer2", i: -1 });
  steps.push({ at: n + 2, kind: "turns", i: -1 });
  return steps.sort((a, b) => a.at - b.at);
}

/** Upstream StartMatch runs 5 frames after Start Game is pressed (Controller.cs:129); a frame is one 50 ms tick here. */
export const START_DELAY = 0.25;
/** GameActiveRefresh polls every 2 s (Controller.cs:242). */
export const POLL_SECONDS = 2;

export class Controller extends Behaviour {
  /** The referee halves of the dealer-side buttons: the only names a command (or network event) may run here. */
  static override networkCallable = [
    "TakeOwnership",
    "ToggleManualPlay",
    "ActivateHelpers",
    "DeactivateHelpers",
    "ActivateChips",
    "DeactivateChips",
    "GlobalStartMatch",
    "ForceGlobalReset",
  ];
  static override synced = [
    "UsingChips",
    "GameActive",
    "ManualPlay",
    "HelpersEnabled",
    "CanChangeSettings",
    "configured",
    "tableOwnerSid",
    "tableOwnerName",
    "phase",
    "round",
    "t0",
    "step",
    "roster",
    "turnSeconds",
    "deadline",
    "nextCheckAt",
    "dealerNext",
    "resets",
  ];

  /** [UdonSynced] upstream. */
  UsingChips = false;
  /** [UdonSynced] upstream: a round is running (upstream never sent it at round start, F78; here it is). */
  GameActive = false;
  ManualPlay = false;
  HelpersEnabled = false;
  /** Upstream a local field set by the inspector; synced here so every client shows the same buttons. */
  CanChangeSettings = false;
  /** Added: the snippet's settings have been applied to this table's state. */
  configured = false;
  /** Added: the table owner (upstream: the owner of the Game Controller object). */
  tableOwnerSid = "";
  tableOwnerName = "";
  phase: Phase = "idle";
  round = 0;
  /** Added: shared-clock second the round's deal began. */
  t0 = 0;
  /** Added: schedule steps done (the deal), so a new referee does none twice. */
  step = 0;
  /** Added: seat numbers in the round, in seat order (upstream ActivePlayers). */
  roster: number[] = [];
  /** Added: the turn timer's length (upstream TimeLeft = 30). */
  turnSeconds = 30;
  /** Added: when unfinished turns end (shared clock). */
  deadline = 0;
  /** Added: the next GameActiveRefresh. */
  nextCheckAt = 0;
  /** Added: the next DealerPlay step. */
  dealerNext = 0;
  /** Added: table resets so far: every client sets its bet at this table to 0 when it changes. */
  resets = 0;

  // From bindings.json.
  ChipController!: ChipController;
  AudioController!: AudioController;
  Dealer!: Dealer;
  Players: Player[] = [];
  Deck!: DeckManager;
  DealerUI!: DealerUIController;
  Distance: DistanceOptimizer | null = null;

  private started = false;
  /** Referee: cards asked for while the deal was not ready (a hit just after a change of referee). */
  private deferred: Array<() => void> = [];
  private seen = { round: -1, phase: "" as string, resets: -1 };
  private lastResetAt = -Infinity;
  /** Where the dealer-side panels sit (the slider of DealerUIController, as two buttons: C12). Local, as upstream. */
  private panelHeight = 0.5;

  /** Upstream's local copy of GameActive (localGameActive). */
  get localGameActive(): boolean {
    return this.GameActive;
  }

  override Start(): void {
    this.Players.forEach((player, i) => (player.PlayerNum = i));
  }

  override OnInstanceStart(_kind: StartKind): void {
    this.started = true;
    if (this.Networking.IsReferee) this.Reconcile();
    this.Redraw(true);
  }

  override OnDeserialization(result: DeserializationResult): void {
    this.Redraw(result.isSnapshot);
  }

  override Update(): void {
    if (!this.started || !this.Networking.IsReferee) return;
    if (this.Time.frameCount % 20 === 0) this.Reconcile();
    this.Advance();
  }

  override OnPlayerLeft(player: PlayerApi): void {
    if (!this.Networking.IsReferee) return;
    this.Forget(player.sid);
  }

  override OnMasterTransferred(_newMaster: PlayerApi | null): void {
    if (this.Networking.IsReferee) this.Reconcile();
  }

  // ---- helpers for the other behaviours ----------------------------------------------------------------------

  Now(): number {
    return this.Networking.GetServerTimeInSeconds();
  }

  LocalSid(): string {
    return this.Networking.LocalPlayer.sid;
  }

  IsTableOwner(sid: string): boolean {
    return sid !== "" && sid === this.tableOwnerSid;
  }

  /** Settings that upstream shows only to the table owner between rounds. */
  MaySetUp(sid: string): boolean {
    return this.IsTableOwner(sid) && !this.GameActive;
  }

  /** Helpers, chips and deck count also need "allow change" (upstream CanChangeSettings). */
  MayChangeSettings(sid: string): boolean {
    return this.MaySetUp(sid) && this.CanChangeSettings;
  }

  /** Referee: sends the table's state and redraws it here (the referee's own writes are not echoed back to it). */
  Changed(): void {
    this.RequestSerialization();
    this.Redraw(false);
  }

  /** Every card on the table that anyone can see. */
  OnTable(): number[] {
    const out: number[] = [];
    for (const p of this.Players) out.push(...p.NormalDeck.cards, ...p.SplitDeck.cards);
    out.push(...this.Dealer.cards);
    return out.filter((c) => c >= 0);
  }

  /** Referee: one card from the round's deal (-1 when none is left, PENDING while the deal is not ready). */
  DrawCard(): number {
    return this.Deck.NextCard(this.OnTable());
  }

  /** The sessions of the seats in the round: they contribute to the deal (Secrets.beginDeal). */
  RoundSids(): string[] {
    const out: string[] = [];
    for (const i of this.roster) {
      const p = this.Players[i];
      if (p && p.IsActive && p.ownerSid && !out.includes(p.ownerSid)) out.push(p.ownerSid);
    }
    return out;
  }

  /** Referee: a card that could not be dealt yet (the deal was not ready), dealt by Advance once it is. */
  Defer(deal: () => void): void {
    this.deferred.push(deal);
  }

  /** Referee: the snippet's attributes become the table's first state (PORT.md 8.1). */
  Configure(settings: { chips: boolean; decks: number; helpers: boolean; manual: boolean; allowChange: boolean; turnSeconds: number }): void {
    if (!this.Networking.IsReferee || this.configured) return;
    this.configured = true;
    this.UsingChips = settings.chips;
    this.HelpersEnabled = settings.helpers;
    this.ManualPlay = settings.manual;
    this.CanChangeSettings = settings.allowChange;
    this.turnSeconds = settings.turnSeconds;
    this.Deck.NumberOfDecks = Math.max(2, Math.floor(settings.decks));
    this.Changed();
  }

  // ---- what every client draws ---------------------------------------------------------------------------------

  /**
   * Makes this client's table match the state: sounds and banners for what changed since the last call, or, with
   * `instant`, the state as found on arrival without replaying anything.
   */
  Redraw(instant: boolean): void {
    if (!this.started) return;
    const seen = this.seen;
    const fresh = seen.round === -1;
    const quiet = instant || fresh;
    if (!quiet) {
      if (this.round !== seen.round && this.GameActive) this.AudioController.PlayStartMatch();
      // Q16: once, not once per seat.
      if (this.phase === "turns" && seen.phase !== "turns" && this.round === seen.round) this.AudioController.PlayStartActivePlay();
      if (this.resets !== seen.resets) this.ChipController.ResetBet(); // ForceResetPlayer (Player.cs:596)
    }
    for (const player of this.Players) player.Apply(quiet);
    this.Dealer.Deck.InitializeDeck();
    this.DealerUI.Apply(quiet);
    // DelayedResetBet (Player.cs:575): after a round that settled any seat, every client's bet at this table is 0.
    if (!quiet && this.phase === "settled" && (seen.phase !== "settled" || seen.round !== this.round)) {
      if (this.Players.some((p) => p.result[0] !== RESULT_NONE)) this.ChipController.ResetBet();
    }
    seen.round = this.round;
    seen.phase = this.phase;
    seen.resets = this.resets;
  }

  // ---- buttons on the dealer's side ----------------------------------------------------------------------------

  /**
   * The sender of the command being run, on the referee; null for a local call, and null on any other client (a
   * network event of the same name from a modified client changes nothing there).
   */
  private Caller(): { sid: string; uid: string } | null {
    return this.Networking.IsReferee ? this.Networking.CallingSession : null;
  }

  /** "Take Control of Table" (Controller.cs:40-45), the presser's half. */
  _TakeOwnership(): void {
    this.AudioController.PlayUIInteract();
    // A method whose name starts with "_" cannot be a command (as in UdonSharp), so the referee's half drops it.
    this.SendCommand("TakeOwnership");
  }

  TakeOwnership(): void {
    const caller = this.Caller();
    const who = this.Networking.CallingPlayer;
    if (!caller || !who || this.GameActive || this.IsTableOwner(caller.sid)) return;
    this.tableOwnerSid = caller.sid;
    this.tableOwnerName = who.displayName;
    // OnOwnershipTransferred (Controller.cs:301-304): a new table owner resets the table.
    this.ResetTable();
    this.Changed();
  }

  _ToggleManualPlay(): void {
    this.AudioController.PlayUIInteract();
    this.SendCommand("ToggleManualPlay");
  }

  ToggleManualPlay(): void {
    const caller = this.Caller();
    if (!caller || !this.MaySetUp(caller.sid)) return;
    this.ManualPlay = !this.ManualPlay;
    this.Changed();
  }

  _ActivateHelpers(): void {
    this.Press("ActivateHelpers");
  }
  ActivateHelpers(): void {
    this.SetSetting(() => (this.HelpersEnabled = true));
  }
  _DeactivateHelpers(): void {
    this.Press("DeactivateHelpers");
  }
  DeactivateHelpers(): void {
    this.SetSetting(() => (this.HelpersEnabled = false));
  }
  _ActivateChips(): void {
    this.Press("ActivateChips");
  }
  ActivateChips(): void {
    this.SetSetting(() => (this.UsingChips = this.ChipController.UseChipSystem));
  }
  _DeactivateChips(): void {
    this.Press("DeactivateChips");
  }
  DeactivateChips(): void {
    this.SetSetting(() => (this.UsingChips = false));
  }

  private Press(command: string): void {
    this.AudioController.PlayUIInteract();
    this.SendCommand(command);
  }

  private SetSetting(change: () => void): void {
    const caller = this.Caller();
    if (!caller || !this.MayChangeSettings(caller.sid)) return;
    change();
    this.Changed();
  }

  /** "Start Game" (Controller.cs:91-109, then ResetDelayStart and StartMatch). Table owner only. */
  GlobalStartMatch(): void {
    if (!this.Networking.CallingSession) {
      this.SendCommand("GlobalStartMatch");
      return;
    }
    const caller = this.Caller();
    if (!caller || !this.IsTableOwner(caller.sid) || this.GameActive) return;
    if (!this.Players.some((p) => p.IsActive)) return;
    // ResetEverything (Controller.cs:111-119).
    this.Dealer.ResetEverything();
    for (const player of this.Players) player.ResetPlayer();
    this.roster = [];
    this.Players.forEach((p, i) => {
      if (p.IsActive) this.roster.push(i);
    });
    // The deal is begun by the next tick (Advance); the seated players' runtimes add their contributions while the
    // shuffle sound plays, and the schedule waits for them.
    this.deferred = [];
    this.Deck.StartRound();
    this.round = this.Deck.round;
    this.GameActive = true;
    this.phase = "dealing";
    this.t0 = this.Now() + START_DELAY;
    this.step = 0;
    this.deadline = 0;
    this.nextCheckAt = 0;
    this.dealerNext = 0;
    this.Changed();
  }

  /** "Reset Table": table owner only, at most once per 2 s (Controller.cs:271-289). */
  ForceGlobalReset(): void {
    if (!this.Networking.CallingSession) {
      this.AudioController.PlayUIInteract();
      this.SendCommand("ForceGlobalReset");
      return;
    }
    const caller = this.Caller();
    if (!caller || !this.IsTableOwner(caller.sid)) return;
    const now = this.Now();
    if (now - this.lastResetAt < 2) return;
    this.lastResetAt = now;
    this.ResetTable();
    this.Changed();
  }

  /** "Reset Chips": local, any player (Controller.cs:316-320). */
  ResetChips(): void {
    this.AudioController.PlayUIInteract();
    this.ChipController.ResetChips();
  }

  /** The dealer-height slider as two buttons (C12); local to the table owner's client, as upstream. */
  RaiseDealerPanels(): void {
    this.panelHeight = Math.min(0.99, this.panelHeight + 0.1);
    this.DealerUI.SetHeight(this.panelHeight);
  }
  LowerDealerPanels(): void {
    this.panelHeight = Math.max(0, this.panelHeight - 0.1);
    this.DealerUI.SetHeight(this.panelHeight);
  }

  // ---- the referee's work --------------------------------------------------------------------------------------

  /** Referee: ResetTable (Controller.cs:257-269). Q12: every seat is freed. The dealer's cards go too. */
  ResetTable(): void {
    this.GameActive = false;
    this.phase = "idle";
    this.step = 0;
    this.roster = [];
    for (const player of this.Players) player.ForceResetPlayer();
    this.Dealer.ResetEverything();
    this.Deck.Clear();
    this.deferred = [];
    this.resets++;
  }

  /** Referee: a player left (Player.OnPlayerLeft, Controller.OnOwnershipTransferred). */
  private Forget(sid: string): void {
    let changed = false;
    for (const player of this.Players) {
      if (player.IsActive && player.ownerSid === sid) {
        player.GlobalReleaseControl(ENDED_LEFT);
        changed = true;
      }
    }
    if (this.tableOwnerSid === sid) {
      this.TakeTableAsReferee(true);
      changed = true;
    }
    if (changed) this.Changed();
  }

  /** Referee: the referee's player becomes table owner (C17); when the old one left, the table resets (F73). */
  private TakeTableAsReferee(reset: boolean): void {
    const me = this.Networking.LocalPlayer;
    this.tableOwnerSid = me.sid;
    this.tableOwnerName = me.displayName;
    if (reset) this.ResetTable();
  }

  /** Referee: frees seats whose holder is gone and replaces a table owner who is gone. */
  Reconcile(): void {
    const present = new Set(this.Networking.GetPlayers().map((p) => p.sid));
    let changed = false;
    for (const player of this.Players) {
      if (player.IsActive && !present.has(player.ownerSid)) {
        player.GlobalReleaseControl(ENDED_LEFT);
        changed = true;
      }
    }
    if (this.tableOwnerSid === "") {
      this.TakeTableAsReferee(false);
      changed = true;
    } else if (!present.has(this.tableOwnerSid)) {
      this.TakeTableAsReferee(true);
      changed = true;
    }
    if (changed) this.Changed();
  }

  /** Referee, every tick: runs whatever the round's schedule says is due. */
  Advance(): void {
    const now = this.Now();
    let changed = false;
    // Cards come from the round's dealt draw. A new referee (the old deal is void) begins one of its own; while the
    // seated players' contributions are on their way nothing is dealt, and the schedule waits.
    let ready = false;
    if (this.phase === "dealing" || this.phase === "turns" || this.phase === "dealer") {
      if (this.Deck.EnsureSegment(this.OnTable(), this.RoundSids())) changed = true;
      const answer = this.Deck.Ready();
      if (answer === "changed") changed = true;
      ready = answer === true;
    }
    if (ready && this.deferred.length) {
      const waiting = this.deferred.splice(0);
      for (const deal of waiting) deal();
      changed = true;
    }
    if (this.phase === "dealing") {
      const steps = DealSchedule(this.roster.length);
      const next = steps[this.step];
      // Not ready: the next step moves along with the clock, so the cards come at upstream's pace once it is.
      if (!ready && next && now > this.t0 + next.at) this.t0 = now - next.at;
      while (ready && this.phase === "dealing" && this.step < steps.length && now >= this.t0 + steps[this.step]!.at) {
        this.RunStep(steps[this.step]!);
        this.step++;
        changed = true;
      }
    }
    if (this.phase === "turns") {
      for (const player of this.Players) if (player.DealSplitCards(now)) changed = true;
      if (now >= this.deadline) {
        // Player.cs:112-123: the timer ends the turn as a stand.
        for (const player of this.RoundPlayers()) {
          if (player.InTurn()) {
            player.EndTurn(ENDED_TIMEOUT);
            changed = true;
          }
        }
      }
      if (now >= this.nextCheckAt) {
        changed = true;
        this.GameActiveRefresh(now);
      }
    }
    if (this.phase === "dealer" && !ready && now > this.dealerNext) this.dealerNext = now;
    while (ready && this.phase === "dealer" && now >= this.dealerNext) {
      changed = true;
      this.DealerPlay();
    }
    if (changed) this.Changed();
  }

  private RoundPlayers(): Player[] {
    return this.roster.map((i) => this.Players[i]!).filter((p) => p !== undefined);
  }

  private RunStep(step: DealStep): void {
    if (step.kind === "player1" || step.kind === "player2") {
      // Player.StartMatch / StartMatchSecondCard: a seat freed meanwhile gets nothing (SummonCard checks HasFinishedTurn).
      const player = this.Players[this.roster[step.i]!];
      if (player && player.IsActive && player.inRound && !player.HasFinishedTurn) player.DealTo(player.NormalDeck);
    } else if (step.kind === "dealer1" || step.kind === "dealer2") {
      this.Dealer.SummonCard(this.OnTable());
    } else {
      // StartActivePlay and the first GameActiveRefresh.
      this.phase = "turns";
      const turnsAt = this.t0 + step.at;
      this.deadline = turnsAt + this.turnSeconds;
      this.nextCheckAt = turnsAt;
    }
  }

  /** GameActiveRefresh (Controller.cs:226-247): when every seat in the round has finished, the dealer plays. */
  private GameActiveRefresh(now: number): void {
    if (this.RoundPlayers().every((p) => p.HasFinishedTurn)) {
      this.phase = "dealer";
      this.dealerNext = now;
      return;
    }
    while (this.nextCheckAt <= now) this.nextCheckAt += POLL_SECONDS;
  }

  /** DealerPlay (Dealer.cs:61-94), one step: flip; 1 s later draw every 0.5 s while under 17; then finish. */
  private DealerPlay(): void {
    const dealer = this.Dealer;
    if (!dealer.flipped) {
      dealer.Flip(this.OnTable());
      this.dealerNext += 1;
      return;
    }
    if (DealerShouldDraw(dealer.TotalDeckValue, dealer.IsBust)) {
      const before = dealer.cards.length;
      dealer.SummonCard(this.OnTable());
      this.dealerNext += 0.5;
      if (dealer.cards.length > before) return;
    }
    this.FinishMatch();
  }

  /** FinishMatch and GlobalFinishMatch (Controller.cs:249-255, 291-299): the verdicts go into state. */
  private FinishMatch(): void {
    this.GameActive = false;
    this.phase = "settled";
    for (const player of this.Players) player.SetWinState(this.Dealer.TotalDeckValue);
    this.Deck.RevealSeed();
  }
}
