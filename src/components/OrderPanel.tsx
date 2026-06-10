import { useShallow } from 'zustand/react/shallow';
import { useGameStore, selectCurrentOrder, selectAvailableOrders } from '../store/gameStore';
import { getOrderStatusText, getUrgencyText } from '../game/OrderSystem';
import { formatMoney } from '../game/EconomySystem';
import { Package, MapPin, Clock, AlertTriangle, Check } from 'lucide-react';

export default function OrderPanel() {
  const dispatch = useGameStore((state) => state.dispatch);
  const player = useGameStore((state) => state.player);
  const currentOrder = useGameStore(useShallow(selectCurrentOrder));
  const availableOrders = useGameStore(useShallow(selectAvailableOrders));

  const formatDeadline = (seconds: number) => {
    if (seconds <= 0) return '已超时';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeadlineColor = (deadline: number, maxDeadline: number) => {
    const ratio = deadline / maxDeadline;
    if (ratio < 0.3) return 'text-game-danger animate-pulse';
    if (ratio < 0.6) return 'text-game-streetLight';
    return 'text-game-success';
  };

  const handleAcceptOrder = (orderId: string) => {
    if (player.currentOrderId) return;
    dispatch({ type: 'ACCEPT_ORDER', orderId });
  };

  return (
    <div className="game-card p-4 w-80 space-y-4 max-h-[600px] flex flex-col">
      <h3 className="font-pixel text-sm text-game-neon glow-text">订单中心</h3>

      {currentOrder && (
        <div className="bg-game-neon/10 border-2 border-game-neon rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-xs text-game-neon">当前订单</span>
            <span className={`font-retro text-xs px-2 py-0.5 rounded ${
              currentOrder.status === 'accepted' ? 'bg-blue-500/30 text-blue-400' :
              'bg-orange-500/30 text-orange-400'
            }`}>
              {getOrderStatusText(currentOrder.status)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-game-success mt-1 flex-shrink-0" />
              <div>
                <div className="font-retro text-xs text-gray-400">取货点</div>
                <div className="font-retro text-sm text-game-success">{currentOrder.pickupLocation.name}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-game-danger mt-1 flex-shrink-0" />
              <div>
                <div className="font-retro text-xs text-gray-400">送货点</div>
                <div className="font-retro text-sm text-game-danger">{currentOrder.deliveryLocation.name}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock size={14} className={getDeadlineColor(currentOrder.deadline, currentOrder.maxDeadline)} />
                <span className={`font-retro text-sm ${getDeadlineColor(currentOrder.deadline, currentOrder.maxDeadline)}`}>
                  {formatDeadline(currentOrder.deadline)}
                </span>
              </div>
              <div className="text-right">
                <div className="font-retro text-lg text-game-streetLight">{formatMoney(currentOrder.reward)}</div>
                <div className="font-retro text-xs text-gray-500">距离: {currentOrder.distance}格</div>
              </div>
            </div>

            {currentOrder.customerUrgency >= 4 && (
              <div className="flex items-center gap-1 bg-game-danger/20 rounded px-2 py-1">
                <AlertTriangle size={12} className="text-game-danger" />
                <span className="font-retro text-xs text-game-danger">
                  {getUrgencyText(currentOrder.customerUrgency)}！客户在催单
                </span>
              </div>
            )}

            <div className="text-xs font-retro text-gray-400 mt-2 p-2 bg-game-night/70 rounded border border-game-neon/30">
              {currentOrder.status === 'accepted' && '🎯 第一步：沿青色虚线路径开到绿色标记的取货点'}
              {currentOrder.status === 'pickedup' && '🎯 第二步：沿青色虚线路径开到红色标记的送货点'}
              {currentOrder.status === 'delivering' && '🎯 正在配送中，请沿路径行驶至送货点'}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        <h4 className="font-pixel text-xs text-gray-400 sticky top-0 bg-game-nightLight py-1">
          可用订单 ({availableOrders.length})
        </h4>

        {availableOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="font-retro text-sm text-gray-500">暂无可用订单</p>
            <p className="font-retro text-xs text-gray-600">请稍候，新订单即将到来...</p>
          </div>
        ) : (
          availableOrders.map((order) => (
            <div
              key={order.id}
              className="bg-game-night/50 border border-gray-700 rounded p-3 hover:border-game-neon/50 transition-all space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-retro text-xs text-gray-400">
                    {order.pickupLocation.name} → {order.deliveryLocation.name}
                  </div>
                  <div className="font-retro text-lg text-game-streetLight">{formatMoney(order.reward)}</div>
                </div>
                <span className={`font-retro text-xs ${getDeadlineColor(order.deadline, order.maxDeadline)}`}>
                  ⏱ {formatDeadline(order.deadline)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-retro text-gray-400">
                  <span>距离: {order.distance}格</span>
                  <span className={order.customerUrgency >= 4 ? 'text-game-danger' : ''}>
                    紧急度: {'⭐'.repeat(order.customerUrgency)}
                  </span>
                </div>
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={!!player.currentOrderId}
                  className={`pixel-btn pixel-btn-success text-xs ${
                    player.currentOrderId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Check size={12} className="inline mr-1" />
                  接单
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!player.currentOrderId && availableOrders.length > 0 && (
        <div className="text-xs font-retro text-gray-500 text-center border-t border-gray-700 pt-2">
          💡 点击"接单"按钮接受订单
        </div>
      )}
    </div>
  );
}
