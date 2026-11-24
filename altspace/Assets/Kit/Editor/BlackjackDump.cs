// Development aid for the kit builder: writes every object path of upstream's table prefab, with its components and
// active flag, to Logs/blackjack_dump.txt (PortKit/Blackjack/Dump Upstream).
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace Blackjack
{
    public static class BlackjackDump
    {
        [MenuItem("PortKit/Blackjack/Dump Upstream")]
        public static void Dump()
        {
            var text = new StringBuilder();
            foreach (var path in new[] { "Assets/Upstream/Prefabs/Internal DO NOT TOUCH/Blackjack.prefab", "Assets/Upstream/Prefabs/Blackjack System.prefab", "Assets/Upstream/Prefabs/Card Prefabs/[2] 2 Clubs.prefab" })
            {
                var root = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                text.AppendLine("== " + path);
                foreach (var t in root.GetComponentsInChildren<Transform>(true))
                {
                    var names = string.Join(",", t.GetComponents<Component>().Select(c => c == null ? "MISSING" : c.GetType().Name));
                    string p = t == root.transform ? "." : PortKit.KitStage.KitPath(t, root.transform);
                    text.AppendLine($"{p} [{names}]{(t.gameObject.activeSelf ? "" : " (off)")} pos {t.localPosition} rot {t.localEulerAngles} scale {t.localScale}");
                    var mf = t.GetComponent<MeshFilter>();
                    if (mf != null && mf.sharedMesh != null) text.AppendLine($"    mesh {mf.sharedMesh.name} bounds {mf.sharedMesh.bounds}");
                }
            }
            System.IO.File.WriteAllText("Logs/blackjack_dump.txt", text.ToString());
            Debug.Log("[blackjack] dump written");
        }
    }
}
