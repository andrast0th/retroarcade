import Phaser from 'phaser';
import { submitScore } from '../../shared/storage';

const WIN_SCORE = 5;

export class PongScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cpu!: Phaser.Physics.Arcade.Image;
  private ball!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText!: Phaser.GameObjects.Text;
  private playerScore = 0;
  private cpuScore = 0;

  constructor() {
    super('PongScene');
  }

  create() {
    const { width, height } = this.scale;
    this.playerScore = 0;
    this.cpuScore = 0;

    if (!this.textures.exists('px')) {
      this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 1, 1).generateTexture('px', 1, 1).destroy();
    }

    this.player = this.makePaddle(12, height / 2);
    this.cpu = this.makePaddle(width - 12, height / 2);
    this.ball = this.physics.add.image(width / 2, height / 2, 'px').setDisplaySize(6, 6);
    this.ball.setCollideWorldBounds(true).setBounce(1, 1);
    this.physics.world.setBoundsCollision(false, false, true, true);

    this.physics.add.collider(this.ball, this.player, () => this.speedUp());
    this.physics.add.collider(this.ball, this.cpu, () => this.speedUp());

    this.scoreText = this.add.text(width / 2, 8, '0 : 0', { fontFamily: 'monospace', fontSize: '14px' }).setOrigin(0.5, 0);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.serve();
  }

  private makePaddle(x: number, y: number) {
    const p = this.physics.add.image(x, y, 'px').setDisplaySize(6, 36);
    p.setImmovable(true).setCollideWorldBounds(true);
    return p;
  }

  private serve() {
    const { width, height } = this.scale;
    this.ball.setPosition(width / 2, height / 2);
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.ball.setVelocity(110 * dir, Phaser.Math.Between(-60, 60));
  }

  private speedUp() {
    this.ball.setVelocity(this.ball.body!.velocity.x * 1.05, this.ball.body!.velocity.y * 1.05);
  }

  update() {
    const speed = 140;
    this.player.setVelocityY(this.cursors.up.isDown ? -speed : this.cursors.down.isDown ? speed : 0);

    const diff = this.ball.y - this.cpu.y;
    this.cpu.setVelocityY(Math.abs(diff) > 4 ? Math.sign(diff) * 90 : 0);

    if (this.ball.x < 0) this.point('cpu');
    else if (this.ball.x > this.scale.width) this.point('player');
  }

  private point(who: 'player' | 'cpu') {
    if (who === 'player') this.playerScore++;
    else this.cpuScore++;
    this.scoreText.setText(`${this.playerScore} : ${this.cpuScore}`);

    if (this.playerScore >= WIN_SCORE || this.cpuScore >= WIN_SCORE) {
      submitScore('PongScene', this.playerScore);
      this.scene.start('MenuScene');
    } else {
      this.serve();
    }
  }
}
