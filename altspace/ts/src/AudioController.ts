// Translated from Scripts/AudioController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022 CentauriCore,
// Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// The table's sounds. Clip fields are `$clip` indices into the clip list on the table's audio source. Upstream moves
// the source every frame to the point of a box nearest the listener; here it stays at the table (C10). Sounds are
// played by each client when it sees the state change that upstream hung them on (C19).

import { Behaviour, type AudioClipRef, type AudioSourceRef } from "../portkit/src/index.ts";

export class AudioController extends Behaviour {
  /** Set by DistanceOptimizer: the local player is near enough to hear the table. */
  isActive = true;

  // From bindings.json.
  Audio: AudioSourceRef | null = null;
  StartMatch: AudioClipRef | null = null;
  StartActivePlay: AudioClipRef | null = null;
  DrawCard: AudioClipRef[] = [];
  SplitDeck: AudioClipRef | null = null;
  Stand: AudioClipRef | null = null;
  WinMatch: AudioClipRef | null = null;
  LoseMatch: AudioClipRef | null = null;
  DrawMatch: AudioClipRef | null = null;
  DealerWantToHit: AudioClipRef | null = null;
  Bust: AudioClipRef | null = null;
  TakeControl: AudioClipRef | null = null;
  ReleaseControl: AudioClipRef | null = null;
  FlipCard: AudioClipRef[] = [];
  UIInteract: AudioClipRef | null = null;

  /** Every clip asked for, by field name, for tests (the relay records the clip index too). */
  readonly played: string[] = [];

  private Play(name: string, clip: AudioClipRef | null | undefined, always = false): void {
    if (!this.isActive && !always) return;
    this.played.push(name);
    if (clip) this.Audio?.PlayOneShot(clip);
  }

  PlayStartMatch(): void {
    this.Play("StartMatch", this.StartMatch);
  }
  PlayStartActivePlay(): void {
    this.Play("StartActivePlay", this.StartActivePlay);
  }
  PlayDrawCard(): void {
    this.Play("DrawCard", this.DrawCard.length ? this.DrawCard[this.Random.RangeInt(0, this.DrawCard.length)] : null);
  }
  PlaySplitDeck(): void {
    this.Play("SplitDeck", this.SplitDeck);
  }
  PlayStand(): void {
    this.Play("Stand", this.Stand);
  }
  PlayWinMatch(): void {
    this.Play("WinMatch", this.WinMatch);
  }
  PlayLoseMatch(): void {
    this.Play("LoseMatch", this.LoseMatch);
  }
  PlayDrawMatch(): void {
    this.Play("DrawMatch", this.DrawMatch);
  }
  PlayDealerWantToHit(): void {
    this.Play("DealerWantToHit", this.DealerWantToHit);
  }
  PlayBust(): void {
    this.Play("Bust", this.Bust);
  }
  PlayTakeControl(): void {
    this.Play("TakeControl", this.TakeControl);
  }
  PlayReleaseControl(): void {
    this.Play("ReleaseControl", this.ReleaseControl);
  }
  PlayFlipCard(): void {
    this.Play("FlipCard", this.FlipCard.length ? this.FlipCard[this.Random.RangeInt(0, this.FlipCard.length)] : null);
  }
  /** The click of a dealer-side button: heard by the presser even out of range (AudioController.cs:129-132). */
  PlayUIInteract(): void {
    this.Play("UIInteract", this.UIInteract, true);
  }
}
