/*!
 * pk-blackjack.js: blackjack for Altspace, ported from VRCBlackjack by CentauriCore.
 * Upstream: https://github.com/Centauri2442/VRCBlackjack (commit 83f05db).
 * Copyright 2022 CentauriCore.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 * Modified: the rules were translated from UdonSharp (C#) to TypeScript for Altspace in 2026 and changed.
 * The changes are listed in altspace/PORT.md (section 10) and altspace/THIRD-PARTY-NOTICES.md on the
 * altspace branch of the fork. Not affiliated with or endorsed by CentauriCore.
 */
/*! The portkit runtime in this file:
 * MIT License
 *
 * Copyright (c) 2026 the portkit authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/* pk-blackjack.js: portkit runtime with the rules of 'blackjack' (protocol pk1, bindings dacc020a362cd24696a285d71de32c2c617533fe). Built file: do not edit. */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // portkit/src/behaviour.ts
  var LINK = /* @__PURE__ */ Symbol("pk1.link");
  function linkBehaviour(behaviour, link) {
    Object.defineProperty(behaviour, LINK, { value: link, enumerable: false, configurable: true, writable: false });
  }
  function linkOf(behaviour) {
    const link = behaviour[LINK];
    if (!link) throw new Error("this behaviour is not part of a running instance yet (do not use the runtime in a constructor or a field initialiser)");
    return link;
  }
  var Behaviour = class {
    // ---- what the runtime provides ------------------------------------------------------------------------------
    /** The id this behaviour has in bindings.json. */
    get behaviourId() {
      return linkOf(this).id;
    }
    get gameObject() {
      return linkOf(this).gameObject;
    }
    get transform() {
      return linkOf(this).gameObject.transform;
    }
    get Networking() {
      return linkOf(this).networking;
    }
    get Time() {
      return linkOf(this).time;
    }
    get Random() {
      return linkOf(this).random;
    }
    get Debug() {
      return linkOf(this).debug;
    }
    /** Commit / reveal, fair draws and sealed delivery. */
    get Secrets() {
      return linkOf(this).secrets;
    }
    /** Per-device saved data for the local player (localStorage). */
    get Storage() {
      return linkOf(this).storage;
    }
    /** Text, animator parameters, particles and colours on kit objects. */
    get Host() {
      return linkOf(this).host;
    }
    /** The snippet element's attributes. */
    get Settings() {
      return linkOf(this).settings;
    }
    /** Per-player saved values everyone present can read (VRChat: PlayerData). */
    get PlayerData() {
      return linkOf(this).playerData;
    }
    /** Buttons, thumbsticks, triggers, keys, head and hand poses, haptics, teleport. */
    get Input() {
      return linkOf(this).input;
    }
    /** Values only the world's owner and moderators can write. */
    get Protected() {
      return linkOf(this).protectedValues;
    }
    /**
     * For a per-player behaviour: the player it belongs to. Null on an ordinary behaviour. An upstream field named
     * `Player` would hide it: such a port renames the field (the convention: `upstreamPlayer`) or reads `OwnerPlayer`.
     */
    get Player() {
      return linkOf(this).player;
    }
    /** The same as `Player`, under a name no upstream field is likely to use. */
    get OwnerPlayer() {
      return linkOf(this).player;
    }
    /**
     * One object shared by every instance of this game on the page (two tables of one game keep one chip balance
     * here). Page memory only: not synced, not saved, gone when the page reloads (use Storage for that).
     */
    get Shared() {
      return linkOf(this).shared;
    }
    /** This instance's key (the `room` / `instance` attribute, or the element's index): `pk1.<slug>.<key>`. */
    get InstanceKey() {
      return linkOf(this).instanceKey;
    }
    /**
     * This behaviour's own click reach in metres, overriding the bindings' `reach`, the class's `interactReach` and
     * the game's default (a snippet setting, for example). Undefined: those apply. 0: any distance.
     */
    get InteractReach() {
      return linkOf(this).reach.get(this);
    }
    set InteractReach(metres) {
      if (metres === void 0) linkOf(this).reach.delete(this);
      else linkOf(this).reach.set(this, metres);
    }
    // ---- calls --------------------------------------------------------------------------------------------------
    /** Sends the synced fields. Only the owner's request does anything; it goes out at the end of the tick. */
    RequestSerialization() {
      linkOf(this).requestSerialization();
    }
    SendCustomEvent(name) {
      const fn = this[name];
      if (typeof fn === "function") fn.call(this);
      else this.Debug.LogWarning(`SendCustomEvent: ${this.behaviourId} has no method '${name}'`);
    }
    /**
     * Runs `name` on every client (All: here at once, then everywhere else) or only on the owner's. Arguments
     * must be JSON data or the value types of values.ts. While the method runs, `Networking.CallingPlayer` is
     * the sender: check it before honouring a request not everybody may make. `name` must be listed in the
     * class's `static networkCallable`.
     */
    SendCustomNetworkEvent(target, name, ...args) {
      linkOf(this).sendNetworkEvent(target, name, args);
    }
    /**
     * Asks the referee to run `name` on its copy of this behaviour, with `Networking.CallingPlayer` set to the
     * sender. Unlike a network event the request is numbered and kept until the referee acknowledges it: it is
     * run in order, survives a change of referee, and is never replayed to a late joiner. Returns its number.
     */
    SendCommand(name, ...args) {
      return linkOf(this).sendCommand(name, args);
    }
    SendCustomEventDelayedSeconds(name, seconds) {
      linkOf(this).delaySeconds(name, seconds);
    }
    /** A frame is one 50 ms tick here. */
    SendCustomEventDelayedFrames(name, frames) {
      linkOf(this).delayFrames(name, frames);
    }
    /** Another behaviour of this instance, by its bindings id. */
    FindBehaviour(id) {
      return linkOf(this).find(id);
    }
    /** Every ordinary behaviour of this instance with the given bindings type, in bindings order. */
    FindBehavioursOfType(type) {
      return linkOf(this).findByType(type);
    }
    /** The per-player behaviour of the given type that belongs to `player`. */
    PlayerBehaviour(player, type) {
      return linkOf(this).playerBehaviour(player, type);
    }
    /** One per-player behaviour of the given type for every player present, in player-id order. */
    PlayerBehaviours(type) {
      return linkOf(this).playerBehaviours(type);
    }
    /** One of the few things that are truly asynchronous: await it. */
    Raycast(origin, direction, maxDistance = 1e3, layerMask = -1) {
      return linkOf(this).raycast(origin, direction, maxDistance, layerMask);
    }
    /**
     * Has `method` called when a graph of the kit reports `name` through
     * `window.__pk1.event("<slug>:<inst>", "<name>", "<arg>|<arg>...")`. The method receives the arguments as strings.
     */
    RegisterGraphEvent(name, method) {
      linkOf(this).onGraphEvent(name, method);
    }
    // ---- overridable, as in UdonSharp ---------------------------------------------------------------------------
    Start() {
    }
    /**
     * Called after Start and after any saved values were applied, once this client knows what it came to: a new
     * game ("fresh"), saved state nobody was playing ("resumed": carry on or reset, as the game prefers), a game
     * others are playing ("joined"), or no game yet ("idle"). In a game with declared referee candidates it is
     * called again when the first referee is elected. The same value is `this.Networking.StartKind`.
     */
    OnInstanceStart(_kind) {
    }
    /** Called 20 times a second, only on classes that override it. `this.Time.deltaTime` is the time it covers. */
    Update() {
    }
    /** Synced fields were just replaced by another player's values. Not called for the owner's own writes. */
    OnDeserialization(_result) {
    }
    OnPreSerialization() {
    }
    /** `success` is false when the room refused the write (see OnWriteRefused for why). */
    OnPostSerialization(_result) {
    }
    OnOwnershipTransferred(_player) {
    }
    OnPlayerJoined(_player) {
    }
    OnPlayerLeft(_player) {
    }
    /** A player's saved data and per-player behaviours are loaded and published (VRChat: OnPlayerRestored). */
    OnPlayerRestored(_player) {
    }
    /** Values in a player's PlayerData changed; `keys` names them. */
    OnPlayerDataUpdated(_player, _keys) {
    }
    /** The room refused something this behaviour wrote. Also reported through OnPostSerialization for fields. */
    OnWriteRefused(_refusal) {
    }
    /** The referee has run the command this behaviour sent with that number. */
    OnCommandAcknowledged(_number) {
    }
    /** A player's fair draw under `label` changed state (see Secrets.beginDraw). Called on every behaviour that overrides it. */
    OnDrawChanged(_player, _label, _state) {
    }
    /** A protected value changed. Called on every behaviour that overrides it. */
    OnProtectedChanged(_key) {
    }
    /**
     * The referee changed (VRChat: OnMasterTransferred). Null when there is none left (a game with declared
     * candidates and nobody offering). A game with hidden information may void its match here: the new referee
     * does not know what the old one dealt.
     */
    OnMasterTransferred(_newMaster) {
    }
    /** A controller button of the local player went down or came up. Called on every behaviour that overrides it. */
    OnButtonPressed(_button, _side) {
    }
    OnButtonReleased(_button, _side) {
    }
    /** A key went down or came up; `key` is the Unity KeyCode name. */
    OnKeyPressed(_key) {
    }
    OnKeyReleased(_key) {
    }
    /** The local player clicked this behaviour's object. */
    Interact() {
    }
    OnPickup() {
    }
    OnDrop() {
    }
    /** The instance is going away (its element left the page), or this per-player behaviour's player left. */
    OnDestroy() {
    }
  };
  /** Names of the fields that are synced. Values must be JSON data, arrays of it, or the value types of values.ts. */
  __publicField(Behaviour, "synced", []);
  /** "manual": sent by RequestSerialization(). "continuous": sent when changed, a few times a second. */
  __publicField(Behaviour, "syncMode", "manual");
  /**
   * UdonSharp's [FieldChangeCallback]: synced field name -> the property to assign instead. When a received
   * value differs from the field's current one, the property's setter is called with it (and must store it);
   * local code gets the same effect by assigning through the property.
   *
   *   static synced = ["_open"];
   *   static fieldChangeCallbacks = { _open: "Open" };
   *   _open = false;
   *   get Open() { return this._open; }
   *   set Open(value: boolean) { this._open = value; this.door.SetActive(!value); }
   */
  __publicField(Behaviour, "fieldChangeCallbacks", {});
  /**
   * True for a behaviour that exists once per player (VRChat: a PlayerObject). It is made when the player joins
   * and dropped when they leave, that player owns it for good, and its synced fields travel in their user state.
   */
  __publicField(Behaviour, "perPlayer", false);
  /** For a per-player behaviour: its synced fields are saved on the device and put back on the next visit. */
  __publicField(Behaviour, "persistent", false);
  /**
   * Metres from the nearest of the local head and hands within which a click counts as Interact() (or as a bound
   * click). 0 means any distance. A behaviour can change its own at run time with `InteractReach`.
   */
  __publicField(Behaviour, "interactReach", 0);
  /**
   * The methods another client may run on this behaviour: by SendCustomNetworkEvent, or by SendCommand on the
   * referee. Nothing else can be called from the network (a modified client names any method it likes), and a
   * name starting with `_` never can. A subclass's list adds to its parent's.
   *
   *   static networkCallable = ["StartGame", "PlaceBid"];
   */
  __publicField(Behaviour, "networkCallable", []);

  // portkit/src/names.ts
  var TAG = "pk1";
  function sanitizeInstanceKey(raw) {
    if (!raw) return "";
    return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24).replace(/-+$/g, "");
  }
  function isValidSlug(slug) {
    return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug);
  }
  function instanceKeyFor(attrs, indexAmongSameName) {
    return sanitizeInstanceKey(attrs.room) || sanitizeInstanceKey(attrs.instance) || String(indexAmongSameName);
  }
  function holderName(slug, inst) {
    return `${TAG}:${slug}:${inst}`;
  }
  function relayKey(slug, inst) {
    return `${slug}:${inst}`;
  }
  function networkId(slug, inst, objKey) {
    return `${TAG}/${slug}/${inst}/${objKey}`;
  }
  function attachId(slug, inst, objKey) {
    const ok = (s) => s.length <= 53 && /^[A-Za-z0-9_\-:@]+$/.test(s);
    const plain = `${TAG}:${slug}:${inst}:${objKey}`;
    if (ok(plain)) return plain;
    const short = `${TAG}:${slug}:${inst}:${fnv(objKey)}`;
    if (ok(short)) return short;
    return `${TAG}:${fnv(`${slug}:${inst}:${objKey}`)}${fnv(`${objKey}:${inst}:${slug}`)}`;
  }
  function fnv(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }
  function statePrefix(slug, inst) {
    return `${TAG}.${slug}.${inst}`;
  }
  function storagePrefix(slug, inst, uid) {
    return `${TAG}.${slug}.${inst}.${uid}.`;
  }
  function isPathSegment(segment) {
    return /^[A-Za-z0-9_\-@]{1,64}$/.test(segment);
  }
  function makeEnvelope(slug, inst, type, fields) {
    return { pk: 1, g: slug, i: inst, t: type, ...fields };
  }

  // portkit/src/util.ts
  function utf8Length(text) {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) bytes += 1;
      else if (c < 2048) bytes += 2;
      else if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        bytes += 4;
        i++;
      } else bytes += 3;
    }
    return bytes;
  }
  function utf8Encode(text) {
    const out = new Uint8Array(utf8Length(text));
    let o = 0;
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (text.charCodeAt(++i) - 56320);
      } else if (c >= 55296 && c <= 57343) c = 65533;
      if (c < 128) out[o++] = c;
      else if (c < 2048) {
        out[o++] = 192 | c >> 6;
        out[o++] = 128 | c & 63;
      } else if (c < 65536) {
        out[o++] = 224 | c >> 12;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      } else {
        out[o++] = 240 | c >> 18;
        out[o++] = 128 | c >> 12 & 63;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      }
    }
    return out;
  }
  function utf8Decode(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; ) {
      const b = bytes[i++];
      let c;
      if (b < 128) c = b;
      else if (b < 224) c = (b & 31) << 6 | bytes[i++] & 63;
      else if (b < 240) {
        c = (b & 15) << 12 | (bytes[i] & 63) << 6 | bytes[i + 1] & 63;
        i += 2;
      } else {
        c = (b & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
        i += 3;
      }
      out += String.fromCodePoint(c);
    }
    return out;
  }
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  function toBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += B64[a >> 2] + B64[(a & 3) << 4 | b >> 4];
      if (i + 1 < bytes.length) out += B64[(b & 15) << 2 | c >> 6];
      if (i + 2 < bytes.length) out += B64[c & 63];
    }
    return out;
  }
  function fromBase64(text) {
    const clean = text.replace(/=+$/, "");
    const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
    let o = 0;
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < clean.length; i++) {
      let v = B64.indexOf(clean[i]);
      if (v < 0) v = clean[i] === "+" ? 62 : clean[i] === "/" ? 63 : -1;
      if (v < 0) throw new Error("bad base64 character");
      buffer = buffer << 6 | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[o++] = buffer >> bits & 255;
      }
    }
    return out.subarray(0, o);
  }
  function fnv1a(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function canonicalJson(value) {
    return JSON.stringify(sortKeys(value));
  }
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
      return out;
    }
    return value;
  }
  function asciiJson(value) {
    const json = JSON.stringify(value);
    let out = "";
    let from = 0;
    for (let i = 0; i < json.length; i++) {
      const code = json.charCodeAt(i);
      if (code !== 124 && code < 127) continue;
      out += json.slice(from, i) + BACKSLASH + "u" + code.toString(16).padStart(4, "0");
      from = i + 1;
    }
    return from === 0 ? json : out + json.slice(from);
  }
  var BACKSLASH = String.fromCharCode(92);
  function jsonLeafBytes(text) {
    let bytes = 2;
    for (let i = 0; i < text.length; i++) bytes += leafCharBytes(text, i);
    return bytes;
  }
  function leafCharBytes(text, i) {
    const c = text.charCodeAt(i);
    if (c === 34 || c === 92) return 2;
    if (c < 32) return c === 8 || c === 9 || c === 10 || c === 12 || c === 13 ? 2 : 6;
    if (c < 128) return 1;
    if (c < 2048) return 2;
    if (c >= 56320 && c <= 57343) return i > 0 && (text.charCodeAt(i - 1) & 64512) === 55296 ? 0 : 3;
    if (c >= 55296 && c <= 56319) return i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320 ? 4 : 3;
    return 3;
  }
  function safeParse(text) {
    if (typeof text !== "string" || text.length === 0) return void 0;
    try {
      return JSON.parse(text);
    } catch {
      return void 0;
    }
  }
  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function deferred() {
    let resolveFn;
    const d = {
      promise: new Promise((resolve) => {
        resolveFn = resolve;
      }),
      resolve(value) {
        if (d.settled) return;
        d.settled = true;
        resolveFn(value);
      },
      settled: false
    };
    return d;
  }

  // portkit/src/values.ts
  var Vector2 = class _Vector2 {
    constructor(x = 0, y = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      this.x = x;
      this.y = y;
    }
    static get zero() {
      return new _Vector2(0, 0);
    }
    static get one() {
      return new _Vector2(1, 1);
    }
    static get up() {
      return new _Vector2(0, 1);
    }
    static get down() {
      return new _Vector2(0, -1);
    }
    static get left() {
      return new _Vector2(-1, 0);
    }
    static get right() {
      return new _Vector2(1, 0);
    }
    clone() {
      return new _Vector2(this.x, this.y);
    }
    add(o) {
      return new _Vector2(this.x + o.x, this.y + o.y);
    }
    sub(o) {
      return new _Vector2(this.x - o.x, this.y - o.y);
    }
    scale(k) {
      return new _Vector2(this.x * k, this.y * k);
    }
    /** C# `==` on Vector2 is an approximate comparison; this is the same test. */
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      return dx * dx + dy * dy < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector2.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector2(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    }
    toString() {
      return `(${this.x}, ${this.y})`;
    }
  };
  var Vector3 = class _Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static get zero() {
      return new _Vector3(0, 0, 0);
    }
    static get one() {
      return new _Vector3(1, 1, 1);
    }
    static get up() {
      return new _Vector3(0, 1, 0);
    }
    static get down() {
      return new _Vector3(0, -1, 0);
    }
    static get left() {
      return new _Vector3(-1, 0, 0);
    }
    static get right() {
      return new _Vector3(1, 0, 0);
    }
    static get forward() {
      return new _Vector3(0, 0, 1);
    }
    static get back() {
      return new _Vector3(0, 0, -1);
    }
    clone() {
      return new _Vector3(this.x, this.y, this.z);
    }
    add(o) {
      return new _Vector3(this.x + o.x, this.y + o.y, this.z + o.z);
    }
    sub(o) {
      return new _Vector3(this.x - o.x, this.y - o.y, this.z - o.z);
    }
    scale(k) {
      return new _Vector3(this.x * k, this.y * k, this.z * k);
    }
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      const dz = this.z - o.z;
      return dx * dx + dy * dy + dz * dz < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.sqrMagnitude);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector3.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    /** Degrees between two directions, 0 to 180 (UnityEngine.Vector3.Angle; 0 when either is nearly zero). */
    static Angle(from, to) {
      const denominator = Math.sqrt(from.sqrMagnitude * to.sqrMagnitude);
      if (denominator < 1e-15) return 0;
      const dot = Mathf.Clamp(_Vector3.Dot(from, to) / denominator, -1, 1);
      return Math.acos(dot) * Mathf.Rad2Deg;
    }
    /** Reflects a direction off the plane with normal `inNormal` (UnityEngine.Vector3.Reflect). */
    static Reflect(inDirection, inNormal) {
      const factor = -2 * _Vector3.Dot(inNormal, inDirection);
      return new _Vector3(factor * inNormal.x + inDirection.x, factor * inNormal.y + inDirection.y, factor * inNormal.z + inDirection.z);
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static Cross(a, b) {
      return new _Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
    }
    static MoveTowards(current, target, maxDelta) {
      const d = target.sub(current);
      const m = d.magnitude;
      return m <= maxDelta || m === 0 ? target.clone() : current.add(d.scale(maxDelta / m));
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z})`;
    }
  };
  var Quaternion = class _Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    static get identity() {
      return new _Quaternion(0, 0, 0, 1);
    }
    clone() {
      return new _Quaternion(this.x, this.y, this.z, this.w);
    }
    /** Unity's Quaternion.Euler: degrees, applied in Z, X, Y order. */
    static Euler(x, y, z) {
      const hx = x * Mathf.Deg2Rad / 2;
      const hy = y * Mathf.Deg2Rad / 2;
      const hz = z * Mathf.Deg2Rad / 2;
      const sx = Math.sin(hx), cx = Math.cos(hx);
      const sy = Math.sin(hy), cy = Math.cos(hy);
      const sz = Math.sin(hz), cz = Math.cos(hz);
      return new _Quaternion(
        cy * sx * cz + sy * cx * sz,
        sy * cx * cz - cy * sx * sz,
        cy * cx * sz - sy * sx * cz,
        cy * cx * cz + sy * sx * sz
      );
    }
    static AngleAxis(degrees, axis) {
      const n = axis.normalized;
      const h = degrees * Mathf.Deg2Rad / 2;
      const s = Math.sin(h);
      return new _Quaternion(n.x * s, n.y * s, n.z * s, Math.cos(h));
    }
    /** this * o: rotate by o first, then by this (Unity's operator order). */
    mul(o) {
      return new _Quaternion(
        this.w * o.x + this.x * o.w + this.y * o.z - this.z * o.y,
        this.w * o.y + this.y * o.w + this.z * o.x - this.x * o.z,
        this.w * o.z + this.z * o.w + this.x * o.y - this.y * o.x,
        this.w * o.w - this.x * o.x - this.y * o.y - this.z * o.z
      );
    }
    /** this * v: the vector rotated by this quaternion. */
    rotate(v) {
      const { x, y, z, w } = this;
      const tx = 2 * (y * v.z - z * v.y);
      const ty = 2 * (z * v.x - x * v.z);
      const tz = 2 * (x * v.y - y * v.x);
      return new Vector3(v.x + w * tx + (y * tz - z * ty), v.y + w * ty + (z * tx - x * tz), v.z + w * tz + (x * ty - y * tx));
    }
    get inverse() {
      const n = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w || 1;
      return new _Quaternion(-this.x / n, -this.y / n, -this.z / n, this.w / n);
    }
    /** Degrees, each in [0, 360), in Unity's convention. */
    get eulerAngles() {
      const { x, y, z, w } = this;
      const sinX = 2 * (w * x - y * z);
      let ex, ey, ez;
      if (Math.abs(sinX) > 0.9999995) {
        ex = Math.sign(sinX) * Math.PI / 2;
        ey = 2 * Math.atan2(y, w);
        ez = 0;
      } else {
        ex = Math.asin(sinX);
        ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
        ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
      }
      const wrap = (r) => {
        const d = r * Mathf.Rad2Deg % 360;
        return d < 0 ? d + 360 : d;
      };
      return new Vector3(wrap(ex), wrap(ey), wrap(ez));
    }
    /** Degrees between two rotations (UnityEngine.Quaternion.Angle). */
    static Angle(a, b) {
      const dot = Math.min(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w), 1);
      return dot > 0.999999 ? 0 : Math.acos(dot) * 2 * Mathf.Rad2Deg;
    }
    /**
     * The rotation whose forward (Z) is `forward` and whose up is as close to `upwards` as it can be
     * (UnityEngine.Quaternion.LookRotation). A zero forward gives the identity.
     */
    static LookRotation(forward, upwards = new Vector3(0, 1, 0)) {
      const f = forward.normalized;
      if (f.sqrMagnitude < 1e-12) return _Quaternion.identity;
      let r = Vector3.Cross(upwards, f);
      if (r.sqrMagnitude < 1e-12) {
        const axis = Vector3.Cross(new Vector3(0, 0, 1), f);
        if (axis.sqrMagnitude < 1e-12) return f.z >= 0 ? _Quaternion.identity : new _Quaternion(0, 1, 0, 0);
        return _Quaternion.AngleAxis(Math.acos(Mathf.Clamp(f.z, -1, 1)) * Mathf.Rad2Deg, axis);
      }
      r = r.normalized;
      const u = Vector3.Cross(f, r);
      const m00 = r.x, m01 = u.x, m02 = f.x;
      const m10 = r.y, m11 = u.y, m12 = f.y;
      const m20 = r.z, m21 = u.z, m22 = f.z;
      const trace = m00 + m11 + m22;
      let q;
      if (trace > 0) {
        const s = Math.sqrt(trace + 1) * 2;
        q = new _Quaternion((m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s);
      } else if (m00 > m11 && m00 > m22) {
        const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
        q = new _Quaternion(0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s);
      } else if (m11 > m22) {
        const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
        q = new _Quaternion((m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s);
      } else {
        const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
        q = new _Quaternion((m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s);
      }
      return q;
    }
    static Slerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
      const s = dot < 0 ? -1 : 1;
      dot = Math.abs(dot);
      let wa, wb;
      if (dot > 0.9995) {
        wa = 1 - k;
        wb = k;
      } else {
        const theta = Math.acos(dot);
        const sin = Math.sin(theta);
        wa = Math.sin((1 - k) * theta) / sin;
        wb = Math.sin(k * theta) / sin;
      }
      wb *= s;
      const q = new _Quaternion(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb);
      const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
      return new _Quaternion(q.x / n, q.y / n, q.z / n, q.w / n);
    }
    equals(o) {
      if (!o) return false;
      return Math.abs(this.x * o.x + this.y * o.y + this.z * o.z + this.w * o.w) > 0.999999;
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }
  };
  var Vector4 = class _Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    clone() {
      return new _Vector4(this.x, this.y, this.z, this.w);
    }
    equals(o) {
      return !!o && this.x === o.x && this.y === o.y && this.z === o.z && this.w === o.w;
    }
  };
  var Color = class _Color {
    constructor(r = 0, g = 0, b = 0, a = 1) {
      __publicField(this, "r");
      __publicField(this, "g");
      __publicField(this, "b");
      __publicField(this, "a");
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    static get white() {
      return new _Color(1, 1, 1, 1);
    }
    static get black() {
      return new _Color(0, 0, 0, 1);
    }
    static get red() {
      return new _Color(1, 0, 0, 1);
    }
    static get green() {
      return new _Color(0, 1, 0, 1);
    }
    static get blue() {
      return new _Color(0, 0, 1, 1);
    }
    static get yellow() {
      return new _Color(1, 0.92156863, 0.015686275, 1);
    }
    static get clear() {
      return new _Color(0, 0, 0, 0);
    }
    static get cyan() {
      return new _Color(0, 1, 1, 1);
    }
    static get magenta() {
      return new _Color(1, 0, 1, 1);
    }
    static get gray() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    static get grey() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    /**
     * UnityEngine.Color.HSVToRGB, line for line: H, S, V in [0, 1]; with `hdr` false each channel is clamped to
     * [0, 1]. Alpha is 1. (Unity computes in single precision; this in double: the last digits can differ.)
     */
    static HSVToRGB(H, S, V, hdr = true) {
      const c = new _Color(1, 1, 1, 1);
      if (S === 0) {
        c.r = V;
        c.g = V;
        c.b = V;
      } else if (V === 0) {
        c.r = 0;
        c.g = 0;
        c.b = 0;
      } else {
        c.r = 0;
        c.g = 0;
        c.b = 0;
        const h = H * 6;
        const temp = Math.floor(h);
        const t = h - temp;
        const var1 = V * (1 - S);
        const var2 = V * (1 - S * t);
        const var3 = V * (1 - S * (1 - t));
        switch (temp) {
          case 0:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case 1:
            c.r = var2;
            c.g = V;
            c.b = var1;
            break;
          case 2:
            c.r = var1;
            c.g = V;
            c.b = var3;
            break;
          case 3:
            c.r = var1;
            c.g = var2;
            c.b = V;
            break;
          case 4:
            c.r = var3;
            c.g = var1;
            c.b = V;
            break;
          case 5:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
          case 6:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case -1:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
        }
        if (!hdr) {
          c.r = Mathf.Clamp01(c.r);
          c.g = Mathf.Clamp01(c.g);
          c.b = Mathf.Clamp01(c.b);
        }
      }
      return c;
    }
    /** UnityEngine.Color.RGBToHSV: [H, S, V], each in [0, 1]. */
    static RGBToHSV(color) {
      const { r, g, b } = color;
      const rgbToHue = (offset, dominant, c1, c2) => {
        const V = dominant;
        if (V === 0) return [0, 0, 0];
        const min = c1 > c2 ? c2 : c1;
        const delta = V - min;
        if (delta === 0) return [0, 0, V];
        const S = delta / V;
        let H = offset + (c1 - c2) / delta;
        H /= 6;
        if (H < 0) H += 1;
        return [H, S, V];
      };
      if (b > g && b > r) return rgbToHue(4, b, r, g);
      if (g > r) return rgbToHue(2, g, b, r);
      return rgbToHue(0, r, g, b);
    }
    clone() {
      return new _Color(this.r, this.g, this.b, this.a);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Color(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, a.a + (b.a - a.a) * k);
    }
    equals(o) {
      return !!o && this.r === o.r && this.g === o.g && this.b === o.b && this.a === o.a;
    }
  };
  var Curve = class {
    constructor(keys) {
      __publicField(this, "keys");
      this.keys = keys;
    }
    Evaluate(t) {
      const k = this.keys;
      if (k.length === 0) return 0;
      if (t <= k[0][0]) return k[0][1];
      for (let i = 1; i < k.length; i++) {
        if (t <= k[i][0]) {
          const [t0, v0] = k[i - 1];
          const [t1, v1] = k[i];
          return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
        }
      }
      return k[k.length - 1][1];
    }
  };
  var Mathf = {
    PI: Math.PI,
    Deg2Rad: Math.PI / 180,
    Rad2Deg: 180 / Math.PI,
    Epsilon: 1401298e-51,
    Infinity: Number.POSITIVE_INFINITY,
    Abs: Math.abs,
    Min: Math.min,
    Max: Math.max,
    Sqrt: Math.sqrt,
    Pow: Math.pow,
    Sin: Math.sin,
    Cos: Math.cos,
    Atan2: Math.atan2,
    Floor: Math.floor,
    Ceil: Math.ceil,
    FloorToInt: (v) => Math.floor(v),
    CeilToInt: (v) => Math.ceil(v),
    /** C# rounds halves to the even neighbour; Math.round does not. */
    Round: (v) => {
      const f = Math.floor(v);
      const d = v - f;
      if (d < 0.5) return f;
      if (d > 0.5) return f + 1;
      return f % 2 === 0 ? f : f + 1;
    },
    RoundToInt: (v) => Mathf.Round(v),
    Sign: (v) => v >= 0 ? 1 : -1,
    Clamp: (v, lo, hi) => v < lo ? lo : v > hi ? hi : v,
    Clamp01: (v) => v < 0 ? 0 : v > 1 ? 1 : v,
    Lerp: (a, b, t) => a + (b - a) * Mathf.Clamp01(t),
    LerpUnclamped: (a, b, t) => a + (b - a) * t,
    InverseLerp: (a, b, v) => a === b ? 0 : Mathf.Clamp01((v - a) / (b - a)),
    MoveTowards: (current, target, maxDelta) => Math.abs(target - current) <= maxDelta ? target : current + Math.sign(target - current) * maxDelta,
    Repeat: (t, length) => Mathf.Clamp(t - Math.floor(t / length) * length, 0, length),
    Approximately: (a, b) => Math.abs(b - a) < Math.max(1e-6 * Math.max(Math.abs(a), Math.abs(b)), 1121039e-50)
  };
  function encodeValue(value) {
    if (value === void 0 || value === null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "object") return value;
    if (value instanceof Vector2) return { $v2: [value.x, value.y] };
    if (value instanceof Vector3) return { $v3: [value.x, value.y, value.z] };
    if (value instanceof Quaternion) return { $q: [value.x, value.y, value.z, value.w] };
    if (value instanceof Vector4) return { $v4: [value.x, value.y, value.z, value.w] };
    if (value instanceof Color) return { $color: [value.r, value.g, value.b, value.a] };
    if (value instanceof Curve) return { $curve: value.keys };
    if (Array.isArray(value)) return value.map(encodeValue);
    const out = {};
    for (const key of Object.keys(value)) out[key] = encodeValue(value[key]);
    return out;
  }
  function decodeValue(json) {
    if (json === null || typeof json !== "object") return json;
    if (Array.isArray(json)) return json.map(decodeValue);
    const o = json;
    const n = (key, len) => {
      const a2 = o[key];
      return Array.isArray(a2) && a2.length === len && a2.every((v) => typeof v === "number") ? a2 : null;
    };
    let a;
    if (a = n("$v2", 2)) return new Vector2(a[0], a[1]);
    if (a = n("$v3", 3)) return new Vector3(a[0], a[1], a[2]);
    if (a = n("$q", 4)) return new Quaternion(a[0], a[1], a[2], a[3]);
    if (a = n("$v4", 4)) return new Vector4(a[0], a[1], a[2], a[3]);
    if (a = n("$color", 4)) return new Color(a[0], a[1], a[2], a[3]);
    if (Array.isArray(o.$curve)) return new Curve(o.$curve);
    const out = {};
    for (const key of Object.keys(o)) out[key] = decodeValue(o[key]);
    return out;
  }

  // portkit/src/fields.ts
  function readFields(target, fields) {
    const bag = target;
    const out = {};
    for (const field of fields) out[field] = encodeValue(bag[field]);
    return out;
  }
  function assignFields(target, fields, data, callbacks) {
    if (!isRecord(data)) return;
    const bag = target;
    for (const field of fields) {
      if (!(field in data)) continue;
      const property = callbacks ? callbacks[field] : void 0;
      if (property === void 0) {
        bag[field] = decodeValue(data[field]);
        continue;
      }
      if (canonicalJson(encodeValue(bag[field])) === canonicalJson(data[field] ?? null)) continue;
      bag[property] = decodeValue(data[field]);
    }
  }

  // portkit/src/peruser.ts
  var MAX_PLAYER_LEAVES = 4;
  var PER_LEAF = 24;
  var PerUser = class {
    constructor(core, storage, hooks) {
      __publicField(this, "core");
      __publicField(this, "storage");
      __publicField(this, "hooks");
      __publicField(this, "remote", /* @__PURE__ */ new Map());
      __publicField(this, "delivered", /* @__PURE__ */ new Map());
      __publicField(this, "local", {});
      __publicField(this, "localLoaded", false);
      __publicField(this, "localDirty", false);
      __publicField(this, "changedKeys", /* @__PURE__ */ new Set());
      /** sid -> behaviour id -> the per-player behaviour */
      __publicField(this, "owned", /* @__PURE__ */ new Map());
      __publicField(this, "dirtyBuckets", /* @__PURE__ */ new Set());
      __publicField(this, "lastWrite", /* @__PURE__ */ new Map());
      __publicField(this, "typeIds", []);
      /** PlayerData is published only when the game uses it. */
      __publicField(this, "dataEnabled", false);
      __publicField(this, "started", false);
      this.core = core;
      this.storage = storage;
      this.hooks = hooks;
    }
    path(leaf) {
      return `${this.core.prefix}.${leaf}`;
    }
    /** Declares the per-player behaviour ids of this game, in bindings order (it fixes which leaf each uses). */
    declareTypes(ids) {
      this.typeIds = ids.slice();
    }
    bucketOf(id) {
      const index = Math.max(0, this.typeIds.indexOf(id));
      const leaves = Math.min(MAX_PLAYER_LEAVES, Math.max(1, Math.ceil(this.typeIds.length / PER_LEAF)));
      return Math.floor(index * leaves / Math.max(1, this.typeIds.length));
    }
    listen() {
      const dot = this.core.prefix + ".";
      this.core.own(
        this.core.platform.onUser(dot, (sid, path) => {
          if (this.core.disposed || sid === this.core.me.sid) return;
          const leaf = path.slice(dot.length);
          if (leaf === "d") this.readRemoteData(sid);
          else if (/^p[0-3]$/.test(leaf)) this.readRemoteBucket(sid, Number(leaf.slice(1)));
        })
      );
    }
    // ---- PlayerData ---------------------------------------------------------------------------------------------
    /** Loads the local player's saved values and publishes them. Called once behaviours have started. */
    restoreLocal() {
      if (this.localLoaded) return;
      this.localLoaded = true;
      const saved = this.storage.get("playerdata", null);
      this.local = isRecord(saved) ? encodeValue(saved) : {};
      if (this.dataEnabled) this.localDirty = true;
    }
    enableData() {
      if (this.dataEnabled) return;
      this.dataEnabled = true;
      if (this.localLoaded) this.localDirty = true;
    }
    Set(key, value) {
      const encoded = encodeValue(value);
      if (canonicalJson(this.local[key] ?? null) === canonicalJson(encoded) && key in this.local) return;
      this.local[key] = encoded;
      this.changedKeys.add(key);
      this.localDirty = true;
      this.enableData();
    }
    Delete(key) {
      if (!(key in this.local)) return;
      delete this.local[key];
      this.changedKeys.add(key);
      this.localDirty = true;
    }
    bag(player) {
      if (player.isLocal) return this.local;
      return this.remote.get(player.sid)?.data ?? null;
    }
    Get(player, key, fallback) {
      const bag = this.bag(player);
      return bag && key in bag ? decodeValue(bag[key]) : fallback;
    }
    Has(player, key) {
      const bag = this.bag(player);
      return !!bag && key in bag;
    }
    Keys(player) {
      const bag = this.bag(player);
      return bag ? Object.keys(bag) : [];
    }
    IsRestored(player) {
      return player.isLocal ? this.localLoaded : !!this.remote.get(player.sid)?.restored;
    }
    SetString(key, value) {
      this.Set(key, String(value));
    }
    SetInt(key, value) {
      this.Set(key, Math.trunc(value));
    }
    SetFloat(key, value) {
      this.Set(key, value);
    }
    SetBool(key, value) {
      this.Set(key, !!value);
    }
    GetString(player, key) {
      return String(this.Get(player, key, ""));
    }
    GetInt(player, key) {
      return Math.trunc(Number(this.Get(player, key, 0)) || 0);
    }
    GetFloat(player, key) {
      return Number(this.Get(player, key, 0)) || 0;
    }
    GetBool(player, key) {
      return this.Get(player, key, false) === true;
    }
    readRemoteData(sid) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path("d")));
      let entry = this.remote.get(sid);
      if (!entry) this.remote.set(sid, entry = { data: {}, restored: false, announced: false });
      const before = entry.data;
      const now = isRecord(raw) && isRecord(raw.d) ? raw.d : {};
      entry.data = now;
      entry.restored = isRecord(raw) && raw.r === 1;
      const player = this.delivered.get(sid);
      if (!player || !this.started) return;
      if (entry.restored && !entry.announced) {
        entry.announced = true;
        this.hooks.restored(player);
        const all = Object.keys(now).sort();
        if (all.length) this.hooks.dataUpdated(player, all);
        return;
      }
      const keys = [];
      for (const key of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(now)])) {
        if (canonicalJson(before[key] ?? null) !== canonicalJson(now[key] ?? null) || key in before !== key in now) keys.push(key);
      }
      if (keys.length) this.hooks.dataUpdated(player, keys.sort());
    }
    // ---- per-player behaviours ----------------------------------------------------------------------------------
    /** Registers a per-player behaviour that has just been made for `player`. Returns true if it already has data. */
    adopt(player, id, behaviour, fields, persistent, callbacks) {
      let mine = this.owned.get(player.sid);
      if (!mine) this.owned.set(player.sid, mine = /* @__PURE__ */ new Map());
      const entry = { id, behaviour, fields, callbacks, persistent, bucket: this.bucketOf(id), n: 0 };
      mine.set(id, entry);
      if (player.isLocal) {
        if (!persistent) return false;
        const saved = this.storage.get(`po.${id}`, null);
        if (!isRecord(saved)) return false;
        this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, encodeValue(saved), callbacks));
        entry.n = 1;
        this.dirtyBuckets.add(entry.bucket);
        return true;
      }
      const stored = this.remoteBucket(player.sid, entry.bucket)[id];
      if (!stored) return false;
      this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, stored[1], callbacks));
      entry.n = stored[0];
      return true;
    }
    /**
     * Every per-player copy that holds a value (it was serialised or received at least once), in session and id order,
     * with its sequence number and fields: what `digest()` and `version()` add for per-player behaviours.
     */
    snapshot() {
      const out = [];
      for (const sid of [...this.owned.keys()].sort()) {
        const mine = this.owned.get(sid);
        for (const id of [...mine.keys()].sort()) {
          const entry = mine.get(id);
          if (entry.n > 0 && entry.fields.length) out.push({ sid, id, n: entry.n, fields: readFields(entry.behaviour, entry.fields) });
        }
      }
      return out;
    }
    behaviour(sid, id) {
      return this.owned.get(sid)?.get(id)?.behaviour ?? null;
    }
    behavioursOf(sid) {
      return [...this.owned.get(sid)?.values() ?? []].map((o) => o.behaviour);
    }
    /** The local player asked to send one of their per-player behaviours. */
    requestSerialization(behaviour) {
      const mine = this.owned.get(this.core.me.sid);
      if (!mine) return;
      for (const entry of mine.values()) {
        if (entry.behaviour !== behaviour) continue;
        entry.n++;
        this.dirtyBuckets.add(entry.bucket);
        return;
      }
    }
    remoteBucket(sid, bucket) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path(`p${bucket}`)));
      const out = {};
      if (!isRecord(raw) || !isRecord(raw.b)) return out;
      for (const id of Object.keys(raw.b)) {
        const entry = raw.b[id];
        if (Array.isArray(entry) && typeof entry[0] === "number") out[id] = [entry[0], entry[1]];
      }
      return out;
    }
    readRemoteBucket(sid, bucket) {
      const theirs = this.owned.get(sid);
      if (!theirs) return;
      const stored = this.remoteBucket(sid, bucket);
      for (const entry of theirs.values()) {
        const value = stored[entry.id];
        if (!value || value[0] === entry.n) continue;
        entry.n = value[0];
        this.core.guard(`${entry.id} field change callback`, () => assignFields(entry.behaviour, entry.fields, value[1], entry.callbacks));
        if (this.started) this.hooks.deserialized(entry.behaviour);
      }
    }
    // ---- players coming and going -------------------------------------------------------------------------------
    /** Called after OnPlayerJoined has been delivered for `player`. */
    playerDelivered(player) {
      this.delivered.set(player.sid, player);
      if (player.isLocal) {
        if (this.dataEnabled || this.hasPersistentLocal()) {
          this.hooks.restored(player);
          const all = Object.keys(this.local).sort();
          if (this.dataEnabled && all.length) this.hooks.dataUpdated(player, all);
        }
        return;
      }
      this.readRemoteData(player.sid);
    }
    hasPersistentLocal() {
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.persistent) return true;
      return false;
    }
    /** Drops everything kept for a player who left. Returns their per-player behaviours, for OnDestroy. */
    playerGone(sid) {
      const gone = this.behavioursOf(sid);
      this.owned.delete(sid);
      this.remote.delete(sid);
      this.delivered.delete(sid);
      return gone;
    }
    // ---- writing ------------------------------------------------------------------------------------------------
    /** Writes what changed, at most a few times a second per leaf. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      const due = (leaf) => now - (this.lastWrite.get(leaf) ?? -Infinity) >= this.core.options.continuousIntervalMs;
      const limit = this.core.platform.limits.maxLeafBytes - 64;
      for (const bucket of [...this.dirtyBuckets]) {
        const leaf = `p${bucket}`;
        if (!due(leaf)) continue;
        this.dirtyBuckets.delete(bucket);
        const b = {};
        const mine = [...this.owned.get(this.core.me.sid)?.values() ?? []].filter((o) => o.bucket === bucket && o.n > 0);
        for (const entry of mine) b[entry.id] = [entry.n, readFields(entry.behaviour, entry.fields)];
        const text = asciiJson({ b });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerObject", "value_too_large", this.path(leaf), mine[0]?.behaviour ?? null);
          continue;
        }
        this.lastWrite.set(leaf, now);
        this.core.platform.userSet(this.path(leaf), text);
        for (const entry of mine) if (entry.persistent) this.storage.set(`po.${entry.id}`, decodeValue(b[entry.id][1]));
      }
      if (this.localDirty && this.localLoaded && this.dataEnabled && due("d")) {
        this.localDirty = false;
        const keys = [...this.changedKeys].sort();
        this.changedKeys.clear();
        const text = asciiJson({ r: 1, d: this.local });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerData", "value_too_large", this.path("d"), null);
        } else {
          this.lastWrite.set("d", now);
          this.core.platform.userSet(this.path("d"), text);
          this.storage.set("playerdata", decodeValue(this.local));
        }
        const me = this.delivered.get(this.core.me.sid);
        if (me && keys.length) this.hooks.dataUpdated(me, keys);
      }
    }
    /** Removes the local player's leaves, when the instance stops while they stay in the room. */
    retire() {
      const { platform } = this.core;
      if (this.dataEnabled) platform.userSet(this.path("d"), null);
      const leaves = /* @__PURE__ */ new Set();
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.n > 0) leaves.add(entry.bucket);
      for (const bucket of leaves) platform.userSet(this.path(`p${bucket}`), null);
    }
  };

  // portkit/src/bindings.ts
  var EVENT_KINDS = ["click", "grab", "drop", "triggerEnter", "triggerExit", "collisionEnter", "collisionExit", "uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field", "graph"];
  var GRAPH_KINDS = ["uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field"];
  function validateBindings(json) {
    const problems = [];
    const fail = (text) => problems.push(text);
    if (!isRecord(json)) throw new Error("bindings: not an object");
    if (json.schema !== 1) fail(`schema is ${JSON.stringify(json.schema)}, expected 1`);
    if (typeof json.slug !== "string" || !isValidSlug(json.slug)) fail(`slug ${JSON.stringify(json.slug)} is not lower-case letters, digits and hyphens`);
    const bundles = isRecord(json.bundles) ? json.bundles : {};
    const objects = isRecord(json.objects) ? json.objects : {};
    const refs = Array.isArray(json.refs) ? json.refs : [];
    const behaviours = Array.isArray(json.behaviours) ? json.behaviours : [];
    const events = Array.isArray(json.events) ? json.events : [];
    const paths = /* @__PURE__ */ new Map();
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      if (!isPathSegment(key)) fail(`object key '${key}' must be 1-64 of A-Z a-z 0-9 _ - @ (it becomes part of a network id)`);
      if (!isRecord(o) || typeof o.path !== "string") {
        fail(`object '${key}' has no path`);
        continue;
      }
      if (o.sync !== void 0 && o.sync !== "none" && o.sync !== "transform") fail(`object '${key}': sync must be "none" or "transform"`);
      const other = paths.get(o.path);
      if (other !== void 0) fail(`objects '${other}' and '${key}' have the same path '${o.path}'`);
      paths.set(o.path, key);
    }
    refs.forEach((ref, i) => {
      if (typeof ref !== "string" || !(ref in objects)) fail(`refs[${i}] '${String(ref)}' is not an object key`);
    });
    if (new Set(refs).size !== refs.length) fail("refs lists an object twice");
    const ids = /* @__PURE__ */ new Set();
    for (const b of behaviours) {
      if (!isRecord(b) || typeof b.id !== "string" || typeof b.type !== "string") {
        fail(`a behaviour entry has no id or type: ${JSON.stringify(b)}`);
        continue;
      }
      if (!isPathSegment(b.id)) fail(`behaviour id '${b.id}' must be 1-64 of A-Z a-z 0-9 _ - @ (it is a state key)`);
      if (ids.has(b.id)) fail(`behaviour id '${b.id}' is used twice`);
      ids.add(b.id);
      if (b.object !== void 0 && b.object !== null && !(String(b.object) in objects)) fail(`behaviour '${b.id}': object '${String(b.object)}' is not an object key`);
      if (b.fields !== void 0 && !isRecord(b.fields)) fail(`behaviour '${b.id}': fields is not an object`);
      if (b.group !== void 0 && (typeof b.group !== "string" || !/^[A-Za-z0-9_-]{1,48}$/.test(b.group))) fail(`behaviour '${b.id}': group must be 1-48 of A-Z a-z 0-9 _ -`);
      if (b.group !== void 0 && b.perPlayer === true) fail(`behaviour '${b.id}': a per-player behaviour cannot be in a sync group`);
    }
    const checkRefs = (where, value) => {
      if (Array.isArray(value)) value.forEach((v, i) => checkRefs(`${where}[${i}]`, v));
      else if (isRecord(value)) {
        if (typeof value.$obj === "string" && !(value.$obj in objects)) fail(`${where}: $obj '${value.$obj}' is not an object key`);
        else if (typeof value.$beh === "string" && !ids.has(value.$beh)) fail(`${where}: $beh '${value.$beh}' is not a behaviour id`);
        else if (typeof value.$comp === "string" && !(value.$comp in objects)) fail(`${where}: $comp '${value.$comp}' is not an object key`);
        else if (value.$clip !== void 0 && value.on !== void 0 && !(String(value.on) in objects)) fail(`${where}: $clip on '${String(value.on)}' is not an object key`);
        else if (!Object.keys(value).some((k) => k.startsWith("$"))) for (const k of Object.keys(value)) checkRefs(`${where}.${k}`, value[k]);
      }
    };
    for (const b of behaviours) if (isRecord(b) && isRecord(b.fields)) for (const f of Object.keys(b.fields)) checkRefs(`behaviour '${String(b.id)}' field '${f}'`, b.fields[f]);
    events.forEach((e, i) => {
      if (!isRecord(e)) return fail(`events[${i}] is not an object`);
      if (typeof e.kind !== "string" || EVENT_KINDS.indexOf(e.kind) < 0) fail(`events[${i}]: kind '${String(e.kind)}' is not one of ${EVENT_KINDS.join(", ")}`);
      if (e.kind === "graph") {
        if (typeof e.name !== "string" || !e.name) fail(`events[${i}]: a graph event needs a name`);
      } else if (typeof e.object !== "string" || !(e.object in objects)) fail(`events[${i}]: object '${String(e.object)}' is not an object key`);
      const unbound = GRAPH_KINDS.indexOf(String(e.kind)) >= 0 && !e.behaviour && !e.method;
      if (unbound) return;
      if (typeof e.behaviour !== "string" || !ids.has(e.behaviour)) fail(`events[${i}]: behaviour '${String(e.behaviour)}' is not a behaviour id`);
      if (typeof e.method !== "string" || !e.method) fail(`events[${i}]: no method`);
    });
    if (problems.length) throw new Error("bindings.json is not valid:\n  - " + problems.join("\n  - "));
    const normalObjects = {};
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      normalObjects[key] = { path: o.path, sync: o.sync === "transform" ? "transform" : "none", grab: o.grab === true, click: o.click === true, seat: o.seat === true };
      if (o.active === false) normalObjects[key].active = false;
      if (o.attach === true) normalObjects[key].attach = true;
    }
    return {
      schema: 1,
      slug: json.slug,
      hash: typeof json.hash === "string" ? json.hash : void 0,
      root: typeof json.root === "string" && json.root ? json.root : void 0,
      bundles: { windows: typeof bundles.windows === "string" ? bundles.windows : "", android: typeof bundles.android === "string" ? bundles.android : "" },
      objects: normalObjects,
      refs,
      behaviours,
      events
    };
  }

  // portkit/src/events.ts
  var NetEvents = class {
    constructor(core, sync, routes) {
      __publicField(this, "core");
      __publicField(this, "sync");
      __publicField(this, "routes");
      __publicField(this, "held", /* @__PURE__ */ new Map());
      /** The session whose event or command is being run right now, for Networking.CallingPlayer. */
      __publicField(this, "callingSid", null);
      __publicField(this, "sent", 0);
      __publicField(this, "received", 0);
      /** Requests naming a method that may not be called from the network, for tests and diagnostics. */
      __publicField(this, "refusedCount", 0);
      /** Events asked for in this turn, sent after it (with the state the whole turn wrote). */
      __publicField(this, "outbox", []);
      __publicField(this, "draining", false);
      __publicField(this, "refusedNames", /* @__PURE__ */ new Set());
      this.core = core;
      this.sync = sync;
      this.routes = routes;
    }
    listen() {
      this.core.own(this.core.platform.onOneShot((fromSid, data) => this.receive(fromSid, data)));
    }
    send(behaviour, target, name, args) {
      if (this.core.disposed) return;
      const address = this.routes.address(behaviour);
      if (!address) return;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCustomNetworkEvent: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable; names starting with '_' can never be sent)`);
        return;
      }
      const fields = { b: address.id, e: name };
      if (args.length) fields.a = args.map(encodeValue);
      const me = this.core.me.sid;
      let ownerSid;
      let outSlot = null;
      if (address.playerSid !== null) {
        fields.ps = address.playerSid;
        ownerSid = address.playerSid;
      } else {
        const slot = this.sync.slotOf(behaviour);
        ownerSid = slot ? this.sync.ownerSid(slot) : null;
        if (slot && ownerSid === me) outSlot = slot;
      }
      if (target === "Owner") {
        if (ownerSid === me) {
          this.invoke(behaviour, name, args, me);
          return;
        }
        if (ownerSid === null) {
          this.core.log("warn", `${address.id}.${name}: no owner to send to`);
          return;
        }
        fields.o = ownerSid;
      } else this.invoke(behaviour, name, args, me);
      this.outbox.push({ behaviour, name, fields, slot: outSlot });
      if (!this.draining) {
        this.draining = true;
        Promise.resolve().then(() => this.drain());
      }
    }
    /**
     * After the turn that asked for them: the state every handler of the turn changed is written (one write per slot),
     * then the events go, in the order they were asked for.
     */
    drain() {
      this.draining = false;
      if (this.core.disposed) {
        this.outbox = [];
        return;
      }
      const out = this.outbox;
      this.outbox = [];
      if (!out.length) return;
      this.sync.flushDirty();
      const me = this.core.me.sid;
      for (const item of out) {
        if (item.slot) {
          const mark = this.sync.flushOne(item.slot);
          if (mark && mark.w === me) item.fields.s = [mark.g, mark.n];
        }
        this.post(item.behaviour, item.name, item.fields);
      }
    }
    post(behaviour, name, fields) {
      const text = asciiJson(makeEnvelope(this.core.slug, this.core.inst, "ev", fields));
      if (utf8Length(text) > this.core.platform.limits.oneShotMaxBytes || !this.core.platform.oneShot(text)) {
        this.core.log("error", `network event '${name}' is too large to send (${utf8Length(text)} bytes)`);
        this.routes.refused(behaviour, "oneshot_too_large", name);
        return;
      }
      this.sent++;
    }
    receive(fromSid, data) {
      if (this.core.disposed || !this.sync.started) return;
      const env2 = parseOurs(data, this.core.slug, this.core.inst);
      if (!env2 || env2.t !== "ev" || typeof env2.b !== "string" || typeof env2.e !== "string") return;
      const me = this.core.me.sid;
      const name = env2.e;
      const args = Array.isArray(env2.a) ? env2.a.map(decodeValue) : [];
      this.received++;
      if (typeof env2.ps === "string") {
        if (typeof env2.o === "string" && env2.o !== me) return;
        const behaviour2 = this.routes.playerBehaviour(env2.ps, env2.b);
        if (behaviour2) this.invoke(behaviour2, name, args, fromSid);
        return;
      }
      const behaviour = this.routes.behaviour(env2.b);
      const slot = behaviour ? this.sync.slotOf(behaviour) : null;
      if (!behaviour || !slot) return;
      if (typeof env2.o === "string") {
        if (env2.o !== me) return;
        if (!this.sync.isOwner(slot)) {
          const owner = this.sync.ownerSid(slot);
          const hops = typeof env2.h === "number" ? env2.h : 0;
          if (owner !== null && owner !== fromSid && hops < 2) {
            const fields = { b: env2.b, e: name, o: owner, h: hops + 1 };
            if (args.length) fields.a = env2.a;
            this.post(behaviour, name, fields);
          }
          return;
        }
      }
      const run = () => this.invoke(behaviour, name, args, fromSid);
      const mark = Array.isArray(env2.s) && typeof env2.s[0] === "number" && typeof env2.s[1] === "number" ? { g: env2.s[0], n: env2.s[1] } : null;
      if (mark && !this.has(slot, mark.g, mark.n)) this.hold(slot, mark.g, mark.n, run);
      else run();
    }
    /** Has the write the event was sent after reached this client's mirror? (Sequence numbers only rise.) */
    has(slot, _g, n) {
      return slot.seenN >= n;
    }
    hold(slot, g, n, run) {
      let list = this.held.get(slot.id);
      if (!list) this.held.set(slot.id, list = []);
      const entry = { g, n, run, timer: 0 };
      entry.timer = this.core.scheduler.after(this.core.options.eventHoldMs, () => {
        const current = this.held.get(slot.id) ?? [];
        const at = current.indexOf(entry);
        if (at < 0) return;
        current.splice(at, 1);
        run();
      });
      list.push(entry);
      slot.onApplied = () => this.release(slot);
    }
    release(slot) {
      const list = this.held.get(slot.id);
      if (!list || !list.length) return;
      const ready = list.filter((h) => this.has(slot, h.g, h.n));
      if (!ready.length) return;
      this.held.set(
        slot.id,
        list.filter((h) => !ready.includes(h))
      );
      for (const h of ready) {
        this.core.scheduler.cancel(h.timer);
        h.run();
      }
    }
    /** Runs a method of game code on behalf of `fromSid` (a network event or a command). */
    invoke(behaviour, name, args, fromSid) {
      if (!callable(behaviour, name)) {
        const key = `${behaviour.constructor.name}.${name}`;
        if (!this.refusedNames.has(key) && this.refusedNames.size < 64) {
          this.refusedNames.add(key);
          this.core.log("warn", `refused a request from session ${fromSid} to run '${String(name).slice(0, 64)}' on ${behaviour.constructor.name}: not in its networkCallable list`);
        }
        this.refusedCount++;
        return;
      }
      const before = this.callingSid;
      this.callingSid = fromSid;
      try {
        this.core.guard(name, () => behaviour[name](...args));
      } finally {
        this.callingSid = before;
      }
    }
  };
  var LISTS = /* @__PURE__ */ new WeakMap();
  function networkCallableOf(cls) {
    let set = LISTS.get(cls);
    if (set) return set;
    const names = /* @__PURE__ */ new Set();
    for (let c = cls; typeof c === "function" && c !== Behaviour && c !== Function.prototype; c = Object.getPrototypeOf(c)) {
      if (Object.prototype.hasOwnProperty.call(c, "networkCallable")) {
        const list = c.networkCallable;
        if (Array.isArray(list)) {
          for (const name of list) if (typeof name === "string") names.add(name);
        }
      }
    }
    set = names;
    LISTS.set(cls, set);
    return set;
  }
  function callable(behaviour, name) {
    if (typeof name !== "string" || name.length === 0 || name.charCodeAt(0) === 95 || name === "constructor") return false;
    if (!networkCallableOf(behaviour.constructor).has(name)) return false;
    for (let proto = Object.getPrototypeOf(behaviour); proto && proto !== Behaviour.prototype && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
      if (Object.prototype.hasOwnProperty.call(proto, name)) return typeof behaviour[name] === "function";
    }
    return false;
  }
  function parseOurs(data, slug, inst) {
    if (typeof data !== "string" || data.indexOf('"pk":1') < 0) return null;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const e = parsed;
    if (e.pk !== 1 || e.g !== slug || e.i !== inst || typeof e.t !== "string") return null;
    return e;
  }

  // portkit/src/refrecord.ts
  var RefereeTable = class {
    constructor(presence, referee, name, parseEntry) {
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "name");
      __publicField(this, "parseEntry");
      __publicField(this, "last", null);
      __publicField(this, "lastText", "");
      this.presence = presence;
      this.referee = referee;
      this.name = name;
      this.parseEntry = parseEntry;
    }
    /** The table as the referee published it: read from the referee's own user state, else the last one read. */
    read() {
      const ref = this.referee.current();
      const epoch = this.referee.epoch;
      if (ref) {
        const raw = this.presence.extra(ref.sid, this.name);
        const parsed = this.parse(raw, epoch);
        if (parsed) {
          this.last = { e: epoch, m: parsed };
          return parsed;
        }
      }
      return this.last && this.last.e === epoch ? this.last.m : {};
    }
    /** A copy the referee may change and `write`: its own published table, else its predecessor's last one. */
    working() {
      const epoch = this.referee.epoch;
      const own = this.parse(this.presence.extra(this.presence.localSid, this.name), epoch);
      const base = own ?? (this.last && this.last.e === epoch ? this.last.m : {});
      return JSON.parse(JSON.stringify(base));
    }
    /** True when the current referee's user state holds a table of this epoch (an empty one counts). */
    published() {
      const ref = this.referee.current();
      return !!ref && this.parse(this.presence.extra(ref.sid, this.name), this.referee.epoch) !== null;
    }
    /**
     * The referee publishes the table it carries (its predecessor's last one, or an empty one in a new epoch) as soon as
     * its term starts, before any entry changes: a page that starts in between would otherwise read no table at all, its
     * saved draw could not come back, and it would take everything numbered before it came as new. True when it wrote.
     */
    ensurePublished() {
      if (!this.referee.isMe()) return false;
      if (this.parse(this.presence.extra(this.presence.localSid, this.name), this.referee.epoch) !== null) return false;
      this.lastText = "";
      this.write(this.working());
      return true;
    }
    /** Publishes the table in the local player's user state (only the referee calls this). */
    write(table) {
      const value = { e: this.referee.epoch, m: table };
      const text = asciiJson(value);
      if (text === this.lastText && this.presence.extra(this.presence.localSid, this.name) !== void 0) return;
      this.lastText = text;
      this.presence.setExtra(this.name, value);
      this.last = { e: value.e, m: JSON.parse(JSON.stringify(table)) };
    }
    parse(raw, epoch) {
      if (!isRecord(raw) || raw.e !== epoch || !isRecord(raw.m)) return null;
      const out = {};
      for (const key of Object.keys(raw.m)) {
        const entry = this.parseEntry(raw.m[key]);
        if (entry !== null) out[key] = entry;
      }
      return out;
    }
  };

  // portkit/src/commands.ts
  var MAX_COMMAND_BYTES = 2048;
  var MAX_BATCH = 8;
  var MAX_BATCH_BYTES = 4096;
  var Commands = class {
    constructor(core, presence, referee, routes) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "routes");
      __publicField(this, "queue", []);
      __publicField(this, "nextNumber", 0);
      __publicField(this, "acks");
      __publicField(this, "reviewing", false);
      __publicField(this, "reviewAgain", false);
      __publicField(this, "sealing", false);
      /** Referee: since when a sender's first due request (`<sid>` newline `<n>`) has waited for its write mark. */
      __publicField(this, "heldSince", /* @__PURE__ */ new Map());
      __publicField(this, "holding", false);
      /** False until behaviours have started: the referee runs nothing before then. */
      __publicField(this, "started", false);
      __publicField(this, "run", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.routes = routes;
      this.acks = new RefereeTable(presence, referee, "ak", (v) => typeof v === "number" ? v : null);
    }
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
      this.core.onState(() => {
        if (this.holding) Promise.resolve().then(() => this.review());
      });
    }
    send(behaviour, name, args) {
      const address = this.routes.address(behaviour);
      if (!address) return 0;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCommand: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable)`);
        return 0;
      }
      if (this.nextNumber === 0) this.nextNumber = (this.table()[this.core.me.sid] ?? 0) + 1;
      const n = this.nextNumber++;
      const record = [n, address.id, address.playerSid ?? "", name, args.map(encodeValue)];
      if (utf8Length(asciiJson(record)) > MAX_COMMAND_BYTES) {
        this.routes.refused(behaviour, "value_too_large", name);
        return 0;
      }
      this.queue.push({ n, behaviour, record, sealed: false });
      if (!this.sealing) {
        this.sealing = true;
        Promise.resolve().then(() => this.seal());
      }
      return n;
    }
    /** After the turn that sent them: the turn's writes go out first, then the requests, marked with what they follow. */
    seal() {
      this.sealing = false;
      if (this.core.disposed) return;
      this.core.guard("command write mark", () => this.routes.flush?.());
      const marks = this.routes.marks?.() ?? [];
      for (const pending of this.queue) {
        if (pending.sealed) continue;
        pending.sealed = true;
        if (marks.length) {
          const [n, id, sid, name, args] = pending.record;
          pending.record = [n, id, sid, name, args, marks];
        }
      }
      this.review();
    }
    /**
     * Publishes, runs and acknowledges whatever is due. Also called about once a second. Not re-entrant: a command
     * handler that publishes a user-state record (Secrets.beginDeal, presence.setExtra) tells every record listener at
     * once, which calls this again; that call is held and run after the current pass, so no command runs inside another.
     */
    review() {
      if (this.core.disposed || !this.started) return;
      if (this.reviewing) {
        this.reviewAgain = true;
        return;
      }
      this.reviewing = true;
      try {
        let passes = 0;
        do {
          this.reviewAgain = false;
          this.reviewOnce();
        } while (this.reviewAgain && !this.core.disposed && ++passes < 16);
      } finally {
        this.reviewing = false;
        this.reviewAgain = false;
      }
    }
    reviewOnce() {
      const me = this.core.me.sid;
      const acked = this.table()[me] ?? 0;
      while (this.queue.length && this.queue[0].n <= acked) {
        const done = this.queue.shift();
        this.core.guard("OnCommandAcknowledged", () => this.routes.acknowledged(done.behaviour, done.n));
      }
      const published = this.presence.extra(me, "q");
      if (this.queue.length) {
        const batch = [];
        let bytes = 2;
        for (const pending of this.queue) {
          if (!pending.sealed) break;
          const size = utf8Length(asciiJson(pending.record)) + 1;
          if (batch.length >= MAX_BATCH || batch.length && bytes + size > MAX_BATCH_BYTES) break;
          batch.push(pending.record);
          bytes += size;
        }
        const first = Array.isArray(published) && Array.isArray(published[0]) ? published[0][0] : null;
        const last = Array.isArray(published) && Array.isArray(published[published.length - 1]) ? published[published.length - 1][0] : null;
        if (batch.length && (first !== batch[0][0] || last !== batch[batch.length - 1][0])) this.presence.setExtra("q", batch);
      } else if (published !== void 0) this.presence.setExtra("q", void 0);
      if (this.referee.isMe()) this.officiate();
    }
    officiate() {
      const table = this.acks.working();
      let changed = false;
      const now = this.core.platform.clock.now();
      let holding = false;
      for (const sid of Object.keys(table)) {
        if (!this.presence.has(sid)) {
          delete table[sid];
          changed = true;
        }
      }
      for (const who of this.presence.list()) {
        const batch = this.presence.extra(who.sid, "q");
        if (!Array.isArray(batch)) continue;
        for (const q of batch.slice(0, MAX_BATCH)) {
          if (!Array.isArray(q) || typeof q[0] !== "number" || typeof q[1] !== "string" || typeof q[3] !== "string") break;
          const acked = table[who.sid] ?? 0;
          if (q[0] <= acked) continue;
          if (acked > 0 && q[0] !== acked + 1) break;
          const key = who.sid + "\n" + q[0];
          if (who.sid !== this.core.me.sid && !this.marked(q[5])) {
            const since = this.heldSince.get(key) ?? now;
            this.heldSince.set(key, since);
            if (now - since < this.core.options.eventHoldMs) {
              holding = true;
              if (since === now) this.core.scheduler.after(this.core.options.eventHoldMs + 1, () => this.review());
              break;
            }
            this.core.log("info", `a command from session ${who.sid} ran without the state it was sent after (it had not arrived in ${this.core.options.eventHoldMs} ms)`);
          }
          this.heldSince.delete(key);
          table[who.sid] = q[0];
          this.acks.write(table);
          changed = false;
          const behaviour = this.routes.resolve(q[1], typeof q[2] === "string" && q[2] ? q[2] : null);
          const args = Array.isArray(q[4]) ? q[4].map(decodeValue) : [];
          this.run++;
          if (behaviour) this.routes.invoke(behaviour, q[3], args, who.sid);
        }
      }
      if (changed) this.acks.write(table);
      this.holding = holding;
      if (!holding) this.heldSince.clear();
    }
    /** Has the referee seen every claim and write in a request's mark? (No mark, or a malformed one: nothing to wait for.) */
    marked(mark) {
      if (!Array.isArray(mark) || !this.routes.seen) return true;
      for (const m of mark.slice(0, 8)) {
        if (!Array.isArray(m) || typeof m[0] !== "string" || typeof m[1] !== "number" || typeof m[2] !== "number") continue;
        if (!this.routes.seen(m[0], m[1], m[2])) return false;
      }
      return true;
    }
    table() {
      return this.acks.read();
    }
  };

  // portkit/src/core.ts
  var DEFAULT_OPTIONS = {
    settleMs: 1e3,
    claimStepMs: 400,
    claimRetryMs: 3e3,
    snapshotTimeoutMs: 8e3,
    clockTimeoutMs: 2e3,
    clockResyncMs: 6e4,
    admitWarnMs: 15e3,
    ownerClaimTimeoutMs: 5e3,
    continuousIntervalMs: 200,
    eventHoldMs: 2e3,
    whenEmpty: "reset"
  };
  var Core = class {
    constructor(platform, slug, inst, options, scheduler) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      /** `pk1.<slug>.<inst>` */
      __publicField(this, "prefix");
      __publicField(this, "options");
      __publicField(this, "scheduler");
      /** The local player as the platform reported them when the instance started. */
      __publicField(this, "me");
      __publicField(this, "disposed", false);
      __publicField(this, "unsubs", []);
      __publicField(this, "stateHandlers", []);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.prefix = statePrefix(slug, inst);
      this.options = options;
      this.scheduler = scheduler;
      this.me = platform.local();
    }
    /** Starts listening to the room's state under this instance's prefix. */
    listen() {
      const dot = this.prefix + ".";
      this.own(
        this.platform.onState(dot, (path, value) => {
          if (this.disposed) return;
          const key = path.slice(dot.length);
          for (const handler of this.stateHandlers.slice()) {
            try {
              handler(key, value);
            } catch (error) {
              this.error("state handler", error);
            }
          }
        })
      );
    }
    /** Reads a leaf of this instance from the mirror. `key` is relative to the prefix. */
    get(key) {
      return this.platform.stateGet(this.prefix + "." + key);
    }
    set(key, value) {
      if (this.disposed) return;
      this.platform.stateSet(this.prefix + "." + key, value);
    }
    entries() {
      const dot = this.prefix + ".";
      return this.platform.stateEntries(dot).map(([path, value]) => [path.slice(dot.length), value]);
    }
    onState(handler) {
      this.stateHandlers.push(handler);
    }
    /** Keeps an unsubscribe to run when the instance is disposed. */
    own(unsub) {
      if (this.disposed) unsub();
      else this.unsubs.push(unsub);
    }
    log(level, message) {
      this.platform.log(level, `[${this.slug}:${this.inst}] ${message}`);
    }
    error(where, error) {
      const text = error instanceof Error ? error.stack ?? error.message : String(error);
      this.log("error", `${where}: ${text}`);
    }
    /** Runs game code so that one behaviour's exception cannot stop the others. */
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.error(where, error);
      }
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.scheduler.stop();
      for (const unsub of this.unsubs.splice(0)) {
        try {
          unsub();
        } catch {
        }
      }
      this.stateHandlers.length = 0;
    }
  };

  // portkit/src/host.ts
  function encodeRelayArg(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 37 || c === 124 || c === 94 || c === 34 || c === 92 || c < 32) {
        out += "%" + c.toString(16).toUpperCase().padStart(2, "0");
      } else if (c >= 55296 && c <= 57343) {
        const pairStart = c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320;
        if (pairStart) {
          out += text[i] + text[i + 1];
          i++;
        } else out += "\uFFFD";
      } else out += text[i];
    }
    return out;
  }
  function decodeRelayArg(text) {
    return text.replace(/%([0-9A-F]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  function relayNumber(value) {
    if (!Number.isFinite(value)) return "0";
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
  function relayRecord(op, target, args) {
    let record = op + "|" + (typeof target === "number" ? String(target) : encodeRelayArg(target));
    for (const arg of args) record += "|" + encodeRelayArg(arg);
    return record;
  }
  function relayPayload(slug, inst, records) {
    return relayKey(slug, inst) + "|" + records.join("^");
  }
  function parseEventArgs(text) {
    return text === "" ? [] : text.split("|").map(decodeRelayArg);
  }
  function materialProperty(property, slot = 0) {
    return slot > 0 ? `#${Math.floor(slot)}:${property}` : property;
  }
  var MAX_PAYLOAD = 12e3;
  var RelayHost = class {
    constructor(platform, slug, inst, refs) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      __publicField(this, "refs");
      __publicField(this, "warned", /* @__PURE__ */ new Set());
      __publicField(this, "waiting", /* @__PURE__ */ new Map());
      /** What was last sent (or queued) per target and property: an unchanged value is not sent again. */
      __publicField(this, "last", /* @__PURE__ */ new Map());
      __publicField(this, "queue", []);
      __publicField(this, "nextRequest", 1);
      /** Payloads and records handed to the bridge, for tests and diagnostics. */
      __publicField(this, "payloadsSent", 0);
      __publicField(this, "recordsSent", 0);
      /**
       * The path under the kit root of a bound object (bindings.objects), or undefined. `setActive` on a bound object
       * outside refs goes by the relay as `@<path>`: one road for the object's whole life, in order with every other
       * relay op, and one that can switch an object the page cannot see (an inactive one) back on.
       */
      __publicField(this, "pathOf", () => void 0);
      /** Plays a clip of the object's own list through the page when the page can reach the object. */
      __publicField(this, "fallbackClip", () => false);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.refs = refs;
    }
    /** Called with the graph's reply to a clock op. */
    onClockReply(requestId, seconds) {
      const resolve = this.waiting.get(requestId);
      if (!resolve) return;
      this.waiting.delete(requestId);
      resolve(seconds);
    }
    setText(target, text) {
      this.value("text", target, "text", [text]);
    }
    animBool(target, name, value) {
      this.value("animBool", target, "anim." + name, [name, value ? "1" : "0"]);
    }
    animFloat(target, name, value) {
      this.value("animFloat", target, "anim." + name, [name, relayNumber(value)]);
    }
    animInt(target, name, value) {
      this.value("animInt", target, "anim." + name, [name, String(Math.trunc(value))]);
    }
    animResetTrigger(target, name) {
      this.event("animResetTrigger", target, [name]);
    }
    animPlay(target, state, crossFadeSeconds = 0) {
      this.event("animPlay", target, [state, relayNumber(crossFadeSeconds)]);
    }
    animTrigger(target, name) {
      this.event("animTrigger", target, [name, "1"]);
    }
    particles(target, play) {
      this.event("particles", target, [play ? "play" : "stop"]);
    }
    setColor(target, property, color, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("color", target, "color." + name, [name, relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    matFloat(target, property, value, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("matFloat", target, "mat." + name, [name, relayNumber(value)]);
    }
    uiColor(target, color) {
      this.value("uiColor", target, "uiColor", [relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    setActive(target, active) {
      if (!target.startsWith("@") && this.refs.indexOf(target) < 0) {
        const path = this.pathOf(target);
        if (path !== void 0) target = "@" + path;
      }
      this.value("active", target, "active", [active ? "1" : "0"]);
    }
    playClip(target, clipIndex, clipsOn, volumeScale) {
      const own = clipsOn === void 0 || clipsOn === target;
      const scaled = volumeScale !== void 0 && volumeScale !== 1;
      if (own && !scaled && !target.startsWith("@") && this.refs.indexOf(target) < 0 && this.fallbackClip(target, clipIndex)) return;
      const holder = this.resolve("audio", own ? target : clipsOn);
      if (holder === null) return;
      if (typeof holder !== "number") {
        this.warnOnce(`audio:${holder}`, `the clips of ${holder} cannot be played: the audio op needs the holder in bindings.refs`);
        return;
      }
      if (scaled) this.event("audioScaled", target, [String(Math.trunc(clipIndex)), String(holder), relayNumber(volumeScale)]);
      else this.event("audio", target, [String(Math.trunc(clipIndex)), String(holder)]);
    }
    audioPitch(target, pitch) {
      this.value("audioPitch", target, "audioPitch", [relayNumber(pitch)]);
    }
    audioVolume(target, volume) {
      this.value("audioVolume", target, "audioVolume", [relayNumber(volume)]);
    }
    animEnabled(target, enabled) {
      this.value("animEnabled", target, "animEnabled", [enabled ? "1" : "0"]);
    }
    uiSetToggle(target, on) {
      this.value("uiSetToggle", target, "uiSetToggle", [on ? "1" : "0"]);
    }
    uiSetSlider(target, value) {
      this.value("uiSetSlider", target, "uiSetSlider", [relayNumber(value)]);
    }
    scale(target, localScale) {
      this.value("scale", target, "scale", [relayNumber(localScale.x), relayNumber(localScale.y), relayNumber(localScale.z)]);
    }
    rbVelocity(target, velocity) {
      this.event("rbVelocity", target, [relayNumber(velocity.x), relayNumber(velocity.y), relayNumber(velocity.z)]);
    }
    rbLaunch(target, velocity) {
      this.event("rbLaunch", target, [relayNumber(velocity.x), relayNumber(velocity.y), relayNumber(velocity.z)]);
      const wire = this.resolve("rbLaunch", target);
      if (wire !== null) this.last.delete(`${wire}/rbKinematic`);
    }
    rbKinematic(target, kinematic) {
      this.value("rbKinematic", target, "rbKinematic", [kinematic ? "1" : "0"]);
    }
    spawn(target, name) {
      this.event("spawn", target, [name]);
    }
    despawn(target) {
      this.event("despawn", target, []);
      if (target.startsWith("@")) {
        for (const key of [...this.last.keys()]) if (key.startsWith(target + "/")) this.last.delete(key);
      }
    }
    op(name, target, args, property) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || name === "clock") throw new Error(`'${name}' is not a relay op name (letters, digits, _; not clock)`);
      const text = args.map((a) => typeof a === "number" ? relayNumber(a) : typeof a === "boolean" ? a ? "1" : "0" : String(a));
      if (property !== void 0) this.value(name, target, `op.${name}.${property}`, text);
      else this.event(name, target, text);
    }
    /**
     * A request the graph answers with a graph event (pkHead), sent at once and with no target (as the clock): `args`
     * are sent as they are (ids and session ids, which need no encoding).
     */
    request(op, args) {
      this.platform.relaySend(relayPayload(this.slug, this.inst, [relayRecord(op, 0, args.map(encodeRelayArg))]));
    }
    /** The clock is not batched: its answer is timed from the moment it is sent. */
    requestClock() {
      const id = String(this.nextRequest++);
      return new Promise((resolve) => {
        this.waiting.set(id, resolve);
        this.platform.relaySend(relayPayload(this.slug, this.inst, [relayRecord("clock", 0, [id])]));
      });
    }
    /** Forgets clock requests nobody answered. */
    abandonClock() {
      this.waiting.clear();
    }
    /** Forgets what was sent, so that every value goes out again (after the kit was loaded anew). */
    forget() {
      this.last.clear();
    }
    flush() {
      if (!this.queue.length) return;
      const queue = this.queue;
      this.queue = [];
      const prefix = relayKey(this.slug, this.inst).length + 1;
      let batch = [];
      let size = prefix;
      const send = () => {
        if (!batch.length) return;
        this.payloadsSent++;
        this.recordsSent += batch.length;
        this.platform.relaySend(relayPayload(this.slug, this.inst, batch));
        batch = [];
        size = prefix;
      };
      for (const item of queue) {
        if (batch.length && size + item.record.length + 1 > MAX_PAYLOAD) send();
        batch.push(item.record);
        size += item.record.length + 1;
      }
      send();
    }
    warnOnce(key, message) {
      if (this.warned.has(key)) return;
      this.warned.add(key);
      this.platform.log("warn", `[${this.slug}:${this.inst}] ${message}`);
    }
    /** The wire form of a target: a Refs index, "@<path>", or null when the relay cannot reach the object. */
    resolve(op, target) {
      if (target.startsWith("@")) return target;
      const index = this.refs.indexOf(target);
      if (index >= 0) return index;
      if (!this.warned.has(target)) {
        this.warned.add(target);
        this.platform.log("warn", `[${this.slug}:${this.inst}] '${target}' is not in bindings.refs, so the relay graph cannot reach it (${op} ignored)`);
      }
      return null;
    }
    /** Queues a value. Sending the same value again does nothing; a newer one in the same tick replaces it. */
    value(op, target, property, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      const record = relayRecord(op, wire, args);
      const slot = `${wire}/${property}`;
      if (this.last.get(slot) === record) return;
      this.last.set(slot, record);
      const pending = this.queue.find((q) => q.slot === slot);
      if (pending) pending.record = record;
      else this.queue.push({ slot, record });
    }
    event(op, target, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      this.queue.push({ slot: null, record: relayRecord(op, wire, args) });
    }
  };
  var ClockSync = class {
    constructor(clock) {
      __publicField(this, "clock");
      __publicField(this, "offsetSeconds");
      __publicField(this, "synced", false);
      this.clock = clock;
      this.offsetSeconds = clock.wallSeconds() - clock.now() / 1e3;
    }
    /** `sentAt` and the present bracket the host's reading; it is placed halfway between them. */
    accept(hostSeconds, sentAtMs) {
      if (!Number.isFinite(hostSeconds)) return;
      const mid = (sentAtMs + this.clock.now()) / 2;
      this.offsetSeconds = hostSeconds - mid / 1e3;
      this.synced = true;
    }
    seconds() {
      return this.clock.now() / 1e3 + this.offsetSeconds;
    }
  };

  // portkit/src/scene.ts
  var Transform = class {
    constructor(gameObject) {
      __publicField(this, "gameObject");
      __publicField(this, "pos", Vector3.zero);
      __publicField(this, "rot", Quaternion.identity);
      __publicField(this, "lpos", Vector3.zero);
      __publicField(this, "lrot", Quaternion.identity);
      __publicField(this, "lscale", Vector3.one);
      /** False until the world pose has been read from the host or set by the script. */
      __publicField(this, "known", false);
      this.gameObject = gameObject;
    }
    /** World position as last set or reported. Returns a copy, as a C# struct would be. */
    get position() {
      return this.pos.clone();
    }
    set position(v) {
      this.pos = v.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: v.clone() });
    }
    get rotation() {
      return this.rot.clone();
    }
    set rotation(q) {
      this.rot = q.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ rotation: q.clone() });
    }
    get eulerAngles() {
      return this.rot.eulerAngles;
    }
    set eulerAngles(v) {
      this.rotation = Quaternion.Euler(v.x, v.y, v.z);
    }
    /** Local values are only what the script itself set: the host is not asked for them. */
    get localPosition() {
      return this.lpos.clone();
    }
    set localPosition(v) {
      this.lpos = v.clone();
      this.gameObject.host?.setTransform({ localPosition: v.clone() });
    }
    get localRotation() {
      return this.lrot.clone();
    }
    set localRotation(q) {
      this.lrot = q.clone();
      this.gameObject.host?.setTransform({ localRotation: q.clone() });
    }
    get localScale() {
      return this.lscale.clone();
    }
    set localScale(v) {
      this.lscale = v.clone();
      this.gameObject.host?.setTransform({ localScale: v.clone() });
    }
    get forward() {
      return this.rot.rotate(Vector3.forward);
    }
    get up() {
      return this.rot.rotate(Vector3.up);
    }
    get right() {
      return this.rot.rotate(Vector3.right);
    }
    SetPositionAndRotation(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: position.clone(), rotation: rotation.clone() });
    }
    /** Asks the host where the object is now (after a drop, or physics). Await it before reading `position`. */
    async Refresh() {
      const pose2 = await this.gameObject.host?.readTransform();
      if (pose2) this._report(pose2.position, pose2.rotation);
    }
    /** @internal The host reported the object's pose. */
    _report(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
    }
  };
  var GameObject = class {
    constructor(key, name, host, actions, subscribe2 = null) {
      /** The key in bindings.objects, or "" for an object that only exists in the script. */
      __publicField(this, "key");
      __publicField(this, "name");
      __publicField(this, "transform");
      /** @internal */
      __publicField(this, "host");
      __publicField(this, "actions");
      __publicField(this, "subscribe");
      __publicField(this, "active", true);
      __publicField(this, "layerValue", -1);
      this.key = key;
      this.name = name;
      this.host = host;
      this.actions = actions;
      this.subscribe = subscribe2;
      this.transform = new Transform(this);
    }
    /** As last set by the script (objects start active unless the script says otherwise). */
    get activeSelf() {
      return this.active;
    }
    SetActive(active) {
      this.active = !!active;
      if (this.actions && this.key) this.actions.setActive(this.key, this.active);
      else this.host?.setActive(this.active);
    }
    /**
     * The object's layer as last set by the script (-1 before that: the kit's own). Setting it moves the object's
     * collider: 20 (Grabbable) for a pickup that may be picked up, 5 (UI) for one that may not, which is then
     * clickable and lets hands pass through. Only what changes is sent.
     */
    get layer() {
      return this.layerValue;
    }
    set layer(value) {
      const layer = Math.trunc(value);
      if (layer === this.layerValue) return;
      this.layerValue = layer;
      this.host?.setLayer(layer);
    }
    /**
     * Listens to this object's events: the page's own (click, grab, drop, ...) and those a graph reports for it
     * (uiButton, uiSlider, heldTrigger, ...). Prefer `events` in bindings.json; this is for wiring made in code.
     * The listener lives as long as the instance.
     */
    On(kind, handler) {
      if (this.subscribe) this.subscribe(kind, handler);
      else this.host?.on(kind, handler);
    }
    /**
     * Attaches this object to the local player's hand (0 left, 1 right), at an offset from it (BS.AttachedObject;
     * UNVERIFIED in Play mode). Only the local player can be attached to; other players see it only through a synced
     * transform.
     */
    AttachToHand(side, position = new Vector3(), rotation = new Quaternion()) {
      this.host?.attachToHand(side, position, rotation);
    }
    /**
     * Attaches this object to the local player's head, at an offset from it (BS.AttachedObject, attachment point Head;
     * UNVERIFIED in Play mode): a label over the player's avatar. With `autoSync` the app shows the attachment to the
     * other players too (the object gets its per-instance network id if it has none), so each player attaches their
     * own object (one per player: a per-player behaviour's object, or a pool) and everyone sees every label.
     */
    AttachToHead(position = new Vector3(), rotation = new Quaternion(), autoSync = false) {
      this.host?.attachToHead?.(position, rotation, autoSync);
    }
    /** Lets go of what AttachToHand or AttachToHead attached. */
    Detach() {
      this.host?.detach();
    }
    /** Makes the local player let go of this object if they hold it (VRChat: VRCPickup.Drop()); `drop` follows. */
    ReleaseGrab() {
      this.host?.releaseGrab();
    }
    /** Asks to own the object's synced transform (VRChat: Networking.SetOwner on a VRCObjectSync). */
    TakeOwnership() {
      this.host?.takeOwnership();
    }
    toString() {
      return this.name || this.key;
    }
  };
  var ComponentRef = class {
    constructor(kind, gameObject, actions) {
      __publicField(this, "kind");
      __publicField(this, "gameObject");
      __publicField(this, "actions");
      this.kind = kind;
      this.gameObject = gameObject;
      this.actions = actions;
    }
    get transform() {
      return this.gameObject.transform;
    }
  };
  var TextRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      /** Null until the script first sets it: the kit's own text (a prefab placeholder) is unknown, so the first value is always sent, "" included. */
      __publicField(this, "value", null);
    }
    get text() {
      return this.value ?? "";
    }
    set text(value) {
      const next = value === null || value === void 0 ? "" : String(value);
      if (next === this.value) return;
      this.value = next;
      this.actions.setText(this.gameObject.key, next);
    }
    /** The colour of the text (a uGUI graphic). */
    set color(value) {
      this.actions.uiColor(this.gameObject.key, value);
    }
  };
  var AnimatorRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "on", true);
    }
    /** Animator.enabled: a disabled animator holds its pose. Reading gives what the script last set. */
    get enabled() {
      return this.on;
    }
    set enabled(value) {
      this.on = !!value;
      this.actions.animEnabled(this.gameObject.key, this.on);
    }
    SetBool(name, value) {
      this.actions.animBool(this.gameObject.key, name, value);
    }
    SetFloat(name, value) {
      this.actions.animFloat(this.gameObject.key, name, value);
    }
    SetInteger(name, value) {
      this.actions.animInt(this.gameObject.key, name, value);
    }
    SetTrigger(name) {
      this.actions.animTrigger(this.gameObject.key, name);
    }
    ResetTrigger(name) {
      this.actions.animResetTrigger(this.gameObject.key, name);
    }
    Play(state) {
      this.actions.animPlay(this.gameObject.key, state, 0);
    }
    CrossFade(state, seconds) {
      this.actions.animPlay(this.gameObject.key, state, seconds);
    }
  };
  var ParticleSystemRef = class extends ComponentRef {
    Play() {
      this.actions.particles(this.gameObject.key, true);
    }
    Stop() {
      this.actions.particles(this.gameObject.key, false);
    }
  };
  var RendererRef = class extends ComponentRef {
    /** Sets a colour property of one of the renderer's materials, "_BaseColor" of slot 0 by default (URP). */
    SetColor(color, property = "_BaseColor", slot = 0) {
      this.actions.setColor(this.gameObject.key, property, color, slot);
    }
    /** Sets a float property of one of the renderer's materials. */
    SetFloat(property, value, slot = 0) {
      this.actions.matFloat(this.gameObject.key, property, value, slot);
    }
  };
  var AudioSourceRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "pitchValue", 1);
      __publicField(this, "volumeValue", 1);
      /** The clip `Play()` plays (UnityEngine.AudioSource.clip). */
      __publicField(this, "clip", null);
    }
    /** Plays a clip (a `$clip` field value, or an index into this object's own clip list) through this audio source. */
    PlayOneShot(clip, volumeScale) {
      if (typeof clip === "number") this.actions.playClip(this.gameObject.key, clip, void 0, volumeScale);
      else this.actions.playClip(this.gameObject.key, clip.index, clip.on ?? void 0, volumeScale);
    }
    /** Plays `clip` as a one-shot (it overlaps a sound still playing instead of cutting it off). */
    Play() {
      if (this.clip) this.PlayOneShot(this.clip);
    }
    /** AudioSource.pitch (relay op `audioPitch`). Reading gives what the script last set. */
    get pitch() {
      return this.pitchValue;
    }
    set pitch(value) {
      this.pitchValue = value;
      this.actions.audioPitch(this.gameObject.key, value);
    }
    /** AudioSource.volume (relay op `audioVolume`). */
    get volume() {
      return this.volumeValue;
    }
    set volume(value) {
      this.volumeValue = value;
      this.actions.audioVolume(this.gameObject.key, value);
    }
  };
  var AudioClipRef = class {
    constructor(index, on = null) {
      __publicField(this, "index");
      __publicField(this, "on");
      this.index = index;
      this.on = on;
    }
  };
  function makeComponent(kind, gameObject, actions) {
    switch (kind) {
      case "Text":
      case "TMP":
        return new TextRef(kind, gameObject, actions);
      case "Animator":
        return new AnimatorRef(kind, gameObject, actions);
      case "ParticleSystem":
        return new ParticleSystemRef(kind, gameObject, actions);
      case "Renderer":
        return new RendererRef(kind, gameObject, actions);
      case "AudioSource":
        return new AudioSourceRef(kind, gameObject, actions);
      case "Transform":
        return gameObject.transform;
      default:
        return new ComponentRef(kind, gameObject, actions);
    }
  }

  // portkit/src/networking.ts
  var Networking = class {
    /** @internal */
    constructor(host) {
      __publicField(this, "host");
      this.host = host;
    }
    get LocalPlayer() {
      return this.host.localPlayer();
    }
    /** True on the one client that is this instance's referee (VRChat: the master). */
    get IsReferee() {
      return this.host.isReferee();
    }
    /** The same as IsReferee, under the name upstream code uses. */
    get IsMaster() {
      return this.host.isReferee();
    }
    /**
     * Where the app places `player`'s head: the SDK's Get User State through the relay op `pkHead`. Null when the app does
     * not know (yet), on a kit without the op, or after `seconds`. A referee can check another player's claim with it.
     */
    HeadOf(player, seconds = 2) {
      return this.host.headOf ? this.host.headOf(player, seconds) : Promise.resolve(null);
    }
    /** The referee, or null while there is none. */
    get Master() {
      return this.host.refereePlayer();
    }
    /**
     * IsOwner(target): does the local player own it?  IsOwner(player, target): does that player?
     * A GameObject stands for the behaviours on it, as in Udon, where ownership belongs to the object.
     */
    IsOwner(a, b) {
      const player = b === void 0 ? this.host.localPlayer() : a;
      const target = b === void 0 ? a : b;
      const behaviour = this.first(target);
      return behaviour ? this.host.isOwner(behaviour, player) : false;
    }
    GetOwner(target) {
      const behaviour = this.first(target);
      return behaviour ? this.host.owner(behaviour) : null;
    }
    /**
     * Makes `player` the owner. It takes effect here at once; if someone else claimed at the same moment and the
     * room kept their claim, OnOwnershipTransferred reports the real owner a moment later.
     */
    SetOwner(player, target) {
      for (const behaviour of this.all(target)) this.host.setOwner(behaviour, player);
    }
    /** Synced time in seconds: the same on every client, to within the accuracy of the first clock exchange. */
    GetServerTimeInSeconds() {
      return this.host.serverSeconds();
    }
    GetServerTimeInMilliseconds() {
      return Math.floor(this.host.serverSeconds() * 1e3);
    }
    /** Everyone taking part in this instance, in player-id order (VRChat: VRCPlayerApi.GetPlayers). */
    GetPlayers() {
      return this.host.playerList();
    }
    GetPlayerCount() {
      return this.host.playerList().length;
    }
    GetPlayerById(id) {
      return this.host.playerById(id);
    }
    /**
     * While a network event or a command runs: the player who sent it (the local player for one sent here).
     * Null outside one, and null for a sender who is not taking part in this instance.
     */
    get CallingPlayer() {
      return this.host.callingPlayer();
    }
    /** The sender's session and user id, as the room stamped them, even when they are not a participant. */
    get CallingSession() {
      return this.host.callingSession();
    }
    /**
     * In a game whose referee candidates are "declared": offers the local player as referee, or withdraws them.
     * A referee who withdraws stops being referee and the remaining candidates elect another.
     */
    SetRefereeCandidate(on) {
      this.host.setCandidate(on);
    }
    IsRefereeCandidate(player) {
      return this.host.isCandidate(player);
    }
    /** Whether this client started a new game, resumed a saved one, or joined one in progress. */
    get StartKind() {
      return this.host.startKind();
    }
    /** Always false: the app queues and retries writes itself. Kept so that upstream checks translate. */
    get IsClogged() {
      return false;
    }
    all(target) {
      return target instanceof GameObject ? this.host.behavioursOn(target) : [target];
    }
    first(target) {
      return this.all(target)[0] ?? null;
    }
  };

  // portkit/src/persistence.ts
  var Persistence = class {
    constructor(store, slug, inst, uid) {
      __publicField(this, "store");
      __publicField(this, "prefix");
      this.store = store;
      this.prefix = storagePrefix(slug, inst, uid);
    }
    /** The saved value, or `fallback` when there is none or it cannot be read. */
    get(key, fallback) {
      let text = null;
      try {
        text = this.store.get(this.prefix + key);
      } catch {
        return fallback;
      }
      if (text === null) return fallback;
      try {
        return decodeValue(JSON.parse(text));
      } catch {
        return fallback;
      }
    }
    /** False when the device refused to store it (storage full or switched off). */
    set(key, value) {
      try {
        this.store.set(this.prefix + key, JSON.stringify(encodeValue(value)));
        return true;
      } catch {
        return false;
      }
    }
    has(key) {
      try {
        return this.store.get(this.prefix + key) !== null;
      } catch {
        return false;
      }
    }
    remove(key) {
      try {
        this.store.remove(this.prefix + key);
      } catch {
      }
    }
    keys() {
      try {
        return this.store.keys(this.prefix).map((k) => k.slice(this.prefix.length));
      } catch {
        return [];
      }
    }
  };

  // portkit/src/players.ts
  var ID_SETTLE_MS = 600;
  var Player = class {
    constructor(sid, uid, name, isLocal, playerId) {
      __publicField(this, "sid");
      __publicField(this, "uid");
      __publicField(this, "isLocal");
      __publicField(this, "displayName");
      __publicField(this, "playerId");
      /** The space's owner or a moderator, as the platform reports it. Not proof: check what the room accepted. */
      __publicField(this, "isSpaceAdmin", false);
      /** @internal */
      __publicField(this, "_valid", true);
      /** @internal */
      __publicField(this, "_isMaster", () => false);
      this.sid = sid;
      this.uid = uid;
      this.displayName = name;
      this.isLocal = isLocal;
      this.playerId = playerId;
    }
    /** False once the player has left: keep no references across OnPlayerLeft. */
    IsValid() {
      return this._valid;
    }
    get isMaster() {
      return this._valid && this._isMaster();
    }
    toString() {
      return `${this.displayName}#${this.playerId}`;
    }
  };
  var Players = class {
    constructor(core, presence, referee) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "bySidMap", /* @__PURE__ */ new Map());
      __publicField(this, "claims", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "localAssigned", deferred());
      __publicField(this, "highWater", 0);
      __publicField(this, "myId", 0);
      __publicField(this, "recheck", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
    }
    /** Starts following ids and claims one for the local player (who must have announced already). */
    start() {
      this.presence.on(() => this.refresh());
      this.presence.onExtra(() => this.refresh());
      this.refresh();
      this.claim();
    }
    /** Resolves once the local player's id has stood for the settle time. */
    whenLocalAssigned() {
      return this.localAssigned.promise;
    }
    get local() {
      return this.bySidMap.get(this.core.me.sid) ?? null;
    }
    bySid(sid) {
      return this.bySidMap.get(sid) ?? null;
    }
    byId(id) {
      for (const player of this.bySidMap.values()) if (player.playerId === id) return player;
      return null;
    }
    /** Everyone taking part, in player-id order. */
    list() {
      return [...this.bySidMap.values()].sort((a, b) => a.playerId - b.playerId);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    /** Upkeep no event triggers. Called about once a second. */
    tend() {
      this.refresh();
    }
    idOf(sid) {
      const id = this.presence.extra(sid, "id");
      return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
    }
    claim() {
      let top = this.highWater;
      for (const who of this.presence.list()) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (id !== null && id > top) top = id;
        if (typeof hw === "number" && hw > top) top = hw;
      }
      this.myId = top + 1;
      this.highWater = this.myId;
      this.presence.setExtra("id", this.myId);
      this.presence.setExtra("hw", this.highWater);
      this.presence.flush();
    }
    refresh() {
      if (this.core.disposed) return;
      const clock = this.core.platform.clock;
      const now = clock.now();
      const me = this.core.me.sid;
      const present = this.presence.list();
      const holders = /* @__PURE__ */ new Map();
      let top = this.highWater;
      for (const who of present) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (typeof hw === "number" && hw > top) top = hw;
        if (id === null) {
          this.claims.delete(who.sid);
          continue;
        }
        if (id > top) top = id;
        const claim = this.claims.get(who.sid);
        if (!claim || claim.id !== id) this.claims.set(who.sid, { id, since: now });
        if (!holders.has(id)) holders.set(id, who.sid);
      }
      for (const sid of [...this.claims.keys()]) if (!this.presence.has(sid)) this.claims.delete(sid);
      if (this.myId > 0 && holders.get(this.myId) !== void 0 && holders.get(this.myId) !== me) {
        this.highWater = top;
        this.claim();
        return;
      }
      if (top > this.highWater) {
        this.highWater = top;
        if (this.myId > 0) this.presence.setExtra("hw", top);
      }
      const leaving = [];
      const joining = [];
      let nextCheck = Infinity;
      for (const player of this.bySidMap.values()) if (!this.presence.has(player.sid)) leaving.push(player);
      for (const who of present) {
        const claim = this.claims.get(who.sid);
        if (!claim || holders.get(claim.id) !== who.sid) continue;
        const existing = this.bySidMap.get(who.sid);
        if (existing) {
          existing.displayName = who.name;
          if (existing.playerId !== claim.id) {
            this.core.log("warn", `player ${existing.displayName} changed id ${existing.playerId} -> ${claim.id} after joining (two ids were claimed at once)`);
            existing.playerId = claim.id;
          }
          continue;
        }
        const ready = claim.since + ID_SETTLE_MS;
        const echoed = who.sid !== me || this.localEchoed();
        if (now >= ready && echoed) joining.push(this.make(who, claim.id));
        else nextCheck = Math.min(nextCheck, Math.max(ready, now + 50));
      }
      for (const player of leaving) {
        this.bySidMap.delete(player.sid);
        player._valid = false;
      }
      for (const player of joining) this.bySidMap.set(player.sid, player);
      for (const player of leaving) this.emit("leave", player);
      for (const player of joining.sort((a, b) => a.playerId - b.playerId)) this.emit("join", player);
      if (this.bySidMap.has(me)) this.localAssigned.resolve();
      if (this.recheck) this.core.scheduler.cancel(this.recheck);
      this.recheck = 0;
      if (nextCheck !== Infinity) {
        this.recheck = this.core.scheduler.after(nextCheck - now, () => {
          this.recheck = 0;
          this.refresh();
        });
      }
    }
    localEchoed() {
      const marker = safeParse(this.core.platform.userGet(this.core.me.sid, this.core.prefix + ".k"));
      return isRecord(marker) && isRecord(marker.x) && marker.x.id === this.myId;
    }
    make(who, id) {
      const player = new Player(who.sid, who.uid, who.name, who.isLocal, id);
      player._isMaster = () => this.referee.current()?.sid === player.sid;
      player.isSpaceAdmin = this.core.platform.players().find((p) => p.sid === who.sid)?.isAdmin === true;
      return player;
    }
    emit(kind, player) {
      for (const handler of this.handlers.slice()) this.core.guard("player handler", () => handler(kind, player));
    }
  };

  // portkit/src/presence.ts
  var Presence = class {
    constructor(core) {
      __publicField(this, "core");
      __publicField(this, "known", /* @__PURE__ */ new Map());
      __publicField(this, "extras", /* @__PURE__ */ new Map());
      __publicField(this, "texts", /* @__PURE__ */ new Map());
      /** Every public key each session has announced, kept after it leaves (a sealed box can outlive its sender's visit). */
      __publicField(this, "keysSeen", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "extraHandlers", []);
      __publicField(this, "announced", null);
      __publicField(this, "localExtras", {});
      __publicField(this, "dirty", false);
      __publicField(this, "started", false);
      this.core = core;
    }
    get markerPath() {
      return this.core.prefix + ".k";
    }
    start() {
      if (this.started) return;
      this.started = true;
      const { platform } = this.core;
      this.core.own(platform.onPlayers(() => this.recompute()));
      this.core.own(
        platform.onUser(this.core.prefix + ".", (_sid, path) => {
          if (path === this.markerPath) this.recompute();
        })
      );
      this.recompute();
    }
    /** Publishes the local marker. From here on the local player is a participant. */
    announce(publicKey) {
      this.announced = publicKey;
      this.write();
      this.recompute();
    }
    /** Withdraws the marker, when the instance stops while its player stays in the room. */
    retire() {
      if (this.announced === null) return;
      this.announced = null;
      this.core.platform.userSet(this.markerPath, null);
    }
    /** Sets or (with undefined) removes one of the local player's published records. Sent at the end of the tick. */
    setExtra(name, value) {
      if (value === void 0) {
        if (!(name in this.localExtras)) return;
        delete this.localExtras[name];
      } else this.localExtras[name] = value;
      this.dirty = true;
      this.emitExtra(this.core.me.sid);
    }
    /** The local player's session id. */
    get localSid() {
      return this.core.me.sid;
    }
    /** A published record of any participant, from the mirror (the local player's own is read back at once). */
    extra(sid, name) {
      if (sid === this.core.me.sid) return this.localExtras[name];
      return this.extras.get(sid)?.[name];
    }
    /** Called when a participant's published records may have changed. */
    onExtra(handler) {
      this.extraHandlers.push(handler);
    }
    /** Looks again at who is here: a session id can change without an event. Called about once a second. */
    tend() {
      if (this.started) this.recompute();
    }
    /** Sends the marker if a record changed. Called once per tick. */
    flush() {
      if (!this.dirty || this.announced === null || this.core.disposed) return;
      this.write();
    }
    write() {
      this.dirty = false;
      const marker = { k: this.announced, v: 1 };
      if (Object.keys(this.localExtras).length) marker.x = this.localExtras;
      this.core.platform.userSet(this.markerPath, asciiJson(marker));
    }
    /** Participants ordered by user id, then session id: the order referee ranks and player ids follow. */
    list() {
      return [...this.known.values()].sort(compare);
    }
    has(sid) {
      return this.known.has(sid);
    }
    get(sid) {
      return this.known.get(sid);
    }
    /** The public key a session announced, now or before it left; undefined for a session never seen. */
    keyOf(sid) {
      return this.known.get(sid)?.publicKey ?? this.keysSeen.get(sid);
    }
    /** Position of `sid` in `list()`, or -1. */
    rank(sid) {
      return this.list().findIndex((p) => p.sid === sid);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    recompute() {
      if (this.core.disposed) return;
      const { platform } = this.core;
      const now = /* @__PURE__ */ new Map();
      const changed = [];
      for (const player of platform.players()) {
        let key = null;
        if (player.isLocal) key = this.announced;
        else {
          const text = platform.userGet(player.sid, this.markerPath) ?? "";
          if (text !== this.texts.get(player.sid)) {
            this.texts.set(player.sid, text);
            const marker2 = safeParse(text);
            this.extras.set(player.sid, isRecord(marker2) && isRecord(marker2.x) ? marker2.x : {});
            changed.push(player.sid);
          }
          const marker = safeParse(text);
          if (isRecord(marker) && typeof marker.k === "string" && marker.k.length > 0) key = marker.k;
        }
        if (key === null) continue;
        now.set(player.sid, { sid: player.sid, uid: player.uid, name: player.name, isLocal: player.isLocal, publicKey: key });
      }
      const left = [];
      const joined = [];
      for (const [sid, who] of this.known) if (!now.has(sid)) left.push(who);
      for (const [sid, who] of now) {
        const before = this.known.get(sid);
        if (!before) joined.push(who);
        else {
          before.name = who.name;
          before.publicKey = who.publicKey;
        }
      }
      for (const who of now.values()) this.keysSeen.set(who.sid, who.publicKey);
      for (const who of left) {
        this.known.delete(who.sid);
        this.extras.delete(who.sid);
        this.texts.delete(who.sid);
      }
      for (const who of joined) this.known.set(who.sid, who);
      for (const who of left.sort(compare)) this.emit("leave", who);
      for (const who of joined.sort(compare)) this.emit("join", who);
      for (const sid of changed) if (this.known.has(sid)) this.emitExtra(sid);
    }
    emit(kind, who) {
      for (const handler of this.handlers.slice()) this.core.guard("presence handler", () => handler(kind, who));
    }
    emitExtra(sid) {
      for (const handler of this.extraHandlers.slice()) this.core.guard("presence record handler", () => handler(sid));
    }
  };
  function compare(a, b) {
    return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0;
  }

  // portkit/src/protect.ts
  var ProtectedValues = class {
    constructor(core) {
      __publicField(this, "core");
      /** Told when a protected value changed. */
      __publicField(this, "onChanged", () => {
      });
      this.core = core;
    }
    listen() {
      this.core.onState((key) => {
        if (key.startsWith("x.")) this.core.guard("OnProtectedChanged", () => this.onChanged(key.slice(2)));
      });
    }
    get CanWrite() {
      return this.core.platform.local().isAdmin;
    }
    Set(key, value) {
      if (!isPathSegment(key)) throw new Error(`a protected key must be 1-64 of A-Z a-z 0-9 _ - @, not '${key}'`);
      if (this.core.disposed) return;
      this.core.platform.stateSetProtected(`${this.core.prefix}.x.${key}`, asciiJson({ v: encodeValue(value) }));
    }
    Get(key, fallback) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return raw && typeof raw === "object" && "v" in raw ? decodeValue(raw.v) : fallback;
    }
    Has(key) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return !!raw && typeof raw === "object" && "v" in raw;
    }
  };

  // portkit/src/referee.ts
  var CROSSING_MS = 1500;
  var Referee = class {
    constructor(core, presence, rule) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "rule");
      __publicField(this, "handlers", []);
      __publicField(this, "judging", false);
      __publicField(this, "timer", 0);
      __publicField(this, "timerDue", -1);
      __publicField(this, "invalidSince", 0);
      __publicField(this, "claimAt", -Infinity);
      __publicField(this, "seen", null);
      __publicField(this, "lastEpoch", 0);
      __publicField(this, "declared", false);
      /** Counters for tests and diagnostics. */
      __publicField(this, "claims", 0);
      /** What this client found when it last claimed: a new epoch, or a game other participants were still running. */
      __publicField(this, "lastClaim", null);
      this.core = core;
      this.presence = presence;
      this.rule = rule;
    }
    start() {
      this.core.onState((key) => {
        if (key === "ref") this.check();
      });
      this.presence.on(() => this.check());
      this.presence.onExtra(() => this.check());
      this.invalidSince = this.core.platform.clock.now();
      this.check();
      this.core.scheduler.after(this.core.options.settleMs, () => {
        this.judging = true;
        this.invalidSince = this.core.platform.clock.now();
        this.check();
      });
    }
    /** The mirrored record, whether or not its session is still a candidate. */
    mirrored() {
      const raw = safeParse(this.core.get("ref"));
      if (!isRecord(raw) || typeof raw.sid !== "string" || typeof raw.uid !== "string") return null;
      if (typeof raw.term !== "number" || typeof raw.e !== "number") return null;
      return { sid: raw.sid, uid: raw.uid, term: raw.term, e: raw.e };
    }
    /** The referee, or null while there is none. */
    current() {
      const m = this.mirrored();
      return m && this.isCandidate(m.sid) ? m : null;
    }
    isMe() {
      return this.current()?.sid === this.core.me.sid;
    }
    /** The epoch of the last valid referee seen: records of any other epoch are ignored. 0 before the first. */
    get epoch() {
      return this.lastEpoch;
    }
    /** May this session be elected? */
    isCandidate(sid) {
      if (!this.presence.has(sid)) return false;
      return this.rule === "anyone" || this.presence.extra(sid, "rc") === 1;
    }
    /** Candidates in rank order. */
    candidates() {
      return this.presence.list().filter((p) => this.isCandidate(p.sid)).map((p) => p.sid);
    }
    /** Under the "declared" rule: offers the local player as referee, or withdraws the offer. */
    setCandidate(on) {
      if (this.declared === on) return;
      this.declared = on;
      this.presence.setExtra("rc", on ? 1 : void 0);
      this.presence.flush();
    }
    /** Tells the others which epoch this client is running in, so a claimant knows the game is still alive. */
    publishEpoch() {
      if (this.presence.extra(this.core.me.sid, "ep") === this.lastEpoch) return;
      this.presence.setExtra("ep", this.lastEpoch);
      this.presence.flush();
    }
    on(handler) {
      this.handlers.push(handler);
    }
    check() {
      if (this.core.disposed) return;
      const now = this.current();
      const before = this.seen;
      if (now) {
        this.cancelTimer();
        if (!before || before.sid !== now.sid || before.term !== now.term || before.e !== now.e) {
          const me2 = this.core.me.sid;
          if (before && before.sid === me2 && now.sid !== me2 && this.isCandidate(me2) && this.core.platform.clock.now() - this.claimAt > CROSSING_MS) {
            this.core.log("warn", `the referee seat was taken by session ${now.sid} (term ${now.term}) while this client was referee`);
          }
          this.lastEpoch = now.e;
          this.seen = now;
          this.publishEpoch();
          this.emit(now, before);
        }
        return;
      }
      if (before) {
        this.seen = null;
        this.invalidSince = this.core.platform.clock.now();
        this.claimAt = -Infinity;
        this.emit(null, before);
      }
      if (!this.judging) return;
      const me = this.core.me.sid;
      const rank = this.candidates().indexOf(me);
      if (rank < 0) {
        this.cancelTimer();
        return;
      }
      const earliest = Math.max(this.invalidSince + rank * this.core.options.claimStepMs, this.claimAt + this.core.options.claimRetryMs);
      if (this.timer && this.timerDue === earliest) return;
      this.cancelTimer();
      this.timerDue = earliest;
      this.timer = this.core.scheduler.after(Math.max(0, earliest - this.core.platform.clock.now()), () => {
        this.timer = 0;
        this.claim();
      });
    }
    claim() {
      if (this.core.disposed || this.current()) return;
      const me = this.core.me;
      if (!this.isCandidate(me.sid)) return;
      const old = this.mirrored();
      const alive = old !== null && this.presence.list().some((p) => this.presence.extra(p.sid, "ep") === old.e);
      const fresh = old === null || this.core.options.whenEmpty === "reset" && !alive;
      const record = { sid: me.sid, uid: me.uid, term: (old?.term ?? 0) + 1, e: (old?.e ?? 0) + (fresh ? 1 : 0) };
      this.claims++;
      this.lastClaim = { term: record.term, fresh, alive };
      this.claimAt = this.core.platform.clock.now();
      this.core.log("info", `claiming referee, term ${record.term}, epoch ${record.e}${fresh && old ? " (fresh start)" : ""}`);
      this.core.set("ref", asciiJson(record));
      this.check();
    }
    cancelTimer() {
      if (this.timer) this.core.scheduler.cancel(this.timer);
      this.timer = 0;
      this.timerDue = -1;
    }
    emit(now, before) {
      for (const handler of this.handlers.slice()) this.core.guard("referee handler", () => handler(now, before));
    }
  };

  // portkit/src/scheduler.ts
  var TICK_MS = 50;
  var TICK_SECONDS = TICK_MS / 1e3;
  var Scheduler = class {
    constructor(clock, onError) {
      __publicField(this, "clock");
      __publicField(this, "onError");
      __publicField(this, "delayed", /* @__PURE__ */ new Map());
      __publicField(this, "framed", []);
      __publicField(this, "nextHandle", 1);
      __publicField(this, "tickTimer", 0);
      __publicField(this, "running", false);
      __publicField(this, "stopped", false);
      __publicField(this, "startedAt", 0);
      __publicField(this, "lastTickAt", 0);
      __publicField(this, "tickCount", 0);
      /** Seconds the last tick covered (0 outside a tick's first run). */
      __publicField(this, "deltaTime", 0);
      this.clock = clock;
      this.onError = onError;
      this.startedAt = clock.now();
      this.lastTickAt = this.startedAt;
    }
    /** Seconds since the scheduler was made. */
    get time() {
      return (this.clock.now() - this.startedAt) / 1e3;
    }
    get ticks() {
      return this.tickCount;
    }
    /** Starts the tick. `onTick` runs every 50 ms; a page that stalled is not paid back with a burst of ticks. */
    start(onTick) {
      if (this.running || this.stopped) return;
      this.running = true;
      this.lastTickAt = this.clock.now();
      const step = () => {
        if (!this.running) return;
        const now = this.clock.now();
        const elapsed = now - this.lastTickAt;
        this.lastTickAt = now;
        this.tickCount++;
        this.deltaTime = Math.min(0.25, Math.max(1e-3, elapsed / 1e3));
        const due = this.framed.filter((f) => --f.ticks <= 0);
        if (due.length) this.framed = this.framed.filter((f) => f.ticks > 0);
        for (const f of due) this.guard("delayed frames", f.fn);
        this.guard("tick", () => onTick(this.deltaTime));
        if (this.running) this.tickTimer = this.clock.setTimeout(step, TICK_MS);
      };
      this.tickTimer = this.clock.setTimeout(step, TICK_MS);
    }
    /** Runs `fn` once after `ms`. Returns a handle for `cancel`. */
    after(ms, fn) {
      const id = this.nextHandle++;
      if (this.stopped) return id;
      const timer = this.clock.setTimeout(
        () => {
          if (!this.delayed.delete(id)) return;
          this.guard("delayed event", fn);
        },
        Math.max(0, ms)
      );
      this.delayed.set(id, { timer });
      return id;
    }
    /** Runs `fn` at the start of the tick `ticks` ticks from now (at least the next one). */
    afterTicks(ticks, fn) {
      const id = this.nextHandle++;
      if (!this.stopped) this.framed.push({ id, ticks: Math.max(1, Math.floor(ticks)), fn });
      return id;
    }
    cancel(handle) {
      const d = this.delayed.get(handle);
      if (d) {
        this.clock.clearTimeout(d.timer);
        this.delayed.delete(handle);
        return;
      }
      this.framed = this.framed.filter((f) => f.id !== handle);
    }
    /** Cancels the tick and every pending delayed event. The scheduler cannot be started again. */
    stop() {
      this.running = false;
      this.stopped = true;
      this.clock.clearTimeout(this.tickTimer);
      for (const d of this.delayed.values()) this.clock.clearTimeout(d.timer);
      this.delayed.clear();
      this.framed = [];
    }
    get pending() {
      return this.delayed.size + this.framed.length;
    }
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.onError(where, error);
      }
    }
  };

  // portkit/src/sha256.ts
  var K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  function sha256(message) {
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const length = message.length;
    const padded = new Uint8Array((length + 8 >> 6) + 1 << 6);
    padded.set(message);
    padded[length] = 128;
    const bits = length * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
    view.setUint32(padded.length - 4, bits >>> 0);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const a2 = w[i - 15];
        const b2 = w[i - 2];
        const s0 = (a2 >>> 7 | a2 << 25) ^ (a2 >>> 18 | a2 << 14) ^ a2 >>> 3;
        const s1 = (b2 >>> 17 | b2 << 15) ^ (b2 >>> 19 | b2 << 13) ^ b2 >>> 10;
        w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
        const ch = e & f ^ ~e & g;
        const t1 = hh + s1 + ch + K[i] + w[i] | 0;
        const s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = s0 + maj | 0;
        hh = g;
        g = f;
        f = e;
        e = d + t1 | 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 | 0;
      }
      h[0] = h[0] + a | 0;
      h[1] = h[1] + b | 0;
      h[2] = h[2] + c | 0;
      h[3] = h[3] + d | 0;
      h[4] = h[4] + e | 0;
      h[5] = h[5] + f | 0;
      h[6] = h[6] + g | 0;
      h[7] = h[7] + hh | 0;
    }
    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i]);
    return out;
  }
  function sha256Text(text) {
    return toBase64(sha256(utf8Encode(text)));
  }
  function toHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
    return out;
  }

  // portkit/src/secrets.ts
  var Draw = class {
    constructor(seed) {
      __publicField(this, "seed");
      this.seed = seed;
    }
    /** An integer in [0, maxExclusive). `index` picks which of the draw's numbers: die 0, die 1, ... */
    Int(maxExclusive, index = 0) {
      const h = sha256(utf8Encode(`${this.seed}
${index}`));
      const n = h[0] * 2 ** 40 + h[1] * 2 ** 32 + h[2] * 2 ** 24 + h[3] * 2 ** 16 + h[4] * 2 ** 8 + h[5];
      return n % Math.max(1, Math.floor(maxExclusive));
    }
    Ints(count, maxExclusive) {
      const out = [];
      for (let i = 0; i < count; i++) out.push(this.Int(maxExclusive, i));
      return out;
    }
    /** In [0, 1). */
    Float(index = 0) {
      return this.Int(2 ** 32, index) / 2 ** 32;
    }
    toString() {
      return this.seed;
    }
  };
  var DRAW_KEEP_MS = 12e4;
  var CARRY_HOLD_MS = 500;
  var ANSWERED_MAX = 1024;
  function parseDrawEntry(e) {
    if (!Array.isArray(e) || typeof e[0] !== "string" || typeof e[1] !== "string" || typeof e[2] !== "string") return null;
    return [e[0], e[1], e[2], typeof e[3] === "number" ? e[3] : 0, e[4] === 1 ? 1 : 0, typeof e[5] === "string" ? e[5] : "", typeof e[6] === "string" ? e[6] : "", typeof e[7] === "string" ? e[7] : ""];
  }
  var CURVE = { name: "ECDH", namedCurve: "P-256" };
  function parseDeal(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string" || !Array.isArray(raw.s)) return null;
    return { l: raw.l, h: raw.h, s: raw.s.filter((x) => typeof x === "string"), p: raw.p === 1 ? 1 : 0, r: typeof raw.r === "string" ? raw.r : void 0 };
  }
  function parseContribution(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string") return null;
    return { l: raw.l, h: raw.h, c: typeof raw.c === "string" ? raw.c : void 0 };
  }
  var Secrets = class {
    constructor(core, presence, referee, nowSeconds) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "crypto");
      __publicField(this, "nowSeconds");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "privateKey", null);
      __publicField(this, "publicKeyText", "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "derived", /* @__PURE__ */ new Map());
      __publicField(this, "mySecret", null);
      __publicField(this, "lastStates", /* @__PURE__ */ new Map());
      /** The referee's numbers and judgements, read from the referee's own user state. */
      __publicField(this, "numbers");
      /** Per `<uid>\n<label>`: the hash and number first seen, and whether the entry checked out when it appeared. */
      __publicField(this, "pins", /* @__PURE__ */ new Map());
      /** Witness answers seen this epoch: `<witness sid>\n<drawer uid>\n<label>\n<hash>` -> number (the first one stays). */
      __publicField(this, "answers", /* @__PURE__ */ new Map());
      /** The first commitment seen per `<uid>\n<label>` this epoch (a referee may not re-commit after its witness answered). */
      __publicField(this, "firstCommit", /* @__PURE__ */ new Map());
      /** Entries already in the first table this client read this epoch: numbered before it was here, so taken as found. */
      __publicField(this, "baseline", null);
      __publicField(this, "pinsEpoch", -1);
      __publicField(this, "warnedPins", /* @__PURE__ */ new Set());
      __publicField(this, "goneSince", /* @__PURE__ */ new Map());
      /** Witness only: the commitment answered per `<epoch>\n<referee uid>\n<label>`. */
      __publicField(this, "witnessed", /* @__PURE__ */ new Map());
      /** Referee only: the first entry answered per `<uid>\n<label>` in `answeredEpoch` (see officiate). */
      __publicField(this, "answered", /* @__PURE__ */ new Map());
      __publicField(this, "answeredEpoch", -1);
      __publicField(this, "drawStore", null);
      __publicField(this, "drawKey", "");
      __publicField(this, "restoring", null);
      /** The draw the restore brought back, until the game's first beginDraw (which keeps it under the same label). */
      __publicField(this, "restored", null);
      /** The referee's own seed for its current deal. */
      __publicField(this, "dealSeed", null);
      /** This player's contribution to a deal. */
      __publicField(this, "myContribution", null);
      /** Commitments and contributions as first seen, per deal label and session (they outlive a player's visit). */
      __publicField(this, "dealSeen", /* @__PURE__ */ new Map());
      /** Told when a player's draw changes state. */
      __publicField(this, "onDrawChanged", () => {
      });
      __publicField(this, "carryHoldUntil", -Infinity);
      __publicField(this, "warnedDeals", /* @__PURE__ */ new Set());
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.crypto = core.platform.crypto;
      this.nowSeconds = nowSeconds;
      this.numbers = new RefereeTable(presence, referee, "fn", parseDrawEntry);
    }
    /** Starts following commitments, the referee's numbers and reveals. */
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
    }
    /** `n` bytes from the strong generator (WebCrypto; seeded in the fake room). */
    RandomBytes(n) {
      return this.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))));
    }
    // ---- commit / reveal ----------------------------------------------------------------------------------------
    commit(value) {
      const nonce = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      const opening = { v: encodeValue(value), s: nonce };
      const hash = hashOpening(opening);
      return { hash, reveal: () => ({ v: opening.v, s: opening.s }) };
    }
    /** True when `opening` is what `hash` committed to. */
    verify(hash, opening) {
      if (!opening || typeof opening.s !== "string" || typeof hash !== "string") return false;
      return hashOpening(opening) === hash;
    }
    /** The value inside an opening, with value types rebuilt. Check it with `verify` first. */
    valueOf(opening) {
      return decodeValue(opening.v);
    }
    /** Publishes one of the local player's commitments under `label`, in their own user state. */
    publish(label, hash) {
      const all = { ...this.own("c") };
      all[label] = hash;
      this.presence.setExtra("c", all);
    }
    /** Takes a published commitment back (when its round is over). */
    retract(label) {
      const all = { ...this.own("c") };
      delete all[label];
      this.presence.setExtra("c", Object.keys(all).length ? all : void 0);
    }
    /** The commitment a participant published under `label`, or null. Only that player can have written it. */
    published(sid, label) {
      const all = this.presence.extra(sid, "c");
      return isRecord(all) && typeof all[label] === "string" ? all[label] : null;
    }
    own(name) {
      const value = this.presence.extra(this.core.me.sid, name);
      return isRecord(value) ? value : {};
    }
    // ---- fair draws ---------------------------------------------------------------------------------------------
    //
    // Where each part lives, so that nobody can change another player's part:
    //   x.fd  [label, hash]          the player's commitment, in the player's own user state
    //   x.fr  [label, secret]        the player's reveal, in the player's own user state
    //   x.fn  {e, m: {sid: entry}}   the referee's numbers and judgements, in the referee's own user state
    //                                (refrecord.ts); entry = [label, hash, number, deadline, forfeit, uid]
    //   x.fw  [drawer uid, label, hash, number]   a witness's answer to the referee's own commitment, in the witness's
    //                                user state: the referee never supplies the number of its own draw (it knows its secret,
    //                                and could search secrets or numbers until it liked the outcome)
    // Each client also keeps the first hash and number it saw for a player's label in this epoch (`pins`): a later
    // table that changes them (a referee seat taken over by a modified client) is not believed. An entry that appears
    // while this client is here is checked when it appears: numbered by the referee publishing it ("r", for another
    // player), or by that player's witness ("w": the number is the witness's published answer to the first commitment
    // seen), or "s" (solo: believed only while nobody else takes part). Entries already there when this client first read
    // the table were numbered before it came, and are taken as found.
    /** Starts a draw for the local player under `label` (a round name). It replaces their previous draw. */
    beginDraw(label) {
      const pending = this.restoring && this.restoring.l === label ? this.restoring : null;
      const restored = !pending && this.restored && this.restored.l === label && this.mySecret?.label === label ? this.restored : null;
      const saved = pending ?? restored;
      this.restored = null;
      const secret = saved ? saved.s : toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.mySecret = { label, secret };
      this.restoring = null;
      this.saveDraw(!!saved && saved.r === 1);
      this.presence.setExtra("fr", saved && saved.r === 1 ? [label, secret] : void 0);
      this.presence.setExtra("fd", [label, sha256Text(secret)]);
      if (pending) this.core.log("info", `the draw '${label}' came back after a reload`);
    }
    /**
     * True while a draw this device saved before a page reload may still come back (under `label`, or any label
     * when none is given): the restore waits for the referee's table. `beginDraw` with the same label takes it over.
     */
    hasSavedDraw(label) {
      return !!this.restoring && (label === void 0 || this.restoring.l === label);
    }
    /** Publishes the local player's secret for `label`, so everyone can compute and check the draw. */
    revealDraw(label) {
      if (!this.mySecret || this.mySecret.label !== label) return;
      this.saveDraw(true);
      this.presence.setExtra("fr", [label, this.mySecret.secret]);
    }
    /** The referee starts the clock: draws under `label` not revealed within `seconds` are forfeit. */
    demandReveal(label, seconds) {
      if (!this.referee.isMe()) return;
      const table = this.numbers.working();
      const deadline = this.nowSeconds() + seconds;
      let changed = false;
      for (const sid of Object.keys(table)) {
        const entry = table[sid];
        if (entry[0] === label && entry[3] === 0 && entry[4] === 0) {
          entry[3] = deadline;
          changed = true;
        }
      }
      if (changed) this.numbers.write(table);
    }
    /** Where a participant's draw under `label` stands, and the draw itself once this client may know it. */
    drawOf(sid, label) {
      const checked = this.entryOf(sid);
      const committed = this.presence.extra(sid, "fd");
      const hasCommit = Array.isArray(committed) && committed[0] === label && typeof committed[1] === "string";
      if (!checked || checked.entry[0] !== label) return { state: hasCommit ? "committed" : "none", draw: null };
      if (checked.verdict === "bad") return { state: "rejected", draw: null };
      if (checked.verdict === "pending") return { state: "committed", draw: null };
      const entry = checked.entry;
      const [, hash, number, , forfeit] = entry;
      if (hasCommit && committed[1] !== hash) return { state: "rejected", draw: null };
      const revealed = this.presence.extra(sid, "fr");
      if (Array.isArray(revealed) && revealed[0] === label && typeof revealed[1] === "string") {
        if (sha256Text(revealed[1]) !== hash) return { state: "rejected", draw: null };
        if (forfeit) return { state: "forfeit", draw: null };
        return { state: "revealed", draw: new Draw(drawSeed(revealed[1], number, label)) };
      }
      if (forfeit) return { state: "forfeit", draw: null };
      if (sid === this.core.me.sid && this.mySecret && this.mySecret.label === label && sha256Text(this.mySecret.secret) === hash) {
        return { state: "numbered", draw: new Draw(drawSeed(this.mySecret.secret, number, label)) };
      }
      return { state: "numbered", draw: null };
    }
    /** The local player's own draw under `label`, as soon as the referee's number is in. */
    myDraw(label) {
      return this.drawOf(this.core.me.sid, label).draw;
    }
    /** A participant's entry in the referee's table, with the hash and number this client saw first, and whether it checks out. */
    entryOf(sid) {
      const table = this.numbers.read();
      this.newEpoch(table);
      this.collect();
      const entry = table[sid];
      if (!entry) return null;
      if (this.baseline === null) return { entry, verdict: "pending" };
      const key = `${entry[5]}
${entry[0]}`;
      let pin = this.pins.get(key);
      if (!pin) {
        const publisher = this.referee.current()?.sid ?? "";
        pin = { h: entry[1], n: entry[2], verdict: "pending", live: !(this.baseline?.has(key) ?? false), publisher };
        this.pins.set(key, pin);
      }
      if (pin.h !== entry[1] || pin.n !== entry[2]) {
        if (!this.warnedPins.has(key)) {
          this.warnedPins.add(key);
          this.core.log("warn", `the referee's table changed the pinned commitment or number of a draw (${entry[0]}); keeping the first one seen`);
        }
      }
      const kept = [entry[0], pin.h, pin.n, entry[3], entry[4], entry[5], entry[6], entry[7]];
      if (pin.verdict !== "ok" && pin.verdict !== "bad") {
        pin.verdict = this.judge(sid, kept, pin.live, pin.publisher);
        if (pin.verdict === "bad") this.core.log("warn", `a draw (${entry[0]}) whose number its own player could have chosen is not believed (${kept[7] || "?"} by ${kept[6] || "?"})`);
      }
      const verdict = kept[7] === "s" && pin.verdict === "ok" && this.presence.list().length > 1 ? "bad" : pin.verdict;
      if (verdict === "bad" && pin.verdict === "ok" && !this.warnedPins.has("solo:" + key)) {
        this.warnedPins.add("solo:" + key);
        this.core.log("warn", `a draw (${entry[0]}) whose number its own player could have chosen is not believed (solo, while others take part)`);
      }
      return { entry: kept, verdict };
    }
    /** Clears what this client keeps per epoch, and takes the first table it reads as the baseline. */
    newEpoch(table) {
      const epoch = this.referee.epoch;
      if (this.pinsEpoch !== epoch) {
        this.pins.clear();
        this.answers.clear();
        this.firstCommit.clear();
        this.baseline = null;
        this.pinsEpoch = epoch;
      }
      if (this.baseline === null && epoch !== 0) {
        const ref = this.referee.current();
        if (!ref) return;
        if (!this.numbers.published()) return;
        this.baseline = new Set(Object.keys(table).map((sid) => `${table[sid][5]}
${table[sid][0]}`));
      }
    }
    /** Records every witness answer and first commitment in view (they outlive their writer's visit in this memory). */
    collect() {
      for (const who of this.presence.list()) {
        const fw = this.presence.extra(who.sid, "fw");
        if (Array.isArray(fw) && fw.length >= 4 && fw.slice(0, 4).every((x) => typeof x === "string")) {
          const key = `${who.sid}
${fw[0]}
${fw[1]}
${fw[2]}`;
          if (!this.answers.has(key)) this.answers.set(key, fw[3]);
        }
        const fd = this.presence.extra(who.sid, "fd");
        if (Array.isArray(fd) && typeof fd[0] === "string" && typeof fd[1] === "string") {
          const key = `${who.uid}
${fd[0]}`;
          if (!this.firstCommit.has(key)) this.firstCommit.set(key, fd[1]);
        }
      }
    }
    /** Whether an entry that appeared while this client was here was numbered by somebody other than its own player. */
    judge(sid, entry, live, publisher) {
      if (!live) return "ok";
      const [label, hash, number, , , uid, by, how] = entry;
      if (how === "r") return by !== "" && by === publisher && by !== sid ? "ok" : "bad";
      if (how === "s") return "ok";
      if (how === "w") {
        if (by === "" || by === sid || by === publisher) return "bad";
        const first = this.firstCommit.get(`${uid}
${label}`);
        if (first !== void 0 && first !== hash) return "bad";
        const answer = this.answers.get(`${by}
${uid}
${label}
${hash}`);
        if (answer !== void 0) return answer === number ? "ok" : "bad";
        return this.presence.has(by) ? "pending" : "bad";
      }
      return "bad";
    }
    /**
     * The witness's part: the lowest-ranked participant other than the referee answers the referee's commitment with a
     * number of its own, once per label (a referee that re-commits after seeing the answer gets no second one).
     */
    witness() {
      const ref = this.referee.current();
      const me = this.core.me;
      if (!ref || ref.sid === me.sid) return;
      const others = this.presence.list().filter((p) => p.sid !== ref.sid);
      if (!others.length || others[0].sid !== me.sid) return;
      const fd = this.presence.extra(ref.sid, "fd");
      if (!Array.isArray(fd) || typeof fd[0] !== "string" || typeof fd[1] !== "string") return;
      const key = `${this.referee.epoch}
${ref.uid}
${fd[0]}`;
      const first = this.witnessed.get(key);
      if (first !== void 0) return;
      const entry = this.numbers.read()[ref.sid];
      if (entry && entry[0] === fd[0] && entry[5] === ref.uid) return;
      this.witnessed.set(key, fd[1]);
      while (this.witnessed.size > ANSWERED_MAX) this.witnessed.delete(this.witnessed.keys().next().value);
      this.presence.setExtra("fw", [ref.uid, fd[0], fd[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16)))]);
    }
    /** Looks at every participant's draw: the referee answers and judges, and everyone reports changes. */
    review() {
      if (this.core.disposed) return;
      this.reviewDeal();
      this.restoreDraw();
      this.witness();
      if (this.referee.isMe()) this.officiate();
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const checked = this.entryOf(who.sid);
        const label = checked ? checked.entry[0] : Array.isArray(committed) && typeof committed[0] === "string" ? committed[0] : null;
        if (label === null) continue;
        const status = this.drawOf(who.sid, label);
        const mark = `${label}
${status.state}`;
        if (this.lastStates.get(who.sid) === mark) continue;
        this.lastStates.set(who.sid, mark);
        this.core.guard("draw handler", () => this.onDrawChanged(who.sid, label, status));
      }
    }
    /**
     * The referee publishes the number table it carries, if it has not this term. The runtime does this by itself as
     * soon as a referee's term starts (a game need not call it; it is harmless to): a page that starts in between reads
     * the whole table, so its saved draw comes back and what was numbered before it came is taken as found.
     */
    publishDrawTable() {
      if (this.core.disposed || !this.referee.isMe()) return;
      if (!this.numbers.ensurePublished()) return;
      this.carryHoldUntil = this.core.platform.clock.now() + CARRY_HOLD_MS;
      this.core.scheduler.after(CARRY_HOLD_MS + 1, () => this.review());
    }
    officiate() {
      this.publishDrawTable();
      if (this.core.platform.clock.now() < this.carryHoldUntil) return;
      const table = this.numbers.working();
      let changed = false;
      const now = this.nowSeconds();
      const clock = this.core.platform.clock.now();
      for (const sid of Object.keys(table)) {
        if (this.presence.has(sid)) {
          this.goneSince.delete(sid);
          continue;
        }
        const since = this.goneSince.get(sid) ?? clock;
        this.goneSince.set(sid, since);
        if (clock - since >= DRAW_KEEP_MS) {
          delete table[sid];
          this.goneSince.delete(sid);
          changed = true;
        }
      }
      if (this.answeredEpoch !== this.referee.epoch) {
        this.answered.clear();
        this.answeredEpoch = this.referee.epoch;
      }
      for (const sid of Object.keys(table)) this.remember(table[sid]);
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const entry = table[who.sid];
        if (Array.isArray(committed) && typeof committed[0] === "string" && typeof committed[1] === "string") {
          if (!entry || entry[0] !== committed[0]) {
            const label = committed[0];
            const holders = Object.keys(table).filter((sid) => sid !== who.sid && table[sid][5] === who.uid && table[sid][0] === label);
            const departed = holders.find((sid) => !this.presence.has(sid) && table[sid][1] === committed[1]) ?? holders.find((sid) => !this.presence.has(sid));
            const holder = departed ?? holders[0];
            const first = holder !== void 0 ? table[holder] : this.answered.get(`${who.uid}
${label}`);
            if (first) {
              table[who.sid] = [label, first[1], first[2], first[3], first[4], who.uid, first[6], first[7]];
              if (departed !== void 0) {
                delete table[departed];
                this.goneSince.delete(departed);
              }
              if (first[1] !== committed[1]) {
                this.core.log("warn", `a new session of a player committed a different secret for the draw '${label}' they already hold (a re-roll by reloading?): refused, the first commitment stands`);
              }
            } else if (who.sid !== this.core.me.sid) {
              table[who.sid] = [label, committed[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16))), 0, 0, who.uid, this.core.me.sid, "r"];
              this.remember(table[who.sid]);
            } else {
              const others = this.presence.list().filter((p) => p.sid !== who.sid);
              const answer = others.map((p) => ({ sid: p.sid, fw: this.presence.extra(p.sid, "fw") })).find((a) => Array.isArray(a.fw) && a.fw[0] === who.uid && a.fw[1] === label && a.fw[2] === committed[1] && typeof a.fw[3] === "string");
              if (answer) table[who.sid] = [label, committed[1], answer.fw[3], 0, 0, who.uid, answer.sid, "w"];
              else if (!others.length) table[who.sid] = [label, committed[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16))), 0, 0, who.uid, who.sid, "s"];
              else continue;
              this.remember(table[who.sid]);
            }
            changed = true;
            continue;
          }
        }
        if (entry && entry[3] > 0 && entry[4] === 0 && now >= entry[3]) {
          const revealed = this.presence.extra(who.sid, "fr");
          const ok = Array.isArray(revealed) && revealed[0] === entry[0] && typeof revealed[1] === "string" && sha256Text(revealed[1]) === entry[1];
          if (!ok) {
            entry[4] = 1;
            changed = true;
          }
        }
      }
      if (changed) this.numbers.write(table);
    }
    /** The referee keeps the first entry it answered per user and label for the epoch (bounded). */
    remember(entry) {
      const key = `${entry[5]}
${entry[0]}`;
      if (this.answered.has(key)) return;
      this.answered.set(key, [entry[0], entry[1], entry[2], 0, 0, entry[5], entry[6], entry[7]]);
      while (this.answered.size > ANSWERED_MAX) this.answered.delete(this.answered.keys().next().value);
    }
    saveDraw(revealed) {
      if (!this.drawStore || !this.mySecret) return;
      try {
        this.drawStore.set(this.drawKey, JSON.stringify({ e: this.referee.epoch, l: this.mySecret.label, s: this.mySecret.secret, r: revealed ? 1 : 0 }));
      } catch {
      }
    }
    /**
     * After a page reload: the secret this device saved comes back once the referee's table (as last mirrored)
     * still holds this user's entry for it; the commitment (and the reveal, if it was made) is published again and
     * the referee moves the entry to the new session.
     */
    restoreDraw() {
      const saved = this.restoring;
      if (!saved || this.mySecret) return;
      const epoch = this.referee.epoch;
      if (epoch === 0) return;
      if (saved.e !== 0 && saved.e !== epoch) {
        this.restoring = null;
        return;
      }
      const hash = sha256Text(saved.s);
      const table = this.numbers.read();
      const mine = Object.keys(table).map((sid) => table[sid]).filter((e) => e[5] === this.core.me.uid);
      if (mine.some((e) => e[0] === saved.l && e[1] === hash)) {
        this.restoring = null;
        this.restored = saved;
        this.mySecret = { label: saved.l, secret: saved.s };
        this.presence.setExtra("fd", [saved.l, hash]);
        if (saved.r) this.presence.setExtra("fr", [saved.l, saved.s]);
        this.core.log("info", `the draw '${saved.l}' came back after a reload`);
      } else if (mine.length) {
        this.restoring = null;
      }
    }
    // ---- dealt draws ---------------------------------------------------------------------------------------------
    //
    //   referee x.dl  {l: label, h: SHA-256(seed), s: [listed session ids], p: 0 committing | 1 revealing, r?: seed}
    //   player  x.dc  {l: label, h: SHA-256(contribution), c?: contribution}
    // The runtime answers for every listed player by itself (review), so game code only calls beginDeal, dealDraw,
    // revealDeal on the referee and verifyDeal anywhere.
    /** The referee starts a deal under `label` for the players with these session ids. Replaces its previous deal. */
    beginDeal(label, sids) {
      if (!this.referee.isMe()) return;
      if (!sids.some((sid) => sid !== this.core.me.sid)) {
        this.core.log("warn", `beginDeal('${label}') lists no player but the referee: the deal is the referee's own choice, not a fair one`);
      }
      const seed = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.dealSeed = { label, seed };
      this.presence.setExtra("dl", { l: label, h: sha256Text(seed), s: sids.slice(), p: 0 });
      this.review();
    }
    /** Where the current referee's deal under `label` stands. */
    dealState(label) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label) return "none";
      const seen = this.dealSeen.get(label);
      if (deal.r !== void 0) return seen && sha256Text(deal.r) === seen.h ? "revealed" : "invalid";
      if (deal.p === 0) return "committing";
      return Array.isArray(this.contributions(deal)) ? "ready" : "revealing";
    }
    /**
     * The referee's deal, once every listed player still present has revealed a contribution (a listed player who
     * left counts as absent: say so in the game if it matters). Null before that, and on any other client.
     */
    dealDraw(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return null;
      const parts = this.contributions(deal);
      return Array.isArray(parts) ? new Draw(dealSeedOf(this.dealSeed.seed, label, parts)) : null;
    }
    /** The referee publishes its seed (after the hand), so that everyone can check the deal. */
    revealDeal(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return;
      this.presence.setExtra("dl", { ...deal, r: this.dealSeed.seed });
    }
    /** The session ids the current referee listed as contributors to the deal under `label`, or null (no such deal). */
    dealContributors(label) {
      const deal = this.currentDeal();
      return deal && deal.l === label ? deal.s.slice() : null;
    }
    /**
     * After revealDeal: the deal, recomputed here from the referee's seed and the contributions this client saw; null if it
     * does not check out, or cannot be checked here (`checkDeal` says which). A deal with no contributor but the referee is
     * never fair (the referee could have searched seeds before committing): null, and a warning. With `expected` (the
     * session ids the game says must contribute: the seated players), the referee's list must be exactly those, or the deal
     * is null too (a referee that leaves players out of the list, or lists only accomplices). A page that did not see the
     * contribution of a listed player who has since left gets null ("unknown"), never a deal computed without that part.
     */
    verifyDeal(label, expected) {
      return this.checkDeal(label, expected).draw;
    }
    /** As verifyDeal, saying why: "ok" (with the draw), "pending", "solo", "unknown" or "failed" (see DealCheck). */
    checkDeal(label, expected) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label || deal.r === void 0) return { state: "pending", draw: null, why: "no revealed deal under that label" };
      const ref = this.referee.current();
      if (!deal.s.some((sid) => sid !== ref?.sid)) {
        this.warnDeal(label, "lists no contributor but the referee: its outcome was the referee's own choice");
        return { state: "solo", draw: null, why: "no contributor but the referee: it cannot be checked" };
      }
      if (expected) {
        const want = [...new Set(expected)].sort();
        const listed = [...new Set(deal.s)].sort();
        if (want.length !== listed.length || want.some((sid, i) => sid !== listed[i])) {
          this.warnDeal(label, `lists ${listed.length} contributors, not the ${want.length} the game expects`);
          return { state: "failed", draw: null, why: "the contributors are not the ones expected" };
        }
      }
      const seen = this.dealSeen.get(label);
      if (!seen || seen.withSeed) return { state: "unknown", draw: null, why: "this page first saw the deal with its seed already revealed" };
      if (sha256Text(deal.r) !== seen.h) return { state: "failed", draw: null, why: "the revealed seed is not the committed one" };
      const parts = this.contributions(deal);
      if (parts === "unknown") return { state: "unknown", draw: null, why: "a contributor left before this page saw its part" };
      if (parts === "wait") return { state: "pending", draw: null, why: "a contribution is still missing" };
      return { state: "ok", draw: new Draw(dealSeedOf(deal.r, label, parts)), why: "" };
    }
    warnDeal(label, why) {
      if (this.warnedDeals.has(label)) return;
      this.warnedDeals.add(label);
      this.core.log("warn", `the deal '${label}' ${why}`);
    }
    currentDeal() {
      const ref = this.referee.current();
      return ref ? parseDeal(this.presence.extra(ref.sid, "dl")) : null;
    }
    /**
     * Every listed contribution, revealed and matching its commitment ("-" for a listed player who left without revealing
     * one); "wait" while one may still come; "unknown" when a listed player has left and this page cannot tell whether
     * they revealed (it never saw them while following the deal, and did not follow it from its start).
     */
    contributions(deal) {
      const seen = this.dealSeen.get(deal.l);
      if (!seen) return "wait";
      const out = [];
      for (const sid of deal.s) {
        const part = seen.parts.get(sid);
        if (part && part.c !== void 0) out.push(part.c);
        else if (this.presence.has(sid)) return "wait";
        else if (!seen.watched.has(sid) && !seen.fromStart) return "unknown";
        else if (!part || deal.p === 1) out.push("-");
        else return "wait";
      }
      return out;
    }
    /** Follows the deal: records what is first seen, answers for the local player, and moves the referee's phase on. */
    reviewDeal() {
      const ref = this.referee.current();
      const deal = this.currentDeal();
      if (!ref || !deal) return;
      let seen = this.dealSeen.get(deal.l);
      if (!seen || seen.refSid !== ref.sid) {
        seen = { h: deal.h, refSid: ref.sid, parts: /* @__PURE__ */ new Map(), fromStart: deal.p === 0 && deal.r === void 0, withSeed: deal.r !== void 0, watched: /* @__PURE__ */ new Set() };
        this.dealSeen.set(deal.l, seen);
        while (this.dealSeen.size > 8) this.dealSeen.delete(this.dealSeen.keys().next().value);
      }
      for (const sid of deal.s) {
        if (this.presence.has(sid)) seen.watched.add(sid);
        const part = parseContribution(this.presence.extra(sid, "dc"));
        if (!part || part.l !== deal.l) continue;
        const known = seen.parts.get(sid);
        if (!known) seen.parts.set(sid, { h: part.h });
        const entry = seen.parts.get(sid);
        if (part.c !== void 0 && entry.c === void 0 && entry.h === part.h && sha256Text(part.c) === entry.h) entry.c = part.c;
      }
      const me = this.core.me.sid;
      if (deal.s.includes(me)) {
        if (!this.myContribution || this.myContribution.label !== deal.l) {
          this.myContribution = { label: deal.l, c: toBase64(this.crypto.getRandomValues(new Uint8Array(16))) };
          this.presence.setExtra("dc", { l: deal.l, h: sha256Text(this.myContribution.c) });
        } else if (deal.p === 1) {
          const mine = parseContribution(this.presence.extra(me, "dc"));
          if (mine && mine.c === void 0) this.presence.setExtra("dc", { ...mine, c: this.myContribution.c });
        }
      }
      if (this.referee.isMe() && deal.p === 0 && this.dealSeed && this.dealSeed.label === deal.l) {
        const all = deal.s.every((sid) => seen.parts.has(sid) || !this.presence.has(sid));
        if (all) this.presence.setExtra("dl", { ...deal, p: 1 });
      }
    }
    // ---- seal / open --------------------------------------------------------------------------------------------
    /** The local public key (raw point, base64url). Empty before `init`. */
    get publicKey() {
      return this.publicKeyText;
    }
    /**
     * Makes the local key pair, or loads the one this device saved for this player and instance, so that a page
     * reload can still open what was sealed before it.
     */
    async init(store, storeKey, drawKey = "") {
      const subtle = this.crypto.subtle;
      if (store && drawKey) {
        this.drawStore = store;
        this.drawKey = drawKey;
        try {
          const saved = safeParse(store.get(drawKey));
          if (isRecord(saved) && typeof saved.l === "string" && typeof saved.s === "string") {
            this.restoring = { e: typeof saved.e === "number" ? saved.e : 0, l: saved.l, s: saved.s, r: saved.r === 1 ? 1 : 0 };
          }
        } catch {
        }
      }
      if (store) {
        try {
          const saved = safeParse(store.get(storeKey));
          if (isRecord(saved) && isRecord(saved.d) && typeof saved.p === "string") {
            this.privateKey = await subtle.importKey("jwk", saved.d, CURVE, false, ["deriveKey"]);
            this.publicKeyText = saved.p;
            return this.publicKeyText;
          }
        } catch {
        }
      }
      const pair = await subtle.generateKey(CURVE, true, ["deriveKey"]);
      this.privateKey = pair.privateKey;
      this.publicKeyText = toBase64(new Uint8Array(await subtle.exportKey("raw", pair.publicKey)));
      if (store) {
        try {
          store.set(storeKey, JSON.stringify({ p: this.publicKeyText, d: await subtle.exportKey("jwk", pair.privateKey) }));
        } catch {
        }
      }
      return this.publicKeyText;
    }
    /** True once the player's public key is known, so `seal` for them can work. */
    canSealFor(sid) {
      return !!this.presence.get(sid)?.publicKey;
    }
    /**
     * Encrypts `value` for one participant. The result is text that can go anywhere (a synced field, a network
     * event): only that player's key opens it.
     */
    async seal(forSid, value) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const target = this.presence.get(forSid);
      if (!target || !target.publicKey) throw new Error(`no public key known for player session ${forSid}`);
      const key = await this.sharedKey(target.publicKey);
      const iv = this.crypto.getRandomValues(new Uint8Array(12));
      const me = this.core.me;
      const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${forSid}`);
      const plain = utf8Encode(canonicalJson(encodeValue(value)));
      const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, plain));
      return JSON.stringify({ f: me.sid, t: forSid, u: target.uid, p: this.publicKeyText, i: toBase64(iv), c: toBase64(cipher) });
    }
    /**
     * Opens a box sealed for the local player. Throws when it is for someone else, was changed on the way, or
     * claims a sender whose announced key is not the one it was sealed with.
     */
    async open(box) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(box);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.t !== "string" || typeof b.p !== "string" || typeof b.i !== "string" || typeof b.c !== "string") {
        throw new Error("not a sealed box");
      }
      const me = this.core.me;
      if (b.t !== me.sid && b.u !== me.uid) throw new Error("this box is sealed for another player");
      const senderKey = this.presence.keyOf(b.f);
      if (senderKey !== b.p) throw new Error("the box does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${b.t}`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(b.i), additionalData: aad }, key, fromBase64(b.c));
      } catch {
        throw new Error("the box could not be opened (wrong key or changed contents)");
      }
      return decodeValue(JSON.parse(utf8Decode(new Uint8Array(plain))));
    }
    /**
     * Seals one value per participant into a single text, for one synced field that is rewritten as a whole.
     *
     * A box written for one player at a telling moment names its reader even though nobody else can open it. Here
     * every participant gets an entry every time, each padded to `slotBytes` before encryption, in session-id
     * order: the text has the same size and shape whoever it really concerns. `valueFor` returns undefined for a
     * participant who gets nothing; their entry is filled with padding.
     */
    async sealAll(valueFor, slotBytes = 256) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const me = this.core.me;
      const entries = {};
      const everyone = this.presence.list().map((p) => p.sid).sort();
      for (const sid of everyone) {
        const target = this.presence.get(sid);
        if (!target || !target.publicKey) continue;
        const value = valueFor(sid);
        const text = value === void 0 ? "{}" : canonicalJson({ v: encodeValue(value) });
        const bytes = utf8Encode(text);
        if (bytes.length > slotBytes) throw new Error(`sealAll: the value for one player needs ${bytes.length} bytes, more than the slot of ${slotBytes}`);
        const padded = new Uint8Array(slotBytes).fill(32);
        padded.set(bytes);
        const key = await this.sharedKey(target.publicKey);
        const iv = this.crypto.getRandomValues(new Uint8Array(12));
        const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${sid}
all`);
        const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, padded));
        entries[sid] = [toBase64(iv), toBase64(cipher)];
      }
      return asciiJson({ f: me.sid, p: this.publicKeyText, n: slotBytes, m: entries });
    }
    /**
     * Opens the local player's entry of a `sealAll` text. Resolves null when the entry holds nothing for them,
     * or there is none (they arrived after it was written).
     */
    async openMine(bundle) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(bundle);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.p !== "string" || !isRecord(b.m)) throw new Error("not a sealed bundle");
      const me = this.core.me;
      const entry = b.m[me.sid];
      if (!Array.isArray(entry) || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
      if (this.presence.keyOf(b.f) !== b.p) throw new Error("the bundle does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${me.sid}
all`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(entry[0]), additionalData: aad }, key, fromBase64(entry[1]));
      } catch {
        throw new Error("the entry could not be opened (wrong key or changed contents)");
      }
      const parsed = safeParse(utf8Decode(new Uint8Array(plain)).trimEnd());
      return isRecord(parsed) && "v" in parsed ? decodeValue(parsed.v) : null;
    }
    /**
     * Opens a box sealed for the local player and says who sealed it (a session id whose announced key the box was
     * sealed with). A game that takes a dealt value as authority checks that the sender is the referee.
     */
    async openWithSender(box) {
      const value = await this.open(box);
      return { value, from: String(safeParse(box).f) };
    }
    /** True when `box` names the local player as its reader. */
    isForMe(box) {
      const b = safeParse(box);
      return isRecord(b) && (b.t === this.core.me.sid || b.u === this.core.me.uid);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sharedKey(theirPublic) {
      let key = this.derived.get(theirPublic);
      if (!key) {
        const subtle = this.crypto.subtle;
        key = (async () => {
          const pub = await subtle.importKey("raw", fromBase64(theirPublic), CURVE, false, []);
          return subtle.deriveKey({ name: "ECDH", public: pub }, this.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        })();
        this.derived.set(theirPublic, key);
        key.catch(() => this.derived.delete(theirPublic));
      }
      return key;
    }
  };
  function hashOpening(opening) {
    return sha256Text(opening.s + "\n" + canonicalJson(opening.v));
  }
  function dealSeedOf(seed, label, parts) {
    return toHex(sha256(utf8Encode(`${seed}
${label}
${parts.join("\n")}`)));
  }
  function drawSeed(secret, number, label) {
    return toHex(sha256(utf8Encode(`${secret}
${number}
${label}`)));
  }

  // portkit/src/leaf.ts
  var LEAF_MARGIN = 96;
  var TOMBSTONE = "";
  function headKey(id) {
    return `v.${id}`;
  }
  function chunkKey(id, index) {
    return `c.${id}.${index}`;
  }
  function encodeLeaf(id, record, maxLeafBytes, previousChunks) {
    const budget = Math.max(256, maxLeafBytes - LEAF_MARGIN);
    const whole = asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, d: record.d });
    const bytes = jsonLeafBytes(whole);
    const writes = [];
    let chunks = 0;
    if (bytes <= budget) {
      writes.push([headKey(id), whole]);
    } else {
      const pieces = splitByLeafBytes(whole, budget - 32);
      chunks = pieces.length;
      for (let i = 0; i < pieces.length; i++) writes.push([chunkKey(id, i), `${record.n}.${i}~${pieces[i]}`]);
      writes.push([headKey(id), asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, c: chunks })]);
    }
    for (let i = chunks; i < previousChunks; i++) writes.push([chunkKey(id, i), TOMBSTONE]);
    return { writes, chunks, bytes };
  }
  function splitByLeafBytes(text, budget) {
    const pieces = [];
    let start = 0;
    let size = 0;
    for (let i = 0; i < text.length; i++) {
      const add = leafCharBytes(text, i);
      const lowHalf = (text.charCodeAt(i) & 64512) === 56320;
      if (size + add > budget && i > start && !lowHalf) {
        pieces.push(text.slice(start, i));
        start = i;
        size = 0;
      }
      size += add;
    }
    if (start < text.length) pieces.push(text.slice(start));
    return pieces;
  }
  function decodeLeaf(id, get) {
    const head = get(headKey(id));
    if (head === void 0 || head === TOMBSTONE) return { kind: "none" };
    const parsed = safeParse(head);
    if (!isRecord(parsed) || !isCount(parsed.e) || !isCount(parsed.g) || !isCount(parsed.n) || typeof parsed.w !== "string") return { kind: "bad" };
    const e = parsed.e;
    const g = parsed.g;
    const n = parsed.n;
    const w = parsed.w;
    if (parsed.c === void 0) return { kind: "value", record: { e, g, n, w, d: parsed.d }, chunks: 0 };
    if (!isCount(parsed.c) || parsed.c < 1 || parsed.c > 512) return { kind: "bad" };
    const chunks = parsed.c;
    let whole = "";
    for (let i = 0; i < chunks; i++) {
      const piece = get(chunkKey(id, i));
      const tag = `${n}.${i}~`;
      if (piece === void 0 || !piece.startsWith(tag)) return { kind: "pending", e, g, n, w, chunks };
      whole += piece.slice(tag.length);
    }
    const full = safeParse(whole);
    if (!isRecord(full) || full.e !== e || full.g !== g || full.n !== n || full.w !== w) return { kind: "bad" };
    return { kind: "value", record: { e, g, n, w, d: full.d }, chunks };
  }
  function isCount(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
  }
  function leafOwnerOf(key) {
    if (key.startsWith("v.")) return key.indexOf(".", 2) < 0 ? key.slice(2) : null;
    if (key.startsWith("c.")) {
      const end = key.indexOf(".", 2);
      return end > 2 ? key.slice(2, end) : null;
    }
    return null;
  }

  // portkit/src/sync.ts
  var Sync = class {
    constructor(core, presence, referee, players) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "slots", /* @__PURE__ */ new Map());
      __publicField(this, "byBehaviour", /* @__PURE__ */ new Map());
      __publicField(this, "stats", { writes: 0, applied: 0, repairs: 0, claims: 0, lostRaces: 0, rejected: 0, reverted: 0 });
      /** False until behaviours have started: data applied before then is reported once, afterwards. */
      __publicField(this, "started", false);
      __publicField(this, "epochSeen", 0);
      __publicField(this, "warnedIdle", false);
      /** Told when the local player becomes or stops being the owner of a slot (to move its synced objects). */
      __publicField(this, "onLocalOwnership", () => {
      });
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.players = players;
    }
    get me() {
      return this.core.me.sid;
    }
    /** Registers a behaviour. With `group`, it shares the leaf and the owner of every other behaviour of that group. */
    add(behaviour, id, fields, mode, callbacks, group) {
      const slotId = group ? `@${group}` : id;
      let slot = this.slots.get(slotId);
      if (!slot) {
        slot = {
          id: slotId,
          grouped: !!group,
          members: [],
          mode,
          snapshotOwed: false,
          mo: null,
          topG: 0,
          pending: null,
          applied: null,
          seenN: 0,
          lastValid: null,
          unconfirmed: null,
          dirty: false,
          chunks: 0,
          lastSent: null,
          lastContinuousAt: -Infinity,
          ownerView: null,
          warnedNotOwner: false,
          onApplied: null,
          ownN: 0,
          ownAt: 0,
          echoN: 0,
          claimAt: 0
        };
        this.slots.set(slotId, slot);
      } else if (mode === "continuous" || slot.mode === "none" && mode !== "none") slot.mode = mode;
      slot.members.push({ id, behaviour, fields, callbacks: callbacks && Object.keys(callbacks).length ? callbacks : void 0, lastPart: null, owed: false });
      this.byBehaviour.set(behaviour, slot);
      return slot;
    }
    slotOf(behaviour) {
      return this.byBehaviour.get(behaviour) ?? null;
    }
    /** Subscribes to the mirror and reads the owner records. Data is applied by `applySnapshot`, after Start. */
    attach() {
      this.core.onState((key) => this.onLeaf(key));
      this.presence.on(() => this.onPeopleChanged());
      this.presence.onExtra(() => this.onPeopleChanged());
      this.referee.on(() => this.onPeopleChanged());
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        this.readOwner(slot);
        slot.ownerView = this.ownerSid(slot);
      }
    }
    /** Applies whatever counts in the mirror to every behaviour. Runs after Start, so stored data wins over it. */
    applySnapshot() {
      for (const slot of this.slots.values()) {
        this.markParts(slot);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
        this.evaluate(slot, true);
      }
    }
    /** True when the mirror held a value for any behaviour when this client started. */
    hasData() {
      for (const slot of this.slots.values()) if (slot.applied !== null) return true;
      return false;
    }
    /** Marks the behaviours as started and calls OnDeserialization once on each that already has data. */
    begin() {
      this.started = true;
      for (const slot of this.slots.values()) {
        for (const member of slot.members) {
          if (!member.owed) continue;
          member.owed = false;
          this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
        }
      }
    }
    /** The slot a leaf key belongs to (`o.<slot>`, `v.<slot>`, `c.<slot>.<i>`), for reporting a refused write. */
    slotForKey(key) {
      const id = key.startsWith("o.") ? key.slice(2) : leafOwnerOf(key);
      return id === null ? null : this.slots.get(id) ?? null;
    }
    // ---- ownership ----------------------------------------------------------------------------------------------
    ownerSid(slot) {
      if (slot.pending) return slot.pending.sid;
      if (slot.mo && this.presence.has(slot.mo.s)) return slot.mo.s;
      return this.referee.current()?.sid ?? null;
    }
    owner(slot) {
      const sid = this.ownerSid(slot);
      return sid === null ? null : this.players.bySid(sid);
    }
    isOwner(slot, sid = this.me) {
      return this.ownerSid(slot) === sid;
    }
    setOwner(slot, sid, uid) {
      if (this.core.disposed) return;
      if (this.referee.epoch === 0) {
        if (!this.warnedIdle) {
          this.warnedIdle = true;
          this.core.log("warn", `${slot.id}: SetOwner ignored, the instance has no referee yet`);
        }
        return;
      }
      const recorded = slot.pending ? slot.pending.sid : slot.mo ? slot.mo.s : null;
      if (recorded === sid) return;
      const g = Math.max(slot.topG, slot.pending ? slot.pending.g : 0) + 1;
      const record = { e: this.referee.epoch, g, s: sid, u: uid };
      if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
      const timer = this.core.scheduler.after(this.core.options.ownerClaimTimeoutMs, () => {
        if (slot.pending && slot.pending.g === g) {
          this.core.log("warn", `ownership claim for ${slot.id} never came back; giving it up`);
          slot.pending = null;
          this.settleLostClaim(slot);
        }
      });
      slot.pending = { g, sid, timer };
      slot.claimAt = this.core.platform.clock.now();
      this.stats.claims++;
      this.core.set(`o.${slot.id}`, asciiJson(record));
      this.noteOwner(slot);
    }
    readOwner(slot) {
      const raw = safeParse(this.core.get(`o.${slot.id}`));
      let record = null;
      if (isRecord(raw) && typeof raw.e === "number" && typeof raw.g === "number" && typeof raw.s === "string") {
        record = { e: raw.e, g: raw.g, s: raw.s, u: typeof raw.u === "string" ? raw.u : "" };
        if (record.g > slot.topG) slot.topG = record.g;
      }
      slot.mo = record && record.e === this.referee.epoch ? record : null;
    }
    onOwnerLeaf(slot) {
      this.readOwner(slot);
      const mo = slot.mo;
      if (slot.pending && mo && mo.s === slot.pending.sid && mo.g === slot.pending.g) {
        this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        if (slot.unconfirmed) slot.lastValid = slot.unconfirmed;
        slot.unconfirmed = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** The claim never reached the room: whatever was changed for it is put back. */
    settleLostClaim(slot) {
      this.stats.lostRaces++;
      const touched = slot.unconfirmed !== null || slot.dirty;
      slot.unconfirmed = null;
      slot.dirty = false;
      if (touched) {
        if (slot.lastValid) {
          slot.applied = slot.lastValid.marker;
          this.markParts(slot);
          this.deserialized(slot, this.assign(slot, slot.lastValid.d), true);
        } else slot.applied = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** Records what each member of a group holds now, so that the next value only reports real changes. */
    markParts(slot) {
      if (!slot.grouped) return;
      for (const member of slot.members) {
        const bag = member.behaviour;
        member.lastPart = canonicalJson(member.fields.map((field) => encodeValue(bag[field])));
      }
    }
    noteOwner(slot) {
      const now = this.ownerSid(slot);
      if (now === slot.ownerView) return;
      const before = slot.ownerView;
      slot.ownerView = now;
      if (now === this.me || before === this.me) this.core.guard("ownership hook", () => this.onLocalOwnership(slot, now === this.me));
      if (!this.started || now === null) return;
      const player = this.players.bySid(now);
      if (!player) return;
      for (const member of slot.members) this.core.guard(`${member.id}.OnOwnershipTransferred`, () => member.behaviour.OnOwnershipTransferred(player));
    }
    onPeopleChanged() {
      if (this.core.disposed) return;
      if (this.referee.epoch !== this.epochSeen) this.adoptEpoch();
      for (const slot of this.slots.values()) this.noteOwner(slot);
      this.takeOver();
    }
    /**
     * A referee of another epoch appeared: a client that started while there was none joins the game in progress,
     * or the game was started afresh. Everything known about owners and values is read again from the mirror, and
     * values found there are reported as a snapshot.
     */
    adoptEpoch() {
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        slot.unconfirmed = null;
        slot.lastValid = null;
        slot.applied = null;
        slot.dirty = false;
        this.readOwner(slot);
        slot.snapshotOwed = true;
        this.evaluate(slot, true);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
      }
    }
    /** The referee records itself as owner of whatever an absent player owned. */
    takeOver() {
      if (!this.started || !this.referee.isMe()) return;
      for (const slot of this.slots.values()) {
        if (slot.pending || !slot.mo || this.presence.has(slot.mo.s)) continue;
        this.setOwner(slot, this.me, this.core.me.uid);
      }
    }
    // ---- data ---------------------------------------------------------------------------------------------------
    requestSerialization(slot) {
      if (slot.mode === "none") return;
      if (!this.isOwner(slot)) {
        if (!slot.warnedNotOwner) {
          slot.warnedNotOwner = true;
          this.core.log("warn", `${slot.id}: RequestSerialization by a player who is not the owner is ignored`);
        }
        return;
      }
      slot.dirty = true;
    }
    /** Writes every dirty slot the local player owns. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        if (slot.mode === "continuous" && now - slot.lastContinuousAt >= this.core.options.continuousIntervalMs && this.isOwner(slot)) {
          slot.lastContinuousAt = now;
          if (canonicalJson(this.read(slot)) !== slot.lastSent) slot.dirty = true;
        }
        if (!slot.dirty) continue;
        slot.dirty = false;
        if (this.isOwner(slot)) this.write(slot);
        else this.revert(slot);
      }
    }
    /**
     * The fields were changed by the owner, and ownership went to someone else before the change could be sent.
     * Nobody else will ever see it, so it is taken back.
     */
    revert(slot) {
      if (!slot.lastValid) return;
      slot.applied = slot.lastValid.marker;
      this.markParts(slot);
      const changed = this.assign(slot, slot.lastValid.d);
      this.stats.reverted++;
      this.deserialized(slot, changed, true);
    }
    /** Writes every slot the local player owns and has changed (RequestSerialization), now: the end of one action. */
    flushDirty() {
      if (this.core.disposed || !this.started) return;
      for (const slot of this.slots.values()) {
        if (slot.mode === "none" || !slot.dirty) continue;
        slot.dirty = false;
        if (this.isOwner(slot)) this.write(slot);
        else this.revert(slot);
      }
    }
    /**
     * The local player's ownership claims and writes the room has not echoed yet (made in the last `withinMs`): what a
     * command sent now must not overtake (commands.ts). Each is [slot id, claim generation or 0, write sequence or 0].
     */
    unechoedMarks(withinMs, max = 8) {
      const now = this.core.platform.clock.now();
      const out = [];
      for (const slot of this.slots.values()) {
        const g = slot.pending && slot.pending.sid === this.me && now - slot.claimAt <= withinMs ? slot.pending.g : 0;
        const n = slot.ownN > slot.echoN && now - slot.ownAt <= withinMs ? slot.ownN : 0;
        if (g || n) out.push([slot.id, g, n]);
      }
      return out.slice(-max);
    }
    /** Has this client seen a claim of generation `g` (or a later one) and a write numbered `n` (or later) of a slot? */
    hasSeen(id, g, n) {
      const slot = this.slots.get(id);
      if (!slot) return true;
      return slot.topG >= g && slot.seenN >= n;
    }
    /** Serialises one slot now (used when an event must follow its state). Returns the marker of what it holds. */
    flushOne(slot) {
      if (slot.dirty && this.started && this.isOwner(slot)) {
        slot.dirty = false;
        this.write(slot);
      }
      return slot.applied;
    }
    write(slot) {
      const named = slot.pending ? slot.pending.sid === this.me : slot.mo !== null && slot.mo.s === this.me;
      if (!named) this.setOwner(slot, this.me, this.core.me.uid);
      if (!slot.pending && !slot.mo) return;
      const g = slot.pending ? slot.pending.g : slot.mo.g;
      for (const member of slot.members) this.core.guard(`${member.id}.OnPreSerialization`, () => member.behaviour.OnPreSerialization());
      const d = this.read(slot);
      const n = ++slot.seenN;
      const encoded = encodeLeaf(slot.id, { e: this.referee.epoch, g, n, w: this.me, d }, this.core.platform.limits.maxLeafBytes, slot.chunks);
      for (const [key, value] of encoded.writes) this.core.set(key, value);
      slot.chunks = encoded.chunks;
      slot.applied = { g, n, w: this.me };
      slot.ownN = n;
      slot.ownAt = this.core.platform.clock.now();
      slot.lastSent = canonicalJson(d);
      if (slot.grouped) for (const member of slot.members) member.lastPart = canonicalJson(d[member.id] ?? null);
      const kept = { d, marker: slot.applied };
      if (slot.pending) slot.unconfirmed = kept;
      else slot.lastValid = kept;
      this.stats.writes++;
      const result = { success: true, byteCount: encoded.bytes };
      for (const member of slot.members) this.core.guard(`${member.id}.OnPostSerialization`, () => member.behaviour.OnPostSerialization(result));
    }
    read(slot) {
      if (!slot.grouped) return readFields(slot.members[0].behaviour, slot.members[0].fields);
      const out = {};
      for (const member of slot.members) {
        const bag = member.behaviour;
        out[member.id] = member.fields.map((field) => encodeValue(bag[field]));
      }
      return out;
    }
    /** Puts data into the behaviours. Returns the members whose part was new to them. */
    assign(slot, d) {
      if (!slot.grouped) {
        const member = slot.members[0];
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, d, member.callbacks));
        return [member];
      }
      const changed = [];
      if (!isRecord(d)) return changed;
      for (const member of slot.members) {
        const part = d[member.id];
        if (!Array.isArray(part)) continue;
        const text = canonicalJson(part);
        if (text === member.lastPart) continue;
        member.lastPart = text;
        const asFields = {};
        member.fields.forEach((field, i) => {
          if (i < part.length) asFields[field] = part[i];
        });
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, asFields, member.callbacks));
        changed.push(member);
      }
      return changed;
    }
    onLeaf(key) {
      if (this.core.disposed) return;
      if (key.startsWith("o.")) {
        const slot2 = this.slots.get(key.slice(2));
        if (slot2) this.onOwnerLeaf(slot2);
        return;
      }
      const id = leafOwnerOf(key);
      if (id === null) return;
      const slot = this.slots.get(id);
      if (slot) this.evaluate(slot, slot.snapshotOwed);
    }
    /**
     * Looks at the mirrored value of one slot and applies it, ignores it, or repairs it. `asSnapshot`: the value
     * was already stored when this client came to the game, so it is taken whoever wrote it.
     */
    evaluate(slot, asSnapshot) {
      this.consider(slot, asSnapshot);
      if (slot.onApplied && this.started) this.core.guard("held events", slot.onApplied);
    }
    consider(slot, asSnapshot) {
      const decoded = decodeLeaf(slot.id, (key) => this.core.get(key));
      if (decoded.kind === "pending") {
        if (decoded.n > slot.seenN) slot.seenN = decoded.n;
        return;
      }
      if (decoded.kind !== "value") return;
      const x = decoded.record;
      if (x.n > slot.seenN) slot.seenN = x.n;
      if (x.w === this.me && x.n > slot.echoN) slot.echoN = x.n;
      slot.chunks = decoded.chunks;
      if (x.e !== this.referee.epoch) return;
      const a = slot.applied;
      if (a && x.n === a.n && x.w === a.w && x.g === a.g) return;
      if (x.w === this.me && a && a.w === this.me && x.n <= a.n) return;
      const mo = slot.mo;
      if (asSnapshot || mo !== null && x.w === mo.s) {
        slot.applied = { g: x.g, n: x.n, w: x.w };
        slot.lastValid = { d: x.d, marker: slot.applied };
        slot.lastSent = null;
        this.stats.applied++;
        this.deserialized(slot, this.assign(slot, x.d), false);
        return;
      }
      this.stats.rejected++;
      if (mo !== null && mo.s === this.me && !slot.pending) {
        this.stats.repairs++;
        slot.dirty = true;
      }
    }
    deserialized(slot, changed, isRollback) {
      if (!this.started) {
        for (const member of changed) member.owed = true;
        return;
      }
      const isSnapshot = slot.snapshotOwed && !isRollback;
      slot.snapshotOwed = false;
      for (const member of changed) {
        this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot, isRollback }));
      }
    }
    /** Canonical text of every synced field of every behaviour: equal on two clients that agree. */
    snapshotText() {
      const all = {};
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        for (const member of slot.members) if (member.fields.length) all[member.id] = readFields(member.behaviour, member.fields);
      }
      return canonicalJson(all);
    }
  };

  // portkit/src/instance.ts
  var HEAD_OP = "pkHead";
  var HEAD_EVENT = "pkHead";
  var OBJECT_EVENTS = [
    "click",
    "grab",
    "drop",
    "triggerEnter",
    "triggerExit",
    "collisionEnter",
    "collisionExit",
    "uiButton",
    "uiSlider",
    "uiToggle",
    "heldTrigger",
    "heldPrimary",
    "heldSecondary",
    "field"
  ];
  var MAX_EARLY_EVENTS = 256;
  var GameInstance = class {
    constructor(platform, game2, bindings, element, inst, shared = {}) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      __publicField(this, "element");
      __publicField(this, "inst");
      __publicField(this, "core");
      __publicField(this, "scheduler");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "sync");
      __publicField(this, "events");
      __publicField(this, "commands");
      __publicField(this, "perUser");
      __publicField(this, "secrets");
      __publicField(this, "protectedValues");
      __publicField(this, "host");
      __publicField(this, "clockSync");
      __publicField(this, "storage");
      __publicField(this, "networking");
      __publicField(this, "settings", /* @__PURE__ */ new Map());
      __publicField(this, "objects", /* @__PURE__ */ new Map());
      /** Set when the instance has started its behaviours. */
      __publicField(this, "started", false);
      /** Resolves when behaviours have started (or the instance was disposed first). */
      __publicField(this, "ready", deferred());
      __publicField(this, "rule");
      __publicField(this, "kit", null);
      __publicField(this, "ordinary", []);
      __publicField(this, "byId", /* @__PURE__ */ new Map());
      __publicField(this, "addresses", /* @__PURE__ */ new Map());
      __publicField(this, "templates", []);
      __publicField(this, "playerBehaviourMap", /* @__PURE__ */ new Map());
      __publicField(this, "objectHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "hostWired", /* @__PURE__ */ new Set());
      __publicField(this, "graphHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "pendingLeaves", []);
      __publicField(this, "earlyGraphEvents", []);
      __publicField(this, "buttons", /* @__PURE__ */ new Set());
      __publicField(this, "keys", /* @__PURE__ */ new Set());
      __publicField(this, "sticks", [new Vector2(), new Vector2()]);
      __publicField(this, "triggers", [0, 0]);
      __publicField(this, "abilitiesOff", /* @__PURE__ */ new Set());
      __publicField(this, "blocksOn", /* @__PURE__ */ new Set());
      __publicField(this, "poses", null);
      __publicField(this, "triggerAt", [-Infinity, -Infinity]);
      __publicField(this, "lastClickSide", null);
      __publicField(this, "vr", null);
      __publicField(this, "reachOverride", /* @__PURE__ */ new Map());
      __publicField(this, "position", null);
      __publicField(this, "startKindValue", "idle");
      __publicField(this, "lastClockAsk", -Infinity);
      __publicField(this, "timeView");
      __publicField(this, "randomView");
      __publicField(this, "debugView");
      __publicField(this, "inputView");
      /** The page-wide object every instance of this game shares (GameRuntime.shared). */
      __publicField(this, "shared");
      __publicField(this, "headRequests", /* @__PURE__ */ new Map());
      __publicField(this, "nextHeadRequest", 1);
      this.shared = shared;
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
      this.element = element;
      this.inst = inst;
      this.rule = game2.referee ?? "anyone";
      const options = { ...DEFAULT_OPTIONS, ...game2.options ?? {} };
      this.scheduler = new Scheduler(platform.clock, (where, error) => this.core.error(where, error));
      this.core = new Core(platform, game2.slug, inst, options, this.scheduler);
      for (const name of element.attributeNames()) this.settings.set(name, element.getAttribute(name) ?? "");
      this.presence = new Presence(this.core);
      this.referee = new Referee(this.core, this.presence, this.rule);
      this.players = new Players(this.core, this.presence, this.referee);
      this.sync = new Sync(this.core, this.presence, this.referee, this.players);
      this.clockSync = new ClockSync(platform.clock);
      this.host = new RelayHost(platform, game2.slug, inst, bindings.refs);
      this.host.pathOf = (key) => bindings.objects[key]?.path;
      this.storage = new Persistence(platform.storage, game2.slug, inst, platform.local().uid);
      this.secrets = new Secrets(this.core, this.presence, this.referee, () => this.clockSync.seconds());
      this.protectedValues = new ProtectedValues(this.core);
      this.events = new NetEvents(this.core, this.sync, {
        behaviour: (id) => this.byId.get(id) ?? null,
        playerBehaviour: (sid, id) => this.playerBehaviourMap.get(sid)?.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true })
      });
      this.commands = new Commands(this.core, this.presence, this.referee, {
        resolve: (id, playerSid) => playerSid ? this.playerBehaviourMap.get(playerSid)?.get(id) ?? null : this.byId.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        invoke: (behaviour, name, args, fromSid) => this.events.invoke(behaviour, name, args, fromSid),
        acknowledged: (behaviour, number) => behaviour.OnCommandAcknowledged(number),
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true }),
        flush: () => this.sync.flushDirty(),
        marks: () => this.sync.unechoedMarks(this.core.options.eventHoldMs * 2),
        seen: (id, g, n) => this.sync.hasSeen(id, g, n)
      });
      this.perUser = new PerUser(this.core, this.storage, {
        restored: (player) => this.each("OnPlayerRestored", (b) => b.OnPlayerRestored(player)),
        dataUpdated: (player, keys) => this.each("OnPlayerDataUpdated", (b) => b.OnPlayerDataUpdated(player, keys)),
        deserialized: (behaviour) => this.core.guard("OnDeserialization", () => behaviour.OnDeserialization({ isSnapshot: false, isRollback: false })),
        refused: (kind, code, key, behaviour) => this.refuse(behaviour, { kind, code, key, final: true })
      });
      this.networking = new Networking(this);
      const scheduler = this.scheduler;
      this.timeView = {
        get time() {
          return scheduler.time;
        },
        get deltaTime() {
          return scheduler.deltaTime;
        },
        get frameCount() {
          return scheduler.ticks;
        }
      };
      this.randomView = {
        get value() {
          return platform.random();
        },
        Range: (min, max) => min + (max - min) * platform.random(),
        RangeInt: (min, max) => Math.floor(min) + Math.floor((Math.floor(max) - Math.floor(min)) * platform.random()),
        Bytes: (n) => platform.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))))
      };
      const say = (level) => (message) => this.core.log(level, typeof message === "string" ? message : String(message));
      this.debugView = { Log: say("info"), LogWarning: say("warn"), LogError: say("error") };
      const owner = this;
      this.inputView = {
        GetButton: (button, side) => this.buttons.has(`${side}/${button}`),
        GetThumbstick: (side) => this.sticks[side].clone(),
        GetTrigger: (side) => this.triggers[side],
        GetKey: (key) => this.keys.has(key),
        get Poses() {
          return owner.poses;
        },
        get Position() {
          return owner.position ? owner.position.clone() : null;
        },
        Haptic: (side, strength, seconds) => platform.haptic(side, strength, seconds),
        get LastClickSide() {
          return owner.lastClickSide;
        },
        get IsVR() {
          return owner.vr;
        },
        InReach: (point, metres, whenUnknown = true) => {
          if (!(metres > 0)) return true;
          const distance = this.nearestDistance(point);
          return distance === null ? whenUnknown : distance <= metres;
        },
        TeleportTo: (position, yDegrees, stopMovement = true) => {
          this.moved(position);
          platform.teleport(position, yDegrees, stopMovement);
        },
        SetAbility: (ability, allowed) => {
          if (allowed) this.abilitiesOff.delete(ability);
          else this.abilitiesOff.add(ability);
          platform.setAbility(ability, allowed);
        },
        SetBlock: (control, blocked) => {
          if (blocked) this.blocksOn.add(control);
          else this.blocksOn.delete(control);
          platform.setBlock(control, blocked);
        }
      };
    }
    // ---- starting -----------------------------------------------------------------------------------------------
    /** Runs the start gate: platform, kit, snapshot, clock, keys, an id, a referee; then starts the behaviours. */
    async start() {
      const { platform, core } = this;
      try {
        await platform.whenReady();
        if (core.disposed) return;
        core.me = platform.local();
        core.listen();
        core.own(
          platform.onRelay(relayKey(core.slug, core.inst), {
            clock: (requestId, seconds) => this.host.onClockReply(requestId, seconds),
            event: (name, args) => this.onGraphEvent(name, args)
          })
        );
        core.own(platform.onPose((poses) => this.onPose(poses)));
        core.own(platform.onTeleported((position) => this.moved(position)));
        void platform.localPosition().then((position) => {
          if (position && !this.poses && !this.position && !core.disposed) this.position = position;
        }, () => void 0);
        void platform.isVR().then((vr) => this.vr = vr, () => this.vr = false);
        core.own(platform.onInput((event) => this.onInput(event)));
        core.own(platform.onStateError(core.prefix + ".", (path, code, final) => this.onRefusedPath(path.slice(core.prefix.length + 1), code, final)));
        await this.loadKit();
        if (core.disposed) return;
        const snapshot = await platform.whenSnapshot(core.options.snapshotTimeoutMs);
        if (core.disposed) return;
        if (!snapshot) core.log("warn", "no full state snapshot arrived in time; starting from what is mirrored");
        await this.askClock(true);
        if (core.disposed) return;
        const saved = storagePrefix(core.slug, core.inst, core.me.uid);
        const publicKey = await this.secrets.init(platform.storage, saved + "ecdh", saved + "draw");
        if (core.disposed) return;
        this.players.on((kind, player) => this.onPlayer(kind, player));
        this.referee.on((now, before) => this.onReferee(now?.sid ?? null, before?.sid ?? null));
        this.presence.start();
        this.presence.announce(publicKey);
        this.referee.start();
        this.players.start();
        this.secrets.listen();
        this.commands.listen();
        this.perUser.listen();
        this.protectedValues.listen();
        this.events.listen();
        this.secrets.onDrawChanged = (sid, label, status) => {
          const player = this.players.bySid(sid);
          if (player && this.started) this.each("OnDrawChanged", (b) => b.OnDrawChanged(player, label, status.state));
        };
        this.protectedValues.onChanged = (key) => {
          if (this.started) this.each("OnProtectedChanged", (b) => b.OnProtectedChanged(key));
        };
        const warn = this.scheduler.after(core.options.admitWarnMs, () => {
          core.log("warn", `still waiting to start: ${this.players.local ? "no referee has been elected" : "the local player's id has not settled"}`);
        });
        await this.players.whenLocalAssigned();
        if (this.rule === "anyone") await this.whenReferee();
        this.scheduler.cancel(warn);
        if (core.disposed) return;
        this.begin();
      } catch (error) {
        core.error("start", error);
      } finally {
        this.ready.resolve(this.started);
      }
    }
    whenReferee() {
      if (this.referee.current()) return Promise.resolve();
      const gate = deferred();
      this.referee.on((now) => {
        if (now) gate.resolve();
      });
      return gate.promise;
    }
    async loadKit() {
      const { core, bindings, element } = this;
      const address = (attr, fallback) => {
        const value = (element.getAttribute(attr) ?? "").trim();
        return /^https?:\/\//i.test(value) ? value : fallback;
      };
      const released = this.platform.bundles(core.slug);
      const windows = address("windows", released?.windows || bindings.bundles.windows);
      const android = address("android", released?.android || bindings.bundles.android);
      const keys = Object.keys(bindings.objects);
      if (windows || android) {
        const spec = {
          holderName: holderName(core.slug, core.inst),
          rootName: (bindings.root ?? bindings.slug) + "(Clone)",
          windows,
          android,
          position: triple(element.getAttribute("position"), false),
          rotation: triple(element.getAttribute("rotation"), false),
          scale: triple(element.getAttribute("scale"), true),
          objects: keys.map((key) => {
            const o = bindings.objects[key];
            const synced = o.sync === "transform" || o.seat;
            if (synced && o.attach) core.log("warn", `kit object '${key}' is both synced and attachable: it keeps its synced id, and other players may not see it attached`);
            const attach = attachId(core.slug, core.inst, key);
            return { key, path: o.path, networkId: synced ? networkId(core.slug, core.inst, key) : o.attach ? attach : "", attachNetworkId: attach, attach: o.attach === true, sync: o.sync, grab: o.grab, click: o.click, seat: o.seat };
          })
        };
        try {
          this.kit = await this.platform.loadKit(spec);
          if (this.kit.missing.length) core.log("error", `kit objects not found: ${this.kit.missing.join(", ")}`);
        } catch (error) {
          core.error("the kit did not load", error);
        }
      } else if (keys.length) core.log("warn", "no bundle address for this kit (bindings.bundles is empty and the element names none): running without objects");
      if (core.disposed) {
        this.kit?.destroy();
        this.kit = null;
        return;
      }
      for (const key of keys) {
        const path = bindings.objects[key].path;
        const subscribe2 = (kind, handler) => this.addObjectHandler(key, kind, handler);
        this.objects.set(key, new GameObject(key, path.slice(path.lastIndexOf("/") + 1), this.kit?.objects.get(key) ?? null, this.host, subscribe2));
      }
      let hidden = 0;
      for (const key of keys) {
        if (bindings.objects[key].active !== false) continue;
        this.objects.get(key).SetActive(false);
        hidden++;
      }
      if (hidden) this.host.flush();
      this.host.fallbackClip = (key, index) => {
        const object = this.kit?.objects.get(key);
        if (!object) return false;
        object.playClip(index);
        return true;
      };
      if (!this.kit) return;
      const reads = keys.map((key) => this.objects.get(key).transform.Refresh().catch(() => void 0));
      const waited = deferred();
      const limit = this.scheduler.after(3e3, () => waited.resolve());
      await Promise.race([Promise.all(reads), waited.promise]);
      this.scheduler.cancel(limit);
      for (const key of keys) {
        const o = bindings.objects[key];
        const hostObject = this.kit.objects.get(key);
        if (!hostObject || !(o.grab || o.sync === "transform")) continue;
        const transform = this.objects.get(key).transform;
        core.own(hostObject.watchTransform((pose2) => transform._report(pose2.position, pose2.rotation)));
      }
    }
    async askClock(first) {
      const sentAt = this.platform.clock.now();
      this.lastClockAsk = sentAt;
      const answer = this.host.requestClock().then((seconds) => {
        if (!this.core.disposed) this.clockSync.accept(seconds, sentAt);
        return true;
      });
      if (!first) return;
      const gate = deferred();
      const timer = this.scheduler.after(this.core.options.clockTimeoutMs, () => gate.resolve(false));
      const ok = await Promise.race([answer, gate.promise]);
      this.scheduler.cancel(timer);
      if (!ok) this.core.log("warn", "the synced clock did not answer; using this device's clock until it does");
    }
    begin() {
      const { core } = this;
      this.createBehaviours();
      this.wireEvents();
      this.sync.onLocalOwnership = (slot, mine) => {
        if (!mine) return;
        for (const member of slot.members) {
          const key = this.addresses.get(member.behaviour) ? member.behaviour.gameObject.key : "";
          if (key && this.bindings.objects[key]?.sync === "transform") member.behaviour.gameObject.TakeOwnership();
        }
      };
      this.sync.attach();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.Start`, () => behaviour.Start());
      this.sync.applySnapshot();
      this.startKindValue = this.computeStartKind();
      this.sync.begin();
      this.commands.started = true;
      this.perUser.started = true;
      this.started = true;
      this.perUser.dataEnabled = this.perUser.dataEnabled || this.anyOverrides("OnPlayerRestored") || this.anyOverrides("OnPlayerDataUpdated");
      this.perUser.restoreLocal();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.OnInstanceStart`, () => behaviour.OnInstanceStart(this.startKindValue));
      for (const player of this.players.list()) this.deliverJoin(player);
      this.sync.takeOver();
      this.secrets.review();
      this.commands.review();
      for (const early of this.earlyGraphEvents.splice(0)) this.onGraphEvent(early.name, early.args);
      this.scheduler.start(() => this.tick());
      this.tick();
      let extra = {};
      if (this.game.debug && this.platform.isTestPage?.() === true) core.guard("debug hooks", () => extra = this.game.debug(this));
      this.platform.expose(relayKey(core.slug, core.inst), {
        ...extra,
        digest: () => this.digest(),
        version: () => this.version(),
        stamp: () => ({ version: this.version(), digest: this.digest() }),
        state: () => JSON.parse(this.sync.snapshotText()),
        referee: () => this.referee.current(),
        players: () => this.players.list().map((p) => ({ id: p.playerId, name: p.displayName, sid: p.sid }))
      });
      core.log("info", `started (${this.startKindValue}) as ${this.players.local}, ${this.ordinary.length} behaviours`);
    }
    computeStartKind() {
      const ref = this.referee.current();
      if (!ref) return "idle";
      const claim = this.referee.lastClaim;
      if (ref.sid !== this.core.me.sid || !claim || claim.term !== ref.term) return "joined";
      if (claim.fresh) return "fresh";
      return claim.alive ? "joined" : "resumed";
    }
    // ---- behaviours ---------------------------------------------------------------------------------------------
    createBehaviours() {
      const { core, bindings } = this;
      const made = [];
      for (const binding of bindings.behaviours) {
        const cls = this.game.behaviours[binding.type];
        if (!cls) {
          core.log("error", `bindings name behaviour type '${binding.type}' (${binding.id}), which the game does not define`);
          continue;
        }
        if (binding.perPlayer === true || cls.perPlayer === true) {
          this.templates.push({ binding, cls });
          continue;
        }
        const behaviour = new cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, binding, null));
        this.addresses.set(behaviour, { id: binding.id, type: binding.type, playerSid: null });
        this.byId.set(binding.id, behaviour);
        this.ordinary.push(behaviour);
        made.push({ behaviour, binding, cls });
      }
      this.perUser.declareTypes(this.templates.map((t) => t.binding.id));
      for (const { behaviour, binding, cls } of made) {
        this.assignBindingFields(behaviour, binding, null);
        const fields = cls.synced ?? [];
        for (const field of fields) if (!(field in behaviour)) core.log("warn", `${binding.id}: synced field '${field}' is not a field of ${binding.type}`);
        this.sync.add(behaviour, binding.id, fields, fields.length ? cls.syncMode ?? "manual" : "none", cls.fieldChangeCallbacks, binding.group);
      }
    }
    makePlayerBehaviours(player) {
      if (!this.templates.length || this.playerBehaviourMap.has(player.sid)) return;
      const mine = /* @__PURE__ */ new Map();
      this.playerBehaviourMap.set(player.sid, mine);
      const made = [];
      for (const template of this.templates) {
        const behaviour = new template.cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, template.binding, player));
        this.addresses.set(behaviour, { id: template.binding.id, type: template.binding.type, playerSid: player.sid });
        mine.set(template.binding.id, behaviour);
        made.push({ behaviour, template });
      }
      for (const { behaviour, template } of made) this.assignBindingFields(behaviour, template.binding, mine);
      for (const { behaviour, template } of made) {
        const id = template.binding.id;
        this.core.guard(`${id}.Start`, () => behaviour.Start());
        const hasData = this.perUser.adopt(player, id, behaviour, template.cls.synced ?? [], template.cls.persistent === true, template.cls.fieldChangeCallbacks);
        if (hasData) this.core.guard(`${id}.OnDeserialization`, () => behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
      }
    }
    makeLink(behaviour, binding, player) {
      const gameObject = (binding.object ? this.objects.get(binding.object) : void 0) ?? new GameObject("", binding.id, null, null);
      const instance = this;
      return {
        id: binding.id,
        gameObject,
        networking: this.networking,
        time: this.timeView,
        random: this.randomView,
        debug: this.debugView,
        secrets: this.secrets,
        storage: this.storage,
        host: this.host,
        settings: this.settings,
        playerData: this.perUser,
        input: this.inputView,
        protectedValues: this.protectedValues,
        player,
        instanceKey: this.inst,
        shared: this.shared,
        reach: this.reachOverride,
        requestSerialization() {
          if (player) {
            if (player.isLocal) instance.perUser.requestSerialization(behaviour);
            return;
          }
          const slot = instance.sync.slotOf(behaviour);
          if (slot) instance.sync.requestSerialization(slot);
        },
        sendNetworkEvent(target, name, args) {
          instance.events.send(behaviour, target, name, args);
        },
        sendCommand(name, args) {
          return instance.commands.send(behaviour, name, args);
        },
        delaySeconds(name, seconds) {
          instance.scheduler.after(seconds * 1e3, () => instance.callByName(behaviour, name));
        },
        delayFrames(name, frames) {
          instance.scheduler.afterTicks(frames, () => instance.callByName(behaviour, name));
        },
        find: (id) => {
          const sibling = player ? this.playerBehaviourMap.get(player.sid)?.get(id) : void 0;
          return sibling ?? this.byId.get(id) ?? null;
        },
        findByType: (type) => this.ordinary.filter((b) => this.addresses.get(b)?.type === type),
        playerBehaviour: (who, type) => this.playerBehaviourOf(who, type),
        playerBehaviours: (type) => this.players.list().map((p) => this.playerBehaviourOf(p, type)).filter((b) => b !== null),
        raycast: (origin, direction, maxDistance, layerMask) => this.platform.raycast(origin, direction, maxDistance, layerMask),
        onGraphEvent: (name, method) => this.addGraphHandler(name, behaviour, method)
      };
    }
    playerBehaviourOf(player, type) {
      const mine = this.playerBehaviourMap.get(player.sid);
      if (!mine) return null;
      for (const behaviour of mine.values()) if (this.addresses.get(behaviour)?.type === type) return behaviour;
      return mine.get(type) ?? null;
    }
    callByName(behaviour, name) {
      if (this.core.disposed) return;
      const fn = behaviour[name];
      if (typeof fn === "function") this.core.guard(name, () => fn.call(behaviour));
      else this.core.log("warn", `${this.idOf(behaviour)} has no method '${name}' for a delayed event`);
    }
    assignBindingFields(behaviour, binding, siblings) {
      if (!binding.fields) return;
      const bag = behaviour;
      for (const name of Object.keys(binding.fields)) bag[name] = this.resolveField(binding.fields[name], siblings, `${binding.id}.${name}`, binding.object ?? null);
    }
    /** Turns a bindings field value into what the behaviour holds: objects, behaviours, component proxies, values. */
    resolveField(value, siblings, where, ownObject) {
      if (Array.isArray(value)) return value.map((v, i) => this.resolveField(v, siblings, `${where}[${i}]`, ownObject));
      if (!isRecord(value)) return value;
      if (typeof value.$obj === "string") return this.objects.get(value.$obj) ?? null;
      if (typeof value.$beh === "string") {
        const found = siblings?.get(value.$beh) ?? this.byId.get(value.$beh) ?? null;
        if (!found) this.core.log("warn", `${where}: behaviour '${value.$beh}' is per-player or missing, so the field is null`);
        return found;
      }
      if (typeof value.$comp === "string") {
        const object = this.objects.get(value.$comp);
        return object ? makeComponent(String(value.kind ?? "Transform"), object, this.host) : null;
      }
      if (typeof value.$clip === "number") return new AudioClipRef(value.$clip, typeof value.on === "string" ? value.on : null);
      if (Object.keys(value).some((key) => key.startsWith("$"))) return decodeValue(value);
      const out = {};
      for (const key of Object.keys(value)) out[key] = this.resolveField(value[key], siblings, `${where}.${key}`, ownObject);
      return out;
    }
    idOf(behaviour) {
      return this.addresses.get(behaviour)?.id ?? "?";
    }
    all() {
      const out = this.ordinary.slice();
      for (const mine of this.playerBehaviourMap.values()) for (const behaviour of mine.values()) out.push(behaviour);
      return out;
    }
    overrides(behaviour, method) {
      return behaviour[method] !== Behaviour.prototype[method];
    }
    anyOverrides(method) {
      if (this.ordinary.some((b) => this.overrides(b, method))) return true;
      return this.templates.some((t) => t.cls.prototype[method] !== Behaviour.prototype[method]);
    }
    /** Calls a callback on every behaviour that overrides it. */
    each(method, call) {
      if (!this.started || this.core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, method)) this.core.guard(`${this.idOf(behaviour)}.${String(method)}`, () => call(behaviour));
      }
    }
    // ---- players and referee ------------------------------------------------------------------------------------
    onPlayer(kind, player) {
      if (!this.started || this.core.disposed) return;
      if (kind === "join") {
        this.deliverJoin(player);
        return;
      }
      if (!this.referee.current()) {
        this.pendingLeaves.push(player);
        if (this.rule === "anyone") this.scheduler.after(5e3, () => this.flushLeaves());
        return;
      }
      this.deliverLeave(player);
    }
    flushLeaves() {
      for (const player of this.pendingLeaves.splice(0)) this.deliverLeave(player);
    }
    deliverJoin(player) {
      this.makePlayerBehaviours(player);
      this.each("OnPlayerJoined", (b) => b.OnPlayerJoined(player));
      this.perUser.playerDelivered(player);
    }
    deliverLeave(player) {
      this.each("OnPlayerLeft", (b) => b.OnPlayerLeft(player));
      const gone = this.perUser.playerGone(player.sid);
      const mine = this.playerBehaviourMap.get(player.sid);
      this.playerBehaviourMap.delete(player.sid);
      for (const behaviour of mine ? mine.values() : gone) {
        this.core.guard("OnDestroy", () => behaviour.OnDestroy());
        this.addresses.delete(behaviour);
      }
    }
    onReferee(now, before) {
      if (!this.started || this.core.disposed) return;
      if (now !== before) {
        const wasIdle = this.startKindValue === "idle";
        if (wasIdle && now !== null) {
          this.startKindValue = this.computeStartKind();
          this.each("OnInstanceStart", (b) => b.OnInstanceStart(this.startKindValue));
        }
        const player = now === null ? null : this.players.bySid(now);
        if (player || now === null && this.referee.candidates().length === 0) this.each("OnMasterTransferred", (b) => b.OnMasterTransferred(player));
      }
      if (now !== null) this.flushLeaves();
    }
    // NetHost
    localPlayer() {
      const local = this.players.local;
      if (!local) throw new Error("the local player is not known before the instance has started");
      return local;
    }
    isReferee() {
      return this.referee.isMe();
    }
    owner(target) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return this.players.bySid(address.playerSid);
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.owner(slot) : null;
    }
    isOwner(target, player) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return address.playerSid === player.sid;
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.isOwner(slot, player.sid) : false;
    }
    setOwner(target, player) {
      if (this.addresses.get(target)?.playerSid) {
        this.core.log("warn", `${this.idOf(target)} is a per-player behaviour: its owner cannot change`);
        return;
      }
      const slot = this.sync.slotOf(target);
      if (slot) this.sync.setOwner(slot, player.sid, player.uid);
    }
    behavioursOn(object) {
      return this.ordinary.filter((b) => b.gameObject === object);
    }
    serverSeconds() {
      return this.clockSync.seconds();
    }
    playerList() {
      return this.players.list();
    }
    playerById(id) {
      return this.players.byId(id);
    }
    callingPlayer() {
      return this.events.callingSid === null ? null : this.players.bySid(this.events.callingSid);
    }
    callingSession() {
      const sid = this.events.callingSid;
      if (sid === null) return null;
      const who = this.platform.players().find((p) => p.sid === sid);
      return { sid, uid: who ? who.uid : "" };
    }
    setCandidate(on) {
      if (this.rule !== "declared") {
        this.core.log("warn", 'SetRefereeCandidate only matters in a game whose definition says referee: "declared"');
        return;
      }
      this.referee.setCandidate(on);
    }
    isCandidate(player) {
      return this.referee.isCandidate(player.sid);
    }
    startKind() {
      return this.startKindValue;
    }
    refereePlayer() {
      const ref = this.referee.current();
      return ref ? this.players.bySid(ref.sid) : null;
    }
    // ---- events from objects, graphs and input ------------------------------------------------------------------
    wireEvents() {
      const explicit = /* @__PURE__ */ new Set();
      const mine = (id) => () => this.playerBehaviourMap.get(this.core.me.sid)?.get(id) ?? null;
      for (const event of this.bindings.events) {
        if (!event.behaviour || !event.method) continue;
        const ordinary = this.byId.get(event.behaviour);
        const perPlayer = !ordinary && this.templates.some((t) => t.binding.id === event.behaviour);
        if (!ordinary && !perPlayer) continue;
        const target = ordinary ?? mine(event.behaviour);
        if (event.kind === "graph") {
          this.addGraphHandler(event.name ?? "", target, event.method);
          continue;
        }
        explicit.add(`${event.object}/${event.kind}/${event.behaviour}`);
        this.addObjectHandler(event.object, event.kind, (detail) => {
          const behaviour = typeof target === "function" ? target() : target;
          if (behaviour) this.callBound(behaviour, event, detail);
        });
      }
      for (const template of this.templates) {
        const key = template.binding.object;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!key || !object) continue;
        const id = template.binding.id;
        const proto = template.cls.prototype;
        const base = Behaviour.prototype;
        if (object.click && proto.Interact !== base.Interact && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            const behaviour = mine(id)();
            if (behaviour && this.withinReach(behaviour, void 0, template.cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && proto.OnPickup !== base.OnPickup && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => mine(id)()?.OnPickup());
        }
        if (object.grab && proto.OnDrop !== base.OnDrop && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => mine(id)()?.OnDrop());
        }
      }
      for (const behaviour of this.ordinary) {
        const key = behaviour.gameObject.key;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!object) continue;
        const id = this.idOf(behaviour);
        const cls = behaviour.constructor;
        if (object.click && this.overrides(behaviour, "Interact") && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            if (this.withinReach(behaviour, void 0, cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && this.overrides(behaviour, "OnPickup") && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => this.core.guard(`${id}.OnPickup`, () => behaviour.OnPickup()));
        }
        if (object.grab && this.overrides(behaviour, "OnDrop") && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => this.core.guard(`${id}.OnDrop`, () => behaviour.OnDrop()));
        }
      }
    }
    callBound(behaviour, event, detail) {
      const cls = behaviour.constructor;
      if (event.kind === "click" && !this.withinReach(behaviour, event.reach, cls.interactReach ?? 0, detail)) return;
      const fn = behaviour[event.method];
      if (typeof fn !== "function") {
        this.core.log("warn", `${event.behaviour} has no method '${event.method}' (bound to ${event.kind} of ${event.object})`);
        return;
      }
      let argument = detail;
      if (event.kind === "uiSlider") argument = Number(detail.arg ?? "0");
      else if (event.kind === "uiToggle") argument = detail.arg === "1" || detail.arg === "true" || detail.arg === "True";
      else if (event.kind === "field") argument = detail.arg ?? "";
      this.core.guard(`${event.behaviour}.${event.method}`, () => fn.call(behaviour, argument));
    }
    /**
     * True when a click is close enough to count: measured from the nearest of the local head and hands. The reach is
     * the behaviour's own (InteractReach), else the binding's, else the class's, else the game's. With no pose
     * reported yet, every click counts.
     */
    withinReach(behaviour, eventReach, classReach, detail) {
      const own = this.reachOverride.get(behaviour);
      const reach = own !== void 0 ? own : eventReach !== void 0 ? eventReach : classReach > 0 ? classReach : this.game.interactReach ?? 0;
      if (!(reach > 0)) return true;
      const unknown = this.game.reachWhenUnknown !== false;
      const transform = behaviour.gameObject.transform;
      const point = detail.point ?? (transform.known ? transform.position : null);
      if (!point) return unknown;
      const distance = this.nearestDistance(point);
      return distance === null ? unknown : distance <= reach;
    }
    /** Metres from `point` to the nearest of the local head and hands; null when no pose or position is known. */
    nearestDistance(point) {
      const poses = this.poses;
      const from = poses ? [poses.head.position, poses.leftHand.position, poses.rightHand.position] : this.position ? [this.position] : [];
      if (!from.length) return null;
      let nearest = Infinity;
      for (const p of from) nearest = Math.min(nearest, Vector3.Distance(p, point));
      return nearest;
    }
    /** The hand that clicked: the one whose trigger went down in the last second, else the one nearest the point. */
    clickSide(point) {
      const now = this.platform.clock.now();
      const [left, right] = this.triggerAt;
      const recent = Math.max(left, right);
      if (now - recent <= 1e3) return right >= left ? 1 : 0;
      if (!this.poses || !point) return null;
      return Vector3.Distance(this.poses.rightHand.position, point) <= Vector3.Distance(this.poses.leftHand.position, point) ? 1 : 0;
    }
    addObjectHandler(objKey, kind, handler) {
      let kinds = this.objectHandlers.get(objKey);
      if (!kinds) this.objectHandlers.set(objKey, kinds = /* @__PURE__ */ new Map());
      let list = kinds.get(kind);
      if (!list) kinds.set(kind, list = []);
      list.push(handler);
      const wire = `${objKey}/${kind}`;
      const hostObject = this.kit?.objects.get(objKey);
      if (hostObject && !this.hostWired.has(wire)) {
        this.hostWired.add(wire);
        this.core.own(hostObject.on(kind, (detail) => this.dispatchObject(objKey, kind, detail)));
      }
    }
    /** Delivers an object's event to what is bound to it. Also the entry point for events a graph raised. */
    dispatchObject(objKey, kind, detail) {
      if (!this.started || this.core.disposed) return;
      if (kind === "click") {
        if (detail.side === void 0) {
          const side = this.clickSide(detail.point);
          if (side !== null) detail.side = side;
        }
        this.lastClickSide = detail.side === 0 || detail.side === 1 ? detail.side : null;
      }
      const handlers = this.objectHandlers.get(objKey)?.get(kind);
      if (!handlers || !handlers.length) return;
      const run = () => {
        if (this.core.disposed) return;
        for (const handler of handlers.slice()) this.core.guard(`${objKey} ${kind}`, () => handler(detail));
      };
      const object = this.objects.get(objKey);
      if (kind === "drop" && object && object.host) {
        object.transform.Refresh().then(run, run);
        return;
      }
      run();
    }
    addGraphHandler(name, behaviour, method) {
      if (!name) return;
      let list = this.graphHandlers.get(name);
      if (!list) this.graphHandlers.set(name, list = []);
      list.push({ behaviour, method });
    }
    /**
     * Where the app places a player's head (relay op `pkHead`: the SDK's Get User State, which reads the user's Head
     * transform). Resolves null when the app does not know the player or has no body for them yet (it answers 0 0 0), when
     * the kit's relay graph has no `pkHead` op (a kit built before it), or after `seconds`. Unlike a position a page
     * publishes about itself, the app's placing of another player's avatar is not that player's word (found by treasure
     * hunt, whose referee checks a find's reach with it). The continuation runs after the reply's turn, like any promise.
     */
    headOf(player, seconds = 2) {
      if (!player || this.core.disposed) return Promise.resolve(null);
      const id = String(this.nextHeadRequest++);
      return new Promise((resolve) => {
        const timer = this.scheduler.after(Math.max(0, seconds) * 1e3, () => {
          this.headRequests.delete(id);
          resolve(null);
        });
        this.headRequests.set(id, { resolve, timer });
        this.host.request(HEAD_OP, [id, player.sid]);
      });
    }
    onHeadReply(args) {
      const request = this.headRequests.get(args[0] ?? "");
      if (!request) return;
      this.headRequests.delete(args[0]);
      this.scheduler.cancel(request.timer);
      const n = args.slice(1, 4).map((v) => typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
      const known = n.length === 3 && n.every((v) => Number.isFinite(v)) && !(n[0] === 0 && n[1] === 0 && n[2] === 0);
      request.resolve(known ? new Vector3(n[0], n[1], n[2]) : null);
    }
    onGraphEvent(name, args) {
      if (this.core.disposed) return;
      if (name === HEAD_EVENT) {
        this.onHeadReply(args);
        return;
      }
      if (!this.started) {
        if (this.earlyGraphEvents.length < MAX_EARLY_EVENTS) this.earlyGraphEvents.push({ name, args });
        return;
      }
      if (OBJECT_EVENTS.indexOf(name) >= 0) {
        const key = this.keyOfTarget(args[0] ?? "");
        if (!key) return;
        const detail = { arg: args[1], args: args.slice(1) };
        if (name.startsWith("collision") || name.startsWith("trigger")) {
          const n = args.slice(2, 8).map(Number);
          if (args[1] !== void 0) detail.otherName = args[1];
          if (n.length >= 3 && n.slice(0, 3).every(Number.isFinite)) detail.point = new Vector3(n[0], n[1], n[2]);
          if (n.length >= 6 && n.slice(3, 6).every(Number.isFinite)) detail.normal = new Vector3(n[3], n[4], n[5]);
        }
        if (name.startsWith("held") && args[1] === "left") detail.side = 0;
        else if (name.startsWith("held") && args[1] === "right") detail.side = 1;
        this.dispatchObject(key, name, detail);
        return;
      }
      const handlers = this.graphHandlers.get(name);
      if (!handlers) return;
      for (const handler of handlers.slice()) {
        const behaviour = typeof handler.behaviour === "function" ? handler.behaviour() : handler.behaviour;
        const method = handler.method;
        if (!behaviour) continue;
        const fn = behaviour[method];
        if (typeof fn === "function") this.core.guard(`${this.idOf(behaviour)}.${method}`, () => fn.apply(behaviour, args));
      }
    }
    /** A relay target ("3", "@Board/Cup") or a binding key, as a binding key. */
    keyOfTarget(target) {
      if (target.startsWith("@")) {
        const path = target.slice(1);
        for (const key of Object.keys(this.bindings.objects)) if (this.bindings.objects[key].path === path) return key;
        return null;
      }
      if (/^\d+$/.test(target)) return this.bindings.refs[Number(target)] ?? null;
      return target in this.bindings.objects ? target : null;
    }
    /** The local player was moved (teleported): the last poses no longer say where they are, until the next one. */
    moved(position) {
      this.position = position.clone();
      this.poses = null;
    }
    onPose(poses) {
      this.poses = poses;
      this.position = poses.head.position;
    }
    onInput(event) {
      if (this.core.disposed) return;
      if (event.type === "button") {
        const id = `${event.side}/${event.button}`;
        if (event.pressed && event.button === 0) this.triggerAt[event.side] = this.platform.clock.now();
        if (event.pressed) this.buttons.add(id);
        else this.buttons.delete(id);
        const { button, side } = event;
        if (event.pressed) this.each("OnButtonPressed", (b) => b.OnButtonPressed(button, side));
        else this.each("OnButtonReleased", (b) => b.OnButtonReleased(button, side));
      } else if (event.type === "thumbstick") {
        this.sticks[event.side] = new Vector2(event.x, event.y);
      } else if (event.type === "trigger") {
        this.triggers[event.side] = event.value;
      } else {
        const key = event.key;
        if (event.pressed) this.keys.add(key);
        else this.keys.delete(key);
        if (event.pressed) this.each("OnKeyPressed", (b) => b.OnKeyPressed(key));
        else this.each("OnKeyReleased", (b) => b.OnKeyReleased(key));
      }
    }
    // ---- the tick -----------------------------------------------------------------------------------------------
    tick() {
      const { core } = this;
      if (core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, "Update")) core.guard(`${this.idOf(behaviour)}.Update`, () => behaviour.Update());
      }
      this.sync.flush();
      this.perUser.flush();
      this.presence.flush();
      this.host.flush();
      if (this.scheduler.ticks % 20 === 0) {
        this.presence.tend();
        this.players.tend();
        this.secrets.review();
        this.commands.review();
        this.sync.takeOver();
        if (this.platform.clock.now() - this.lastClockAsk >= core.options.clockResyncMs) void this.askClock(false);
      }
    }
    // ---- refused writes -----------------------------------------------------------------------------------------
    onRefusedPath(key, code, final) {
      if (this.core.disposed) return;
      this.core.log(final ? "error" : "warn", `the room ${final ? "refused" : "is holding back"} a write to ${key}: ${code}`);
      if (key === "d" || /^p[0-3]$/.test(key)) {
        this.refuse(null, { kind: key === "d" ? "playerData" : "playerObject", code, key, final });
        return;
      }
      if (key.startsWith("x.")) {
        this.refuse(null, { kind: "protected", code, key: key.slice(2), final });
        return;
      }
      const slot = this.sync.slotForKey(key);
      if (!slot) {
        this.refuse(null, { kind: "state", code, key, final });
        return;
      }
      for (const member of slot.members) {
        if (final && !key.startsWith("o.")) this.core.guard("OnPostSerialization", () => member.behaviour.OnPostSerialization({ success: false, byteCount: 0 }));
        this.core.guard("OnWriteRefused", () => member.behaviour.OnWriteRefused({ kind: "state", code, key, final }));
      }
    }
    /** Reports a refusal to the behaviour it belongs to, or to every behaviour that listens and to the game. */
    refuse(behaviour, refusal) {
      if (behaviour) {
        this.core.guard("OnWriteRefused", () => behaviour.OnWriteRefused(refusal));
        return;
      }
      this.each("OnWriteRefused", (b) => b.OnWriteRefused(refusal));
      if (this.game.onWriteRefused) this.core.guard("onWriteRefused", () => this.game.onWriteRefused(refusal));
    }
    // ---- inspection and teardown --------------------------------------------------------------------------------
    /** An ordinary behaviour by its bindings id (for tests and for the page registry). */
    behaviour(id) {
      const found = this.byId.get(id);
      if (!found) throw new Error(`no behaviour '${id}' in ${this.core.slug}:${this.inst}`);
      return found;
    }
    /** A per-player behaviour: the copy of `id` that belongs to the player with session `sid`. */
    playerBehaviour(sid, id) {
      return this.playerBehaviourMap.get(sid)?.get(id) ?? null;
    }
    /** A short hash of every synced field: equal on clients that agree. */
    digest() {
      var _a;
      const perPlayer = this.perUser.snapshot();
      const text = this.sync.snapshotText();
      if (!perPlayer.length) return fnv1a(text);
      const players = {};
      for (const copy of perPlayer) (players[_a = copy.sid] ?? (players[_a] = {}))[copy.id] = copy.fields;
      return fnv1a(text + "\n" + canonicalJson(players));
    }
    /**
     * Which writes this client's synced state is made of: "<writes>:<hash>", where writes is the sum of the sequence
     * numbers applied per leaf and the hash covers each leaf's (generation, sequence, writer). Two pages with the same
     * version hold the same writes, so their digests can be compared; a field that ticks on its own (a referee's timer)
     * moves the version, and a test waits until both pages report the same one. `stamp()` reads both at once.
     */
    version() {
      const parts = [];
      let writes = 0;
      for (const id of [...this.sync.slots.keys()].sort()) {
        const marker = this.sync.slots.get(id).applied;
        if (!marker) continue;
        writes += marker.n;
        parts.push(`${id}:${marker.g}.${marker.n}.${marker.w}`);
      }
      for (const copy of this.perUser.snapshot()) {
        writes += copy.n;
        parts.push(`${copy.sid}/${copy.id}:${copy.n}`);
      }
      return `${writes}:${fnv1a(parts.join("|"))}`;
    }
    dispose() {
      const { core } = this;
      if (core.disposed) return;
      if (this.started) for (const behaviour of this.all()) core.guard("OnDestroy", () => behaviour.OnDestroy());
      for (const ability of this.abilitiesOff) this.platform.setAbility(ability, true);
      for (const control of this.blocksOn) this.platform.setBlock(control, false);
      this.presence.retire();
      this.perUser.retire();
      this.host.abandonClock();
      this.platform.expose(relayKey(core.slug, core.inst), null);
      core.dispose();
      this.kit?.destroy();
      this.kit = null;
      this.ready.resolve(false);
    }
  };
  function triple(text, uniform) {
    if (!text) return null;
    const parts = text.trim().split(/\s+/).map(Number);
    if (parts.some((n) => !Number.isFinite(n))) return null;
    if (parts.length === 3) return new Vector3(parts[0], parts[1], parts[2]);
    if (uniform && parts.length === 1) return new Vector3(parts[0], parts[0], parts[0]);
    return null;
  }

  // portkit/src/boot.ts
  var RUNTIME_VERSION = "0.1.0";
  var GameRuntime = class {
    constructor(platform, game2, bindings) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      /** Running instances by instance key. */
      __publicField(this, "instances", /* @__PURE__ */ new Map());
      /** One object for every instance of this game on the page (Behaviour.Shared): page memory, not synced or saved. */
      __publicField(this, "shared", {});
      __publicField(this, "stopped", false);
      __publicField(this, "unsubs", []);
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
    }
    /** Waits for the page, then serves every element of this game, now and later. */
    async start() {
      await this.platform.whenReady();
      if (this.stopped) return;
      this.unsubs.push(this.platform.onSnippetsChanged(() => this.scan()));
      this.unsubs.push(
        this.platform.onSessionChanged(() => {
          this.platform.log("warn", `[${this.game.slug}] the session changed; restarting every instance`);
          for (const instance of this.instances.values()) instance.dispose();
          this.instances.clear();
          this.scan();
        })
      );
      this.scan();
    }
    /** Brings the running instances in line with the elements on the page. */
    scan() {
      if (this.stopped) return;
      const wanted = /* @__PURE__ */ new Map();
      for (const element of this.platform.snippets(this.game.slug)) {
        if (!element.connected || !element.active) continue;
        const key = instanceKeyFor({ room: element.getAttribute("room"), instance: element.getAttribute("instance") }, element.index);
        if (wanted.has(key)) {
          this.platform.log("warn", `[${this.game.slug}] two elements resolve to instance '${key}' (same room or instance attribute); the second is ignored`);
          continue;
        }
        wanted.set(key, element);
      }
      for (const [key, instance] of [...this.instances]) {
        if (wanted.get(key) === instance.element) continue;
        instance.dispose();
        this.instances.delete(key);
      }
      for (const [key, element] of wanted) {
        if (this.instances.has(key)) continue;
        const instance = new GameInstance(this.platform, this.game, this.bindings, element, key, this.shared);
        this.instances.set(key, instance);
        void instance.start();
      }
    }
    instance(key) {
      return this.instances.get(key);
    }
    stop() {
      this.stopped = true;
      for (const unsub of this.unsubs.splice(0)) unsub();
      for (const instance of this.instances.values()) instance.dispose();
      this.instances.clear();
    }
  };
  function boot(platform, game2, rawBindings) {
    if (!isValidSlug(game2.slug)) throw new Error(`'${game2.slug}' is not a valid slug`);
    const bindings = validateBindings(rawBindings);
    if (bindings.slug !== game2.slug) throw new Error(`bindings.json is for '${bindings.slug}', the game is '${game2.slug}'`);
    if (!platform.claimGame(game2.slug, { runtime: RUNTIME_VERSION, bindings: bindings.hash ?? "" })) return null;
    const runtime = new GameRuntime(platform, game2, bindings);
    runtime.start().catch((error) => platform.log("error", `[${game2.slug}] could not start: ${error instanceof Error ? error.message : String(error)}`));
    return runtime;
  }

  // portkit/src/types.ts
  var DEFAULT_LIMITS = {
    maxLeafBytes: 16384,
    maxRoomKeys: 2048,
    oneShotMaxBytes: 4089,
    maxUserKeys: 64
  };

  // src/AudioController.ts
  var AudioController = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Set by DistanceOptimizer: the local player is near enough to hear the table. */
      __publicField(this, "isActive", true);
      // From bindings.json.
      __publicField(this, "Audio", null);
      __publicField(this, "StartMatch", null);
      __publicField(this, "StartActivePlay", null);
      __publicField(this, "DrawCard", []);
      __publicField(this, "SplitDeck", null);
      __publicField(this, "Stand", null);
      __publicField(this, "WinMatch", null);
      __publicField(this, "LoseMatch", null);
      __publicField(this, "DrawMatch", null);
      __publicField(this, "DealerWantToHit", null);
      __publicField(this, "Bust", null);
      __publicField(this, "TakeControl", null);
      __publicField(this, "ReleaseControl", null);
      __publicField(this, "FlipCard", []);
      __publicField(this, "UIInteract", null);
      /** Every clip asked for, by field name, for tests (the relay records the clip index too). */
      __publicField(this, "played", []);
    }
    Play(name, clip, always = false) {
      if (!this.isActive && !always) return;
      this.played.push(name);
      if (clip) this.Audio?.PlayOneShot(clip);
    }
    PlayStartMatch() {
      this.Play("StartMatch", this.StartMatch);
    }
    PlayStartActivePlay() {
      this.Play("StartActivePlay", this.StartActivePlay);
    }
    PlayDrawCard() {
      this.Play("DrawCard", this.DrawCard.length ? this.DrawCard[this.Random.RangeInt(0, this.DrawCard.length)] : null);
    }
    PlaySplitDeck() {
      this.Play("SplitDeck", this.SplitDeck);
    }
    PlayStand() {
      this.Play("Stand", this.Stand);
    }
    PlayWinMatch() {
      this.Play("WinMatch", this.WinMatch);
    }
    PlayLoseMatch() {
      this.Play("LoseMatch", this.LoseMatch);
    }
    PlayDrawMatch() {
      this.Play("DrawMatch", this.DrawMatch);
    }
    PlayDealerWantToHit() {
      this.Play("DealerWantToHit", this.DealerWantToHit);
    }
    PlayBust() {
      this.Play("Bust", this.Bust);
    }
    PlayTakeControl() {
      this.Play("TakeControl", this.TakeControl);
    }
    PlayReleaseControl() {
      this.Play("ReleaseControl", this.ReleaseControl);
    }
    PlayFlipCard() {
      this.Play("FlipCard", this.FlipCard.length ? this.FlipCard[this.Random.RangeInt(0, this.FlipCard.length)] : null);
    }
    /** The click of a dealer-side button: heard by the presser even out of range (AudioController.cs:129-132). */
    PlayUIInteract() {
      this.Play("UIInteract", this.UIInteract, true);
    }
  };

  // src/BlackjackWorldController.ts
  var BlackjackWorldController = class extends Behaviour {
    constructor() {
      super(...arguments);
      // From bindings.json.
      __publicField(this, "ChipController");
      __publicField(this, "BlackjackTables", []);
    }
    flag(name, fallback) {
      const value = (this.Settings.get(name) ?? "").trim().toLowerCase();
      if (value === "") return fallback;
      return value === "true" || value === "1" || value === "yes" || value === "on";
    }
    number(name, fallback) {
      const text = (this.Settings.get(name) ?? "").trim();
      const value = Number(text);
      return text !== "" && Number.isFinite(value) ? value : fallback;
    }
    OnInstanceStart(_kind) {
      this.Apply();
    }
    Update() {
      if (this.Time.frameCount % 20 === 0) this.Apply();
    }
    /** The referee writes the settings once; it does nothing after that or on other clients. */
    Apply() {
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
          turnSeconds: Math.max(5, this.number("turn-seconds", 30))
        });
      }
    }
  };

  // src/ChipController.ts
  var ChipBank = class {
    constructor(startingChips) {
      __publicField(this, "CurrentChipCount");
      __publicField(this, "StartingChips");
      __publicField(this, "CurrentBet", /* @__PURE__ */ new Map());
      /** Stands in for AudioSource.isPlaying and PlayOneShot. */
      __publicField(this, "isPlaying", () => false);
      __publicField(this, "play", () => {
      });
      this.StartingChips = startingChips;
      this.CurrentChipCount = startingChips;
    }
    Bet(table) {
      return this.CurrentBet.get(table) ?? 0;
    }
    AddChips(value) {
      this.CurrentChipCount += value;
    }
    RemoveChips(value) {
      this.CurrentChipCount -= value;
    }
    ResetChips() {
      this.CurrentChipCount = this.StartingChips;
      for (const table of this.CurrentBet.keys()) this.CurrentBet.set(table, 0);
    }
    /** True when the bets on every table plus `value` stay within the chips. */
    CanAddToBet(value) {
      let totalBet = 0;
      for (const bet of this.CurrentBet.values()) totalBet += bet;
      return totalBet + value <= this.CurrentChipCount;
    }
    /** Refused (with the low bleep) when the bets on all tables plus `value` would exceed the chips. */
    AddToBet(table, value) {
      if (!this.CanAddToBet(value)) {
        this.NotEnoughChips();
        return false;
      }
      this.CurrentBet.set(table, this.Bet(table) + value);
      if (!this.isPlaying()) this.play("AddToBet");
      return true;
    }
    /** As upstream: bleeps but still subtracts when the bet would go below 0 (the seat's buttons check first). */
    TakeFromBet(table, value) {
      if (this.Bet(table) - value < 0) this.NotEnoughChips();
      this.CurrentBet.set(table, this.Bet(table) - value);
      this.play("AddToBet");
    }
    ResetBet(table) {
      this.CurrentBet.set(table, 0);
    }
    NotEnoughChips() {
      if (this.isPlaying()) return;
      this.play("NotEnoughChips");
    }
  };
  var BANK_KEY = "chipBank";
  var CLIP_SECONDS = 0.35;
  var ChipController = class extends Behaviour {
    constructor() {
      super(...arguments);
      // From bindings.json (upstream fields of the same names).
      __publicField(this, "UseChipSystem", true);
      __publicField(this, "StartingChips", 100);
      __publicField(this, "Audio", null);
      __publicField(this, "NotEnoughChipsClip", null);
      __publicField(this, "AddToBetClip", null);
      __publicField(this, "playingUntil", -Infinity);
      __publicField(this, "cached", null);
    }
    /** The page's bank (one for every table on the page), made by the first table that asks, with its starting chips. */
    get Bank() {
      if (this.cached) return this.cached;
      let bank = this.Shared[BANK_KEY];
      if (!bank) {
        const setting = Number(this.Settings.get("starting-chips"));
        bank = new ChipBank(Number.isFinite(setting) && setting > 0 ? Math.floor(setting) : this.StartingChips);
        this.Shared[BANK_KEY] = bank;
      }
      if (!bank.CurrentBet.has(this.InstanceKey)) bank.CurrentBet.set(this.InstanceKey, 0);
      this.cached = bank;
      return bank;
    }
    get CurrentChipCount() {
      return this.Bank.CurrentChipCount;
    }
    /** This table's bet (upstream CurrentBet[TableIndex]). */
    GetBet() {
      return this.Bank.Bet(this.InstanceKey);
    }
    wire() {
      const bank = this.Bank;
      bank.isPlaying = () => this.Time.time < this.playingUntil;
      bank.play = (clip) => {
        const ref = clip === "AddToBet" ? this.AddToBetClip : this.NotEnoughChipsClip;
        if (ref) this.Audio?.PlayOneShot(ref);
        this.playingUntil = this.Time.time + CLIP_SECONDS;
      };
      return bank;
    }
    AddChips(value) {
      this.Bank.AddChips(value);
    }
    RemoveChips(value) {
      this.Bank.RemoveChips(value);
    }
    ResetChips() {
      this.Bank.ResetChips();
    }
    CanAddToBet(value) {
      return this.Bank.CanAddToBet(value);
    }
    AddToBet(value) {
      return this.wire().AddToBet(this.InstanceKey, value);
    }
    TakeFromBet(value) {
      this.wire().TakeFromBet(this.InstanceKey, value);
    }
    ResetBet() {
      this.Bank.ResetBet(this.InstanceKey);
    }
    NotEnoughChips() {
      this.wire().NotEnoughChips();
    }
    OnDestroy() {
      this.cached?.CurrentBet.delete(this.InstanceKey);
    }
  };

  // src/DeckManager.ts
  var CARD_TYPES = 52;
  function CardValue(type) {
    const rank = Math.floor(type / 4);
    if (rank <= 8) return rank + 2;
    return rank <= 11 ? 10 : 11;
  }
  function InitializeCounts(numberOfDecks, literal = false) {
    const counts = new Array(CARD_TYPES);
    for (let i = 0; i < counts.length; i++) counts[i] = i === 0 && literal ? 999 : numberOfDecks;
    return counts;
  }
  function GetUnusedCardIndex(NumOfEachCardLeft, startIndex) {
    const length = NumOfEachCardLeft.length;
    let unusedCard = -1;
    let index = startIndex;
    if (NumOfEachCardLeft[index] > 0) {
      unusedCard = index;
    } else {
      while (index < length - 1) {
        if (NumOfEachCardLeft[index] < 1) index++;
        else return index;
      }
      if (index >= length - 1) {
        if (NumOfEachCardLeft[index] < 1) index = 0;
        else return index;
      }
      while (index < startIndex) {
        if (NumOfEachCardLeft[index] < 1) index++;
        else return index;
      }
      if (index === startIndex) return -1;
    }
    return unusedCard;
  }
  function AddDeckCount(numberOfDecks) {
    return numberOfDecks + 1;
  }
  function SubtractDeckCount(numberOfDecks) {
    return numberOfDecks <= 2 ? 2 : numberOfDecks - 1;
  }
  var NO_CARD = -2;
  var HIDDEN = -1;
  function HandCode(seat, split) {
    return seat * 2 + (split ? 1 : 0);
  }
  var TO_DEALER = 100;
  var TO_HOLE = 101;
  var TO_NONE = -1;
  function Checked() {
    return { ok: true, status: "checked", reason: "" };
  }
  function Unverifiable(reason) {
    return { ok: false, status: "unverifiable", reason };
  }
  function Mismatch(reason) {
    return { ok: false, status: "mismatch", reason };
  }
  function ReplayCards(draw, numberOfDecks, baseCards, draws) {
    const counts = InitializeCounts(numberOfDecks);
    for (const c of baseCards) if (c >= 0) counts[c]--;
    const out = [];
    for (let k = 0; k < draws; k++) {
      const card = GetUnusedCardIndex(counts, draw.Int(CARD_TYPES, k));
      out.push(card);
      if (card >= 0) counts[card]--;
    }
    return out;
  }
  function ReplaySegment(draw, numberOfDecks, baseCards, drawLog) {
    const cards = ReplayCards(draw, numberOfDecks, baseCards, drawLog.length);
    for (let k = 0; k < drawLog.length; k++) {
      const logged = drawLog[k];
      if (logged === HIDDEN) return Mismatch(`draw ${k} was never turned face up`);
      if ((logged === NO_CARD ? -1 : logged) !== cards[k]) return Mismatch(`draw ${k} is ${logged}, the deal gives ${cards[k]}`);
    }
    return Checked();
  }
  function CheckHands(cards, drawTo, baseCards, hands) {
    if (drawTo.length !== cards.length) return Mismatch(`${cards.length} draws but ${drawTo.length} destinations`);
    const valid = /* @__PURE__ */ new Set([TO_DEALER, TO_HOLE, TO_NONE]);
    hands.seats.forEach((_, i) => (valid.add(HandCode(i, false)), valid.add(HandCode(i, true))));
    for (let k = 0; k < drawTo.length; k++) {
      if (!valid.has(drawTo[k])) return Mismatch(`draw ${k} went to an unknown place (${drawTo[k]})`);
      if (drawTo[k] === TO_NONE !== cards[k] < 0) return Mismatch(`draw ${k}: the deal gives ${cards[k]}, but it went to ${drawTo[k]}`);
    }
    const base = [];
    const hand = (code, held, what) => {
      const mine = [];
      drawTo.forEach((to, k) => {
        if (to === code) mine.push(cards[k]);
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
      const seat = hands.seats[i];
      const why2 = hand(HandCode(i, false), seat.normal, `seat ${i + 1}'s hand`) || hand(HandCode(i, true), seat.split, `seat ${i + 1}'s split hand`);
      if (why2) return Mismatch(why2);
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
  var PENDING = -3;
  var DEAL_TIMEOUT = 10;
  var DeckManager = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** [UdonSynced] upstream. Copies of each card type per round, at least 2. */
      __publicField(this, "NumberOfDecks", 2);
      /** Added: the round these draws belong to. */
      __publicField(this, "round", 0);
      /** Added: 1 for the round's first referee; a new referee mid-round starts the next one with a deal of its own. */
      __publicField(this, "segment", 0);
      /**
       * Added: the label of this segment's dealt draw (Secrets.beginDeal): the referee committed to a seed, every seated
       * player's runtime added a committed contribution, and the cards come from all of them, so the referee cannot grind
       * seeds and no player can steer a card.
       */
      __publicField(this, "dealLabel", "");
      /** Added: the referee has published its seed (revealDeal), at the end of the round. */
      __publicField(this, "dealRevealed", false);
      /** Added: every card this segment drew, in order (HIDDEN for the hole card while face down, NO_CARD for none). */
      __publicField(this, "drawLog", []);
      /** Added: where each draw of drawLog went (HandCode, TO_DEALER, TO_HOLE, TO_NONE); a split moves its card's entry. */
      __publicField(this, "drawTo", []);
      /** Added: the cards already on the table when this segment began. */
      __publicField(this, "baseCards", []);
      /** Added: NumberOfDecks when this segment began (the count may change after the round, before a late check). */
      __publicField(this, "segmentDecks", 2);
      /** Added: segments of this round whose seed was lost with their referee (they cannot be checked). */
      __publicField(this, "lostSegments", 0);
      /** Added: deals begun again without contributions because a seated player's runtime never answered. */
      __publicField(this, "unfairDeals", 0);
      // From bindings.json.
      __publicField(this, "BlackjackController");
      /** This client's check of the last revealed deal: null before one was revealed and checked. */
      __publicField(this, "verified", null);
      /** Upstream's per-client counts, kept for the deck-count display and tests. Derived, never synced. */
      __publicField(this, "NumOfEachCardLeft", InitializeCounts(2));
      __publicField(this, "secret", null);
      __publicField(this, "checked", "");
      /**
       * Who this client saw seated in the round when it first saw each deal's label (the label and the seats arrive in
       * one write). Nobody can take a seat during a round, so the seated players only shrink after that.
       */
      __publicField(this, "seatedAt", /* @__PURE__ */ new Map());
    }
    OnDeserialization(result) {
      this.NoteSeated();
      this.CheckReveal();
      this.BlackjackController?.Redraw(result.isSnapshot);
    }
    Update() {
      this.NoteSeated();
      if (this.dealRevealed && this.checked !== this.dealLabel) this.CheckReveal();
    }
    NoteSeated() {
      if (this.dealLabel !== "" && !this.seatedAt.has(this.dealLabel) && this.BlackjackController) {
        this.seatedAt.set(this.dealLabel, this.BlackjackController.RoundSids());
      }
    }
    /** Upstream InitializeDeck: the counts as a client sees them (the hole card is not counted until it is face up). */
    InitializeDeck() {
      this.NumOfEachCardLeft = InitializeCounts(this.NumberOfDecks);
      for (const c of this.baseCards) if (c >= 0) this.NumOfEachCardLeft[c]--;
      for (const c of this.drawLog) if (c >= 0) this.NumOfEachCardLeft[c]--;
    }
    // ---- buttons (table owner, between rounds, when settings may change) ---------------------------------------
    AddDeck() {
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
    SubtractDeck() {
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
    StartRound() {
      this.round++;
      this.Forget();
    }
    /** Referee: clears everything (a table reset). */
    Clear() {
      this.Forget();
    }
    Forget() {
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
    HoldsSegment() {
      const s = this.secret;
      return s !== null && s.round === this.round && s.segment === this.segment && s.label === this.dealLabel && this.Networking.IsReferee && this.Secrets.dealState(s.label) !== "none";
    }
    /**
     * Referee: makes sure this client has a deal to draw from. A referee that took over mid-round does not know the
     * old seed (a change of referee voids the deal), so it begins a new segment with a deal of its own, counting from
     * the cards on the table (`onTable`). Returns true when it changed state.
     */
    EnsureSegment(onTable, contributors) {
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
    Begin(contributors) {
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
    Ready() {
      if (!this.HoldsSegment()) return false;
      const s = this.secret;
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
    NextCard(to, faceUp = false) {
      if (!this.HoldsSegment()) return PENDING;
      const secret = this.secret;
      const draw = this.Secrets.dealDraw(secret.label);
      if (!draw) return PENDING;
      const counts = InitializeCounts(this.segmentDecks);
      for (const c of this.baseCards) counts[c]--;
      this.drawLog.forEach((c, k2) => {
        const card2 = c === HIDDEN && secret.hidden && secret.hidden.k === k2 ? secret.hidden.card : c;
        if (card2 >= 0) counts[card2]--;
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
    Moved(from, held, position, to) {
      const mine = [];
      this.drawTo.forEach((code, k2) => {
        if (code === from) mine.push(k2);
      });
      const before = held.length - mine.length;
      if (position < before) return;
      const k = mine[position - before];
      if (k !== void 0) this.drawTo[k] = to;
    }
    /** Referee: the commitment to the face-down card, for the Dealer's state. */
    HiddenHash() {
      return this.HoldsSegment() && this.secret.hidden ? this.secret.hidden.commitment.hash : "";
    }
    /**
     * Referee: turns the hole card face up. Returns the card and the opening of its commitment, or null when this
     * client does not know it (it took over after the deal): then the caller draws a new one.
     */
    RevealHidden() {
      if (!this.HoldsSegment()) return null;
      const hidden = this.secret.hidden;
      if (!hidden) return null;
      this.drawLog[hidden.k] = hidden.card;
      this.secret.hidden = null;
      return { card: hidden.card, opening: hidden.commitment.reveal() };
    }
    /** Referee, at the end of the round: publishes its seed so that everyone can check the draws. */
    RevealSeed() {
      if (this.HoldsSegment()) {
        this.Secrets.revealDeal(this.dealLabel);
        this.dealRevealed = true;
      } else if (this.dealLabel !== "") this.lostSegments++;
      this.CheckReveal();
    }
    /** Every client: once the referee's seed is out, recomputes the deal from what it saw and replays the segment. */
    CheckReveal() {
      if (!this.dealRevealed || this.dealLabel === "" || this.checked === this.dealLabel) return;
      const state = this.Secrets.dealState(this.dealLabel);
      if (state !== "revealed" && state !== "invalid") return;
      const verified = this.Verify();
      if (!verified) return;
      this.checked = this.dealLabel;
      this.verified = verified;
      if (this.verified.status === "mismatch") this.Debug.LogError(`round ${this.round}: the dealt cards do not match the revealed deal: ${this.verified.reason}`);
      else if (this.verified.status === "unverifiable") this.Debug.LogWarning(`round ${this.round}: the deal cannot be checked: ${this.verified.reason}`);
    }
    /**
     * The line every player sees under the dealer's buttons: the outcome of this client's check after the round, and,
     * during a round, a warning when the deal is the referee's alone.
     */
    CheckText() {
      const ctrl = this.BlackjackController;
      if (!ctrl || this.dealLabel === "") return "";
      if (ctrl.phase === "settled") {
        const v = this.verified;
        if (!v) return this.dealRevealed ? "Checking the deal..." : "Waiting for the dealer's page to reveal the deal";
        if (v.status === "checked") return this.lostSegments > 0 ? "Deal checked (part of it was lost with a dealer who left)" : "Deal checked: every card came from the shared shuffle";
        if (v.status === "unverifiable") {
          if (/only player/.test(v.reason)) return "Deal NOT checkable: the dealer's page was the only player";
          if (/left before/.test(v.reason)) return "Deal NOT checkable here: a contributor left before this page came";
          if (/cannot check/.test(v.reason)) return "Deal NOT checkable here: this page came after the deal was revealed";
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
    ExpectedContributors(label) {
      const present = new Set(this.Networking.GetPlayers().map((p) => p.sid));
      const want = /* @__PURE__ */ new Set([...this.seatedAt.get(label) ?? [], ...this.BlackjackController.RoundSids()]);
      for (const sid of this.Secrets.dealContributors(label) ?? []) if (!present.has(sid)) want.add(sid);
      return [...want];
    }
    /**
     * Checks the revealed deal of the current segment: the contributor list is the seated players (a list of nobody but
     * the referee is its own choice: not checkable), the seed is the committed one, the logged draws are the deal's,
     * and every hand on the table holds exactly the cards the deal gave it. Null while the runtime's check is pending
     * (a contribution has not reached this page yet).
     */
    Verify() {
      if (!this.dealRevealed) return Mismatch("no deal revealed");
      const label = this.dealLabel;
      const listed = this.Secrets.dealContributors(label);
      if (!listed) return Mismatch("the referee's deal record is missing");
      const referee = this.Networking.Master?.sid ?? "";
      if (!listed.some((sid) => sid !== referee)) {
        const others = this.ExpectedContributors(label).filter((sid) => sid !== referee);
        return Unverifiable(
          others.length ? "the dealer's page dealt from its own seed alone (it says a seated player's page never answered)" : "the dealer's page was the only player: nobody else took part in the deal"
        );
      }
      const expected = this.ExpectedContributors(label);
      const want = expected.slice().sort().join(",");
      const got = [...new Set(listed)].sort().join(",");
      if (want !== got) return Mismatch("the deal's contributors are not the players seated in the round");
      return this.Replay(label, expected);
    }
    /**
     * The runtime's check of the deal (`checkDeal`), then the replay. `unknown` and `solo` are "not checkable" here,
     * never a failed check: a contributor who left before this page saw its part took that part with it.
     */
    Replay(label, expected) {
      const check = this.Secrets.checkDeal(label, expected);
      switch (check.state) {
        case "pending":
          return null;
        case "solo":
          return Unverifiable("the dealer's page dealt from its own seed alone");
        case "unknown":
          return Unverifiable(
            /left before/.test(check.why) ? "a player who contributed to this deal left before this page arrived: its part is not known here" : `this page cannot check the deal: ${check.why}`
          );
        case "failed":
          return Mismatch(`the runtime's check of the deal failed: ${check.why}`);
      }
      const draw = check.draw;
      const log = ReplaySegment(draw, this.segmentDecks, this.baseCards, this.drawLog);
      if (!log.ok) return log;
      const ctrl = this.BlackjackController;
      const cards = ReplayCards(draw, this.segmentDecks, this.baseCards, this.drawLog.length);
      return CheckHands(cards, this.drawTo, this.baseCards, {
        seats: ctrl.Players.map((p) => ({ normal: p.NormalDeck.cards, split: p.SplitDeck.cards })),
        dealer: ctrl.Dealer.cards
      });
    }
  };
  /** The referee halves of the deck-count buttons. */
  __publicField(DeckManager, "networkCallable", ["AddDeck", "SubtractDeck"]);
  __publicField(DeckManager, "synced", ["NumberOfDecks", "round", "segment", "dealLabel", "dealRevealed", "drawLog", "drawTo", "baseCards", "segmentDecks", "lostSegments", "unfairDeals"]);

  // src/PlayerDeck.ts
  function NewHand() {
    return { localDeckValue: 0, NumOfAces: 0, IsBust: false };
  }
  function AddCardValue(hand, value) {
    if (value !== 11) hand.localDeckValue += value;
    else if (hand.localDeckValue >= 11) hand.localDeckValue += 1;
    else {
      hand.localDeckValue += 11;
      hand.NumOfAces++;
    }
    if (hand.localDeckValue > 21 && hand.NumOfAces > 0) {
      hand.localDeckValue -= 10;
      hand.NumOfAces--;
    } else if (hand.localDeckValue > 21) {
      hand.IsBust = true;
      return true;
    }
    return false;
  }
  function ScoreValues(values) {
    const hand = NewHand();
    for (const v of values) AddCardValue(hand, v);
    return hand;
  }
  function ScoreCards(cards) {
    return ScoreValues(cards.filter((c) => c >= 0).map(CardValue));
  }
  var SLOT_OFF = -3;
  var MAX_CARDS = 11;
  var PlayerDeck = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Added: the card types in this hand, in deal order (upstream: card objects under the 11 positions). */
      __publicField(this, "cards", []);
      /** [UdonSynced] upstream. */
      __publicField(this, "TotalDeckValue", 0);
      __publicField(this, "IsBust", false);
      __publicField(this, "NumOfAces", 0);
      // From bindings.json.
      __publicField(this, "PlayerController");
      __publicField(this, "isSplitDeck", false);
      /** The 11 card slots of this hand (upstream: DeckPositions with an instantiated card prefab under each). */
      __publicField(this, "Slots", []);
      __publicField(this, "SlotRenderers", []);
      __publicField(this, "SlotAnimators", []);
      /** The hand's total on the dealer's per-seat panel. */
      __publicField(this, "DealerValueDisplay", null);
      /** What each slot shows on this client (-3: off). */
      __publicField(this, "shown", []);
    }
    /** Upstream's name for the total, kept for translated code that reads it. */
    get localDeckValue() {
      return this.TotalDeckValue;
    }
    /** Upstream's NextDeckPosition: where the next card goes. */
    get NextDeckPosition() {
      return this.cards.length;
    }
    /** The card value at each position (upstream DeckValue[]). */
    get DeckValue() {
      return this.cards.map(CardValue);
    }
    OnDeserialization(result) {
      this.PlayerController?.BlackjackController?.Redraw(result.isSnapshot);
    }
    /**
     * Every client: SpawnCard's visible part (PlayerDeck.cs:71-115) for the whole hand. A slot that changes is
     * switched on, given its face (the kit's card material reads `_CardIndex`) and its zoom-in; the hand's total goes
     * on the dealer's panel. Sounds are the seat's business (one per new card, Q17).
     */
    Show(_instant) {
      for (let k = 0; k < MAX_CARDS; k++) {
        const card = k < this.cards.length ? this.cards[k] : SLOT_OFF;
        if (this.shown[k] === card) continue;
        this.shown[k] = card;
        const slot = this.Slots[k] ?? null;
        if (card === SLOT_OFF) {
          slot?.SetActive(false);
          continue;
        }
        slot?.SetActive(true);
        this.SlotRenderers[k]?.SetFloat("_CardIndex", card);
        this.SlotAnimators[k]?.SetTrigger("NotHidden");
      }
      if (this.DealerValueDisplay) this.DealerValueDisplay.text = String(this.TotalDeckValue);
    }
    /** What slot k shows on this client: a card type, or SLOT_OFF. For tests. */
    Showing(k) {
      return this.shown[k] ?? SLOT_OFF;
    }
    /**
     * Referee: SpawnCard plus AddCardValue for a card the referee drew. Returns true when it made the hand bust.
     * The total is the whole hand scored again, so it cannot go stale (see Q4 in PORT.md).
     */
    AddCard(card) {
      const wasBust = this.IsBust;
      this.cards.push(card);
      this.Recount();
      return this.IsBust && !wasBust;
    }
    /** Referee: the hand's total, aces and bust flag from its cards. */
    Recount() {
      const hand = ScoreCards(this.cards);
      this.TotalDeckValue = hand.localDeckValue;
      this.NumOfAces = hand.NumOfAces;
      this.IsBust = hand.IsBust;
    }
    /** Referee: PlayerDeck.Reset (PlayerDeck.cs:896-933) without the card objects, which the drawing follows. */
    Reset() {
      this.cards = [];
      this.TotalDeckValue = 0;
      this.NumOfAces = 0;
      this.IsBust = false;
    }
  };
  __publicField(PlayerDeck, "synced", ["cards", "TotalDeckValue", "IsBust", "NumOfAces"]);

  // src/Dealer.ts
  function DealerShouldDraw(total, isBust) {
    return !isBust && total < 17;
  }
  var Dealer = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Added: card types by position; position 0 is the hole card, HIDDEN until the flip. */
      __publicField(this, "cards", []);
      /** [UdonSynced] upstream. Face-up cards only until the flip. */
      __publicField(this, "TotalDeckValue", 0);
      __publicField(this, "IsBust", false);
      /** Added: the hole card has been turned. */
      __publicField(this, "flipped", false);
      /** Added: commitment to the hole card, published when it is dealt. */
      __publicField(this, "holeHash", "");
      /** Added: its opening, published at the flip. */
      __publicField(this, "holeOpening", null);
      /** Added: the referee changed before the flip and the hole card was drawn anew. */
      __publicField(this, "holeRedrawn", false);
      // From bindings.json.
      __publicField(this, "GameController");
      __publicField(this, "Deck");
      __publicField(this, "DealerUI");
      /** This client's check of the hole card against its commitment (null before the flip). */
      __publicField(this, "holeVerified", null);
    }
    /** Upstream GetDeckValue: the total this client knows. */
    GetDeckValue() {
      return this.TotalDeckValue;
    }
    get NextDeckPosition() {
      return this.cards.length;
    }
    OnDeserialization(result) {
      this.CheckHole();
      this.GameController?.Redraw(result.isSnapshot);
    }
    /** Every client: at the flip, the card shown must be the one committed to at the deal. */
    CheckHole() {
      if (!this.flipped || !this.holeOpening || this.holeVerified !== null) return;
      const ok = this.Secrets.verify(this.holeHash, this.holeOpening) && this.Secrets.valueOf(this.holeOpening) === this.cards[0];
      this.holeVerified = ok;
      if (!ok) this.Debug.LogError("the dealer's hole card does not match its commitment");
    }
    /** Referee: StartMatch and StartMatchSecondCard. The first card is the hole card. */
    SummonCard(_onTable) {
      if (this.NextDeckPosition > MAX_CARDS - 1) return;
      const hole = this.cards.length === 0;
      const card = this.Deck.NextCard(hole ? TO_HOLE : TO_DEALER);
      if (card < 0) return;
      if (hole) {
        this.cards.push(HIDDEN);
        this.holeHash = this.Deck.HiddenHash();
      } else this.cards.push(card);
      this.Recount();
    }
    /** Referee: GlobalFlip. Turns the hole card, or draws it anew if this referee never knew it. */
    Flip(_onTable) {
      if (this.flipped) return;
      this.flipped = true;
      if (this.cards.length === 0 || this.cards[0] !== HIDDEN) {
        this.Recount();
        return;
      }
      const known = this.Deck.RevealHidden();
      if (known) {
        this.cards[0] = known.card;
        this.holeOpening = known.opening;
      } else {
        const card = this.Deck.NextCard(TO_HOLE, true);
        if (card < 0) {
          this.cards.splice(0, 1);
        } else {
          const commitment = this.Secrets.commit(card);
          this.cards[0] = card;
          this.holeHash = commitment.hash;
          this.holeOpening = commitment.reveal();
          this.holeRedrawn = true;
        }
      }
      this.Recount();
      this.holeVerified = null;
      this.CheckHole();
    }
    /** Referee: the total of what is face up (everything after the flip). */
    Recount() {
      const hand = ScoreCards(this.cards);
      this.TotalDeckValue = hand.localDeckValue;
      this.IsBust = hand.IsBust;
    }
    /** Referee: ResetEverything (Dealer.cs:939-977), without the card objects. */
    ResetEverything() {
      this.cards = [];
      this.TotalDeckValue = 0;
      this.IsBust = false;
      this.flipped = false;
      this.holeHash = "";
      this.holeOpening = null;
      this.holeRedrawn = false;
      this.holeVerified = null;
    }
  };
  __publicField(Dealer, "synced", ["cards", "TotalDeckValue", "IsBust", "flipped", "holeHash", "holeOpening", "holeRedrawn"]);

  // src/Player.ts
  var RESULT_NONE = 0;
  var RESULT_WIN = 1;
  var RESULT_DRAW = 2;
  var RESULT_LOSE = 3;
  var ENDED_NONE = 0;
  var ENDED_STAND = 1;
  var ENDED_BUST = 2;
  var ENDED_TIMEOUT = 3;
  var ENDED_LEFT = 4;
  function SettleHand(value, dealerValue) {
    if (value > 21) return RESULT_LOSE;
    if (value > dealerValue || dealerValue > 21) return RESULT_WIN;
    if (value === dealerValue) return RESULT_DRAW;
    return RESULT_LOSE;
  }
  function ChipChange(result, bet) {
    if (result === RESULT_WIN) return bet;
    if (result === RESULT_LOSE) return -bet;
    return 0;
  }
  var Player2 = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** [UdonSynced] upstream: the seat is taken. */
      __publicField(this, "IsActive", false);
      /** [UdonSynced] upstream. */
      __publicField(this, "HasFinishedTurn", true);
      /** [UdonSynced] upstream: the holder's player id. */
      __publicField(this, "currentOwnerID", 0);
      /** Added: the holder's session; presses for this seat are taken from it alone. */
      __publicField(this, "ownerSid", "");
      /** Added: the holder's name, for late joiners. */
      __publicField(this, "ownerName", "");
      /** Added: the seat was dealt into the current round (upstream's ActivePlayers). */
      __publicField(this, "inRound", false);
      /** Upstream local, synced here (Q21: it follows the hand). The holder's client adds the chip check. */
      __publicField(this, "CanSplit", false);
      /** Upstream local to the splitter, synced here (Q7). */
      __publicField(this, "HasSplit", false);
      /** Added: shared-clock second of the split; each hand gets its card 1 s later, and no hits before that. */
      __publicField(this, "splitAt", 0);
      __publicField(this, "splitDealt", false);
      /** Added: "wants to hit" marks for the dealer in manual play (upstream: animator bools set by events). */
      __publicField(this, "wantNormal", false);
      __publicField(this, "wantSplit", false);
      /** Added: why the turn ended (stand, bust, timeout, left), so every client shows it (Q8). */
      __publicField(this, "endedBy", ENDED_NONE);
      /** Added: SetWinState's verdict per hand (normal, split), written by the referee at the end of the round. */
      __publicField(this, "result", [RESULT_NONE, RESULT_NONE]);
      // From bindings.json.
      __publicField(this, "BlackjackController");
      __publicField(this, "PlayerNum", 0);
      __publicField(this, "NormalDeck");
      __publicField(this, "SplitDeck");
      __publicField(this, "Deck");
      __publicField(this, "PlayerUI");
      __publicField(this, "Interactables", null);
      __publicField(this, "PlayerName", null);
      __publicField(this, "BetPanel", null);
      __publicField(this, "ChipAnimator", null);
      __publicField(this, "CurrentBet", null);
      __publicField(this, "TotalChips", null);
      __publicField(this, "Timer", null);
      // Local, as upstream.
      /** The local player holds this seat (upstream: Networking.IsOwner(gameObject) && ImInThis). */
      __publicField(this, "isOwner", false);
      __publicField(this, "myTurn", false);
      __publicField(this, "Running", true);
      __publicField(this, "TotalBet", 0);
      __publicField(this, "CanBet", true);
      __publicField(this, "justReleasedControl", false);
      /** The bet each hand of this seat plays for this round (taken when the round starts). */
      __publicField(this, "roundBet", 0);
      __publicField(this, "paidRound", 0);
      __publicField(this, "seenRound", -1);
      __publicField(this, "seenSplit", false);
      // The referee's own debounces (upstream: JustHitNormal, JustHitSplit, justReleasedControl on the presser's client).
      __publicField(this, "lastHitNormalAt", -Infinity);
      __publicField(this, "lastHitSplitAt", -Infinity);
      __publicField(this, "releasedAt", /* @__PURE__ */ new Map());
    }
    get isRunningProperty() {
      return this.Running;
    }
    set isRunningProperty(value) {
      this.Running = value;
      this.PlayerUI.Running = value;
    }
    OnDeserialization(result) {
      this.BlackjackController?.Redraw(result.isSnapshot);
    }
    Update() {
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
        const left = this.myTurn ? Math.max(0, ctrl.deadline - ctrl.Now()) : ctrl.turnSeconds;
        if (this.Timer) this.Timer.text = String(Mathf.RoundToInt(left));
      }
    }
    // ---- what every client draws from state ---------------------------------------------------------------------
    /** Called by Controller.Redraw on every client after state changed. `instant`: the state as found on arrival. */
    Apply(instant) {
      const ctrl = this.BlackjackController;
      const me = ctrl.LocalSid();
      this.isOwner = this.IsActive && this.ownerSid === me;
      this.myTurn = this.isOwner && ctrl.phase === "turns" && this.inRound && !this.HasFinishedTurn;
      const bank = ctrl.ChipController;
      if (ctrl.round !== this.seenRound) {
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
        if (!instant && this.isOwner) {
          if (ctrl.UsingChips) bank.AddToBet(this.roundBet);
          ctrl.AudioController.PlaySplitDeck();
        }
      }
      if (!this.HasSplit) this.seenSplit = false;
      if (ctrl.phase === "settled" && this.paidRound !== ctrl.round) {
        this.paidRound = ctrl.round;
        this.CanBet = true;
        if (!instant && this.isOwner && this.IsActive && this.result[0] !== RESULT_NONE) {
          const r = this.result[0];
          if (r === RESULT_WIN) ctrl.AudioController.PlayWinMatch();
          else if (r === RESULT_LOSE) ctrl.AudioController.PlayLoseMatch();
          else ctrl.AudioController.PlayDrawMatch();
          if (ctrl.UsingChips) {
            let change = ChipChange(r, this.roundBet);
            if (this.HasSplit) change += ChipChange(this.result[1], this.roundBet);
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
    Caller() {
      return this.Networking.IsReferee ? this.Networking.CallingSession : null;
    }
    /** "Join Game" (Player.cs:172-189), the presser's half. */
    _TakeControl() {
      if (this.BlackjackController.localGameActive || this.justReleasedControl) return;
      this.BlackjackController.AudioController.PlayTakeControl();
      this.SendCommand("TakeControl");
    }
    /** The referee's half of _TakeControl. */
    TakeControl() {
      const caller = this.Caller();
      const who = this.Networking.CallingPlayer;
      const ctrl = this.BlackjackController;
      if (!caller || !who || ctrl.GameActive || this.IsActive) return;
      const released = this.releasedAt.get(caller.sid);
      if (released !== void 0 && ctrl.Now() - released < 2) return;
      this.IsActive = true;
      this.ownerSid = caller.sid;
      this.ownerName = who.displayName;
      this.currentOwnerID = who.playerId;
      this.HasFinishedTurn = true;
      this.inRound = false;
      ctrl.Changed();
    }
    /** "LEAVE GAME" (Player.cs:191-204); also sent when the player walks out of range or the table leaves the page. */
    ReleaseControl() {
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
    ResetJustReleasedControl() {
      this.justReleasedControl = false;
    }
    /** Referee: GlobalReleaseControl (Player.cs:211-235): stands a hand that is mid-turn, then frees the seat. */
    GlobalReleaseControl(reason) {
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
    _AutoNormalHitMe() {
      this.SendCommand("AutoNormalHitMe");
    }
    AutoNormalHitMe() {
      const caller = this.Caller();
      if (!caller || !this.IsActive || caller.sid !== this.ownerSid) return;
      if (this.BlackjackController.ManualPlay) this.MarkNormalHit();
      else this.HitMeNormal();
      this.BlackjackController.Changed();
    }
    /** The holder's HIT for the split hand (Player.cs:293-303), the presser's half. */
    _AutoSplitHitMe() {
      this.SendCommand("AutoSplitHitMe");
    }
    AutoSplitHitMe() {
      const caller = this.Caller();
      if (!caller || !this.IsActive || caller.sid !== this.ownerSid || !this.HasSplit) return;
      if (this.BlackjackController.ManualPlay) this.MarkSplitHit();
      else this.HitMeSplit();
      this.BlackjackController.Changed();
    }
    /** The dealer's "Hit Me" for this seat's first hand (manual play; Player.cs:269-273), the presser's half. */
    _ManualNormalHitMe() {
      this.SendCommand("ManualNormalHitMe");
    }
    ManualNormalHitMe() {
      const caller = this.Caller();
      if (!caller || !this.BlackjackController.IsTableOwner(caller.sid)) return;
      this.wantNormal = false;
      this.HitMeNormal();
      this.BlackjackController.Changed();
    }
    _ManualSplitHitMe() {
      this.SendCommand("ManualSplitHitMe");
    }
    ManualSplitHitMe() {
      const caller = this.Caller();
      if (!caller || !this.BlackjackController.IsTableOwner(caller.sid)) return;
      this.wantSplit = false;
      this.HitMeSplit();
      this.BlackjackController.Changed();
    }
    /** The holder's STAND, or the dealer's "Stand" for this seat in manual play (Player.cs:394-401). */
    Stand() {
      if (!this.Networking.CallingSession) {
        this.BlackjackController.AudioController.PlayStand();
        this.SendCommand("Stand");
        return;
      }
      const caller = this.Caller();
      const ctrl = this.BlackjackController;
      if (!caller || !this.IsActive || caller.sid !== this.ownerSid && !ctrl.IsTableOwner(caller.sid)) return;
      if (!this.InTurn()) return;
      this.EndTurn(ENDED_STAND);
      ctrl.Changed();
    }
    /** SPLIT (Player.cs:353-378). */
    Split() {
      if (!this.Networking.CallingSession) {
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
      this.Deck.Moved(HandCode(this.PlayerNum, false), this.NormalDeck.cards, 1, HandCode(this.PlayerNum, true));
      const second = this.NormalDeck.cards.splice(1, 1)[0];
      this.NormalDeck.Recount();
      this.SplitDeck.Reset();
      this.SplitDeck.AddCard(second);
      this.splitAt = this.BlackjackController.Now();
      this.splitDealt = false;
      this.BlackjackController.Changed();
    }
    /** The holder's client: with chips on, the split's doubled bet must fit (upstream: TotalBet * 2 <= chips). */
    SplitAffordable() {
      const ctrl = this.BlackjackController;
      if (!ctrl.UsingChips) return true;
      return ctrl.ChipController.CanAddToBet(this.roundBet);
    }
    // ---- chip buttons (local only, as upstream) -----------------------------------------------------------------
    _Add5ToBet() {
      this.ChangeBet(5);
    }
    _Add10ToBet() {
      this.ChangeBet(10);
    }
    _Remove5FromBet() {
      this.ChangeBet(-5);
    }
    _Remove10FromBet() {
      this.ChangeBet(-10);
    }
    ChangeBet(amount) {
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
    InTurn() {
      return this.IsActive && this.inRound && !this.HasFinishedTurn && this.BlackjackController.phase === "turns";
    }
    IsSplitting(now) {
      return this.HasSplit && !this.splitDealt && now < this.splitAt + 1;
    }
    /** Q9: a bust hand, a full hand, or a finished turn takes no card. */
    CanTakeCard(deck) {
      return this.InTurn() && !deck.IsBust && deck.NextDeckPosition <= MAX_CARDS - 1;
    }
    MarkNormalHit() {
      if (!this.InTurn()) return;
      this.wantNormal = true;
    }
    MarkSplitHit() {
      if (!this.InTurn() || !this.HasSplit) return;
      this.wantSplit = true;
    }
    /** Referee: HitMeNormal (Player.cs:317-328): one card, at most one per hand per second, none while splitting. */
    HitMeNormal() {
      this.wantNormal = false;
      const now = this.BlackjackController.Now();
      if (now - this.lastHitNormalAt < 1 || this.IsSplitting(now) || !this.CanTakeCard(this.NormalDeck)) return;
      this.lastHitNormalAt = now;
      this.DealTo(this.NormalDeck);
    }
    HitMeSplit() {
      this.wantSplit = false;
      const now = this.BlackjackController.Now();
      if (!this.HasSplit || now - this.lastHitSplitAt < 1 || this.IsSplitting(now) || !this.CanTakeCard(this.SplitDeck)) return;
      this.lastHitSplitAt = now;
      this.DealTo(this.SplitDeck);
    }
    /** Referee: SummonCard on one of this seat's hands (PlayerDeck.cs:55-69), then the bust and split checks. */
    DealTo(deck) {
      if (deck.NextDeckPosition > MAX_CARDS - 1) return;
      const card = this.BlackjackController.DrawCard(HandCode(this.PlayerNum, deck === this.SplitDeck));
      if (card === PENDING) {
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
    CheckIfCanSplit() {
      const values = this.NormalDeck.DeckValue;
      this.CanSplit = !this.HasSplit && !this.HasFinishedTurn && values.length === 2 && values[0] === values[1];
    }
    /** Referee: CheckBust (Player.cs:412-428): the turn ends when the only hand, or both after a split, are bust. */
    CheckBust() {
      const done = this.HasSplit ? this.NormalDeck.IsBust && this.SplitDeck.IsBust : this.NormalDeck.IsBust;
      if (done) this.EndTurn(ENDED_BUST);
    }
    /** Referee: EndTurn (Player.cs:255-267). */
    EndTurn(reason) {
      if (this.HasFinishedTurn) return;
      this.HasFinishedTurn = true;
      this.endedBy = reason;
      this.CanSplit = false;
      this.wantNormal = false;
      this.wantSplit = false;
    }
    /** Referee: the split hands' cards, 1 s after the split (Player.cs:373-374), split hand first. */
    DealSplitCards(now) {
      if (!this.HasSplit || this.splitDealt || now < this.splitAt + 1) return false;
      this.splitDealt = true;
      if (!this.HasFinishedTurn) {
        this.DealTo(this.SplitDeck);
        this.DealTo(this.NormalDeck);
      }
      return true;
    }
    /** Referee: ResetPlayer (Player.cs:430-448), at the start of a round. */
    ResetPlayer() {
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
    ForceResetPlayer() {
      this.ResetPlayer();
      this.GlobalReleaseControl(ENDED_NONE);
      this.inRound = false;
      this.endedBy = ENDED_NONE;
    }
    /** Referee: SetWinState's verdicts (Player.cs:468-576). A seat freed during the round is not settled (F61). */
    SetWinState(dealerValue) {
      if (!this.IsActive || !this.inRound) {
        this.result = [RESULT_NONE, RESULT_NONE];
        return;
      }
      this.result = [SettleHand(this.NormalDeck.TotalDeckValue, dealerValue), this.HasSplit ? SettleHand(this.SplitDeck.TotalDeckValue, dealerValue) : RESULT_NONE];
    }
    /** The table's bet resets on every client after a round that settled any seat (Player.cs:575, 599-602). */
    get roundBetForTests() {
      return this.roundBet;
    }
  };
  /** The referee halves of the seat's buttons: the only names a command (or network event) may run here. */
  __publicField(Player2, "networkCallable", [
    "TakeControl",
    "ReleaseControl",
    "AutoNormalHitMe",
    "AutoSplitHitMe",
    "ManualNormalHitMe",
    "ManualSplitHitMe",
    "Stand",
    "Split"
  ]);
  __publicField(Player2, "synced", [
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
    "result"
  ]);

  // src/Controller.ts
  function DealSchedule(n) {
    const steps = [];
    for (let i = 0; i < n; i++) {
      steps.push({ at: (i + 1) / 2, kind: "player1", i });
      steps.push({ at: (i + 2 + n) / 2, kind: "player2", i });
    }
    steps.push({ at: (n + 1) / 2, kind: "dealer1", i: -1 });
    steps.push({ at: n + 1, kind: "dealer2", i: -1 });
    steps.push({ at: n + 2, kind: "turns", i: -1 });
    return steps.sort((a, b) => a.at - b.at);
  }
  var START_DELAY = 0.25;
  var POLL_SECONDS = 2;
  var Controller = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** [UdonSynced] upstream. */
      __publicField(this, "UsingChips", false);
      /** [UdonSynced] upstream: a round is running (upstream never sent it at round start, F78; here it is). */
      __publicField(this, "GameActive", false);
      __publicField(this, "ManualPlay", false);
      __publicField(this, "HelpersEnabled", false);
      /** Upstream a local field set by the inspector; synced here so every client shows the same buttons. */
      __publicField(this, "CanChangeSettings", false);
      /** Added: the snippet's settings have been applied to this table's state. */
      __publicField(this, "configured", false);
      /** Added: the table owner (upstream: the owner of the Game Controller object). */
      __publicField(this, "tableOwnerSid", "");
      __publicField(this, "tableOwnerName", "");
      __publicField(this, "phase", "idle");
      __publicField(this, "round", 0);
      /** Added: shared-clock second the round's deal began. */
      __publicField(this, "t0", 0);
      /** Added: schedule steps done (the deal), so a new referee does none twice. */
      __publicField(this, "step", 0);
      /** Added: seat numbers in the round, in seat order (upstream ActivePlayers). */
      __publicField(this, "roster", []);
      /** Added: the turn timer's length (upstream TimeLeft = 30). */
      __publicField(this, "turnSeconds", 30);
      /** Added: when unfinished turns end (shared clock). */
      __publicField(this, "deadline", 0);
      /** Added: the next GameActiveRefresh. */
      __publicField(this, "nextCheckAt", 0);
      /** Added: the next DealerPlay step. */
      __publicField(this, "dealerNext", 0);
      /** Added: table resets so far: every client sets its bet at this table to 0 when it changes. */
      __publicField(this, "resets", 0);
      // From bindings.json.
      __publicField(this, "ChipController");
      __publicField(this, "AudioController");
      __publicField(this, "Dealer");
      __publicField(this, "Players", []);
      __publicField(this, "Deck");
      __publicField(this, "DealerUI");
      __publicField(this, "Distance", null);
      __publicField(this, "started", false);
      /** Referee: cards asked for while the deal was not ready (a hit just after a change of referee). */
      __publicField(this, "deferred", []);
      __publicField(this, "seen", { round: -1, phase: "", resets: -1 });
      __publicField(this, "lastResetAt", -Infinity);
      /** Where the dealer-side panels sit (the slider of DealerUIController, as two buttons: C12). Local, as upstream. */
      __publicField(this, "panelHeight", 0.5);
    }
    /** Upstream's local copy of GameActive (localGameActive). */
    get localGameActive() {
      return this.GameActive;
    }
    Start() {
      this.Players.forEach((player, i) => player.PlayerNum = i);
    }
    OnInstanceStart(_kind) {
      this.started = true;
      if (this.Networking.IsReferee) this.Reconcile();
      this.Redraw(true);
    }
    OnDeserialization(result) {
      this.Redraw(result.isSnapshot);
    }
    Update() {
      if (!this.started || !this.Networking.IsReferee) return;
      if (this.Time.frameCount % 20 === 0) this.Reconcile();
      this.Advance();
    }
    OnPlayerLeft(player) {
      if (!this.Networking.IsReferee) return;
      this.Forget(player.sid);
    }
    OnMasterTransferred(_newMaster) {
      if (this.Networking.IsReferee) this.Reconcile();
    }
    // ---- helpers for the other behaviours ----------------------------------------------------------------------
    Now() {
      return this.Networking.GetServerTimeInSeconds();
    }
    LocalSid() {
      return this.Networking.LocalPlayer.sid;
    }
    IsTableOwner(sid) {
      return sid !== "" && sid === this.tableOwnerSid;
    }
    /** Settings that upstream shows only to the table owner between rounds. */
    MaySetUp(sid) {
      return this.IsTableOwner(sid) && !this.GameActive;
    }
    /** Helpers, chips and deck count also need "allow change" (upstream CanChangeSettings). */
    MayChangeSettings(sid) {
      return this.MaySetUp(sid) && this.CanChangeSettings;
    }
    /** Referee: sends the table's state and redraws it here (the referee's own writes are not echoed back to it). */
    Changed() {
      this.RequestSerialization();
      this.Redraw(false);
    }
    /** Every card on the table that anyone can see. */
    OnTable() {
      const out = [];
      for (const p of this.Players) out.push(...p.NormalDeck.cards, ...p.SplitDeck.cards);
      out.push(...this.Dealer.cards);
      return out.filter((c) => c >= 0);
    }
    /** Referee: one card from the round's deal for hand `to` (-1 when none is left, PENDING while the deal is not ready). */
    DrawCard(to) {
      return this.Deck.NextCard(to);
    }
    /** The sessions of the seats in the round: they contribute to the deal (Secrets.beginDeal). */
    RoundSids() {
      const out = [];
      for (const i of this.roster) {
        const p = this.Players[i];
        if (p && p.IsActive && p.inRound && p.ownerSid && !out.includes(p.ownerSid)) out.push(p.ownerSid);
      }
      return out;
    }
    /** Referee: a card that could not be dealt yet (the deal was not ready), dealt by Advance once it is. */
    Defer(deal) {
      this.deferred.push(deal);
    }
    /** Referee: the snippet's attributes become the table's first state (PORT.md 8.1). */
    Configure(settings) {
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
    Redraw(instant) {
      if (!this.started) return;
      const seen = this.seen;
      const fresh = seen.round === -1;
      const quiet = instant || fresh;
      if (!quiet) {
        if (this.round !== seen.round && this.GameActive) this.AudioController.PlayStartMatch();
        if (this.phase === "turns" && seen.phase !== "turns" && this.round === seen.round) this.AudioController.PlayStartActivePlay();
        if (this.resets !== seen.resets) this.ChipController.ResetBet();
      }
      for (const player of this.Players) player.Apply(quiet);
      this.Dealer.Deck.InitializeDeck();
      this.DealerUI.Apply(quiet);
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
    Caller() {
      return this.Networking.IsReferee ? this.Networking.CallingSession : null;
    }
    /** "Take Control of Table" (Controller.cs:40-45), the presser's half. */
    _TakeOwnership() {
      this.AudioController.PlayUIInteract();
      this.SendCommand("TakeOwnership");
    }
    TakeOwnership() {
      const caller = this.Caller();
      const who = this.Networking.CallingPlayer;
      if (!caller || !who || this.GameActive || this.IsTableOwner(caller.sid)) return;
      this.tableOwnerSid = caller.sid;
      this.tableOwnerName = who.displayName;
      this.ResetTable();
      this.Changed();
    }
    _ToggleManualPlay() {
      this.AudioController.PlayUIInteract();
      this.SendCommand("ToggleManualPlay");
    }
    ToggleManualPlay() {
      const caller = this.Caller();
      if (!caller || !this.MaySetUp(caller.sid)) return;
      this.ManualPlay = !this.ManualPlay;
      this.Changed();
    }
    _ActivateHelpers() {
      this.Press("ActivateHelpers");
    }
    ActivateHelpers() {
      this.SetSetting(() => this.HelpersEnabled = true);
    }
    _DeactivateHelpers() {
      this.Press("DeactivateHelpers");
    }
    DeactivateHelpers() {
      this.SetSetting(() => this.HelpersEnabled = false);
    }
    _ActivateChips() {
      this.Press("ActivateChips");
    }
    ActivateChips() {
      this.SetSetting(() => this.UsingChips = this.ChipController.UseChipSystem);
    }
    _DeactivateChips() {
      this.Press("DeactivateChips");
    }
    DeactivateChips() {
      this.SetSetting(() => this.UsingChips = false);
    }
    Press(command) {
      this.AudioController.PlayUIInteract();
      this.SendCommand(command);
    }
    SetSetting(change) {
      const caller = this.Caller();
      if (!caller || !this.MayChangeSettings(caller.sid)) return;
      change();
      this.Changed();
    }
    /** "Start Game" (Controller.cs:91-109, then ResetDelayStart and StartMatch). Table owner only. */
    GlobalStartMatch() {
      if (!this.Networking.CallingSession) {
        this.SendCommand("GlobalStartMatch");
        return;
      }
      const caller = this.Caller();
      if (!caller || !this.IsTableOwner(caller.sid) || this.GameActive) return;
      if (!this.Players.some((p) => p.IsActive)) return;
      this.Dealer.ResetEverything();
      for (const player of this.Players) player.ResetPlayer();
      this.roster = [];
      this.Players.forEach((p, i) => {
        if (p.IsActive) this.roster.push(i);
      });
      this.deferred = [];
      this.Deck.StartRound();
      this.Deck.EnsureSegment(this.OnTable(), this.RoundSids());
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
    ForceGlobalReset() {
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
    ResetChips() {
      this.AudioController.PlayUIInteract();
      this.ChipController.ResetChips();
    }
    /** The dealer-height slider as two buttons (C12); local to the table owner's client, as upstream. */
    RaiseDealerPanels() {
      this.panelHeight = Math.min(0.99, this.panelHeight + 0.1);
      this.DealerUI.SetHeight(this.panelHeight);
    }
    LowerDealerPanels() {
      this.panelHeight = Math.max(0, this.panelHeight - 0.1);
      this.DealerUI.SetHeight(this.panelHeight);
    }
    // ---- the referee's work --------------------------------------------------------------------------------------
    /** Referee: ResetTable (Controller.cs:257-269). Q12: every seat is freed. The dealer's cards go too. */
    ResetTable() {
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
    Forget(sid) {
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
    TakeTableAsReferee(reset) {
      const me = this.Networking.LocalPlayer;
      this.tableOwnerSid = me.sid;
      this.tableOwnerName = me.displayName;
      if (reset) this.ResetTable();
    }
    /** Referee: frees seats whose holder is gone and replaces a table owner who is gone. */
    Reconcile() {
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
    Advance() {
      const now = this.Now();
      let changed = false;
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
        if (!ready && next && now > this.t0 + next.at) this.t0 = now - next.at;
        while (ready && this.phase === "dealing" && this.step < steps.length && now >= this.t0 + steps[this.step].at) {
          this.RunStep(steps[this.step]);
          this.step++;
          changed = true;
        }
      }
      if (this.phase === "turns") {
        for (const player of this.Players) if (player.DealSplitCards(now)) changed = true;
        if (now >= this.deadline) {
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
    RoundPlayers() {
      return this.roster.map((i) => this.Players[i]).filter((p) => p !== void 0);
    }
    RunStep(step) {
      if (step.kind === "player1" || step.kind === "player2") {
        const player = this.Players[this.roster[step.i]];
        if (player && player.IsActive && player.inRound && !player.HasFinishedTurn) player.DealTo(player.NormalDeck);
      } else if (step.kind === "dealer1" || step.kind === "dealer2") {
        this.Dealer.SummonCard(this.OnTable());
      } else {
        this.phase = "turns";
        const turnsAt = this.t0 + step.at;
        this.deadline = turnsAt + this.turnSeconds;
        this.nextCheckAt = turnsAt;
      }
    }
    /** GameActiveRefresh (Controller.cs:226-247): when every seat in the round has finished, the dealer plays. */
    GameActiveRefresh(now) {
      if (this.RoundPlayers().every((p) => p.HasFinishedTurn)) {
        this.phase = "dealer";
        this.dealerNext = now;
        return;
      }
      while (this.nextCheckAt <= now) this.nextCheckAt += POLL_SECONDS;
    }
    /** DealerPlay (Dealer.cs:61-94), one step: flip; 1 s later draw every 0.5 s while under 17; then finish. */
    DealerPlay() {
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
    FinishMatch() {
      this.GameActive = false;
      this.phase = "settled";
      for (const player of this.Players) player.SetWinState(this.Dealer.TotalDeckValue);
      this.Deck.RevealSeed();
    }
  };
  /** The referee halves of the dealer-side buttons: the only names a command (or network event) may run here. */
  __publicField(Controller, "networkCallable", [
    "TakeOwnership",
    "ToggleManualPlay",
    "ActivateHelpers",
    "DeactivateHelpers",
    "ActivateChips",
    "DeactivateChips",
    "GlobalStartMatch",
    "ForceGlobalReset"
  ]);
  __publicField(Controller, "synced", [
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
    "resets"
  ]);

  // src/CreditsPanel.ts
  var CreditsPanel = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "panel");
      __publicField(this, "open", false);
    }
    Start() {
      this.panel.SetActive(false);
    }
    Interact() {
      this.Toggle();
    }
    Toggle() {
      this.open = !this.open;
      this.panel.SetActive(this.open);
    }
    get IsOpen() {
      return this.open;
    }
  };

  // src/DealerUIController.ts
  var DealerUIController = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "Running", true);
      // From bindings.json.
      __publicField(this, "BlackjackController");
      __publicField(this, "DealerController");
      __publicField(this, "AutoCanvas", null);
      __publicField(this, "AutoCanvasAnimator", null);
      __publicField(this, "OwnerUI", null);
      __publicField(this, "ManualOwnerUI", null);
      __publicField(this, "ManualOwnerSettings", null);
      __publicField(this, "ManualNotOwnerUI", null);
      __publicField(this, "OwnerSlider", null);
      __publicField(this, "UIHeightAnimator", null);
      __publicField(this, "DeckCount", null);
      __publicField(this, "DeckCountManual", null);
      __publicField(this, "NotOwnerUI", null);
      __publicField(this, "TableUIAnimator", null);
      __publicField(this, "ChipToggle", null);
      __publicField(this, "ChipOn", null);
      __publicField(this, "ChipOff", null);
      __publicField(this, "DeckChanger", null);
      __publicField(this, "DeckSubtractArrow", null);
      __publicField(this, "HelpersChanger", null);
      __publicField(this, "HelpersOn", null);
      __publicField(this, "HelpersOff", null);
      __publicField(this, "ChipToggleManual", null);
      __publicField(this, "ChipOnManual", null);
      __publicField(this, "ChipOffManual", null);
      __publicField(this, "DeckChangerManual", null);
      __publicField(this, "DeckSubtractArrowManual", null);
      __publicField(this, "HelpersChangerManual", null);
      __publicField(this, "HelpersOnManual", null);
      __publicField(this, "HelpersOffManual", null);
      __publicField(this, "DealerValuesCanvas", null);
      __publicField(this, "DealerValues", null);
      /** Added: the dealer's 11 card slots (upstream: Dealer.DeckPositions with instantiated cards). */
      __publicField(this, "Slots", []);
      __publicField(this, "SlotRenderers", []);
      __publicField(this, "SlotAnimators", []);
      /** Added: one line under the dealer's buttons with this client's check of the round's deal (DeckManager.CheckText). */
      __publicField(this, "DealCheck", null);
      /** Added: the line's backing, shown while there is a line. */
      __publicField(this, "DealCheckPanel", null);
      __publicField(this, "actives", /* @__PURE__ */ new Map());
      __publicField(this, "shown", []);
      __publicField(this, "seen", { round: -1, resets: -1, bust: false });
    }
    SetActive(obj, on) {
      if (!obj || this.actives.get(obj) === on) return;
      this.actives.set(obj, on);
      obj.SetActive(on);
    }
    /** What dealer slot k shows on this client: a card type, HIDDEN (the back), or SLOT_OFF. For tests. */
    Showing(k) {
      return this.shown[k] ?? SLOT_OFF;
    }
    /** Upstream Update (DealerUIController.cs:131-237). */
    Update() {
      const ctrl = this.BlackjackController;
      if (!ctrl) return;
      const panels = [this.ManualOwnerUI, this.OwnerSlider, this.DeckSubtractArrow, this.DeckSubtractArrowManual, this.NotOwnerUI, this.ManualNotOwnerUI, this.ManualOwnerSettings, this.DealerValuesCanvas];
      if (!this.Running) {
        for (const panel of panels) this.SetActive(panel, false);
        return;
      }
      const isOwner = ctrl.IsTableOwner(ctrl.LocalSid());
      const gameState = ctrl.localGameActive;
      const manual = ctrl.ManualPlay;
      this.SetActive(this.ManualOwnerUI, isOwner && manual && !gameState);
      this.SetActive(this.OwnerSlider, isOwner && manual && gameState);
      const decks = ctrl.Deck.NumberOfDecks;
      this.SetActive(this.DeckSubtractArrow, decks > 2);
      this.SetActive(this.DeckSubtractArrowManual, decks > 2);
      this.SetActive(this.NotOwnerUI, !isOwner && !gameState);
      this.SetActive(this.ManualNotOwnerUI, !isOwner && !gameState && manual);
      if (this.DeckCount) this.DeckCount.text = String(decks);
      if (this.DeckCountManual) this.DeckCountManual.text = String(decks);
      this.SetActive(this.ManualOwnerSettings, isOwner && manual && !gameState);
      const dealerVal = this.DealerController.GetDeckValue();
      this.SetActive(this.DealerValuesCanvas, !gameState && dealerVal > 0);
      if (this.DealerValues) this.DealerValues.text = String(dealerVal);
      this.AutoCanvasAnimator?.SetBool("Active", !manual);
      this.SetActive(this.AutoCanvas, !manual || isOwner);
      this.SetActive(this.OwnerUI, isOwner && !manual && !gameState);
      const change = ctrl.CanChangeSettings;
      for (const [toggle, on, off] of [
        [this.ChipToggle, this.ChipOn, this.ChipOff],
        [this.ChipToggleManual, this.ChipOnManual, this.ChipOffManual]
      ]) {
        this.SetActive(toggle, change);
        this.SetActive(on, ctrl.UsingChips);
        this.SetActive(off, !ctrl.UsingChips);
      }
      for (const [toggle, on, off] of [
        [this.HelpersChanger, this.HelpersOn, this.HelpersOff],
        [this.HelpersChangerManual, this.HelpersOnManual, this.HelpersOffManual]
      ]) {
        this.SetActive(toggle, change);
        this.SetActive(on, ctrl.HelpersEnabled);
        this.SetActive(off, !ctrl.HelpersEnabled);
      }
      this.SetActive(this.DeckChanger, change);
      this.SetActive(this.DeckChangerManual, change);
      const line = ctrl.Deck.CheckText();
      if (this.DealCheck) this.DealCheck.text = line;
      this.SetActive(this.DealCheckPanel, line !== "");
    }
    /** Called by Controller.Redraw: the dealer's cards, the flip, and the table banner, from state. */
    Apply(instant) {
      const ctrl = this.BlackjackController;
      const dealer = this.DealerController;
      const audio = ctrl.AudioController;
      if (ctrl.round !== this.seen.round || ctrl.resets !== this.seen.resets) {
        if (!instant && this.seen.round !== -1) this.ResetTableUI();
        this.seen = { round: ctrl.round, resets: ctrl.resets, bust: false };
      }
      for (let k = 0; k < MAX_CARDS; k++) {
        const card = k < dealer.cards.length ? dealer.cards[k] : SLOT_OFF;
        const was = this.shown[k] ?? SLOT_OFF;
        if (was === card) continue;
        this.shown[k] = card;
        const slot = this.Slots[k] ?? null;
        if (card === SLOT_OFF) {
          this.SetActive(slot, false);
          continue;
        }
        this.SetActive(slot, true);
        if (card === HIDDEN) {
          this.SlotRenderers[k]?.SetFloat("_CardIndex", -1);
          if (!instant) audio.PlayDrawCard();
          continue;
        }
        this.SlotRenderers[k]?.SetFloat("_CardIndex", card);
        if (was === HIDDEN) {
          this.SlotAnimators[k]?.SetTrigger("Flip");
          if (!instant) audio.PlayFlipCard();
        } else {
          this.SlotAnimators[k]?.SetTrigger("NotHidden");
          if (!instant) audio.PlayDrawCard();
        }
      }
      if (dealer.IsBust && !this.seen.bust) {
        this.seen.bust = true;
        this.Bust();
      }
    }
    /** The dealer-height slider's value (C12: set by two buttons on the table owner's client). */
    SetHeight(value) {
      this.UIHeightAnimator?.SetFloat("Height", Math.min(0.99, value));
    }
    ResetTableUI() {
      this.TableUIAnimator?.SetTrigger("Reset");
    }
    Bust() {
      this.TableUIAnimator?.ResetTrigger("Reset");
      this.TableUIAnimator?.SetTrigger("Bust");
    }
  };

  // src/DisableFixer.ts
  var DisableFixer = class extends Behaviour {
    constructor() {
      super(...arguments);
      // From bindings.json.
      __publicField(this, "Players", []);
      __publicField(this, "Controller");
    }
    OnDestroy() {
      for (const player of this.Players) {
        if (player.isOwner) player.ReleaseControl();
      }
    }
  };

  // src/DistanceOptimizer.ts
  var DistanceOptimizer = class extends Behaviour {
    constructor() {
      super(...arguments);
      // From bindings.json.
      __publicField(this, "GameController");
      __publicField(this, "AudioController");
      __publicField(this, "Players", []);
      __publicField(this, "DealerUI");
      __publicField(this, "TurnOff", []);
      __publicField(this, "inRange", null);
    }
    /** The radius, from the snippet's `range` attribute. */
    get Radius() {
      const value = Number(this.Settings.get("range"));
      return Number.isFinite(value) && value > 0 ? value : 5;
    }
    Start() {
      this.SendCustomEventDelayedFrames("DelayedStart", 20);
    }
    DelayedStart() {
      this.Set(this.IsInRange());
    }
    Update() {
      if (this.inRange === null || this.Time.frameCount % 5 !== 0) return;
      const now = this.IsInRange();
      if (now === this.inRange) return;
      if (!now) {
        for (const player of this.GameController.Players) if (player.isOwner) player.ReleaseControl();
      }
      this.Set(now);
    }
    IsInRange() {
      const head = this.Input.Position;
      const centre = this.transform.known ? this.transform.position : null;
      if (!head || !centre) return true;
      return Vector3.Distance(head, centre) <= this.Radius;
    }
    Set(on) {
      this.inRange = on;
      for (const item of this.TurnOff) item?.SetActive(on);
      this.AudioController.isActive = on;
      for (const player of this.Players) player.isRunningProperty = on;
      this.DealerUI.Running = on;
    }
  };

  // src/Interactable.ts
  var Interactable = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Set by InteractableController: the button may be pressed now. */
      __publicField(this, "Active", false);
      // From bindings.json.
      __publicField(this, "Event", "");
      __publicField(this, "TargetBehaviour", null);
      __publicField(this, "PressName", "Press");
      __publicField(this, "PressViz", null);
    }
    Interact() {
      if (!this.Active || !this.TargetBehaviour) return;
      this.TargetBehaviour.SendCustomEvent(this.Event);
      this.PressViz?.SetTrigger(this.PressName);
    }
  };

  // src/InteractableController.ts
  var InteractableController = class extends Behaviour {
    constructor() {
      super(...arguments);
      // From bindings.json.
      __publicField(this, "Controller");
      /** Upstream field `Player`; renamed because Behaviour.Player is the runtime's per-player accessor. */
      __publicField(this, "Seat");
      __publicField(this, "JoinGame", null);
      __publicField(this, "Stand", null);
      __publicField(this, "Split", null);
      __publicField(this, "HitSplit", null);
      __publicField(this, "HitNormal", null);
      __publicField(this, "LeaveGame", null);
      __publicField(this, "Add10", null);
      __publicField(this, "Add5", null);
      __publicField(this, "Remove10", null);
      __publicField(this, "Remove5", null);
    }
    Update() {
      this.Refresh();
    }
    Refresh() {
      const player = this.Seat;
      const controller = this.Controller ?? player?.BlackjackController;
      if (!player || !controller) return;
      const set = (button, active) => {
        if (button) button.Active = player.Running && active;
      };
      const isOwner = player.isOwner;
      const gameActive = controller.localGameActive;
      const usingChips = controller.UsingChips;
      set(this.JoinGame, !isOwner && !gameActive);
      set(this.Stand, isOwner && gameActive && player.myTurn);
      set(this.Split, isOwner && gameActive && player.myTurn && player.CanSplit && player.SplitAffordable());
      set(this.HitSplit, isOwner && gameActive && player.myTurn && player.HasSplit);
      set(this.HitNormal, isOwner && gameActive && player.myTurn);
      set(this.LeaveGame, isOwner);
      set(this.Add10, isOwner && !gameActive && usingChips);
      set(this.Add5, isOwner && !gameActive && usingChips);
      set(this.Remove10, isOwner && !gameActive && usingChips);
      set(this.Remove5, isOwner && !gameActive && usingChips);
    }
  };

  // src/PlayerUIController.ts
  function freshSeen(round) {
    return { round, cards: 0, startGame: false, turn: false, split: false, normalBust: false, splitBust: false, finished: false, bustEnd: false, wantNormal: false, wantSplit: false, result0: RESULT_NONE, result1: RESULT_NONE };
  }
  var PlayerUIController = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "Running", true);
      // From bindings.json.
      __publicField(this, "PlayerController");
      __publicField(this, "OwnerUI", null);
      __publicField(this, "DealerUI", null);
      __publicField(this, "NotOwnerUI", null);
      __publicField(this, "PlayerName", null);
      __publicField(this, "PlayerUIAnimator", null);
      __publicField(this, "DealerUIAnimator", null);
      __publicField(this, "PlayerOwner", null);
      __publicField(this, "NormalHelper", null);
      __publicField(this, "SplitHelper", null);
      __publicField(this, "isStood", false);
      __publicField(this, "seen", freshSeen(-1));
      __publicField(this, "actives", /* @__PURE__ */ new Map());
    }
    SetActive(obj, on) {
      if (!obj || this.actives.get(obj) === on) return;
      this.actives.set(obj, on);
      obj.SetActive(on);
    }
    /** Upstream Update (PlayerUIController.cs:57-119): which panels this client shows, and the helper totals. */
    Update() {
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
    Apply(instant) {
      const p = this.PlayerController;
      const ctrl = p.BlackjackController;
      const audio = ctrl.AudioController;
      if (ctrl.round !== this.seen.round) {
        if (!instant && this.seen.round !== -1) this.ResetAnimator();
        this.seen = freshSeen(ctrl.round);
      }
      const s = this.seen;
      const cards = p.NormalDeck.cards.length + p.SplitDeck.cards.length;
      if (!instant) for (let k = s.cards; k < cards; k++) audio.PlayDrawCard();
      s.cards = cards;
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
      if (p.result[0] !== s.result0) {
        s.result0 = p.result[0];
        if (s.result0 === RESULT_WIN) this.SetWin();
        else if (s.result0 === RESULT_DRAW) this.SetDraw();
        else if (s.result0 === RESULT_LOSE) this.SetLose();
      }
      if (p.result[1] !== s.result1) {
        s.result1 = p.result[1];
        if (s.result1 === RESULT_WIN) this.SplitWin();
        else if (s.result1 === RESULT_DRAW) this.SplitDraw();
        else if (s.result1 === RESULT_LOSE) this.SplitLose();
      }
    }
    // ---- upstream's methods (PlayerUIController.cs:121-272) -------------------------------------------------------
    CanSplit(value) {
      this.PlayerUIAnimator?.SetBool("CanSplit", value);
    }
    HasSplit(value) {
      this.PlayerUIAnimator?.SetBool("HasSplit", value);
      this.DealerUIAnimator?.SetBool("Split", true);
    }
    MyTurn(value) {
      this.PlayerUIAnimator?.SetBool("MyTurn", value);
    }
    Active(value) {
      this.PlayerUIAnimator?.SetBool("Active", value);
    }
    ActivateDealerUI() {
      this.DealerUIAnimator?.SetTrigger("Activate");
    }
    ResetAnimator() {
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
    SetWin() {
      this.PlayerUIAnimator?.SetTrigger("ResetBust");
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("Win");
    }
    SetDraw() {
      this.PlayerUIAnimator?.SetTrigger("ResetBust");
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("Draw");
    }
    SetLose() {
      this.PlayerUIAnimator?.SetTrigger("ResetBust");
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("Lose");
    }
    SplitDeck() {
      this.PlayerUIAnimator?.SetTrigger("Split");
      this.HasSplit(true);
    }
    NormalBust() {
      this.PlayerUIAnimator?.SetTrigger("NormalBust");
      this.DealerUIAnimator?.SetBool("NormalBust", true);
    }
    SplitBust() {
      this.PlayerUIAnimator?.SetTrigger("SplitBust");
      this.DealerUIAnimator?.SetBool("SplitBust", true);
    }
    SplitWin() {
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("SplitWin");
    }
    SplitDraw() {
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("SplitDraw");
    }
    SplitLose() {
      this.PlayerUIAnimator?.ResetTrigger("StartGame");
      this.PlayerUIAnimator?.SetTrigger("SplitLose");
    }
    StartGame() {
      this.PlayerUIAnimator?.SetTrigger("StartGame");
    }
    Stand() {
      this.DealerUIAnimator?.SetBool("Stood", true);
      this.DealerUIAnimator?.SetBool("Split", false);
      this.SetWantToHitNormal(false);
      this.SetWantToHitSplit(false);
      if (!this.isStood && this.PlayerController.BlackjackController.localGameActive) {
        this.SendCustomEventDelayedSeconds("StandDelayed", 0.75);
        this.isStood = true;
      }
    }
    StandDelayed() {
      this.SetWantToHitNormal(false);
      this.SetWantToHitSplit(false);
      this.DealerUIAnimator?.SetTrigger("Deactivate");
    }
    SetWantToHitNormal(value) {
      this.DealerUIAnimator?.SetBool("WantToHitNormal", this.isStood ? false : value);
    }
    SetWantToHitSplit(value) {
      this.DealerUIAnimator?.SetBool("WantToHitSplit", this.isStood ? false : value);
    }
  };

  // src/index.ts
  var game = {
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
      Player: Player2,
      PlayerDeck,
      PlayerUIController
    },
    debug: (instance) => debugHooks(instance)
  };
  function debugHooks(instance) {
    const ctrl = () => instance.behaviour(instance.bindings.behaviours.find((b) => b.type === "Controller").id);
    return {
      pathOf: (key) => instance.bindings.objects[key]?.path ?? "",
      me: () => ({ sid: instance.networking.LocalPlayer.sid, uid: instance.networking.LocalPlayer.uid, name: instance.networking.LocalPlayer.displayName }),
      table: () => {
        const c = ctrl();
        const d = c.Dealer;
        return {
          phase: c.phase,
          round: c.round,
          owner: c.tableOwnerName,
          usingChips: c.UsingChips,
          dealer: d.cards.slice(),
          dealerTotal: d.TotalDeckValue,
          flipped: d.flipped,
          holeVerified: d.holeVerified,
          dealVerified: c.Deck.verified,
          dealLabel: c.Deck.dealLabel,
          unfairDeals: c.Deck.unfairDeals,
          dealCheck: c.Deck.CheckText(),
          dealStatus: c.Deck.verified?.status ?? "",
          chips: c.ChipController.CurrentChipCount,
          bet: c.ChipController.GetBet(),
          seats: c.Players.map((p) => ({
            active: p.IsActive,
            name: p.ownerName,
            sid: p.ownerSid,
            mine: p.isOwner,
            myTurn: p.myTurn,
            finished: p.HasFinishedTurn,
            normal: p.NormalDeck.cards.slice(),
            split: p.SplitDeck.cards.slice(),
            normalTotal: p.NormalDeck.TotalDeckValue,
            bust: p.NormalDeck.IsBust,
            canSplit: p.CanSplit,
            result: p.result.slice()
          }))
        };
      },
      /** The dealer's synced fields as this page holds them (for the hole-card check). */
      dealer: () => {
        const d = ctrl().Dealer;
        return { cards: d.cards.slice(), total: d.TotalDeckValue, flipped: d.flipped, holeHash: d.holeHash, holeOpening: d.holeOpening, holeRedrawn: d.holeRedrawn };
      },
      /** What dealer slot k and seat i's slot k show on this page (a card, -1 the back, -3 off). */
      dealerShowing: (k) => c0(() => ctrl().DealerUI.Showing(k)),
      seatShowing: (i, k) => c0(() => ctrl().Players[i].NormalDeck.Showing(k))
    };
  }
  function c0(f) {
    try {
      return f();
    } catch {
      return -9;
    }
  }
  var src_default = game;

  // bindings.json
  var bindings_default = {
    behaviours: [
      {
        fields: {
          BlackjackTables: [
            {
              $beh: "ctrl"
            }
          ],
          ChipController: {
            $beh: "chips"
          }
        },
        id: "world",
        object: "system",
        type: "BlackjackWorldController"
      },
      {
        fields: {
          AddToBetClip: {
            $clip: 1,
            on: "chipController"
          },
          Audio: {
            $comp: "chipAudio",
            kind: "AudioSource"
          },
          NotEnoughChipsClip: {
            $clip: 0,
            on: "chipController"
          },
          StartingChips: 100,
          UseChipSystem: true
        },
        id: "chips",
        object: "chipController",
        type: "ChipController"
      },
      {
        fields: {
          Controller: {
            $beh: "ctrl"
          },
          Players: [
            {
              $beh: "p0"
            },
            {
              $beh: "p1"
            },
            {
              $beh: "p2"
            },
            {
              $beh: "p3"
            },
            {
              $beh: "p4"
            },
            {
              $beh: "p5"
            },
            {
              $beh: "p6"
            }
          ]
        },
        id: "disable",
        object: "table",
        type: "DisableFixer"
      },
      {
        fields: {
          AudioController: {
            $beh: "audio"
          },
          ChipController: {
            $beh: "chips"
          },
          Dealer: {
            $beh: "dealer"
          },
          DealerUI: {
            $beh: "dealerUI"
          },
          Deck: {
            $beh: "deck"
          },
          Distance: {
            $beh: "distance"
          },
          Players: [
            {
              $beh: "p0"
            },
            {
              $beh: "p1"
            },
            {
              $beh: "p2"
            },
            {
              $beh: "p3"
            },
            {
              $beh: "p4"
            },
            {
              $beh: "p5"
            },
            {
              $beh: "p6"
            }
          ]
        },
        group: "table",
        id: "ctrl",
        object: "controller",
        type: "Controller"
      },
      {
        fields: {
          BlackjackController: {
            $beh: "ctrl"
          }
        },
        group: "table",
        id: "deck",
        object: "deck",
        type: "DeckManager"
      },
      {
        fields: {
          DealerUI: {
            $beh: "dealerUI"
          },
          Deck: {
            $beh: "deck"
          },
          GameController: {
            $beh: "ctrl"
          }
        },
        group: "table",
        id: "dealer",
        object: "dealer",
        type: "Dealer"
      },
      {
        fields: {
          AutoCanvas: {
            $obj: "autoCanvas"
          },
          AutoCanvasAnimator: {
            $comp: "autoCanvas",
            kind: "Animator"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipOff: {
            $obj: "chipsOnBtn"
          },
          ChipOffManual: {
            $obj: "mchipsOnBtn"
          },
          ChipOn: {
            $obj: "chipsOffBtn"
          },
          ChipOnManual: {
            $obj: "mchipsOffBtn"
          },
          ChipToggle: {
            $obj: "chipToggle"
          },
          ChipToggleManual: {
            $obj: "mchipToggle"
          },
          DealCheck: {
            $comp: "dealCheckText",
            kind: "TMP"
          },
          DealCheckPanel: {
            $obj: "dealCheck"
          },
          DealerController: {
            $beh: "dealer"
          },
          DealerValues: {
            $comp: "dealerValues",
            kind: "TMP"
          },
          DealerValuesCanvas: {
            $obj: "dealerValuesCanvas"
          },
          DeckChanger: {
            $obj: "deckChanger"
          },
          DeckChangerManual: {
            $obj: "mdeckChanger"
          },
          DeckCount: {
            $comp: "deckCount",
            kind: "TMP"
          },
          DeckCountManual: {
            $comp: "mdeckCount",
            kind: "TMP"
          },
          DeckSubtractArrow: {
            $obj: "deckSub"
          },
          DeckSubtractArrowManual: {
            $obj: "mdeckSub"
          },
          HelpersChanger: {
            $obj: "helpersChanger"
          },
          HelpersChangerManual: {
            $obj: "mhelpersChanger"
          },
          HelpersOff: {
            $obj: "helpersOnBtn"
          },
          HelpersOffManual: {
            $obj: "mhelpersOnBtn"
          },
          HelpersOn: {
            $obj: "helpersOffBtn"
          },
          HelpersOnManual: {
            $obj: "mhelpersOffBtn"
          },
          ManualNotOwnerUI: {
            $obj: "manualNotOwner"
          },
          ManualOwnerSettings: {
            $obj: "manualSettings"
          },
          ManualOwnerUI: {
            $obj: "manualOwner"
          },
          NotOwnerUI: {
            $obj: "autoIdle"
          },
          OwnerSlider: {
            $obj: "heightGroup"
          },
          OwnerUI: {
            $obj: "autoOwner"
          },
          SlotAnimators: [
            {
              $comp: "d0",
              kind: "Animator"
            },
            {
              $comp: "d1",
              kind: "Animator"
            },
            {
              $comp: "d2",
              kind: "Animator"
            },
            {
              $comp: "d3",
              kind: "Animator"
            },
            {
              $comp: "d4",
              kind: "Animator"
            },
            {
              $comp: "d5",
              kind: "Animator"
            },
            {
              $comp: "d6",
              kind: "Animator"
            },
            {
              $comp: "d7",
              kind: "Animator"
            },
            {
              $comp: "d8",
              kind: "Animator"
            },
            {
              $comp: "d9",
              kind: "Animator"
            },
            {
              $comp: "d10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "d0f",
              kind: "Renderer"
            },
            {
              $comp: "d1f",
              kind: "Renderer"
            },
            {
              $comp: "d2f",
              kind: "Renderer"
            },
            {
              $comp: "d3f",
              kind: "Renderer"
            },
            {
              $comp: "d4f",
              kind: "Renderer"
            },
            {
              $comp: "d5f",
              kind: "Renderer"
            },
            {
              $comp: "d6f",
              kind: "Renderer"
            },
            {
              $comp: "d7f",
              kind: "Renderer"
            },
            {
              $comp: "d8f",
              kind: "Renderer"
            },
            {
              $comp: "d9f",
              kind: "Renderer"
            },
            {
              $comp: "d10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "d0"
            },
            {
              $obj: "d1"
            },
            {
              $obj: "d2"
            },
            {
              $obj: "d3"
            },
            {
              $obj: "d4"
            },
            {
              $obj: "d5"
            },
            {
              $obj: "d6"
            },
            {
              $obj: "d7"
            },
            {
              $obj: "d8"
            },
            {
              $obj: "d9"
            },
            {
              $obj: "d10"
            }
          ],
          TableUIAnimator: {
            $comp: "tableCanvas",
            kind: "Animator"
          },
          UIHeightAnimator: {
            $comp: "heightAnim",
            kind: "Animator"
          }
        },
        id: "dealerUI",
        object: "dealerUI",
        type: "DealerUIController"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p0_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p0_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p0ic"
          },
          NormalDeck: {
            $beh: "p0n"
          },
          PlayerName: {
            $comp: "p0_dealerName",
            kind: "TMP"
          },
          PlayerNum: 0,
          PlayerUI: {
            $beh: "p0ui"
          },
          SplitDeck: {
            $beh: "p0s"
          },
          Timer: {
            $comp: "p0_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p0_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p0",
        object: "p0",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p0_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p0"
          },
          SlotAnimators: [
            {
              $comp: "p0_n0",
              kind: "Animator"
            },
            {
              $comp: "p0_n1",
              kind: "Animator"
            },
            {
              $comp: "p0_n2",
              kind: "Animator"
            },
            {
              $comp: "p0_n3",
              kind: "Animator"
            },
            {
              $comp: "p0_n4",
              kind: "Animator"
            },
            {
              $comp: "p0_n5",
              kind: "Animator"
            },
            {
              $comp: "p0_n6",
              kind: "Animator"
            },
            {
              $comp: "p0_n7",
              kind: "Animator"
            },
            {
              $comp: "p0_n8",
              kind: "Animator"
            },
            {
              $comp: "p0_n9",
              kind: "Animator"
            },
            {
              $comp: "p0_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p0_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p0_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p0_n0"
            },
            {
              $obj: "p0_n1"
            },
            {
              $obj: "p0_n2"
            },
            {
              $obj: "p0_n3"
            },
            {
              $obj: "p0_n4"
            },
            {
              $obj: "p0_n5"
            },
            {
              $obj: "p0_n6"
            },
            {
              $obj: "p0_n7"
            },
            {
              $obj: "p0_n8"
            },
            {
              $obj: "p0_n9"
            },
            {
              $obj: "p0_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p0n",
        object: "p0_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p0_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p0"
          },
          SlotAnimators: [
            {
              $comp: "p0_s0",
              kind: "Animator"
            },
            {
              $comp: "p0_s1",
              kind: "Animator"
            },
            {
              $comp: "p0_s2",
              kind: "Animator"
            },
            {
              $comp: "p0_s3",
              kind: "Animator"
            },
            {
              $comp: "p0_s4",
              kind: "Animator"
            },
            {
              $comp: "p0_s5",
              kind: "Animator"
            },
            {
              $comp: "p0_s6",
              kind: "Animator"
            },
            {
              $comp: "p0_s7",
              kind: "Animator"
            },
            {
              $comp: "p0_s8",
              kind: "Animator"
            },
            {
              $comp: "p0_s9",
              kind: "Animator"
            },
            {
              $comp: "p0_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p0_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p0_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p0_s0"
            },
            {
              $obj: "p0_s1"
            },
            {
              $obj: "p0_s2"
            },
            {
              $obj: "p0_s3"
            },
            {
              $obj: "p0_s4"
            },
            {
              $obj: "p0_s5"
            },
            {
              $obj: "p0_s6"
            },
            {
              $obj: "p0_s7"
            },
            {
              $obj: "p0_s8"
            },
            {
              $obj: "p0_s9"
            },
            {
              $obj: "p0_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p0s",
        object: "p0_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p0_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p0_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p0_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p0_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p0_ownerUI"
          },
          PlayerController: {
            $beh: "p0"
          },
          PlayerName: {
            $obj: "p0_nameObj"
          },
          PlayerOwner: {
            $comp: "p0_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p0_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p0_splitHelper",
            kind: "TMP"
          }
        },
        id: "p0ui",
        object: "p0_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p0bAdd10"
          },
          Add5: {
            $beh: "p0bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p0bHitNormal"
          },
          HitSplit: {
            $beh: "p0bHitSplit"
          },
          JoinGame: {
            $beh: "p0bJoin"
          },
          LeaveGame: {
            $beh: "p0bLeave"
          },
          Remove10: {
            $beh: "p0bRemove10"
          },
          Remove5: {
            $beh: "p0bRemove5"
          },
          Seat: {
            $beh: "p0"
          },
          Split: {
            $beh: "p0bSplit"
          },
          Stand: {
            $beh: "p0bStand"
          }
        },
        id: "p0ic",
        object: "p0_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bJoin",
        object: "p0_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bStand",
        object: "p0_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bSplit",
        object: "p0_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bHitSplit",
        object: "p0_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bHitNormal",
        object: "p0_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bLeave",
        object: "p0_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bAdd10",
        object: "p0_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bAdd5",
        object: "p0_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bRemove10",
        object: "p0_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p0_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p0"
          }
        },
        id: "p0bRemove5",
        object: "p0_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p1_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator2",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p1_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p1ic"
          },
          NormalDeck: {
            $beh: "p1n"
          },
          PlayerName: {
            $comp: "p1_dealerName",
            kind: "TMP"
          },
          PlayerNum: 1,
          PlayerUI: {
            $beh: "p1ui"
          },
          SplitDeck: {
            $beh: "p1s"
          },
          Timer: {
            $comp: "p1_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p1_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p1",
        object: "p1",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p1_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p1"
          },
          SlotAnimators: [
            {
              $comp: "p1_n0",
              kind: "Animator"
            },
            {
              $comp: "p1_n1",
              kind: "Animator"
            },
            {
              $comp: "p1_n2",
              kind: "Animator"
            },
            {
              $comp: "p1_n3",
              kind: "Animator"
            },
            {
              $comp: "p1_n4",
              kind: "Animator"
            },
            {
              $comp: "p1_n5",
              kind: "Animator"
            },
            {
              $comp: "p1_n6",
              kind: "Animator"
            },
            {
              $comp: "p1_n7",
              kind: "Animator"
            },
            {
              $comp: "p1_n8",
              kind: "Animator"
            },
            {
              $comp: "p1_n9",
              kind: "Animator"
            },
            {
              $comp: "p1_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p1_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p1_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p1_n0"
            },
            {
              $obj: "p1_n1"
            },
            {
              $obj: "p1_n2"
            },
            {
              $obj: "p1_n3"
            },
            {
              $obj: "p1_n4"
            },
            {
              $obj: "p1_n5"
            },
            {
              $obj: "p1_n6"
            },
            {
              $obj: "p1_n7"
            },
            {
              $obj: "p1_n8"
            },
            {
              $obj: "p1_n9"
            },
            {
              $obj: "p1_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p1n",
        object: "p1_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p1_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p1"
          },
          SlotAnimators: [
            {
              $comp: "p1_s0",
              kind: "Animator"
            },
            {
              $comp: "p1_s1",
              kind: "Animator"
            },
            {
              $comp: "p1_s2",
              kind: "Animator"
            },
            {
              $comp: "p1_s3",
              kind: "Animator"
            },
            {
              $comp: "p1_s4",
              kind: "Animator"
            },
            {
              $comp: "p1_s5",
              kind: "Animator"
            },
            {
              $comp: "p1_s6",
              kind: "Animator"
            },
            {
              $comp: "p1_s7",
              kind: "Animator"
            },
            {
              $comp: "p1_s8",
              kind: "Animator"
            },
            {
              $comp: "p1_s9",
              kind: "Animator"
            },
            {
              $comp: "p1_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p1_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p1_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p1_s0"
            },
            {
              $obj: "p1_s1"
            },
            {
              $obj: "p1_s2"
            },
            {
              $obj: "p1_s3"
            },
            {
              $obj: "p1_s4"
            },
            {
              $obj: "p1_s5"
            },
            {
              $obj: "p1_s6"
            },
            {
              $obj: "p1_s7"
            },
            {
              $obj: "p1_s8"
            },
            {
              $obj: "p1_s9"
            },
            {
              $obj: "p1_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p1s",
        object: "p1_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p1_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p1_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p1_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p1_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p1_ownerUI"
          },
          PlayerController: {
            $beh: "p1"
          },
          PlayerName: {
            $obj: "p1_nameObj"
          },
          PlayerOwner: {
            $comp: "p1_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p1_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p1_splitHelper",
            kind: "TMP"
          }
        },
        id: "p1ui",
        object: "p1_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p1bAdd10"
          },
          Add5: {
            $beh: "p1bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p1bHitNormal"
          },
          HitSplit: {
            $beh: "p1bHitSplit"
          },
          JoinGame: {
            $beh: "p1bJoin"
          },
          LeaveGame: {
            $beh: "p1bLeave"
          },
          Remove10: {
            $beh: "p1bRemove10"
          },
          Remove5: {
            $beh: "p1bRemove5"
          },
          Seat: {
            $beh: "p1"
          },
          Split: {
            $beh: "p1bSplit"
          },
          Stand: {
            $beh: "p1bStand"
          }
        },
        id: "p1ic",
        object: "p1_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bJoin",
        object: "p1_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bStand",
        object: "p1_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bSplit",
        object: "p1_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bHitSplit",
        object: "p1_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bHitNormal",
        object: "p1_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bLeave",
        object: "p1_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bAdd10",
        object: "p1_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bAdd5",
        object: "p1_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bRemove10",
        object: "p1_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p1_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p1"
          }
        },
        id: "p1bRemove5",
        object: "p1_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p2_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator3",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p2_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p2ic"
          },
          NormalDeck: {
            $beh: "p2n"
          },
          PlayerName: {
            $comp: "p2_dealerName",
            kind: "TMP"
          },
          PlayerNum: 2,
          PlayerUI: {
            $beh: "p2ui"
          },
          SplitDeck: {
            $beh: "p2s"
          },
          Timer: {
            $comp: "p2_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p2_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p2",
        object: "p2",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p2_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p2"
          },
          SlotAnimators: [
            {
              $comp: "p2_n0",
              kind: "Animator"
            },
            {
              $comp: "p2_n1",
              kind: "Animator"
            },
            {
              $comp: "p2_n2",
              kind: "Animator"
            },
            {
              $comp: "p2_n3",
              kind: "Animator"
            },
            {
              $comp: "p2_n4",
              kind: "Animator"
            },
            {
              $comp: "p2_n5",
              kind: "Animator"
            },
            {
              $comp: "p2_n6",
              kind: "Animator"
            },
            {
              $comp: "p2_n7",
              kind: "Animator"
            },
            {
              $comp: "p2_n8",
              kind: "Animator"
            },
            {
              $comp: "p2_n9",
              kind: "Animator"
            },
            {
              $comp: "p2_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p2_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p2_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p2_n0"
            },
            {
              $obj: "p2_n1"
            },
            {
              $obj: "p2_n2"
            },
            {
              $obj: "p2_n3"
            },
            {
              $obj: "p2_n4"
            },
            {
              $obj: "p2_n5"
            },
            {
              $obj: "p2_n6"
            },
            {
              $obj: "p2_n7"
            },
            {
              $obj: "p2_n8"
            },
            {
              $obj: "p2_n9"
            },
            {
              $obj: "p2_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p2n",
        object: "p2_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p2_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p2"
          },
          SlotAnimators: [
            {
              $comp: "p2_s0",
              kind: "Animator"
            },
            {
              $comp: "p2_s1",
              kind: "Animator"
            },
            {
              $comp: "p2_s2",
              kind: "Animator"
            },
            {
              $comp: "p2_s3",
              kind: "Animator"
            },
            {
              $comp: "p2_s4",
              kind: "Animator"
            },
            {
              $comp: "p2_s5",
              kind: "Animator"
            },
            {
              $comp: "p2_s6",
              kind: "Animator"
            },
            {
              $comp: "p2_s7",
              kind: "Animator"
            },
            {
              $comp: "p2_s8",
              kind: "Animator"
            },
            {
              $comp: "p2_s9",
              kind: "Animator"
            },
            {
              $comp: "p2_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p2_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p2_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p2_s0"
            },
            {
              $obj: "p2_s1"
            },
            {
              $obj: "p2_s2"
            },
            {
              $obj: "p2_s3"
            },
            {
              $obj: "p2_s4"
            },
            {
              $obj: "p2_s5"
            },
            {
              $obj: "p2_s6"
            },
            {
              $obj: "p2_s7"
            },
            {
              $obj: "p2_s8"
            },
            {
              $obj: "p2_s9"
            },
            {
              $obj: "p2_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p2s",
        object: "p2_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p2_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p2_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p2_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p2_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p2_ownerUI"
          },
          PlayerController: {
            $beh: "p2"
          },
          PlayerName: {
            $obj: "p2_nameObj"
          },
          PlayerOwner: {
            $comp: "p2_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p2_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p2_splitHelper",
            kind: "TMP"
          }
        },
        id: "p2ui",
        object: "p2_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p2bAdd10"
          },
          Add5: {
            $beh: "p2bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p2bHitNormal"
          },
          HitSplit: {
            $beh: "p2bHitSplit"
          },
          JoinGame: {
            $beh: "p2bJoin"
          },
          LeaveGame: {
            $beh: "p2bLeave"
          },
          Remove10: {
            $beh: "p2bRemove10"
          },
          Remove5: {
            $beh: "p2bRemove5"
          },
          Seat: {
            $beh: "p2"
          },
          Split: {
            $beh: "p2bSplit"
          },
          Stand: {
            $beh: "p2bStand"
          }
        },
        id: "p2ic",
        object: "p2_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bJoin",
        object: "p2_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bStand",
        object: "p2_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bSplit",
        object: "p2_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bHitSplit",
        object: "p2_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bHitNormal",
        object: "p2_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bLeave",
        object: "p2_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bAdd10",
        object: "p2_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bAdd5",
        object: "p2_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bRemove10",
        object: "p2_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p2_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p2"
          }
        },
        id: "p2bRemove5",
        object: "p2_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p3_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator4",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p3_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p3ic"
          },
          NormalDeck: {
            $beh: "p3n"
          },
          PlayerName: {
            $comp: "p3_dealerName",
            kind: "TMP"
          },
          PlayerNum: 3,
          PlayerUI: {
            $beh: "p3ui"
          },
          SplitDeck: {
            $beh: "p3s"
          },
          Timer: {
            $comp: "p3_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p3_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p3",
        object: "p3",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p3_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p3"
          },
          SlotAnimators: [
            {
              $comp: "p3_n0",
              kind: "Animator"
            },
            {
              $comp: "p3_n1",
              kind: "Animator"
            },
            {
              $comp: "p3_n2",
              kind: "Animator"
            },
            {
              $comp: "p3_n3",
              kind: "Animator"
            },
            {
              $comp: "p3_n4",
              kind: "Animator"
            },
            {
              $comp: "p3_n5",
              kind: "Animator"
            },
            {
              $comp: "p3_n6",
              kind: "Animator"
            },
            {
              $comp: "p3_n7",
              kind: "Animator"
            },
            {
              $comp: "p3_n8",
              kind: "Animator"
            },
            {
              $comp: "p3_n9",
              kind: "Animator"
            },
            {
              $comp: "p3_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p3_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p3_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p3_n0"
            },
            {
              $obj: "p3_n1"
            },
            {
              $obj: "p3_n2"
            },
            {
              $obj: "p3_n3"
            },
            {
              $obj: "p3_n4"
            },
            {
              $obj: "p3_n5"
            },
            {
              $obj: "p3_n6"
            },
            {
              $obj: "p3_n7"
            },
            {
              $obj: "p3_n8"
            },
            {
              $obj: "p3_n9"
            },
            {
              $obj: "p3_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p3n",
        object: "p3_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p3_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p3"
          },
          SlotAnimators: [
            {
              $comp: "p3_s0",
              kind: "Animator"
            },
            {
              $comp: "p3_s1",
              kind: "Animator"
            },
            {
              $comp: "p3_s2",
              kind: "Animator"
            },
            {
              $comp: "p3_s3",
              kind: "Animator"
            },
            {
              $comp: "p3_s4",
              kind: "Animator"
            },
            {
              $comp: "p3_s5",
              kind: "Animator"
            },
            {
              $comp: "p3_s6",
              kind: "Animator"
            },
            {
              $comp: "p3_s7",
              kind: "Animator"
            },
            {
              $comp: "p3_s8",
              kind: "Animator"
            },
            {
              $comp: "p3_s9",
              kind: "Animator"
            },
            {
              $comp: "p3_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p3_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p3_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p3_s0"
            },
            {
              $obj: "p3_s1"
            },
            {
              $obj: "p3_s2"
            },
            {
              $obj: "p3_s3"
            },
            {
              $obj: "p3_s4"
            },
            {
              $obj: "p3_s5"
            },
            {
              $obj: "p3_s6"
            },
            {
              $obj: "p3_s7"
            },
            {
              $obj: "p3_s8"
            },
            {
              $obj: "p3_s9"
            },
            {
              $obj: "p3_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p3s",
        object: "p3_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p3_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p3_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p3_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p3_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p3_ownerUI"
          },
          PlayerController: {
            $beh: "p3"
          },
          PlayerName: {
            $obj: "p3_nameObj"
          },
          PlayerOwner: {
            $comp: "p3_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p3_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p3_splitHelper",
            kind: "TMP"
          }
        },
        id: "p3ui",
        object: "p3_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p3bAdd10"
          },
          Add5: {
            $beh: "p3bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p3bHitNormal"
          },
          HitSplit: {
            $beh: "p3bHitSplit"
          },
          JoinGame: {
            $beh: "p3bJoin"
          },
          LeaveGame: {
            $beh: "p3bLeave"
          },
          Remove10: {
            $beh: "p3bRemove10"
          },
          Remove5: {
            $beh: "p3bRemove5"
          },
          Seat: {
            $beh: "p3"
          },
          Split: {
            $beh: "p3bSplit"
          },
          Stand: {
            $beh: "p3bStand"
          }
        },
        id: "p3ic",
        object: "p3_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bJoin",
        object: "p3_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bStand",
        object: "p3_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bSplit",
        object: "p3_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bHitSplit",
        object: "p3_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bHitNormal",
        object: "p3_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bLeave",
        object: "p3_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bAdd10",
        object: "p3_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bAdd5",
        object: "p3_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bRemove10",
        object: "p3_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p3_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p3"
          }
        },
        id: "p3bRemove5",
        object: "p3_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p4_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator5",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p4_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p4ic"
          },
          NormalDeck: {
            $beh: "p4n"
          },
          PlayerName: {
            $comp: "p4_dealerName",
            kind: "TMP"
          },
          PlayerNum: 4,
          PlayerUI: {
            $beh: "p4ui"
          },
          SplitDeck: {
            $beh: "p4s"
          },
          Timer: {
            $comp: "p4_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p4_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p4",
        object: "p4",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p4_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p4"
          },
          SlotAnimators: [
            {
              $comp: "p4_n0",
              kind: "Animator"
            },
            {
              $comp: "p4_n1",
              kind: "Animator"
            },
            {
              $comp: "p4_n2",
              kind: "Animator"
            },
            {
              $comp: "p4_n3",
              kind: "Animator"
            },
            {
              $comp: "p4_n4",
              kind: "Animator"
            },
            {
              $comp: "p4_n5",
              kind: "Animator"
            },
            {
              $comp: "p4_n6",
              kind: "Animator"
            },
            {
              $comp: "p4_n7",
              kind: "Animator"
            },
            {
              $comp: "p4_n8",
              kind: "Animator"
            },
            {
              $comp: "p4_n9",
              kind: "Animator"
            },
            {
              $comp: "p4_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p4_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p4_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p4_n0"
            },
            {
              $obj: "p4_n1"
            },
            {
              $obj: "p4_n2"
            },
            {
              $obj: "p4_n3"
            },
            {
              $obj: "p4_n4"
            },
            {
              $obj: "p4_n5"
            },
            {
              $obj: "p4_n6"
            },
            {
              $obj: "p4_n7"
            },
            {
              $obj: "p4_n8"
            },
            {
              $obj: "p4_n9"
            },
            {
              $obj: "p4_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p4n",
        object: "p4_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p4_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p4"
          },
          SlotAnimators: [
            {
              $comp: "p4_s0",
              kind: "Animator"
            },
            {
              $comp: "p4_s1",
              kind: "Animator"
            },
            {
              $comp: "p4_s2",
              kind: "Animator"
            },
            {
              $comp: "p4_s3",
              kind: "Animator"
            },
            {
              $comp: "p4_s4",
              kind: "Animator"
            },
            {
              $comp: "p4_s5",
              kind: "Animator"
            },
            {
              $comp: "p4_s6",
              kind: "Animator"
            },
            {
              $comp: "p4_s7",
              kind: "Animator"
            },
            {
              $comp: "p4_s8",
              kind: "Animator"
            },
            {
              $comp: "p4_s9",
              kind: "Animator"
            },
            {
              $comp: "p4_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p4_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p4_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p4_s0"
            },
            {
              $obj: "p4_s1"
            },
            {
              $obj: "p4_s2"
            },
            {
              $obj: "p4_s3"
            },
            {
              $obj: "p4_s4"
            },
            {
              $obj: "p4_s5"
            },
            {
              $obj: "p4_s6"
            },
            {
              $obj: "p4_s7"
            },
            {
              $obj: "p4_s8"
            },
            {
              $obj: "p4_s9"
            },
            {
              $obj: "p4_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p4s",
        object: "p4_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p4_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p4_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p4_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p4_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p4_ownerUI"
          },
          PlayerController: {
            $beh: "p4"
          },
          PlayerName: {
            $obj: "p4_nameObj"
          },
          PlayerOwner: {
            $comp: "p4_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p4_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p4_splitHelper",
            kind: "TMP"
          }
        },
        id: "p4ui",
        object: "p4_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p4bAdd10"
          },
          Add5: {
            $beh: "p4bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p4bHitNormal"
          },
          HitSplit: {
            $beh: "p4bHitSplit"
          },
          JoinGame: {
            $beh: "p4bJoin"
          },
          LeaveGame: {
            $beh: "p4bLeave"
          },
          Remove10: {
            $beh: "p4bRemove10"
          },
          Remove5: {
            $beh: "p4bRemove5"
          },
          Seat: {
            $beh: "p4"
          },
          Split: {
            $beh: "p4bSplit"
          },
          Stand: {
            $beh: "p4bStand"
          }
        },
        id: "p4ic",
        object: "p4_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bJoin",
        object: "p4_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bStand",
        object: "p4_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bSplit",
        object: "p4_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bHitSplit",
        object: "p4_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bHitNormal",
        object: "p4_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bLeave",
        object: "p4_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bAdd10",
        object: "p4_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bAdd5",
        object: "p4_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bRemove10",
        object: "p4_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p4_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p4"
          }
        },
        id: "p4bRemove5",
        object: "p4_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p5_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator6",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p5_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p5ic"
          },
          NormalDeck: {
            $beh: "p5n"
          },
          PlayerName: {
            $comp: "p5_dealerName",
            kind: "TMP"
          },
          PlayerNum: 5,
          PlayerUI: {
            $beh: "p5ui"
          },
          SplitDeck: {
            $beh: "p5s"
          },
          Timer: {
            $comp: "p5_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p5_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p5",
        object: "p5",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p5_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p5"
          },
          SlotAnimators: [
            {
              $comp: "p5_n0",
              kind: "Animator"
            },
            {
              $comp: "p5_n1",
              kind: "Animator"
            },
            {
              $comp: "p5_n2",
              kind: "Animator"
            },
            {
              $comp: "p5_n3",
              kind: "Animator"
            },
            {
              $comp: "p5_n4",
              kind: "Animator"
            },
            {
              $comp: "p5_n5",
              kind: "Animator"
            },
            {
              $comp: "p5_n6",
              kind: "Animator"
            },
            {
              $comp: "p5_n7",
              kind: "Animator"
            },
            {
              $comp: "p5_n8",
              kind: "Animator"
            },
            {
              $comp: "p5_n9",
              kind: "Animator"
            },
            {
              $comp: "p5_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p5_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p5_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p5_n0"
            },
            {
              $obj: "p5_n1"
            },
            {
              $obj: "p5_n2"
            },
            {
              $obj: "p5_n3"
            },
            {
              $obj: "p5_n4"
            },
            {
              $obj: "p5_n5"
            },
            {
              $obj: "p5_n6"
            },
            {
              $obj: "p5_n7"
            },
            {
              $obj: "p5_n8"
            },
            {
              $obj: "p5_n9"
            },
            {
              $obj: "p5_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p5n",
        object: "p5_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p5_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p5"
          },
          SlotAnimators: [
            {
              $comp: "p5_s0",
              kind: "Animator"
            },
            {
              $comp: "p5_s1",
              kind: "Animator"
            },
            {
              $comp: "p5_s2",
              kind: "Animator"
            },
            {
              $comp: "p5_s3",
              kind: "Animator"
            },
            {
              $comp: "p5_s4",
              kind: "Animator"
            },
            {
              $comp: "p5_s5",
              kind: "Animator"
            },
            {
              $comp: "p5_s6",
              kind: "Animator"
            },
            {
              $comp: "p5_s7",
              kind: "Animator"
            },
            {
              $comp: "p5_s8",
              kind: "Animator"
            },
            {
              $comp: "p5_s9",
              kind: "Animator"
            },
            {
              $comp: "p5_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p5_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p5_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p5_s0"
            },
            {
              $obj: "p5_s1"
            },
            {
              $obj: "p5_s2"
            },
            {
              $obj: "p5_s3"
            },
            {
              $obj: "p5_s4"
            },
            {
              $obj: "p5_s5"
            },
            {
              $obj: "p5_s6"
            },
            {
              $obj: "p5_s7"
            },
            {
              $obj: "p5_s8"
            },
            {
              $obj: "p5_s9"
            },
            {
              $obj: "p5_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p5s",
        object: "p5_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p5_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p5_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p5_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p5_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p5_ownerUI"
          },
          PlayerController: {
            $beh: "p5"
          },
          PlayerName: {
            $obj: "p5_nameObj"
          },
          PlayerOwner: {
            $comp: "p5_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p5_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p5_splitHelper",
            kind: "TMP"
          }
        },
        id: "p5ui",
        object: "p5_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p5bAdd10"
          },
          Add5: {
            $beh: "p5bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p5bHitNormal"
          },
          HitSplit: {
            $beh: "p5bHitSplit"
          },
          JoinGame: {
            $beh: "p5bJoin"
          },
          LeaveGame: {
            $beh: "p5bLeave"
          },
          Remove10: {
            $beh: "p5bRemove10"
          },
          Remove5: {
            $beh: "p5bRemove5"
          },
          Seat: {
            $beh: "p5"
          },
          Split: {
            $beh: "p5bSplit"
          },
          Stand: {
            $beh: "p5bStand"
          }
        },
        id: "p5ic",
        object: "p5_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bJoin",
        object: "p5_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bStand",
        object: "p5_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bSplit",
        object: "p5_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bHitSplit",
        object: "p5_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bHitNormal",
        object: "p5_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bLeave",
        object: "p5_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bAdd10",
        object: "p5_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bAdd5",
        object: "p5_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bRemove10",
        object: "p5_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p5_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p5"
          }
        },
        id: "p5bRemove5",
        object: "p5_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          BetPanel: {
            $obj: "p6_chips"
          },
          BlackjackController: {
            $beh: "ctrl"
          },
          ChipAnimator: {
            $comp: "chipsAnimator7",
            kind: "Animator"
          },
          CurrentBet: {
            $comp: "p6_currentBet",
            kind: "TMP"
          },
          Deck: {
            $beh: "deck"
          },
          Interactables: {
            $beh: "p6ic"
          },
          NormalDeck: {
            $beh: "p6n"
          },
          PlayerName: {
            $comp: "p6_dealerName",
            kind: "TMP"
          },
          PlayerNum: 6,
          PlayerUI: {
            $beh: "p6ui"
          },
          SplitDeck: {
            $beh: "p6s"
          },
          Timer: {
            $comp: "p6_timer",
            kind: "TMP"
          },
          TotalChips: {
            $comp: "p6_totalChips",
            kind: "TMP"
          }
        },
        group: "table",
        id: "p6",
        object: "p6",
        type: "Player"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p6_normalCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p6"
          },
          SlotAnimators: [
            {
              $comp: "p6_n0",
              kind: "Animator"
            },
            {
              $comp: "p6_n1",
              kind: "Animator"
            },
            {
              $comp: "p6_n2",
              kind: "Animator"
            },
            {
              $comp: "p6_n3",
              kind: "Animator"
            },
            {
              $comp: "p6_n4",
              kind: "Animator"
            },
            {
              $comp: "p6_n5",
              kind: "Animator"
            },
            {
              $comp: "p6_n6",
              kind: "Animator"
            },
            {
              $comp: "p6_n7",
              kind: "Animator"
            },
            {
              $comp: "p6_n8",
              kind: "Animator"
            },
            {
              $comp: "p6_n9",
              kind: "Animator"
            },
            {
              $comp: "p6_n10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p6_n0f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n1f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n2f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n3f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n4f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n5f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n6f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n7f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n8f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n9f",
              kind: "Renderer"
            },
            {
              $comp: "p6_n10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p6_n0"
            },
            {
              $obj: "p6_n1"
            },
            {
              $obj: "p6_n2"
            },
            {
              $obj: "p6_n3"
            },
            {
              $obj: "p6_n4"
            },
            {
              $obj: "p6_n5"
            },
            {
              $obj: "p6_n6"
            },
            {
              $obj: "p6_n7"
            },
            {
              $obj: "p6_n8"
            },
            {
              $obj: "p6_n9"
            },
            {
              $obj: "p6_n10"
            }
          ],
          isSplitDeck: false
        },
        group: "table",
        id: "p6n",
        object: "p6_nd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerValueDisplay: {
            $comp: "p6_splitCount",
            kind: "TMP"
          },
          PlayerController: {
            $beh: "p6"
          },
          SlotAnimators: [
            {
              $comp: "p6_s0",
              kind: "Animator"
            },
            {
              $comp: "p6_s1",
              kind: "Animator"
            },
            {
              $comp: "p6_s2",
              kind: "Animator"
            },
            {
              $comp: "p6_s3",
              kind: "Animator"
            },
            {
              $comp: "p6_s4",
              kind: "Animator"
            },
            {
              $comp: "p6_s5",
              kind: "Animator"
            },
            {
              $comp: "p6_s6",
              kind: "Animator"
            },
            {
              $comp: "p6_s7",
              kind: "Animator"
            },
            {
              $comp: "p6_s8",
              kind: "Animator"
            },
            {
              $comp: "p6_s9",
              kind: "Animator"
            },
            {
              $comp: "p6_s10",
              kind: "Animator"
            }
          ],
          SlotRenderers: [
            {
              $comp: "p6_s0f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s1f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s2f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s3f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s4f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s5f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s6f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s7f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s8f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s9f",
              kind: "Renderer"
            },
            {
              $comp: "p6_s10f",
              kind: "Renderer"
            }
          ],
          Slots: [
            {
              $obj: "p6_s0"
            },
            {
              $obj: "p6_s1"
            },
            {
              $obj: "p6_s2"
            },
            {
              $obj: "p6_s3"
            },
            {
              $obj: "p6_s4"
            },
            {
              $obj: "p6_s5"
            },
            {
              $obj: "p6_s6"
            },
            {
              $obj: "p6_s7"
            },
            {
              $obj: "p6_s8"
            },
            {
              $obj: "p6_s9"
            },
            {
              $obj: "p6_s10"
            }
          ],
          isSplitDeck: true
        },
        group: "table",
        id: "p6s",
        object: "p6_sd",
        type: "PlayerDeck"
      },
      {
        fields: {
          DealerUI: {
            $obj: "p6_dealerMask"
          },
          DealerUIAnimator: {
            $comp: "p6_dealerCanvas",
            kind: "Animator"
          },
          NormalHelper: {
            $comp: "p6_normalHelper",
            kind: "TMP"
          },
          NotOwnerUI: {
            $obj: "p6_notOwnerUI"
          },
          OwnerUI: {
            $obj: "p6_ownerUI"
          },
          PlayerController: {
            $beh: "p6"
          },
          PlayerName: {
            $obj: "p6_nameObj"
          },
          PlayerOwner: {
            $comp: "p6_nameText",
            kind: "TMP"
          },
          PlayerUIAnimator: {
            $comp: "p6_uiAnim",
            kind: "Animator"
          },
          SplitHelper: {
            $comp: "p6_splitHelper",
            kind: "TMP"
          }
        },
        id: "p6ui",
        object: "p6_ui",
        type: "PlayerUIController"
      },
      {
        fields: {
          Add10: {
            $beh: "p6bAdd10"
          },
          Add5: {
            $beh: "p6bAdd5"
          },
          Controller: {
            $beh: "ctrl"
          },
          HitNormal: {
            $beh: "p6bHitNormal"
          },
          HitSplit: {
            $beh: "p6bHitSplit"
          },
          JoinGame: {
            $beh: "p6bJoin"
          },
          LeaveGame: {
            $beh: "p6bLeave"
          },
          Remove10: {
            $beh: "p6bRemove10"
          },
          Remove5: {
            $beh: "p6bRemove5"
          },
          Seat: {
            $beh: "p6"
          },
          Split: {
            $beh: "p6bSplit"
          },
          Stand: {
            $beh: "p6bStand"
          }
        },
        id: "p6ic",
        object: "p6_ic",
        type: "InteractableController"
      },
      {
        fields: {
          Event: "_TakeControl",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizJoin",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bJoin",
        object: "p6_bJoin",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Stand",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizStand",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bStand",
        object: "p6_bStand",
        type: "Interactable"
      },
      {
        fields: {
          Event: "Split",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bSplit",
        object: "p6_bSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoSplitHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizHitSplit",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bHitSplit",
        object: "p6_bHitSplit",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_AutoNormalHitMe",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizHitNormal",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bHitNormal",
        object: "p6_bHitNormal",
        type: "Interactable"
      },
      {
        fields: {
          Event: "ReleaseControl",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizLeave",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bLeave",
        object: "p6_bLeave",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add10ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizAdd10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bAdd10",
        object: "p6_bAdd10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Add5ToBet",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizAdd5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bAdd5",
        object: "p6_bAdd5",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove10FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizRemove10",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bRemove10",
        object: "p6_bRemove10",
        type: "Interactable"
      },
      {
        fields: {
          Event: "_Remove5FromBet",
          PressName: "Press",
          PressViz: {
            $comp: "p6_vizRemove5",
            kind: "Animator"
          },
          TargetBehaviour: {
            $beh: "p6"
          }
        },
        id: "p6bRemove5",
        object: "p6_bRemove5",
        type: "Interactable"
      },
      {
        fields: {
          Audio: {
            $comp: "audio",
            kind: "AudioSource"
          },
          Bust: {
            $clip: 20,
            on: "audioController"
          },
          DealerWantToHit: {
            $clip: 19,
            on: "audioController"
          },
          DrawCard: [
            {
              $clip: 2,
              on: "audioController"
            },
            {
              $clip: 3,
              on: "audioController"
            },
            {
              $clip: 4,
              on: "audioController"
            },
            {
              $clip: 5,
              on: "audioController"
            },
            {
              $clip: 6,
              on: "audioController"
            },
            {
              $clip: 7,
              on: "audioController"
            },
            {
              $clip: 8,
              on: "audioController"
            },
            {
              $clip: 9,
              on: "audioController"
            },
            {
              $clip: 10,
              on: "audioController"
            },
            {
              $clip: 11,
              on: "audioController"
            },
            {
              $clip: 12,
              on: "audioController"
            },
            {
              $clip: 13,
              on: "audioController"
            }
          ],
          DrawMatch: {
            $clip: 18,
            on: "audioController"
          },
          FlipCard: [
            {
              $clip: 23,
              on: "audioController"
            },
            {
              $clip: 24,
              on: "audioController"
            },
            {
              $clip: 25,
              on: "audioController"
            },
            {
              $clip: 26,
              on: "audioController"
            },
            {
              $clip: 27,
              on: "audioController"
            }
          ],
          LoseMatch: {
            $clip: 17,
            on: "audioController"
          },
          ReleaseControl: {
            $clip: 22,
            on: "audioController"
          },
          SplitDeck: {
            $clip: 14,
            on: "audioController"
          },
          Stand: {
            $clip: 15,
            on: "audioController"
          },
          StartActivePlay: {
            $clip: 1,
            on: "audioController"
          },
          StartMatch: {
            $clip: 0,
            on: "audioController"
          },
          TakeControl: {
            $clip: 21,
            on: "audioController"
          },
          UIInteract: {
            $clip: 28,
            on: "audioController"
          },
          WinMatch: {
            $clip: 16,
            on: "audioController"
          }
        },
        id: "audio",
        object: "audioController",
        type: "AudioController"
      },
      {
        fields: {
          AudioController: {
            $beh: "audio"
          },
          DealerUI: {
            $beh: "dealerUI"
          },
          GameController: {
            $beh: "ctrl"
          },
          Players: [
            {
              $beh: "p0"
            },
            {
              $beh: "p1"
            },
            {
              $beh: "p2"
            },
            {
              $beh: "p3"
            },
            {
              $beh: "p4"
            },
            {
              $beh: "p5"
            },
            {
              $beh: "p6"
            }
          ],
          TurnOff: [
            {
              $obj: "dealerCamera"
            },
            {
              $obj: "manualCanvas"
            },
            {
              $obj: "autoCanvas"
            },
            {
              $obj: "tableCanvas"
            },
            {
              $obj: "resetButton"
            }
          ]
        },
        id: "distance",
        object: "distance",
        type: "DistanceOptimizer"
      },
      {
        fields: {
          panel: {
            $obj: "creditsPanel"
          }
        },
        id: "b1",
        object: "creditsButton",
        type: "CreditsPanel"
      }
    ],
    bundles: {
      android: "",
      windows: ""
    },
    events: [
      {
        behaviour: "p0",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p0_dHitNormal"
      },
      {
        behaviour: "p0",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p0_dHitSplit"
      },
      {
        behaviour: "p0",
        kind: "click",
        method: "Stand",
        object: "p0_dStand"
      },
      {
        behaviour: "p1",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p1_dHitNormal"
      },
      {
        behaviour: "p1",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p1_dHitSplit"
      },
      {
        behaviour: "p1",
        kind: "click",
        method: "Stand",
        object: "p1_dStand"
      },
      {
        behaviour: "p2",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p2_dHitNormal"
      },
      {
        behaviour: "p2",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p2_dHitSplit"
      },
      {
        behaviour: "p2",
        kind: "click",
        method: "Stand",
        object: "p2_dStand"
      },
      {
        behaviour: "p3",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p3_dHitNormal"
      },
      {
        behaviour: "p3",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p3_dHitSplit"
      },
      {
        behaviour: "p3",
        kind: "click",
        method: "Stand",
        object: "p3_dStand"
      },
      {
        behaviour: "p4",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p4_dHitNormal"
      },
      {
        behaviour: "p4",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p4_dHitSplit"
      },
      {
        behaviour: "p4",
        kind: "click",
        method: "Stand",
        object: "p4_dStand"
      },
      {
        behaviour: "p5",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p5_dHitNormal"
      },
      {
        behaviour: "p5",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p5_dHitSplit"
      },
      {
        behaviour: "p5",
        kind: "click",
        method: "Stand",
        object: "p5_dStand"
      },
      {
        behaviour: "p6",
        kind: "click",
        method: "_ManualNormalHitMe",
        object: "p6_dHitNormal"
      },
      {
        behaviour: "p6",
        kind: "click",
        method: "_ManualSplitHitMe",
        object: "p6_dHitSplit"
      },
      {
        behaviour: "p6",
        kind: "click",
        method: "Stand",
        object: "p6_dStand"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_TakeOwnership",
        object: "takeOwnership"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_TakeOwnership",
        object: "takeOwnershipManual"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "GlobalStartMatch",
        object: "startGame"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "GlobalStartMatch",
        object: "startGameManual"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ToggleManualPlay",
        object: "swapToManual"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ToggleManualPlay",
        object: "swapToAuto"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ActivateHelpers",
        object: "helpersOnBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_DeactivateHelpers",
        object: "helpersOffBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ActivateChips",
        object: "chipsOnBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_DeactivateChips",
        object: "chipsOffBtn"
      },
      {
        behaviour: "deck",
        kind: "click",
        method: "AddDeck",
        object: "deckAdd"
      },
      {
        behaviour: "deck",
        kind: "click",
        method: "SubtractDeck",
        object: "deckSub"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ActivateHelpers",
        object: "mhelpersOnBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_DeactivateHelpers",
        object: "mhelpersOffBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_ActivateChips",
        object: "mchipsOnBtn"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "_DeactivateChips",
        object: "mchipsOffBtn"
      },
      {
        behaviour: "deck",
        kind: "click",
        method: "AddDeck",
        object: "mdeckAdd"
      },
      {
        behaviour: "deck",
        kind: "click",
        method: "SubtractDeck",
        object: "mdeckSub"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "ForceGlobalReset",
        object: "resetTable"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "ResetChips",
        object: "resetChips"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "RaiseDealerPanels",
        object: "heightUp"
      },
      {
        behaviour: "ctrl",
        kind: "click",
        method: "LowerDealerPanels",
        object: "heightDown"
      },
      {
        behaviour: "b1",
        kind: "click",
        method: "Toggle",
        object: "creditsPanel"
      }
    ],
    hash: "dacc020a362cd24696a285d71de32c2c617533fe",
    objects: {
      audio: {
        click: false,
        grab: false,
        path: "Table/Audio Controller/Audio",
        seat: false,
        sync: "none"
      },
      audioController: {
        click: false,
        grab: false,
        path: "Table/Audio Controller",
        seat: false,
        sync: "none"
      },
      autoCanvas: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas",
        seat: false,
        sync: "none"
      },
      autoIdle: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Idle",
        seat: false,
        sync: "none"
      },
      autoOwner: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner",
        seat: false,
        sync: "none"
      },
      chipAudio: {
        click: false,
        grab: false,
        path: "System/Chip Controller/Audio",
        seat: false,
        sync: "none"
      },
      chipController: {
        click: false,
        grab: false,
        path: "System/Chip Controller",
        seat: false,
        sync: "none"
      },
      chipToggle: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Use Chips",
        seat: false,
        sync: "none"
      },
      chipsAnimator: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator2: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator3: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator4: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator6: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsAnimator7: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator",
        seat: false,
        sync: "none"
      },
      chipsOffBtn: {
        active: false,
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Use Chips/Use Chips Off",
        seat: false,
        sync: "none"
      },
      chipsOnBtn: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Use Chips/Use Chips On",
        seat: false,
        sync: "none"
      },
      controller: {
        click: false,
        grab: false,
        path: "Table/Game Controller",
        seat: false,
        sync: "none"
      },
      creditsButton: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/CreditsButton",
        seat: false,
        sync: "none"
      },
      creditsPanel: {
        active: false,
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/CreditsPanel",
        seat: false,
        sync: "none"
      },
      d0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/1/Card",
        seat: false,
        sync: "none"
      },
      d0f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/2/Card",
        seat: false,
        sync: "none"
      },
      d10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/11/Card",
        seat: false,
        sync: "none"
      },
      d10f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d1f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/3/Card",
        seat: false,
        sync: "none"
      },
      d2f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/4/Card",
        seat: false,
        sync: "none"
      },
      d3f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/5/Card",
        seat: false,
        sync: "none"
      },
      d4f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/6/Card",
        seat: false,
        sync: "none"
      },
      d5f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/7/Card",
        seat: false,
        sync: "none"
      },
      d6f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/8/Card",
        seat: false,
        sync: "none"
      },
      d7f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/9/Card",
        seat: false,
        sync: "none"
      },
      d8f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      d9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/10/Card",
        seat: false,
        sync: "none"
      },
      d9f: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      dealCheck: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/DealCheck",
        seat: false,
        sync: "none"
      },
      dealCheckText: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/DealCheck/Text",
        seat: false,
        sync: "none"
      },
      dealer: {
        click: false,
        grab: false,
        path: "Table/Dealer",
        seat: false,
        sync: "none"
      },
      dealerCamera: {
        click: false,
        grab: false,
        path: "Table/Dealer Camera",
        seat: false,
        sync: "none"
      },
      dealerUI: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller",
        seat: false,
        sync: "none"
      },
      dealerValues: {
        click: false,
        grab: false,
        path: "Table/Dealer Camera/Dealer Card Canvas/Dealer Values",
        seat: false,
        sync: "none"
      },
      dealerValuesCanvas: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer Camera/Dealer Card Canvas",
        seat: false,
        sync: "none"
      },
      deck: {
        click: false,
        grab: false,
        path: "Table/Deck",
        seat: false,
        sync: "none"
      },
      deckAdd: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Deck Count/Add",
        seat: false,
        sync: "none"
      },
      deckChanger: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Deck Count",
        seat: false,
        sync: "none"
      },
      deckCount: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Deck Count/Count/Text (TMP)",
        seat: false,
        sync: "none"
      },
      deckSub: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Deck Count/Subtract",
        seat: false,
        sync: "none"
      },
      distance: {
        click: false,
        grab: false,
        path: "Table/Distance Optimizer",
        seat: false,
        sync: "none"
      },
      heightAnim: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Height Adjustment",
        seat: false,
        sync: "none"
      },
      heightDown: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Height Adjustment/Down",
        seat: false,
        sync: "none"
      },
      heightGroup: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Height Adjustment",
        seat: false,
        sync: "none"
      },
      heightUp: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Height Adjustment/Up",
        seat: false,
        sync: "none"
      },
      helpersChanger: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Helpers",
        seat: false,
        sync: "none"
      },
      helpersOffBtn: {
        active: false,
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Helpers/Use Helpers Off",
        seat: false,
        sync: "none"
      },
      helpersOnBtn: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Helpers/Use Helpers On",
        seat: false,
        sync: "none"
      },
      manualCanvas: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas",
        seat: false,
        sync: "none"
      },
      manualNotOwner: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Not Owner",
        seat: false,
        sync: "none"
      },
      manualOwner: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Owner",
        seat: false,
        sync: "none"
      },
      manualSettings: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings",
        seat: false,
        sync: "none"
      },
      mchipToggle: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Use Chips",
        seat: false,
        sync: "none"
      },
      mchipsOffBtn: {
        active: false,
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Use Chips/Use Chips Off",
        seat: false,
        sync: "none"
      },
      mchipsOnBtn: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Use Chips/Use Chips On",
        seat: false,
        sync: "none"
      },
      mdeckAdd: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Deck Count/Add",
        seat: false,
        sync: "none"
      },
      mdeckChanger: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Deck Count",
        seat: false,
        sync: "none"
      },
      mdeckCount: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Deck Count/Count/Text (TMP)",
        seat: false,
        sync: "none"
      },
      mdeckSub: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Deck Count/Subtract",
        seat: false,
        sync: "none"
      },
      mhelpersChanger: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Helpers",
        seat: false,
        sync: "none"
      },
      mhelpersOffBtn: {
        active: false,
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Helpers/Use Helpers Off",
        seat: false,
        sync: "none"
      },
      mhelpersOnBtn: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Settings/Helpers/Use Helpers On",
        seat: false,
        sync: "none"
      },
      obj1: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/1",
        seat: false,
        sync: "none"
      },
      obj10: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/10",
        seat: false,
        sync: "none"
      },
      obj1010: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj1011: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj1012: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj1013: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj1014: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj1015: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj102: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj103: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj104: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj105: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj106: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj107: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj108: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/10",
        seat: false,
        sync: "none"
      },
      obj109: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/10",
        seat: false,
        sync: "none"
      },
      obj11: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/11",
        seat: false,
        sync: "none"
      },
      obj110: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj111: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj1110: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj1111: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj1112: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj1113: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj1114: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj1115: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj112: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj113: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj114: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj115: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj116: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj117: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj118: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/11",
        seat: false,
        sync: "none"
      },
      obj119: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/11",
        seat: false,
        sync: "none"
      },
      obj12: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj120: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj121: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj122: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj123: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj13: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj14: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj15: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj16: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj17: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj18: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/1",
        seat: false,
        sync: "none"
      },
      obj19: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/1",
        seat: false,
        sync: "none"
      },
      obj2: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/2",
        seat: false,
        sync: "none"
      },
      obj210: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj211: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj212: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj213: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj214: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj215: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj22: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj23: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj24: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj25: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj26: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj27: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj28: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/2",
        seat: false,
        sync: "none"
      },
      obj29: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/2",
        seat: false,
        sync: "none"
      },
      obj3: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/3",
        seat: false,
        sync: "none"
      },
      obj310: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj311: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj312: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj313: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj314: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj315: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj32: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj33: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj34: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj35: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj36: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj37: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj38: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/3",
        seat: false,
        sync: "none"
      },
      obj39: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/3",
        seat: false,
        sync: "none"
      },
      obj4: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/4",
        seat: false,
        sync: "none"
      },
      obj410: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj411: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj412: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj413: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj414: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj415: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj42: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj43: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj44: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj45: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj46: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj47: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj48: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/4",
        seat: false,
        sync: "none"
      },
      obj49: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/4",
        seat: false,
        sync: "none"
      },
      obj5: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/5",
        seat: false,
        sync: "none"
      },
      obj510: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj511: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj512: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj513: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj514: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj515: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj52: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj53: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj54: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj55: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj56: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj57: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj58: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/5",
        seat: false,
        sync: "none"
      },
      obj59: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/5",
        seat: false,
        sync: "none"
      },
      obj6: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/6",
        seat: false,
        sync: "none"
      },
      obj610: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj611: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj612: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj613: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj614: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj615: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj62: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj63: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj64: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj65: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj66: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj67: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj68: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/6",
        seat: false,
        sync: "none"
      },
      obj69: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/6",
        seat: false,
        sync: "none"
      },
      obj7: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/7",
        seat: false,
        sync: "none"
      },
      obj710: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj711: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj712: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj713: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj714: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj715: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj72: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj73: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj74: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj75: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj76: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj77: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj78: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/7",
        seat: false,
        sync: "none"
      },
      obj79: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/7",
        seat: false,
        sync: "none"
      },
      obj8: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/8",
        seat: false,
        sync: "none"
      },
      obj810: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj811: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj812: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj813: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj814: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj815: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj82: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj83: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj84: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj85: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj86: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj87: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj88: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/8",
        seat: false,
        sync: "none"
      },
      obj89: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/8",
        seat: false,
        sync: "none"
      },
      obj9: {
        click: false,
        grab: false,
        path: "Table/Dealer/Card Positions/9",
        seat: false,
        sync: "none"
      },
      obj910: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj911: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj912: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj913: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj914: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj915: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj92: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj93: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj94: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj95: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj96: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj97: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      obj98: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/9",
        seat: false,
        sync: "none"
      },
      obj99: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/9",
        seat: false,
        sync: "none"
      },
      p0: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0",
        seat: false,
        sync: "none"
      },
      p0_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p0_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p0_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p0_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p0_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p0_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p0_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p0_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p0_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p0_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p0_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel",
        seat: false,
        sync: "none"
      },
      p0_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p0_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p0_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p0_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p0_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p0_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p0_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p0_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p0_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p0_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p0_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p0_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p0_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p0_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p0_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p0_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p0_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p0_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p0_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p0_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p0_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p0_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Normal Deck",
        seat: false,
        sync: "none"
      },
      p0_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p0_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p0_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p0_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p0_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p0_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p0_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p0_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p0_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p0_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p0_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p0_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p0_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p0_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p0_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p0_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p0_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Split Deck",
        seat: false,
        sync: "none"
      },
      p0_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p0_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p0_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p0_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p0_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI",
        seat: false,
        sync: "none"
      },
      p0_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p0_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p0_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p0_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p0_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p0_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p0_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p0_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p0_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p0_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p0_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 0/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p1: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1",
        seat: false,
        sync: "none"
      },
      p1_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p1_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p1_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p1_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p1_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p1_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p1_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p1_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p1_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p1_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p1_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel",
        seat: false,
        sync: "none"
      },
      p1_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p1_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p1_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p1_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p1_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p1_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p1_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p1_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p1_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p1_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p1_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p1_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p1_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p1_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p1_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p1_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p1_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p1_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p1_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p1_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p1_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p1_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Normal Deck",
        seat: false,
        sync: "none"
      },
      p1_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p1_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p1_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p1_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p1_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p1_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p1_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p1_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p1_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p1_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p1_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p1_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p1_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p1_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p1_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p1_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p1_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Split Deck",
        seat: false,
        sync: "none"
      },
      p1_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p1_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p1_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p1_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p1_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI",
        seat: false,
        sync: "none"
      },
      p1_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p1_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p1_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p1_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p1_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p1_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p1_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p1_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p1_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p1_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p1_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 1/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p2: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2",
        seat: false,
        sync: "none"
      },
      p2_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p2_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p2_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p2_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p2_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p2_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p2_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p2_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p2_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p2_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p2_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel",
        seat: false,
        sync: "none"
      },
      p2_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p2_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p2_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p2_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p2_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p2_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p2_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p2_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p2_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p2_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p2_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p2_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p2_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p2_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p2_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p2_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p2_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p2_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p2_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p2_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p2_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p2_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Normal Deck",
        seat: false,
        sync: "none"
      },
      p2_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p2_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p2_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p2_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p2_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p2_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p2_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p2_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p2_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p2_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p2_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p2_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p2_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p2_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p2_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p2_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p2_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Split Deck",
        seat: false,
        sync: "none"
      },
      p2_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p2_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p2_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p2_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p2_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI",
        seat: false,
        sync: "none"
      },
      p2_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p2_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p2_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p2_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p2_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p2_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p2_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p2_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p2_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p2_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p2_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 2/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p3: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3",
        seat: false,
        sync: "none"
      },
      p3_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p3_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p3_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p3_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p3_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p3_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p3_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p3_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p3_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p3_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p3_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel",
        seat: false,
        sync: "none"
      },
      p3_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p3_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p3_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p3_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p3_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p3_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p3_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p3_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p3_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p3_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p3_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p3_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p3_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p3_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p3_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p3_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p3_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p3_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p3_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p3_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p3_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p3_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Normal Deck",
        seat: false,
        sync: "none"
      },
      p3_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p3_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p3_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p3_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p3_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p3_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p3_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p3_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p3_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p3_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p3_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p3_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p3_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p3_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p3_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p3_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p3_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Split Deck",
        seat: false,
        sync: "none"
      },
      p3_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p3_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p3_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p3_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p3_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI",
        seat: false,
        sync: "none"
      },
      p3_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p3_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p3_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p3_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p3_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p3_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p3_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p3_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p3_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p3_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p3_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 3/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p4: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4",
        seat: false,
        sync: "none"
      },
      p4_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p4_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p4_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p4_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p4_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p4_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p4_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p4_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p4_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p4_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p4_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel",
        seat: false,
        sync: "none"
      },
      p4_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p4_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p4_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p4_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p4_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p4_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p4_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p4_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p4_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p4_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p4_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p4_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p4_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p4_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p4_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p4_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p4_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p4_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p4_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p4_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p4_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p4_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Normal Deck",
        seat: false,
        sync: "none"
      },
      p4_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p4_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p4_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p4_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p4_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p4_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p4_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p4_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p4_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p4_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p4_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p4_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p4_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p4_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p4_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p4_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p4_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Split Deck",
        seat: false,
        sync: "none"
      },
      p4_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p4_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p4_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p4_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p4_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI",
        seat: false,
        sync: "none"
      },
      p4_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p4_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p4_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p4_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p4_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p4_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p4_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p4_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p4_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p4_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p4_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 4/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5",
        seat: false,
        sync: "none"
      },
      p5_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p5_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p5_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p5_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p5_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p5_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p5_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p5_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p5_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p5_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p5_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel",
        seat: false,
        sync: "none"
      },
      p5_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p5_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p5_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p5_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p5_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p5_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p5_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p5_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p5_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p5_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p5_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p5_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p5_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p5_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p5_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p5_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p5_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p5_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p5_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p5_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p5_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p5_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Normal Deck",
        seat: false,
        sync: "none"
      },
      p5_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p5_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p5_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p5_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p5_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p5_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p5_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p5_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p5_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p5_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p5_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p5_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p5_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p5_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p5_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p5_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p5_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Split Deck",
        seat: false,
        sync: "none"
      },
      p5_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p5_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p5_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p5_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p5_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI",
        seat: false,
        sync: "none"
      },
      p5_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p5_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p5_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p5_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p5_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p5_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p5_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p5_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p5_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p5_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p5_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 5/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      p6: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6",
        seat: false,
        sync: "none"
      },
      p6_bAdd10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Add 10",
        seat: false,
        sync: "none"
      },
      p6_bAdd5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Add 5",
        seat: false,
        sync: "none"
      },
      p6_bHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Hit Normal",
        seat: false,
        sync: "none"
      },
      p6_bHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Hit Split",
        seat: false,
        sync: "none"
      },
      p6_bJoin: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Join Game",
        seat: false,
        sync: "none"
      },
      p6_bLeave: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Leave Game",
        seat: false,
        sync: "none"
      },
      p6_bRemove10: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Remove 10",
        seat: false,
        sync: "none"
      },
      p6_bRemove5: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Remove 5",
        seat: false,
        sync: "none"
      },
      p6_bSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Split",
        seat: false,
        sync: "none"
      },
      p6_bStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller/Stand",
        seat: false,
        sync: "none"
      },
      p6_chips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel",
        seat: false,
        sync: "none"
      },
      p6_currentBet: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Mask/Current Bet/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p6_dHitNormal: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/HIT",
        seat: false,
        sync: "none"
      },
      p6_dHitSplit: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/HIT",
        seat: false,
        sync: "none"
      },
      p6_dStand: {
        click: true,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/Stand",
        seat: false,
        sync: "none"
      },
      p6_dealerCanvas: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas",
        seat: false,
        sync: "none"
      },
      p6_dealerMask: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask",
        seat: false,
        sync: "none"
      },
      p6_dealerName: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/PLAYER NAME",
        seat: false,
        sync: "none"
      },
      p6_ic: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Interactable Controller",
        seat: false,
        sync: "none"
      },
      p6_n0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p6_n0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p6_n10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p6_n10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p6_n2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p6_n3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p6_n4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p6_n5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p6_n6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p6_n7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p6_n8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_n9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p6_n9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_nameObj: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Not Owner UI/Player Name",
        seat: false,
        sync: "none"
      },
      p6_nameText: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Not Owner UI/Player Name/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p6_nd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Normal Deck",
        seat: false,
        sync: "none"
      },
      p6_normalCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/Normal Mask/Normal/COUNT",
        seat: false,
        sync: "none"
      },
      p6_normalHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Normal Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p6_notOwnerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Not Owner UI/Player Idle",
        seat: false,
        sync: "none"
      },
      p6_ownerUI: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Owner UI",
        seat: false,
        sync: "none"
      },
      p6_s0: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/1/Card",
        seat: false,
        sync: "none"
      },
      p6_s0f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/1/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s1: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/2/Card",
        seat: false,
        sync: "none"
      },
      p6_s10: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/11/Card",
        seat: false,
        sync: "none"
      },
      p6_s10f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/11/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s1f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/2/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s2: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/3/Card",
        seat: false,
        sync: "none"
      },
      p6_s2f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/3/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s3: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/4/Card",
        seat: false,
        sync: "none"
      },
      p6_s3f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/4/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s4: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/5/Card",
        seat: false,
        sync: "none"
      },
      p6_s4f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/5/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s5: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/6/Card",
        seat: false,
        sync: "none"
      },
      p6_s5f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/6/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s6: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/7/Card",
        seat: false,
        sync: "none"
      },
      p6_s6f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/7/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s7: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/8/Card",
        seat: false,
        sync: "none"
      },
      p6_s7f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/8/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s8: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/9/Card",
        seat: false,
        sync: "none"
      },
      p6_s8f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/9/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_s9: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/10/Card",
        seat: false,
        sync: "none"
      },
      p6_s9f: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Card Position Animator/Split Positions/10/Card/Viz/Card",
        seat: false,
        sync: "none"
      },
      p6_sd: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Split Deck",
        seat: false,
        sync: "none"
      },
      p6_splitCount: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Dealer Player UI Canvas/Mask/Game Active/Split Mask/Split/COUNT",
        seat: false,
        sync: "none"
      },
      p6_splitHelper: {
        active: false,
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Split Adjustment/HELPER",
        seat: false,
        sync: "none"
      },
      p6_timer: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Timer/Timer",
        seat: false,
        sync: "none"
      },
      p6_totalChips: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Total Chips/Total/Text (TMP)",
        seat: false,
        sync: "none"
      },
      p6_ui: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI",
        seat: false,
        sync: "none"
      },
      p6_uiAnim: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI",
        seat: false,
        sync: "none"
      },
      p6_vizAdd10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10",
        seat: false,
        sync: "none"
      },
      p6_vizAdd5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5",
        seat: false,
        sync: "none"
      },
      p6_vizHitNormal: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL",
        seat: false,
        sync: "none"
      },
      p6_vizHitSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT",
        seat: false,
        sync: "none"
      },
      p6_vizJoin: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Not Owner UI/Player Idle/JOIN",
        seat: false,
        sync: "none"
      },
      p6_vizLeave: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Owner UI/Player UI Canvas (1)/LEAVE",
        seat: false,
        sync: "none"
      },
      p6_vizRemove10: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10",
        seat: false,
        sync: "none"
      },
      p6_vizRemove5: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5",
        seat: false,
        sync: "none"
      },
      p6_vizSplit: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT",
        seat: false,
        sync: "none"
      },
      p6_vizStand: {
        click: false,
        grab: false,
        path: "Table/Players/Players/Player 6/Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND",
        seat: false,
        sync: "none"
      },
      resetButton: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Reset Button",
        seat: false,
        sync: "none"
      },
      resetChips: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Reset Button/Reset Chips",
        seat: false,
        sync: "none"
      },
      resetTable: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Reset Button/Take Ownership",
        seat: false,
        sync: "none"
      },
      startGame: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Start Game",
        seat: false,
        sync: "none"
      },
      startGameManual: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Owner/Start Game",
        seat: false,
        sync: "none"
      },
      swapToAuto: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Owner/Swap to AI Play",
        seat: false,
        sync: "none"
      },
      swapToManual: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Game Settings/Manual Play/Swap to Manual",
        seat: false,
        sync: "none"
      },
      system: {
        click: false,
        grab: false,
        path: "System",
        seat: false,
        sync: "none"
      },
      table: {
        click: false,
        grab: false,
        path: "Table",
        seat: false,
        sync: "none"
      },
      tableCanvas: {
        click: false,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Dealer Table Canvas",
        seat: false,
        sync: "none"
      },
      takeOwnership: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Auto Canvas/Mask/Idle/Take Ownership",
        seat: false,
        sync: "none"
      },
      takeOwnershipManual: {
        click: true,
        grab: false,
        path: "Table/Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Not Owner/Take Ownership",
        seat: false,
        sync: "none"
      }
    },
    refs: [
      "tableCanvas",
      "autoCanvas",
      "autoOwner",
      "autoIdle",
      "manualCanvas",
      "manualOwner",
      "manualNotOwner",
      "heightGroup",
      "heightAnim",
      "manualSettings",
      "resetButton",
      "dealerCamera",
      "dealerValuesCanvas",
      "dealerValues",
      "helpersChanger",
      "chipToggle",
      "deckChanger",
      "deckCount",
      "deckSub",
      "helpersOnBtn",
      "helpersOffBtn",
      "chipsOnBtn",
      "chipsOffBtn",
      "mhelpersChanger",
      "mchipToggle",
      "mdeckChanger",
      "mdeckCount",
      "mdeckSub",
      "mhelpersOnBtn",
      "mhelpersOffBtn",
      "mchipsOnBtn",
      "mchipsOffBtn",
      "dealCheck",
      "dealCheckText",
      "d0",
      "d0f",
      "d1",
      "d1f",
      "d2",
      "d2f",
      "d3",
      "d3f",
      "d4",
      "d4f",
      "d5",
      "d5f",
      "d6",
      "d6f",
      "d7",
      "d7f",
      "d8",
      "d8f",
      "d9",
      "d9f",
      "d10",
      "d10f",
      "p0_n0",
      "p0_n0f",
      "p0_s0",
      "p0_s0f",
      "p0_n1",
      "p0_n1f",
      "p0_s1",
      "p0_s1f",
      "p0_n2",
      "p0_n2f",
      "p0_s2",
      "p0_s2f",
      "p0_n3",
      "p0_n3f",
      "p0_s3",
      "p0_s3f",
      "p0_n4",
      "p0_n4f",
      "p0_s4",
      "p0_s4f",
      "p0_n5",
      "p0_n5f",
      "p0_s5",
      "p0_s5f",
      "p0_n6",
      "p0_n6f",
      "p0_s6",
      "p0_s6f",
      "p0_n7",
      "p0_n7f",
      "p0_s7",
      "p0_s7f",
      "p0_n8",
      "p0_n8f",
      "p0_s8",
      "p0_s8f",
      "p0_n9",
      "p0_n9f",
      "p0_s9",
      "p0_s9f",
      "p0_n10",
      "p0_n10f",
      "p0_s10",
      "p0_s10f",
      "p1_n0",
      "p1_n0f",
      "p1_s0",
      "p1_s0f",
      "p1_n1",
      "p1_n1f",
      "p1_s1",
      "p1_s1f",
      "p1_n2",
      "p1_n2f",
      "p1_s2",
      "p1_s2f",
      "p1_n3",
      "p1_n3f",
      "p1_s3",
      "p1_s3f",
      "p1_n4",
      "p1_n4f",
      "p1_s4",
      "p1_s4f",
      "p1_n5",
      "p1_n5f",
      "p1_s5",
      "p1_s5f",
      "p1_n6",
      "p1_n6f",
      "p1_s6",
      "p1_s6f",
      "p1_n7",
      "p1_n7f",
      "p1_s7",
      "p1_s7f",
      "p1_n8",
      "p1_n8f",
      "p1_s8",
      "p1_s8f",
      "p1_n9",
      "p1_n9f",
      "p1_s9",
      "p1_s9f",
      "p1_n10",
      "p1_n10f",
      "p1_s10",
      "p1_s10f",
      "p2_n0",
      "p2_n0f",
      "p2_s0",
      "p2_s0f",
      "p2_n1",
      "p2_n1f",
      "p2_s1",
      "p2_s1f",
      "p2_n2",
      "p2_n2f",
      "p2_s2",
      "p2_s2f",
      "p2_n3",
      "p2_n3f",
      "p2_s3",
      "p2_s3f",
      "p2_n4",
      "p2_n4f",
      "p2_s4",
      "p2_s4f",
      "p2_n5",
      "p2_n5f",
      "p2_s5",
      "p2_s5f",
      "p2_n6",
      "p2_n6f",
      "p2_s6",
      "p2_s6f",
      "p2_n7",
      "p2_n7f",
      "p2_s7",
      "p2_s7f",
      "p2_n8",
      "p2_n8f",
      "p2_s8",
      "p2_s8f",
      "p2_n9",
      "p2_n9f",
      "p2_s9",
      "p2_s9f",
      "p2_n10",
      "p2_n10f",
      "p2_s10",
      "p2_s10f",
      "p3_n0",
      "p3_n0f",
      "p3_s0",
      "p3_s0f",
      "p3_n1",
      "p3_n1f",
      "p3_s1",
      "p3_s1f",
      "p3_n2",
      "p3_n2f",
      "p3_s2",
      "p3_s2f",
      "p3_n3",
      "p3_n3f",
      "p3_s3",
      "p3_s3f",
      "p3_n4",
      "p3_n4f",
      "p3_s4",
      "p3_s4f",
      "p3_n5",
      "p3_n5f",
      "p3_s5",
      "p3_s5f",
      "p3_n6",
      "p3_n6f",
      "p3_s6",
      "p3_s6f",
      "p3_n7",
      "p3_n7f",
      "p3_s7",
      "p3_s7f",
      "p3_n8",
      "p3_n8f",
      "p3_s8",
      "p3_s8f",
      "p3_n9",
      "p3_n9f",
      "p3_s9",
      "p3_s9f",
      "p3_n10",
      "p3_n10f",
      "p3_s10",
      "p3_s10f",
      "p4_n0",
      "p4_n0f",
      "p4_s0",
      "p4_s0f",
      "p4_n1",
      "p4_n1f",
      "p4_s1",
      "p4_s1f",
      "p4_n2",
      "p4_n2f",
      "p4_s2",
      "p4_s2f",
      "p4_n3",
      "p4_n3f",
      "p4_s3",
      "p4_s3f",
      "p4_n4",
      "p4_n4f",
      "p4_s4",
      "p4_s4f",
      "p4_n5",
      "p4_n5f",
      "p4_s5",
      "p4_s5f",
      "p4_n6",
      "p4_n6f",
      "p4_s6",
      "p4_s6f",
      "p4_n7",
      "p4_n7f",
      "p4_s7",
      "p4_s7f",
      "p4_n8",
      "p4_n8f",
      "p4_s8",
      "p4_s8f",
      "p4_n9",
      "p4_n9f",
      "p4_s9",
      "p4_s9f",
      "p4_n10",
      "p4_n10f",
      "p4_s10",
      "p4_s10f",
      "p5_n0",
      "p5_n0f",
      "p5_s0",
      "p5_s0f",
      "p5_n1",
      "p5_n1f",
      "p5_s1",
      "p5_s1f",
      "p5_n2",
      "p5_n2f",
      "p5_s2",
      "p5_s2f",
      "p5_n3",
      "p5_n3f",
      "p5_s3",
      "p5_s3f",
      "p5_n4",
      "p5_n4f",
      "p5_s4",
      "p5_s4f",
      "p5_n5",
      "p5_n5f",
      "p5_s5",
      "p5_s5f",
      "p5_n6",
      "p5_n6f",
      "p5_s6",
      "p5_s6f",
      "p5_n7",
      "p5_n7f",
      "p5_s7",
      "p5_s7f",
      "p5_n8",
      "p5_n8f",
      "p5_s8",
      "p5_s8f",
      "p5_n9",
      "p5_n9f",
      "p5_s9",
      "p5_s9f",
      "p5_n10",
      "p5_n10f",
      "p5_s10",
      "p5_s10f",
      "p6_n0",
      "p6_n0f",
      "p6_s0",
      "p6_s0f",
      "p6_n1",
      "p6_n1f",
      "p6_s1",
      "p6_s1f",
      "p6_n2",
      "p6_n2f",
      "p6_s2",
      "p6_s2f",
      "p6_n3",
      "p6_n3f",
      "p6_s3",
      "p6_s3f",
      "p6_n4",
      "p6_n4f",
      "p6_s4",
      "p6_s4f",
      "p6_n5",
      "p6_n5f",
      "p6_s5",
      "p6_s5f",
      "p6_n6",
      "p6_n6f",
      "p6_s6",
      "p6_s6f",
      "p6_n7",
      "p6_n7f",
      "p6_s7",
      "p6_s7f",
      "p6_n8",
      "p6_n8f",
      "p6_s8",
      "p6_s8f",
      "p6_n9",
      "p6_n9f",
      "p6_s9",
      "p6_s9f",
      "p6_n10",
      "p6_n10f",
      "p6_s10",
      "p6_s10f",
      "p0_uiAnim",
      "p0_ownerUI",
      "p0_notOwnerUI",
      "p0_nameObj",
      "p0_nameText",
      "p0_normalHelper",
      "p0_splitHelper",
      "p0_timer",
      "p0_dealerCanvas",
      "p0_dealerMask",
      "p0_dealerName",
      "p0_normalCount",
      "p0_splitCount",
      "p0_chips",
      "p0_currentBet",
      "p0_totalChips",
      "p0_vizJoin",
      "p0_vizStand",
      "p0_vizSplit",
      "p0_vizHitSplit",
      "p0_vizHitNormal",
      "p0_vizLeave",
      "p0_vizAdd10",
      "p0_vizAdd5",
      "p0_vizRemove10",
      "p0_vizRemove5",
      "p1_uiAnim",
      "p1_ownerUI",
      "p1_notOwnerUI",
      "p1_nameObj",
      "p1_nameText",
      "p1_normalHelper",
      "p1_splitHelper",
      "p1_timer",
      "p1_dealerCanvas",
      "p1_dealerMask",
      "p1_dealerName",
      "p1_normalCount",
      "p1_splitCount",
      "p1_chips",
      "p1_currentBet",
      "p1_totalChips",
      "p1_vizJoin",
      "p1_vizStand",
      "p1_vizSplit",
      "p1_vizHitSplit",
      "p1_vizHitNormal",
      "p1_vizLeave",
      "p1_vizAdd10",
      "p1_vizAdd5",
      "p1_vizRemove10",
      "p1_vizRemove5",
      "p2_uiAnim",
      "p2_ownerUI",
      "p2_notOwnerUI",
      "p2_nameObj",
      "p2_nameText",
      "p2_normalHelper",
      "p2_splitHelper",
      "p2_timer",
      "p2_dealerCanvas",
      "p2_dealerMask",
      "p2_dealerName",
      "p2_normalCount",
      "p2_splitCount",
      "p2_chips",
      "p2_currentBet",
      "p2_totalChips",
      "p2_vizJoin",
      "p2_vizStand",
      "p2_vizSplit",
      "p2_vizHitSplit",
      "p2_vizHitNormal",
      "p2_vizLeave",
      "p2_vizAdd10",
      "p2_vizAdd5",
      "p2_vizRemove10",
      "p2_vizRemove5",
      "p3_uiAnim",
      "p3_ownerUI",
      "p3_notOwnerUI",
      "p3_nameObj",
      "p3_nameText",
      "p3_normalHelper",
      "p3_splitHelper",
      "p3_timer",
      "p3_dealerCanvas",
      "p3_dealerMask",
      "p3_dealerName",
      "p3_normalCount",
      "p3_splitCount",
      "p3_chips",
      "p3_currentBet",
      "p3_totalChips",
      "p3_vizJoin",
      "p3_vizStand",
      "p3_vizSplit",
      "p3_vizHitSplit",
      "p3_vizHitNormal",
      "p3_vizLeave",
      "p3_vizAdd10",
      "p3_vizAdd5",
      "p3_vizRemove10",
      "p3_vizRemove5",
      "p4_uiAnim",
      "p4_ownerUI",
      "p4_notOwnerUI",
      "p4_nameObj",
      "p4_nameText",
      "p4_normalHelper",
      "p4_splitHelper",
      "p4_timer",
      "p4_dealerCanvas",
      "p4_dealerMask",
      "p4_dealerName",
      "p4_normalCount",
      "p4_splitCount",
      "p4_chips",
      "p4_currentBet",
      "p4_totalChips",
      "p4_vizJoin",
      "p4_vizStand",
      "p4_vizSplit",
      "p4_vizHitSplit",
      "p4_vizHitNormal",
      "p4_vizLeave",
      "p4_vizAdd10",
      "p4_vizAdd5",
      "p4_vizRemove10",
      "p4_vizRemove5",
      "p5_uiAnim",
      "p5_ownerUI",
      "p5_notOwnerUI",
      "p5_nameObj",
      "p5_nameText",
      "p5_normalHelper",
      "p5_splitHelper",
      "p5_timer",
      "p5_dealerCanvas",
      "p5_dealerMask",
      "p5_dealerName",
      "p5_normalCount",
      "p5_splitCount",
      "p5_chips",
      "p5_currentBet",
      "p5_totalChips",
      "p5_vizJoin",
      "p5_vizStand",
      "p5_vizSplit",
      "p5_vizHitSplit",
      "p5_vizHitNormal",
      "p5_vizLeave",
      "p5_vizAdd10",
      "p5_vizAdd5",
      "p5_vizRemove10",
      "p5_vizRemove5",
      "p6_uiAnim",
      "p6_ownerUI",
      "p6_notOwnerUI",
      "p6_nameObj",
      "p6_nameText",
      "p6_normalHelper",
      "p6_splitHelper",
      "p6_timer",
      "p6_dealerCanvas",
      "p6_dealerMask",
      "p6_dealerName",
      "p6_normalCount",
      "p6_splitCount",
      "p6_chips",
      "p6_currentBet",
      "p6_totalChips",
      "p6_vizJoin",
      "p6_vizStand",
      "p6_vizSplit",
      "p6_vizHitSplit",
      "p6_vizHitNormal",
      "p6_vizLeave",
      "p6_vizAdd10",
      "p6_vizAdd5",
      "p6_vizRemove10",
      "p6_vizRemove5",
      "chipController",
      "audioController"
    ],
    schema: 1,
    slug: "blackjack"
  };

  // portkit/src/platform/bs.ts
  function pageEnv() {
    const g = globalThis;
    let storage = null;
    try {
      storage = g.localStorage ?? null;
    } catch {
      storage = null;
    }
    return {
      get BS() {
        return g.BS;
      },
      win: g.window,
      doc: g.document,
      MutationObserver: g.MutationObserver,
      storage,
      crypto: g.crypto,
      setTimeout: (fn, ms) => g.setTimeout(fn, ms),
      clearTimeout: (handle) => g.clearTimeout(handle),
      now: () => g.performance.now(),
      wallMs: () => g.Date.now(),
      random: () => g.Math.random(),
      console: g.console
    };
  }
  var DEFAULT_BS_OPTIONS = { joinTimeoutMs: 3e4, kitTimeoutMs: 12e4, kitFindMs: 2e4, userFlushMs: 200, headProbeMs: 5e3, stateBudgetBytes: 96 * 1024, stateEchoMs: 4e3, verbose: false };
  var HOST_EVENTS = {
    click: "click",
    grab: "grab",
    drop: "drop",
    triggerEnter: "trigger-enter",
    triggerExit: "trigger-exit",
    collisionEnter: "collision-enter",
    collisionExit: "collision-exit"
  };
  var DELIMITER_CODES = [182, 167, 124, 8253, 164];
  function hasDelimiter(text) {
    for (let i = 0; i < text.length; i++) if (DELIMITER_CODES.indexOf(text.charCodeAt(i)) >= 0) return true;
    return false;
  }
  var BsPlatform = class {
    constructor(env2, options = {}) {
      __publicField(this, "clock");
      __publicField(this, "limits", { ...DEFAULT_LIMITS });
      __publicField(this, "storage");
      __publicField(this, "crypto");
      __publicField(this, "env");
      __publicField(this, "options");
      __publicField(this, "scene", null);
      __publicField(this, "readyPromise", null);
      __publicField(this, "mirror", /* @__PURE__ */ new Map());
      __publicField(this, "snapshot", deferred());
      __publicField(this, "fullSeen", false);
      __publicField(this, "stateHandlers", []);
      __publicField(this, "errorHandlers", []);
      __publicField(this, "userHandlers", []);
      __publicField(this, "oneShotHandlers", []);
      __publicField(this, "playerHandlers", []);
      __publicField(this, "sessionHandlers", []);
      __publicField(this, "snippetHandlers", []);
      __publicField(this, "poseHandlers", []);
      __publicField(this, "teleportHandlers", []);
      __publicField(this, "headReading", null);
      __publicField(this, "inputHandlers", []);
      __publicField(this, "wrappers", /* @__PURE__ */ new WeakMap());
      /** uid -> the page's UserData object for everyone in the room. */
      __publicField(this, "roster", /* @__PURE__ */ new Map());
      __publicField(this, "pendingPublic", null);
      __publicField(this, "pendingProtected", null);
      /** Turns of writes not handed to the app yet (each turn is one action's writes: kept together while it fits). */
      __publicField(this, "stateQueue", []);
      /** Handed to the app, not yet seen back: path -> bytes and when. */
      __publicField(this, "unechoed", /* @__PURE__ */ new Map());
      __publicField(this, "unechoedBytes", 0);
      __publicField(this, "stateTimer", 0);
      __publicField(this, "warnedSplit", false);
      /** For tests and diagnostics: handoffs to the app, and the largest one in bytes. */
      __publicField(this, "stateStats", { handoffs: 0, largest: 0, deferred: 0 });
      __publicField(this, "pendingUser", /* @__PURE__ */ new Map());
      __publicField(this, "userTimer", 0);
      __publicField(this, "userLastFlush", -Infinity);
      __publicField(this, "userBackoff", 0);
      /** Own user state when the app has no user state to offer (Play mode on your own). */
      __publicField(this, "localUser", null);
      __publicField(this, "ownUser", /* @__PURE__ */ new Map());
      __publicField(this, "sessionId", "");
      __publicField(this, "keyNames", null);
      __publicField(this, "observer", null);
      this.env = env2;
      this.options = { ...DEFAULT_BS_OPTIONS, ...options };
      this.crypto = env2.crypto;
      this.clock = {
        now: () => env2.now(),
        wallSeconds: () => env2.wallMs() / 1e3,
        setTimeout: (fn, ms) => env2.setTimeout(fn, ms),
        clearTimeout: (handle) => env2.clearTimeout(handle)
      };
      const store = env2.storage;
      this.storage = {
        get: (key) => store ? store.getItem(key) : null,
        set: (key, value) => {
          if (!store) throw new Error("no storage on this page");
          store.setItem(key, value);
        },
        remove: (key) => store?.removeItem(key),
        keys: (prefix) => {
          const out = [];
          if (!store) return out;
          for (let i = 0; i < store.length; i++) {
            const key = store.key(i);
            if (key !== null && key.startsWith(prefix)) out.push(key);
          }
          return out;
        }
      };
    }
    random() {
      return this.env.random();
    }
    log(level, message) {
      if (level === "debug" && !this.options.verbose) return;
      const text = "[pk1] " + message;
      if (level === "error") this.env.console.error(text);
      else if (level === "warn") this.env.console.warn(text);
      else this.env.console.log(text);
    }
    // ---- the page registry --------------------------------------------------------------------------------------
    /** `window.__pk1`: made by whichever game script comes first, shared by all of them, so kept small and stable. */
    registry() {
      const win = this.env.win;
      let registry = win.__pk1;
      if (!registry || typeof registry !== "object" || !registry.holders) {
        const made = {
          v: 1,
          games: {},
          holders: {},
          debug: {},
          clock(key, id, seconds) {
            const holder = made.holders[key];
            if (holder) holder.clock(String(id), String(seconds));
          },
          event(key, name, args) {
            const holder = made.holders[key];
            if (holder) holder.event(String(name), args === void 0 || args === null ? "" : String(args));
          }
        };
        registry = made;
        win.__pk1 = made;
      }
      return registry;
    }
    /**
     * Waits until no other kit item of this page is loading (the registry's kitTurn, a chain every game script on the page
     * joins: scripts are separate bundles, so the turn lives on window.__pk1), then holds the turn. Resolves to the call
     * that hands it on; call it once the kit item has reported loaded (or given up). A script of an older portkit on the
     * same page does not take turns, so it can still overlap the others.
     */
    async kitTurn(holderName2) {
      const registry = this.registry();
      const before = registry.kitTurn instanceof Promise ? registry.kitTurn : Promise.resolve();
      let hand;
      const mine = new Promise((resolve) => {
        hand = resolve;
      });
      registry.kitTurn = before.then(() => mine);
      const waited = this.env.now();
      await before;
      const ms = this.env.now() - waited;
      if (ms > 0) this.log("debug", `kit ${holderName2}: waited ${Math.round(ms)} ms for the other kits on the page to load`);
      let handed = false;
      return () => {
        if (handed) return;
        handed = true;
        hand();
      };
    }
    claimGame(slug, info) {
      const registry = this.registry();
      if (Object.prototype.hasOwnProperty.call(registry.games, slug)) return false;
      registry.games[slug] = info;
      return true;
    }
    /**
     * Debugging hooks (state digests, a game's own test helpers such as "remove a cup" or "make me the saboteur") reach
     * the page registry only on a test page: one that set `window.__pk1_debug = true` before the script ran (the Play-mode
     * kit test's page does). A published page never does, so a shipped script exposes nothing to call.
     */
    expose(key, hooks) {
      const registry = this.registry();
      if (hooks && this.isTestPage()) registry.debug[key] = hooks;
      else delete registry.debug[key];
    }
    isTestPage() {
      return this.env.win.__pk1_debug === true;
    }
    onRelay(key, handlers) {
      const registry = this.registry();
      const holder = {
        clock: (id, seconds) => handlers.clock(id, Number(seconds)),
        event: (name, args) => handlers.event(name, parseEventArgs(args))
      };
      registry.holders[key] = holder;
      return () => {
        if (registry.holders[key] === holder) delete registry.holders[key];
      };
    }
    relaySend(payload) {
      this.attempt("relay", () => this.scene.SendToVisualScripting(TAG, payload));
    }
    // ---- ready --------------------------------------------------------------------------------------------------
    whenReady() {
      if (!this.readyPromise) this.readyPromise = this.becomeReady();
      return this.readyPromise;
    }
    async becomeReady() {
      const { env: env2 } = this;
      const loaded = deferred();
      env2.win.addEventListener("bs-loaded", () => loaded.resolve());
      await loaded.promise;
      this.scene = env2.BS.Scene.GetInstance();
      this.listen();
      const started = env2.now();
      let warned = false;
      while (!this.joined()) {
        if (env2.now() - started > this.options.joinTimeoutMs) {
          if (!warned) this.log("warn", "the local player has not joined a room; carrying on as the only player");
          warned = true;
          break;
        }
        await this.sleep(100);
      }
      this.sessionId = this.local().sid;
      this.seedMirror();
      this.watchSession();
      this.observeSnippets();
    }
    /** The local user exists and has a real session id (it reads "local" until the room is joined). */
    joined() {
      const user = this.scene.localUser;
      return !!user && typeof user.id === "string" && user.id !== "" && user.id !== "local";
    }
    sleep(ms) {
      return new Promise((resolve) => this.env.setTimeout(resolve, ms));
    }
    watchSession() {
      const check = () => {
        const now = this.local().sid;
        if (now !== this.sessionId) {
          this.sessionId = now;
          for (const handler of this.sessionHandlers.slice()) this.attempt("session handler", handler);
        }
        this.env.setTimeout(check, 1e3);
      };
      this.env.setTimeout(check, 1e3);
    }
    listen() {
      const scene = this.scene;
      const present = scene.users ?? {};
      for (const uid of Object.keys(present)) this.roster.set(uid, present[uid]);
      const on = (name, handler) => scene.On(name, (event) => {
        try {
          handler(event ? event.detail : void 0);
        } catch (error) {
          this.log("error", `${name} handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      on("space-state", (detail) => this.onSpaceState(detail));
      on("space-state-changed", (detail) => {
        if (this.fullSeen || !detail || !Array.isArray(detail.changes)) return;
        for (const change of detail.changes) {
          if (typeof change.property !== "string" || !change.property.startsWith(TAG + ".")) continue;
          this.applyChange(change.property, typeof change.newValue === "string" ? change.newValue : void 0);
        }
      });
      on("space-state-error", (detail) => this.onStateErrorEvent(detail));
      on("user-state-error", (detail) => this.onStateErrorEvent(detail));
      on("one-shot", (detail) => {
        if (!detail || typeof detail.data !== "string") return;
        for (const handler of this.oneShotHandlers.slice()) handler(String(detail.fromId ?? ""), detail.data);
      });
      on("user-joined", (user) => this.emitPlayer("join", user));
      on("user-left", (user) => this.emitPlayer("leave", user));
      on("user-state", (detail) => {
        if (!detail || !Array.isArray(detail.changes)) return;
        const sid = String(detail.id ?? detail.user?.id ?? "");
        for (const change of detail.changes) {
          if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
          const value = change.deleted || typeof change.value !== "string" ? void 0 : change.value;
          if (sid === this.local().sid) {
            if (value === void 0) this.ownUser.delete(change.path);
            else this.ownUser.set(change.path, value);
          }
          this.emitUser(sid, change.path, value);
        }
      });
      on("player-teleported", (detail) => {
        if (!detail || !detail.position) return;
        const position = from3(detail.position);
        for (const handler of this.teleportHandlers.slice()) handler(position);
      });
      on("pose-update", (detail) => {
        if (!detail || !detail.head) return;
        const poses = { head: pose(detail.head), leftHand: pose(detail.leftHand), rightHand: pose(detail.rightHand) };
        for (const handler of this.poseHandlers.slice()) handler(poses);
      });
      const input = (event) => {
        for (const handler of this.inputHandlers.slice()) handler(event);
      };
      on("button-pressed", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: true }));
      on("button-released", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: false }));
      on("controller-axis-update", (d) => input({ type: "thumbstick", side: clampInt(d.hand, 1), x: Number(d.x) || 0, y: Number(d.y) || 0 }));
      on("trigger-axis-update", (d) => input({ type: "trigger", side: clampInt(d.hand, 1), value: Number(d.value) || 0 }));
      on("key-press", (d) => input({ type: "key", key: this.keyName(d.key), pressed: true }));
      on("key-release", (d) => input({ type: "key", key: this.keyName(d.key), pressed: false }));
    }
    keyName(code) {
      if (!this.keyNames) {
        this.keyNames = {};
        const codes = this.env.BS.KeyCode ?? {};
        for (const name of Object.keys(codes)) if (typeof codes[name] === "number") this.keyNames[codes[name]] = name;
      }
      return this.keyNames[Number(code)] ?? String(code);
    }
    // ---- players ------------------------------------------------------------------------------------------------
    toPlayer(user) {
      return { sid: String(user.id ?? ""), uid: String(user.uid ?? ""), name: String(user.name ?? ""), isLocal: user.isLocal === true, isAdmin: user.isSpaceAdmin === true };
    }
    local() {
      const user = this.scene?.localUser;
      if (!user) return { sid: "local", uid: "local", name: "", isLocal: true, isAdmin: false };
      const player = this.toPlayer(user);
      player.isLocal = true;
      if (!player.sid) player.sid = "local";
      return player;
    }
    /**
     * Who is in the room. The page keeps `scene.users` keyed by user id (so two sessions of one account show as
     * one player), and it removes a leaver only after `user-left` has been dispatched: the list is kept here, and
     * each player's fields are read live, because a session id is filled in after the fact.
     */
    players() {
      const out = [];
      let sawLocal = false;
      for (const user of this.roster.values()) {
        const player = this.toPlayer(user);
        if (player.isLocal) {
          sawLocal = true;
          if (!player.sid) player.sid = "local";
        } else if (!player.sid || player.sid === "local") continue;
        out.push(player);
      }
      if (!sawLocal) out.push(this.local());
      return out;
    }
    onPlayers(handler) {
      return subscribe(this.playerHandlers, handler);
    }
    onSessionChanged(handler) {
      return subscribe(this.sessionHandlers, handler);
    }
    emitPlayer(kind, user) {
      if (!user) return;
      const uid = String(user.uid ?? "");
      if (kind === "join") this.roster.set(uid, user);
      else this.roster.delete(uid);
      const player = this.toPlayer(user);
      for (const handler of this.playerHandlers.slice()) this.attempt("player handler", () => handler(kind, player));
    }
    // ---- space state --------------------------------------------------------------------------------------------
    onSpaceState(detail) {
      if (!detail || !Array.isArray(detail.changes)) return;
      if (detail.full) {
        const next = /* @__PURE__ */ new Map();
        for (const change of detail.changes) {
          if (typeof change.path === "string" && change.path.startsWith(TAG + ".") && !change.deleted && typeof change.value === "string") next.set(change.path, change.value);
        }
        this.replaceMirror(next);
        this.fullSeen = true;
        this.snapshot.resolve(true);
        return;
      }
      for (const change of detail.changes) {
        if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
        this.applyChange(change.path, change.deleted || typeof change.value !== "string" ? void 0 : change.value);
      }
    }
    replaceMirror(next) {
      const gone = [...this.mirror.keys()].filter((path) => !next.has(path));
      for (const path of gone) this.applyChange(path, void 0);
      for (const [path, value] of next) this.applyChange(path, value);
    }
    /** Applies one change to the mirror and tells the listeners, unless the mirror already says so. */
    applyChange(path, value) {
      if (this.unechoed.has(path)) {
        this.release(path);
        if (this.stateQueue.length) Promise.resolve().then(() => this.pumpState());
      }
      const before = this.mirror.get(path);
      if (before === value) return;
      if (value === void 0) this.mirror.delete(path);
      else this.mirror.set(path, value);
      for (const handler of this.stateHandlers.slice()) {
        if (!path.startsWith(handler.prefix)) continue;
        try {
          handler.fn(path, value);
        } catch (error) {
          this.log("error", `state handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    /**
     * The mirror at the moment the adapter became ready. When the snapshot's own event was missed (the script
     * arrived after it), the page's copy of the state is asked for instead.
     */
    seedMirror() {
      if (this.fullSeen) return;
      const take = (entries) => {
        if (this.fullSeen || !entries) return;
        const next = new Map(this.mirror);
        for (const scope of ["public", "protected"]) {
          const map = entries[scope];
          if (!map) continue;
          for (const path of Object.keys(map)) if (path.startsWith(TAG + ".") && typeof map[path] === "string") next.set(path, map[path]);
        }
        this.replaceMirror(next);
      };
      take(this.scene.spaceStateJson);
      if (!this.joined()) return;
      this.attemptAsync("SpaceStateGetAll", async () => {
        const all = await this.scene.SpaceStateGetAll();
        take(all);
        this.snapshot.resolve(true);
      }).then((ok) => {
        if (!ok) this.snapshot.resolve(true);
      });
    }
    whenSnapshot(timeoutMs) {
      if (this.snapshot.settled) return this.snapshot.promise;
      const gate = deferred();
      const timer = this.env.setTimeout(() => gate.resolve(false), timeoutMs);
      this.snapshot.promise.then((ok) => {
        this.env.clearTimeout(timer);
        gate.resolve(ok);
      });
      return gate.promise;
    }
    stateGet(path) {
      return this.mirror.get(path);
    }
    stateEntries(prefix) {
      const out = [];
      for (const [path, value] of this.mirror) if (path.startsWith(prefix)) out.push([path, value]);
      return out;
    }
    /**
     * Writes go through the page's string calls (SetPublicSpaceProps / SetProtectedSpaceProps): those are the ones
     * the app queues, merges per key, sends as one batch every 0.2 s for a single rate-limit token, and retries
     * when the bucket is empty. The JSON calls (SpaceStateSet) are sent one by one and are refused outright when
     * the bucket is empty. (Runtime/LocalMultiplayer/State/SpaceStateService.cs.)
     */
    stateSet(path, value) {
      this.queueSet(path, value, false);
    }
    stateSetProtected(path, value) {
      this.queueSet(path, value, true);
    }
    queueSet(path, value, isProtected) {
      if (hasDelimiter(value) || hasDelimiter(path)) {
        this.log("error", `a state value for ${path} holds a bridge delimiter character and was not sent`);
        this.emitError(path, "invalid_value", true);
        return;
      }
      const first = this.pendingPublic === null && this.pendingProtected === null;
      if (isProtected) (this.pendingProtected ?? (this.pendingProtected = {}))[path] = value;
      else (this.pendingPublic ?? (this.pendingPublic = {}))[path] = value;
      if (!first) return;
      Promise.resolve().then(() => {
        const pub = this.pendingPublic;
        const prot = this.pendingProtected;
        this.pendingPublic = null;
        this.pendingProtected = null;
        if (pub) this.stateQueue.push({ scope: "public", writes: Object.entries(pub) });
        if (prot) this.stateQueue.push({ scope: "protected", writes: Object.entries(prot) });
        this.pumpState();
      });
    }
    /**
     * Hands queued turns to the app while the bytes it holds that the room has not echoed stay within the budget. The
     * app merges whatever it holds into its next batch (64 writes of up to 16 KiB: over the relay's 256 KiB), and does
     * so even more while it backs off, so the page's own queue is the only place a batch's size can be bounded. A turn
     * bigger than the budget is split (logged once); the leaves of one sync slot are one write each and never split.
     */
    pumpState() {
      const budget = this.options.stateBudgetBytes;
      const now = this.env.now();
      for (const [path, entry] of this.unechoed) {
        if (now - entry.at >= this.options.stateEchoMs) this.release(path);
      }
      while (this.stateQueue.length) {
        const turn = this.stateQueue[0];
        const room = budget - this.unechoedBytes;
        const size = (w) => utf8Length(w[0]) + utf8Length(w[1]) + 16;
        const total = turn.writes.reduce((sum, w) => sum + size(w), 0);
        let take;
        if (total <= room) take = turn.writes.splice(0);
        else if (this.unechoedBytes > 0) break;
        else {
          take = [];
          let bytes2 = 0;
          while (turn.writes.length && (take.length === 0 || bytes2 + size(turn.writes[0]) <= budget)) {
            bytes2 += size(turn.writes[0]);
            take.push(turn.writes.shift());
          }
          if (!this.warnedSplit) {
            this.warnedSplit = true;
            this.log("info", `one turn wrote ${total} bytes of space state, more than the ${budget} bytes sent at once: it goes in parts`);
          }
        }
        if (!turn.writes.length) this.stateQueue.shift();
        const props = {};
        let bytes = 0;
        for (const w of take) {
          props[w[0]] = w[1];
          bytes += size(w);
          if (this.mirror.get(w[0]) === w[1]) continue;
          this.release(w[0]);
          this.unechoed.set(w[0], { bytes: size(w), at: now });
          this.unechoedBytes += size(w);
        }
        this.stateStats.handoffs++;
        this.stateStats.largest = Math.max(this.stateStats.largest, bytes);
        if (turn.scope === "protected") this.attempt("SetProtectedSpaceProps", () => this.scene.SetProtectedSpaceProps(props));
        else this.attempt("SetPublicSpaceProps", () => this.scene.SetPublicSpaceProps(props));
      }
      if (this.stateQueue.length) {
        this.stateStats.deferred++;
        if (!this.stateTimer) {
          this.stateTimer = this.env.setTimeout(() => {
            this.stateTimer = 0;
            this.pumpState();
          }, 250);
        }
      }
    }
    /** A handed-off write came back (or failed, or timed out): it no longer counts against the budget. */
    release(path) {
      const entry = this.unechoed.get(path);
      if (!entry) return;
      this.unechoed.delete(path);
      this.unechoedBytes -= entry.bytes;
    }
    async stateDelete(path) {
      let delay = 250;
      for (let tries = 0; tries < 8; tries++) {
        try {
          await this.scene.SpaceStateDelete(path);
          return;
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") return;
          if (code !== "rate_limited" && code !== "timeout") {
            this.emitError(path, code, true);
            return;
          }
          this.emitError(path, code, false);
          await this.sleep(delay);
          delay = Math.min(delay * 2, 4e3);
        }
      }
      this.emitError(path, "rate_limited", true);
    }
    onState(prefix, handler) {
      return subscribe(this.stateHandlers, { prefix, fn: handler });
    }
    onStateError(prefix, handler) {
      return subscribe(this.errorHandlers, { prefix, fn: handler });
    }
    onStateErrorEvent(detail) {
      if (!detail || typeof detail.key !== "string") return;
      if (detail.key.startsWith(TAG + ".")) this.emitError(detail.key, String(detail.code ?? "internal"), true);
    }
    emitError(path, code, final) {
      if (final && this.unechoed.has(path)) {
        this.release(path);
        if (this.stateQueue.length) Promise.resolve().then(() => this.pumpState());
      }
      for (const handler of this.errorHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("state error handler", () => handler.fn(path, code, final));
      }
    }
    // ---- user state ---------------------------------------------------------------------------------------------
    /**
     * Own user state goes through the JSON calls (UserStateSet / UserStateDelete), which answer per write. They
     * are sent one by one from a separate rate bucket, so writes are merged per leaf here and sent at most every
     * 0.2 s. Where the app offers no user state at all (Play mode on your own), the values are kept locally.
     */
    userSet(path, value) {
      if (this.localUser) {
        this.setLocalUser(path, value);
        return;
      }
      this.pendingUser.set(path, value);
      this.scheduleUserFlush();
    }
    scheduleUserFlush() {
      if (this.userTimer) return;
      const wait = Math.max(0, this.userLastFlush + Math.max(this.options.userFlushMs, this.userBackoff) - this.env.now());
      this.userTimer = this.env.setTimeout(() => {
        this.userTimer = 0;
        void this.flushUser();
      }, wait);
    }
    async flushUser() {
      this.userLastFlush = this.env.now();
      const batch = [...this.pendingUser];
      this.pendingUser.clear();
      let limited = false;
      for (const [path, value] of batch) {
        if (this.localUser) {
          this.setLocalUser(path, value);
          continue;
        }
        try {
          if (value === null) await this.scene.UserStateDelete(path);
          else await this.scene.UserStateSet(path, value);
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") continue;
          if (code === "app_unavailable") {
            this.log("info", "no user state in this session: keeping the local player's own values locally");
            this.localUser = /* @__PURE__ */ new Map();
            this.setLocalUser(path, value);
          } else if (code === "rate_limited" || code === "timeout") {
            limited = true;
            if (!this.pendingUser.has(path)) this.pendingUser.set(path, value);
            this.emitError(path, code, false);
          } else this.emitError(path, code, true);
        }
      }
      this.userBackoff = limited ? Math.min(Math.max(this.userBackoff * 2, 250), 4e3) : 0;
      if (this.pendingUser.size) this.scheduleUserFlush();
    }
    setLocalUser(path, value) {
      const store = this.localUser;
      if (value === null) store.delete(path);
      else store.set(path, value);
      const sid = this.local().sid;
      Promise.resolve().then(() => this.emitUser(sid, path, value === null ? void 0 : value));
    }
    userGet(sid, path) {
      if (sid === this.local().sid) {
        if (this.localUser) return this.localUser.get(path);
        const own = this.ownUser.get(path);
        if (own !== void 0) return own;
      }
      for (const user of this.roster.values()) {
        if (user && user.id === sid) {
          const value = user.state ? user.state[path] : void 0;
          return typeof value === "string" ? value : void 0;
        }
      }
      return void 0;
    }
    onUser(prefix, handler) {
      return subscribe(this.userHandlers, { prefix, fn: handler });
    }
    emitUser(sid, path, value) {
      for (const handler of this.userHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("user state handler", () => handler.fn(sid, path, value));
      }
    }
    // ---- one-shots ----------------------------------------------------------------------------------------------
    oneShot(data) {
      if (utf8Length(data) > this.limits.oneShotMaxBytes) return false;
      this.attempt("OneShot", () => this.scene.OneShot(data));
      return true;
    }
    onOneShot(handler) {
      return subscribe(this.oneShotHandlers, handler);
    }
    // ---- kit ----------------------------------------------------------------------------------------------------
    async loadKit(spec) {
      const BS = this.env.BS;
      const holder = new BS.GameObject(spec.holderName);
      await holder.Async();
      const placement = {};
      if (spec.position) placement.localPosition = toBs3(BS, spec.position);
      if (spec.rotation) placement.localEulerAngles = toBs3(BS, spec.rotation);
      if (spec.scale) placement.localScale = toBs3(BS, spec.scale);
      if (Object.keys(placement).length) await holder.SetTransform(placement);
      await holder.AddComponent(new BS.AssetBundle(spec.windows, "", "", spec.android, "", "", false, false));
      const handOn = await this.kitTurn(spec.holderName);
      let ok;
      try {
        const item = new BS.KitItem("*");
        const loaded = deferred();
        item.On("loaded", () => loaded.resolve(true));
        await holder.AddComponent(item);
        if (item.isLoaded) loaded.resolve(true);
        const timer = this.env.setTimeout(() => loaded.resolve(false), this.options.kitTimeoutMs);
        ok = await loaded.promise;
        this.env.clearTimeout(timer);
      } finally {
        handOn();
      }
      if (!ok) this.log("error", `kit ${spec.holderName}: the kit item never reported loaded`);
      const scene = this.scene;
      const childrenOf = (parent) => {
        const id = String(parent.unityId);
        return Object.values(scene.objects ?? {}).filter((o) => String(o.parent) === id && !o.destroyed);
      };
      const byPath = (root, path) => {
        let at = root;
        if (path === "") return at;
        for (const name of path.split("/")) {
          at = childrenOf(at).find((o) => o.name === name);
          if (!at) return null;
        }
        return at;
      };
      const found = /* @__PURE__ */ new Map();
      let waiting = spec.objects.slice();
      const deadline = this.env.now() + this.options.kitFindMs;
      for (; ; ) {
        const roots = childrenOf(holder);
        const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
        if (root) {
          waiting = waiting.filter((object) => {
            const go = byPath(root, object.path);
            if (go) found.set(object.key, go);
            return !go;
          });
        }
        if (!waiting.length || this.env.now() >= deadline) break;
        await this.sleep(200);
      }
      for (const object of waiting) {
        try {
          const go = await holder.AddInlineObject(spec.rootName + "/" + object.path);
          if (go) found.set(object.key, go);
        } catch {
        }
      }
      const objects = /* @__PURE__ */ new Map();
      const missing = [];
      const prepare = async (object) => {
        const go = found.get(object.key);
        if (!go) {
          missing.push(object.key);
          return;
        }
        try {
          if (object.networkId) await go.SetNetworkId(object.networkId);
          let synced = null;
          let seat = null;
          if (object.sync === "transform") {
            synced = await go.AddComponent(
              new BS.SyncedObject({
                syncPosition: true,
                syncRotation: true,
                takeOwnershipOnCollision: false,
                takeOwnershipOnProximity: false,
                takeOwnershipOnGrab: object.grab,
                kinematicIfNotOwned: false
              })
            );
          }
          if (object.seat) seat = await go.AddComponent(new BS.Seat({}));
          objects.set(object.key, new BsHostObject(this, object.key, object.path, go, synced, seat, object.networkId, object.attachNetworkId ?? "", object.attach === true));
        } catch (error) {
          this.log("warn", `kit object ${object.key} (${object.path}): ${describe(error)}`);
          missing.push(object.key);
        }
      };
      await Promise.all(spec.objects.map(prepare));
      return {
        objects,
        missing,
        find: async (path) => {
          const roots = childrenOf(holder);
          const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
          const known = root ? byPath(root, path) : null;
          if (known) return new BsHostObject(this, "", path, known, null, null);
          try {
            const go = await holder.AddInlineObject(spec.rootName + "/" + path);
            return go ? new BsHostObject(this, "", path, go, null, null) : null;
          } catch {
            return null;
          }
        },
        destroy: () => {
          try {
            holder.Destroy();
          } catch {
          }
        }
      };
    }
    bundles(slug) {
      const table = this.env.win.__pk1_bundles;
      const entry = table ? table[slug] : void 0;
      if (!entry) return null;
      const address = (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : "";
      const out = { windows: address(entry.windows), android: address(entry.android) };
      return out.windows || out.android ? out : null;
    }
    // ---- snippets -----------------------------------------------------------------------------------------------
    snippets(slug) {
      const all = Array.from(this.env.doc.querySelectorAll("bs-snippet"));
      const mine = all.filter((el) => (el.getAttribute("name") || "") === slug);
      return mine.map((el, index) => this.wrap(el, slug, index, mine));
    }
    wrap(el, slug, index, sameName) {
      let wrapper = this.wrappers.get(el);
      if (!wrapper) {
        const made = {
          _index: index,
          _peers: sameName,
          getAttribute: (name) => el.getAttribute(name),
          attributeNames: () => typeof el.getAttributeNames === "function" ? el.getAttributeNames() : [],
          get connected() {
            return el.isConnected !== false;
          },
          get active() {
            const single = el.getAttribute("single");
            if (single === null || single === "false") return true;
            if ("ownsSingleton" in el) return el.ownsSingleton === slug;
            return made._peers.indexOf(el) === 0;
          },
          get index() {
            return made._index;
          }
        };
        wrapper = made;
        this.wrappers.set(el, made);
      }
      wrapper._index = index;
      wrapper._peers = sameName;
      return wrapper;
    }
    onSnippetsChanged(handler) {
      return subscribe(this.snippetHandlers, handler);
    }
    observeSnippets() {
      if (this.observer || !this.env.MutationObserver) return;
      let queued = false;
      const observer = new this.env.MutationObserver(() => {
        if (queued) return;
        queued = true;
        this.env.setTimeout(() => {
          queued = false;
          for (const handler of this.snippetHandlers.slice()) this.attempt("snippet handler", handler);
        }, 0);
      });
      observer.observe(this.env.doc.documentElement, { childList: true, subtree: true });
      this.observer = observer;
    }
    // ---- the local player ---------------------------------------------------------------------------------------
    async isVR() {
      try {
        return await this.scene.IsVR() === true;
      } catch {
        return false;
      }
    }
    async raycast(origin, direction, maxDistance, layerMask) {
      const BS = this.env.BS;
      const reply = await this.scene.Raycast(toBs3(BS, origin), toBs3(BS, direction), maxDistance, layerMask);
      if (typeof reply !== "string") return null;
      const parts = reply.split("\xB6");
      if (parts.length < 8) return null;
      const n = parts.slice(2, 8).map(Number);
      return { objectId: parts[1], point: new Vector3(n[0], n[1], n[2]), normal: new Vector3(n[3], n[4], n[5]) };
    }
    onPose(handler) {
      return subscribe(this.poseHandlers, handler);
    }
    onTeleported(handler) {
      return subscribe(this.teleportHandlers, handler);
    }
    localPosition() {
      if (!this.headReading) this.headReading = this.readHead();
      return this.headReading;
    }
    /**
     * The page has no call that answers where the local player is. A throwaway object attached to the local
     * player's head (BS.AttachedObject, NonPhysics, attachment point Head = 0) is moved there by the app; its
     * transform, read once, is the head's position. The object starts at the origin, so the first reading away
     * from it is the answer. Then the object goes. UNVERIFIED in the app (checked in editor Play mode only, see
     * spikes/RESULTS.md S7).
     */
    async readHead() {
      const BS = this.env.BS;
      const uid = this.local().uid;
      let probe = null;
      const answer = deferred();
      const timer = this.env.setTimeout(() => answer.resolve(null), this.options.headProbeMs);
      try {
        probe = new BS.GameObject("pk1-head-probe");
        await probe.Async();
        const attached = await probe.AddComponent(
          new BS.AttachedObject({
            uid,
            attachmentPosition: new BS.Vector3(0, 0, 0),
            attachmentRotation: new BS.Quaternion(0, 0, 0, 1),
            attachmentType: 1,
            // NonPhysics
            attachmentPoint: 0,
            // Head
            autoSync: false,
            jointAvatar: false
          })
        );
        const PN = this.api.PN ?? this.api.PropertyName;
        const look = () => {
          const p = probe.transform?.position;
          if (p && (Number(p.x) || Number(p.y) || Number(p.z))) answer.resolve(from3(p));
        };
        await probe.WatchTransform([PN.position], look);
        await attached.Attach(uid);
        look();
        return await answer.promise;
      } catch (error) {
        this.log("info", `the local position could not be read at start: ${describe(error)}`);
        return null;
      } finally {
        this.env.clearTimeout(timer);
        answer.resolve(null);
        if (probe) {
          try {
            probe.Destroy();
          } catch {
          }
        }
      }
    }
    onInput(handler) {
      return subscribe(this.inputHandlers, handler);
    }
    haptic(side, strength, seconds) {
      this.attempt("SendHapticImpulse", () => this.scene.SendHapticImpulse(strength, seconds, side));
    }
    teleport(position, yDegrees, stopMovement) {
      this.attempt("TeleportTo", () => this.scene.TeleportTo(toBs3(this.env.BS, position), yDegrees, stopMovement));
    }
    setAbility(ability, allowed) {
      this.attempt("SetCan" + ability, () => this.scene["SetCan" + ability](allowed));
    }
    setBlock(control, blocked) {
      this.attempt("SetBlock" + control, () => this.scene["SetBlock" + control](blocked));
    }
    // ---- helpers ------------------------------------------------------------------------------------------------
    /** Runs a bridge call whose result nobody waits for; a failure is logged, never thrown into game code. */
    attempt(what, call) {
      try {
        const result = call();
        if (result && typeof result.then === "function") {
          result.then(void 0, (error) => this.log("warn", `${what} failed: ${describe(error)}`));
        }
      } catch (error) {
        this.log("warn", `${what} failed: ${describe(error)}`);
      }
    }
    async attemptAsync(what, call) {
      try {
        await call();
        return true;
      } catch (error) {
        this.log("debug", `${what} failed: ${describe(error)}`);
        return false;
      }
    }
    /** @internal for BsHostObject */
    get api() {
      return this.env.BS;
    }
    /** @internal for BsHostObject */
    userSession(user) {
      return user && typeof user.id === "string" ? user.id : void 0;
    }
  };
  var BsHostObject = class {
    constructor(platform, key, path, go, synced, seat, networkId2 = "", attachNetworkId = "", attachable = false) {
      __publicField(this, "key");
      __publicField(this, "path");
      __publicField(this, "platform");
      __publicField(this, "go");
      __publicField(this, "synced");
      __publicField(this, "seat");
      __publicField(this, "watchers", []);
      __publicField(this, "watching", false);
      __publicField(this, "attachNetworkId");
      __publicField(this, "hasNetworkId");
      __publicField(this, "attachable");
      __publicField(this, "attached", null);
      this.platform = platform;
      this.key = key;
      this.path = path;
      this.go = go;
      this.synced = synced;
      this.seat = seat;
      this.hasNetworkId = networkId2 !== "";
      this.attachNetworkId = attachNetworkId;
      this.attachable = attachable;
    }
    on(kind, handler) {
      const name = HOST_EVENTS[kind];
      if (!name) return () => {
      };
      const listener = (event) => {
        const d = event && event.detail ? event.detail : {};
        const detail = {};
        if (d.point) detail.point = from3(d.point);
        if (d.normal) detail.normal = from3(d.normal);
        if (typeof d.side === "number") detail.side = d.side;
        if (typeof d.name === "string") detail.otherName = d.name;
        const sid = this.platform.userSession(d.user);
        if (sid) detail.playerSid = sid;
        handler(detail);
      };
      this.go.On(name, listener);
      return () => this.go.Off(name, listener);
    }
    setTransform(patch) {
      const BS = this.platform.api;
      const out = {};
      if (patch.position) out.position = toBs3(BS, patch.position);
      if (patch.localPosition) out.localPosition = toBs3(BS, patch.localPosition);
      if (patch.localScale) out.localScale = toBs3(BS, patch.localScale);
      if (patch.rotation) out.rotation = new BS.Quaternion(patch.rotation.x, patch.rotation.y, patch.rotation.z, patch.rotation.w);
      if (patch.localRotation) out.localRotation = new BS.Quaternion(patch.localRotation.x, patch.localRotation.y, patch.localRotation.z, patch.localRotation.w);
      this.platform.attempt("SetTransform", () => this.go.SetTransform(out));
    }
    /**
     * Asking to watch a transform makes the host push its current value before it answers
     * (BSScene.WatchJsTransform calls SyncProperties(true)), so one round trip is a fresh read.
     * UNVERIFIED in the app: that the push reaches the page before the answer does.
     */
    async readTransform() {
      const PN = this.platform.api.PN ?? this.platform.api.PropertyName;
      try {
        await this.go.WatchTransform([PN.position, PN.rotation], () => this.report());
        this.watching = true;
      } catch {
        return null;
      }
      return this.current();
    }
    watchTransform(handler) {
      this.watchers.push(handler);
      if (!this.watching) void this.readTransform();
      return () => {
        const at = this.watchers.indexOf(handler);
        if (at >= 0) this.watchers.splice(at, 1);
      };
    }
    current() {
      const t = this.go.transform;
      if (!t || !t.position) return null;
      const r = t.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      return { position: from3(t.position), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
    }
    report() {
      const now = this.current();
      if (now) for (const watcher of this.watchers.slice()) watcher(now);
    }
    setActive(active) {
      this.platform.attempt("SetActive", () => this.go.SetActive(active));
    }
    setLayer(layer) {
      this.platform.attempt("SetLayer", () => this.go.SetLayer(layer));
    }
    takeOwnership() {
      if (this.synced) this.platform.attempt("TakeOwnership", () => this.synced.TakeOwnership());
    }
    async doIOwn() {
      if (!this.synced) return false;
      try {
        return await this.synced.DoIOwn() === true;
      } catch {
        return false;
      }
    }
    /** UNVERIFIED: that a kit object's own BSAudioSource is known to the page once the object is. */
    playClip(index) {
      const BS = this.platform.api;
      const source = this.go.GetComponent ? this.go.GetComponent((BS.CT ?? BS.ComponentType).AudioSource) : null;
      if (source) this.platform.attempt("PlayOneShot", () => source.PlayOneShot(index));
      else this.platform.log("warn", `no audio source known on ${this.path}`);
    }
    sit() {
      if (this.seat) this.platform.attempt("Sit", () => this.seat.Sit());
    }
    stand() {
      if (this.seat) this.platform.attempt("Stand", () => this.seat.Stand());
    }
    /** UNVERIFIED in Play mode: BS.AttachedObject added to a kit object, attachment point set, then Attach(local user id). */
    attachToHand(side, position, rotation) {
      this.attach(side === 0 ? 1 : 2, position, rotation, false);
    }
    /** UNVERIFIED in Play mode: as attachToHand, at the head (attachment point 0); with autoSync the app shows it to others. */
    attachToHead(position, rotation, autoSync) {
      this.attach(0, position, rotation, autoSync);
    }
    attach(point, position, rotation, autoSync) {
      const BS = this.platform.api;
      const uid = this.platform.local().uid;
      void (async () => {
        try {
          if (autoSync && !this.attachable) {
            this.platform.log("warn", `${this.key}: attached with autoSync but not marked attachable in the bindings (KitStage.Attachable): other players will not see the attachment`);
          }
          if (autoSync && !this.hasNetworkId && this.attachNetworkId) {
            await this.go.SetNetworkId(this.attachNetworkId);
            this.hasNetworkId = true;
          }
          if (!this.attached) {
            this.attached = await this.go.AddComponent(
              new BS.AttachedObject({
                uid,
                attachmentPosition: new BS.Vector3(position.x, position.y, position.z),
                attachmentRotation: new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
                attachmentType: 1,
                // NonPhysics
                attachmentPoint: point,
                // Head 0, LeftHand 1, RightHand 2
                autoSync,
                jointAvatar: false
              })
            );
          } else {
            this.attached.attachmentPoint = point;
            this.attached.attachmentPosition = new BS.Vector3(position.x, position.y, position.z);
            this.attached.attachmentRotation = new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            this.attached.autoSync = autoSync;
          }
          await this.attached.Attach(uid);
        } catch (error) {
          this.platform.log("warn", `AttachedObject on ${this.path}: ${String(error)}`);
        }
      })();
    }
    detach() {
      if (!this.attached) return;
      const uid = this.platform.local().uid;
      this.platform.attempt("Detach", () => this.attached.Detach(uid));
    }
    releaseGrab() {
      this.platform.attempt("ReleaseGrab", () => this.go.ReleaseGrab());
    }
  };
  function subscribe(list, item) {
    list.push(item);
    return () => {
      const at = list.indexOf(item);
      if (at >= 0) list.splice(at, 1);
    };
  }
  function toBs3(BS, v) {
    return new BS.Vector3(v.x, v.y, v.z);
  }
  function from3(v) {
    return new Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0);
  }
  function pose(source) {
    const p = source?.position ?? {};
    const r = source?.rotation ?? {};
    return { position: from3(p), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
  }
  function clampInt(value, max) {
    const n = Math.trunc(Number(value) || 0);
    return n < 0 ? 0 : n > max ? max : n;
  }
  function errorCode(error) {
    if (error && typeof error === "object" && typeof error.code === "string") return error.code;
    return "internal";
  }
  function describe(error) {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : JSON.stringify(error);
  }

  // pk-blackjack.entry.ts
  var env = pageEnv();
  var claimed = env.win.__pk1 && env.win.__pk1.games && Object.prototype.hasOwnProperty.call(env.win.__pk1.games, src_default.slug);
  if (!claimed) boot(new BsPlatform(env), src_default, bindings_default);
})();
