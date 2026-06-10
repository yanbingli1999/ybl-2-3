import { useGameStore } from '../store/gameStore';
import { formatMoney, getRatingStars } from '../game/EconomySystem';
import { X, Star, TrendingUp, TrendingDown, Award } from 'lucide-react';

export default function SettlementModal() {
  const dispatch = useGameStore((state) => state.dispatch);
  const showSettlement = useGameStore((state) => state.showSettlement);
  const lastSettlement = useGameStore((state) => state.lastSettlement);

  if (!showSettlement || !lastSettlement) return null;

  const details = lastSettlement.details.split(' | ');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="game-card p-6 w-96 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-pixel text-lg text-game-neon glow-text">订单结算</h3>
          <button
            onClick={() => dispatch({ type: 'CLOSE_SETTLEMENT' })}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={32}
                className={star <= lastSettlement.rating ? 'text-game-streetLight fill-game-streetLight' : 'text-gray-600'}
              />
            ))}
          </div>
          <p className="font-retro text-2xl text-game-streetLight">
            {getRatingStars(lastSettlement.rating)}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {details.map((detail, index) => {
            const isPositive = detail.includes('+') || detail.includes('奖励') || detail.includes('基础');
            const isNegative = detail.includes('-') || detail.includes('扣款') || detail.includes('迟到');

            return (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded ${
                  isPositive ? 'bg-game-success/10' : isNegative ? 'bg-game-danger/10' : 'bg-game-night/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPositive && <TrendingUp size={16} className="text-game-success" />}
                  {isNegative && <TrendingDown size={16} className="text-game-danger" />}
                  <span className="font-retro text-sm text-gray-300">
                    {detail.split(':')[0]}
                  </span>
                </div>
                <span className={`font-retro text-lg ${
                  isPositive ? 'text-game-success' : isNegative ? 'text-game-danger' : 'text-gray-300'
                }`}>
                  {detail.split(':')[1]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-game-neon/30 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-pixel text-sm text-gray-400">实际收入</span>
            <span className="font-pixel text-2xl text-game-streetLight glow-text">
              {formatMoney(lastSettlement.finalAmount)}
            </span>
          </div>

          <button
            onClick={() => dispatch({ type: 'CLOSE_SETTLEMENT' })}
            className="pixel-btn w-full flex items-center justify-center gap-2"
          >
            <Award size={16} />
            继续接单
          </button>
        </div>
      </div>
    </div>
  );
}
