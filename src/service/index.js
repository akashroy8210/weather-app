const BASE_URL = "https://api.weatherapi.com/v1";
const API_KEY = "c72de1ae4663414980d74055262506";

export const fetchWeatherData = async (query) => {
  const url = `${BASE_URL}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=yes`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Failed to fetch weather: ${response.statusText}`;
    throw new Error(message);
  }
  
  return await response.json();
};
