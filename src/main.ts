import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { PongScene } from './games/pong/PongScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 320,
  height: 240,
  backgroundColor: '#000000',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade' },
  scene: [MenuScene, PongScene],
});
