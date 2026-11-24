// The blackjack kit: one table of VRCBlackjack (Centauri2442/VRCBlackjack, Copyright 2022 CentauriCore, Apache License 2.0)
// made into a kit the snippet script loads. This file is new (written for the Altspace port); it changes the upstream
// prefabs as listed in altspace/PORT.md ("Kit as built") and altspace/THIRD-PARTY-NOTICES.md.
//
// What it does, in order: copies the entry prefab's chip controller and one table, as upstream's custom inspector did;
// strips the debug panels, the dead popups, the overhead camera and the trigger volumes; puts a card slot (the upstream
// card prefab's animator over a new card mesh, faces from a CC0 atlas chosen per renderer by `_CardIndex`) at every one
// of the 165 card positions; remakes the materials for URP; swaps the three unlicensed fonts for OFL ones; makes every
// button a click target on the UI layer; replaces the dealer-height slider with two buttons; adds a credits panel; and
// writes bindings.json with the same object keys and behaviour ids the TypeScript tests use.
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using PortKit;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Rendering;
using Object = UnityEngine.Object;

namespace Blackjack
{
    public sealed class BlackjackKitBuilder : KitBuilder
    {
        const string Up = "Assets/Upstream";
        const string SystemPrefab = Up + "/Prefabs/Blackjack System.prefab";
        const string TablePrefab = Up + "/Prefabs/Internal DO NOT TOUCH/Blackjack.prefab";
        const string CardPrefab = Up + "/Prefabs/Card Prefabs/[2] 2 Clubs.prefab";
        const string TextureFolder = Up + "/Meshes/Table/Textures";
        const string KitTextures = "Assets/Kit/Textures";
        const string MaterialFolder = "Assets/Kit/Materials";
        const string MeshFolder = "Assets/Kit/Meshes";
        const string FontFolder = "Assets/Kit/Fonts";
        const int Seats = 7, Cards = 11;

        /// <summary>
        /// The seat and table buttons as uGUI `uiButton` events through the relay graph instead of collider clicks: only for
        /// measuring the relay graph both ways (PORT.md, "clicks"). Set BLACKJACK_UIBUTTONS=1 in the editor's environment, or create Library/PortKit/blackjack_uibuttons.
        /// </summary>
        static bool UiButtons => Environment.GetEnvironmentVariable("BLACKJACK_UIBUTTONS") == "1" || File.Exists("Library/PortKit/blackjack_uibuttons");

        public override string Slug => "blackjack";
        public override string Title => "Blackjack Table";
        public override string Summary => "A seven-seat blackjack table: hit, stand and split against an automatic or player dealer. A port of VRCBlackjack.";
        public override string Description =>
            "Blackjack for up to seven players at one table, with a dealer who plays by the house rule (draws to 16, stands on " +
            "every 17). Take a seat, bet chips if the table uses them, hit, stand or split; every win pays 1 to 1. The table's " +
            "owner starts rounds, switches between automatic and manual dealing, and sets helpers, chips and the deck count. " +
            "Cards are dealt from a shuffle every seated player contributes to, and the dealer's hole card stays hidden until the " +
            "flip. A port of VRCBlackjack by CentauriCore (https://github.com/Centauri2442/VRCBlackjack, Apache License 2.0); " +
            "the credits panel lists every licence.";
        public override IReadOnlyList<(string name, string value)> SnippetSettings => new[]
        {
            ("room", ""), ("chips", "false"), ("starting-chips", "100"), ("decks", "2"), ("helpers", "false"), ("manual", "false"),
            ("allow-change", "false"), ("turn-seconds", "30"), ("range", "5"),
        };

        GameObject table;
        readonly List<GameObject> uiButtons = new List<GameObject>();
        TMP_FontAsset labelFont, bannerFont, actionFont;

        Transform F(string path)
        {
            var t = table.transform.Find(path);
            if (t == null) throw new Exception($"the table has no '{path}'");
            return t;
        }

        protected override void Compose(KitStage stage)
        {
            var systemAsset = Load<GameObject>(SystemPrefab);
            var tableAsset = Load<GameObject>(TablePrefab);
            var system = stage.Copy(systemAsset, null, "System");
            foreach (Transform child in system.transform.Cast<Transform>().ToList())
                if (child.name.StartsWith("Tables", StringComparison.Ordinal)) Object.DestroyImmediate(child.gameObject);
            table = stage.Copy(tableAsset, null, "Table");
            foreach (var t in stage.Root.GetComponentsInChildren<Transform>(true)) t.gameObject.layer = 0;   // VRChat's layers mean nothing here

            Strip(stage);
            Materials(stage);
            var slots = CardSlots(stage);
            HeightButtons(stage);
            Bind(stage, system, slots);
            Credits(stage, F("Dealer/Dealer UI Controller/Auto Canvas"), (RectTransform)F("Dealer/Dealer UI Controller/Auto Canvas/Mask/Owner/Start Game"));
            Sounds(system);
            Fonts();
        }

        // ------------------------------------------------------------------ what goes

        void Strip(KitStage stage)
        {
            int gone = 0;
            void Remove(GameObject go) { if (go != null) { Object.DestroyImmediate(go); gone++; } }
            for (int i = 0; i < Seats; i++)
            {
                var seat = F($"Players/Players/Player {i}");
                Remove(seat.Find("Debug Panel (inactive)")?.gameObject ?? seat.Cast<Transform>().FirstOrDefault(t => t.name.StartsWith("Debug Panel"))?.gameObject);   // L1
                foreach (var t in seat.GetComponentsInChildren<Transform>(true).Where(t => t != null && t.name == "Manual Hits").ToList()) Remove(t.gameObject); // L2
            }
            // L2: anything else with a particle system is a dead popup
            foreach (var ps in table.GetComponentsInChildren<ParticleSystem>(true).ToList()) if (ps != null) Remove(ps.gameObject);
            // K9: the overhead screen's camera and render target are left out; the dealer's total stays on its canvas
            var camera = F("Dealer Camera");
            foreach (var c in camera.GetComponentsInChildren<Camera>(true).ToList()) Object.DestroyImmediate(c);
            Remove(camera.Find("Dealer Screen")?.gameObject);
            // C10: range is head distance; the trigger volumes go (and the touch capsules, L5)
            foreach (var col in stage.Root.GetComponentsInChildren<Collider>(true).Where(c => c.isTrigger).ToList())
            {
                if (col.GetComponent<MonoBehaviour>() != null && col.name != "Distance Optimizer" && col.name != "Audio Controller" && col.name != "Interactable Controller")
                {
                    col.isTrigger = false;                                                                       // a touch box: clicked now
                    continue;
                }
                Object.DestroyImmediate(col);
            }
            // uGUI: clicks come through colliders, not uGUI raycasting (unless measuring); persistent calls went to Udon
            foreach (var raycaster in table.GetComponentsInChildren<UnityEngine.UI.GraphicRaycaster>(true))
                if (!UiButtons) Object.DestroyImmediate(raycaster);
            foreach (var button in table.GetComponentsInChildren<UnityEngine.UI.Button>(true))
                for (int i = button.onClick.GetPersistentEventCount() - 1; i >= 0; i--) UnityEditor.Events.UnityEventTools.RemovePersistentListener(button.onClick, i);
            var circle = AssetDatabase.LoadAllAssetsAtPath(Up + "/UI/Circle.png").OfType<Sprite>().FirstOrDefault();
            foreach (var image in table.GetComponentsInChildren<UnityEngine.UI.Image>(true))
            {
                string path = image.sprite != null ? AssetDatabase.GetAssetPath(image.sprite) : "";
                if (image.sprite != null && !path.StartsWith("Assets/", StringComparison.Ordinal)) { image.sprite = null; image.type = UnityEngine.UI.Image.Type.Simple; }   // built-in UI sprites do not travel
                else if (image.sprite == null && KitStage.KitPath(image.transform, table.transform).Contains("/ACTIVE")) image.sprite = circle;  // Q19
            }
            stage.Report.AppendLine($"   blackjack: removed {gone} objects (debug panels, popups, the overhead screen)");
        }

