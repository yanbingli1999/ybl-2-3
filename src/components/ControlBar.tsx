import { useState } from 'react';
import { useGameStore, selectIsNearCharging, selectIsNearRepair } from '../store/gameStore';
import { Zap, Wrench, Coffee, Pause, Play, Save, FolderOpen, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ControlBar({ onOpenSave, setKey }: { onOpenSave: () => void; setKey: (key: string, pressed: boolean) => void }) {
  const dispatch = useGameStore((state) => state.dispatch);
  const isPaused = useGameStore((state) => state.isPaused);
  const isCharging = useGameStore((state) => state.isCharging);
  const isRepairing = useGameStore((state) => state.isRepairing);
  const isResting = useGameStore((state) => state.isResting);
  const saveGame = useGameStore((state) => state.save);
  const loadGame = useGameStore((state) => state.load);

  const nearCharging = useGameStore(selectIsNearCharging);
  const nearRepair = useGameStore(selectIsNearRepair);

  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const handleKeyPress = (key: string, pressed: boolean) => {
    setKey(key, pressed);
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (pressed) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleCharge = () => {
    if (isCharging) {
      dispatch({ type: 'STOP_CHARGING' });
    } else if (nearCharging) {
      dispatch({ type: 'START_CHARGING' });
    }
  };

  const handleRepair = () => {
    if (isRepairing) {
      dispatch({ type: 'STOP_REPAIRING' });
    } else if (nearRepair) {
      dispatch({ type: 'START_REPAIRING' });
    }
  };

  const handleRest = () => {
    if (isResting) {
      dispatch({ type: 'STOP_RESTING' });
    } else {
      dispatch({ type: 'START_RESTING' });
    }
  };

  const handleSave = () => {
    const success = saveGame();
    if (success) {
      alert('游戏已保存！');
    } else {
      alert('保存失败！');
    }
  };

  const handleLoad = () => {
    const success = loadGame();
    if (success) {
      alert('游戏已加载！');
    } else {
      alert('没有找到存档！');
    }
  };

  const handleNewGame = () => {
    if (confirm('确定要开始新游戏吗？当前进度将丢失！')) {
      dispatch({ type: 'NEW_GAME' });
    }
  };

  const directionBtnClass = (key: string) => `
    w-12 h-12 flex items-center justify-center
    bg-game-nightLight border-2 border-game-neon/50 rounded
    active:bg-game-neon active:text-game-night
    transition-all duration-100
    ${activeKeys.has(key) ? 'bg-game-neon text-game-night' : 'text-game-neon'}
  `;

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-1">
            <div></div>
            <button
              className={directionBtnClass('w')}
              onMouseDown={() => handleKeyPress('w', true)}
              onMouseUp={() => handleKeyPress('w', false)}
              onMouseLeave={() => handleKeyPress('w', false)}
              onTouchStart={() => handleKeyPress('w', true)}
              onTouchEnd={() => handleKeyPress('w', false)}
            >
              <ArrowUp size={20} />
            </button>
            <div></div>
            <button
              className={directionBtnClass('a')}
              onMouseDown={() => handleKeyPress('a', true)}
              onMouseUp={() => handleKeyPress('a', false)}
              onMouseLeave={() => handleKeyPress('a', false)}
              onTouchStart={() => handleKeyPress('a', true)}
              onTouchEnd={() => handleKeyPress('a', false)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className={directionBtnClass('s')}
              onMouseDown={() => handleKeyPress('s', true)}
              onMouseUp={() => handleKeyPress('s', false)}
              onMouseLeave={() => handleKeyPress('s', false)}
              onTouchStart={() => handleKeyPress('s', true)}
              onTouchEnd={() => handleKeyPress('s', false)}
            >
              <ArrowDown size={20} />
            </button>
            <button
              className={directionBtnClass('d')}
              onMouseDown={() => handleKeyPress('d', true)}
              onMouseUp={() => handleKeyPress('d', false)}
              onMouseLeave={() => handleKeyPress('d', false)}
              onTouchStart={() => handleKeyPress('d', true)}
              onTouchEnd={() => handleKeyPress('d', false)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="font-retro text-xs text-gray-500 ml-2">
            <p>WASD / 方向键移动</p>
            <p>ESC 暂停</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCharge}
            disabled={!nearCharging && !isCharging}
            className={`pixel-btn text-xs flex items-center gap-1 ${
              isCharging ? 'pixel-btn-success' : !nearCharging ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Zap size={14} />
            {isCharging ? '停止充电' : '充电'}
          </button>

          <button
            onClick={handleRepair}
            disabled={!nearRepair && !isRepairing}
            className={`pixel-btn text-xs flex items-center gap-1 ${
              isRepairing ? 'pixel-btn-success' : !nearRepair ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Wrench size={14} />
            {isRepairing ? '停止维修' : '修车'}
          </button>

          <button
            onClick={handleRest}
            className={`pixel-btn text-xs flex items-center gap-1 ${
              isResting ? 'pixel-btn-success' : ''
            }`}
          >
            <Coffee size={14} />
            {isResting ? '停止休息' : '休息'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className="pixel-btn text-xs flex items-center gap-1"
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? '继续' : '暂停'}
          </button>

          <button
            onClick={handleSave}
            className="pixel-btn pixel-btn-success text-xs flex items-center gap-1"
          >
            <Save size={14} />
            保存
          </button>

          <button
            onClick={onOpenSave}
            className="pixel-btn text-xs flex items-center gap-1"
          >
            <FolderOpen size={14} />
            存档
          </button>

          <button
            onClick={handleNewGame}
            className="pixel-btn pixel-btn-danger text-xs flex items-center gap-1"
          >
            <RotateCcw size={14} />
            新游戏
          </button>
        </div>
      </div>

      {nearCharging && !isCharging && (
        <div className="mt-2 text-center text-game-neon font-retro text-xs animate-pulse">
          ⚡ 你在充电站附近，可以充电
        </div>
      )}
      {nearRepair && !isRepairing && (
        <div className="mt-2 text-center text-game-streetLight font-retro text-xs animate-pulse">
          🔧 你在修车铺附近，可以修车
        </div>
      )}
      {isResting && (
        <div className="mt-2 text-center text-game-success font-retro text-xs animate-pulse">
          ☕ 正在休息恢复体力...点击"停止休息"继续送货
        </div>
      )}
    </div>
  );
}
