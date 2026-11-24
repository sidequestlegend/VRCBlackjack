// Rungs 3 and 4: the blackjack table in editor Play mode, driven through the SDK's desktop player with the port kit's
// input (InputSim: a mouse of the test's own; the SDK casts its own rays and raises the clicks), and checked in Unity
// with the kit's probe command. Not part of the snippet: the test page loads it before the snippet.
//
// window.__bjPlan: "single" (one player: seat, bet, deal, hit, stand, result and chips) or "multi" (two Local
// Multiplayer players: both seated, a full round, the hole card unreadable before the flip on both pages, then a second
// round in which Player 2 reloads its page mid-hand and must see the same table).
(function () {
  "use strict";
  const KEY = "blackjack:0";
  const HOLDER = "pk1:blackjack:0";
  const say = (kind, what, detail) => console.log("PKTEST " + kind + " " + what + (detail !== undefined ? ": " + detail : ""));
  let passed = 0;
  let failed = 0;
  const check = (ok, what, detail) => {
    if (ok) passed++;
    else failed++;
    say(ok ? "PASS" : "FAIL", what, detail);
    return ok;
  };
  const replies = new Map();
  let count = 0;
  window.__pktest = Object.assign(window.__pktest || {}, {
    reply(id, text) {
      const resolve = replies.get(id);
      if (resolve) {
        replies.delete(id);
        resolve(text);
      }
    },
  });
  const cmd = (line, ms) =>
    new Promise((resolve) => {
      const id = "b" + ++count;
      replies.set(id, resolve);
      console.log("PKTEST CMD " + id + " " + line);
      setTimeout(() => {
        if (replies.delete(id)) resolve("error: no reply");
      }, ms || 30000);
    });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(test, ms, step) {
    const end = Date.now() + ms;
    for (;;) {
      let value = false;
      try {
        value = test();
      } catch (e) {
        value = false;
      }
      if (value) return value;
      if (Date.now() > end) return false;
      await sleep(step || 100);
    }
  }
  const debug = () => window.__pk1 && window.__pk1.debug && window.__pk1.debug[KEY];
  const table = () => debug().table();
  const path = (key) => debug().pathOf(key);
  const probe = (what, key, extra) => cmd("probe " + HOLDER + " " + what + " " + path(key).replace(/ /g, "%20") + (extra ? " " + extra : ""));
  /** Probes run ahead of the relay (portkit README): ask again until the value comes, up to `ms`. */
  async function probeUntil(what, key, ok, ms) {
    const end = Date.now() + (ms || 5000);
    for (;;) {
      const v = await probe(what, key);
      if (ok(v) || Date.now() > end) return v;
      await sleep(200);
    }
  }
  const RESULT = ["none", "win", "draw", "lose"];
  const value = (c) => {
    const rank = Math.floor(c / 4);
    return rank <= 8 ? rank + 2 : rank <= 11 ? 10 : 11;
  };

  /** Clicks a kit object through the desktop player: look at it, then click where Unity says it is. */
  async function click(key, what) {
    const pos = await probe("pos", key);
    await cmd("look " + pos);
    await cmd("wait 5");
    const r = await cmd("click " + pos);
    say("INFO", "click " + what + " (" + key + ")", r + " at " + pos);
    await sleep(900);
    return r.startsWith("ok");
  }

  /** Clicks until `done()` holds (a quick click on a small box sometimes misses on desktop: RESULTS.md). */
  async function press(key, what, done, tries) {
    for (let i = 0; i < (tries || 3); i++) {
      await click(key, what);
      if (await until(done, 3000, 100)) return true;
      say("INFO", what + ": not yet after try " + (i + 1));
    }
    return false;
  }

  async function waitStarted(back) {
    const ok = await until(() => debug() && debug().table, 120000, 250);
    check(!!ok, "the kit loads from a hand-written bs-snippet and the instance starts", ok ? "" : "no debug hooks after 120 s");
    if (!ok) return false;
    await until(() => table().owner !== "", 15000, 250);
    if (back) {
      // a page reloaded mid-hand joins a table with cards on it: its slots follow the state it was sent
      await until(() => table().dealer.length > 0, 30000, 250);
      const exists = await probe("exists", "table");
      const slot = await probe("active", "d0");
      const want = table().dealer.length > 0 ? "True" : "False";
      check(exists === "True" && slot === want, "the kit is in the scene after the reload, the dealer's first slot as the state says", `table ${exists}, dealer slot 0 active ${slot}, dealer ${JSON.stringify(table().dealer)}`);
      return true;
    }
    const exists = await probe("exists", "table");
    const slot = await probe("active", "d0");
    const join = await probe("active", "p3_bJoin");
    check(exists === "True" && slot === "False", "the kit is in the scene: the table, card slots off", `table ${exists}, dealer slot 0 active ${slot}, seat 3's join box active ${join}`);
    return true;
  }

  /** Unity's view of one card slot: on, and the face the page sent (-1: blank, the hole card). */
  async function slot(key) {
    const active = await probe("active", key);
    const face = await probe("matfloat", key + "f", "_CardIndex");
    return { active, face: Math.round(Number(face)) };
  }

  async function seatCardsAgree(i, label) {
    const s = table().seats[i];
    const seen = [];
    let ok = true;
    for (let k = 0; k < s.normal.length; k++) {
      const u = await slot(`p${i}_n${k}`);
      seen.push(`${u.active}/${u.face}`);
      if (u.active !== "True" || u.face !== s.normal[k]) ok = false;
    }
    const next = await probe("active", `p${i}_n${s.normal.length}`);
    if (s.normal.length < 11 && next !== "False") ok = false;
    return check(ok, label, `state ${JSON.stringify(s.normal)}; Unity ${seen.join(" ")}; next slot active ${next}`);
  }

  // ---- one player -------------------------------------------------------------------------------------------------
  async function single() {
    if (!(await waitStarted())) return;
    const me = debug().me();
    check(table().owner === me.name, "the first player owns the table", table().owner);
    const startChips = table().chips;
    check(table().usingChips === true && startChips === 100, "the element's settings: chips on, 100 to start", `chips ${table().usingChips}, ${startChips}`);

    // take the middle seat
    const seated = await press("p3_bJoin", "Join Game", () => table().seats[3].mine);
    check(!!seated, "Join Game takes seat 3 (click box on the UI layer, real mouse)", JSON.stringify(table().seats[3]));
    const name = await probe("text", "p3_dealerName");
    check(name === me.name, "the seat's name reached Unity (relay op text)", name);
    // bet 10 + 5
    await press("p3_bAdd10", "+10", () => table().bet === 10);
    await press("p3_bAdd5", "+5", () => table().bet === 15);
    const betText = await probe("text", "p3_currentBet");
    check(table().bet === 15 && /15/.test(betText), "two chip buttons make a bet of 15, shown on the chip panel", `bet ${table().bet}, panel '${betText}', total '${await probe("text", "p3_totalChips")}'`);

    // deal
    const started = await press("startGame", "Start Game", () => table().round >= 1);
    check(!!started, "Start Game starts a round", `round ${table().round}, phase ${table().phase}`);
    const turns = await until(() => table().phase === "turns", 20000, 100);
    const t = table();
    check(!!turns && t.seats[3].normal.length === 2 && t.dealer.length === 2 && t.dealer[0] === -1, "the deal: two cards to the seat, two to the dealer, the hole card face down",
      `phase ${t.phase}, seat ${JSON.stringify(t.seats[3].normal)}, dealer ${JSON.stringify(t.dealer)}, deal ${t.dealLabel}`);
    await seatCardsAgree(3, "the seat's two cards are on in Unity with the faces in state (matFloat _CardIndex)");
    const d0 = await slot("d0");
    const d1 = await slot("d1");
    check(d0.active === "True" && d0.face === -1 && d1.active === "True" && d1.face === t.dealer[1], "the dealer's up card shows its face; the hole card's face is blank in Unity", `d0 ${d0.active}/${d0.face}, d1 ${d1.active}/${d1.face} (state ${t.dealer[1]})`);
    await cmd("shot deal 0 1.45 1.6 0 0.8 3 60");

    // hit once if under 17 (a real decision would differ: the test wants a hit), then stand
    const before = table().seats[3].normal.length;
    if (table().seats[3].normalTotal < 21) {
      const hit = await press("p3_bHitNormal", "HIT", () => table().seats[3].normal.length > before);
      check(!!hit, "HIT deals a third card", JSON.stringify(table().seats[3].normal) + " total " + table().seats[3].normalTotal);
      await sleep(600);
      await seatCardsAgree(3, "the third card is on in Unity with its face");
    }
    if (table().phase === "turns" && !table().seats[3].finished) {
      const stood = await press("p3_bStand", "STAND", () => table().seats[3].finished || table().phase !== "turns");
      check(!!stood, "STAND ends the turn", JSON.stringify(table().seats[3]));
    } else say("INFO", "the hand went bust: no stand needed");

    // the dealer plays and the round settles
    const settled = await until(() => table().phase === "settled", 30000, 200);
    const s = table();
    const seat = s.seats[3];
    check(!!settled && s.flipped && s.dealer[0] >= 0, "the dealer flips and plays; the round settles", `dealer ${JSON.stringify(s.dealer)} = ${s.dealerTotal}, seat ${JSON.stringify(seat.normal)} = ${seat.normalTotal}, result ${RESULT[seat.result[0]]}`);
    const hole = await slot("d0");
    check(hole.face === s.dealer[0] && s.holeVerified === true, "the flipped hole card's face reached Unity and matches its commitment", `Unity ${hole.face}, state ${s.dealer[0]}, verified ${s.holeVerified}`);
    // the verdict by the rules, from the cards (every win pays 1 to 1)
    const want = seat.bust ? 3 : s.dealerTotal > 21 || seat.normalTotal > s.dealerTotal ? 1 : seat.normalTotal === s.dealerTotal ? 2 : 3;
    check(seat.result[0] === want, "the verdict follows the totals", `${RESULT[seat.result[0]]} (by the totals: ${RESULT[want]})`);
    await until(() => table().chips !== startChips || want === 2, 5000, 100);
    const delta = table().chips - startChips;
    check(delta === (want === 1 ? 15 : want === 3 ? -15 : 0), "the chips change by the bet (1 to 1)", `${startChips} -> ${table().chips} (${delta >= 0 ? "+" : ""}${delta})`);
    const chipsText = await probe("text", "p3_totalChips");
    check(chipsText.indexOf(String(table().chips)) >= 0, "the chip panel shows the new total", chipsText);
    // alone at the table, this page is both the referee and the only player: the deal is its own, and is shown so
    await until(() => table().dealVerified !== null, 8000, 200);
    check(table().dealStatus === "unverifiable", "a deal with no contributor but the referee is not checkable (the only player dealt alone)", JSON.stringify(table().dealVerified));
    const line = await probeUntil("text", "dealCheck", (v) => v === table().dealCheck && v !== "");
    check(/^Deal NOT checkable/.test(line) && line === table().dealCheck, "the table shows every player that this deal could not be checked (Unity text)", line);
    await cmd("shot settled 0 1.45 1.6 0 0.8 3 60");

    // the credits panel opens and closes for this viewer
    await click("creditsButton", "Credits");
    const open = await probe("active", "creditsPanel");
    await click("creditsPanel", "the credits panel");
    const closed = await probe("active", "creditsPanel");
    check(open === "True" && closed === "False", "the credits panel opens and closes", `${open}, ${closed}`);
  }

  // ---- two players --------------------------------------------------------------------------------------------------
  const heard = [];
  function channel() {
    const scene = window.BS.Scene.GetInstance();
    scene.On("one-shot", (e) => {
      const data = e && e.detail && e.detail.data;
      if (typeof data !== "string" || data.indexOf("bjTest") < 0) return;
      try {
        heard.push(JSON.parse(data));
      } catch (x) {
        /* not ours */
      }
    });
    return (message) => scene.OneShot(JSON.stringify(Object.assign({ bjTest: 1 }, message)));
  }
  const reloaded = () => {
    try {
      return sessionStorage.getItem("bjTestReloaded") === "1";
    } catch (e) {
      return false;
    }
  };
  /** This page's digest and the version of state it is made of, read together (portkit stamp()). */
  const stamp = () => debug().stamp();
  /** The table as text: equal on both pages means the same table. */
  const view = () => {
    const t = table();
    return `${t.phase} r${t.round} dealer ${t.dealer.join(",")}=${t.dealerTotal} | ` + t.seats.map((s) => (s.active ? `${s.name}:${s.normal.join(",")}=${s.normalTotal} ${s.result.join("")}` : "-")).join(" | ");
  };

  /** Before the flip: everything this page holds about the table, and what Unity shows on the hole card's slot. */
  async function holeSnapshot() {
    return { dealer: debug().dealer(), state: JSON.stringify(debug().state()), unity: (await slot("d0")).face };
  }

  /**
   * The hole card was unreadable on this page before the flip: the dealer's synced cards held -1 and an up card, its
   * total counted the up card only, no opening was held, Unity's slot face was blank, and the opening published at the
   * flip (its nonce, the only thing that ties the commitment to a card) appears nowhere in what this page held before.
   * After the flip the card matches the commitment held before it.
   */
  function holeCheck(pre, post) {
    const d = pre.dealer;
    const nonce = post.holeOpening ? post.holeOpening.s : "";
    const parts = [
      ["state held [-1, up card]", d.cards.length === 2 && d.cards[0] === -1 && d.cards[1] >= 0],
      ["total counted the up card only", d.total === value(d.cards[1])],
      ["no opening held", d.holeOpening === null],
      ["a commitment held", typeof d.holeHash === "string" && d.holeHash.length > 0],
      ["Unity's slot face blank", pre.unity === -1],
      ["the opening's nonce absent from the whole state before", nonce.length > 0 && pre.state.indexOf(nonce) < 0],
      ["the commitment unchanged at the flip", post.holeHash === d.holeHash && post.holeRedrawn === false],
      ["the card shown matches the commitment", table().holeVerified === true && post.cards[0] >= 0],
    ];
    const bad = parts.filter((p) => !p[1]).map((p) => p[0]);
    return { ok: bad.length === 0, detail: bad.length ? "failed: " + bad.join("; ") : `hole ${post.cards[0]} (value ${value(post.cards[0])}); before: cards ${JSON.stringify(d.cards)}, total ${d.total}, hash ${d.holeHash.slice(0, 12)}..., Unity ${pre.unity}` };
  }

  async function playMyHand(i) {
    for (let guard = 0; guard < 6; guard++) {
      const s = table().seats[i];
      if (table().phase !== "turns" || s.finished) return;
      if (s.normalTotal < 15 && !s.bust) await press(`p${i}_bHitNormal`, "HIT", () => table().seats[i].normal.length > s.normal.length || table().seats[i].finished);
      else await press(`p${i}_bStand`, "STAND", () => table().seats[i].finished || table().phase !== "turns");
    }
  }

  async function multi() {
    const back = reloaded();
    if (!(await waitStarted(back))) return;
    const send = channel();
    const two = await until(() => debug().players().length >= 2, 90000, 500);
    check(!!two, "two players in the room", JSON.stringify(debug().players().map((p) => p.name || p.sid)));
    if (!two) return;
    await sleep(2000);
    const me = debug().me();
    const others = debug().players().filter((p) => p.sid !== me.sid);
    // the table owner is the referee's player; the other page is "guest"
    const owner = table().owner === me.name && !back;
    const mySeat = owner ? 3 : 4;
    say("INFO", (owner ? "table owner" : "guest") + " is " + me.name + (back ? " (back after a reload)" : "") + ", others " + others.map((p) => p.name).join(","));

    if (back) {
      // late join by reload: the round goes on without this page's old session; the table must look the same
      await until(() => table().phase !== "idle", 30000, 250);
      const theirs = await until(() => heard.slice().reverse().find((m) => m.kind === "view"), 30000, 200);
      await sleep(500);
      const mine = view();
      const latest = heard.slice().reverse().find((m) => m.kind === "view");
      check(!!theirs && latest.view === mine, "after reloading mid-hand the guest sees the same table (late join)", `${mine} / ${latest ? latest.view : "nothing heard"}`);
      const t = table();
      const owners = t.seats.findIndex((s) => s.active && s.name !== me.name);
      if (owners >= 0) await seatCardsAgree(owners, "the reloaded page shows the other seat's cards in Unity with their faces");
      const d1 = await slot("d1");
      check(d1.active === "True" && d1.face === t.dealer[1] && (t.flipped || (await slot("d0")).face === -1), "the reloaded page shows the dealer's cards as they are (hole card still blank unless flipped)", `d1 ${d1.active}/${d1.face}, dealer ${JSON.stringify(t.dealer)}`);
      check(!t.seats[4].active, "the guest's old seat was freed when its session left (C21, F72)", JSON.stringify(t.seats[4]));
      // the owner plays its hand (and the dealer flips) only after hearing "back": this snapshot is from before the flip
      const pre2 = await holeSnapshot();
      check(!pre2.dealer.flipped && pre2.dealer.cards[0] === -1, "the reloaded page joined before the flip", `flipped ${pre2.dealer.flipped}, dealer ${JSON.stringify(pre2.dealer.cards)}`);
      // tell the owner this page's digest until it has compared one (see sameVersion): each sample is one stamp()
      for (let n = 1; n <= 120 && !heard.find((m) => m.kind === "ack"); n++) {
        const st = stamp();
        send({ kind: "back", n, digest: st.digest, version: st.version });
        await sleep(250);
      }
      await until(() => table().phase === "settled", 60000, 250);
      const hc2 = holeCheck(pre2, debug().dealer());
      check(hc2.ok, "round 2: the hole card was unreadable on the reloaded page (late join state) before the flip, and the flipped card matches its commitment", hc2.detail);
      // this page's old session contributed to round 2's deal and left with its part: the page says it cannot check it
      await until(() => table().dealVerified !== null, 8000, 200);
      const v2 = table().dealVerified;
      const line2 = await probeUntil("text", "dealCheck", (v) => /^Deal NOT checkable/.test(v));
      check(table().dealStatus === "unverifiable" && /left before this page arrived/.test(v2 ? v2.reason : "") && /^Deal NOT checkable/.test(line2),
        "round 2: the reloaded page cannot check a deal its old session contributed to, and shows that (not a false alarm)", `${JSON.stringify(v2)}; Unity '${line2}'`);
      await sleep(1500);
      const stf = stamp();
      send({ kind: "final", digest: stf.digest, version: stf.version, view: view() });
      try {
        sessionStorage.removeItem("bjTestReloaded");
      } catch (e) {
        /* nothing */
      }
      return;
    }

    // ---- round 1: both seated, a full round ----
    const sat = await press(`p${mySeat}_bJoin`, "Join Game", () => table().seats[mySeat].mine);
    check(!!sat, `this player takes seat ${mySeat}`, JSON.stringify(table().seats[mySeat]));
    const both = await until(() => table().seats[3].active && table().seats[4].active, 60000, 250);
    check(!!both, "both players are seated, on both pages", table().seats.map((s) => s.name || "-").join(","));
    if (owner) await press("startGame", "Start Game", () => table().round >= 1);
    await until(() => table().phase === "turns", 60000, 100);
    const pre = await holeSnapshot();
    check(pre.dealer.cards[0] === -1 && pre.unity === -1, "before the flip this page holds the hole card face down, and Unity's slot face is blank", `state ${JSON.stringify(pre.dealer.cards)}, Unity ${pre.unity}`);
    await playMyHand(mySeat);
    await until(() => table().phase === "settled", 60000, 200);
    // each page replays the deal once the referee's seed arrives, a moment after the round settles (as in single())
    await until(() => table().dealVerified !== null, 8000, 200);
    const t1 = table();
    const hc = holeCheck(pre, debug().dealer());
    check(hc.ok, "the hole card was unreadable on this page before the flip, and the flipped card matches its commitment", hc.detail);
    check(t1.dealStatus === "checked", "the round's deal checks: contributors are the seated players, the draws replay, every hand holds the deal's cards", JSON.stringify(t1.dealVerified) + " " + t1.dealLabel);
    const line1 = await probeUntil("text", "dealCheck", (v) => /^Deal checked/.test(v));
    check(/^Deal checked/.test(line1), "the table shows every player that the deal was checked (Unity text)", line1);
    // the other player's actions arrived here: its seat's cards (any hits included) are on in this page's Unity
    await seatCardsAgree(3, "round 1: seat 3's cards are on in this page's Unity with the faces in state");
    await seatCardsAgree(4, "round 1: seat 4's cards are on in this page's Unity with the faces in state");
    const other = owner ? 4 : 3;
    check(t1.seats[other].finished && t1.seats[other].result[0] > 0, "round 1: the other player's hand was played and settled, as this page sees it", JSON.stringify(t1.seats[other]));
    await sleep(1500);
    const st1 = stamp();
    send({ kind: "round1", digest: st1.digest, version: st1.version, view: view() });
    const theirs1 = await until(() => heard.find((m) => m.kind === "round1"), 20000, 200);
    const now1 = stamp();
    check(!!theirs1 && theirs1.version === now1.version && theirs1.digest === now1.digest, "both pages reach the same state after round 1 (equal version() and digest)", theirs1 ? `${theirs1.digest} / ${now1.digest} at ${theirs1.version} / ${now1.version}` : "no digest heard");

    // ---- round 2: the guest reloads mid-hand ----
    await sleep(2000);
    const round2 = t1.round + 1;
    if (owner) {
      await until(() => table().seats[4].active, 20000, 250);
      await press("startGame", "Start Game", () => table().round >= round2);
    }
    await until(() => table().round >= round2 && table().phase === "turns", 60000, 100);
    if (!owner) {
      await sleep(1000);
      send({ kind: "reloading" });
      try {
        sessionStorage.setItem("bjTestReloaded", "1");
      } catch (e) {
        /* no storage: the reload test cannot run */
      }
      say("INFO", "the guest reloads its page mid-hand");
      await sleep(300);
      location.reload();
      await sleep(60000);
      return;
    }
    // the owner: keep telling the guest what the table looks like, then play the hand out
    await until(() => heard.find((m) => m.kind === "reloading"), 20000, 200);
    // While turns run, the referee moves the synced poll time (nextCheckAt) on every 2 s, so the whole-state digest
    // changes by itself. Digests are compared only at equal version() (portkit README, "Comparing pages"): a guest
    // sample of another version is counted and skipped; the first sample at the owner's version is compared, and any
    // difference there fails.
    let skipped = 0;
    let seen = 0;
    const sameVersion = await (async () => {
      for (let i = 0; i < 240; i++) {
        if (i % 2 === 0) send({ kind: "view", view: view() });
        const b = heard.filter((m) => m.kind === "back" && m.n > seen).pop();
        if (b) {
          seen = b.n;
          const mine = stamp();
          if (b.version === mine.version) return { theirs: b, mine };
          skipped++;
        }
        await sleep(250);
      }
      return null;
    })();
    send({ kind: "ack" });
    check(!!sameVersion && sameVersion.theirs.digest === sameVersion.mine.digest, "the reloaded guest's page holds the same state as the owner's (digest at equal version())",
      sameVersion ? `${sameVersion.theirs.digest} / ${sameVersion.mine.digest} at version ${sameVersion.mine.version} (guest sample ${sameVersion.theirs.n}; ${skipped} samples of another version skipped)` : `no sample at the owner's version (${skipped} skipped)`);
    await playMyHand(mySeat);
    await until(() => table().phase === "settled", 60000, 200);
    await until(() => table().dealVerified !== null, 8000, 200);
    check(table().dealStatus === "checked", "round 2: the owner's page checks the deal (it saw the guest's old session contribute)", JSON.stringify(table().dealVerified));
    await sleep(1500);
    const fin = await until(() => heard.find((m) => m.kind === "final"), 30000, 200);
    const nowf = stamp();
    check(!!fin && fin.version === nowf.version && fin.digest === nowf.digest && fin.view === view(), "both pages agree at the end of round 2 (equal version() and digest)", fin ? `${fin.digest} / ${nowf.digest} at ${fin.version} / ${nowf.version}; ${view()}` : "no word");
  }

  window.__bjRun = async function (plan) {
    try {
      if (plan === "single") await single();
      else if (plan === "multi") await multi();
    } catch (e) {
      check(false, "the test ran to its end", e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : String(e));
    }
    say("INFO", "page result " + passed + " passed, " + failed + " failed");
    console.log("PKTEST DONE");
  };
  if (window.__bjPlan) window.__bjRun(window.__bjPlan);
})();
