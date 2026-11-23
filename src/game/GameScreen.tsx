import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Game, type Hud } from "./engine";

const EMPTY: Hud = {
  phase: "menu",
  score: 0,
  best: 0,
  wave: 1,
  lives: 3,
  combo: 0,
  rapid: 0,
  wide: 0,
  shield: false,
  newBest: false,
  muted: false,
};

function formatScore(n: number) {
  return n.toLocaleString("en-US");
}

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const game = new Game();
    gameRef.current = game;
    game.onHud = (next) => setHud(next);
    game.publish(true);
    setReady(true);

    let raf = 0;
    let last = performance.now();
    let dead = false;

    const frame = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      game.setViewport(rect.width, rect.height);
      let remain = dt;
      while (remain > 0) {
        const step = Math.min(remain, 1 / 120);
        game.step(step);
        remain -= step;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(rect.width * dpr));
      const bh = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      game.draw(ctx, rect.width, rect.height, dpr);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
      }
      game.audio.unlock();
      game.setKey(e.code, true);
      if (e.code === "KeyP") game.togglePause();
      if (e.code === "Escape" && (game.phase === "playing" || game.phase === "paused")) game.togglePause();
      if ((e.code === "Enter" || e.code === "Space") && game.phase === "menu") game.start();
      if (e.code === "Enter" && game.phase === "paused") game.togglePause();
      if (e.code === "Enter" && game.phase === "over") game.start();
    };
    const onKeyUp = (e: KeyboardEvent) => game.setKey(e.code, false);
    const onVis = () => {
      if (document.visibilityState === "visible") game.audio.resume();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVis);
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas || !game || game.phase !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    if (event.type === "pointerdown") {
      game.audio.unlock();
      canvas.setPointerCapture(event.pointerId);
      game.pointerDown(event.clientX, event.clientY, rect);
    } else if (event.type === "pointermove") {
      game.pointerMove(event.clientX, event.clientY, rect);
    }
  };

  const endPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    gameRef.current?.pointerUp();
  };

  const hold = (side: "left" | "right") => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const game = gameRef.current;
    if (!game) return;
    game.audio.unlock();
    if (event.type === "pointerdown") {
      event.currentTarget.setPointerCapture(event.pointerId);
      game.setHold(side, true);
    } else {
      game.setHold(side, false);
    }
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={point}
        onPointerMove={point}
        onPointerUp={endPoint}
        onPointerCancel={endPoint}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="lane pointer-events-none relative flex max-w-full flex-col">
          {hud.phase === "menu" ? (
            <section className="pointer-events-auto m-auto w-full max-w-sm rounded-2xl border border-line bg-surface/90 px-6 py-7 shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold tracking-widest text-ember">VERTICAL ARCADE</p>
              <h1 className="mt-2 font-display text-5xl font-extrabold leading-none text-fg">Ember Raid</h1>
              <p className="mt-3 text-base leading-snug text-muted">Steer the ember. Nothing gets through.</p>
              <p className="mt-5 text-sm text-muted">
                Best{" "}
                <span className="font-semibold text-gold">{ready ? formatScore(hud.best) : "—"}</span>
              </p>
              <button
                type="button"
                className="mt-5 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg transition active:scale-95"
                onClick={() => gameRef.current?.start()}
              >
                Launch
              </button>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>Drag, or A and D, to move.</li>
                <li>Guns fire on their own.</li>
                <li>Gold cores grant rapid, wide, or shield.</li>
              </ul>
            </section>
          ) : (
            <h1 className="sr-only">Ember Raid</h1>
          )}

          {hud.phase !== "menu" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{formatScore(hud.score)}</p>
                <p className="mt-1 text-xs text-muted">Best {formatScore(hud.best)}</p>
                {hud.combo >= 2 && (
                  <p className="mt-1 text-sm font-semibold text-gold">x{hud.combo} combo</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold tracking-widest text-muted">WAVE</p>
                <p className="font-display text-2xl font-extrabold leading-none">{hud.wave}</p>
                <div className="mt-2 flex justify-end gap-1.5" aria-label={`${hud.lives} lives`}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span
                      key={i}
                      className={`block size-2.5 rotate-45 ${i < hud.lives ? "bg-ember" : "bg-line"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {hud.phase === "playing" && (hud.rapid > 0 || hud.wide > 0 || hud.shield) && (
            <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center gap-2">
              {hud.rapid > 0 && <Chip label={`Rapid ${Math.ceil(hud.rapid)}`} />}
              {hud.wide > 0 && <Chip label={`Wide ${Math.ceil(hud.wide)}`} />}
              {hud.shield && <Chip label="Shield" />}
            </div>
          )}

          {hud.phase !== "menu" && (
            <div className="pointer-events-auto absolute top-4 left-1/2 flex -translate-x-1/2 gap-2">
              <IconButton
                label={hud.muted ? "Unmute" : "Mute"}
                onClick={() => gameRef.current?.toggleMute()}
              >
                {hud.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </IconButton>
              {hud.phase !== "over" && (
                <IconButton
                  label={hud.phase === "paused" ? "Resume" : "Pause"}
                  onClick={() => gameRef.current?.togglePause()}
                >
                  {hud.phase === "paused" ? <Play className="size-5" /> : <Pause className="size-5" />}
                </IconButton>
              )}
            </div>
          )}

          {hud.phase === "paused" && (
            <section className="pointer-events-auto m-auto w-full max-w-xs rounded-2xl border border-line bg-surface/90 px-6 py-7 text-center shadow-2xl backdrop-blur-md">
              <h2 className="font-display text-4xl font-extrabold">Paused</h2>
              <button
                type="button"
                className="mt-6 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg"
                onClick={() => gameRef.current?.togglePause()}
              >
                Resume
              </button>
            </section>
          )}

          {hud.phase === "over" && (
            <section className="pointer-events-auto m-auto w-full max-w-sm rounded-2xl border border-line bg-surface/90 px-6 py-7 text-center shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold tracking-widest text-ember">LANE LOST</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold">Raid over</h2>
              <p className="mt-4 font-display text-4xl font-extrabold tabular-nums text-gold">{formatScore(hud.score)}</p>
              <p className="mt-1 text-sm text-muted">
                {hud.newBest ? "New best" : `Best ${formatScore(hud.best)}`}
              </p>
              <button
                type="button"
                className="mt-6 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg"
                onClick={() => gameRef.current?.start()}
              >
                Fly again
              </button>
              <button
                type="button"
                className="mt-3 h-11 w-full rounded-xl text-sm font-semibold text-muted"
                onClick={() => gameRef.current?.toMenu()}
              >
                Menu
              </button>
            </section>
          )}

          {hud.phase === "playing" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-end justify-between px-4 md:hidden">
              <button
                type="button"
                aria-label="Move left"
                className="pointer-events-auto h-16 w-20 rounded-2xl border border-line bg-surface/80 text-2xl font-semibold text-fg"
                onPointerDown={hold("left")}
                onPointerUp={hold("left")}
                onPointerCancel={hold("left")}
              >
                A
              </button>
              <button
                type="button"
                aria-label="Move right"
                className="pointer-events-auto h-16 w-20 rounded-2xl border border-line bg-surface/80 text-2xl font-semibold text-fg"
                onPointerDown={hold("right")}
                onPointerUp={hold("right")}
                onPointerCancel={hold("right")}
              >
                D
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold text-gold">
      {label}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-line bg-surface/80 text-fg"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
