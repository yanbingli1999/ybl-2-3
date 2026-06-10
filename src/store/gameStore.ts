import { create } from 'zustand';
import type { GameState, GameAction, GameSave, Order } from '../game/types';
import { generateMapData, findPath } from '../game/mapData';
import { generateOrder, updateOrderDeadlines, isAtLocation, canAcceptOrder } from '../game/OrderSystem';
import { updateWeather, createInitialWeather } from '../game/WeatherSystem';
import {
  moveVehicle,
  createInitialVehicle,
  chargeVehicle,
  repairVehicle,
  restPlayer,
  isNearChargingStation,
  isNearRepairShop,
  getNearestChargingStation,
  calculateEstimatedChargeTime,
} from '../game/VehicleSystem';
import type { ChargingMethod, ChargingStation } from '../game/types';
import { calculateSettlement } from '../game/EconomySystem';
import { saveGame, loadGame } from '../game/Storage';
import {
  PLAYER_START,
  MAX_AVAILABLE_ORDERS,
  ORDER_GENERATION_INTERVAL,
  GRID_SIZE,
} from '../game/constants';

export function createInitialState(): GameState {
  const map = generateMapData();
  return {
    player: {
      id: 'player-1',
      name: '送货员',
      money: 100,
      stamina: 100,
      maxStamina: 100,
      position: { ...PLAYER_START },
      currentOrderId: null,
      completedOrders: 0,
      totalRating: 0,
    },
    vehicle: createInitialVehicle(),
    weather: createInitialWeather(),
    orders: [],
    incomeRecords: [],
    map,
    gameTime: 0,
    isPaused: false,
    isGameOver: false,
    showSettlement: false,
    lastSettlement: null,
    plannedPath: [],
    charging: {
      isCharging: false,
      method: null,
      stationId: null,
      chargeAmount: 0,
      totalCost: 0,
      estimatedTime: 0,
      remainingTime: 0,
      queueWaitRemaining: 0,
    },
    isRepairing: false,
    isResting: false,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE': {
      if (state.isPaused || state.isGameOver || state.charging.isCharging || state.isRepairing || state.isResting) {
        return state;
      }

      const { vehicle, moved, staminaDrain } = moveVehicle(
        state.vehicle,
        action.direction,
        state.weather,
        1 / 60,
        state.map.roads,
        state.player.stamina
      );

      if (!moved) return state;

      const newPlayer = {
        ...state.player,
        position: vehicle.position,
        stamina: Math.max(0, state.player.stamina - staminaDrain),
      };
      let newPlannedPath = state.plannedPath;

      if (newPlannedPath.length > 0) {
        const nextPoint = newPlannedPath[0];
        if (isAtLocation(vehicle.position, nextPoint, 20)) {
          newPlannedPath = newPlannedPath.slice(1);
        }
      }

      return {
        ...state,
        player: newPlayer,
        vehicle,
        plannedPath: newPlannedPath,
      };
    }

    case 'ACCEPT_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || !canAcceptOrder(order, state.player)) return state;

      const path = findPath(
        state.vehicle.position.x,
        state.vehicle.position.y,
        order.pickupLocation.x,
        order.pickupLocation.y,
        state.map.roads,
        state.map.gridSize
      );

      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: 'accepted' as const } : o
        ),
        player: { ...state.player, currentOrderId: action.orderId },
        plannedPath: path,
      };
    }

    case 'PICKUP_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || order.status !== 'accepted') return state;

      if (!isAtLocation(state.player.position, order.pickupLocation, 50)) return state;

      const path = findPath(
        state.vehicle.position.x,
        state.vehicle.position.y,
        order.deliveryLocation.x,
        order.deliveryLocation.y,
        state.map.roads,
        state.map.gridSize
      );

      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: 'pickedup' as const } : o
        ),
        plannedPath: path,
      };
    }

    case 'DELIVER_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || (order.status !== 'pickedup' && order.status !== 'delivering')) return state;

      if (!isAtLocation(state.player.position, order.deliveryLocation, 50)) return state;

      const settlement = calculateSettlement(order, state.player.stamina);

      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: 'completed' as const } : o
        ),
        player: {
          ...state.player,
          money: state.player.money + settlement.record.finalAmount,
          currentOrderId: null,
          completedOrders: state.player.completedOrders + 1,
          totalRating: state.player.totalRating + settlement.rating,
        },
        incomeRecords: [...state.incomeRecords, settlement.record],
        showSettlement: true,
        lastSettlement: settlement.record,
        plannedPath: [],
      };
    }

    case 'START_CHARGING': {
      const station = state.map.chargingStations.find((s) => s.id === action.stationId);
      if (!station) return state;

      const dist = Math.hypot(state.player.position.x - station.x, state.player.position.y - station.y);
      if (dist > GRID_SIZE * 1.5) return state;

      if (action.method === 'battery_swap' && station.remainingBatteries <= 0) return state;

      const neededBattery = state.vehicle.maxBattery - state.vehicle.battery;
      if (neededBattery <= 0) return state;

      let minRequiredMoney = 0;
      switch (action.method) {
        case 'slow':
          minRequiredMoney = neededBattery * station.slowChargePrice;
          break;
        case 'fast':
          minRequiredMoney = neededBattery * station.fastChargePrice;
          break;
        case 'battery_swap':
          minRequiredMoney = station.batterySwapPrice;
          break;
      }
      if (state.player.money < minRequiredMoney) return state;

      const queueWaitTime = station.queueCount > 0 ? (station.queueCount) * 5 : 0;
      const estimatedChargeTime = calculateEstimatedChargeTime(
        action.method,
        state.vehicle.battery,
        state.vehicle.maxBattery
      );
      const estimatedTime = queueWaitTime + estimatedChargeTime;

      const newChargingStations = state.map.chargingStations.map((s) => {
        if (s.id === action.stationId) {
          if (action.method === 'battery_swap') {
            return { ...s, remainingBatteries: s.remainingBatteries - 1, queueCount: s.queueCount + 1 };
          }
          return { ...s, queueCount: s.queueCount + 1 };
        }
        return s;
      });

      return {
        ...state,
        map: { ...state.map, chargingStations: newChargingStations },
        charging: {
          isCharging: true,
          method: action.method,
          stationId: action.stationId,
          chargeAmount: 0,
          totalCost: 0,
          estimatedTime,
          remainingTime: estimatedTime,
          queueWaitRemaining: queueWaitTime,
        },
        isRepairing: false,
        isResting: false,
      };
    }

    case 'STOP_CHARGING': {
      const stationId = state.charging.stationId;
      const newChargingStations = state.map.chargingStations.map((s) => {
        if (s.id === stationId) {
          return { ...s, queueCount: Math.max(0, s.queueCount - 1) };
        }
        return s;
      });

      return {
        ...state,
        map: { ...state.map, chargingStations: newChargingStations },
        charging: {
          isCharging: false,
          method: null,
          stationId: null,
          chargeAmount: 0,
          totalCost: 0,
          estimatedTime: 0,
          remainingTime: 0,
          queueWaitRemaining: 0,
        },
      };
    }

    case 'START_REPAIRING': {
      if (!isNearRepairShop(state.player.position, state.map.repairShops)) return state;
      let newChargingStations = state.map.chargingStations;
      if (state.charging.isCharging && state.charging.stationId) {
        newChargingStations = state.map.chargingStations.map((s) => {
          if (s.id === state.charging.stationId) {
            return { ...s, queueCount: Math.max(0, s.queueCount - 1) };
          }
          return s;
        });
      }
      return {
        ...state,
        map: { ...state.map, chargingStations: newChargingStations },
        isRepairing: true,
        charging: { ...state.charging, isCharging: false, queueWaitRemaining: 0 },
        isResting: false
      };
    }

    case 'STOP_REPAIRING': {
      return { ...state, isRepairing: false };
    }

    case 'START_RESTING': {
      let newChargingStations = state.map.chargingStations;
      if (state.charging.isCharging && state.charging.stationId) {
        newChargingStations = state.map.chargingStations.map((s) => {
          if (s.id === state.charging.stationId) {
            return { ...s, queueCount: Math.max(0, s.queueCount - 1) };
          }
          return s;
        });
      }
      return {
        ...state,
        map: { ...state.map, chargingStations: newChargingStations },
        isResting: true,
        charging: { ...state.charging, isCharging: false, queueWaitRemaining: 0 },
        isRepairing: false
      };
    }

    case 'STOP_RESTING': {
      return { ...state, isResting: false };
    }

    case 'GENERATE_ORDERS': {
      const availableOrders = state.orders.filter((o) => o.status === 'available');
      if (availableOrders.length >= MAX_AVAILABLE_ORDERS) return state;

      const newOrder = generateOrder(
        state.map,
        state.player.position,
        state.gameTime,
        state.orders
      );

      if (!newOrder) return state;

      return { ...state, orders: [...state.orders, newOrder] };
    }

    case 'TICK': {
      if (state.isPaused || state.isGameOver) return state;

      let newState = {
        ...state,
        gameTime: state.gameTime + action.deltaTime,
      };

      newState.orders = updateOrderDeadlines(newState.orders, action.deltaTime);
      newState.weather = updateWeather(newState.weather, action.deltaTime);

      if (newState.charging.isCharging && newState.charging.method && newState.charging.stationId) {
        const station = newState.map.chargingStations.find((s) => s.id === newState.charging.stationId);
        if (station) {
          if (newState.charging.queueWaitRemaining > 0) {
            newState.charging = {
              ...newState.charging,
              queueWaitRemaining: Math.max(0, newState.charging.queueWaitRemaining - action.deltaTime),
              remainingTime: Math.max(0, newState.charging.remainingTime - action.deltaTime),
            };
          } else {
            const { vehicle, cost, charged, completed } = chargeVehicle(
              newState.vehicle,
              newState.charging.method,
              action.deltaTime,
              station
            );

            if (newState.player.money < cost && !completed) {
              newState.charging = {
                ...newState.charging,
                isCharging: false,
                queueWaitRemaining: 0,
              };
              const newChargingStations = newState.map.chargingStations.map((s) => {
                if (s.id === newState.charging.stationId) {
                  return { ...s, queueCount: Math.max(0, s.queueCount - 1) };
                }
                return s;
              });
              newState.map = { ...newState.map, chargingStations: newChargingStations };
            } else {
              newState.vehicle = vehicle;
              newState.player = {
                ...newState.player,
                money: Math.max(0, newState.player.money - cost),
              };
              newState.charging = {
                ...newState.charging,
                chargeAmount: newState.charging.chargeAmount + charged,
                totalCost: newState.charging.totalCost + cost,
                remainingTime: Math.max(0, newState.charging.remainingTime - action.deltaTime),
              };

              if (completed) {
                const newChargingStations = newState.map.chargingStations.map((s) => {
                  if (s.id === newState.charging.stationId) {
                    return { ...s, queueCount: Math.max(0, s.queueCount - 1) };
                  }
                  return s;
                });
                newState.map = { ...newState.map, chargingStations: newChargingStations };
                newState.charging = {
                  ...newState.charging,
                  isCharging: false,
                  remainingTime: 0,
                  queueWaitRemaining: 0,
                };
              }
            }
          }
        }
      }

      if (newState.isRepairing) {
        const { vehicle, cost } = repairVehicle(newState.vehicle, action.deltaTime);
        newState.vehicle = vehicle;
        newState.player = {
          ...newState.player,
          money: Math.max(0, newState.player.money - cost),
        };
        if (vehicle.durability >= vehicle.maxDurability) {
          newState.isRepairing = false;
        }
      }

      if (newState.isResting) {
        const { stamina, cost } = restPlayer(
          newState.player.stamina,
          newState.player.maxStamina,
          action.deltaTime
        );
        newState.player = {
          ...newState.player,
          stamina,
          money: Math.max(0, newState.player.money - cost),
        };
        if (stamina >= newState.player.maxStamina) {
          newState.isResting = false;
        }
      }

      const currentOrder = newState.orders.find((o) => o.id === newState.player.currentOrderId);
      if (currentOrder && currentOrder.status === 'accepted') {
        if (isAtLocation(newState.player.position, currentOrder.pickupLocation, 50)) {
          newState = gameReducer(newState, { type: 'PICKUP_ORDER', orderId: currentOrder.id });
        }
      }
      if (currentOrder && (currentOrder.status === 'pickedup' || currentOrder.status === 'delivering')) {
        if (isAtLocation(newState.player.position, currentOrder.deliveryLocation, 50)) {
          newState = gameReducer(newState, { type: 'DELIVER_ORDER', orderId: currentOrder.id });
        }
      }

      const failedOrders = newState.orders.filter((o) => o.status === 'failed' && o.id === newState.player.currentOrderId);
      if (failedOrders.length > 0) {
        newState.player = { ...newState.player, currentOrderId: null };
        newState.plannedPath = [];
      }

      if (newState.player.money < 0 && newState.player.stamina < 10 && newState.vehicle.battery < 10) {
        newState.isGameOver = true;
      }

      return newState;
    }

    case 'TOGGLE_PAUSE': {
      return { ...state, isPaused: !state.isPaused };
    }

    case 'CLOSE_SETTLEMENT': {
      return { ...state, showSettlement: false };
    }

    case 'PLAN_PATH': {
      return { ...state, plannedPath: action.path };
    }

    case 'CLEAR_PATH': {
      return { ...state, plannedPath: [] };
    }

    case 'NEW_GAME': {
      const newState = createInitialState();
      const initialOrders: typeof newState.orders = [];
      for (let i = 0; i < 3; i++) {
        const order = generateOrder(
          newState.map,
          newState.player.position,
          0,
          initialOrders
        );
        if (order) initialOrders.push(order);
      }
      return { ...newState, orders: initialOrders };
    }

    case 'LOAD_GAME': {
      const save = action.save;
      const initialCharging = createInitialState().charging;
      return {
        ...createInitialState(),
        player: save.player,
        vehicle: save.vehicle,
        weather: save.weather,
        orders: save.orders,
        incomeRecords: save.incomeRecords,
        gameTime: save.gameTime,
        map: save.map,
        charging: (save as any).charging || initialCharging,
      };
    }

    case 'GAME_OVER': {
      return { ...state, isGameOver: true };
    }

    case 'UPDATE_CHARGING_STATION': {
      const newChargingStations = state.map.chargingStations.map((s) => {
        if (s.id === action.stationId) {
          return { ...s, ...action.updates };
        }
        return s;
      });
      return { ...state, map: { ...state.map, chargingStations: newChargingStations } };
    }

    default:
      return state;
  }
}

