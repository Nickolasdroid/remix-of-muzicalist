import { useEffect, useRef, useState } from "react";

/**
 * ArtistWelcomeAnimation — transition-only welcome screen shown once after
 * successful artist registration. Auto-dismisses; user cannot linger on it.
 */

const GOLD_SHADES = ["#D4AF37", "#F5E6C4", "#B8860B", "#FFD700", "#E8C97A", "#FFF3D6"];
const NOTES = ["♪", "♫", "♩", "♬"];

type Particle = {
  x: number; y: number; vx: number; vy: number; size: number; color: string;
  rotation: number; vr: number; life: number; decay: number;
  shape: "note" | "rect" | "circle"; note: string; wobble: number;
};

function createParticle(x: number, y: number, opts: { angle?: number; speed?: number; noteRatio?: number; lift?: number } = {}): Particle {
  const angle = opts.angle ?? Math.random() * Math.PI * 2;
  const speed = opts.speed ?? 4 + Math.random() * 9;
  const isNote = Math.random() < (opts.noteRatio ?? 0.22);
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (opts.lift ?? 3),
    size: isNote ? 16 + Math.random() * 16 : 5 + Math.random() * 8,
    color: GOLD_SHADES[(Math.random() * GOLD_SHADES.length) | 0],
    rotation: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.25,
    life: 1,
    decay: 0.006 + Math.random() * 0.008,
    shape: isNote ? "note" : Math.random() < 0.5 ? "rect" : "circle",
    note: NOTES[(Math.random() * NOTES.length) | 0],
    wobble: Math.random() * Math.PI * 2,
  };
}

function ConfettiCanvas({ burstsRef, reducedMotion }: {
  burstsRef: React.MutableRefObject<(x: number, y: number, count?: number, opts?: any) => void>;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    burstsRef.current = (x, y, count = 60, opts = {}) => {
      for (let i = 0; i < count; i++) particlesRef.current.push(createParticle(x, y, opts));
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.wobble += 0.08;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.vy += 0.16;
        p.vx *= 0.985;
        p.rotation += p.vr;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > window.innerHeight + 40) { ps.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "note") {
          ctx.font = `${p.size}px serif`;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.note, 0, 0);
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion, burstsRef]);

  if (reducedMotion) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }} />;
}

function Equalizer() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 26, justifyContent: "center" }}>
      {[0.9, 0.5, 1.1, 0.7, 1.3, 0.6, 1.0].map((d, i) => (
        <span key={i} style={{
          width: 4, borderRadius: 2,
          background: "linear-gradient(180deg, #FFD700, #B8860B)",
          animation: `mzl-eq 0.${5 + i}s ease-in-out ${d * 0.1}s infinite alternate`,
          height: 8,
        }} />
      ))}
    </div>
  );
}

interface Props {
  userName?: string;
  onFinish: () => void;
  /** Total time visible before auto-dismiss (ms). Default 4200ms. */
  duration?: number;
}

