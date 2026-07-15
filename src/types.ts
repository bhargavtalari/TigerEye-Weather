export interface LocationInfo {
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface WeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  daily: DailyWeather;
}

export interface ClothingGuide {
  baseLayer: string;
  middleLayer: string;
  outerLayer: string;
  accessories: string[];
  offline?: boolean;
}

export interface PackingItem {
  name: string;
  category: string;
  quantity: string;
}

export interface PackingListResponse {
  items: PackingItem[];
  offline?: boolean;
}

export interface ShuffledActivity {
  activity: string;
  optimizedDay: string;
  reason: string;
  tip: string;
}

export interface ItineraryResponse {
  schedule: ShuffledActivity[];
  offline?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SavedTripPlan {
  id: string;
  cityName: string;
  startDate: string;
  endDate: string;
  intent: string;
  packingList: PackingItem[];
  itinerary: ShuffledActivity[];
  savedAt: string;
  weatherSummary: string;
}