        // ------------------------------------------------------------------ cards

        /// <summary>A card slot at each of the 165 positions: key -> (slot root, face renderer object).</summary>
        Dictionary<string, (GameObject slot, GameObject face)> CardSlots(KitStage stage)
        {
            var cardAsset = Load<GameObject>(CardPrefab);
            var (faceMesh, backMesh) = CardMeshes(cardAsset);
            var cardMaterial = CardMaterial();
            var slots = new Dictionary<string, (GameObject, GameObject)>();
            void Slot(string key, Transform position)
            {
                var card = stage.Create("Card", position);
                card.transform.localPosition = Vector3.zero;
                card.transform.localRotation = Quaternion.identity;
                var s = position.lossyScale;
                card.transform.localScale = new Vector3(1f / s.x, 1f / s.y, 1f / s.z);                      // upstream keeps the card's world scale
                var animator = card.AddComponent<Animator>();
                animator.runtimeAnimatorController = cardAsset.GetComponent<Animator>().runtimeAnimatorController;
                var sourceViz = cardAsset.transform.Find("Viz");
                var viz = stage.Create("Viz", card.transform);
                Copy(sourceViz, viz.transform);
                var face = MeshObject(stage, "Card", viz.transform, sourceViz.Find("Card"), faceMesh, cardMaterial);
                MeshObject(stage, "Empty Card", viz.transform, sourceViz.Find("Empty Card"), backMesh, cardMaterial);
                card.SetActive(false);                                                                       // dealt cards switch on
                slots[key] = (card, face);
            }
            var dealerPositions = F("Dealer/Card Positions");
            for (int k = 0; k < Cards; k++) Slot($"d{k}", dealerPositions.Find((k + 1).ToString(CultureInfo.InvariantCulture)));
            for (int i = 0; i < Seats; i++)
            {
                var anim = F($"Players/Players/Player {i}/Card Position Animator");
                for (int k = 0; k < Cards; k++)
                {
                    Slot($"p{i}_n{k}", anim.Find($"Positions/{k + 1}"));
                    Slot($"p{i}_s{k}", anim.Find($"Split Positions/{k + 1}"));
                }
            }
            stage.Report.AppendLine($"   blackjack: {slots.Count} card slots");
            return slots;
        }

        static void Copy(Transform from, Transform to)
        {
            to.localPosition = from.localPosition;
            to.localRotation = from.localRotation;
            to.localScale = from.localScale;
        }

        static GameObject MeshObject(KitStage stage, string name, Transform parent, Transform like, Mesh mesh, Material material)
        {
            var go = stage.Create(name, parent);
            Copy(like, go.transform);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var r = go.AddComponent<MeshRenderer>();
            r.sharedMaterial = material;
            r.shadowCastingMode = ShadowCastingMode.Off;
            r.receiveShadows = false;
            r.lightProbeUsage = LightProbeUsage.Off;
            r.reflectionProbeUsage = ReflectionProbeUsage.Off;
            return go;
        }

        /// <summary>
        /// New card meshes in place of upstream's uncredited DeckOfCards.fbx: one quad for the face and one for the back,
        /// each where upstream's mesh was (its bounds, facing where its triangles face), with UVs running the way upstream's
        /// UVs ran, 0..1 over the card (the card shader picks the atlas cell).
        /// </summary>
        (Mesh face, Mesh back) CardMeshes(GameObject cardAsset)
        {
            Directory.CreateDirectory(MeshFolder);
            var viz = cardAsset.transform.Find("Viz");
            var faceSource = viz.Find("Card").GetComponentInChildren<MeshFilter>(true).sharedMesh;
            var backSource = viz.Find("Empty Card").GetComponentInChildren<MeshFilter>(true).sharedMesh;
            return (Quad(faceSource, "CardFace"), Quad(backSource, "CardBack"));
        }

        static Mesh Quad(Mesh source, string name)
        {
            var v = source.vertices;
            var uv = source.uv;
            var b = source.bounds;
            // the facing: the summed triangle normals
            var tris = source.triangles;
            var n = Vector3.zero;
            for (int i = 0; i < tris.Length; i += 3) n += Vector3.Cross(v[tris[i + 1]] - v[tris[i]], v[tris[i + 2]] - v[tris[i]]);
            int normalAxis = Largest(n);
            float facing = Mathf.Sign(n[normalAxis]);
            // which axis u and v run along, and which way: correlation of the texture coordinate with each axis
            int uAxis = -1, vAxis = -1;
            float uSign = 1, vSign = 1;
            float best = 0;
            for (int a = 0; a < 3; a++) if (a != normalAxis) { float c = Corr(v, uv, a, 0); if (Mathf.Abs(c) > Mathf.Abs(best)) { best = c; uAxis = a; } }
            uSign = Mathf.Sign(best);
            vAxis = 3 - normalAxis - uAxis;
            vSign = Mathf.Sign(Corr(v, uv, vAxis, 1));
            float depth = facing > 0 ? b.max[normalAxis] : b.min[normalAxis];
            var corners = new Vector3[4];
            var uvs = new Vector2[4];
            for (int i = 0; i < 4; i++)
            {
                float u = (i == 1 || i == 2) ? 1 : 0, w = i >= 2 ? 1 : 0;
                var p = Vector3.zero;
                p[normalAxis] = depth;
                p[uAxis] = Mathf.Lerp(uSign > 0 ? b.min[uAxis] : b.max[uAxis], uSign > 0 ? b.max[uAxis] : b.min[uAxis], u);
                p[vAxis] = Mathf.Lerp(vSign > 0 ? b.min[vAxis] : b.max[vAxis], vSign > 0 ? b.max[vAxis] : b.min[vAxis], w);
                corners[i] = p;
                uvs[i] = new Vector2(u, w);
            }
            // wind the two triangles so they face along the source's normal
            var normal = Vector3.zero;
            normal[normalAxis] = facing;
            int[] t = Vector3.Dot(Vector3.Cross(corners[1] - corners[0], corners[2] - corners[0]), normal) > 0 ? new[] { 0, 1, 2, 0, 2, 3 } : new[] { 0, 2, 1, 0, 3, 2 };
            var mesh = new Mesh { name = name, vertices = corners, uv = uvs, triangles = t, normals = Enumerable.Repeat(normal, 4).ToArray() };
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();
            string path = $"{MeshFolder}/{name}.asset";
            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (existing != null) { EditorUtility.CopySerialized(mesh, existing); EditorUtility.SetDirty(existing); return existing; }
            AssetDatabase.CreateAsset(mesh, path);
            return mesh;
        }

