import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, selectCurrentOrder } from '../store/gameStore';
import { GRID_SIZE } from '../game/constants';
import { getRainParticleCount, isRaining } from '../game/WeatherSystem';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export default function GameMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rainDropsRef = useRef<RainDrop[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const map = useGameStore((state) => state.map);
  const player = useGameStore((state) => state.player);
  const vehicle = useGameStore((state) => state.vehicle);
  const weather = useGameStore((state) => state.weather);
  const plannedPath = useGameStore(useShallow((state) => state.plannedPath));
  const orders = useGameStore(useShallow((state) => state.orders));
  const currentOrder = useGameStore(useShallow(selectCurrentOrder));
  const isPaused = useGameStore((state) => state.isPaused);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initRainDrops = () => {
      const count = getRainParticleCount(weather.intensity);
      rainDropsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * map.width,
        y: Math.random() * map.height,
        speed: 8 + Math.random() * 12,
        length: 10 + Math.random() * 20,
      }));
    };

    initRainDrops();

    const render = () => {
      timeRef.current += 0.05;
      ctx.clearRect(0, 0, map.width, map.height);

      drawBackground(ctx);
      drawRoads(ctx);
      drawBuildings(ctx);
      drawChargingStations(ctx);
      drawRepairShops(ctx);
      drawOrderLocations(ctx);
      drawPlannedPath(ctx);
      drawVehicle(ctx);
      drawPlayer(ctx);

      if (isRaining(weather.type)) {
        drawRain(ctx);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    const drawBackground = (ctx: CanvasRenderingContext2D) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, map.height);
      if (isRaining(weather.type)) {
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
      } else {
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(1, '#142238');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, map.width, map.height);

      ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= map.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, map.height);
        ctx.stroke();
      }
      for (let y = 0; y <= map.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(map.width, y);
        ctx.stroke();
      }
    };

    const drawRoads = (ctx: CanvasRenderingContext2D) => {
      map.roads.forEach((road) => {
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(road.x, road.y, road.width, road.height);

        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 2;
        ctx.strokeRect(road.x, road.y, road.width, road.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        if (road.type === 'horizontal') {
          for (let x = road.x + 20; x < road.x + road.width; x += 60) {
            ctx.fillRect(x, road.y + road.height / 2 - 2, 30, 4);
          }
        } else if (road.type === 'vertical') {
          for (let y = road.y + 20; y < road.y + road.height; y += 60) {
            ctx.fillRect(road.x + road.width / 2 - 2, y, 4, 30);
          }
        }
      });
    };

    const drawBuildings = (ctx: CanvasRenderingContext2D) => {
      map.buildings.forEach((building) => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x + 2, building.y + 2, building.width - 4, building.height - 4);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(building.x + 2, building.y + 2, building.width - 4, building.height - 4);

        const windowRows = Math.floor(building.height / 15);
        const windowCols = Math.floor(building.width / 15);
        for (let r = 0; r < windowRows; r++) {
          for (let c = 0; c < windowCols; c++) {
            const wx = building.x + 5 + c * 15;
            const wy = building.y + 5 + r * 15;
            const isLit = Math.random() > 0.3;
            ctx.fillStyle = isLit ? '#ffcc4d' : 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(wx, wy, 8, 10);
          }
        }
      });
    };

    const drawChargingStations = (ctx: CanvasRenderingContext2D) => {
      map.chargingStations.forEach((station) => {
        ctx.beginPath();
        ctx.arc(station.x, station.y, GRID_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
        ctx.fill();

        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(station.x - 12, station.y - 12, 24, 24);

        ctx.fillStyle = '#0a1628';
        ctx.font = 'bold 14px VT323';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', station.x, station.y);

        ctx.fillStyle = '#00ffcc';
        ctx.font = '10px VT323';
        ctx.fillText(station.name, station.x, station.y + 25);
      });
    };

    const drawRepairShops = (ctx: CanvasRenderingContext2D) => {
      map.repairShops.forEach((shop) => {
        ctx.beginPath();
        ctx.arc(shop.x, shop.y, GRID_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 204, 77, 0.2)';
        ctx.fill();

        ctx.fillStyle = '#ffcc4d';
        ctx.fillRect(shop.x - 12, shop.y - 12, 24, 24);

        ctx.fillStyle = '#0a1628';
        ctx.font = 'bold 14px VT323';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔧', shop.x, shop.y);

        ctx.fillStyle = '#ffcc4d';
        ctx.font = '10px VT323';
        ctx.fillText(shop.name, shop.x, shop.y + 25);
      });
    };

    const drawOrderLocations = (ctx: CanvasRenderingContext2D) => {
      orders.forEach((order) => {
        if (order.status === 'available') {
          const pulse = Math.sin(timeRef.current * 2) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(order.pickupLocation.x, order.pickupLocation.y, 15 + pulse * 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(46, 213, 115, ${0.2 + pulse * 0.2})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(order.pickupLocation.x, order.pickupLocation.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(46, 213, 115, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#2ed573';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#2ed573';
          ctx.font = 'bold 16px VT323';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📦', order.pickupLocation.x, order.pickupLocation.y);
        }
      });

      if (currentOrder) {
        const pulse = Math.sin(timeRef.current * 3) * 0.5 + 0.5;
        if (currentOrder.status === 'accepted') {
          for (let i = 3; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(currentOrder.pickupLocation.x, currentOrder.pickupLocation.y, 20 + i * 8 + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(46, 213, 115, ${0.3 / i})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(currentOrder.pickupLocation.x, currentOrder.pickupLocation.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(46, 213, 115, ${0.4 + pulse * 0.2})`;
          ctx.fill();
          ctx.strokeStyle = '#2ed573';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#2ed573';
          ctx.font = 'bold 22px VT323';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📍', currentOrder.pickupLocation.x, currentOrder.pickupLocation.y);

          ctx.fillStyle = '#2ed573';
          ctx.font = 'bold 12px VT323';
          ctx.fillText(currentOrder.pickupLocation.name, currentOrder.pickupLocation.x, currentOrder.pickupLocation.y - 32);
        }

        if (currentOrder.status === 'pickedup' || currentOrder.status === 'delivering') {
          for (let i = 3; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(currentOrder.deliveryLocation.x, currentOrder.deliveryLocation.y, 20 + i * 8 + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 71, 87, ${0.3 / i})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(currentOrder.deliveryLocation.x, currentOrder.deliveryLocation.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 71, 87, ${0.4 + pulse * 0.2})`;
          ctx.fill();
          ctx.strokeStyle = '#ff4757';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ff4757';
          ctx.font = 'bold 22px VT323';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏠', currentOrder.deliveryLocation.x, currentOrder.deliveryLocation.y);

          ctx.fillStyle = '#ff4757';
          ctx.font = 'bold 12px VT323';
          ctx.fillText(currentOrder.deliveryLocation.name, currentOrder.deliveryLocation.x, currentOrder.deliveryLocation.y - 32);
        }
      }
    };

    const drawPlannedPath = (ctx: CanvasRenderingContext2D) => {
      if (plannedPath.length < 2) return;

      const dashOffset = (timeRef.current * 20) % 30;

      ctx.beginPath();
      ctx.moveTo(plannedPath[0].x, plannedPath[0].y);
      for (let i = 1; i < plannedPath.length; i++) {
        ctx.lineTo(plannedPath[i].x, plannedPath[i].y);
      }
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(plannedPath[0].x, plannedPath[0].y);
      for (let i = 1; i < plannedPath.length; i++) {
        ctx.lineTo(plannedPath[i].x, plannedPath[i].y);
      }
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = dashOffset;
      ctx.stroke();
      ctx.setLineDash([]);

      plannedPath.forEach((point, index) => {
        const pulse = Math.sin(timeRef.current * 3 + index * 0.5) * 0.5 + 0.5;
        if (index === 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8 + pulse * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
          ctx.fill();
        }
        if (index === plannedPath.length - 1) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12 + pulse * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 204, 77, ${0.4 + pulse * 0.4})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8 + pulse * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 204, 77, ${0.7 + pulse * 0.3})`;
          ctx.fill();
        }
        if (index > 0 && index < plannedPath.length - 1 && index % 2 === 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
          ctx.fill();
        }
      });
    };

    const drawVehicle = (ctx: CanvasRenderingContext2D) => {
      const { x, y } = vehicle.position;
      const dir = vehicle.direction;

      ctx.save();
      ctx.translate(x, y);

      if (dir === 'up') ctx.rotate(-Math.PI / 2);
      else if (dir === 'down') ctx.rotate(Math.PI / 2);
      else if (dir === 'left') ctx.rotate(Math.PI);

      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(-15, -10, 30, 20);

      ctx.strokeStyle = '#00cc99';
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -10, 30, 20);

      ctx.fillStyle = '#ffcc4d';
      ctx.fillRect(8, -8, 6, 6);
      ctx.fillRect(8, 2, 6, 6);

      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-14, -8, 4, 6);
      ctx.fillRect(-14, 2, 4, 6);

      ctx.fillStyle = '#142238';
      ctx.fillRect(-5, -7, 12, 14);

      ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
      ctx.beginPath();
      ctx.ellipse(18, 0, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (vehicle.battery < 20) {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D) => {
      const { x, y } = player.position;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcc4d';
      ctx.fill();
      ctx.strokeStyle = '#ffcc4d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#0a1628';
      ctx.fill();
    };

    const drawRain = (ctx: CanvasRenderingContext2D) => {
      const count = getRainParticleCount(weather.intensity);
      while (rainDropsRef.current.length < count) {
        rainDropsRef.current.push({
          x: Math.random() * map.width,
          y: -20,
          speed: 8 + Math.random() * 12,
          length: 10 + Math.random() * 20,
        });
      }

      rainDropsRef.current.forEach((drop, index) => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.strokeStyle = `rgba(74, 111, 165, ${0.3 + weather.intensity / 200})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 1;

        if (drop.y > map.height) {
          drop.y = -20;
          drop.x = Math.random() * map.width;
        }
      });

      while (rainDropsRef.current.length > count) {
        rainDropsRef.current.pop();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [map, player, vehicle, weather, plannedPath, orders, currentOrder]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={map.width}
        height={map.height}
        className="border-4 border-game-neon/50 rounded shadow-neon no-select scanline"
      />
      {isPaused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-pixel text-2xl text-game-neon glow-text mb-4">游戏暂停</h2>
            <p className="font-retro text-lg text-gray-300">按 ESC 键继续</p>
          </div>
        </div>
      )}
    </div>
  );
}
