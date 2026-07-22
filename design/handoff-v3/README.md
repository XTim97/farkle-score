# Handoff: Farkle Score v3 — "Night Glow" Redesign

## Overview
Full visual refresh of the Farkle Score scorekeeping app: a glassy, glow-accented "Night Glow" theme (light + dark), bouncy borderless buttons, playful motion effects, and three new screens — the scorekeeper Game Screen, a game-show style spectator **Watch Board** (for tablets during remote play), and a **Winner Celebration** takeover with a Sudden Death final-round mode.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to ship directly. Recreate these designs in the target codebase's existing environment (React, Vue, native, etc.) using its established patterns. `styles.css` however IS a complete, production-quality stylesheet and can be adopted nearly as-is. Files ending in `.dc.html` use a design-tool template format: read the markup between `<x-dc>` tags as plain HTML; ignore `<helmet>`, `<sc-if>` wrappers (those are conditional flags — see Interactions), and `ds-base.js`.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, and animations are final. Recreate pixel-perfectly.

## Design Tokens (see styles.css `:root` — all values there are canonical)
Two themes via `prefers-color-scheme`. Key values:

Light: bg `#f1f3fa`, panel `#ffffff`, text `#1b2035`, muted `#5c637d`, border `#dde1ee`, primary `#1fa06b` (deep `#137a4f`), danger `#e04545`, accent `#f5b122`, info `#3d7fe0`, combo blues `#74b3ff→#1d4488`.
Dark: bg gradient `linear-gradient(170deg,#1b2035,#12141f)`, panels are glass `rgba(255,255,255,.06)` with `rgba(255,255,255,.12)` borders, text `#eef0fa`, primary `#46c48c`, danger `#ff5c5c`, accent `#ffca5f`, info `#5aa7ff`.
Each accent has a matching `--*-glow` rgba used in box-shadows. The 8-slot `--series-*` palette (player identity in charts) is CVD-validated and re-stepped per theme — keep exact values.

Radii: 10–20px (panels 14–20, buttons 14–16, pills 999). Spacing in rem, base gaps .45–.75rem.

## Typography
- **Sora** (Google Fonts, 400–800): headings, all numerals/scores (`tabular-nums`)
- **Nunito** (400–900): body/UI
- Loaded via `@import` at top of styles.css.

## Buttons (signature interaction)
Borderless. Filled variants use `linear-gradient(135deg, color, color-deep)` + pressed 3D shadow `0 4px 0 <deep>` + soft glow `0 6px 18px <glow>`. On `:active`: `translateY(2px) scale(.98)` and shadow collapses to `0 1px 0` — the "bouncy" squash. Transition: `transform .12s cubic-bezier(.34,1.56,.64,1)`. Variants: `.primary` (green, Bank), `.danger` (red, Farkle), roll actions use accent amber, `.pill`, `.icon`, `.help-btn`, `.glow` (accent ring).

## Motion & Effects (all in styles.css; respect `prefers-reduced-motion`)
- `farkle-shake` — .5s horizontal shake on bust (class `.farkle-hit`)
- `score-pop` — .45s overshoot scale on score change (`.score-pop`)
- `hot-pulse` — looping amber text-glow on hot-dice indicators (`.hot`)
- `dice-tumble` — .75s rotating/bouncing dice on roll (`.dice-roll`)
- `confetti-fall` / looping variant — colored rects falling on bank/win (`.confetti`)
- `sudden-pulse` — full-screen inset frame pulsing amber→red (`.sudden-death-frame`)
- `trophy-bounce` — looping bounce for the winner trophy
- `screen-in` — .35s slide-up fade on screen transitions (`.screen`)
- `marquee-glow` + `.live-dot` — pulsing red live indicator

## Screens

### 1. Game Screen (`templates/game-screen/GameScreen.dc.html`) — mobile, 420px column
Scorekeeper's view. Top chrome (help `?` + live-code badge) → 2-col scoreboard grid (active player gets green inset ring + glow; deficit `-1,250` under score) → turn panel (player name, dice left `🎲 × 3`, turn score, event chips of hits, 2-col combo grid, odds strip, Roll/Bank action row) → full-width Farkle button → turn history list (farkled rows in red).

Combo buttons: blue ramp darkening with dice consumed (dice-1 lightest → dice-6 darkest), white text, `0 3px 0` pressed shadow.

### 2. Watch Board (`templates/watch-board/WatchBoard.dc.html`) — tablet landscape, ~1180×800
Game-show spectator view for remote players. Header: "🎲 FARKLE NIGHT" (NIGHT in accent) + round/target + LIVE badge with pulsing dot. Two-column grid (1.1fr / 1fr):
- **Left**: ranked leaderboard — medal emoji, series-dot color per player, name 1.3rem/800, score 1.7rem Sora; current roller's row gets green ring + glow + "● ROLLING" tag. Race chart below (cumulative score per round, series colors).
- **Right**: "NOW ROLLING" spotlight panel — player name 2.6rem, hot-dice callout, giant turn score 4.2rem in glowing green (`+1,250`), dice remaining, chips of this turn's hits, farkle-risk strip. Below: 3 stat tiles (biggest turn / farkles tonight / hot-dice runs) + one-line ticker of recent events.
- **Sudden Death mode** (flag `finalRound`): full-viewport pulsing inset frame (`.sudden-death-frame`) + amber banner "⚡ SUDDEN DEATH — <leader> hit <score>! One last turn each to beat it".

### 3. Winner Celebration (`templates/winner-celebration/WinnerCelebration.dc.html`) — full-screen takeover
Centered column: bouncing 🏆 (5rem) → "Matt wins!" 3.4rem Sora → glowing green score 2.2rem → muted game-summary line → standings list (winner row has accent ring + glow, medal emoji) → Rematch (primary big) + Full stats buttons. ~10 confetti rects loop-falling behind content, colored from the token palette.

## Interactions & Behavior
- Flags in `<sc-if value="{{ flag }}">` blocks = runtime booleans: `finalRound` (sudden death takeover), `hotDice` (spotlight callout), `showStats` (stat tiles row).
- Watch Board is read-only; designed to be driven by live game state (score sync layer / future Google Meet remote play). Leaderboard rows, spotlight, chips, and ticker are discrete update targets. Apply `.score-pop` on score changes, re-sort leaderboard with a transition, `.farkle-hit` shake + red flash on busts.
- Emoji are intentional and part of the brand voice (🎲 🏦 💥 🔥 🏆 📺) — keep them.
- Component specimens for every other UI piece (forms, lists, odds panel, stat cards, help accordion, race chart) are in `components/`, `charts/`, `foundations/` — all class-based on styles.css.

## State Management (Watch Board)
Needs: players[] (name, seat/series slot, score, rank), currentRoller (name, turnScore, diceLeft, hits[]), gamePhase (normal | finalRound | gameOver), sessionStats (biggestTurn, farkleCount, hotDiceRuns), roundNumber, target score, live-session code.

## Assets
None — no images. All visuals are CSS + emoji + Google Fonts (Sora, Nunito).

## Files
- `styles.css` — the complete design system (tokens, components, animations)
- `templates/game-screen/GameScreen.dc.html`
- `templates/watch-board/WatchBoard.dc.html`
- `templates/winner-celebration/WinnerCelebration.dc.html`
- `components/`, `charts/`, `foundations/` — per-component specimens (14 cards), incl. `components/effects.html` (interactive motion demos)
