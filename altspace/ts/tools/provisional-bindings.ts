// Writes a PROVISIONAL bindings.json from the object model in altspace/PORT.md section 5 (upstream's hierarchy and
// field wiring), so the rules can be tested before the kit exists. The kit builder (BlackjackKitBuilder.cs, not
// written yet) replaces this file with the real one; object paths here are upstream's names and may change.
//
//   node tools/provisional-bindings.ts

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Json = Record<string, unknown>;
const objects: Record<string, Json> = {};
const refs: string[] = [];
const behaviours: Json[] = [];
const events: Json[] = [];

/** An object; `ref`: the relay graph acts on it (text, animator, active, material, press animation). */
function obj(key: string, path: string, opts: { click?: boolean; ref?: boolean } = {}): string {
  objects[key] = { path, sync: "none", grab: false, click: opts.click === true, seat: false };
  if (opts.ref !== false && !opts.click) refs.push(key);
  return key;
}
const $obj = (key: string) => ({ $obj: key });
const $beh = (id: string) => ({ $beh: id });
const $comp = (key: string, kind: string) => ({ $comp: key, kind });
const click = (object: string, behaviour: string, method: string) => events.push({ object, kind: "click", behaviour, method });

const SEATS = 7;
const CARDS = 11;

// ---- the table (B.prefab) ------------------------------------------------------------------------------------------
const DUI = "Dealer/Dealer UI Controller";
const AUTO = `${DUI}/Auto Canvas`;
const MANUAL = `${DUI}/Manual Canvas`;
const MDC = `${MANUAL}/Manual Dealer Canvas`;
obj("controller", "Game Controller", { ref: false });
obj("deck", "Deck", { ref: false });
obj("dealer", "Dealer", { ref: false });
obj("dealerUI", DUI, { ref: false });
obj("audioController", "Audio Controller", { ref: false });
obj("audio", "Audio Controller/Audio", { ref: false });
obj("chipAudio", "Chip Controller/Audio", { ref: false });
obj("distance", "Distance Optimizer", { ref: false });
obj("tableCanvas", `${DUI}/Dealer Table Canvas`);
obj("autoCanvas", AUTO);
obj("autoOwner", `${AUTO}/Mask/Owner`);
obj("autoIdle", `${AUTO}/Mask/Idle`);
obj("manualCanvas", MANUAL);
obj("manualOwner", `${MDC}/Mask/Owner`);
obj("manualNotOwner", `${MDC}/Mask/Not Owner`);
obj("heightGroup", `${MDC}/Mask/Height Adjustment`);
obj("heightAnim", `${MANUAL}/Height Adjustment`);
obj("manualSettings", `${MANUAL}/Settings`);
obj("resetButton", `${DUI}/Reset Button`);
obj("dealerCamera", "Dealer Camera");
obj("dealerValuesCanvas", "Dealer Camera/Dealer Card Canvas");
obj("dealerValues", "Dealer Camera/Dealer Card Canvas/Dealer Values");
for (const [prefix, base] of [
  ["", `${AUTO}/Mask/Owner/Game Settings`],
  ["m", `${MANUAL}/Settings`],
] as const) {
  obj(`${prefix}helpersChanger`, `${base}/Helpers`);
  obj(`${prefix}chipToggle`, `${base}/Use Chips`);
  obj(`${prefix}deckChanger`, `${base}/Deck Count`);
  obj(`${prefix}deckCount`, `${base}/Deck Count/Count/Text`);
  obj(`${prefix}deckSubArrow`, `${base}/Deck Count/Subtract/Arrow`);
  // The toggles are buttons and are shown or hidden, so they are both clickable and relay targets.
  for (const [key, name] of [
    ["helpersOnBtn", "Helpers/Use Helpers On"],
    ["helpersOffBtn", "Helpers/Use Helpers Off"],
    ["chipsOnBtn", "Use Chips/Use Chips On"],
    ["chipsOffBtn", "Use Chips/Use Chips Off"],
  ] as const) {
    obj(`${prefix}${key}`, `${base}/${name}`, { click: true });
    refs.push(`${prefix}${key}`);
  }
  obj(`${prefix}deckAdd`, `${base}/Deck Count/Add`, { click: true });
  obj(`${prefix}deckSub`, `${base}/Deck Count/Subtract`, { click: true });
}
obj("takeOwnership", `${AUTO}/Mask/Idle/Take Ownership`, { click: true });
obj("takeOwnershipManual", `${MDC}/Mask/Not Owner/Take Ownership`, { click: true });
obj("startGame", `${AUTO}/Mask/Owner/Start Game`, { click: true });
obj("startGameManual", `${MDC}/Mask/Owner/Start Game`, { click: true });
obj("swapToManual", `${AUTO}/Mask/Owner/Game Settings/Manual Play/Swap to Manual`, { click: true });
obj("swapToAuto", `${MDC}/Mask/Owner/Swap to AI Play`, { click: true });
obj("heightUp", `${MDC}/Mask/Height Adjustment/Up`, { click: true });
obj("heightDown", `${MDC}/Mask/Height Adjustment/Down`, { click: true });
obj("resetTable", `${DUI}/Reset Button/Take Ownership`, { click: true });
obj("resetChips", `${DUI}/Reset Button/Reset Chips`, { click: true });
for (let k = 0; k < CARDS; k++) obj(`d${k}`, `Dealer/Card Positions/${k + 1}/Card`);