interface GameStore extends GameState {
  dispatch: (action: GameAction) => void;
  save: () => boolean;
  load: () => boolean;
  orderGenerationTimer: number;
}

export const useGameStore = create<GameStore>((set, get) => {
  const initialState = createInitialState();
  let orderGenTimer = 0;

  const initialOrders: typeof initialState.orders = [];
  for (let i = 0; i < 3; i++) {
    const order = generateOrder(
      initialState.map,
      initialState.player.position,
      0,
      initialOrders
    );
    if (order) initialOrders.push(order);
  }

  return {
    ...initialState,
    orders: initialOrders,
    orderGenerationTimer: 0,

    dispatch: (action) => {
      set((state) => gameReducer(state, action));
    },

    save: () => {
      const state = get();
      return saveGame(
        state.player,
        state.vehicle,
        state.weather,
        state.orders,
        state.incomeRecords,
        state.gameTime,
        state.map,
        state.charging
      );
    },

    load: () => {
      const save = loadGame();
      if (save) {
        set((state) => gameReducer(state, { type: 'LOAD_GAME', save }));
        return true;
      }
      return false;
    },
  };
});

export const selectCurrentOrder = (state: GameState): Order | null => {
  if (!state.player.currentOrderId) return null;
  return state.orders.find((o) => o.id === state.player.currentOrderId) || null;
};

