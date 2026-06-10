import { WeatherState, WeatherType } from './types';
import { WEATHER_SPEED_MODIFIERS, WEATHER_CHANGE_INTERVAL } from './constants';

export function createInitialWeather(): WeatherState {
  return {
    type: 'sunny',
    intensity: 0,
    speedModifier: 1.0,
    nextChangeTime: WEATHER_CHANGE_INTERVAL,
  };
}

export function updateWeather(weather: WeatherState, deltaTime: number): WeatherState {
  let newWeather = { ...weather };
  newWeather.nextChangeTime -= deltaTime * 1000;

  if (newWeather.nextChangeTime <= 0) {
    newWeather = changeWeather(newWeather);
    newWeather.nextChangeTime = WEATHER_CHANGE_INTERVAL + Math.random() * 20000;
  }

  return newWeather;
}

function changeWeather(current: WeatherState): WeatherState {
  const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'heavy_rain', 'storm'];
  const currentIndex = weatherTypes.indexOf(current.type);

  let nextIndex: number;
  const rand = Math.random();

  if (rand < 0.6) {
    if (currentIndex > 0 && currentIndex < weatherTypes.length - 1) {
      nextIndex = currentIndex + (Math.random() > 0.5 ? 1 : -1);
    } else if (currentIndex === 0) {
      nextIndex = 1;
    } else {
      nextIndex = currentIndex - 1;
    }
  } else {
    nextIndex = Math.floor(Math.random() * weatherTypes.length);
  }

  const nextType = weatherTypes[nextIndex];
  const intensity = getWeatherIntensity(nextType);

  return {
    type: nextType,
    intensity,
    speedModifier: WEATHER_SPEED_MODIFIERS[nextType],
    nextChangeTime: WEATHER_CHANGE_INTERVAL + Math.random() * 20000,
  };
}

function getWeatherIntensity(type: WeatherType): number {
  const intensityMap: Record<WeatherType, number> = {
    sunny: 0,
    cloudy: 10,
    rainy: 40,
    heavy_rain: 70,
    storm: 100,
  };
  return intensityMap[type] + Math.random() * 15 - 7.5;
}

export function getRainParticleCount(intensity: number): number {
  return Math.floor(intensity * 1.5);
}

export function isRaining(type: WeatherType): boolean {
  return type === 'rainy' || type === 'heavy_rain' || type === 'storm';
}

export function getWeatherEffectDescription(type: WeatherType): string {
  const descriptions: Record<WeatherType, string> = {
    sunny: '阳光明媚，适合出行',
    cloudy: '多云天气，稍有不便',
    rainy: '小雨绵绵，请注意安全',
    heavy_rain: '大雨倾盆，速度大幅下降',
    storm: '暴雨来袭，请小心驾驶',
  };
  return descriptions[type];
}