// ---- the seats (P0.prefab, seven instances) -------------------------------------------------------------------------
const BUTTONS = [
  ["Join", "Join Game", "_TakeControl", "Player UI/Not Owner UI/Player Idle/JOIN"],
  ["Stand", "Stand", "Stand", "Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND"],
  ["Split", "Split", "Split", "Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT"],
  ["HitSplit", "Hit Split", "_AutoSplitHitMe", "Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT"],
  ["HitNormal", "Hit Normal", "_AutoNormalHitMe", "Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL"],
  ["Leave", "Leave Game", "ReleaseControl", "Player UI/Owner UI/Player UI Canvas (1)/LEAVE"],
  ["Add10", "Add 10", "_Add10ToBet", "Chip Panel/Add 10"],
  ["Add5", "Add 5", "_Add5ToBet", "Chip Panel/Add 5"],
  ["Remove10", "Remove 10", "_Remove10FromBet", "Chip Panel/Remove 10"],
  ["Remove5", "Remove 5", "_Remove5FromBet", "Chip Panel/Remove 5"],
] as const;
const IC_FIELDS: Record<string, string> = { Join: "JoinGame", Stand: "Stand", Split: "Split", HitSplit: "HitSplit", HitNormal: "HitNormal", Leave: "LeaveGame", Add10: "Add10", Add5: "Add5", Remove10: "Remove10", Remove5: "Remove5" };

