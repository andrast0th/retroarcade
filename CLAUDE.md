# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm install
npm run dev       # Vite dev server
npm run build     # tsc typecheck, then vite build
npm run preview   # serve the production bundle
```

There is no linter or test runner configured yet.

## Architecture

A browser arcade built with Phaser 4, TypeScript and Vite. Each game is a Phaser `Scene`. The platform (menus, options, settings) is a set of scenes in `src/platform/`, and `MenuScene` there is the launcher.

- `src/platform/` holds platform scenes, starting with `MenuScene`.
- `src/main.ts` creates the single `Phaser.Game` (default 320x240 internal resolution; games read sizes from `this.scale`, `pixelArt: true`, `Scale.FIT`, arcade physics) and holds the scene list.
- `src/shared/games.ts` is the menu registry (`GAMES`). Each entry's `scene` must equal the scene key passed to `super(...)` in that game's scene class.
- `src/shared/storage.ts` stores high scores in localStorage, keyed by scene key (`getHighScore` / `submitScore`). The menu reads these, so games must submit under the same scene key used in `GAMES`.
- `src/games/<name>/` holds one game per folder.

Adding a game takes three edits: create the scene, register it in the `scene` array in `src/main.ts`, and add it to `GAMES`. Missing either registration fails silently or at runtime, not at typecheck.

Esc returns to the menu from any game. A platform-owned handler (`src/platform/exitToMenu.ts`, installed from `src/main.ts`) does this for every scene whose key is in `GAMES`, so games must not add their own Esc handler.

## Specs

Specs live in `docs/specs/<slug>.md` and follow `docs/specs/TEMPLATE.md`. There are two pairs of agents in `.claude/agents/`:

| Scope | Planner | Developer | Branch |
|-------|---------|-----------|--------|
| A single game in `src/games/<name>/` | `game-planner` | `game-developer` | `feature/<slug>` |
| Platform: `src/platform/`, `src/main.ts`, `index.html`, `src/shared/` contracts | `platform-planner` | `platform-developer` | `platform/<slug>` |

Each developer works in a git worktree at `../retroarcade-<slug>`, commits once per task and pushes only its branch. It never touches `main` or opens a PR.

Ownership: game work may add new exports to `src/shared/` and register its scene in `src/main.ts` and `GAMES`, but must not change existing shared APIs or `src/platform/`. Those go to a platform spec as a dependency. A platform spec that changes a shared API lists every affected game in its "Impact on games" table, with a migration task for each.

### Edge cases every spec must cover

- **Scene restart:** state is reset in `create()`, because Phaser reuses scene instances.
- **Scene key:** it matches across the scene class, `src/main.ts`, `GAMES` and `submitScore`.
- **Exit:** Esc returns to the menu at any moment, including mid-round and during game over.
- **Storage unavailable:** localStorage throws or is empty (private window, blocked storage), and the game still runs with a high score of 0.
- **First play and ties:** there is no stored high score yet, and a score equal to the current best is handled.
- **Frame rate:** movement and timers don't depend on the frame rate, using `delta` or physics velocities.
- **Tab hidden:** the tab loses focus or is hidden mid-game.
- **Resize:** the window resizes or the aspect ratio changes, and `Scale.FIT` keeps the game's frame intact.
- **Input:** opposing keys are held together (up and down), and a key is held when the scene starts.
- **Bounds:** fast objects tunnelling through paddles or walls, and objects leaving the world bounds.

### Edge cases every platform spec must cover

- **Navigation:** every screen can be reached and left by keyboard alone, Esc goes back one level, and the selection wraps at the ends of a list.
- **Held keys:** a held arrow key repeats at a controlled rate, and a key held while a screen opens doesn't trigger it immediately.
- **Settings with nothing stored:** every setting has a default, and first launch works with no stored settings.
- **Old or invalid stored settings:** unknown keys, removed options, wrong types and out-of-range values from an older version are ignored or reset to the default, never crashing.
- **Storage unavailable:** settings still work for the session when localStorage throws.
- **When settings apply:** each setting says whether it applies immediately or at the next game launch, and a game started before it changes behaves consistently.
- **Games and settings:** a game that doesn't read a setting still runs, and a game reads settings through the shared API, never from localStorage directly.
- **Game list size:** the menu handles zero games, one game, and more games than fit on screen.
- **Existing games:** every game in `src/games/` still builds, launches from the menu and returns with Esc.
