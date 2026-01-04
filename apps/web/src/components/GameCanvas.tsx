'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameState, LevelData, posKey } from '@codingcrazy/engine';

interface GameCanvasProps {
  levelData: LevelData;
  gameState: GameState | null;
  isPlaying: boolean;
  onAnimationComplete?: () => void;
}

const TILE_SIZE = 64;
const COLORS = {
  background: 0x1a1a2e,
  grid: 0x0f3460,
  gridLine: 0x2a4a6e,
  wall: 0x4a5568,
  wallDark: 0x2d3748,
  goal: 0x10b981,
  goalLight: 0x34d399,
  coin: 0xfbbf24,
  coinLight: 0xfcd34d,
  hero: 0x3b82f6,
  heroLight: 0x60a5fa,
  heroDark: 0x1d4ed8,
  hazardActive: 0xef4444,
  hazardInactive: 0x7f1d1d,
  skin: 0xfdbf6f,
};

export default function GameCanvas({
  levelData,
  gameState,
  isPlaying,
  onAnimationComplete,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const width = levelData.gridWidth * TILE_SIZE;
    const height = levelData.gridHeight * TILE_SIZE;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: COLORS.background,
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const scene = new GameScene(levelData);
    sceneRef.current = scene;
    game.scene.add('game', scene, true);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [levelData]);

  useEffect(() => {
    if (sceneRef.current && gameState) {
      sceneRef.current.updateState(gameState, isPlaying, onAnimationComplete);
    }
  }, [gameState, isPlaying, onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="game-canvas-container w-full"
      style={{ maxWidth: levelData.gridWidth * TILE_SIZE }}
    />
  );
}

class GameScene extends Phaser.Scene {
  private levelData: LevelData;
  private heroContainer: Phaser.GameObjects.Container | null = null;
  private heroBody: Phaser.GameObjects.Graphics | null = null;
  private coinSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private hazardSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private animationCallback: (() => void) | undefined;

  constructor(levelData: LevelData) {
    super({ key: 'game' });
    this.levelData = levelData;
  }

  create() {
    this.drawGrid();
    this.drawWalls();
    this.drawGoals();
    this.drawCoins();
    this.drawHazards();
    this.drawHero();
  }

  private drawGrid() {
    const { gridWidth, gridHeight } = this.levelData;
    const graphics = this.add.graphics();

    // Draw tiles with gradient effect
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;

        // Tile background
        graphics.fillStyle(COLORS.grid, 0.4);
        graphics.fillRoundedRect(tileX + 2, tileY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);

        // Subtle inner highlight
        graphics.fillStyle(COLORS.gridLine, 0.2);
        graphics.fillRoundedRect(tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8, 3);
      }
    }
  }

  private drawWalls() {
    for (const wall of this.levelData.walls) {
      const x = wall.x * TILE_SIZE + TILE_SIZE / 2;
      const y = wall.y * TILE_SIZE + TILE_SIZE / 2;

      const graphics = this.add.graphics();

      // Wall shadow
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRoundedRect(-TILE_SIZE/2 + 4, -TILE_SIZE/2 + 4, TILE_SIZE - 4, TILE_SIZE - 4, 6);

      // Wall body - brick pattern
      graphics.fillStyle(COLORS.wallDark);
      graphics.fillRoundedRect(-TILE_SIZE/2 + 2, -TILE_SIZE/2 + 2, TILE_SIZE - 4, TILE_SIZE - 4, 6);

      graphics.fillStyle(COLORS.wall);
      graphics.fillRoundedRect(-TILE_SIZE/2 + 2, -TILE_SIZE/2 + 2, TILE_SIZE - 6, TILE_SIZE - 6, 5);

      // Brick lines
      graphics.lineStyle(2, COLORS.wallDark, 0.5);
      graphics.lineBetween(-TILE_SIZE/2 + 6, 0, TILE_SIZE/2 - 6, 0);
      graphics.lineBetween(0, -TILE_SIZE/2 + 6, 0, -4);
      graphics.lineBetween(-TILE_SIZE/4, 4, -TILE_SIZE/4, TILE_SIZE/2 - 6);
      graphics.lineBetween(TILE_SIZE/4, 4, TILE_SIZE/4, TILE_SIZE/2 - 6);

      graphics.setPosition(x, y);
    }
  }

  private drawGoals() {
    for (const goal of this.levelData.goals) {
      const x = goal.x * TILE_SIZE + TILE_SIZE / 2;
      const y = goal.y * TILE_SIZE + TILE_SIZE / 2;

      const container = this.add.container(x, y);

      // Glowing platform
      const glow = this.add.graphics();
      glow.fillStyle(COLORS.goal, 0.3);
      glow.fillCircle(0, 0, TILE_SIZE / 2);
      container.add(glow);

      // Flag pole
      const pole = this.add.graphics();
      pole.fillStyle(0x8b4513);
      pole.fillRect(-2, -TILE_SIZE/2 + 8, 4, TILE_SIZE - 16);
      container.add(pole);

      // Flag
      const flag = this.add.graphics();
      flag.fillStyle(COLORS.goal);
      flag.beginPath();
      flag.moveTo(2, -TILE_SIZE/2 + 8);
      flag.lineTo(TILE_SIZE/3, -TILE_SIZE/4);
      flag.lineTo(2, -TILE_SIZE/6);
      flag.closePath();
      flag.fill();

      // Flag highlight
      flag.fillStyle(COLORS.goalLight, 0.5);
      flag.beginPath();
      flag.moveTo(2, -TILE_SIZE/2 + 8);
      flag.lineTo(TILE_SIZE/4, -TILE_SIZE/3);
      flag.lineTo(2, -TILE_SIZE/4);
      flag.closePath();
      flag.fill();
      container.add(flag);

      // Animate glow
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.6 },
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // Animate flag wave
      this.tweens.add({
        targets: flag,
        scaleX: { from: 1, to: 0.9 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private drawCoins() {
    for (const coin of this.levelData.coins) {
      const key = posKey(coin);
      const x = coin.x * TILE_SIZE + TILE_SIZE / 2;
      const y = coin.y * TILE_SIZE + TILE_SIZE / 2;

      const container = this.add.container(x, y);

      // Coin glow
      const glow = this.add.graphics();
      glow.fillStyle(COLORS.coin, 0.3);
      glow.fillCircle(0, 0, TILE_SIZE / 3);
      container.add(glow);

      // Coin body
      const coinBody = this.add.graphics();
      coinBody.fillStyle(COLORS.coin);
      coinBody.fillCircle(0, 0, TILE_SIZE / 4);
      coinBody.fillStyle(COLORS.coinLight);
      coinBody.fillCircle(-3, -3, TILE_SIZE / 6);

      // Dollar sign
      coinBody.fillStyle(0xb45309);
      coinBody.fillRect(-2, -8, 4, 16);
      coinBody.fillRect(-6, -6, 12, 3);
      coinBody.fillRect(-6, 3, 12, 3);
      container.add(coinBody);

      this.coinSprites.set(key, container);

      // Spin animation
      this.tweens.add({
        targets: container,
        scaleX: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      // Float animation
      this.tweens.add({
        targets: container,
        y: { from: y - 3, to: y + 3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawHazards() {
    for (const hazard of this.levelData.hazards) {
      const key = posKey(hazard);
      const x = hazard.x * TILE_SIZE + TILE_SIZE / 2;
      const y = hazard.y * TILE_SIZE + TILE_SIZE / 2;

      const container = this.add.container(x, y);

      // Hazard base
      const base = this.add.graphics();
      base.fillStyle(0x1f1f1f);
      base.fillRoundedRect(-TILE_SIZE/2 + 4, -TILE_SIZE/2 + 4, TILE_SIZE - 8, TILE_SIZE - 8, 4);
      container.add(base);

      // Spikes
      const spikes = this.add.graphics();
      this.drawSpikes(spikes, true);
      container.add(spikes);

      // Store reference
      container.setData('spikes', spikes);
      this.hazardSprites.set(key, container);
    }
  }

  private drawSpikes(graphics: Phaser.GameObjects.Graphics, active: boolean) {
    graphics.clear();
    const color = active ? COLORS.hazardActive : COLORS.hazardInactive;
    const alpha = active ? 1 : 0.5;

    graphics.fillStyle(color, alpha);

    // Draw 4 spikes
    const spikePositions = [
      { x: -12, y: 0 },
      { x: 12, y: 0 },
      { x: 0, y: -12 },
      { x: 0, y: 12 },
    ];

    for (const pos of spikePositions) {
      graphics.beginPath();
      graphics.moveTo(pos.x, pos.y - 10);
      graphics.lineTo(pos.x - 6, pos.y + 8);
      graphics.lineTo(pos.x + 6, pos.y + 8);
      graphics.closePath();
      graphics.fill();
    }

    // Center spike
    graphics.beginPath();
    graphics.moveTo(0, -14);
    graphics.lineTo(-8, 10);
    graphics.lineTo(8, 10);
    graphics.closePath();
    graphics.fill();

    // Highlight
    if (active) {
      graphics.fillStyle(0xff6b6b, 0.5);
      graphics.beginPath();
      graphics.moveTo(0, -12);
      graphics.lineTo(-4, 4);
      graphics.lineTo(4, 4);
      graphics.closePath();
      graphics.fill();
    }
  }

  private drawHero() {
    const { startPosition } = this.levelData;
    const x = startPosition.x * TILE_SIZE + TILE_SIZE / 2;
    const y = startPosition.y * TILE_SIZE + TILE_SIZE / 2;

    this.heroContainer = this.add.container(x, y);
    this.heroContainer.setDepth(10);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(0, TILE_SIZE/3, TILE_SIZE/2, TILE_SIZE/6);
    this.heroContainer.add(shadow);

    // Body
    this.heroBody = this.add.graphics();
    this.drawHeroGraphics(this.heroBody, 'normal');
    this.heroContainer.add(this.heroBody);

    // Idle animation - gentle bounce
    this.tweens.add({
      targets: this.heroContainer,
      y: { from: y - 2, to: y + 2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawHeroGraphics(graphics: Phaser.GameObjects.Graphics, state: 'normal' | 'dead' | 'won') {
    graphics.clear();

    let bodyColor = COLORS.hero;
    let lightColor = COLORS.heroLight;

    if (state === 'dead') {
      bodyColor = 0xef4444;
      lightColor = 0xf87171;
    } else if (state === 'won') {
      bodyColor = 0x22c55e;
      lightColor = 0x4ade80;
    }

    // Body (rounded rectangle character)
    graphics.fillStyle(bodyColor);
    graphics.fillRoundedRect(-TILE_SIZE/3, -TILE_SIZE/3, TILE_SIZE/1.5, TILE_SIZE/1.5, 10);

    // Body highlight
    graphics.fillStyle(lightColor, 0.5);
    graphics.fillRoundedRect(-TILE_SIZE/3 + 4, -TILE_SIZE/3 + 4, TILE_SIZE/2 - 4, TILE_SIZE/3, 8);

    // Face
    graphics.fillStyle(COLORS.skin);
    graphics.fillCircle(0, -4, TILE_SIZE/5);

    // Eyes
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(-6, -6, 5);
    graphics.fillCircle(6, -6, 5);

    graphics.fillStyle(0x000000);
    graphics.fillCircle(-5, -5, 3);
    graphics.fillCircle(7, -5, 3);

    // Eye shine
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(-6, -7, 1.5);
    graphics.fillCircle(6, -7, 1.5);

    // Mouth
    if (state === 'won') {
      // Big smile
      graphics.lineStyle(2, 0x000000);
      graphics.beginPath();
      graphics.arc(0, -2, 6, 0.2, Math.PI - 0.2, false);
      graphics.stroke();
    } else if (state === 'dead') {
      // X eyes and frown
      graphics.lineStyle(2, 0x000000);
      graphics.lineBetween(-8, -8, -4, -4);
      graphics.lineBetween(-4, -8, -8, -4);
      graphics.lineBetween(4, -8, 8, -4);
      graphics.lineBetween(8, -8, 4, -4);
      graphics.beginPath();
      graphics.arc(0, 4, 4, Math.PI + 0.3, -0.3, false);
      graphics.stroke();
    } else {
      // Normal smile
      graphics.lineStyle(2, 0x000000);
      graphics.beginPath();
      graphics.arc(0, -2, 4, 0.3, Math.PI - 0.3, false);
      graphics.stroke();
    }

    // Feet
    graphics.fillStyle(COLORS.heroDark);
    graphics.fillRoundedRect(-TILE_SIZE/3 + 2, TILE_SIZE/4, 10, 8, 3);
    graphics.fillRoundedRect(TILE_SIZE/3 - 12, TILE_SIZE/4, 10, 8, 3);
  }

  updateState(
    state: GameState,
    isPlaying: boolean,
    onComplete?: () => void
  ) {
    this.animationCallback = onComplete;

    if (this.heroContainer && this.heroBody) {
      const targetX = state.heroPosition.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = state.heroPosition.y * TILE_SIZE + TILE_SIZE / 2;

      if (isPlaying) {
        // Stop idle animation during movement
        this.tweens.killTweensOf(this.heroContainer);

        this.tweens.add({
          targets: this.heroContainer,
          x: targetX,
          y: targetY,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            // Resume idle animation
            this.tweens.add({
              targets: this.heroContainer,
              y: { from: targetY - 2, to: targetY + 2 },
              duration: 600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
            this.animationCallback?.();
          },
        });
      } else {
        this.heroContainer.setPosition(targetX, targetY);
      }

      // Update hero appearance
      if (!state.isAlive) {
        this.drawHeroGraphics(this.heroBody, 'dead');
      } else if (state.hasWon) {
        this.drawHeroGraphics(this.heroBody, 'won');
      } else {
        this.drawHeroGraphics(this.heroBody, 'normal');
      }
    }

    // Update coins
    for (const [key, container] of this.coinSprites) {
      const visible = !state.collectedCoins.has(key);
      container.setVisible(visible);
    }

    // Update hazards
    for (let i = 0; i < this.levelData.hazards.length; i++) {
      const hazard = this.levelData.hazards[i];
      const key = posKey(hazard);
      const container = this.hazardSprites.get(key);

      if (container) {
        const spikes = container.getData('spikes') as Phaser.GameObjects.Graphics;
        const isActive = this.isHazardActive(hazard, state.currentTurn);
        this.drawSpikes(spikes, isActive);
      }
    }
  }

  private isHazardActive(
    hazard: { pattern: string; activeFrames: number[] },
    turn: number
  ): boolean {
    if (hazard.pattern === 'static') return true;
    const maxFrame = Math.max(...hazard.activeFrames);
    return hazard.activeFrames.includes(turn % (maxFrame + 2));
  }
}