for (let i = 0; i < SEATS; i++) {
  const p = `p${i}`;
  const base = `Players/Players/Player ${i}`;
  const UI = `${base}/Player UI/Player UI Canvas/Player UI`;
  const DP = `${base}/Dealer Player UI Canvas`;
  obj(p, base, { ref: false });
  obj(`${p}_nd`, `${base}/Normal Deck`, { ref: false });
  obj(`${p}_sd`, `${base}/Split Deck`, { ref: false });
  obj(`${p}_ui`, `${base}/Player UI`, { ref: false });
  obj(`${p}_ic`, `${base}/Interactable Controller`, { ref: false });
  obj(`${p}_uiAnim`, UI);
  obj(`${p}_ownerUI`, `${base}/Player UI/Owner UI`);
  obj(`${p}_notOwnerUI`, `${base}/Player UI/Not Owner UI/Player Idle`);
  obj(`${p}_nameObj`, `${base}/Player UI/Not Owner UI/Player Name`);
  obj(`${p}_nameText`, `${base}/Player UI/Not Owner UI/Player Name/Text`);
  obj(`${p}_normalHelper`, `${UI}/Player/Normal Adjustment/HELPER`);
  obj(`${p}_splitHelper`, `${UI}/Player/Split Adjustment/HELPER`);
  obj(`${p}_timer`, `${UI}/Player/Timer`);
  obj(`${p}_dealerCanvas`, DP);
  obj(`${p}_dealerMask`, `${DP}/Mask`);
  obj(`${p}_dealerName`, `${DP}/Mask/PLAYER NAME`);
  obj(`${p}_normalCount`, `${DP}/Mask/Normal/COUNT`);
  obj(`${p}_splitCount`, `${DP}/Mask/Split/COUNT`);
  obj(`${p}_dHitNormal`, `${DP}/Mask/Normal/HIT`, { click: true });
  obj(`${p}_dHitSplit`, `${DP}/Mask/Split/HIT`, { click: true });
  obj(`${p}_dStand`, `${DP}/Mask/Stand`, { click: true });
  obj(`${p}_chips`, `${base}/Chip Panel`);
  obj(`${p}_currentBet`, `${base}/Chip Panel/Current Bet`);
  obj(`${p}_totalChips`, `${base}/Chip Panel/Total Chips`);
  for (const [key, , , viz] of BUTTONS) obj(`${p}_viz${key}`, `${base}/${viz}`);
  for (const [key, box] of BUTTONS) obj(`${p}_b${key}`, `${base}/Interactable Controller/${box}`, { click: true });
  for (let k = 0; k < CARDS; k++) {
    obj(`${p}_n${k}`, `${base}/Card Position Animator/Positions/${k + 1}/Card`);
    obj(`${p}_s${k}`, `${base}/Card Position Animator/Split Positions/${k + 1}/Card`);
  }
}

