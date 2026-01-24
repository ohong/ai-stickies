import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Design tokens
const ACCENT = "#09C754";
const BG = "#FFFFFF";
const TEXT = "#111111";
const TEXT_MUTED = "#666666";
const BORDER = "#E5E5E5";

// Sticker images available
const STICKERS = [
  "sticker-wave.png",
  "sticker-heart.png",
  "sticker-thumbsup.png",
  "sticker-sleepy.png",
  "sticker-celebrate.png",
  "sticker-love.png",
  "sticker-thinking.png",
  "sticker-cat.png",
  "sticker-coffee.png",
  "sticker-star.png",
  "sticker-peace.png",
  "sticker-shy.png",
];

// Scene 1: Hook - Show the problem (0-8s)
const HookScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const titleY = interpolate(frame, [0, 0.4 * fps], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const subtitleOpacity = interpolate(frame, [0.6 * fps, 1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const priceOpacity = interpolate(frame, [2 * fps, 2.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const crossOut = interpolate(frame, [3 * fps, 3.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          marginBottom: 24,
          textWrap: "balance",
        }}
      >
        Want personalized stickers?
      </div>
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 36,
          fontWeight: 400,
          color: TEXT_MUTED,
          textAlign: "center",
          marginBottom: 80,
        }}
      >
        Hiring an artist takes weeks and costs...
      </div>
      <div
        style={{
          opacity: priceOpacity,
          position: "relative",
          display: "inline-block",
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: TEXT,
          }}
        >
          $50–300
        </span>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: -20,
            right: -20,
            height: 8,
            background: "#EF4444",
            transform: `scaleX(${crossOut}) translateY(-50%)`,
            transformOrigin: "left",
            borderRadius: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Solution intro (8-14s)
const SolutionScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const taglineOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [2 * fps, 2.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 80,
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ color: ACCENT }}>AI</span> Stickies
      </div>
      <div
        style={{
          opacity: taglineOpacity,
          fontSize: 36,
          fontWeight: 400,
          color: TEXT_MUTED,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        Selfie → 10 kawaii stickers in minutes
      </div>
      <div
        style={{
          opacity: badgeOpacity,
          background: ACCENT,
          color: "white",
          padding: "12px 32px",
          borderRadius: 100,
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Free to try
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Step 1 - Upload UI mockup (14-26s)
const UploadScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const cardScale = spring({
    frame: frame - 0.3 * fps,
    fps,
    config: { damping: 20 },
  });

  const photoOpacity = interpolate(frame, [2 * fps, 2.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const photoScale = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 12 },
  });

  const checkOpacity = interpolate(frame, [3.5 * fps, 3.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Step indicator */}
      <div
        style={{
          opacity: stepOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: ACCENT,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          1
        </div>
        <span style={{ fontSize: 32, fontWeight: 600, color: TEXT }}>
          Upload a selfie
        </span>
      </div>

      {/* Upload card mockup */}
      <div
        style={{
          transform: `scale(${Math.max(0, cardScale)})`,
          width: 500,
          height: 400,
          background: BG,
          border: `2px dashed ${BORDER}`,
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Empty state */}
        <div
          style={{
            opacity: 1 - photoOpacity,
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEXT_MUTED}
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span style={{ fontSize: 20, color: TEXT_MUTED }}>
            Drop your photo here
          </span>
        </div>

        {/* Photo preview */}
        <div
          style={{
            opacity: photoOpacity,
            transform: `scale(${Math.max(0, photoScale)})`,
            width: "100%",
            height: "100%",
            background: "#F5F5F5",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              background: `linear-gradient(135deg, #FFE4E1 0%, #FFF0F5 100%)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 80,
            }}
          >
            🧑
          </div>
        </div>

        {/* Check mark */}
        <div
          style={{
            opacity: checkOpacity,
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: 24,
            background: ACCENT,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Step 2 - Customize (26-36s)
const CustomizeScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const formOpacity = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing animation for style input
  const styleText = "Cute anime style with big sparkly eyes";
  const typedLength = Math.floor(
    interpolate(frame, [1.5 * fps, 4 * fps], [0, styleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const languageOpacity = interpolate(frame, [5 * fps, 5.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Step indicator */}
      <div
        style={{
          opacity: stepOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: ACCENT,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          2
        </div>
        <span style={{ fontSize: 32, fontWeight: 600, color: TEXT }}>
          Customize your style
        </span>
      </div>

      {/* Form mockup */}
      <div
        style={{
          opacity: formOpacity,
          width: 600,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Style input */}
        <div>
          <label
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: TEXT_MUTED,
              marginBottom: 8,
              display: "block",
            }}
          >
            Style description
          </label>
          <div
            style={{
              padding: "16px 20px",
              border: `2px solid ${ACCENT}`,
              borderRadius: 12,
              fontSize: 20,
              color: TEXT,
              background: BG,
              minHeight: 56,
            }}
          >
            {styleText.slice(0, typedLength)}
            <span
              style={{
                opacity: frame % 30 < 15 ? 1 : 0,
                color: ACCENT,
              }}
            >
              |
            </span>
          </div>
        </div>

        {/* Language selector */}
        <div style={{ opacity: languageOpacity }}>
          <label
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: TEXT_MUTED,
              marginBottom: 8,
              display: "block",
            }}
          >
            Sticker text language
          </label>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {["日本語", "English", "中文", "한국어", "ไทย"].map((lang, i) => (
              <div
                key={lang}
                style={{
                  padding: "12px 24px",
                  borderRadius: 100,
                  fontSize: 18,
                  fontWeight: 500,
                  background: i === 0 ? ACCENT : BG,
                  color: i === 0 ? "white" : TEXT,
                  border: `2px solid ${i === 0 ? ACCENT : BORDER}`,
                }}
              >
                {lang}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Step 3 - Style selection (36-48s)
const StyleSelectScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const styles = [
    { name: "High Fidelity", desc: "Detailed cartoon portrait" },
    { name: "Stylized", desc: "Cute character design" },
    { name: "Chibi", desc: "Big head, small body" },
    { name: "Minimalist", desc: "Simple line art" },
    { name: "Abstract", desc: "Animal/object inspired" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Step indicator */}
      <div
        style={{
          opacity: stepOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: ACCENT,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          3
        </div>
        <span style={{ fontSize: 32, fontWeight: 600, color: TEXT }}>
          Pick your styles
        </span>
      </div>

      {/* Style cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1200,
        }}
      >
        {styles.map((style, i) => {
          const delay = 0.5 * fps + i * 6;
          const cardScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15 },
          });

          const isSelected = i < 3;
          const checkDelay = 2 * fps + i * 8;
          const checkScale = spring({
            frame: frame - checkDelay,
            fps,
            config: { damping: 12 },
          });

          return (
            <div
              key={style.name}
              style={{
                transform: `scale(${Math.max(0, cardScale)})`,
                width: 200,
                background: BG,
                border: `2px solid ${isSelected && checkScale > 0.5 ? ACCENT : BORDER}`,
                borderRadius: 16,
                padding: 16,
                position: "relative",
              }}
            >
              {/* Preview placeholder */}
              <div
                style={{
                  width: "100%",
                  height: 140,
                  background: "#F5F5F5",
                  borderRadius: 12,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Img
                  src={staticFile(`stickers/${STICKERS[i * 2]}`)}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: TEXT,
                  marginBottom: 4,
                }}
              >
                {style.name}
              </div>
              <div style={{ fontSize: 14, color: TEXT_MUTED }}>{style.desc}</div>

              {/* Checkbox */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: ACCENT,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: `scale(${Math.max(0, checkScale)})`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      <div
        style={{
          marginTop: 40,
          opacity: interpolate(frame, [4 * fps, 4.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 20, color: TEXT_MUTED }}>
          3 styles selected
        </span>
        <div
          style={{
            background: ACCENT,
            color: "white",
            padding: "14px 32px",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Generate Packs
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Generation progress (48-56s)
const GeneratingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 6 * fps], [0, 100], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const currentStyle = Math.floor(progress / 33);
  const styles = ["High Fidelity", "Stylized", "Chibi"];

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          color: TEXT,
          marginBottom: 16,
        }}
      >
        Creating your stickers...
      </div>
      <div
        style={{
          fontSize: 24,
          color: TEXT_MUTED,
          marginBottom: 48,
        }}
      >
        Generating {styles[Math.min(currentStyle, 2)]} style
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 500,
          height: 12,
          background: "#F0F0F0",
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: ACCENT,
            borderRadius: 6,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 20,
          color: TEXT_MUTED,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(progress)}%
      </div>

      {/* Animated stickers */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          gap: 20,
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const delay = i * 15;
          const bounce = spring({
            frame: (frame + delay) % 60,
            fps,
            config: { damping: 8 },
          });
          return (
            <div
              key={i}
              style={{
                transform: `translateY(${-10 * bounce}px)`,
                opacity: progress > i * 25 ? 1 : 0.3,
              }}
            >
              <Img
                src={staticFile(`stickers/${STICKERS[i + 4]}`)}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "contain",
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 7: Results showcase (56-72s)
const ResultsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 48,
          fontWeight: 700,
          color: TEXT,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ color: ACCENT }}>✓</span> Your stickers are ready!
      </div>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 24,
          color: TEXT_MUTED,
          marginBottom: 48,
        }}
      >
        30 stickers across 3 packs
      </div>

      {/* Sticker grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 16,
          maxWidth: 900,
        }}
      >
        {STICKERS.map((sticker, i) => {
          const delay = 0.8 * fps + i * 4;
          const stickerScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 200 },
          });

          return (
            <div
              key={sticker}
              style={{
                transform: `scale(${Math.max(0, stickerScale)})`,
                background: "#FAFAFA",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: `1px solid ${BORDER}`,
              }}
            >
              <Img
                src={staticFile(`stickers/${sticker}`)}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "contain",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Download buttons */}
      <div
        style={{
          marginTop: 48,
          display: "flex",
          gap: 16,
          opacity: interpolate(frame, [4 * fps, 4.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            background: ACCENT,
            color: "white",
            padding: "16px 32px",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Download All
        </div>
        <div
          style={{
            background: BG,
            color: TEXT,
            padding: "16px 32px",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 600,
            border: `2px solid ${BORDER}`,
          }}
        >
          Export for LINE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 8: LINE Creators Market (72-80s)
const MarketScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const statsOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 32,
          color: TEXT_MUTED,
          marginBottom: 16,
        }}
      >
        Or sell them on
      </div>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 64,
          fontWeight: 700,
          color: TEXT,
          marginBottom: 60,
        }}
      >
        LINE Creators Market
      </div>

      <div
        style={{
          opacity: statsOpacity,
          display: "flex",
          gap: 60,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: ACCENT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            200M+
          </div>
          <div style={{ fontSize: 24, color: TEXT_MUTED }}>LINE users</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: ACCENT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            $200M+
          </div>
          <div style={{ fontSize: 24, color: TEXT_MUTED }}>annual market</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 60,
          fontSize: 28,
          color: TEXT_MUTED,
          opacity: interpolate(frame, [3 * fps, 3.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Turn your creativity into income
      </div>
    </AbsoluteFill>
  );
};

// Scene 9: CTA (80-90s)
const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const ctaOpacity = interpolate(frame, [1.2 * fps, 1.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating stickers
  const stickersOpacity = interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating stickers in background */}
      {[
        { x: 150, y: 200, sticker: 0, delay: 0 },
        { x: 1700, y: 250, sticker: 1, delay: 10 },
        { x: 200, y: 800, sticker: 2, delay: 20 },
        { x: 1650, y: 750, sticker: 3, delay: 15 },
        { x: 400, y: 150, sticker: 4, delay: 25 },
        { x: 1500, y: 900, sticker: 5, delay: 5 },
      ].map(({ x, y, sticker, delay }, i) => {
        const float = Math.sin((frame + delay * 3) / 30) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + float,
              opacity: stickersOpacity * 0.6,
            }}
          >
            <Img
              src={staticFile(`stickers/${STICKERS[sticker]}`)}
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
              }}
            />
          </div>
        );
      })}

      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 96,
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <span style={{ color: ACCENT }}>AI</span> Stickies
      </div>
      <div
        style={{
          opacity: ctaOpacity,
          fontSize: 32,
          color: TEXT_MUTED,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        Create personalized stickers in minutes
      </div>
      <div
        style={{
          opacity: ctaOpacity,
          background: ACCENT,
          color: "white",
          padding: "20px 48px",
          borderRadius: 16,
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        Try It Free
      </div>
      <div
        style={{
          opacity: ctaOpacity,
          fontSize: 20,
          color: TEXT_MUTED,
          marginTop: 20,
        }}
      >
        No sign-up required
      </div>
    </AbsoluteFill>
  );
};

// Main Trailer Component
export const AIStickiesTrailer = () => {
  const { fps } = useVideoConfig();
  const transitionDuration = 12;

  return (
    <TransitionSeries>
      {/* Scene 1: Hook (8 seconds) */}
      <TransitionSeries.Sequence durationInFrames={8 * fps}>
        <HookScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 2: Solution (6 seconds) */}
      <TransitionSeries.Sequence durationInFrames={6 * fps}>
        <SolutionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 3: Upload (12 seconds) */}
      <TransitionSeries.Sequence durationInFrames={12 * fps}>
        <UploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 4: Customize (10 seconds) */}
      <TransitionSeries.Sequence durationInFrames={10 * fps}>
        <CustomizeScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 5: Style Selection (12 seconds) */}
      <TransitionSeries.Sequence durationInFrames={12 * fps}>
        <StyleSelectScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 6: Generating (8 seconds) */}
      <TransitionSeries.Sequence durationInFrames={8 * fps}>
        <GeneratingScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 7: Results (16 seconds) */}
      <TransitionSeries.Sequence durationInFrames={16 * fps}>
        <ResultsScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 8: Market (8 seconds) */}
      <TransitionSeries.Sequence durationInFrames={8 * fps}>
        <MarketScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 9: CTA (10 seconds) */}
      <TransitionSeries.Sequence durationInFrames={10 * fps}>
        <CTAScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
