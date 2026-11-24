// Stand-ins for what the extracted upstream methods touch (UdonSharp, VRChat, Unity), and the rest of each upstream
// class's fields. Calls that would reach the network, animators or audio are recorded in Trace.Log instead.
// The rule methods themselves are in Extracted.cs, copied verbatim from upstream by golden/extract.ts.

using System;
using System.Collections.Generic;

namespace UnityEngine
{
    public static class Random
    {
        /// <summary>Scripted start indices: Range pops the next one (taken modulo max - min).</summary>
        public static readonly Queue<int> Script = new Queue<int>();
        public static int Range(int min, int max)
        {
            if (Script.Count == 0) throw new InvalidOperationException("Random.Range called with no scripted value left");
            var v = Script.Dequeue();
            return min + (((v - min) % (max - min)) + (max - min)) % (max - min);
        }
    }

    public static class Debug
    {
        public static void Log(object message) { }
    }

    public class GameObject { }
    public class AudioClip { public string Name = ""; }
    public class AudioSource
    {
        public bool isPlaying;
        public void PlayOneShot(AudioClip clip) { CentauriCore.Blackjack.Trace.Log.Add("sound:" + clip.Name); }
    }
}

namespace VRC.SDKBase
{
    public static class VRCPlayerApi
    {
        public static int PlayerCount = 2;
        public static int GetPlayerCount() => PlayerCount;
    }
}

namespace VRC.Udon.Common.Interfaces
{
    public enum NetworkEventTarget { All, Owner }
}

namespace CentauriCore.Blackjack
{
    using UnityEngine;
    using VRC.Udon.Common.Interfaces;

    public static class Trace
    {
        public static readonly List<string> Log = new List<string>();
        public static readonly List<(string who, string name, double seconds)> Delayed = new List<(string, string, double)>();
    }

    public class UdonSharpBehaviour
    {
        public string Name = "";
        public GameObject gameObject = new GameObject();
        public int Serializations;
        public void RequestSerialization() { Serializations++; }
        public virtual void OnPreSerialization() { }
        public void SendCustomNetworkEvent(NetworkEventTarget target, string name) { Trace.Log.Add($"net:{Name}.{name}"); }
        public void SendCustomEventDelayedSeconds(string name, float seconds) { Trace.Delayed.Add((Name, name, seconds)); }
        public void SendCustomEventDelayedFrames(string name, int frames) { Trace.Log.Add($"frames:{Name}.{name}:{frames}"); }
    }

    public partial class DeckManager : UdonSharpBehaviour
    {
        public int NumberOfDecks = 2;
        public GameObject[] CardReferences = new GameObject[52];
        public int[] NumOfEachCardLeft;
    }

    public partial class PlayerDeck : UdonSharpBehaviour
    {
        public Player PlayerController;
        public bool IsBust;
        public int TotalDeckValue;
        public int localDeckValue;
        public DeckManager Deck;
        public int NumOfAces = 0;
        public bool isSplitDeck;
        public void Add(int value) => AddCardValue(value);
        public int Unused() => GetUnusedCardIndex();
    }

    public partial class Dealer : UdonSharpBehaviour
    {
        public bool IsBust;
        public int TotalDeckValue;
        public int localDeckValue;
        public Controller GameController;
        public DeckManager Deck;
        public DealerUIController DealerUI = new DealerUIController { Name = "DealerUI" };
        public int NumOfAces = 0;
        public bool hasFlippedCard = false;
        /// <summary>Values the dealer's draws give, in order (SummonCard stands in for the draw and the spawn).</summary>
        public readonly Queue<int> Draws = new Queue<int>();
        public int Drawn;
        public void SummonCard() { Drawn++; AddCardValue(Draws.Dequeue()); }
        public void Add(int value) => AddCardValue(value);
        public int Unused() => GetUnusedCardIndex();
        public void GlobalFlip() { }
        public int GetDeckValue() => localDeckValue;
    }

    public partial class Player : UdonSharpBehaviour
    {
        public Controller BlackjackController;
        public int PlayerNum = 0;
        public bool IsActive = false;
        public bool HasFinishedTurn;
        public bool CanSplit;
        public bool HasSplit;
        public PlayerDeck NormalDeck;
        public PlayerDeck SplitDeck;
        public int SecondCardValue;
        public bool isOwner;
        public PlayerUIController PlayerUI = new PlayerUIController { Name = "PlayerUI" };
        public int TotalBet;
        public ChipController ChipController;
        public bool CanBet = true;
        public bool isSplitting = false;
        public void SyncedSplit() { }
        public void ResetIsSplitting() { isSplitting = false; }
        public void EndTurn() { Trace.Log.Add("EndTurn"); }
    }

    public partial class ChipController : UdonSharpBehaviour
    {
        public int CurrentChipCount;
        public int StartingChips = 100;
        public int[] CurrentBet;
        public AudioSource Audio = new AudioSource();
        public AudioClip NotEnoughChipsClip = new AudioClip { Name = "NotEnoughChips" };
        public AudioClip AddToBetClip = new AudioClip { Name = "AddToBet" };
    }

    public partial class Controller : UdonSharpBehaviour
    {
        public bool UsingChips;
        public ChipController ChipController;
        public AudioController AudioController = new AudioController();
        public Dealer Dealer;
        public Player[] ActivePlayers;
        public int TableIndex;
        public bool Finished;
        public void FinishMatch() { Finished = true; }
        public void StartActivePlay() { }
        public void GameActiveRefresh() { }
    }

    public class AudioController
    {
        public void PlayFlipCard() { Trace.Log.Add("sound:Flip"); }
        public void PlayDrawCard() { Trace.Log.Add("sound:Draw"); }
        public void PlaySplitDeck() { Trace.Log.Add("sound:Split"); }
        public void PlayBust() { Trace.Log.Add("sound:Bust"); }
        public void PlayWinMatch() { Trace.Log.Add("sound:Win"); }
        public void PlayLoseMatch() { Trace.Log.Add("sound:Lose"); }
        public void PlayDrawMatch() { Trace.Log.Add("sound:DrawMatch"); }
    }

    public class PlayerUIController : UdonSharpBehaviour
    {
        public void SetWin() { Trace.Log.Add("ui:Win"); }
        public void SetDraw() { Trace.Log.Add("ui:Draw"); }
        public void SetLose() { Trace.Log.Add("ui:Lose"); }
        public void SplitWin() { Trace.Log.Add("ui:SplitWin"); }
        public void SplitDraw() { Trace.Log.Add("ui:SplitDraw"); }
        public void SplitLose() { Trace.Log.Add("ui:SplitLose"); }
    }

    public class DealerUIController : UdonSharpBehaviour { }
}
