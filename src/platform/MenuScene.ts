import Phaser from 'phaser';
import { GAMES } from '../shared/games';
import { getHighScore } from '../shared/storage';

const VISIBLE_ROWS = 6;
const ROW_Y = 80;
const ROW_PITCH = 20;
const UP_MARK_Y = 62;
const DOWN_MARK_Y = 198;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 100;
const SIDE_MARGIN = 8;

const COLOR_NORMAL = '#888';
const COLOR_SELECTED = '#ff0';
const COLOR_UNAVAILABLE = '#444';
const COLOR_UNAVAILABLE_SELECTED = '#a60';

// The game most recently launched from the menu, kept for the page session only.
let lastLaunched: string | null = null;

export class MenuScene extends Phaser.Scene {
  private index!: number;
  private scroll!: number;
  private launching!: boolean;
  private scores!: number[];
  private rows!: Phaser.GameObjects.Text[];
  private upMark!: Phaser.GameObjects.Text;
  private downMark!: Phaser.GameObjects.Text;
  private upHeld!: boolean;
  private downHeld!: boolean;
  private holdDir!: number;
  private holdMs!: number;
  private nextRepeatMs!: number;

  constructor() {
    super('MenuScene');
  }

  create() {
    const { width } = this.scale;

    this.index = 0;
    this.scroll = 0;
    this.launching = false;
    this.scores = GAMES.map((g) => getHighScore(g.scene));
    this.rows = [];
    this.upHeld = false;
    this.downHeld = false;
    this.startHold(0);

    this.add.text(width / 2, 30, 'RETROARCADE', { fontFamily: 'monospace', fontSize: '20px', color: '#0f0' }).setOrigin(0.5);

    const markStyle = { fontFamily: 'monospace', fontSize: '12px', color: COLOR_NORMAL };
    this.upMark = this.add.text(width / 2, UP_MARK_Y, '^', markStyle).setOrigin(0.5).setVisible(false);
    this.downMark = this.add.text(width / 2, DOWN_MARK_Y, 'v', markStyle).setOrigin(0.5).setVisible(false);

    if (GAMES.length === 0) {
      this.add.text(width / 2, ROW_Y, 'No games', { fontFamily: 'monospace', fontSize: '12px', color: COLOR_NORMAL }).setOrigin(0.5);
      return;
    }

    const seen = new Set<string>();
    for (const g of GAMES) {
      if (seen.has(g.scene)) console.warn(`GAMES has more than one entry for scene key "${g.scene}"`);
      seen.add(g.scene);
    }

    const rowCount = Math.min(VISIBLE_ROWS, GAMES.length);
    for (let i = 0; i < rowCount; i++) {
      this.rows.push(
        this.add.text(width / 2, ROW_Y + i * ROW_PITCH, '', { fontFamily: 'monospace', fontSize: '12px' }).setOrigin(0.5),
      );
    }

    const remembered = lastLaunched === null ? -1 : GAMES.findIndex((g) => g.scene === lastLaunched);
    this.index = Phaser.Math.Clamp(remembered, 0, GAMES.length - 1);
    this.scroll = Phaser.Math.Clamp(this.index - Math.floor(VISIBLE_ROWS / 2), 0, Math.max(0, GAMES.length - VISIBLE_ROWS));
    this.refresh();

    // OS auto-repeat events (event.repeat) are ignored: the menu times its own repeat. A key that was
    // already held when the menu opened only ever produces repeat events, so it is ignored until released.
    const kb = this.input.keyboard!;
    kb.on('keydown', this.onKeyDown, this);
    kb.on('keyup', this.onKeyUp, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.releaseKeys, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', this.onKeyDown, this);
      kb.off('keyup', this.onKeyUp, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.releaseKeys, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.releaseKeys, this);
    });
  }

  update(_time: number, delta: number) {
    if (this.holdDir === 0 || this.launching) return;
    this.holdMs += delta;
    while (this.holdMs >= this.nextRepeatMs) {
      this.move(this.holdDir);
      this.nextRepeatMs += REPEAT_INTERVAL_MS;
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.repeat || this.launching) return;
    if (event.code === 'Enter') {
      this.launch();
    } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      if (event.code === 'ArrowUp') this.upHeld = true;
      else this.downHeld = true;
      const dir = this.heldDir();
      if (dir !== 0) this.move(dir);
      this.startHold(dir);
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    if (event.code === 'ArrowUp') this.upHeld = false;
    else if (event.code === 'ArrowDown') this.downHeld = false;
    else return;
    const dir = this.heldDir();
    if (dir !== this.holdDir) this.startHold(dir);
  }

  // Window lost focus or the tab was hidden: no keyup will arrive for keys that were down.
  private releaseKeys() {
    this.upHeld = false;
    this.downHeld = false;
    this.startHold(0);
  }

  // Up and Down held together cancel out.
  private heldDir() {
    return (this.downHeld ? 1 : 0) - (this.upHeld ? 1 : 0);
  }

  private startHold(dir: number) {
    this.holdDir = dir;
    this.holdMs = 0;
    this.nextRepeatMs = REPEAT_DELAY_MS;
  }

  private move(d: number) {
    if (GAMES.length === 0) return;
    this.index = (this.index + d + GAMES.length) % GAMES.length;
    if (this.index < this.scroll) this.scroll = this.index;
    else if (this.index >= this.scroll + VISIBLE_ROWS) this.scroll = this.index - VISIBLE_ROWS + 1;
    this.refresh();
  }

  private launch() {
    const entry = GAMES[this.index];
    if (!entry || !this.isRegistered(entry.scene)) return;
    this.launching = true;
    lastLaunched = entry.scene;
    this.scene.start(entry.scene);
  }

  private isRegistered(sceneKey: string) {
    return this.scene.manager.getScene(sceneKey) !== null;
  }

  private refresh() {
    const maxWidth = this.scale.width - SIDE_MARGIN * 2;
    this.rows.forEach((row, i) => {
      const gi = this.scroll + i;
      const entry = GAMES[gi];
      const suffix = `  (best ${this.scores[gi]})`;
      let title = entry.title;
      row.setText(title + suffix);
      while (row.width > maxWidth && title.length > 0) {
        title = title.slice(0, -1);
        row.setText(`${title}...${suffix}`);
      }
      const selected = gi === this.index;
      if (this.isRegistered(entry.scene)) row.setColor(selected ? COLOR_SELECTED : COLOR_NORMAL);
      else row.setColor(selected ? COLOR_UNAVAILABLE_SELECTED : COLOR_UNAVAILABLE);
    });
    this.upMark.setVisible(this.scroll > 0);
    this.downMark.setVisible(this.scroll + VISIBLE_ROWS < GAMES.length);
  }
}
