# Architecture

Retroarcade is a browser arcade of retro games built with Phaser 4.2.1, TypeScript and Vite. It is a single-page app with one `Phaser.Game` instance. Every screen, whether a menu or a game, is a Phaser `Scene`. The code is split between the platform (menus, options, settings and the shared contracts games depend on) and the games themselves.

## Layout

```
index.html                 page shell, mounts the canvas into #game
src/main.ts                creates the Phaser.Game, lists all scenes, installs the Esc handler
src/platform/              platform scenes: menus, options, settings
src/platform/MenuScene.ts  launcher: lists games, shows high scores
src/platform/exitToMenu.ts platform-wide Esc: returns from any game to MenuScene
src/games/<name>/          one folder per game, each exporting a Scene
src/shared/games.ts        menu registry (GAMES)
src/shared/storage.ts      high-score persistence (localStorage)
```

## Runtime flow

1. `main.ts` boots Phaser with all scenes registered; `MenuScene` is first in the list, so it starts first.
2. The menu reads `GAMES` and each game's high score, and starts the selected scene by key.
3. A game runs until it ends, when it calls `this.scene.start('MenuScene')`, or until the player presses Esc. Esc is handled by the platform (`src/platform/exitToMenu.ts`, installed from `main.ts`): while any scene listed in `GAMES` is active, Esc returns to `MenuScene`. Games don't need to handle Esc themselves.
4. On finishing, a game calls `submitScore(sceneKey, score)`, and the menu shows the result next time.

## Rendering

The canvas has a default internal resolution of 320x240 with `pixelArt: true` (nearest-neighbour sampling). `Scale.FIT` scales it up to the window and keeps the aspect ratio. Game code reads the play area from `this.scale` rather than hardcoding sizes, and ignores the window size. A game that needs another resolution or aspect ratio specifies it in its spec, since the canvas is shared. Sprites are generated at runtime (Pong draws from a 1x1 white texture) and no asset pipeline exists yet.

## Physics

Arcade physics is enabled globally in `main.ts`. Games use it for collisions and velocity, and each scene sets its own world-bounds behaviour.

## Conventions

- The scene key is the game's identity. It must be the same string in the scene's `super(...)` call, in `GAMES`, and in the `submitScore` call. This is how the menu launches the game and finds its high score.
- Esc to the menu is a platform guarantee. A game must not add its own Esc handler for it, and it doesn't need to. Esc on the menu itself does nothing.
- Games must reset their state in `create()`, since Phaser reuses scene instances when a scene is restarted.
- Shared code goes in `src/shared/`. Games should not import from each other.
- Ownership: the platform owns `src/platform/`, `src/main.ts`, `index.html` and the existing APIs in `src/shared/`. A game owns its folder in `src/games/`. Game work may add new shared exports and register itself, but changing an existing shared API is platform work, and that work must migrate every game it affects.

## Adding a game

1. Create `src/games/<name>/<Name>Scene.ts` extending `Phaser.Scene`.
2. Add the class to the `scene` array in `src/main.ts`.
3. Add `{ title, scene }` to `GAMES` in `src/shared/games.ts`.

## Not yet built

Audio, a shared input layer, an asset pipeline, CRT/scanline post-processing, tests and linting.
