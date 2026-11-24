// The game's definition: the slug and the classes bindings.json names by `type`. The build reads the default export.
//
// A port of Centauri2442/VRCBlackjack (Apache License 2.0, Copyright 2022 CentauriCore); see notice.ts.

import type { GameDefinition } from "../portkit/src/index.ts";
import { AudioController } from "./AudioController.ts";
import { BlackjackWorldController } from "./BlackjackWorldController.ts";
import { ChipController } from "./ChipController.ts";
import { Controller } from "./Controller.ts";
import { CreditsPanel } from "./CreditsPanel.ts";
import { Dealer } from "./Dealer.ts";
import { DealerUIController } from "./DealerUIController.ts";
import { DeckManager } from "./DeckManager.ts";
import { DisableFixer } from "./DisableFixer.ts";
import { DistanceOptimizer } from "./DistanceOptimizer.ts";
import { Interactable } from "./Interactable.ts";
import { InteractableController } from "./InteractableController.ts";
import { Player } from "./Player.ts";
import { PlayerDeck } from "./PlayerDeck.ts";
import { PlayerUIController } from "./PlayerUIController.ts";

const game: GameDefinition = {
  slug: "blackjack",
  behaviours: {
    AudioController,
    BlackjackWorldController,
    ChipController,
    Controller,
    CreditsPanel,
    Dealer,
    DealerUIController,
    DeckManager,
    DisableFixer,
    DistanceOptimizer,
    Interactable,
    InteractableController,
    Player,
    PlayerDeck,
    PlayerUIController,
  },
};

export default game;
