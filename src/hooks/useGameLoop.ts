import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ORDER_GENERATION_INTERVAL } from '../game/constants';

export function useGameLoop() {
  const dispatch = useGameStore((state) => state.dispatch);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const orderGenerationTimer = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_PAUSE' });
      }
      if (e.key === ' ') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch]);

  useEffect(() => {
    if (isPaused || isGameOver) return;

    let animationId: number;
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
        dispatch({ type: 'MOVE', direction: 'up' });
      }
      if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
        dispatch({ type: 'MOVE', direction: 'down' });
      }
      if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
        dispatch({ type: 'MOVE', direction: 'left' });
      }
      if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
        dispatch({ type: 'MOVE', direction: 'right' });
      }

      dispatch({ type: 'TICK', deltaTime });

      orderGenerationTimer.current += deltaTime * 1000;
      if (orderGenerationTimer.current >= ORDER_GENERATION_INTERVAL) {
        orderGenerationTimer.current = 0;
        dispatch({ type: 'GENERATE_ORDERS' });
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dispatch, isPaused, isGameOver]);

  const setKey = (key: string, pressed: boolean) => {
    if (pressed) {
      keysPressed.current.add(key);
    } else {
      keysPressed.current.delete(key);
    }
  };

  return { setKey };
}