export const selectAvailableOrders = (state: GameState): Order[] => {
  return state.orders.filter((o) => o.status === 'available');
};

export const selectIsNearCharging = (state: GameState): boolean => {
  return isNearChargingStation(state.player.position, state.map.chargingStations);
};

export const selectIsNearRepair = (state: GameState): boolean => {
  return isNearRepairShop(state.player.position, state.map.repairShops);
};

export const selectNearestChargingStation = (state: GameState): ChargingStation | null => {
  return getNearestChargingStation(state.player.position, state.map.chargingStations);
};

export const selectIsCharging = (state: GameState): boolean => {
  return state.charging.isCharging;
};

export const selectChargingState = (state: GameState) => {
  return state.charging;
};

export function useCurrentOrder(): Order | null {
  return useGameStore(selectCurrentOrder);
}

export function useAvailableOrders(): Order[] {
  return useGameStore(selectAvailableOrders);
}

export function useIsNearCharging(): boolean {
  return useGameStore(selectIsNearCharging);
}

export function useIsNearRepair(): boolean {
  return useGameStore(selectIsNearRepair);
}

export function useNearestChargingStation(): ChargingStation | null {
  return useGameStore(selectNearestChargingStation);
}

export function useIsCharging(): boolean {
  return useGameStore(selectIsCharging);
}

export function useChargingState() {
  return useGameStore(selectChargingState);
}
