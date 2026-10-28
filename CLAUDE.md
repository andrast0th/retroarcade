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

A browser arcade built with Phaser 3, TypeScript and Vite. Each game is a Phaser `Scene`; `MenuScene` is the launcher.

- `src/main.ts` creates the single `Phaser.Game` (default 320x240 internal resolution; games read sizes from `this.scale`, `pixelArt: true`, `Scale.FIT`, arcade physics) and holds the scene list.
- `src/shared/games.ts` is the menu registry (`GAMES`). Each entry's `scene` must equal the scene key passed to `super(...)` in that game's scene class.
- `src/shared/storage.ts` stores high scores in localStorage, keyed by scene key (`getHighScore` / `submitScore`). The menu reads these, so games must submit under the same scene key used in `GAMES`.
- `src/games/<name>/` holds one game per folder.

Adding a game takes three edits: create the scene, register it in the `scene` array in `src/main.ts`, and add it to `GAMES`. Missing either registration fails silently or at runtime, not at typecheck.

Games return to the menu with `this.scene.start('MenuScene')` (Esc during play).

## Specs

Specs live in `docs/specs/<slug>.md` and follow `docs/specs/TEMPLATE.md`. The `planner` agent (`.claude/agents/planner.md`) writes them, and the `developer` agent (`.claude/agents/developer.md`) implements an approved spec. The developer works in a git worktree at `../retroarcade-<slug>` on branch `feature/<slug>`, commits once per task and pushes that branch. It never touches `main` or opens a PR.

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
