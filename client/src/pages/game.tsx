import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Zap, Star, RefreshCw, Play, Trophy, Building2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const CELL_SIZE = 24;
const GRID_COLS = 25;
const GRID_ROWS = 22;
const CANVAS_WIDTH = CELL_SIZE * GRID_COLS;
const CANVAS_HEIGHT = CELL_SIZE * GRID_ROWS;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type StartupTier = "seed" | "seriesA" | "seriesB" | "unicorn";

interface Startup {
  pos: Point;
  name: string;
  sector: string;
  tier: StartupTier;
  value: number;
}

interface AcquiredStartup {
  name: string;
  sector: string;
  tier: StartupTier;
  value: number;
}

const STARTUP_POOL: Array<{ name: string; sector: string; tier: StartupTier; value: number }> = [
  { name: "Stripe", sector: "Fintech", tier: "unicorn", value: 50 },
  { name: "OpenAI", sector: "AI", tier: "unicorn", value: 50 },
  { name: "Figma", sector: "Design", tier: "unicorn", value: 50 },
  { name: "Notion", sector: "Productivity", tier: "seriesB", value: 20 },
  { name: "Linear", sector: "Dev Tools", tier: "seriesB", value: 20 },
  { name: "Vercel", sector: "Infra", tier: "seriesB", value: 20 },
  { name: "Loom", sector: "Video", tier: "seriesA", value: 10 },
  { name: "Descript", sector: "Audio/Video", tier: "seriesA", value: 10 },
  { name: "Clerk", sector: "Auth", tier: "seriesA", value: 10 },
  { name: "Resend", sector: "Email", tier: "seed", value: 5 },
  { name: "PlanetScale", sector: "Database", tier: "seriesA", value: 10 },
  { name: "Railway", sector: "Infra", tier: "seed", value: 5 },
  { name: "Raycast", sector: "Productivity", tier: "seriesA", value: 10 },
  { name: "Retool", sector: "No-Code", tier: "seriesB", value: 20 },
  { name: "Supabase", sector: "Database", tier: "seriesB", value: 20 },
  { name: "Neon", sector: "Database", tier: "seed", value: 5 },
  { name: "Loops", sector: "Marketing", tier: "seed", value: 5 },
  { name: "Cal.com", sector: "Scheduling", tier: "seed", value: 5 },
  { name: "Typefully", sector: "Content", tier: "seed", value: 5 },
  { name: "Pika Labs", sector: "AI/Video", tier: "seriesA", value: 10 },
  { name: "Perplexity", sector: "AI Search", tier: "seriesB", value: 20 },
  { name: "Cursor", sector: "Dev Tools", tier: "seriesB", value: 20 },
  { name: "Replit", sector: "Dev Tools", tier: "unicorn", value: 50 },
  { name: "Anthropic", sector: "AI", tier: "unicorn", value: 50 },
  { name: "Midjourney", sector: "AI/Art", tier: "seriesA", value: 10 },
];

const TIER_COLORS: Record<StartupTier, string> = {
  seed: "#48BB78",
  seriesA: "#4299E1",
  seriesB: "#2D3748",
  unicorn: "#ECC94B",
};

const TIER_LABELS: Record<StartupTier, string> = {
  seed: "Seed",
  seriesA: "Series A",
  seriesB: "Series B",
  unicorn: "Unicorn",
};

function getInitialSnake(): Point[] {
  const mid = Math.floor(GRID_ROWS / 2);
  return [
    { x: 6, y: mid },
    { x: 5, y: mid },
    { x: 4, y: mid },
    { x: 3, y: mid },
  ];
}

function randomPoint(occupied: Set<string>): Point {
  let pt: Point;
  do {
    pt = { x: Math.floor(Math.random() * GRID_COLS), y: Math.floor(Math.random() * GRID_ROWS) };
  } while (occupied.has(`${pt.x},${pt.y}`));
  return pt;
}

function buildOccupied(snake: Point[], startups: Startup[]): Set<string> {
  const set = new Set<string>();
  snake.forEach(p => set.add(`${p.x},${p.y}`));
  startups.forEach(s => set.add(`${s.pos.x},${s.pos.y}`));
  return set;
}

