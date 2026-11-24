// Runs the upstream rule methods (Extracted.cs, verbatim) on scripted inputs and writes the outcomes as golden vectors
// for the TypeScript port: ts/vectors/upstream.json.
//
//   dotnet run --project golden/upstream -- <output.json>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using CentauriCore.Blackjack;

static class Harness
{
    static readonly System.Random Rng = new System.Random(20221114);

    static PlayerDeck NewDeck(Player owner, DeckManager deck, bool split) =>
        new PlayerDeck { Name = split ? "SplitDeck" : "NormalDeck", PlayerController = owner, Deck = deck, isSplitDeck = split };

    static (Player player, PlayerDeck normal, PlayerDeck split, ChipController chips, Controller table) NewSeat(bool usingChips, int bet, int chipCount)
    {
        var deck = new DeckManager { Name = "Deck" };
        var chips = new ChipController { Name = "Chips", CurrentChipCount = chipCount, CurrentBet = new int[1] };
        chips.CurrentBet[0] = bet;
        var table = new Controller { Name = "Controller", UsingChips = usingChips, ChipController = chips, TableIndex = 0 };
        var dealer = new Dealer { Name = "Dealer", GameController = table, Deck = deck };
        table.Dealer = dealer;
        var player = new Player { Name = "Player", BlackjackController = table, ChipController = chips, TotalBet = bet, IsActive = true, isOwner = true };
        player.NormalDeck = NewDeck(player, deck, false);
        player.SplitDeck = NewDeck(player, deck, true);
        return (player, player.NormalDeck, player.SplitDeck, chips, table);
    }

    static object Hand(PlayerDeck d) => new[] { d.localDeckValue, d.NumOfAces, d.IsBust ? 1 : 0 };

    static void Main(string[] args)
    {
        var output = args.Length > 0 ? args[0] : "upstream.json";
        var doc = new Dictionary<string, object>
        {
            ["source"] = "Centauri2442/VRCBlackjack at 83f05db; methods copied verbatim by golden/extract.ts and compiled with dotnet " + Environment.Version,
            ["deck"] = DeckVectors(),
            ["unused"] = UnusedVectors(),
            ["add"] = AddVectors(),
            ["dealerAdd"] = DealerAddVectors(),
            ["split"] = SplitVectors(),
            ["settle"] = SettleVectors(),
            ["chips"] = ChipVectors(),
            ["schedule"] = ScheduleVectors(),
            ["dealerPlay"] = DealerPlayVectors(),
        };
        File.WriteAllText(output, JsonSerializer.Serialize(doc));
        Console.WriteLine($"wrote {output}");
    }

    // V1: InitializeDeck, AddDeck, SubtractDeck (DeckManager.cs:53-87).
    static object DeckVectors()
    {
        var init = new List<object>();
        for (int decks = 1; decks <= 8; decks++)
        {
            var d = new DeckManager { NumberOfDecks = decks };
            d.InitializeDeck();
            init.Add(new { decks, counts = d.NumOfEachCardLeft.ToArray() });
        }
        var ops = new List<object>();
        for (int s = 0; s < 40; s++)
        {
            var d = new DeckManager { NumberOfDecks = 2 };
            var seq = new List<string>();
            var after = new List<int>();
            for (int k = 0; k < 12; k++)
            {
                if (Rng.Next(2) == 0) { d.AddDeck(); seq.Add("+"); } else { d.SubtractDeck(); seq.Add("-"); }
                after.Add(d.NumberOfDecks);
            }
            ops.Add(new { ops = string.Join("", seq), after });
        }
        return new { init, ops };
    }

    // V2: GetUnusedCardIndex (PlayerDeck.cs:199-261), every start index against a set of count arrays.
    static object UnusedVectors()
    {
        var patterns = new List<int[]>();
        var fresh = new DeckManager { NumberOfDecks = 2 };
        fresh.InitializeDeck();
        patterns.Add(fresh.NumOfEachCardLeft.ToArray());
        patterns.Add(new int[52]);
        foreach (var only in new[] { 0, 1, 25, 50, 51 })
        {
            var p = new int[52];
            p[only] = 1;
            patterns.Add(p);
        }
        foreach (var gap in new[] { (0, 10), (40, 52), (45, 52), (0, 52), (10, 20) })
        {
            var p = Enumerable.Repeat(2, 52).ToArray();
            for (int i = gap.Item1; i < gap.Item2; i++) p[i] = 0;
            patterns.Add(p);
        }
        for (int r = 0; r < 20; r++)
        {
            var p = new int[52];
            for (int i = 0; i < 52; i++) p[i] = Rng.Next(10) < 7 ? 0 : Rng.Next(1, 4);
            patterns.Add(p);
        }
        var cases = new List<object>();
        foreach (var counts in patterns)
        {
            var results = new int[52];
            for (int start = 0; start < 52; start++)
            {
                var deck = new DeckManager { NumOfEachCardLeft = counts.ToArray() };
                var (player, _, _, _, _) = NewSeat(false, 0, 0);
                var hand = new PlayerDeck { PlayerController = player, Deck = deck };
                UnityEngine.Random.Script.Enqueue(start);
                results[start] = hand.Unused();
                // The dealer's copy (Dealer.cs:233-295) must agree.
                var dealer = new Dealer { Deck = deck };
                UnityEngine.Random.Script.Enqueue(start);
                if (dealer.Unused() != results[start]) throw new Exception("the dealer's GetUnusedCardIndex differs");
            }
            cases.Add(new { counts, results });
        }
        return cases;
    }

