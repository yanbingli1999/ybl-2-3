import { VehicleState, Position, WeatherState } from './types';
import {
  BASE_SPEED,
  BATTERY_DRAIN_RATE,
  DURABILITY_DRAIN_RATE,
  STAMINA_DRAIN_RATE,
  CHARGE_RATE,
  REPAIR_RATE,
  REST_RATE,
  CHARGE_COST,
  REPAIR_COST,
  GRID_SIZE,
  PLAYER_START,
} from './constants';
import { isOnRoad } from './mapData';

function getRoadTypesAt(
  x: number,
  y: number,
  roads: Array<{ id?: string; type?: string; x: number; y: number; width: number; height: number }>
): { hasHorizontal: boolean; hasVertical: boolean; centerX: number; centerY: number } {
  let hasHorizontal = false;
  let hasVertical = false;
  let centerX = x;
  let centerY = y;

  for (const road of roads) {
    if (x >= road.x && x < road.x + road.width && y >= road.y && y < road.y + road.height) {
      if (road.type === 'horizontal' || road.type === 'intersection') {
        hasHorizontal = true;
        centerY = road.y + road.height / 2;
      }
      if (road.type === 'vertical' || road.type === 'intersection') {
        hasVertical = true;
        centerX = road.x + road.width / 2;
      }
    }
  }

  return { hasHorizontal, hasVertical, centerX, centerY };
}

export function createInitialVehicle(): VehicleState {
  return {
    id: 'vehicle-1',
    battery: 100,
    maxBattery: 100,
    durability: 100,
    maxDurability: 100,
    speed: 0,
    baseSpeed: BASE_SPEED,
    position: { ...PLAYER_START },
    direction: 'down',
  };
}

export function moveVehicle(
  vehicle: VehicleState,
  direction: 'up' | 'down' | 'left' | 'right',
  weather: WeatherState,
  deltaTime: number,
  roads: Array<{ id?: string; type?: string; x: number; y: number; width: number; height: number }>,
  stamina: number
): { vehicle: VehicleState; moved: boolean; staminaDrain: number } {
  if (vehicle.battery <= 0 || stamina <= 0) {
    return { vehicle: { ...vehicle, speed: 0 }, moved: false, staminaDrain: 0 };
  }

  const currentRoads = getRoadTypesAt(vehicle.position.x, vehicle.position.y, roads);

  const isHorizontal = direction === 'left' || direction === 'right';
  const isVertical = direction === 'up' || direction === 'down';

  const isAtIntersection = currentRoads.hasHorizontal && currentRoads.hasVertical;
  const canMoveHorizontal = currentRoads.hasHorizontal || isAtIntersection;
  const canMoveVertical = currentRoads.hasVertical || isAtIntersection;

  if ((isHorizontal && !canMoveHorizontal) || (isVertical && !canMoveVertical)) {
    return { vehicle: { ...vehicle, speed: 0, direction }, moved: false, staminaDrain: 0 };
  }

  const durabilityModifier = vehicle.durability / 100;
  const staminaModifier = stamina >= 30 ? 1.0 : stamina / 30;
  const effectiveSpeed = vehicle.baseSpeed * weather.speedModifier * durabilityModifier * staminaModifier;

  let newX = vehicle.position.x;
  let newY = vehicle.position.y;
  const moveAmount = effectiveSpeed * deltaTime;

  switch (direction) {
    case 'up':
      newY -= moveAmount;
      break;
    case 'down':
      newY += moveAmount;
      break;
    case 'left':
      newX -= moveAmount;
      break;
    case 'right':
      newX += moveAmount;
      break;
  }

  newX = Math.max(GRID_SIZE / 2, Math.min(newX, 30 * GRID_SIZE - GRID_SIZE / 2));
  newY = Math.max(GRID_SIZE / 2, Math.min(newY, 17 * GRID_SIZE - GRID_SIZE / 2));

  if (!isOnRoad(newX, newY, roads)) {
    return { vehicle: { ...vehicle, speed: 0, direction }, moved: false, staminaDrain: 0 };
  }

  const newRoads = getRoadTypesAt(newX, newY, roads);
  const snapThreshold = 2;
  let snapX = newX;
  let snapY = newY;

  if (newRoads.hasHorizontal && !newRoads.hasVertical) {
    snapY = newRoads.centerY;
  } else if (newRoads.hasVertical && !newRoads.hasHorizontal) {
    snapX = newRoads.centerX;
  }

  const batteryDrain = BATTERY_DRAIN_RATE * deltaTime * (1 + weather.intensity / 100);
  const durabilityDrain = DURABILITY_DRAIN_RATE * deltaTime;
  const staminaDrain = STAMINA_DRAIN_RATE * deltaTime * (1 + weather.intensity / 200);

  return {
    vehicle: {
      ...vehicle,
      position: { x: snapX, y: snapY },
      speed: effectiveSpeed,
      direction,
      battery: Math.max(0, vehicle.battery - batteryDrain),
      durability: Math.max(0, vehicle.durability - durabilityDrain),
    },
    moved: true,
    staminaDrain,
  };
}

export function chargeVehicle(
  vehicle: VehicleState,
  deltaTime: number
): { vehicle: VehicleState; cost: number } {
  const chargeAmount = CHARGE_RATE * deltaTime;
  const actualCharge = Math.min(chargeAmount, vehicle.maxBattery - vehicle.battery);
  const cost = actualCharge * CHARGE_COST;

  return {
    vehicle: {
      ...vehicle,
      battery: Math.min(vehicle.maxBattery, vehicle.battery + actualCharge),
      speed: 0,
    },
    cost,
  };
}

export function repairVehicle(
  vehicle: VehicleState,
  deltaTime: number
): { vehicle: VehicleState; cost: number } {
  const repairAmount = REPAIR_RATE * deltaTime;
  const actualRepair = Math.min(repairAmount, vehicle.maxDurability - vehicle.durability);
  const cost = actualRepair * REPAIR_COST;

  return {
    vehicle: {
      ...vehicle,
      durability: Math.min(vehicle.maxDurability, vehicle.durability + actualRepair),
      speed: 0,
    },
    cost,
  };
}

export function restPlayer(
  currentStamina: number,
  maxStamina: number,
  deltaTime: number
): { stamina: number; cost: number } {
  const restAmount = REST_RATE * deltaTime;
  const actualRest = Math.min(restAmount, maxStamina - currentStamina);
  const cost = actualRest * 0.3;

  return {
    stamina: Math.min(maxStamina, currentStamina + actualRest),
    cost,
  };
}

export function isNearChargingStation(
  position: Position,
  stations: Array<{ x: number; y: number }>
): boolean {
  return stations.some(
    (s) => Math.hypot(position.x - s.x, position.y - s.y) < GRID_SIZE * 1.5
  );
}

export function isNearRepairShop(
  position: Position,
  shops: Array<{ x: number; y: number }>
): boolean {
  return shops.some(
    (s) => Math.hypot(position.x - s.x, position.y - s.y) < GRID_SIZE * 1.5
  );
}

export function getStaminaDrain(weather: WeatherState, deltaTime: number): number {
  return STAMINA_DRAIN_RATE * deltaTime * (1 + weather.intensity / 200);
}
