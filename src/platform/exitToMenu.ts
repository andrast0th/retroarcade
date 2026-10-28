import Phaser from 'phaser';
import { GAMES } from '../shared/games';

/**
 * Platform-owned Esc handler: while a scene listed in GAMES is active, Esc returns to MenuScene,
 * whether or not the game handles Esc itself. Install once, at boot.
 *
 * Auto-repeat events are ignored (a held Esc fires once). Any other active scene, including
 * MenuScene and future platform scenes, is left alone.
 */
export function installExitToMenu(game: Phaser.Game): void {
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Escape' || event.repeat) return;

    const gameKeys = new Set(GAMES.map((g) => g.scene));
    const active = game.scene.getScenes(true).find((s) => gameKeys.has(s.sys.settings.key));
    if (active) active.scene.start('MenuScene');
  });
}
