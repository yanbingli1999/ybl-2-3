import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';
import GameMap from '../components/GameMap';
import StatusPanel from '../components/StatusPanel';
import OrderPanel from '../components/OrderPanel';
import ControlBar from '../components/ControlBar';
import SettlementModal from '../components/SettlementModal';
import SaveLoadModal from '../components/SaveLoadModal';
import { hasSavedGame } from '../game/Storage';
import { Truck, HelpCircle, X } from 'lucide-react';

export default function Home() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const dispatch = useGameStore((state) => state.dispatch);
  const player = useGameStore((state) => state.player);
  const loadGame = useGameStore((state) => state.load);

  const { setKey } = useGameLoop();

  const handleNewGame = () => {
    dispatch({ type: 'NEW_GAME' });
    setShowStartScreen(false);
  };

  const handleContinue = () => {
    if (loadGame()) {
      setShowStartScreen(false);
    } else {
      alert('没有找到存档！');
    }
  };

  const handleRestart = () => {
    if (confirm('确定要重新开始游戏吗？')) {
      dispatch({ type: 'NEW_GAME' });
    }
  };

  return (
    <div className="w-full h-full bg-game-night flex flex-col items-center justify-center p-4 overflow-hidden">
      <h1 className="font-pixel text-2xl text-game-neon glow-text mb-4 flex items-center gap-3">
        <Truck size={32} />
        城市送货模拟器
        <button
          onClick={() => setShowHelp(true)}
          className="ml-auto text-game-neon/50 hover:text-game-neon transition-colors"
        >
          <HelpCircle size={24} />
        </button>
      </h1>

      <div className="flex gap-4 items-start">
        <StatusPanel />
        <div className="flex flex-col gap-4">
          <GameMap />
          <ControlBar onOpenSave={() => setShowSaveModal(true)} setKey={setKey} />
        </div>
        <OrderPanel />
      </div>

      <SettlementModal />
      <SaveLoadModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />

      {showStartScreen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="game-card p-8 text-center max-w-lg">
            <div className="mb-6">
              <Truck size={64} className="mx-auto text-game-neon mb-4" />
              <h2 className="font-pixel text-3xl text-game-neon glow-text mb-2">
                城市送货模拟器
              </h2>
              <p className="font-retro text-lg text-gray-400">
                接单送货，风雨无阻
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <button
                onClick={handleNewGame}
                className="pixel-btn pixel-btn-success w-full text-sm py-3"
              >
                🚀 开始新游戏
              </button>

              {hasSavedGame() && (
                <button
                  onClick={handleContinue}
                  className="pixel-btn w-full text-sm py-3"
                >
                  📂 继续游戏
                </button>
              )}
            </div>

            <div className="text-left bg-game-night/50 rounded p-4 border border-gray-700">
              <h3 className="font-pixel text-xs text-game-neon mb-3">游戏说明</h3>
              <ul className="font-retro text-sm text-gray-400 space-y-2">
                <li>🎮 使用 WASD 或方向键控制车辆移动</li>
                <li>📦 从订单面板选择合适的订单接单</li>
                <li>📍 按照导航前往取货点和送货点</li>
                <li>⚡ 注意电量、体力和车辆耐久度</li>
                <li>🌧️ 雨天会影响行驶速度</li>
                <li>⏰ 迟到会被扣钱，提早送达有奖励</li>
                <li>💾 游戏进度会自动保存到本地</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="game-card p-8 text-center">
            <h2 className="font-pixel text-3xl text-game-danger glow-text mb-4">
              游戏结束
            </h2>
            <div className="font-retro text-lg text-gray-300 mb-6 space-y-2">
              <p>你完成了 <span className="text-game-success">{player.completedOrders}</span> 个订单</p>
              <p>最终余额 <span className="text-game-streetLight">¥{player.money}</span></p>
              <p>平均评分 <span className="text-game-streetLight">
                {player.completedOrders > 0
                  ? (player.totalRating / player.completedOrders).toFixed(1)
                  : '0.0'}/5.0
              </span></p>
            </div>
            <button
              onClick={handleRestart}
              className="pixel-btn pixel-btn-success"
            >
              🔄 重新开始
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="game-card p-6 max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-pixel text-lg text-game-neon glow-text">游戏帮助</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 font-retro text-sm text-gray-300">
              <div>
                <h4 className="font-pixel text-xs text-game-streetLight mb-2">基本操作</h4>
                <ul className="space-y-1">
                  <li>• <span className="text-game-neon">W/A/S/D</span> 或 <span className="text-game-neon">方向键</span> - 移动车辆</li>
                  <li>• <span className="text-game-neon">ESC</span> - 暂停/继续游戏</li>
                  <li>• 点击"接单"按钮接受订单</li>
                </ul>
              </div>

              <div>
                <h4 className="font-pixel text-xs text-game-streetLight mb-2">地图图标</h4>
                <ul className="space-y-1">
                  <li>• <span className="text-game-success">📦 绿色标记</span> - 可接单的取货点</li>
                  <li>• <span className="text-game-success">📍 绿色虚线</span> - 当前订单取货点</li>
                  <li>• <span className="text-game-danger">🏠 红色虚线</span> - 送货目的地</li>
                  <li>• <span className="text-game-neon">⚡ 青色方块</span> - 充电站</li>
                  <li>• <span className="text-game-streetLight">🔧 黄色方块</span> - 修车铺</li>
                </ul>
              </div>

              <div>
                <h4 className="font-pixel text-xs text-game-streetLight mb-2">游戏机制</h4>
                <ul className="space-y-1">
                  <li>• 行驶会消耗电量、体力和车辆耐久度</li>
                  <li>• 雨天会降低行驶速度并增加消耗</li>
                  <li>• 迟到会被扣钱，提早送达有奖励</li>
                  <li>• 紧急订单按时送达有额外奖励</li>
                  <li>• 可以在充电站充电、修车铺修车</li>
                  <li>• 休息可以恢复体力</li>
                </ul>
              </div>

              <div>
                <h4 className="font-pixel text-xs text-game-streetLight mb-2">评分标准</h4>
                <ul className="space-y-1">
                  <li>• ⭐⭐⭐⭐⭐ 完美送达（提前15%以上）</li>
                  <li>• ⭐⭐⭐⭐ 快速送达（提前25%以上）</li>
                  <li>• ⭐⭐⭐ 正常送达</li>
                  <li>• ⭐⭐ 迟到（剩余时间不足50%）</li>
                  <li>• ⭐ 严重迟到（剩余时间不足30%）</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="pixel-btn w-full mt-6"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
