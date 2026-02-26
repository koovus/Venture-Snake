# VC Snake

A venture capital-themed Snake game built with React and HTML5 Canvas.

## Overview

Classic snake gameplay where your VC firm grows by acquiring startups instead of eating food. Navigate the snake using arrow keys or WASD to collect startup tiles on the game board.

## Features

- **Classic snake gameplay** — Arrow keys / WASD controls, grid-based movement
- **VC theming** — Snake represents a VC firm, collectibles are real startup companies
- **Startup tiers** — Seed ($5M), Series A ($10M), Series B ($20M), Unicorn ($50M)
- **Portfolio tracking** — Live sidebar shows acquired companies with tier badges
- **Fund breakdown** — Visual breakdown of portfolio by tier with progress bars
- **High score** — Persisted in localStorage across sessions
- **Deal flow levels** — Speed increases as portfolio value grows
- **Acquisition toasts** — Animated notification when a startup is acquired
- **Mobile controls** — Arrow button pad for touch devices

## Stack

- **Frontend**: React + TypeScript, HTML5 Canvas, Tailwind CSS, shadcn/ui
- **Backend**: Express.js (minimal, no database needed for this game)
- **Routing**: wouter
- **Fonts**: Poppins, Inter (from Google Fonts)

## Architecture

- Single page app at `/`
- All game logic in `client/src/pages/game.tsx`
- Game state stored in a `useRef` (`gameRef`) to avoid stale closure issues with `requestAnimationFrame`
- Canvas rendering with `requestAnimationFrame` loop
- React state only used for UI overlays and sidebar updates

## Game Constants

- Grid: 25 columns × 22 rows
- Cell size: 24px canvas
- Initial speed: 250ms/tick, minimum 80ms/tick
- Speed level up: every 100 points, -20ms per tick

## Color Palette

- Primary: `#2D3748` (slate grey)
- Blue: `#4299E1` (venture blue)
- Green: `#48BB78` (growth green)
- Background: `#F7FAFC` (light grey)
- Red: `#F56565` (collision/game over)
- Gold: `#ECC94B` (unicorn tier)

## Running

The app runs via `npm run dev` which starts Express on port 5000, serving both the API and the Vite-powered frontend.
