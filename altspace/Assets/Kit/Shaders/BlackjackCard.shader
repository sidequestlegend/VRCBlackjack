// The blackjack kit's card face: one material for all 52 faces and the back. _CardIndex (set per renderer through the
// relay op matFloat) picks the atlas cell: 0..51 a face in the port's card order (DeckManager.ts), 52 or anything
// outside 0..51 the back. Atlas layout as tools/make_art.py writes it: 2048 x 1024, 14 columns of 146 x 256 px cells
// from the top left, the 140 x 190 card 3 px in. Unlit with a little light from above, alpha-clipped corners.
// Made for the Altspace port of VRCBlackjack (upstream's card material used a VRChat SDK shader that URP lacks).
Shader "AltspaceGames/BlackjackCard"
{
    Properties
    {
        _BaseMap ("Card atlas", 2D) = "white" {}
        _CardIndex ("Card index", Float) = -1
        _Tint ("Tint", Color) = (1, 1, 1, 1)
        _Cutoff ("Alpha cutoff", Range(0, 1)) = 0.5
    }
    SubShader
    {
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }
        Pass
        {
            Name "Unlit"
            Cull Back
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);
            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                float _CardIndex;
                half4 _Tint;
                half _Cutoff;
            CBUFFER_END

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float2 uv : TEXCOORD0; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct Varyings { float4 positionCS : SV_POSITION; float2 uv : TEXCOORD0; half shade : TEXCOORD1; UNITY_VERTEX_OUTPUT_STEREO };

            Varyings vert (Attributes v)
            {
                Varyings o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = v.uv;
                float3 n = TransformObjectToWorldNormal(v.normalOS);
                o.shade = (half)(0.8 + 0.2 * saturate(n.y));
                return o;
            }

            half4 frag (Varyings i) : SV_Target
            {
                float index = floor(_CardIndex + 0.5);
                if (index < 0 || index > 51) index = 52;
                float col = fmod(index, 14.0);
                float row = floor(index / 14.0);
                // pixels from the atlas's top left, then to texture coordinates (v counts from the bottom)
                float2 px = float2(col * 146.0 + 3.0 + (1.0 - i.uv.x) * 140.0, row * 256.0 + 3.0 + (1.0 - i.uv.y) * 190.0);
                float2 uv = float2(px.x / 2048.0, 1.0 - px.y / 1024.0);
                half4 c = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, uv) * _Tint;
                clip(c.a - _Cutoff);
                return half4(c.rgb * i.shade, 1);
            }
            ENDHLSL
        }
    }
    Fallback Off
}
