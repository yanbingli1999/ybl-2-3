import { useGameStore, useNearestChargingStation, useChargingState, useIsCharging } from '../store/gameStore';
import { calculateChargeCost, calculateEstimatedChargeTime } from '../game/VehicleSystem';
import { formatMoney } from '../game/EconomySystem';
import type { ChargingMethod } from '../game/types';
import { Zap, Battery, Clock, Users, DollarSign, X } from 'lucide-react';

interface ChargingOptionProps {
  method: ChargingMethod;
  name: string;
  description: string;
  price: string;
  time: string;
  disabled: boolean;
  disabledReason?: string;
  isActive: boolean;
  onClick: () => void;
}

function ChargingOption({ name, description, price, time, disabled, disabledReason, isActive, onClick }: ChargingOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded border-2 text-left transition-all
        ${isActive
          ? 'border-game-neon bg-game-neon/20'
          : disabled
            ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
            : 'border-game-neon/50 bg-game-nightLight hover:border-game-neon hover:bg-game-neon/10'
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-pixel text-sm text-game-neon">{name}</span>
        <span className="font-retro text-sm text-game-streetLight">{price}</span>
      </div>
      <p className="font-retro text-xs text-gray-400 mb-2">{description}</p>
      <div className="flex items-center gap-2 text-xs">
        <Clock size={12} className="text-gray-500" />
        <span className="font-retro text-gray-400">{time}</span>
      </div>
      {disabled && disabledReason && (
        <p className="font-retro text-xs text-game-danger mt-2">{disabledReason}</p>
      )}
    </button>
  );
}

