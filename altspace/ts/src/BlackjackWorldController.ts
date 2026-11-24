// Translated from Scripts/BlackjackWorldController.cs (Centauri2442/VRCBlackjack at 83f05db), Copyright 2022
// CentauriCore, Apache License 2.0; changed for the Altspace port (see notice.ts and altspace/PORT.md section 10).
//
// Upstream: a world object that numbers the tables and turns chips off on every table when the world's chip system
// is off. Here each snippet element is one table, and this behaviour reads the element's attributes (PORT.md 8.1)
// and has the referee write them as the table's first state. After that, state wins, as synced values did upstream.
//
//   chips          "true" turns the chip system on for this table (default off, B.prefab:7689)
//   chip-system    "false" forbids chips on this table whatever `chips` says (the world switch, default on)
//   starting-chips the starting balance (default 100); the first table on a page sets it (one balance per page)
//   decks          copies of each card per round, at least 2 (default 2)
//   helpers        "true" shows hand totals (default off)
//   manual         "true" starts in manual dealing (default off)
//   allow-change   "true" lets the table owner change chips, helpers and decks in the world (default off)
//   turn-seconds   the turn timer (default 30)
//   range          metres within which the table is live for a player (default 5; DistanceOptimizer)

import { Behaviour, type StartKind } from "../portkit/src/index.ts";
import type { ChipController } from "./ChipController.ts";
import type { Controller } from "./Controller.ts";

export class BlackjackWorldController extends Behaviour {
  // From bindings.json.
  ChipController!: ChipController;
  BlackjackTables: Controller[] = [];

  private flag(name: string, fallback: boolean): boolean {
    const value = (this.Settings.get(name) ?? "").trim().toLowerCase();
    if (value === "") return fallback;
    return value === "true" || value === "1" || value === "yes" || value === "on";
  }

  private number(name: string, fallback: number): number {
    const text = (this.Settings.get(name) ?? "").trim();
    const value = Number(text);
    return text !== "" && Number.isFinite(value) ? value : fallback;
  }

  override OnInstanceStart(_kind: StartKind): void {
    this.Apply();
  }

  override Update(): void {
    if (this.Time.frameCount % 20 === 0) this.Apply();
  }

  /** The referee writes the settings once; it does nothing after that or on other clients. */
  Apply(): void {
    if (!this.Networking.IsReferee) return;
    this.ChipController.UseChipSystem = this.flag("chip-system", true);
    for (const table of this.BlackjackTables) {
      if (table.configured) continue;
      table.Configure({
        chips: this.ChipController.UseChipSystem && this.flag("chips", false),
        decks: Math.max(2, this.number("decks", 2)),
        helpers: this.flag("helpers", false),
        manual: this.flag("manual", false),
        allowChange: this.flag("allow-change", false),
        turnSeconds: Math.max(5, this.number("turn-seconds", 30)),
      });
    }
  }
}