        static int Largest(Vector3 n) => Mathf.Abs(n.x) >= Mathf.Abs(n.y) && Mathf.Abs(n.x) >= Mathf.Abs(n.z) ? 0 : Mathf.Abs(n.y) >= Mathf.Abs(n.z) ? 1 : 2;

        static float Corr(Vector3[] v, Vector2[] uv, int axis, int comp)
        {
            if (uv == null || uv.Length != v.Length || v.Length == 0) return 1;
            double mx = 0, my = 0;
            for (int i = 0; i < v.Length; i++) { mx += v[i][axis]; my += uv[i][comp]; }
            mx /= v.Length; my /= v.Length;
            double sxy = 0, sxx = 0, syy = 0;
            for (int i = 0; i < v.Length; i++) { double dx = v[i][axis] - mx, dy = uv[i][comp] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
            return sxx * syy <= 0 ? 0 : (float)(sxy / Math.Sqrt(sxx * syy));
        }

        Material CardMaterial()
        {
            var shader = Shader.Find("AltspaceGames/BlackjackCard") ?? throw new Exception("the card shader did not compile");
            var atlas = Texture($"{KitTextures}/CardAtlas.png", 2048, srgb: true, alpha: true);
            var m = Save(new Material(shader) { name = "Card" });
            m.SetTexture("_BaseMap", atlas);
            m.SetFloat("_CardIndex", -1);
            m.enableInstancing = false;
            EditorUtility.SetDirty(m);
            return m;
        }

        // ------------------------------------------------------------------ materials and textures (PORT.md 6.3 budget)

        void Materials(KitStage stage)
        {
            Directory.CreateDirectory(MaterialFolder);
            var lit = Shader.Find("Universal Render Pipeline/Lit") ?? throw new Exception("URP Lit shader not found");
            string felt = Directory.GetFiles(TextureFolder + "/Surfaces", "*Table_Surface_Normal.png")[0].Replace('\\', '/');
            var made = new Dictionary<string, Material>
            {
                ["Table_Surface"] = LitMaterial(lit, "Table_Surface", $"{KitTextures}/FeltAlbedo.jpg", 2048, felt, 1024, "Table_Surface", null, 0),
                ["Table_Outer"] = LitMaterial(lit, "Table_Outer", $"{TextureFolder}/Table_Outer_AlbedoTransparency.png", 1024, $"{TextureFolder}/Table_Outer_Normal.png", 1024, "Table_Outer",
                                              $"{TextureFolder}/Table_Outer_Emission.png", 512),
                ["Table_ArmRest"] = LitMaterial(lit, "Table_ArmRest", $"{TextureFolder}/Table_ArmRest_AlbedoTransparency.png", 1024, $"{TextureFolder}/Table_ArmRest_Normal.png", 512, "Table_ArmRest", null, 0),
                ["Table_Hard_Surface"] = LitMaterial(lit, "Table_Hard_Surface", $"{TextureFolder}/Table_Hard_Surface_AlbedoTransparency.png", 1024, $"{TextureFolder}/Table_Hard_Surface_Normal.png", 512, "Table_Hard_Surface", null, 0),
                ["Pockets_Outer"] = LitMaterial(lit, "Pockets_Outer", $"{TextureFolder}/Pockets_Outer_AlbedoTransparency.png", 512, $"{TextureFolder}/Pockets_Outer_Normal.png", 256, "Pockets_Outer", null, 0),
                ["Pockets_Bottom_Icon"] = LitMaterial(lit, "Pockets_Bottom_Icon", $"{TextureFolder}/Pockets_Bottom_Icon_AlbedoTransparency.png", 512, $"{TextureFolder}/Pockets_Bottom_Icon_Normal.png", 256, "Pockets_Bottom_Icon", null, 0),
            };
            made["Table_Outer"].SetColor("_EmissionColor", new Color(2.9960785f, 1.6f, 0f, 1f));
            foreach (var m in made.Values)
            {
                BaseShaderGUI.SetMaterialKeywords(m, UnityEditor.Rendering.Universal.ShaderGUI.LitGUI.SetMaterialKeywords);   // URP's own set-up (chess: +25% bundle without it)
                EditorUtility.SetDirty(m);
            }
            int swapped = 0;
            foreach (var renderer in table.GetComponentsInChildren<Renderer>(true))
            {
                var shared = renderer.sharedMaterials;
                for (int i = 0; i < shared.Length; i++)
                    if (shared[i] != null && made.TryGetValue(shared[i].name, out var mine)) { shared[i] = mine; swapped++; }
                renderer.sharedMaterials = shared;
            }
            AssetDatabase.SaveAssets();
            stage.Report.AppendLine($"   blackjack: {swapped} table material slots now URP Lit");
        }

        Material LitMaterial(Shader lit, string name, string albedo, int albedoSize, string normal, int normalSize, string mask, string emission, int emissionSize)
        {
            var m = Save(new Material(lit) { name = name });
            m.SetColor("_BaseColor", Color.white);
            m.SetTexture("_BaseMap", Texture(albedo, albedoSize, srgb: true, alpha: false));
            m.SetTexture("_BumpMap", Texture(normal, normalSize, normalMap: true));
            m.SetFloat("_BumpScale", 1f);
            var packed = Texture($"{KitTextures}/{name}_Mask.png", 4096, srgb: false, alpha: true);
            m.SetTexture("_MetallicGlossMap", packed);
            m.SetTexture("_OcclusionMap", packed);
            m.SetFloat("_OcclusionStrength", 1f);
            m.SetFloat("_Smoothness", 1f);
            m.SetFloat("_Metallic", 1f);
            m.SetFloat("_SmoothnessTextureChannel", 0f);                                                   // smoothness from the mask's alpha
            if (emission != null)
            {
                m.SetTexture("_EmissionMap", Texture(emission, emissionSize, srgb: true, alpha: false));
                m.EnableKeyword("_EMISSION");
                m.globalIlluminationFlags = MaterialGlobalIlluminationFlags.None;
            }
            m.enableInstancing = false;
            return m;
        }

        static Material Save(Material m)
        {
            string path = $"{MaterialFolder}/{m.name}.mat";
            var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null)
            {
                existing.shader = m.shader;
                existing.CopyPropertiesFromMaterial(m);
                existing.shaderKeywords = Array.Empty<string>();
                return existing;
            }
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        /// <summary>A texture with the budget's size: at most `size`, ASTC 6x6 on Android, compressed on Windows.</summary>
        static Texture2D Texture(string path, int size, bool srgb = true, bool alpha = false, bool normalMap = false)
        {
            var importer = AssetImporter.GetAtPath(path) as TextureImporter ?? throw new Exception($"no texture at {path}");
            importer.textureType = normalMap ? TextureImporterType.NormalMap : TextureImporterType.Default;
            importer.sRGBTexture = srgb && !normalMap;
            importer.alphaSource = alpha ? TextureImporterAlphaSource.FromInput : TextureImporterAlphaSource.None;
            importer.mipmapEnabled = true;
            importer.maxTextureSize = Math.Min(size, 2048);
            importer.textureCompression = TextureImporterCompression.Compressed;
            importer.crunchedCompression = false;
            importer.SetPlatformTextureSettings(new TextureImporterPlatformSettings
            {
                name = "Android", overridden = true, maxTextureSize = Math.Min(size, 2048), format = TextureImporterFormat.ASTC_6x6,
                textureCompression = TextureImporterCompression.Compressed,
            });
            importer.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
        }

        // ------------------------------------------------------------------ the dealer-height slider as two buttons (C12)

        void HeightButtons(KitStage stage)
        {
            var group = F("Dealer/Dealer UI Controller/Manual Canvas/Manual Dealer Canvas/Mask/Height Adjustment");
            var slider = group.GetComponentInChildren<UnityEngine.UI.Slider>(true);
            var sliderRect = slider != null ? (RectTransform)slider.transform : null;
            Vector2 centre = sliderRect != null ? sliderRect.anchoredPosition : Vector2.zero;
            Vector2 size = sliderRect != null ? sliderRect.sizeDelta : new Vector2(100, 20);
            if (slider != null) Object.DestroyImmediate(slider.gameObject);
            float w = Mathf.Max(size.x, size.y) * 0.45f, h = Mathf.Max(Mathf.Min(size.x, size.y), 18f);
            bool horizontal = size.x >= size.y;
            Button(stage, group, "Up", "RAISE", centre + (horizontal ? new Vector2(w * 0.55f, 0) : new Vector2(0, w * 0.55f)), new Vector2(horizontal ? w : h, horizontal ? h : w));
            Button(stage, group, "Down", "LOWER", centre - (horizontal ? new Vector2(w * 0.55f, 0) : new Vector2(0, w * 0.55f)), new Vector2(horizontal ? w : h, horizontal ? h : w));
        }

        GameObject Button(KitStage stage, Transform parent, string name, string label, Vector2 at, Vector2 size)
        {
            var go = stage.Create(name, parent);
            var rect = go.AddComponent<RectTransform>();
            rect.anchoredPosition = at;
            rect.sizeDelta = size;
            go.AddComponent<UnityEngine.UI.Image>().color = new Color(0.12f, 0.12f, 0.12f, 0.9f);
            var text = stage.Create("Text", go.transform).AddComponent<TextMeshProUGUI>();
            text.rectTransform.sizeDelta = size;
            text.font = KitText.DefaultFont();
            text.enableAutoSizing = true;
            text.fontSizeMin = 4;
            text.fontSizeMax = Mathf.Max(8f, size.y * 0.7f);
            text.color = Color.white;
            text.alignment = TextAlignmentOptions.Center;
            text.text = label;
            return go;
        }

        // ------------------------------------------------------------------ bindings (the keys and ids of the provisional file)

        void Bind(KitStage stage, GameObject system, Dictionary<string, (GameObject slot, GameObject face)> slots)
        {
            var objects = new Dictionary<string, GameObject>();
            GameObject Obj(string key, string path, bool click = false, bool refd = true) => ObjG(key, path == null ? table : F(path).gameObject, click, refd);
            GameObject ObjG(string key, GameObject go, bool click = false, bool refd = true)
            {
                if (go == null) throw new Exception($"no object for '{key}' (an upstream field left empty)");
                stage.Object(go, key: key, click: click ? true : (bool?)null);
                if (click)
                {
                    ClickCollider(go);
                    uiButtons.Add(go);
                }
                if (refd && !click) stage.Ref(go);
                objects[key] = go;
                return go;
            }
            GameObject O(string key) => objects.TryGetValue(key, out var go) ? go : throw new Exception($"no object '{key}'");
            JObject Ov(string key) => stage.ObjectValue(O(key));
            JObject Cv(string key, string kind) => stage.ComponentValue(O(key), kind);

            const string DUI = "Dealer/Dealer UI Controller", AUTO = DUI + "/Auto Canvas", MANUAL = DUI + "/Manual Canvas", MDC = MANUAL + "/Manual Dealer Canvas";
            stage.Object(system, key: "system");
            Obj("table", null, refd: false);
            Obj("controller", "Game Controller", refd: false);
            Obj("deck", "Deck", refd: false);
            Obj("dealer", "Dealer", refd: false);
            Obj("dealerUI", DUI, refd: false);
            Obj("audioController", "Audio Controller", refd: false);
            Obj("audio", "Audio Controller/Audio", refd: false);
            stage.Object(system.transform.Find("Chip Controller/Audio").gameObject, key: "chipAudio");
            stage.Object(system.transform.Find("Chip Controller").gameObject, key: "chipController");
            objects["chipAudio"] = system.transform.Find("Chip Controller/Audio").gameObject;
            objects["chipController"] = system.transform.Find("Chip Controller").gameObject;
            Obj("distance", "Distance Optimizer", refd: false);
            Obj("tableCanvas", DUI + "/Dealer Table Canvas");
            Obj("autoCanvas", AUTO);
            Obj("autoOwner", AUTO + "/Mask/Owner");
            Obj("autoIdle", AUTO + "/Mask/Idle");
            Obj("manualCanvas", MANUAL);
            Obj("manualOwner", MDC + "/Mask/Owner");
            Obj("manualNotOwner", MDC + "/Mask/Not Owner");
            Obj("heightGroup", MDC + "/Mask/Height Adjustment");
            Obj("heightAnim", MANUAL + "/Height Adjustment");
            Obj("manualSettings", MANUAL + "/Settings");
            Obj("resetButton", DUI + "/Reset Button");
            Obj("dealerCamera", "Dealer Camera");
            Obj("dealerValuesCanvas", "Dealer Camera/Dealer Card Canvas");
            Obj("dealerValues", "Dealer Camera/Dealer Card Canvas/Dealer Values");
            foreach (var (prefix, b) in new[] { ("", AUTO + "/Mask/Owner/Game Settings"), ("m", MANUAL + "/Settings") })
            {
                Obj(prefix + "helpersChanger", b + "/Helpers");
                Obj(prefix + "chipToggle", b + "/Use Chips");
                Obj(prefix + "deckChanger", b + "/Deck Count");
                var duiStandIn = F(DUI).GetComponent<CentauriCore.Blackjack.DealerUIController>();
                ObjG(prefix + "deckCount", (prefix == "" ? duiStandIn.DeckCount : duiStandIn.DeckCountManual).gameObject);
                ObjG(prefix + "deckSubArrow", prefix == "" ? duiStandIn.DeckSubtractArrow : duiStandIn.DeckSubtractArrowManual);
                foreach (var (key, name) in new[] { ("helpersOnBtn", "Helpers/Use Helpers On"), ("helpersOffBtn", "Helpers/Use Helpers Off"), ("chipsOnBtn", "Use Chips/Use Chips On"), ("chipsOffBtn", "Use Chips/Use Chips Off") })
                {
                    stage.Ref(Obj(prefix + key, $"{b}/{name}", click: true));                               // shown and hidden too
                }
                Obj(prefix + "deckAdd", b + "/Deck Count/Add", click: true);
                Obj(prefix + "deckSub", b + "/Deck Count/Subtract", click: true);
            }
            Obj("takeOwnership", AUTO + "/Mask/Idle/Take Ownership", click: true);
            Obj("takeOwnershipManual", MDC + "/Mask/Not Owner/Take Ownership", click: true);
            Obj("startGame", AUTO + "/Mask/Owner/Start Game", click: true);
            Obj("startGameManual", MDC + "/Mask/Owner/Start Game", click: true);
            Obj("swapToManual", AUTO + "/Mask/Owner/Game Settings/Manual Play/Swap to Manual", click: true);
            Obj("swapToAuto", MDC + "/Mask/Owner/Swap to AI Play", click: true);
            Obj("heightUp", MDC + "/Mask/Height Adjustment/Up", click: true);
            Obj("heightDown", MDC + "/Mask/Height Adjustment/Down", click: true);
            Obj("resetTable", DUI + "/Reset Button/Take Ownership", click: true);
            Obj("resetChips", DUI + "/Reset Button/Reset Chips", click: true);
            foreach (var pair in slots) BindSlot(stage, objects, pair.Key, pair.Value.slot, pair.Value.face);

            var buttons = new (string key, string box, string method, string viz, string icField)[]
            {
                ("Join", "Join Game", "_TakeControl", "Player UI/Not Owner UI/Player Idle/JOIN", "JoinGame"),
                ("Stand", "Stand", "Stand", "Player UI/Player UI Canvas/Player UI/Player/Buttons/STAND", "Stand"),
                ("Split", "Split", "Split", "Player UI/Player UI Canvas/Player UI/Player/Buttons/SPLIT", "Split"),
                ("HitSplit", "Hit Split", "_AutoSplitHitMe", "Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT SPLIT", "HitSplit"),
                ("HitNormal", "Hit Normal", "_AutoNormalHitMe", "Player UI/Player UI Canvas/Player UI/Player/Buttons/HIT NORMAL", "HitNormal"),
                ("Leave", "Leave Game", "ReleaseControl", "Player UI/Owner UI/Player UI Canvas (1)/LEAVE", "LeaveGame"),
                ("Add10", "Add 10", "_Add10ToBet", "Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 10", "Add10"),
                ("Add5", "Add 5", "_Add5ToBet", "Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Add 5", "Add5"),
                ("Remove10", "Remove 10", "_Remove10FromBet", "Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 10", "Remove10"),
                ("Remove5", "Remove 5", "_Remove5FromBet", "Chip Panel/Player UI Canvas/Chips Animator/Mask/Buttons/Remove 5", "Remove5"),
            };
            for (int i = 0; i < Seats; i++)
            {
                string p = $"p{i}", b = $"Players/Players/Player {i}", ui = b + "/Player UI/Player UI Canvas/Player UI", dp = b + "/Dealer Player UI Canvas";
                Obj(p, b, refd: false);
                Obj(p + "_nd", b + "/Normal Deck", refd: false);
                Obj(p + "_sd", b + "/Split Deck", refd: false);
                Obj(p + "_ui", b + "/Player UI", refd: false);
                Obj(p + "_ic", b + "/Interactable Controller", refd: false);
                Obj(p + "_uiAnim", ui);
                Obj(p + "_ownerUI", b + "/Player UI/Owner UI");
                Obj(p + "_notOwnerUI", b + "/Player UI/Not Owner UI/Player Idle");
                Obj(p + "_nameObj", b + "/Player UI/Not Owner UI/Player Name");
                var pl = F(b).GetComponent<CentauriCore.Blackjack.Player>();
                var pui = F(b + "/Player UI").GetComponent<CentauriCore.Blackjack.PlayerUIController>();
                ObjG(p + "_nameText", pui.PlayerOwner.gameObject);
                Obj(p + "_normalHelper", ui + "/Player/Normal Adjustment/HELPER");
                Obj(p + "_splitHelper", ui + "/Player/Split Adjustment/HELPER");
                ObjG(p + "_timer", F(b).GetComponent<CentauriCore.Blackjack.Player>().Timer.gameObject);
                Obj(p + "_dealerCanvas", dp);
                Obj(p + "_dealerMask", dp + "/Mask");
                ObjG(p + "_dealerName", pl.PlayerName.gameObject);
                ObjG(p + "_normalCount", F(b + "/Normal Deck").GetComponent<CentauriCore.Blackjack.PlayerDeck>().DealerValueDisplay.gameObject);
                ObjG(p + "_splitCount", F(b + "/Split Deck").GetComponent<CentauriCore.Blackjack.PlayerDeck>().DealerValueDisplay.gameObject);
                Obj(p + "_dHitNormal", dp + "/Mask/Game Active/Normal Mask/Normal/HIT", click: true);
                Obj(p + "_dHitSplit", dp + "/Mask/Game Active/Split Mask/Split/HIT", click: true);
                Obj(p + "_dStand", dp + "/Mask/Game Active/Stand", click: true);
                ObjG(p + "_chips", pl.BetPanel);
                ObjG(p + "_currentBet", pl.CurrentBet.gameObject);
                ObjG(p + "_totalChips", pl.TotalChips.gameObject);
                foreach (var bt in buttons) Obj($"{p}_viz{bt.key}", $"{b}/{bt.viz}");
                foreach (var bt in buttons) Obj($"{p}_b{bt.key}", $"{b}/Interactable Controller/{bt.box}", click: true);
                // Q14: seat 0's dealer panel follows the height control like the other six
                var constraint = F(dp).GetComponent<PositionConstraint>();
                var height = F(MANUAL + "/Height Adjustment/Height");
                if (constraint != null && (constraint.sourceCount == 0 || constraint.GetSource(0).sourceTransform == null))
                {
                    if (constraint.sourceCount == 0) constraint.AddSource(new ConstraintSource { sourceTransform = height, weight = 1 });
                    else constraint.SetSource(0, new ConstraintSource { sourceTransform = height, weight = 1 });
                    stage.Report.AppendLine($"   Q14: seat {i}'s dealer panel now follows the height control");
                }
            }

            // ---- behaviours: every stand-in, one sync group for the table, and what the port needs beyond upstream's fields ----
            stage.BehavioursFromStandIns();
            foreach (var type in new[] { "Controller", "DeckManager", "Dealer", "Player", "PlayerDeck" }) stage.GroupType(type, "table");
            var controller = F("Game Controller").GetComponent<CentauriCore.Blackjack.Controller>();
            var dealerUI = F(DUI).GetComponent<CentauriCore.Blackjack.DealerUIController>();
            var dealer = F("Dealer").GetComponent<CentauriCore.Blackjack.Dealer>();
            var deck = F("Deck").GetComponent<CentauriCore.Blackjack.DeckManager>();
            var chips = system.transform.Find("Chip Controller").GetComponent<CentauriCore.Blackjack.ChipController>();
            var distance = F("Distance Optimizer").GetComponent<CentauriCore.Blackjack.DistanceOptimizer>();
            var world = system.GetComponent<CentauriCore.Blackjack.BlackjackWorldController>();
            // The chip controller's own object is not bound in the provisional file: the behaviour sits on its audio object
            stage.Behaviour(controller, extra: new JObject
            {
                ["ChipController"] = stage.BehaviourValue(chips),
                ["DealerUI"] = stage.BehaviourValue(dealerUI),
                ["Distance"] = stage.BehaviourValue(distance),
            });
            stage.Behaviour(deck, extra: new JObject { ["BlackjackController"] = stage.BehaviourValue(controller) });
            stage.Behaviour(world, extra: new JObject { ["ChipController"] = stage.BehaviourValue(chips), ["BlackjackTables"] = new JArray(stage.BehaviourValue(controller)) });
            var dui = new JObject
            {
                // C18: "On" is the button that shows while the setting is on (upstream's ChipOn points at "Use Chips Off")
                ["ChipToggle"] = Ov("chipToggle"), ["ChipOn"] = Ov("chipsOffBtn"), ["ChipOff"] = Ov("chipsOnBtn"),
                ["DeckChanger"] = Ov("deckChanger"), ["DeckSubtractArrow"] = Ov("deckSubArrow"),
                ["HelpersChanger"] = Ov("helpersChanger"), ["HelpersOn"] = Ov("helpersOffBtn"), ["HelpersOff"] = Ov("helpersOnBtn"),
                ["ChipToggleManual"] = Ov("mchipToggle"), ["ChipOnManual"] = Ov("mchipsOffBtn"), ["ChipOffManual"] = Ov("mchipsOnBtn"),
                ["DeckChangerManual"] = Ov("mdeckChanger"), ["DeckSubtractArrowManual"] = Ov("mdeckSubArrow"),
                ["HelpersChangerManual"] = Ov("mhelpersChanger"), ["HelpersOnManual"] = Ov("mhelpersOffBtn"), ["HelpersOffManual"] = Ov("mhelpersOnBtn"),
                ["Slots"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Ov($"d{k}"))),
                ["SlotRenderers"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Cv($"d{k}f", "Renderer"))),
                ["SlotAnimators"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Cv($"d{k}", "Animator"))),
            };
            stage.Behaviour(dealerUI, extra: dui);
            for (int i = 0; i < Seats; i++)
            {
                string p = $"p{i}";
                var seat = F($"Players/Players/Player {i}");
                var player = seat.GetComponent<CentauriCore.Blackjack.Player>();
                var ic = seat.Find("Interactable Controller").GetComponent<CentauriCore.Blackjack.InteractableController>();
                stage.Behaviour(player, extra: new JObject { ["PlayerNum"] = i, ["Interactables"] = stage.BehaviourValue(ic), ["BlackjackController"] = stage.BehaviourValue(controller), ["Deck"] = stage.BehaviourValue(deck) });
                foreach (var (suffix, deckName, rows) in new[] { ("n", "Normal Deck", "n"), ("s", "Split Deck", "s") })
                {
                    var hand = seat.Find(deckName).GetComponent<CentauriCore.Blackjack.PlayerDeck>();
                    stage.Behaviour(hand, extra: new JObject
                    {
                        ["isSplitDeck"] = suffix == "s",
                        ["Slots"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Ov($"{p}_{rows}{k}"))),
                        ["SlotRenderers"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Cv($"{p}_{rows}{k}f", "Renderer"))),
                        ["SlotAnimators"] = new JArray(Enumerable.Range(0, Cards).Select(k => (JToken)Cv($"{p}_{rows}{k}", "Animator"))),
                        ["DealerValueDisplay"] = Cv($"{p}_{(suffix == "n" ? "normalCount" : "splitCount")}", "TMP"),
                    });
                }
                var icExtra = new JObject { ["Controller"] = stage.BehaviourValue(controller), ["Seat"] = stage.BehaviourValue(player) };
                foreach (var bt in buttons)
                {
                    var box = seat.Find($"Interactable Controller/{bt.box}").GetComponent<CentauriCore.Blackjack.Interactable>();
                    stage.Behaviour(box, extra: new JObject
                    {
                        ["Event"] = bt.method, ["TargetBehaviour"] = stage.BehaviourValue(player), ["PressName"] = "Press",
                        ["PressViz"] = Cv($"{p}_viz{bt.key}", "Animator"),
                    });
                    icExtra[bt.icField] = stage.BehaviourValue(box);
                }
                stage.Behaviour(ic, extra: icExtra);
                Event(stage, O($"{p}_dHitNormal"), player, "_ManualNormalHitMe");
                Event(stage, O($"{p}_dHitSplit"), player, "_ManualSplitHitMe");
                Event(stage, O($"{p}_dStand"), player, "Stand");
            }
            // the chip controller lives on its audio object in the bindings (the provisional file's "chips" behaviour)
            foreach (var (key, method, target) in new (string, string, MonoBehaviour)[]
            {
                ("takeOwnership", "_TakeOwnership", controller), ("takeOwnershipManual", "_TakeOwnership", controller),
                ("startGame", "GlobalStartMatch", controller), ("startGameManual", "GlobalStartMatch", controller),
                ("swapToManual", "_ToggleManualPlay", controller), ("swapToAuto", "_ToggleManualPlay", controller),
                ("helpersOnBtn", "_ActivateHelpers", controller), ("helpersOffBtn", "_DeactivateHelpers", controller),
                ("chipsOnBtn", "_ActivateChips", controller), ("chipsOffBtn", "_DeactivateChips", controller),
                ("deckAdd", "AddDeck", deck), ("deckSub", "SubtractDeck", deck),
                ("mhelpersOnBtn", "_ActivateHelpers", controller), ("mhelpersOffBtn", "_DeactivateHelpers", controller),
                ("mchipsOnBtn", "_ActivateChips", controller), ("mchipsOffBtn", "_DeactivateChips", controller),
                ("mdeckAdd", "AddDeck", deck), ("mdeckSub", "SubtractDeck", deck),
                ("resetTable", "ForceGlobalReset", controller), ("resetChips", "ResetChips", controller),
                ("heightUp", "RaiseDealerPanels", controller), ("heightDown", "LowerDealerPanels", controller),
            })
                Event(stage, O(key), target, method);
        }

        /// <summary>A click on a button: a collider event, or (measuring only) the uGUI button through the relay graph.</summary>
        void Event(KitStage stage, GameObject go, MonoBehaviour target, string method)
        {
            if (UiButtons && go.GetComponent<UnityEngine.UI.Button>() != null) stage.Event(go, "uiButton", target, method);
            else stage.Event(go, "click", target, method);
        }

        void BindSlot(KitStage stage, Dictionary<string, GameObject> objects, string key, GameObject slot, GameObject face)
        {
            stage.Object(slot, key: key);
            stage.Ref(slot);
            stage.Object(face, key: key + "f");
            stage.Ref(face);
            objects[key] = slot;
            objects[key + "f"] = face;
        }

        /// <summary>A box on a uGUI element (its rect), thin, for collider clicks; touch boxes keep their own.</summary>
        static void ClickCollider(GameObject go)
        {
            if (go.GetComponent<Collider>() != null) return;
            var rect = go.GetComponent<RectTransform>();
            if (rect == null) return;
            var box = go.AddComponent<BoxCollider>();
            box.center = rect.rect.center;
            box.size = new Vector3(rect.rect.width, rect.rect.height, Mathf.Min(rect.rect.width, rect.rect.height) * 0.2f);
        }

        // ------------------------------------------------------------------ sounds (K8: upstream's clips replaced by Kenney CC0)

        /// <summary>
        /// Upstream's 97 clips (credited to Three Ribbon Studios, origin of the samples not verifiable) are not shipped: every
        /// clip field of the stand-ins points at Kenney's Casino Audio and Interface Sounds (CC0) instead, before the
        /// bindings are written, so the clip lists the kit builds hold only these.
        /// </summary>
        void Sounds(GameObject system)
        {
            const string A = "Assets/Kit/Audio/";
            AudioClip C(string name) => Load<AudioClip>(A + name + ".ogg");
            var audio = F("Audio Controller").GetComponent<CentauriCore.Blackjack.AudioController>();
            audio.StartMatch = C("card-shuffle");
            audio.StartActivePlay = C("confirmation_001");
            audio.DrawCard = Enumerable.Range(1, 8).Select(i => C($"card-slide-{i}")).Concat(Enumerable.Range(1, 4).Select(i => C($"card-place-{i}"))).ToArray();
            audio.FlipCard = new[] { C("card-fan-1"), C("card-shove-1"), C("card-shove-2"), C("card-shove-3"), C("card-shove-4") };
            audio.SplitDeck = C("card-fan-2");
            audio.Stand = C("click_003");
            audio.WinMatch = C("confirmation_002");
            audio.LoseMatch = C("error_004");
            audio.DrawMatch = C("question_001");
            audio.DealerWantToHit = C("tick_001");
            audio.Bust = C("drop_002");
            audio.TakeControl = C("chip-lay-1");
            audio.ReleaseControl = C("chips-collide-1");
            audio.UIInteract = C("click_001");
            var chips = system.transform.Find("Chip Controller").GetComponent<CentauriCore.Blackjack.ChipController>();
            chips.AddToBetClip = C("chips-stack-1");
            chips.NotEnoughChipsClip = C("error_002");
            foreach (var source in table.GetComponentsInChildren<AudioSource>(true).Concat(system.GetComponentsInChildren<AudioSource>(true))) source.clip = null;
        }

        // ------------------------------------------------------------------ fonts (K1: three unlicensed fonts replaced)

        void Fonts()
        {
            const string ascii = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
            labelFont = KitText.StaticFontAsset(Load<Font>($"{FontFolder}/Cinzel.ttf"), ascii, $"{FontFolder}/Cinzel SDF.asset", 64, 1024);
            bannerFont = KitText.StaticFontAsset(Load<Font>($"{FontFolder}/CinzelDecorative-Bold.ttf"), "BUSTWINDRAOLSTbustwindraolst!0123456789 ", $"{FontFolder}/CinzelDecorative SDF.asset", 72, 512);
            actionFont = KitText.StaticFontAsset(Load<Font>($"{FontFolder}/Limelight-Regular.ttf"), "HITMESTANDPLhitmestandpl!0123456789 ", $"{FontFolder}/Limelight SDF.asset", 72, 512);
        }

        static readonly Dictionary<string, string[]> KeptFields = new Dictionary<string, string[]>
        {
            ["AudioController"] = new[] { "Audio", "Bust", "DealerWantToHit", "DrawCard", "DrawMatch", "FlipCard", "LoseMatch", "ReleaseControl", "SplitDeck", "Stand", "StartActivePlay", "StartMatch", "TakeControl", "UIInteract", "WinMatch" },
            ["BlackjackWorldController"] = new[] { "BlackjackTables", "ChipController" },
            ["ChipController"] = new[] { "AddToBetClip", "Audio", "NotEnoughChipsClip", "StartingChips", "UseChipSystem" },
            ["Controller"] = new[] { "AudioController", "ChipController", "Dealer", "DealerUI", "Deck", "Distance", "Players" },
            ["CreditsPanel"] = new[] { "panel" },
            ["Dealer"] = new[] { "DealerUI", "Deck", "GameController" },
            ["DealerUIController"] = new[] { "AutoCanvas", "AutoCanvasAnimator", "BlackjackController", "ChipOff", "ChipOffManual", "ChipOn", "ChipOnManual", "ChipToggle", "ChipToggleManual", "DealerController", "DealerValues", "DealerValuesCanvas", "DeckChanger", "DeckChangerManual", "DeckCount", "DeckCountManual", "DeckSubtractArrow", "DeckSubtractArrowManual", "HelpersChanger", "HelpersChangerManual", "HelpersOff", "HelpersOffManual", "HelpersOn", "HelpersOnManual", "ManualNotOwnerUI", "ManualOwnerSettings", "ManualOwnerUI", "NotOwnerUI", "OwnerSlider", "OwnerUI", "SlotAnimators", "SlotRenderers", "Slots", "TableUIAnimator", "UIHeightAnimator" },
            ["DeckManager"] = new[] { "BlackjackController" },
            ["DisableFixer"] = new[] { "Controller", "Players" },
            ["DistanceOptimizer"] = new[] { "AudioController", "DealerUI", "GameController", "Players", "TurnOff" },
            ["Interactable"] = new[] { "Event", "PressName", "PressViz", "TargetBehaviour" },
            ["InteractableController"] = new[] { "Add10", "Add5", "Controller", "HitNormal", "HitSplit", "JoinGame", "LeaveGame", "Remove10", "Remove5", "Seat", "Split", "Stand" },
            ["Player"] = new[] { "BetPanel", "BlackjackController", "ChipAnimator", "CurrentBet", "Deck", "Interactables", "NormalDeck", "PlayerName", "PlayerNum", "PlayerUI", "SplitDeck", "Timer", "TotalChips" },
            ["PlayerDeck"] = new[] { "DealerValueDisplay", "PlayerController", "SlotAnimators", "SlotRenderers", "Slots", "isSplitDeck" },
            ["PlayerUIController"] = new[] { "DealerUI", "DealerUIAnimator", "NormalHelper", "NotOwnerUI", "OwnerUI", "PlayerController", "PlayerName", "PlayerOwner", "PlayerUIAnimator", "SplitHelper" },
        };

        protected override void Finishing(KitStage stage)
        {
            // Only the fields the TypeScript reads (the stand-ins also carry upstream's run-time fields, such as
            // NextDeckPosition, which the port derives from state)
            int dropped = 0;
            foreach (var b in stage.Bindings.Behaviours)
                if (KeptFields.TryGetValue(b.Type, out var keep))
                    foreach (var name in b.Fields.Properties().Select(q => q.Name).Where(n => !keep.Contains(n)).ToList()) { b.Fields.Remove(name); dropped++; }
            stage.Report.AppendLine($"   blackjack: {dropped} upstream fields the port does not read left out of bindings.json");
            KitText.ToTextMeshPro(stage.Root, report: stage.Report);
            int swapped = 0;
            var fallback = KitText.DefaultFont();
            foreach (var text in stage.Root.GetComponentsInChildren<TMP_Text>(true))
            {
                string name = text.font != null ? text.font.name : "";
                TMP_FontAsset to = name.StartsWith("Arcane Nine", StringComparison.Ordinal) ? labelFont
                    : name.StartsWith("RomanGradient", StringComparison.Ordinal) ? bannerFont
                    : name.StartsWith("riesling", StringComparison.Ordinal) ? actionFont
                    : name.StartsWith("UpperEastSide", StringComparison.Ordinal) || name.StartsWith("Bernardo", StringComparison.Ordinal) ? labelFont
                    : text.font == null || AssetDatabase.GetAssetPath(text.font).StartsWith(Up, StringComparison.Ordinal) ? fallback
                    : null;
                if (to == null || to == text.font) continue;
                text.font = to;
                text.fontSharedMaterial = to.material;
                swapped++;
            }
            stage.Report.AppendLine($"   blackjack: {swapped} texts moved to the OFL fonts (Cinzel, Cinzel Decorative, Limelight, Liberation Sans)");
            if (UiButtons)
                foreach (var canvas in stage.Root.GetComponentsInChildren<Canvas>(true))
                    if (canvas.isRootCanvas && canvas.GetComponent<UnityEngine.UI.GraphicRaycaster>() == null) canvas.gameObject.AddComponent<UnityEngine.UI.GraphicRaycaster>();
        }

        // ------------------------------------------------------------------ credits

        /// <summary>
        /// The credits button under the dealer's Start Game button, on the dealer canvas the players read (outside its mask,
        /// so it shows to everyone in range), and the panel it opens over the same place.
        /// </summary>
        void Credits(KitStage stage, Transform canvas, RectTransform anchor)
        {
            var font = KitText.DefaultFont();
            var w = anchor.rect.width;
            var h = anchor.rect.height;
            var open = Button(stage, canvas, "CreditsButton", "Credits", Vector2.zero, new Vector2(w * 0.35f, h * 0.6f));
            open.transform.position = anchor.position - anchor.up * (h * 1.6f * anchor.lossyScale.y);
            open.transform.rotation = anchor.rotation;
            open.transform.localScale = Vector3.one;
            ClickCollider(open);
            var panel = stage.Create("CreditsPanel", canvas);
            var panelRect = panel.AddComponent<RectTransform>();
            panelRect.sizeDelta = new Vector2(620f, 300f);
            float k = w * 1.3f / 620f;                                                                       // as wide as 1.3 Start Game buttons
            panel.transform.rotation = anchor.rotation;
            panel.transform.localScale = Vector3.one * k;
            panel.transform.position = anchor.position - anchor.forward * 0.02f;                           // in front, as the canvas is read
            panel.AddComponent<UnityEngine.UI.Image>().color = new Color(0.05f, 0.12f, 0.08f, 0.97f);
            var body = stage.Create("Text", panel.transform).AddComponent<TextMeshProUGUI>();
            body.rectTransform.sizeDelta = new Vector2(600f, 285f);
            body.font = font;
            body.fontSize = 11;
            body.color = Color.white;
            body.alignment = TextAlignmentOptions.TopLeft;
            body.textWrappingMode = TextWrappingModes.Normal;
            body.text = CreditsText;
            ClickCollider(panel);
            panel.SetActive(false);
            var token = stage.Behaviour(open, "CreditsPanel", new JObject { ["panel"] = stage.ObjectValue(panel) });
            stage.Object(open, key: "creditsButton", click: true);
            stage.Object(panel, key: "creditsPanel");
            stage.Event(panel, "click", token, "Toggle");
        }

        const string CreditsText =
            "<b>Blackjack Table</b>: a port of <b>VRCBlackjack</b> v1.0.4 by CentauriCore (Centauri). Copyright 2022 CentauriCore. " +
            "Source: github.com/Centauri2442/VRCBlackjack. Licensed under the Apache License, Version 2.0 (www.apache.org/licenses/LICENSE-2.0); " +
            "distributed on an \"AS IS\" basis, without warranties or conditions of any kind. Changed for Altspace (the rules translated to " +
            "TypeScript, the table synced as state, a fair shared deal, URP materials, new fonts and cards, the felt's 2 to 1 line and logo " +
            "painted out): see THIRD-PARTY-NOTICES in the port.\n" +
            "Table model: Sentinel373. Table textures: FiyCsf. Sounds: Casino Audio and Interface Sounds by Kenney (www.kenney.nl), CC0.\n" +
            "Cards: Boardgame Pack v2 by Kenney (www.kenney.nl), CC0. Fonts: Cinzel and Cinzel Decorative (Natanael Gama, the Cinzel Project " +
            "Authors), Limelight (Sorkin Type Co), Liberation Sans: SIL Open Font License 1.1.\n" +
            "Every win pays 1 to 1. The script also holds the portkit runtime (MIT). Not affiliated with VRChat or CentauriCore. Click to close.";

        static T Load<T>(string path) where T : Object => AssetDatabase.LoadAssetAtPath<T>(path) ?? throw new Exception($"nothing at {path}: run the importer (altspace/upstream_import.json)");
    }
}
