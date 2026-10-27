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

- `src/main.ts` creates the single `Phaser.Game` (320x240 internal resolution, `pixelArt: true`, `Scale.FIT`, arcade physics) and holds the scene list.
- `src/shared/games.ts` is the menu registry (`GAMES`). Each entry's `scene` must equal the scene key passed to `super(...)` in that game's scene class.
- `src/shared/storage.ts` stores high scores in localStorage, keyed by scene key (`getHighScore` / `submitScore`). The menu reads these, so games must submit under the same scene key used in `GAMES`.
- `src/games/<name>/` holds one game per folder.

Adding a game takes three edits: create the scene, register it in the `scene` array in `src/main.ts`, and add it to `GAMES`. Missing either registration fails silently or at runtime, not at typecheck.

Games return to the menu with `this.scene.start('MenuScene')` (Esc during play).