export default function ArtistWelcomeAnimation({ userName = "", onFinish, duration = 4200 }: Props) {
  const burstsRef = useRef<(x: number, y: number, count?: number, opts?: any) => void>(() => {});
  const [visible, setVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const enterT = setTimeout(() => setEntered(true), 60);
    const timers: number[] = [];
    if (!reducedMotion) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      timers.push(window.setTimeout(() => burstsRef.current(cx, cy - 60, 90, { speed: 11, noteRatio: 0.3 }), 250));
      timers.push(window.setTimeout(() => burstsRef.current(cx * 0.35, cy * 0.6, 45), 700));
      timers.push(window.setTimeout(() => burstsRef.current(cx * 1.65, cy * 0.6, 45), 950));
      timers.push(window.setTimeout(() => burstsRef.current(cx, cy * 1.3, 35, { noteRatio: 0.5, speed: 7 }), 1300));
      timers.push(window.setTimeout(() => burstsRef.current(cx, cy - 40, 60, { noteRatio: 0.4 }), 2400));
    }
    // Auto-dismiss with fade-out
    const fadeT = window.setTimeout(() => setVisible(false), duration);
    const doneT = window.setTimeout(() => onFinish(), duration + 500);
    return () => {
      clearTimeout(enterT);
      clearTimeout(fadeT);
      clearTimeout(doneT);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [reducedMotion, duration, onFinish]);

  return (
    <div
      role="dialog"
      aria-label="Cont de artist creat"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "radial-gradient(ellipse at 50% 35%, rgba(46,38,20,0.96) 0%, rgba(10,9,8,0.98) 60%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.45s ease",
        pointerEvents: visible ? "auto" : "none",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      <style>{`
        @keyframes mzl-eq { from { height: 6px; } to { height: 24px; } }
        @keyframes mzl-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(6deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes mzl-up { from { transform: translateY(26px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes mzl-shimmer { to { background-position: 200% center; } }
        @keyframes mzl-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(212,175,55,0.35); }
          50% { box-shadow: 0 0 55px rgba(255,215,0,0.55); }
        }
        @media (prefers-reduced-motion: reduce) { .mzl-anim { animation: none !important; } }
      `}</style>

      <ConfettiCanvas burstsRef={burstsRef} reducedMotion={reducedMotion} />

      <div
        style={{
          position: "relative", zIndex: 3, maxWidth: 460, width: "100%", textAlign: "center",
          padding: "44px 32px 36px", borderRadius: 24,
          background: "linear-gradient(160deg, rgba(28,24,16,0.92), rgba(14,12,9,0.96))",
          border: "1px solid rgba(212,175,55,0.45)",
          backdropFilter: "blur(14px)",
          transform: entered ? "translateY(0)" : "translateY(30px)",
          opacity: entered ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(.2,.9,.3,1.2), opacity 0.6s ease",
        }}
      >
        <div
          className="mzl-anim"
          style={{
            width: 84, height: 84, margin: "0 auto 20px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38,
            background: "radial-gradient(circle at 35% 30%, #FFD700, #B8860B 75%)",
            animation: "mzl-pop 0.7s cubic-bezier(.2,1.4,.4,1) 0.25s both, mzl-glow 2.6s ease-in-out 1s infinite",
          }}
        >
          🎤
        </div>

        <div
          className="mzl-anim"
          style={{
            fontSize: 11, letterSpacing: "0.28em", color: "#B8860B",
            fontFamily: "system-ui, sans-serif", fontWeight: 600,
            animation: "mzl-up 0.5s ease 0.45s both",
          }}
        >
          CONT DE ARTIST CREAT
        </div>

        <h1
          className="mzl-anim"
          style={{
            margin: "14px 0 6px",
            fontSize: "clamp(26px, 5vw, 36px)", lineHeight: 1.15, fontWeight: 700,
            background: "linear-gradient(90deg, #F5E6C4, #FFD700, #B8860B, #FFD700, #F5E6C4)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            animation: "mzl-up 0.55s ease 0.55s both, mzl-shimmer 3.5s linear 1.2s infinite",
          }}
        >
          {userName ? `Bine ai venit pe scenă, ${userName}!` : "Bine ai venit pe scenă!"}
        </h1>

        <div className="mzl-anim" style={{ animation: "mzl-up 0.5s ease 0.65s both", margin: "10px 0 4px" }}>
          <Equalizer />
        </div>

        <p
          className="mzl-anim"
          style={{
            color: "rgba(245,230,196,0.85)", fontFamily: "system-ui, sans-serif",
            fontSize: 15, lineHeight: 1.6, margin: "12px 0 4px",
            animation: "mzl-up 0.5s ease 0.75s both",
          }}
        >
          Profilul tău de artist e gata. Te ducem la panoul tău de control...
        </p>
      </div>
    </div>
  );
}
