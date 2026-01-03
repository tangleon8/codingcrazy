'use client';

import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { GameState, LevelData, posKey } from '@codingcrazy/engine';

interface GameCanvasProps {
  levelData: LevelData;
  gameState: GameState | null;
  isPlaying: boolean;
  onAnimationComplete?: () => void;
}

const TILE_SIZE = 48;
const COLORS = {
  background: 0x1a1a2e,
  grid: 0x0f3460,
  wall: 0x4a4a6a,
  goal: 0x22c55e,
  coin: 0xfbbf24,
  hero: 0x3b82f6,
  hazardActive: 0xef4444,
  hazardInactive: 0x7f1d1d,
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

  // Create/update game when level data changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing game
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

    // Add the scene after game is created
    const scene = new GameScene(levelData);
    sceneRef.current = scene;
    game.scene.add('game', scene, true);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [levelData]);

  // Update scene when game state changes
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
  private heroSprite: Phaser.GameObjects.Rectangle | null = null;
  private coinSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private hazardSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private currentState: GameState | null = null;
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
    graphics.lineStyle(1, COLORS.grid, 0.3);

    // Draw grid lines
    for (let x = 0; x <= gridWidth; x++) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, gridHeight * TILE_SIZE);
    }
    for (let y = 0; y <= gridHeight; y++) {
      graphics.lineBetween(0, y * TILE_SIZE, gridWidth * TILE_SIZE, y * TILE_SIZE);
    }

    // Draw cell backgrounds
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const rect = this.add.rectangle(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
          COLORS.grid,
          0.2
        );
        rect.setStrokeStyle(1, COLORS.grid, 0.3);
      }
    }
  }

  private drawWalls() {
    for (const wall of this.levelData.walls) {
      this.add.rectangle(
        wall.x * TILE_SIZE + TILE_SIZE / 2,
        wall.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 2,
        TILE_SIZE - 2,
        COLORS.wall
      );
    }
  }

  private drawGoals() {
    for (const goal of this.levelData.goals) {
      const rect = this.add.rectangle(
        goal.x * TILE_SIZE + TILE_SIZE / 2,
        goal.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        COLORS.goal,
        0.3
      );
      rect.setStrokeStyle(3, COLORS.goal);

      // Add pulsing animation
      this.tweens.add({
        targets: rect,
        alpha: { from: 0.3, to: 0.6 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private drawCoins() {
    for (const coin of this.levelData.coins) {
      const key = posKey(coin);
      const circle = this.add.circle(
        coin.x * TILE_SIZE + TILE_SIZE / 2,
        coin.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 4,
        COLORS.coin
      );
      circle.setStrokeStyle(2, 0xf59e0b);
      this.coinSprites.set(key, circle);

      // Add subtle rotation effect
      this.tweens.add({
        targets: circle,
        scaleX: { from: 1, to: 0.8 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private drawHazards() {
    for (const hazard of this.levelData.hazards) {
      const key = posKey(hazard);
      const rect = this.add.rectangle(
        hazard.x * TILE_SIZE + TILE_SIZE / 2,
        hazard.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        COLORS.hazardActive
      );
      this.hazardSprites.set(key, rect);
    }
  }

  private drawHero() {
    const { startPosition } = this.levelData;
    this.heroSprite = this.add.rectangle(
      startPosition.x * TILE_SIZE + TILE_SIZE / 2,
      startPosition.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE - 8,
      TILE_SIZE - 8,
      COLORS.hero
    );
    this.heroSprite.setStrokeStyle(3, 0x60a5fa);
    this.heroSprite.setDepth(10);
  }

  updateState(
    state: GameState,
    isPlaying: boolean,
    onComplete?: () => void
  ) {
    this.currentState = state;
    this.animationCallback = onComplete;

    // Update hero position
    if (this.heroSprite) {
      const targetX = state.heroPosition.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = state.heroPosition.y * TILE_SIZE + TILE_SIZE / 2;

      if (isPlaying) {
        // Animate movement
        this.tweens.add({
          targets: this.heroSprite,
          x: targetX,
          y: targetY,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            this.animationCallback?.();
          },
        });
      } else {
        // Instant move
        this.heroSprite.setPosition(targetX, targetY);
      }

      // Update hero color based on alive/won status
      if (!state.isAlive) {
        this.heroSprite.setFillStyle(0xef4444);
      } else if (state.hasWon) {
        this.heroSprite.setFillStyle(0x22c55e);
      } else {
        this.heroSprite.setFillStyle(COLORS.hero);
      }
    }

    // Update collected coins (hide them)
    for (const [key, sprite] of this.coinSprites) {
      sprite.setVisible(!state.collectedCoins.has(key));
    }

    // Update hazard states based on current turn
    for (let i = 0; i < this.levelData.hazards.length; i++) {
      const hazard = this.levelData.hazards[i];
      const key = posKey(hazard);
      const sprite = this.hazardSprites.get(key);

      if (sprite) {
        const isActive = this.isHazardActive(hazard, state.currentTurn);
        sprite.setFillStyle(isActive ? COLORS.hazardActive : COLORS.hazardInactive);
        sprite.setAlpha(isActive ? 1 : 0.5);
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
