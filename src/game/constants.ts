export const GRID_SIZE = 40;
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 700;
export const COLS = Math.floor(MAP_WIDTH / GRID_SIZE);
export const ROWS = Math.floor(MAP_HEIGHT / GRID_SIZE);

export const PLAYER_START = { x: GRID_SIZE * 8 + GRID_SIZE / 2, y: GRID_SIZE * 6 + GRID_SIZE / 2 };

export const BASE_SPEED = 140;
export const BATTERY_DRAIN_RATE = 1.0;
export const DURABILITY_DRAIN_RATE = 0.25;
export const STAMINA_DRAIN_RATE = 0.6;
export const CHARGE_RATE = 15;
export const REPAIR_RATE = 10;
export const REST_RATE = 20;

export const WEATHER_SPEED_MODIFIERS: Record<string, number> = {
  sunny: 1.0,
  cloudy: 0.95,
  rainy: 0.75,
  heavy_rain: 0.55,
  storm: 0.35,
};

export const WEATHER_NAMES: Record<string, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '小雨',
  heavy_rain: '大雨',
  storm: '暴雨',
};

export const WEATHER_COLORS: Record<string, string> = {
  sunny: '#ffcc4d',
  cloudy: '#b2bec3',
  rainy: '#4a6fa5',
  heavy_rain: '#2d3436',
  storm: '#1a1a2e',
};

export const LATE_PENALTY_RATE = 0.15;
export const EARLY_BONUS_RATE = 0.1;
export const URGENCY_BONUS_RATE = 0.08;

export const MIN_ORDER_REWARD = 30;
export const MAX_ORDER_REWARD = 150;
export const MIN_ORDER_DISTANCE = 2;
export const MAX_ORDER_DISTANCE = 15;

export const CHARGE_COST = 0.5;
export const REPAIR_COST = 1;

export const MAX_AVAILABLE_ORDERS = 5;
export const ORDER_GENERATION_INTERVAL = 15000;
export const WEATHER_CHANGE_INTERVAL = 30000;

export const STORAGE_KEY = 'city_delivery_game_save';
export const SAVE_VERSION = '1.0.0';

export const LOCATION_NAMES = [
  '幸福小区', '阳光花园', '城市广场', '中心医院', '科技大厦',
  '购物中心', '美食街', '火车站', '体育馆', '图书馆',
  '公园北门', '商业街', '写字楼A座', '公寓楼', '学校门口',
  '咖啡店', '花店', '超市', '餐厅', '银行',
];

export const BUILDING_NAMES = [
  '居民区', '商业中心', '工厂', '仓库', '办公楼',
  '酒店', '医院', '学校', '公园', '停车场',
];
