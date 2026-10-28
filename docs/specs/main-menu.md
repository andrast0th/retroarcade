# Main menu and exit-to-menu

Status: approved (ready for implementation; answers to Q-1, Q-2, Q-3, Q-4, Q-6, Q-10, Q-11 relayed by the coordinator on the user's behalf)
Scene key: MenuScene (existing, not a new game)
Branch: `platform/main-menu`

## Summary
The platform needs a main menu (`MenuScene` in `src/platform/`) that lists every game in `GAMES` (`src/shared/games.ts`), lets the player pick and launch one by keyboard, and lets the player leave any game for the menu with Esc at any moment. A basic version already exists (see "Current state and gap"), so this spec is mostly about closing the gaps: the menu breaks with zero games, does not handle more games than fit on screen, repeats held keys at an uncontrolled rate, reacts to a key that was held before it opened, and the Esc exit is a per-game convention rather than a platform guarantee. The user has decided the open UX questions (see the questions table), so there are no blocking questions left.

## Current state and gap
Inspected: `CLAUDE.md`, `ARCHITECTURE.md`, `src/main.ts`, `index.html`, `src/platform/MenuScene.ts`, `src/shared/games.ts`, `src/shared/storage.ts`, `src/games/pong/PongScene.ts`, `package.json`, and Phaser's `KeyboardPlugin.js` in `node_modules`. `src/platform/` contains only `MenuScene`. `src/games/` contains only `pong`. `GAMES` has one entry (`PONG` / `PongScene`).

Already there:
- `MenuScene` is first in the scene list in `src/main.ts`, so it is the launcher on boot.
- It lists `GAMES` in registry order as `<title>  (best <n>)`, highlights the selected row (yellow vs grey), moves with Up/Down and wraps (`(index + d + length) % length`), and launches with Enter via `this.scene.start(GAMES[index].scene)`.
- High scores are read through `getHighScore`, which catches a throwing `localStorage` and returns 0.
- `PongScene` registers its own `keydown-ESC` handler in `create()` that calls `this.scene.start('MenuScene')`, so Esc works in Pong in any state (Pong has no game-over screen; it returns to the menu when a side reaches 5).

Gaps, verified from the code:
1. **Zero games crashes.** With an empty `GAMES`, `% 0` makes `index` NaN, and Enter evaluates `GAMES[NaN].scene` and throws a TypeError. There is also no empty-state text.
2. **Overflow.** Rows are placed at `y = 80 + i * 20` on a 240 px canvas, so entries beyond about the 8th are drawn off-screen and cannot be seen. There is no scrolling.
3. **Held keys are uncontrolled.** The menu uses `kb.on('keydown-UP')`. In the installed Phaser 4.2.1, `KeyboardPlugin` only suppresses auto-repeat events for codes that have a `Key` object (`repeat = key.isDown`; emits only if `!key || !repeat`). The menu creates no `Key` objects, so a held arrow key moves the selection at the OS auto-repeat rate, which the platform does not control.
4. **Key held when the menu opens.** A player who is holding Up or Down at the end of a Pong round arrives at the menu and the same held key starts moving the selection immediately. Same for Enter.
5. **Double launch.** Two Enter presses before the scene switch completes call `scene.start` twice. Behaviour is unverified.
6. **Unregistered entry.** A `GAMES` entry whose scene is not in the `scene` array in `src/main.ts` (CLAUDE.md says this fails silently or at runtime) leaves the menu apparently frozen on Enter.
7. **Esc is not a platform guarantee.** Exit exists only because Pong wrote its own handler. A future game that omits it has no way back. Esc handling is also not guarded against held-key auto-repeat.
8. **Stored high scores are not validated.** `getHighScore` returns `Number(raw) || 0`, so a stored `-5` or `Infinity` is returned as is, and the menu would show it. `submitScore(game, NaN)` computes `Math.max(best, NaN) = NaN` and writes `"NaN"`, which reads back as 0 and wipes the stored best.
9. **Selection memory is accidental.** `private index = 0` is a field initialiser, not reset in `create()`, so the selection persists across returns only because Phaser reuses the scene instance. It is never clamped.
10. **Docs mismatch.** CLAUDE.md and ARCHITECTURE.md say Phaser 3. `package.json` and `node_modules` have Phaser 4.2.1. Corrected in Task 7.

Not gaps: listing, wrap, Enter launch, Pong's Esc, localStorage-throws handling for reads, and the 320x240 / `Scale.FIT` setup. The menu reads `this.scale` and `Scale.FIT` does not change the internal size, so resize needs no new code.

## Assumptions and open questions
No blocking questions remain. Q-1 to Q-4, Q-6, Q-10 and Q-11 were answered by the user; the non-blocking ones keep the working assumptions stated.

| ID | Type | Text | Blocking? |
|----|------|------|-----------|
| Q-1 | resolved | Overflow: the list scrolls, with up/down overflow indicators. The visible row count is the product owner's choice: **6 rows** at the current 20 px pitch (see A-10). | no |
| Q-2 | resolved | Zero games: show a "No games" empty state; Enter does nothing. | no |
| Q-3 | resolved | A held Up/Down repeats after 400 ms, then every 100 ms. | no |
| Q-4 | resolved | Returning from a game selects the game just left. | no |
| Q-5 | question | Besides Enter, should any other key launch the game, or jump to a game? Working assumption: Enter only (current behaviour). | no |
| Q-6 | resolved | A `GAMES` entry whose scene is not registered is greyed out and cannot be launched. How it interacts with navigation is a working assumption (A-9). | no |
| Q-7 | question | Row text and layout (`<title>  (best <n>)`, centred, 12 px monospace, grey/yellow, green "RETROARCADE" title) and long-title handling. Working assumption: keep the current look; a title too long for 320 px is cut off so it fits (exact cut rule to the developer, no new options). | no |
| Q-8 | question | Esc on the menu itself. Working assumption: does nothing. | no |
| Q-9 | question | Esc inside a game: working assumption (A-3) is an immediate exit with no pause or confirmation. | no |
| Q-10 | resolved | Option A confirmed: a platform-owned global Esc handler. | no |
| Q-11 | resolved | The user approves correcting Phaser 3 vs 4.2.1 and the CLAUDE.md and ARCHITECTURE.md convention changes for Option A (Task 7). Relayed by the coordinator, see R-7. | no |
| A-1 | assumption | Menu order is `GAMES` array order. No sorting. | |
| A-2 | assumption | No settings exist in the repo, and this spec adds none. Settings-related platform edge cases therefore do not apply (see edge case tables). | |
| A-3 | assumption | Esc during a game exits immediately, as Pong does today. | |
| A-5 | assumption | A key that was already held when the menu opens is ignored until it is released once, then works normally. This is the mechanism for the CLAUDE.md "held key when a screen opens" rule. A time-based grace period would need a number from the user. | |
| A-6 | assumption | NFR targets are proposals by the product owner, not measured. Task 1 records baselines and the targets are confirmed or changed then. | |
| A-7 | assumption | The page's keyboard input reaches Phaser (the page has focus). Phaser listens on `window` by default. | |
| A-8 | assumption | Verification is manual (browser plus `npm run build`) because no test runner or linter exists. Adding one is out of scope. | |
| A-9 | assumption | Greyed (unregistered) rows are listed and scroll like any row, and Up/Down move over them too, so every entry stays reachable and the scroll window stays simple. Enter on a greyed row does nothing. A selected greyed row has its own style, distinguishable from a selected normal row and an unselected greyed row. If every entry is unregistered, all rows are greyed and Enter does nothing. Alternative the user may prefer: navigation skips greyed rows. | |
| A-10 | assumption | Layout for 320x240: title as today at y=30; rows centred at y = 80 + i*20 for 6 visible rows (y 80 to 180); the up indicator at y=62 and the down indicator at y=198, each shown only when rows exist above or below the visible window; characters are ASCII `^` and `v` in the existing monospace font, in the grey colour. With 6 rows or fewer, no indicator is shown and the layout is identical to today. | |
| A-11 | assumption | "The game just left" (Q-4) is kept in memory for the page session only (not in localStorage). On first boot, after a page reload, or if the remembered key is no longer in `GAMES`, the first row is selected. | |
| A-12 | assumption | Held Up and Down together cancel out and the selection does not move. Enter held together with a navigation key: launch wins. | |

## Spike findings (Task 2, Phaser 4.2.1)
Measured in headless Chrome driven over CDP against the production build of `main`, with `game` exposed on `window` for the test only (not committed). Auto-repeat was simulated with `Input.dispatchKeyEvent` `autoRepeat: true`, which sets `KeyboardEvent.repeat`.

| Item | Result |
|------|--------|
| Held-key repeat without `Key` objects (current menu) | One press plus 3 auto-repeat events produced 4 `keydown-DOWN` emissions (`repeat` true on 3 of them). Gap 3 confirmed: the OS repeat rate drives the selection. |
| Held-key repeat with a `Key` object | The same input produced 1 emission. `Key` objects suppress repeats, but they cannot see a key that was already held before the scene opened: that key's first repeat event looks like a fresh press to a new `Key`. The menu therefore keeps its own platform-level held-key tracker (see Task 6 notes) and times repeats itself. |
| R-1: double `scene.start('MenuScene')` | Three calls in one tick, and a real Esc with two `keydown-ESC` handlers both calling it, each end with `MenuScene` active, `PongScene` stopped, no console output, and the menu can launch Pong again. Harmless. The redundant Pong handler may stay until Task 5. |
| R-2 / tab hidden: key state on blur | On `window` blur, Phaser resets its `Key` objects (`isDown` true to false) but emits no `keyup` to `keydown-*`/`keyup-*` listeners. The menu cannot rely on Phaser to clear its own held state, so it clears it on the game's `BLUR` and `HIDDEN` events. |
| Unregistered scene key (gap 6) | `scene.start('Nope')` from the menu queues `stop MenuScene` then `start Nope`. Phaser only warns `Scene key not found: Nope`, so after it nothing is running (blank screen). `this.scene.manager.getScene(key)` returns `null` for an unregistered key and does not warn, so FR-7 can check it at draw time. |
| Esc listener placement (R-3) | `Phaser.Scene.scene.start` is queued and applied on the next game update, so an Esc handler on `window` can call it from the active game scene. The handler looks the active scene up with `game.scene.getScenes(true)` and ignores any key not in `GAMES`. |
| Test harness note | Headless Chrome stops animation frames after the first key event unless focus emulation is on (`Emulation.setFocusEmulationEnabled`). Needed for any automated check. |

## Functional requirements
| ID | Requirement |
|----|-------------|
| FR-1 | `MenuScene` lists every entry of `GAMES` in registry order (A-1), each with its title and its best score from `getHighScore(entry.scene)`. Row look per Q-7 working assumption. |
| FR-2 | Exactly one row is selected at any time when `GAMES` is non-empty, and it is visually distinct. On first boot it is the first row. |
| FR-3 | Up and Down move the selection by one row; moving past either end wraps to the other end (and the scroll window follows). With one entry the selection does not change. |
| FR-4 | Enter launches the selected game with `this.scene.start(entry.scene)` when its scene is registered. A launch is accepted once per menu visit: further key presses after the first are ignored until the menu is re-entered. The launched key is remembered for FR-12. |
| FR-5 | Zero games: the menu shows the text "No games" in the list area (Q-2), does not throw, and Up, Down and Enter do nothing. |
| FR-6 | Overflow (Q-1, A-10): at most 6 rows are visible. The window scrolls so the selected row is always fully visible. An up indicator is shown while rows exist above the window and a down indicator while rows exist below it, and neither is shown otherwise. Every entry is reachable by keyboard and no row or indicator is drawn outside the 320x240 canvas. |
| FR-7 | An entry whose scene key is not registered in the running `Phaser.Game` (checked against the scene manager) is drawn greyed out and cannot be launched (Q-6, A-9); Enter on it does nothing and does not throw. Duplicate scene keys in `GAMES` are reported in the dev console. |
| FR-8 | Held Up/Down: the first move happens on key press, repeats start after 400 ms and then occur every 100 ms (Q-3), measured in time (scene time or `delta`), not in frames or OS auto-repeat. |
| FR-9 | A navigation or launch key already held when the menu opens is ignored until it has been released once (A-5). |
| FR-10 | Esc during any game scene (any scene key in `GAMES`) returns to `MenuScene` at any moment: mid-round, during a game-over state, during a serve or countdown. Auto-repeat Esc events are ignored. The handler is installed once by the platform (Q-10), so a game that does not handle Esc still returns. |
| FR-11 | Esc on `MenuScene` does nothing (Q-8) and does not restart it. |
| FR-12 | `MenuScene` resets its transient state (items, launch guard, held-key tracking, scroll position) in `create()`. The selected row on entry is the game most recently launched from the menu (Q-4, A-11), or the first row if there is none or it is no longer in `GAMES`. The index is always clamped to the current list length. |
| FR-13 | `getHighScore` returns a finite, non-negative number, and 0 for anything else (missing, empty, negative, NaN, Infinity, non-numeric) or when `localStorage` throws. `submitScore` with a non-finite or negative score leaves the stored best unchanged and returns the current best. Signatures are unchanged. |
| FR-14 | Returning to the menu from a game shows the updated best score. A score equal to the stored best leaves it unchanged without error. |

## Non-functional requirements
| ID | Metric | Target | Conditions | Method |
|----|--------|--------|------------|--------|
| NFR-1 | Time from page load to interactive menu (first Up/Down/Enter is handled) | Proposed: 2 s or less, and no more than 10% worse than the baseline recorded in Task 1 | `npm run build` then `npm run preview`, cold cache, desktop Chrome, CPU 4x slowdown throttling | Chrome DevTools Performance: navigation start to the first frame where `MenuScene` is active (`scene.isActive('MenuScene')` logged in a dev build) |

Baselines recorded in Task 1 on `main` (27694f0), headless Chrome driven over CDP, production build via `npm run preview`, fresh profile (cold cache). The targets above stay as proposed: they are not confirmed by the product owner (R-6), and the 2 s absolute target holds with large margin.

| NFR | Baseline on `main` | Note |
|-----|--------------------|------|
| NFR-1 | 0.50 to 0.56 s (3 runs, CPU 4x throttle); 0.28 s unthrottled | `performance.now()` at the first animation frame where `scene.isActive('MenuScene')` is true; origin is navigation start. 10% limit: 0.62 s at 4x. |
| NFR-2 | `game.loop.actualFps` 60.3 to 60.6 with Down held 10 s (CPU 4x throttle, 1 game) | Only 1 game on `main`; the 50-entry stress list is measured in Task 6. Per-frame max not measured on `main`. |
| NFR-5 | 358.51 KB gzip (largest JS asset `index-*.js`, 1,370.67 KB raw) | Limit for the branch: 360.51 KB gzip. |
| NFR-2 | Frame rate while navigating | Proposed: average 55 fps or more, and no frame over 50 ms, over 10 s of Down held and released | 1 game, and a stress list of 50 dummy entries (dev only, not committed), desktop Chrome, unthrottled | `game.loop.actualFps` sampled each second, plus DevTools frame timeline |
| NFR-3 | Held-key repeat timing | First repeat 400 ms after press and then every 100 ms, each within one frame at 30 fps and at 144 fps | Down held for 3 s; frame rate forced via DevTools throttling or a display refresh change | Log timestamps of selection changes and compare |
| NFR-4 | Esc-to-menu latency | Proposed: menu is drawn within 100 ms of the keydown | From Pong mid-round, desktop Chrome | DevTools Performance: keydown event to first frame with `MenuScene` active |
| NFR-5 | Production bundle size from `npm run build` | Proposed: increase of 2 KB gzip or less vs the baseline recorded in Task 1 | Build on the branch vs build on `main`, compare the largest JS asset | Vite build output |
| NFR-6 | Typecheck | `npm run build` passes with zero `tsc` errors | Whole project incl. `src/games/pong` | `npm run build` |

## Acceptance criteria
- **AC-1** (FR-1, FR-2): Given a fresh page load with one game in `GAMES`, When the menu appears, Then a title, the PONG row with `(best 0)` and the selected-row styling are shown, and no overflow indicator.
- **AC-2** (FR-3): Given 3 to 6 games and the first row selected, When Up is pressed, Then the last row is selected; When Down is pressed, Then the first row is selected again.
- **AC-3** (FR-3): Given exactly one game, When Up or Down is pressed, Then the one row stays selected and nothing throws.
- **AC-4** (FR-4): Given PONG is selected, When Enter is pressed, Then `PongScene` starts and the menu is no longer active.
- **AC-5** (FR-4): Given PONG is selected, When Enter is pressed twice within one frame, Then `PongScene` starts once and there are no console errors.
- **AC-6** (FR-5): Given `GAMES` is empty (dev edit), When the page loads and Up, Down, Enter are pressed, Then "No games" is shown and nothing throws or launches.
- **AC-7** (FR-6): Given a stress list of 50 entries (dev only), When the menu opens, Then 6 rows and a down indicator (no up indicator) are shown; When Down is pressed 49 times, Then every row has been selected, each time fully inside the canvas, the up indicator appears once rows exist above and the down indicator disappears at the last row; one more press wraps to the first row and the window returns to the top.
- **AC-8** (FR-6): Given the stress list, When Up is pressed on the first row, Then the last row is selected and visible, with the up indicator shown and the down indicator hidden.
- **AC-9** (FR-7): Given a `GAMES` entry whose scene key is not in `main.ts`, When the menu opens, Then the row is greyed out; When it is selected and Enter is pressed, Then nothing launches, the menu stays responsive and no exception is thrown.
- **AC-10** (FR-8): Given the menu is open, When Down is held for 3 s, Then the first move happens on press, the second at 400 ms (within one frame) and then one every 100 ms (within one frame), regardless of OS key-repeat settings.
- **AC-11** (FR-9): Given Down is held in Pong when a round ends, When the menu opens and Down is still held, Then the selection does not move until Down is released and pressed again.
- **AC-12** (FR-9): Given Enter is held while the menu opens, When it stays held, Then no game launches until Enter is released and pressed again.
- **AC-13** (FR-10): Given Pong is mid-round, When Esc is pressed, Then the menu appears. This holds at serve, during a rally, and immediately after a point is scored.
- **AC-14** (FR-10): Given a game scene that registers no Esc handler of its own (dev stub), When Esc is pressed, Then the menu appears.
- **AC-15** (FR-10): Given Esc is held in a game, When the menu opens, Then the menu stays open (auto-repeat does not re-trigger anything) and is not restarted.
- **AC-16** (FR-11): Given the menu is open, When Esc is pressed, Then nothing changes and the menu is not restarted.
- **AC-17** (FR-12): Given the stress list and the 30th entry launched, When Esc returns to the menu, Then the 30th entry is selected and fully visible, rows and the launch guard are fresh, and Enter launches again.
- **AC-18** (FR-12): Given a page reload after AC-17, When the menu opens, Then the first row is selected.
- **AC-19** (FR-13): Given `localStorage` holds `retroarcade:highscore:PongScene` = `-5`, `abc`, `Infinity`, `NaN` or empty, When the menu opens, Then it shows `(best 0)` for each.
- **AC-20** (FR-13): Given a stored best of 4, When `submitScore('PongScene', NaN)` is called, Then the stored best is still 4.
- **AC-21** (FR-13): Given `localStorage` throws on access (blocked storage / private window), When the menu opens and a game is launched and exited, Then the menu shows `(best 0)`, and no exception reaches the console as uncaught.
- **AC-22** (FR-14): Given a stored best of 3, When Pong ends with a score of 3, Then the menu shows `(best 3)`; When it ends with 5, Then the menu shows `(best 5)`.
- **AC-23** (NFR-6, edge case "Existing games"): Given the branch is built, When `npm run build` runs, Then it passes, and Pong launches from the menu and Esc returns to it.

## Edge cases
Items from "Edge cases every spec must cover".

| Edge case | Handling | Covered by |
|-----------|----------|------------|
| Scene restart | `MenuScene` resets items, launch guard, held-key tracking and scroll in `create()`; selection from the remembered launch (A-11), clamped. Today `index` is a field initialiser (gap 9). | FR-12, AC-17, AC-18 |
| Scene key | `MenuScene` key unchanged. Pong's key matches in class, `main.ts`, `GAMES` and `submitScore('PongScene')` today. The menu greys out entries whose key is not registered and reports duplicates. | FR-7, AC-9, AC-23 |
| Exit | Platform-level Esc handler, active in every game scene at all times, not dependent on game state. | FR-10, AC-13, AC-14 |
| Storage unavailable | Reads already catch; `submitScore` already catches. Hardened so invalid values read as 0. Menu runs with `(best 0)`. Remembered selection is in memory, so it does not use storage. | FR-13, AC-19, AC-21 |
| First play and ties | No stored value reads as 0. A score equal to the best leaves the best unchanged. First boot selects the first row. | FR-13, FR-14, AC-1, AC-22 |
| Frame rate | The menu has no motion. Held-key repeat (400 ms / 100 ms) is time-based. | FR-8, NFR-3, AC-10 |
| Tab hidden | Phaser's loop stops while the tab is hidden, so no menu timer fires. Held-key tracking must not leave a key stuck "held" after blur or hide, so that repeat does not run on return. Phaser's keyboard manager is expected to reset keys on blur, to be verified in Task 2. If not, the menu clears held-key state on the game's `blur` / `hidden` events. | FR-8, FR-9, Task 2 |
| Resize | The internal size is fixed at 320x240 and `Scale.FIT` scales it, so the menu reads `this.scale` once in `create()`. The 6-row layout (A-10) fits inside the canvas for any window size; verified by resizing during the menu and during a game followed by Esc. | FR-6, AC-7 |
| Input | Up and Down held together cancel (A-12). A key held at scene start is ignored until released. Enter plus a navigation key: launch wins. | FR-8, FR-9, AC-11, AC-12 |
| Bounds | Selection index is clamped on every change; the scroll window cannot go out of range; rows and indicators are never positioned outside the canvas. No moving objects in the menu. | FR-3, FR-6, FR-12, AC-7, AC-8 |

Items from "Edge cases every platform spec must cover".

| Edge case | Handling | Covered by |
|-----------|----------|------------|
| Navigation | Menu reached on boot and by Esc from any game; left by Enter. Keyboard only. Esc goes back one level: from a game to the menu; the menu is the top level and Esc there does nothing (Q-8). Selection wraps. | FR-3, FR-4, FR-10, FR-11, AC-2, AC-16 |
| Held keys | Repeat after 400 ms then every 100 ms, in time; a key held at open is ignored until released once (A-5); Esc auto-repeat ignored. | FR-8, FR-9, FR-10, AC-10, AC-11, AC-12, AC-15 |
| Settings with nothing stored | n/a: no settings exist or are added (A-2). High scores with nothing stored read as 0. | FR-13 |
| Old or invalid stored settings | n/a for settings (A-2). The one stored value family, high scores, is validated: negative, NaN, Infinity, non-numeric read as 0. Unknown keys under `retroarcade:` are never read. | FR-13, AC-19 |
| Storage unavailable | Menu works for the session with `(best 0)`; no settings to hold. | FR-13, AC-21 |
| When settings apply | n/a: no settings. | n/a |
| Games and settings | n/a: no settings. Games keep reading and writing scores only through `getHighScore` / `submitScore`. | n/a |
| Game list size | Zero: "No games" (FR-5). One: selection fixed, Enter launches. More than 6: scrolling with indicators (FR-6). | FR-3, FR-5, FR-6, AC-3, AC-6, AC-7, AC-8 |
| Existing games | Pong still builds, launches from the menu and returns with Esc. | FR-10, NFR-6, AC-23 |

## Impact on games
| Game | What changes | Works unchanged? | Migration task |
|------|--------------|------------------|----------------|
| pong (`src/games/pong/PongScene.ts`) | No shared API changes. `getHighScore` / `submitScore` keep their signatures; only invalid inputs are handled differently (FR-13). With the confirmed Option A, a platform Esc handler is added and Pong's own `keydown-ESC` handler becomes redundant. | Yes, as long as Task 2 confirms two `scene.start('MenuScene')` calls in one input event are harmless. The redundant handler may remain until Task 5. | Task 5 (remove Pong's redundant Esc handler) |