// ---- behaviours ---------------------------------------------------------------------------------------------------
const seatIds = Array.from({ length: SEATS }, (_, i) => `p${i}`);
const audioClips = (from: number, count: number) => Array.from({ length: count }, (_, k) => ({ $clip: from + k }));
behaviours.push({
  id: "world",
  type: "BlackjackWorldController",
  fields: { ChipController: $beh("chips"), BlackjackTables: [$beh("ctrl")] },
});
behaviours.push({
  id: "chips",
  type: "ChipController",
  object: "chipAudio",
  fields: { UseChipSystem: true, StartingChips: 100, Audio: $comp("chipAudio", "AudioSource"), NotEnoughChipsClip: { $clip: 0 }, AddToBetClip: { $clip: 1 } },
});
behaviours.push({
  id: "ctrl",
  type: "Controller",
  object: "controller",
  group: "table",
  fields: {
    ChipController: $beh("chips"),
    AudioController: $beh("audio"),
    Dealer: $beh("dealer"),
    Players: seatIds.map($beh),
    Deck: $beh("deck"),
    DealerUI: $beh("dealerUI"),
    Distance: $beh("distance"),
  },
});
behaviours.push({ id: "deck", type: "DeckManager", object: "deck", group: "table", fields: { BlackjackController: $beh("ctrl") } });
behaviours.push({
  id: "dealer",
  type: "Dealer",
  object: "dealer",
  group: "table",
  fields: { GameController: $beh("ctrl"), Deck: $beh("deck"), DealerUI: $beh("dealerUI") },
});
const range = (n: number) => Array.from({ length: n }, (_, k) => k);
behaviours.push({
  id: "dealerUI",
  type: "DealerUIController",
  object: "dealerUI",
  fields: {
    BlackjackController: $beh("ctrl"),
    DealerController: $beh("dealer"),
    AutoCanvas: $obj("autoCanvas"),
    AutoCanvasAnimator: $comp("autoCanvas", "Animator"),
    OwnerUI: $obj("autoOwner"),
    ManualOwnerUI: $obj("manualOwner"),
    ManualOwnerSettings: $obj("manualSettings"),
    ManualNotOwnerUI: $obj("manualNotOwner"),
    OwnerSlider: $obj("heightGroup"),
    UIHeightAnimator: $comp("heightAnim", "Animator"),
    DeckCount: $comp("deckCount", "TMP"),
    DeckCountManual: $comp("mdeckCount", "TMP"),
    NotOwnerUI: $obj("autoIdle"),
    TableUIAnimator: $comp("tableCanvas", "Animator"),
    // C18: "On" is the button that shows while the setting is on (upstream's ChipOn points at "Use Chips Off").
    ChipToggle: $obj("chipToggle"),
    ChipOn: $obj("chipsOffBtn"),
    ChipOff: $obj("chipsOnBtn"),
    DeckChanger: $obj("deckChanger"),
    DeckSubtractArrow: $obj("deckSubArrow"),
    HelpersChanger: $obj("helpersChanger"),
    HelpersOn: $obj("helpersOffBtn"),
    HelpersOff: $obj("helpersOnBtn"),
    ChipToggleManual: $obj("mchipToggle"),
    ChipOnManual: $obj("mchipsOffBtn"),
    ChipOffManual: $obj("mchipsOnBtn"),
    DeckChangerManual: $obj("mdeckChanger"),
    DeckSubtractArrowManual: $obj("mdeckSubArrow"),
    HelpersChangerManual: $obj("mhelpersChanger"),
    HelpersOnManual: $obj("mhelpersOffBtn"),
    HelpersOffManual: $obj("mhelpersOnBtn"),
    DealerValuesCanvas: $obj("dealerValuesCanvas"),
    DealerValues: $comp("dealerValues", "TMP"),
    Slots: range(CARDS).map((k) => $obj(`d${k}`)),
    SlotRenderers: range(CARDS).map((k) => $comp(`d${k}`, "Renderer")),
    SlotAnimators: range(CARDS).map((k) => $comp(`d${k}`, "Animator")),
  },
});
behaviours.push({
  id: "audio",
  type: "AudioController",
  object: "audioController",
  fields: {
    Audio: $comp("audio", "AudioSource"),
    StartMatch: { $clip: 0 },
    StartActivePlay: { $clip: 1 },
    SplitDeck: { $clip: 2 },
    Stand: { $clip: 3 },
    WinMatch: { $clip: 4 },
    LoseMatch: { $clip: 5 },
    DrawMatch: { $clip: 6 },
    DealerWantToHit: { $clip: 7 },
    Bust: { $clip: 8 },
    TakeControl: { $clip: 9 },
    ReleaseControl: { $clip: 10 },
    UIInteract: { $clip: 11 },
    DrawCard: audioClips(12, 35),
    FlipCard: audioClips(47, 48),
  },
});
behaviours.push({
  id: "distance",
  type: "DistanceOptimizer",
  object: "distance",
  fields: {
    GameController: $beh("ctrl"),
    AudioController: $beh("audio"),
    Players: seatIds.map($beh),
    DealerUI: $beh("dealerUI"),
    TurnOff: ["dealerCamera", "manualCanvas", "autoCanvas", "tableCanvas", "resetButton"].map($obj),
  },
});
behaviours.push({ id: "disable", type: "DisableFixer", fields: { Players: seatIds.map($beh), Controller: $beh("ctrl") } });

