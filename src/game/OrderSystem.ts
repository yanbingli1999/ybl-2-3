import { Order, MapData, Position } from './types';
import {
  MIN_ORDER_REWARD,
  MAX_ORDER_REWARD,
  MIN_ORDER_DISTANCE,
  MAX_ORDER_DISTANCE,
  LOCATION_NAMES,
  GRID_SIZE,
} from './constants';
import { getNearestRoadPosition } from './mapData';

export function generateOrder(
  map: MapData,
  playerPos: Position,
  gameTime: number,
  existingOrders: Order[]
): Order | null {
  const availablePickupPoints = map.chargingStations.concat(map.repairShops);
  
  if (availablePickupPoints.length < 2) return null;

  const usedNames = new Set(existingOrders.flatMap((o) => [
    o.pickupLocation.name,
    o.deliveryLocation.name,
  ]));

  const availableNames = LOCATION_NAMES.filter((n) => !usedNames.has(n));
  if (availableNames.length < 2) return null;

  const getRandomRoadPosition = (): Position & { name: string } => {
    const roads = map.roads.filter((r) => r.type === 'intersection');
    const road = roads[Math.floor(Math.random() * roads.length)];
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    return {
      x: road.x + GRID_SIZE / 2,
      y: road.y + GRID_SIZE / 2,
      name,
    };
  };

  const pickupLocation = getRandomRoadPosition();
  let deliveryLocation = getRandomRoadPosition();

  const distance = Math.floor(
    Math.hypot(deliveryLocation.x - pickupLocation.x, deliveryLocation.y - pickupLocation.y) / GRID_SIZE
  );

  const clampedDistance = Math.max(MIN_ORDER_DISTANCE, Math.min(MAX_ORDER_DISTANCE, distance));
  const baseReward = Math.floor(MIN_ORDER_REWARD + (clampedDistance / MAX_ORDER_DISTANCE) * (MAX_ORDER_REWARD - MIN_ORDER_REWARD));
  const reward = baseReward + Math.floor(Math.random() * 20 - 10);

  const estimatedTime = clampedDistance * 1.5;
  const deadline = estimatedTime + 30;
  const customerUrgency = Math.floor(Math.random() * 5) + 1;

  return {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pickupLocation,
    deliveryLocation,
    reward: Math.max(MIN_ORDER_REWARD, reward),
    deadline,
    maxDeadline: deadline,
    status: 'available',
    customerUrgency,
    distance: clampedDistance,
    createdAt: gameTime,
  };
}

export function canAcceptOrder(order: Order, player: { currentOrderId: string | null }): boolean {
  return order.status === 'available' && player.currentOrderId === null;
}

export function isAtLocation(
  playerPos: Position,
  targetPos: Position,
  threshold: number = GRID_SIZE
): boolean {
  const dist = Math.hypot(playerPos.x - targetPos.x, playerPos.y - targetPos.y);
  return dist <= threshold;
}

export function updateOrderDeadlines(orders: Order[], deltaTime: number): Order[] {
  return orders.map((order) => {
    if (order.status === 'accepted' || order.status === 'pickedup' || order.status === 'delivering') {
      const newDeadline = order.deadline - deltaTime;
      if (newDeadline <= 0) {
        return { ...order, deadline: 0, status: 'failed' as const };
      }
      return { ...order, deadline: newDeadline };
    }
    return order;
  });
}

export function getOrderStatusText(status: Order['status']): string {
  const statusMap: Record<Order['status'], string> = {
    available: '可接单',
    accepted: '已接单',
    pickedup: '已取货',
    delivering: '配送中',
    completed: '已完成',
    failed: '已失败',
  };
  return statusMap[status];
}

export function getUrgencyText(urgency: number): string {
  const levels = ['', '不急', '正常', '稍急', '紧急', '非常急'];
  return levels[urgency] || '正常';
}