    static List<int[]> Sequences()
    {
        var all = new List<int[]>();
        var values = Enumerable.Range(2, 10).ToArray(); // 2..11, 11 being an ace
        foreach (var a in values) all.Add(new[] { a });
        foreach (var a in values) foreach (var b in values) all.Add(new[] { a, b });
        foreach (var a in values) foreach (var b in values) foreach (var c in values) all.Add(new[] { a, b, c });
        for (int r = 0; r < 1500; r++)
        {
            var len = Rng.Next(4, 12);
            all.Add(Enumerable.Range(0, len).Select(_ => values[Rng.Next(values.Length)]).ToArray());
        }
        return all;
    }

    // V3: PlayerDeck.AddCardValue (PlayerDeck.cs:150-197) after each card: [total, ace count, bust].
    static object AddVectors()
    {
        var cases = new List<object>();
        foreach (var seq in Sequences())
        {
            var (player, normal, _, _, _) = NewSeat(false, 0, 0);
            var steps = new List<object>();
            foreach (var v in seq) { normal.Add(v); steps.Add(Hand(normal)); }
            cases.Add(new { cards = seq, steps });
        }
        return cases;
    }

    // Dealer.AddCardValue (Dealer.cs:196-231): the same arithmetic, checked on its own.
    static object DealerAddVectors()
    {
        var cases = new List<object>();
        foreach (var seq in Sequences().Where((_, i) => i % 7 == 0))
        {
            var (_, _, _, _, table) = NewSeat(false, 0, 0);
            var steps = new List<object>();
            foreach (var v in seq) { table.Dealer.Add(v); steps.Add(new[] { table.Dealer.localDeckValue, table.Dealer.NumOfAces, table.Dealer.IsBust ? 1 : 0 }); }
            cases.Add(new { cards = seq, steps });
        }
        return cases;
    }

    // V4: Split (Player.cs:353-378) on a pair, then cards to each hand in upstream's order (split hand first).
    static object SplitVectors()
    {
        var cases = new List<object>();
        for (int v = 2; v <= 11; v++)
        {
            for (int r = 0; r < 12; r++)
            {
                var usingChips = r % 2 == 0;
                var (player, normal, split, chips, _) = NewSeat(usingChips, 10, r % 4 == 0 ? 15 : 100);
                normal.Add(v);
                normal.Add(v);
                player.SecondCardValue = v;
                player.CanSplit = true;
                player.Split();
                var afterSplit = new[] { Hand(normal), Hand(split) };
                var splitCards = Enumerable.Range(0, Rng.Next(1, 4)).Select(_ => Rng.Next(2, 12)).ToArray();
                var normalCards = Enumerable.Range(0, Rng.Next(1, 4)).Select(_ => Rng.Next(2, 12)).ToArray();
                if (r == 0) { splitCards = new[] { 10 }; normalCards = new[] { 10 }; }
                // SummonCard at 1 s: SplitDeck first (Player.cs:373), then NormalDeck (:374); hits after that.
                split.Add(splitCards[0]);
                normal.Add(normalCards[0]);
                foreach (var c in splitCards.Skip(1)) split.Add(c);
                foreach (var c in normalCards.Skip(1)) normal.Add(c);
                cases.Add(new { pair = v, usingChips, chipCount = chips.CurrentChipCount, betAfterSplit = chips.CurrentBet[0], afterSplit, splitCards, normalCards, normal = Hand(normal), split = Hand(split) });
            }
        }
        return cases;
    }

