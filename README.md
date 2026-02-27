# VC Snake

A venture capital-themed twist on the classic Snake arcade game. Instead of eating food to grow, you control a VC firm navigating a grid to acquire real-world startups and build the ultimate investment portfolio.

**[Play Now](https://vcsnake.replit.app)**

---

## About the Game

VC Snake reimagines the timeless Snake game through the lens of startup investing. Your snake represents a venture capital firm racing across the board to snap up companies like Stripe, OpenAI, Replit, and SpaceX. Each acquisition grows your snake and adds to your portfolio valuation. Survive as long as you can, avoid walls and your own tail, and chase the highest fund valuation possible.

## Gameplay

- **Move** your VC firm around the grid using **Arrow Keys**, **WASD**, or **swipe gestures** on mobile
- **Acquire startups** by running into them to grow your snake and increase your portfolio value
- **Avoid collisions** with walls and your own body, or your fund is dissolved (Game Over)
- **Speed increases** as your portfolio grows, raising the stakes with every deal

## Startup Tiers

| Tier | Value | Color |
|------|-------|-------|
| Seed | +$5M | Green |
| Series A | +$10M | Blue |
| Series B | +$20M | Dark Gray |
| Unicorn | +$50M | Gold (with glow effect) |

## Features

- **Real-time Portfolio Dashboard** -- Live sidebar showing current valuation, deal flow level, and high score
- **Acquisition Feed** -- See every startup you've acquired with tier badges
- **Fund Breakdown** -- Visual progress bars showing portfolio distribution across tiers
- **Speed Scaling** -- Game accelerates every 100 points, keeping the pressure on
- **High Score Persistence** -- Your best run is saved locally across sessions
- **Acquisition Toasts** -- Animated notifications when you pick up a startup
- **Mobile Support** -- On-screen arrow buttons and swipe controls for touch devices
- **Responsive Design** -- Game canvas scales to fit desktop and mobile screens

## Game Constants

| Parameter | Value |
|-----------|-------|
| Grid Size | 25 columns x 22 rows |
| Cell Size | 24px |
| Starting Speed | 250ms per tick |
| Minimum Speed | 80ms per tick |
| Speed Increase | -20ms every 100 points |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, HTML5 Canvas |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Icons | Lucide React |
| Routing | Wouter |
| State Management | TanStack Query (React Query) |
| Backend | Express.js, Node.js |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Auth | Passport.js |
| Build Tool | Vite |
| Fonts | Poppins, Inter (Google Fonts) |

## Project Structure

```
client/
  src/
    pages/
      game.tsx          # Core game logic, canvas rendering, state management
    components/
      ui/               # shadcn/ui component library
    hooks/              # Custom React hooks
    lib/                # Utility functions and query client setup
server/
  index.ts              # Express server entry point
  routes.ts             # API route definitions
  storage.ts            # Data persistence layer (Drizzle + PostgreSQL)
  vite.ts               # Vite dev server integration
shared/
  schema.ts             # Database models and Zod validation schemas
```

## Architecture

- Single-page app served at `/`
- All game logic lives in `client/src/pages/game.tsx`
- Game state is stored in a `useRef` to avoid stale closure issues with `requestAnimationFrame`
- Canvas rendering runs on a `requestAnimationFrame` loop
- React state is used only for UI overlays and sidebar updates
- Express backend serves both the API and the Vite-powered frontend on a single port

## Running Locally

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app starts on **port 5000**, serving both the Express API and the Vite frontend.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Slate Grey | `#2D3748` | Primary UI |
| Venture Blue | `#4299E1` | Series A tier, accents |
| Growth Green | `#48BB78` | Seed tier, success states |
| Light Grey | `#F7FAFC` | Background |
| Alert Red | `#F56565` | Collisions, game over |
| Unicorn Gold | `#ECC94B` | Unicorn tier |

## License

MIT