export default function ChargingStationPanel() {
  const dispatch = useGameStore((state) => state.dispatch);
  const station = useNearestChargingStation();
  const charging = useChargingState();
  const isCharging = useIsCharging();
  const player = useGameStore((state) => state.player);
  const vehicle = useGameStore((state) => state.vehicle);

  if (!station) return null;

  const neededBattery = vehicle.maxBattery - vehicle.battery;

  const getSlowChargeInfo = () => {
    const cost = calculateChargeCost('slow', neededBattery, station);
    const time = calculateEstimatedChargeTime('slow', vehicle.battery, vehicle.maxBattery);
    const canAfford = player.money >= cost;
    return {
      price: `${formatMoney(cost)} (${station.slowChargePrice.toFixed(2)}/单位)`,
      time: `${time.toFixed(1)} 秒`,
      disabled: !canAfford || neededBattery <= 0,
      disabledReason: !canAfford ? '余额不足' : neededBattery <= 0 ? '电量已满' : undefined,
    };
  };

  const getFastChargeInfo = () => {
    const cost = calculateChargeCost('fast', neededBattery, station);
    const time = calculateEstimatedChargeTime('fast', vehicle.battery, vehicle.maxBattery);
    const canAfford = player.money >= cost;
    return {
      price: `${formatMoney(cost)} (${station.fastChargePrice.toFixed(2)}/单位)`,
      time: `${time.toFixed(1)} 秒`,
      disabled: !canAfford || neededBattery <= 0,
      disabledReason: !canAfford ? '余额不足' : neededBattery <= 0 ? '电量已满' : undefined,
    };
  };

  const getBatterySwapInfo = () => {
    const cost = station.batterySwapPrice;
    const time = calculateEstimatedChargeTime('battery_swap', vehicle.battery, vehicle.maxBattery);
    const canAfford = player.money >= cost;
    const hasBattery = station.remainingBatteries > 0;
    return {
      price: formatMoney(cost),
      time: `${time.toFixed(0)} 秒 (立即满电)`,
      disabled: !canAfford || !hasBattery,
      disabledReason: !hasBattery ? '无可用电池' : !canAfford ? '余额不足' : undefined,
    };
  };

  const slowInfo = getSlowChargeInfo();
  const fastInfo = getFastChargeInfo();
  const swapInfo = getBatterySwapInfo();

  const handleStartCharging = (method: ChargingMethod) => {
    dispatch({ type: 'START_CHARGING', method, stationId: station.id });
  };

  const handleStopCharging = () => {
    dispatch({ type: 'STOP_CHARGING' });
  };

  const getMethodName = (method: ChargingMethod) => {
    switch (method) {
      case 'slow': return '慢充';
      case 'fast': return '快充';
      case 'battery_swap': return '换电';
    }
  };

  return (
    <div className="game-card p-4 w-80 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-pixel text-sm text-game-neon glow-text">
          ⚡ {station.name}
        </h3>
        {isCharging && (
          <button
            onClick={handleStopCharging}
            className="pixel-btn pixel-btn-danger text-xs flex items-center gap-1"
          >
            <X size={12} />
            停止
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Battery size={14} className="text-game-success" />
          <span className="font-retro text-gray-300">
            电池库存: {station.remainingBatteries}/{station.maxBatteries}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} className="text-game-streetLight" />
          <span className="font-retro text-gray-300">
            排队: {station.queueCount} 人
          </span>
        </div>
      </div>

      {isCharging && charging.method && (
        <div className="bg-game-neon/10 border border-game-neon/50 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-pixel text-xs text-game-neon">
              正在{getMethodName(charging.method)}中...
            </span>
            <span className="font-retro text-xs text-game-success animate-pulse">
              ⚡ 充电中
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-retro text-gray-400">已充电</span>
              <span className="font-retro text-game-neon">+{charging.chargeAmount.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-retro text-gray-400">已花费</span>
              <span className="font-retro text-game-streetLight">{formatMoney(charging.totalCost)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-retro text-gray-400">剩余时间</span>
              <span className="font-retro text-game-warning">
                {charging.remainingTime > 60
                  ? `${Math.floor(charging.remainingTime / 60)}分${Math.floor(charging.remainingTime % 60)}秒`
                  : `${charging.remainingTime.toFixed(1)}秒`
                }
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(charging.chargeAmount / (vehicle.maxBattery - vehicle.battery + charging.chargeAmount)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!isCharging && (
        <div className="space-y-3">
          <ChargingOption
            method="slow"
            name="🐢 慢充"
            description="经济实惠，充电速度较慢"
            price={slowInfo.price}
            time={slowInfo.time}
            disabled={slowInfo.disabled}
            disabledReason={slowInfo.disabledReason}
            isActive={false}
            onClick={() => handleStartCharging('slow')}
          />

          <ChargingOption
            method="fast"
            name="⚡ 快充"
            description="速度更快，价格稍高"
            price={fastInfo.price}
            time={fastInfo.time}
            disabled={fastInfo.disabled}
            disabledReason={fastInfo.disabledReason}
            isActive={false}
            onClick={() => handleStartCharging('fast')}
          />

          <ChargingOption
            method="battery_swap"
            name="🔋 换电"
            description="立即满电，受库存限制"
            price={swapInfo.price}
            time={swapInfo.time}
            disabled={swapInfo.disabled}
            disabledReason={swapInfo.disabledReason}
            isActive={false}
            onClick={() => handleStartCharging('battery_swap')}
          />
        </div>
      )}

      <div className="border-t border-game-neon/30 pt-2 space-y-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <DollarSign size={12} className="text-game-streetLight" />
            <span className="font-retro text-xs text-gray-400">当前余额</span>
          </div>
          <span className="font-retro text-sm text-game-streetLight">
            {formatMoney(player.money)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-game-neon" />
            <span className="font-retro text-xs text-gray-400">当前电量</span>
          </div>
          <span className={`font-retro text-sm ${vehicle.battery < 20 ? 'text-game-danger' : 'text-game-neon'}`}>
            {Math.floor(vehicle.battery)}%
          </span>
        </div>
      </div>
    </div>
  );
}