    // V6: SetWinState (Player.cs:468-576): banners, sounds and the chip change on the holder's client.
    static object SettleVectors()
    {
        var cases = new List<object>();
        var normals = new[] { 0, 12, 16, 17, 18, 19, 20, 21, 22, 25 };
        var dealers = new[] { 0, 16, 17, 18, 19, 20, 21, 22, 26 };
        var splits = new int?[] { null, 12, 17, 20, 21, 22 };
        foreach (var n in normals) foreach (var d in dealers) foreach (var s in splits)
        foreach (var bet in new[] { 10, 20 })
        foreach (var active in new[] { true, false })
        {
            if (!active && (s != null || bet != 10)) continue;
            var (player, normal, split, chips, table) = NewSeat(true, bet, 100);
            player.IsActive = active;
            normal.localDeckValue = n;
            table.Dealer.localDeckValue = d;
            if (s != null) { player.HasSplit = true; split.localDeckValue = s.Value; }
            Trace.Log.Clear();
            player.SetWinState();
            cases.Add(new { normal = n, dealer = d, split = s, bet, active, chipDelta = chips.CurrentChipCount - 100, log = Trace.Log.ToArray() });
        }
        return cases;
    }

    // V7: ChipController (ChipController.cs:38-110) under random operations on three tables.
    static object ChipVectors()
    {
        var runs = new List<object>();
        for (int run = 0; run < 30; run++)
        {
            var chips = new ChipController { CurrentChipCount = 100, StartingChips = 100, CurrentBet = new int[3] };
            var steps = new List<object>();
            for (int k = 0; k < 25; k++)
            {
                var t = Rng.Next(3);
                var amount = Rng.Next(2) == 0 ? 5 : 10;
                string op;
                Trace.Log.Clear();
                switch (Rng.Next(7))
                {
                    case 0: case 1: case 2: op = $"AddToBet {t} {amount * (Rng.Next(4) == 0 ? 5 : 1)}"; chips.AddToBet(t, int.Parse(op.Split(' ')[2])); break;
                    case 3: op = $"TakeFromBet {t} {amount}"; chips.TakeFromBet(t, amount); break;
                    case 4: op = $"AddChips {amount * 3}"; chips.AddChips(amount * 3); break;
                    case 5: op = $"RemoveChips {amount * 3}"; chips.RemoveChips(amount * 3); break;
                    default: op = Rng.Next(3) == 0 ? "ResetChips" : $"ResetBet {t}"; if (op == "ResetChips") chips.ResetChips(); else chips.ResetBet(t); break;
                }
                steps.Add(new { op, chips = chips.CurrentChipCount, bets = chips.CurrentBet.ToArray(), sounds = Trace.Log.ToArray() });
            }
            runs.Add(steps);
        }
        return runs;
    }

    // V8: the deal schedule (Controller.cs:204-215) for 1 to 7 seats in the round.
    static object ScheduleVectors()
    {
        var cases = new List<object>();
        for (int n = 1; n <= 7; n++)
        {
            var (_, _, _, _, table) = NewSeat(false, 0, 0);
            table.Dealer.Name = "Dealer";
            table.ActivePlayers = Enumerable.Range(0, n).Select(i => new Player { Name = "Player" + i }).ToArray();
            Trace.Delayed.Clear();
            table.Schedule();
            cases.Add(new { n, events = Trace.Delayed.Select(e => new object[] { e.who, e.name, e.seconds }).ToArray() });
        }
        return cases;
    }

    // V9: DealerPlay (Dealer.cs:61-94): flip, then draw every 0.5 s while under 17 and not bust.
    static object DealerPlayVectors()
    {
        var cases = new List<object>();
        for (int hole = 2; hole <= 11; hole++)
        for (int up = 2; up <= 11; up++)
        {
            var (_, _, _, _, table) = NewSeat(false, 0, 0);
            var dealer = table.Dealer;
            dealer.Add(hole);
            dealer.Add(up);
            var stream = Enumerable.Range(0, 10).Select(_ => Rng.Next(2, 12)).ToArray();
            foreach (var c in stream) dealer.Draws.Enqueue(c);
            Trace.Delayed.Clear();
            Trace.Log.Clear();
            var delays = new List<double>();
            dealer.DealerPlay();
            while (Trace.Delayed.Count > 0 && Trace.Delayed[^1].name == "DealerPlay")
            {
                delays.Add(Trace.Delayed[^1].seconds);
                Trace.Delayed.Clear();
                dealer.DealerPlay();
            }
            cases.Add(new { hole, up, stream, drawn = dealer.Drawn, total = dealer.localDeckValue, bust = dealer.IsBust, finished = table.Finished, delays, bustEvent = Trace.Log.Contains("net:DealerUI.Bust") });
        }
        return cases;
    }
}
