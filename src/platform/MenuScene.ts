import Phaser from 'phaser';
import { GAMES } from '../shared/games';
import { getHighScore } from '../shared/storage';

export class MenuScene extends Phaser.Scene {
  private index = 0;
  private items: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('MenuScene');
  }

  create() {
    const { width } = this.scale;
    this.add.text(width / 2, 30, 'RETROARCADE', { fontFamily: 'monospace', fontSize: '20px', color: '#0f0' }).setOrigin(0.5);

    this.items = GAMES.map((g, i) =>
      this.add
        .text(width / 2, 80 + i * 20, `${g.title}  (best ${getHighScore(g.scene)})`, { fontFamily: 'monospace', fontSize: '12px' })
        .setOrigin(0.5),
    );
    this.refresh();

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-ENTER', () => this.scene.start(GAMES[this.index].scene));
  }

  private move(d: number) {
    this.index = (this.index + d + GAMES.length) % GAMES.length;
    this.refresh();
  }

  private refresh() {
    this.items.forEach((t, i) => t.setColor(i === this.index ? '#ff0' : '#888'));
  }
}
