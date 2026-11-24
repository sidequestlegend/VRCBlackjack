// Translated from Scripts/ChipController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Chips are each player's own and local, as upstream: never synced, never saved (upstream starts every world load
// at StartingChips, so this port saves nothing either), and nobody else sees a balance or a bet. Upstream has one
// ChipController per world serving every table; a snippet's instances share a page, so here every table's
// ChipController behaviour uses one ChipBank per page (keyed by the local session: the runtime has no object that
// all instances of a page share, see PORT.md "Runtime gaps").

import { Behaviour, type AudioClipRef, type AudioSourceRef } from "../portkit/src/index.ts";

/** Upstream ChipController's arithmetic (ChipController.cs:38-110), with the table as a key. */
export class ChipBank<T = unknown> {
  CurrentChipCount: number;
  StartingChips: number;
  readonly CurrentBet = new Map<T, number>();
  /** Stands in for AudioSource.isPlaying and PlayOneShot. */
  isPlaying: () => boolean = () => false;
  play: (clip: "AddToBet" | "NotEnoughChips") => void = () => {};

  constructor(startingChips: number) {
    this.StartingChips = startingChips;
    this.CurrentChipCount = startingChips;
  }

  Bet(table: T): number {
    return this.CurrentBet.get(table) ?? 0;
  }

  AddChips(value: number): void {
    this.CurrentChipCount += value;
  }

  RemoveChips(value: number): void {
    this.CurrentChipCount -= value;
  }

  ResetChips(): void {
    this.CurrentChipCount = this.StartingChips;
    for (const table of this.CurrentBet.keys()) this.CurrentBet.set(table, 0);
  }

  /** True when the bets on every table plus `value` stay within the chips. */
  CanAddToBet(value: number): boolean {
    let totalBet = 0;
    for (const bet of this.CurrentBet.values()) totalBet += bet;
    return totalBet + value <= this.CurrentChipCount;
  }

  /** Refused (with the low bleep) when the bets on all tables plus `value` would exceed the chips. */
  AddToBet(table: T, value: number): boolean {
    if (!this.CanAddToBet(value)) {
      this.NotEnoughChips();
      return false;
    }
    this.CurrentBet.set(table, this.Bet(table) + value);
    if (!this.isPlaying()) this.play("AddToBet");
    return true;
  }

  /** As upstream: bleeps but still subtracts when the bet would go below 0 (the seat's buttons check first). */
  TakeFromBet(table: T, value: number): void {
    if (this.Bet(table) - value < 0) this.NotEnoughChips();
    this.CurrentBet.set(table, this.Bet(table) - value);
    this.play("AddToBet");
  }

  ResetBet(table: T): void {
    this.CurrentBet.set(table, 0);
  }

  NotEnoughChips(): void {
    if (this.isPlaying()) return;
    this.play("NotEnoughChips");
  }
}

/** One bank per page: every table on the page plays from the same chips (upstream: one per world). */
const BANKS = new Map<string, ChipBank<ChipController>>();

/** Roughly the length of the chip clips, for upstream's `if (!Audio.isPlaying)` checks. */
const CLIP_SECONDS = 0.35;

export class ChipController extends Behaviour {
  // From bindings.json (upstream fields of the same names).
  UseChipSystem = true;
  StartingChips = 100;
  Audio: AudioSourceRef | null = null;
  NotEnoughChipsClip: AudioClipRef | null = null;
  AddToBetClip: AudioClipRef | null = null;

  private playingUntil = -Infinity;
  private cached: ChipBank<ChipController> | null = null;

  /** The page's bank, made by the first table that asks, with that table's starting chips. */
  get Bank(): ChipBank<ChipController> {
    if (this.cached) return this.cached;
    const key = this.Networking.LocalPlayer.sid;
    let bank = BANKS.get(key);
    if (!bank) {
      const setting = Number(this.Settings.get("starting-chips"));
      bank = new ChipBank<ChipController>(Number.isFinite(setting) && setting > 0 ? Math.floor(setting) : this.StartingChips);
      BANKS.set(key, bank);
    }
    if (!bank.CurrentBet.has(this)) bank.CurrentBet.set(this, 0);
    this.cached = bank;
    return bank;
  }

  get CurrentChipCount(): number {
    return this.Bank.CurrentChipCount;
  }

  /** This table's bet (upstream CurrentBet[TableIndex]). */
  GetBet(): number {
    return this.Bank.Bet(this);
  }

  private wire(): ChipBank<ChipController> {
    const bank = this.Bank;
    bank.isPlaying = () => this.Time.time < this.playingUntil;
    bank.play = (clip) => {
      const ref = clip === "AddToBet" ? this.AddToBetClip : this.NotEnoughChipsClip;
      if (ref) this.Audio?.PlayOneShot(ref);
      this.playingUntil = this.Time.time + CLIP_SECONDS;
    };
    return bank;
  }

  AddChips(value: number): void {
    this.Bank.AddChips(value);
  }
  RemoveChips(value: number): void {
    this.Bank.RemoveChips(value);
  }
  ResetChips(): void {
    this.Bank.ResetChips();
  }
  CanAddToBet(value: number): boolean {
    return this.Bank.CanAddToBet(value);
  }
  AddToBet(value: number): boolean {
    return this.wire().AddToBet(this, value);
  }
  TakeFromBet(value: number): void {
    this.wire().TakeFromBet(this, value);
  }
  ResetBet(): void {
    this.Bank.ResetBet(this);
  }
  NotEnoughChips(): void {
    this.wire().NotEnoughChips();
  }

  override OnDestroy(): void {
    this.cached?.CurrentBet.delete(this);
  }
}
