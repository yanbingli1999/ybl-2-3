import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { WEATHER_NAMES, WEATHER_COLORS } from '../game/constants';
import { calculateTotalRating, formatMoney } from '../game/EconomySystem';
import type { ChargingMethod } from '../game/types';
import { Zap, Heart, Wrench, DollarSign, Cloud, Clock, Star } from 'lucide-react';

export default function StatusPanel() {
  const player = useGameStore((state) => state.player);
  const vehicle = useGameStore((state) => state.vehicle);
  const weather = useGameStore((state) => state.weather);
  const gameTime = useGameStore((state) => state.gameTime);
  const incomeRecords = useGameStore(useShallow((state) => state.incomeRecords));
  const charging = useGameStore((state) => state.charging);
  const isRepairing = useGameStore((state) => state.isRepairing);
  const isResting = useGameStore((state) => state.isResting);

  const getChargeMethodName = (method: ChargingMethod): string => {
    switch (method) {
      case 'slow': return '慢充';
      case 'fast': return '快充';
      case 'battery_swap': return '换电';
    }
  };

  const avgRating = calculateTotalRating(incomeRecords);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressClass = (value: number) => {
    if (value < 20) return 'danger';
    if (value < 50) return 'warning';
    return '';
  };

  const weatherIcon = {
    sunny: '☀️',
    cloudy: '⛅',
    rainy: '🌧️',
    heavy_rain: '⛈️',
    storm: '🌪️',
  }[weather.type];

  return (
    <div className="game-card p-4 w-72 space-y-4">
      <h3 className="font-pixel text-sm text-game-neon glow-text">状态面板</h3>

      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-game-streetLight" />
        <span className="font-retro text-2xl text-game-streetLight">{formatMoney(player.money)}</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-game-neon" />
              <span className="font-retro text-sm">电量</span>
            </div>
            <span className={`font-retro text-sm ${vehicle.battery < 20 ? 'text-game-danger animate-pulse' : ''}`}>
              {Math.floor(vehicle.battery)}%
              {charging.isCharging && charging.method && (
                <span className="text-game-success ml-1">⚡{getChargeMethodName(charging.method)}中</span>
              )}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressClass(vehicle.battery)}`}
              style={{ width: `${vehicle.battery}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-game-danger" />
              <span className="font-retro text-sm">体力</span>
            </div>
            <span className={`font-retro text-sm ${player.stamina < 20 ? 'text-game-danger animate-pulse' : ''}`}>
              {Math.floor(player.stamina)}%
              {isResting && <span className="text-game-success ml-1">💤休息中</span>}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressClass(player.stamina)}`}
              style={{ width: `${player.stamina}%`, background: 'linear-gradient(90deg, #ff4757 0%, #ff6b81 100%)' }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Wrench size={14} className="text-game-streetLight" />
              <span className="font-retro text-sm">耐久度</span>
            </div>
            <span className={`font-retro text-sm ${vehicle.durability < 20 ? 'text-game-danger animate-pulse' : ''}`}>
              {Math.floor(vehicle.durability)}%
              {isRepairing && <span className="text-game-success ml-1">🔧维修中</span>}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressClass(vehicle.durability)}`}
              style={{ width: `${vehicle.durability}%`, background: 'linear-gradient(90deg, #ffcc4d 0%, #ffda79 100%)' }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-game-neon/30 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud size={16} style={{ color: WEATHER_COLORS[weather.type] }} />
            <span className="font-retro text-lg">{weatherIcon}</span>
          </div>
          <span className="font-retro text-sm" style={{ color: WEATHER_COLORS[weather.type] }}>
            {WEATHER_NAMES[weather.type]}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Clock size={14} className="text-gray-400" />
          <span className="font-retro text-sm text-gray-300">{formatTime(gameTime)}</span>
        </div>

        <div className="flex items-center justify-between">
          <Star size={14} className="text-game-streetLight" />
          <span className="font-retro text-sm text-game-streetLight">
            评分: {avgRating > 0 ? avgRating.toFixed(1) : '-'}/5.0
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-retro text-sm text-gray-400">完成订单</span>
          <span className="font-retro text-sm text-game-success">{player.completedOrders}</span>
        </div>
      </div>

      {(charging.isCharging || isRepairing || isResting) && (
        <div className="bg-game-neon/10 border border-game-neon/50 rounded p-2 text-center space-y-1">
          <span className="font-retro text-xs text-game-neon">
            {charging.isCharging && charging.method && (charging.queueWaitRemaining > 0 ? `排队等待${getChargeMethodName(charging.method)}...` : `正在${getChargeMethodName(charging.method)}中...`)}
            {isRepairing && '正在维修中...'}
            {isResting && '正在休息中...'}
          </span>
          {charging.isCharging && (
            <div className="text-xs space-y-0.5">
              {charging.queueWaitRemaining > 0 && (
                <div className="flex justify-between px-1">
                  <span className="font-retro text-gray-400">排队剩余</span>
                  <span className="font-retro text-game-warning">{charging.queueWaitRemaining.toFixed(1)}秒</span>
                </div>
              )}
              <div className="flex justify-between px-1">
                <span className="font-retro text-gray-400">已充电</span>
                <span className="font-retro text-game-neon">+{charging.chargeAmount.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between px-1">
                <span className="font-retro text-gray-400">花费</span>
                <span className="font-retro text-game-streetLight">{formatMoney(charging.totalCost)}</span>
              </div>
              <div className="flex justify-between px-1">
                <span className="font-retro text-gray-400">剩余</span>
                <span className="font-retro text-game-warning">
                  {charging.remainingTime > 60
                    ? `${Math.floor(charging.remainingTime / 60)}分${Math.floor(charging.remainingTime % 60)}秒`
                    : `${charging.remainingTime.toFixed(1)}秒`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
