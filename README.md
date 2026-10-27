# retroarcade

A browser arcade of retro games built with Phaser 3, TypeScript and Vite.

```
npm install
npm run dev      # start dev server
npm run build    # typecheck and build
```

Add a game: create `src/games/<name>/<Name>Scene.ts`, register the scene in `src/main.ts` and add an entry to `src/shared/games.ts`.

Controls: arrow keys to move/select, Enter to start, Esc to return to the menu.