## Risks, assumptions and dependencies
| ID | Kind | Description | Owner | Mitigation |
|----|------|-------------|-------|------------|
| R-1 | risk | Platform Esc handler and Pong's own handler both fire and call `scene.start('MenuScene')` twice. Behaviour is unverified. | platform-developer | Task 2 verifies it. If unsafe, Task 5 is committed immediately after Task 4 on the same branch so the double handler never ships. |
| R-2 | risk | Phaser 4.2.1 keyboard behaviour differs from Phaser 3 docs. Key repeat suppression depends on `Key` objects, and blur reset behaviour is not confirmed. | platform-developer | Task 2 verifies repeat, blur and per-scene key handling against 4.2.1 and records the findings in this spec. |
| R-3 | risk | The global Esc listener (DOM `window` vs per-scene Phaser keyboard) can fire while a scene is transitioning, or when two scenes are briefly active. | platform-developer | Handler checks the currently active scene key against `GAMES` and ignores everything else, including `MenuScene` and future platform scenes. |
| R-4 | risk | Other game specs add entries to `GAMES` and `main.ts` concurrently, causing merge conflicts. | platform-developer | Task 6 uses stress data for `GAMES` only locally, never committed. Rebase before the final push. |
| R-5 | risk | No test runner: all ACs are manual and may regress silently. | platform-developer | Keep the manual script in the PR description; adding a test runner is a separate spec. |
| R-6 | risk | NFR targets are unmeasured proposals (A-6). | product owner / user | Confirm or change after Task 1 baselines. |
| R-7 | dependency | CLAUDE.md and ARCHITECTURE.md state that games return to the menu with their own `scene.start('MenuScene')` and that the game uses Phaser 3. Task 7 changes both. The approval reached this spec through the coordinator, not directly from the user. | platform-developer | Before editing CLAUDE.md in Task 7, the developer confirms the approval with the user directly. Until then Tasks 1 to 6 and 8 proceed. |
| R-8 | risk | A-9 (greyed rows are navigable, not skipped) and A-10 (6 rows, `^`/`v` indicators) are product-owner choices not stated by the user. | product owner | Flag in the PR description; changing either is a small edit to Task 6. |
| R-9 | dependency | No new npm dependency and no new asset source. Text rendering only, using the existing monospace font. | n/a | n/a |