for (let i = 0; i < SEATS; i++) {
  const p = `p${i}`;
  behaviours.push({
    id: p,
    type: "Player",
    object: p,
    group: "table",
    fields: {
      BlackjackController: $beh("ctrl"),
      PlayerNum: i,
      NormalDeck: $beh(`${p}n`),
      SplitDeck: $beh(`${p}s`),
      Deck: $beh("deck"),
      PlayerUI: $beh(`${p}ui`),
      Interactables: $beh(`${p}ic`),
      PlayerName: $comp(`${p}_dealerName`, "TMP"),
      BetPanel: $obj(`${p}_chips`),
      ChipAnimator: $comp(`${p}_chips`, "Animator"),
      CurrentBet: $comp(`${p}_currentBet`, "TMP"),
      TotalChips: $comp(`${p}_totalChips`, "TMP"),
      Timer: $comp(`${p}_timer`, "TMP"),
    },
  });
  for (const [suffix, split, rows, count] of [
    ["n", false, "n", "normalCount"],
    ["s", true, "s", "splitCount"],
  ] as const) {
    behaviours.push({
      id: `${p}${suffix}`,
      type: "PlayerDeck",
      object: `${p}_${suffix}d`,
      group: "table",
      fields: {
        PlayerController: $beh(p),
        isSplitDeck: split,
        Slots: range(CARDS).map((k) => $obj(`${p}_${rows}${k}`)),
        SlotRenderers: range(CARDS).map((k) => $comp(`${p}_${rows}${k}`, "Renderer")),
        SlotAnimators: range(CARDS).map((k) => $comp(`${p}_${rows}${k}`, "Animator")),
        DealerValueDisplay: $comp(`${p}_${count}`, "TMP"),
      },
    });
  }
  behaviours.push({
    id: `${p}ui`,
    type: "PlayerUIController",
    object: `${p}_ui`,
    fields: {
      PlayerController: $beh(p),
      OwnerUI: $obj(`${p}_ownerUI`),
      DealerUI: $obj(`${p}_dealerMask`),
      NotOwnerUI: $obj(`${p}_notOwnerUI`),
      PlayerName: $obj(`${p}_nameObj`),
      PlayerUIAnimator: $comp(`${p}_uiAnim`, "Animator"),
      DealerUIAnimator: $comp(`${p}_dealerCanvas`, "Animator"),
      PlayerOwner: $comp(`${p}_nameText`, "TMP"),
      NormalHelper: $comp(`${p}_normalHelper`, "TMP"),
      SplitHelper: $comp(`${p}_splitHelper`, "TMP"),
    },
  });
  const ic: Json = { Controller: $beh("ctrl"), Seat: $beh(p) };
  for (const [key, , method] of BUTTONS) {
    const id = `${p}b${key}`;
    behaviours.push({
      id,
      type: "Interactable",
      object: `${p}_b${key}`,
      fields: { Event: method, TargetBehaviour: $beh(p), PressName: "Press", PressViz: $comp(`${p}_viz${key}`, "Animator") },
    });
    ic[IC_FIELDS[key]!] = $beh(id);
  }
  behaviours.push({ id: `${p}ic`, type: "InteractableController", object: `${p}_ic`, fields: ic });
  click(`${p}_dHitNormal`, p, "_ManualNormalHitMe");
  click(`${p}_dHitSplit`, p, "_ManualSplitHitMe");
  click(`${p}_dStand`, p, "Stand");
}

// ---- the dealer side's buttons (section 5.3) ------------------------------------------------------------------------
click("takeOwnership", "ctrl", "_TakeOwnership");
click("takeOwnershipManual", "ctrl", "_TakeOwnership");
click("startGame", "ctrl", "GlobalStartMatch");
click("startGameManual", "ctrl", "GlobalStartMatch");
click("swapToManual", "ctrl", "_ToggleManualPlay");
click("swapToAuto", "ctrl", "_ToggleManualPlay");
for (const prefix of ["", "m"]) {
  click(`${prefix}helpersOnBtn`, "ctrl", "_ActivateHelpers");
  click(`${prefix}helpersOffBtn`, "ctrl", "_DeactivateHelpers");
  click(`${prefix}chipsOnBtn`, "ctrl", "_ActivateChips");
  click(`${prefix}chipsOffBtn`, "ctrl", "_DeactivateChips");
  click(`${prefix}deckAdd`, "deck", "AddDeck");
  click(`${prefix}deckSub`, "deck", "SubtractDeck");
}
click("resetTable", "ctrl", "ForceGlobalReset");
click("resetChips", "ctrl", "ResetChips");
click("heightUp", "ctrl", "RaiseDealerPanels");
click("heightDown", "ctrl", "LowerDealerPanels");

const doc = {
  schema: 1,
  slug: "blackjack",
  hash: "",
  provisional:
    "PROVISIONAL: written by tools/provisional-bindings.ts from the object model in PORT.md section 5, not by the kit builder. Object paths are upstream's names; the kit builder will write the real file.",
  root: "Blackjack",
  bundles: { windows: "", android: "" },
  objects,
  refs,
  behaviours,
  events,
};
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "bindings.json");
writeFileSync(out, JSON.stringify(doc, null, 1) + "\n");
console.log(`wrote ${out}: ${Object.keys(objects).length} objects, ${refs.length} refs, ${behaviours.length} behaviours, ${events.length} events`);