function spawnStartup(snake: Point[], existing: Startup[]): Startup {
  const usedNames = new Set(existing.map(s => s.name));
  const pool = STARTUP_POOL.filter(s => !usedNames.has(s.name));
  const pick = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : STARTUP_POOL[Math.floor(Math.random() * STARTUP_POOL.length)];
  const occupied = buildOccupied(snake, existing);
  return {
    pos: randomPoint(occupied),
    name: pick.name,
    sector: pick.sector,
    tier: pick.tier,
    value: pick.value,
  };
}

type GamePhase = "idle" | "playing" | "gameover";

// All mutable game state lives in a single ref to avoid stale closures
interface GameData {
  phase: GamePhase;
  snake: Point[];
  dir: Direction;
  nextDir: Direction;
  startups: Startup[];
  score: number;
  portfolio: AcquiredStartup[];
  lastTick: number;
  animFrame: number;
}

function createGameData(): GameData {
  return {
    phase: "idle",
    snake: getInitialSnake(),
    dir: "RIGHT",
    nextDir: "RIGHT",
    startups: [],
    score: 0,
    portfolio: [],
    lastTick: 0,
    animFrame: 0,
  };
}

function getSpeed(score: number): number {
  const level = Math.floor(score / 100) + 1;
  return Math.max(80, 250 - (level - 1) * 20);
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGameData());

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [portfolio, setPortfolio] = useState<AcquiredStartup[]>([]);
  const [level, setLevel] = useState(1);
  const [lastAcquired, setLastAcquired] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem("vc-snake-highscore") || "0")
  );
  const acquiredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    // Background
    ctx.fillStyle = "#F7FAFC";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines
    ctx.strokeStyle = "rgba(45,55,72,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // Startups
    g.startups.forEach(startup => {
      const px = startup.pos.x * CELL_SIZE;
      const py = startup.pos.y * CELL_SIZE;
      const pad = 2;
      const isUnicorn = startup.tier === "unicorn";

      if (isUnicorn) {
        ctx.shadowColor = "#ECC94B";
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = TIER_COLORS[startup.tier];
      ctx.beginPath();
      ctx.roundRect(px + pad, py + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isUnicorn ? "#2D3748" : "white";
      ctx.font = `bold ${CELL_SIZE * 0.4}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(startup.name[0], px + CELL_SIZE / 2, py + CELL_SIZE / 2);
    });

    // Snake
    g.snake.forEach((seg, i) => {
      const px = seg.x * CELL_SIZE;
      const py = seg.y * CELL_SIZE;
      const isHead = i === 0;
      const pad = isHead ? 1 : 2;
      const radius = isHead ? 6 : 4;

      if (isHead) {
        const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE, py + CELL_SIZE);
        grad.addColorStop(0, "#2B6CB0");
        grad.addColorStop(1, "#2D3748");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(66,153,225,0.45)";
        ctx.shadowBlur = 10;
      } else {
        const alpha = Math.max(0.4, 1 - (i / g.snake.length) * 0.5);
        ctx.fillStyle = `rgba(66, 153, 225, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(px + pad, py + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isHead) {
        ctx.fillStyle = "white";
        const eyeSize = 3;
        let eye1: Point, eye2: Point;
        const dir = g.dir;
        if (dir === "RIGHT") {
          eye1 = { x: px + CELL_SIZE - 6, y: py + 6 };
          eye2 = { x: px + CELL_SIZE - 6, y: py + CELL_SIZE - 9 };
        } else if (dir === "LEFT") {
          eye1 = { x: px + 4, y: py + 6 };
          eye2 = { x: px + 4, y: py + CELL_SIZE - 9 };
        } else if (dir === "UP") {
          eye1 = { x: px + 5, y: py + 5 };
          eye2 = { x: px + CELL_SIZE - 8, y: py + 5 };
        } else {
          eye1 = { x: px + 5, y: py + CELL_SIZE - 7 };
          eye2 = { x: px + CELL_SIZE - 8, y: py + CELL_SIZE - 7 };
        }
        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1A365D";
        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2.x, eye2.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isHead && i % 3 === 1) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = `bold ${CELL_SIZE * 0.32}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
      }
    });
  }, []);

  const gameTick = useCallback((timestamp: number) => {
    const g = gameRef.current;
    if (g.phase !== "playing") return;

    const speed = getSpeed(g.score);
    if (timestamp - g.lastTick < speed) {
      g.animFrame = requestAnimationFrame(gameTick);
      return;
    }
    g.lastTick = timestamp;

    // Apply direction
    g.dir = g.nextDir;

    const head = g.snake[0];
    let nx = head.x;
    let ny = head.y;
    if (g.dir === "UP") ny -= 1;
    else if (g.dir === "DOWN") ny += 1;
    else if (g.dir === "LEFT") nx -= 1;
    else nx += 1;

    // Wall collision
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) {
      g.phase = "gameover";
      setPhase("gameover");
      setScore(g.score);
      setPortfolio([...g.portfolio]);
      if (g.score > parseInt(localStorage.getItem("vc-snake-highscore") || "0")) {
        localStorage.setItem("vc-snake-highscore", String(g.score));
        setHighScore(g.score);
      }
      drawFrame();
      return;
    }

    const newHead: Point = { x: nx, y: ny };

    // Self collision
    const selfHit = g.snake.some(s => s.x === nx && s.y === ny);
    if (selfHit) {
      g.phase = "gameover";
      setPhase("gameover");
      setScore(g.score);
      setPortfolio([...g.portfolio]);
      if (g.score > parseInt(localStorage.getItem("vc-snake-highscore") || "0")) {
        localStorage.setItem("vc-snake-highscore", String(g.score));
        setHighScore(g.score);
      }
      drawFrame();
      return;
    }

    // Startup collision
    const hitIdx = g.startups.findIndex(s => s.pos.x === nx && s.pos.y === ny);
    let grow = false;

    if (hitIdx >= 0) {
      const acquired = g.startups[hitIdx];
      g.score += acquired.value;
      g.portfolio = [...g.portfolio, { name: acquired.name, sector: acquired.sector, tier: acquired.tier, value: acquired.value }];

      // Update React state
      setScore(g.score);
      setPortfolio([...g.portfolio]);
      setLevel(Math.floor(g.score / 100) + 1);
      setLastAcquired(acquired.name);
      if (acquiredTimerRef.current) clearTimeout(acquiredTimerRef.current);
      acquiredTimerRef.current = setTimeout(() => setLastAcquired(null), 1300);

      // Remove and replace startup
      g.startups.splice(hitIdx, 1);
      g.startups.push(spawnStartup([...g.snake, newHead], g.startups));
      if (Math.random() < 0.3 && g.startups.length < 4) {
        g.startups.push(spawnStartup([...g.snake, newHead], g.startups));
      }
      grow = true;
    }

    // Move snake
    const newSnake = [newHead, ...g.snake];
    if (!grow) newSnake.pop();
    g.snake = newSnake;

    drawFrame();
    g.animFrame = requestAnimationFrame(gameTick);
  }, [drawFrame]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(gameRef.current.animFrame);

    const snake = getInitialSnake();
    const s1 = spawnStartup(snake, []);
    const s2 = spawnStartup(snake, [s1]);
    const s3 = spawnStartup(snake, [s1, s2]);

    gameRef.current = {
      phase: "playing",
      snake,
      dir: "RIGHT",
      nextDir: "RIGHT",
      startups: [s1, s2, s3],
      score: 0,
      portfolio: [],
      lastTick: 0,
      animFrame: 0,
    };

    setPhase("playing");
    setScore(0);
    setPortfolio([]);
    setLevel(1);
    setLastAcquired(null);

    drawFrame();
    gameRef.current.animFrame = requestAnimationFrame(gameTick);
  }, [drawFrame, gameTick]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", W: "UP", s: "DOWN", S: "DOWN", a: "LEFT", A: "LEFT", d: "RIGHT", D: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();

      const g = gameRef.current;
      if (g.phase !== "playing") return;

      const opposite: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (opposite[newDir] !== g.dir) {
        g.nextDir = newDir;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Draw idle screen on mount
  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(gameRef.current.animFrame);
      if (acquiredTimerRef.current) clearTimeout(acquiredTimerRef.current);
    };
  }, []);

  const handleMobileDir = (dir: Direction) => {
    const g = gameRef.current;
    if (g.phase !== "playing") return;
    const opposite: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (opposite[dir] !== g.dir) {
      g.nextDir = dir;
    }
  };

  const tierCounts: Record<StartupTier, number> = { seed: 0, seriesA: 0, seriesB: 0, unicorn: 0 };
  portfolio.forEach(p => { tierCounts[p.tier]++; });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-6 px-4"
      style={{ background: "linear-gradient(135deg, #EBF4FF 0%, #F7FAFC 50%, #E6FFFA 100%)" }}
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "#2D3748" }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Poppins, Inter, sans-serif", color: "#2D3748" }}
          >
            VC Snake
          </h1>
        </div>
        <p className="text-base" style={{ color: "#718096", fontFamily: "Inter, sans-serif" }}>
          Grow your portfolio. Acquire startups. Become a unicorn factory.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start justify-center w-full max-w-5xl">
        {/* Game Area */}
        <div className="flex flex-col items-center gap-3">
          {/* HUD */}
          <div className="flex gap-3 w-full">
            <Card className="flex-1 px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#4299E1" }}>
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#718096" }}>Portfolio Value</p>
                <p className="text-lg font-bold leading-tight" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}
                  data-testid="text-score"
                >
                  ${score}M
                </p>
              </div>
            </Card>
            <Card className="flex-1 px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#48BB78" }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#718096" }}>Deal Flow</p>
                <p className="text-lg font-bold leading-tight" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}
                  data-testid="text-level"
                >
                  Level {level}
                </p>
              </div>
            </Card>
            <Card className="flex-1 px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#ECC94B" }}>
                <Trophy className="w-3.5 h-3.5" style={{ color: "#2D3748" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#718096" }}>Best</p>
                <p className="text-lg font-bold leading-tight" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}
                  data-testid="text-highscore"
                >
                  ${highScore}M
                </p>
              </div>
            </Card>
          </div>

          {/* Canvas */}
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              data-testid="game-canvas"
              style={{
                borderRadius: "12px",
                border: "2px solid rgba(45,55,72,0.12)",
                boxShadow: "0 8px 32px rgba(45,55,72,0.12)",
                display: "block",
              }}
            />

            {/* Idle overlay */}
            {phase === "idle" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "rgba(45,55,72,0.86)", borderRadius: "12px", backdropFilter: "blur(4px)" }}
              >
                <div className="text-center px-8">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#4299E1" }}>
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Ready to Deploy Capital?
                  </h2>
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Navigate your VC firm to acquire startups. Collect unicorns for maximum valuation!
                  </p>
                  <div className="flex gap-3 justify-center mb-6 flex-wrap">
                    {(["seed", "seriesA", "seriesB", "unicorn"] as StartupTier[]).map(tier => (
                      <div key={tier} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded" style={{ background: TIER_COLORS[tier] }} />
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                          {TIER_LABELS[tier]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={startGame}
                    data-testid="button-start-game"
                    size="lg"
                    style={{ background: "#4299E1", color: "white", fontFamily: "Poppins, sans-serif" }}
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Investing
                  </Button>
                </div>
              </div>
            )}

            {/* Game Over overlay */}
            {phase === "gameover" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "rgba(45,55,72,0.88)", borderRadius: "12px", backdropFilter: "blur(4px)" }}
              >
                <div className="text-center px-8 w-full max-w-sm">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "#F56565" }}>
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Fund Dissolved
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Your LP relationships didn't survive that maneuver.
                  </p>

                  <div className="rounded-lg p-4 mb-4" style={{ background: "rgba(255,255,255,0.09)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Final Portfolio
                    </p>
                    <p className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}
                      data-testid="text-final-score"
                    >
                      ${score}M
                    </p>
                    {score > 0 && score >= highScore && highScore > 0 && (
                      <Badge style={{ background: "#ECC94B", color: "#2D3748" }}>
                        <Star className="w-3 h-3 mr-1" /> New Record!
                      </Badge>
                    )}
                    <div className="flex justify-center gap-2 mt-3 flex-wrap">
                      {(Object.entries(tierCounts) as [StartupTier, number][])
                        .filter(([, count]) => count > 0)
                        .map(([tier, count]) => (
                          <div key={tier} className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: TIER_COLORS[tier] }} />
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                              {count} {TIER_LABELS[tier]}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <Button
                    onClick={startGame}
                    data-testid="button-restart-game"
                    style={{ background: "#4299E1", color: "white", width: "100%", fontFamily: "Poppins, sans-serif" }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Raise New Fund
                  </Button>
                </div>
              </div>
            )}

            {/* Acquisition toast */}
            {lastAcquired && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap"
                style={{
                  background: "#48BB78",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 16px rgba(72,187,120,0.45)",
                  zIndex: 10,
                  animation: "vcToast 1.3s ease forwards",
                }}
                data-testid="toast-acquired"
              >
                Acquired: {lastAcquired}
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex flex-col items-center gap-1 lg:hidden">
            <Button size="icon" variant="outline" onPointerDown={() => handleMobileDir("UP")} data-testid="button-dir-up">
              <ChevronUp className="w-5 h-5" />
            </Button>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" onPointerDown={() => handleMobileDir("LEFT")} data-testid="button-dir-left">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="outline" onPointerDown={() => handleMobileDir("DOWN")} data-testid="button-dir-down">
                <ChevronDown className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="outline" onPointerDown={() => handleMobileDir("RIGHT")} data-testid="button-dir-right">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <p className="text-xs hidden lg:block" style={{ color: "#A0AEC0", fontFamily: "Inter, sans-serif" }}>
            Arrow keys or WASD to navigate
          </p>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-3 w-full lg:w-72">
          {/* Tier legend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}>
              Startup Tiers
            </h3>
            <div className="flex flex-col gap-2">
              {(["seed", "seriesA", "seriesB", "unicorn"] as StartupTier[]).map(tier => {
                const val = STARTUP_POOL.find(s => s.tier === tier)?.value || 0;
                return (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: TIER_COLORS[tier], color: tier === "unicorn" ? "#2D3748" : "white" }}
                      >
                        {tier === "unicorn" ? "★" : tier[0].toUpperCase()}
                      </div>
                      <span className="text-sm" style={{ color: "#4A5568" }}>{TIER_LABELS[tier]}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-tier-${tier}`}>
                      +${val}M
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Portfolio */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}>
                Portfolio Companies
              </h3>
              <Badge variant="secondary" data-testid="badge-portfolio-count">
                {portfolio.length}
              </Badge>
            </div>

            {portfolio.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "#EBF4FF" }}>
                  <Building2 className="w-5 h-5" style={{ color: "#4299E1" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#718096" }}>No acquisitions yet</p>
                <p className="text-xs mt-1" style={{ color: "#A0AEC0" }}>Navigate toward startups to invest</p>
              </div>
            ) : (
              <div
                className="flex flex-col gap-1.5 overflow-y-auto"
                style={{ maxHeight: "300px" }}
                data-testid="portfolio-list"
              >
                {[...portfolio].reverse().map((item, i) => (
                  <div
                    key={`${item.name}-${portfolio.length - i}`}
                    className="flex items-center justify-between rounded-md px-2.5 py-2"
                    style={{ background: "rgba(66,153,225,0.06)", border: "1px solid rgba(66,153,225,0.12)" }}
                    data-testid={`portfolio-item-${i}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: TIER_COLORS[item.tier], color: item.tier === "unicorn" ? "#2D3748" : "white" }}
                      >
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight" style={{ color: "#2D3748" }}>{item.name}</p>
                        <p className="text-xs leading-tight" style={{ color: "#A0AEC0" }}>{item.sector}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: "#48BB78" }}>+${item.value}M</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Fund breakdown */}
          {portfolio.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#2D3748", fontFamily: "Poppins, sans-serif" }}>
                Fund Breakdown
              </h3>
              <div className="flex flex-col gap-2">
                {(["unicorn", "seriesB", "seriesA", "seed"] as StartupTier[]).map(tier => {
                  const count = tierCounts[tier];
                  if (count === 0) return null;
                  const val = STARTUP_POOL.find(s => s.tier === tier)?.value || 0;
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TIER_COLORS[tier] }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#4A5568" }}>{TIER_LABELS[tier]}</span>
                          <span className="font-semibold" style={{ color: "#2D3748" }}>${count * val}M</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "#EDF2F7" }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              background: TIER_COLORS[tier],
                              width: `${Math.min(100, (count / portfolio.length) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @keyframes vcToast {
          0% { opacity: 0; transform: translate(-50%, -8px) scale(0.92); }
          12% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          70% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -4px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}