## Task plan
Contract changes first, then the screens that use them, then game migration.

| # | Task | Files likely touched | Done when |
|---|------|----------------------|-----------|
| 1 | Baseline: record `npm run build` bundle size, load-to-menu time and menu fps on `main`; confirm or change the NFR targets. | this spec (NFR table) | Baseline numbers are written next to NFR-1, 2, 5 and the targets are marked confirmed. |
| 2 | Spike on Phaser 4.2.1: held-key repeat with and without `Key` objects, key state after blur / tab hidden, double `scene.start` in one event, how to detect an unregistered scene key. | none committed; findings added to this spec | Each of R-1, R-2 and the tab-hidden row has a written result. |
| 3 | Harden storage: `getHighScore` returns a finite non-negative number or 0; `submitScore` ignores non-finite or negative scores and never lowers the best. Signatures unchanged. | `src/shared/storage.ts` | AC-19, AC-20, AC-21, AC-22 pass; `npm run build` passes; Pong still submits and reads scores. |
| 4 | Platform Esc-to-menu (Option A): one global handler, installed once at boot, that returns to `MenuScene` only while a scene whose key is in `GAMES` is active, ignoring auto-repeat. | `src/main.ts` (or a new `src/platform/` module imported by it) | AC-13, AC-14, AC-15, AC-16 pass with Pong's own handler still in place. |
| 5 | Migration: remove the redundant Esc handler from Pong. | `src/games/pong/PongScene.ts` | Esc still returns to the menu from Pong in every state (AC-13); no `keydown-ESC` in `PongScene`. |
| 6 | MenuScene rework: "No games" state, 6-row scroll window with `^`/`v` indicators, 400 ms / 100 ms held-key repeat, held-at-open rule, launch guard, greyed unregistered entries, remembered last-launched selection, state reset in `create()`, long-title cut-off. | `src/platform/MenuScene.ts` (and `src/shared/games.ts` only for an additive change, if one is needed) | AC-1 to AC-12, AC-17 and AC-18 pass; NFR-1 to NFR-5 are within targets; stress list is not committed. |
| 7 | Docs: change the Esc convention in `CLAUDE.md` and `ARCHITECTURE.md` (the platform owns Esc-to-menu; games need not handle it) and correct Phaser 3 to 4.2.1. Subject to R-7. | `CLAUDE.md`, `ARCHITECTURE.md` | Docs match the code and the user has confirmed the CLAUDE.md edit. |
| 8 | Full verification: run every AC and both edge-case tables once on the final branch. | none | AC-1 to AC-23 are recorded as pass in the PR description; `npm run build` passes. |
