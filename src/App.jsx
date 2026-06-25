import { useState, useEffect, useCallback } from 'react'
import { 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  Sun, 
  Leaf,
  Sunrise,
  Sunset
} from "lucide-react"
import { fetchWeatherData } from "./service"
import './App.css'

// Pure date-time formatter
const formatLocalTime = (localtimeStr) => {
  if (!localtimeStr) return "";
  try {
    const date = new Date(localtimeStr.replace(/-/g, "/"));
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = date.getDate();
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dayName}, ${day} ${monthName} ${year} • ${timeStr}`;
  } catch (e) {
    console.error("Local time formatting error:", e);
    return localtimeStr;
  }
};

// UV Index descriptor helper
const getUvLabel = (uv) => {
  if (uv <= 2) return `${uv} (Low)`;
  if (uv <= 5) return `${uv} (Moderate)`;
  if (uv <= 7) return `${uv} (High)`;
  return `${uv} (Very High)`;
};

// Air Quality badge generator
const getAqiPill = (airQuality) => {
  if (!airQuality) return <span className="aqi-pill unknown">N/A</span>;
  
  const epaIndex = airQuality["us-epa-index"];
  const aqiVal = Math.round(airQuality.pm2_5 || 0);

  if (epaIndex <= 1) {
    return <span className="aqi-pill good">Good ({aqiVal})</span>;
  } else if (epaIndex === 2) {
    return <span className="aqi-pill moderate">Moderate ({aqiVal})</span>;
  } else if (epaIndex === 3) {
    return <span className="aqi-pill sensitive">Sensitive ({aqiVal})</span>;
  } else {
    return <span className="aqi-pill unhealthy">Unhealthy ({aqiVal})</span>;
  }
};

// Format date for forecast items: "2024-05-21" -> "Tue, 21 May"
const formatForecastDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr.replace(/-/g, "/"));
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${weekday}, ${day} ${month}`;
  } catch (e) {
    console.error("Forecast date formatting error:", e);
    return dateStr;
  }
};

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const fallbackToNewDelhi = useCallback(async () => {
    try {
      const data = await fetchWeatherData("New Delhi");
      setWeatherData(data);
    } catch (err) {
      console.error("New Delhi fallback failed:", err);
      setError("Failed to fetch weather data. Please try searching for a city manually.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fallbackToIp = useCallback(async () => {
    try {
      const data = await fetchWeatherData("auto:ip");
      setWeatherData(data);
      setLoading(false);
    } catch (err) {
      console.error("IP lookup failed, falling back to New Delhi:", err);
      fallbackToNewDelhi();
    }
  }, [fallbackToNewDelhi]);

  const loadInitialWeather = useCallback(() => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const query = `${latitude},${longitude}`;
            const data = await fetchWeatherData(query);
            setWeatherData(data);
            setLoading(false);
          } catch (err) {
            console.error("Geo coordinates fetch failed, falling back to IP:", err);
            fallbackToIp();
          }
        },
        
        (geoError) => {
          console.warn("Geo access denied/failed, falling back to IP:", geoError);
          fallbackToIp();
        },
        { timeout: 6000 }
      );
    } else {
      console.warn("Geolocation API not supported, falling back to IP");
      fallbackToIp();
    }
  }, [fallbackToIp]);

  const handleSearchSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData(searchInput.trim());
      setWeatherData(data);
    } catch (err) {
      setError(err.message || "City not found. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialWeather();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInitialWeather]);

  return (
    <div className='container'>
      <div className='main'>
        {/* Search header container */}
        <form onSubmit={handleSearchSubmit} className='header'>
          <div className='input-box'>
            <span><MapPin /></span>
            <input 
              type="text" 
              name="city" 
              id="city" 
              placeholder="Search city..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className='search-btn' disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" style={{ width: "1.1rem", height: "1.1rem" }} />
            ) : (
              <span><Search /></span>
            )}
            Search
          </button>
        </form>

        {/* Error message display */}
        {error && (
          <div className="error-display">
            {error}
          </div>
        )}

        {/* Loading display */}
        {loading && !weatherData && (
          <div className="loading-state">
            <Loader2 className="animate-spin loading-spinner" />
            <p>Fetching weather forecast...</p>
          </div>
        )}

        {/* Weather Dashboard containing Main Card + Feature Card + Astro Strip + 5d Forecast */}
        {!loading && weatherData && (
          <div className="weather-dashboard">
            {/* Left Column: Core Weather Details Card */}
            <div className="weather-card">
              {/* City details and airplane pointer */}
              <div className="weather-location">
                <h2 className="location-title">
                  {weatherData.location.name}, {weatherData.location.country}
                </h2>
                <Navigation className="location-arrow" />
              </div>

              {/* Date & Time */}
              <div className="weather-datetime">
                {formatLocalTime(weatherData.location.localtime)}
              </div>

              {/* Temperature & Icon */}
              <div className="weather-main-row">
                <div className="temp-display">
                  <span className="temp-val">
                    {Math.round(weatherData.current.temp_c)}
                  </span>
                  <span className="temp-symbol">°C</span>
                </div>
                <div className="weather-icon-wrapper">
                  <img 
                    src={`https:${weatherData.current.condition.icon}`} 
                    alt={weatherData.current.condition.text} 
                  />
                </div>
              </div>

              {/* Weather Condition */}
              <div className="weather-condition-text">
                {weatherData.current.condition.text}
              </div>

              {/* Feels like temperature */}
              <div className="weather-feels-like">
                Feels like {Math.round(weatherData.current.feelslike_c)}°C
              </div>

              {/* High/Low temperatures */}
              {weatherData.forecast?.forecastday?.[0]?.day && (
                <div className="weather-high-low-row">
                  <div className="high-low-item">
                    <span className="arrow-up">↑</span>
                    <span>{Math.round(weatherData.forecast.forecastday[0].day.maxtemp_c)}°C</span>
                  </div>
                  <div className="high-low-item">
                    <span className="arrow-down">↓</span>
                    <span>{Math.round(weatherData.forecast.forecastday[0].day.mintemp_c)}°C</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Detailed Metric Features Card (city-weather-feature) */}
            <div className="city-weather-feature">
              {/* Humidity Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Droplets className="feature-icon" />
                  </div>
                  <span className="feature-label">Humidity</span>
                </div>
                <span className="feature-value">{weatherData.current.humidity}%</span>
              </div>

              {/* Wind Speed Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Wind className="feature-icon" />
                  </div>
                  <span className="feature-label">Wind Speed</span>
                </div>
                <span className="feature-value">{Math.round(weatherData.current.wind_kph)} km/h</span>
              </div>

              {/* Visibility Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Eye className="feature-icon" />
                  </div>
                  <span className="feature-label">Visibility</span>
                </div>
                <span className="feature-value">{Math.round(weatherData.current.vis_km)} km</span>
              </div>

              {/* Pressure Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Gauge className="feature-icon" />
                  </div>
                  <span className="feature-label">Pressure</span>
                </div>
                <span className="feature-value">{Math.round(weatherData.current.pressure_mb)} hPa</span>
              </div>

              {/* UV Index Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Sun className="feature-icon" />
                  </div>
                  <span className="feature-label">UV Index</span>
                </div>
                <span className="feature-value">
                  {getUvLabel(weatherData.current.uv)}
                </span>
              </div>

              {/* Air Quality Row */}
              <div className="feature-row">
                <div className="feature-left">
                  <div className="feature-badge">
                    <Leaf className="feature-icon" />
                  </div>
                  <span className="feature-label">Air Quality</span>
                </div>
                {getAqiPill(weatherData.current.air_quality)}
              </div>
            </div>

            {/* Bottom Row: Sunrise & Sunset Astro Strip */}
            {weatherData.forecast?.forecastday?.[0]?.astro && (
              <div className="weather-astro-strip">
                {/* Sunrise Column */}
                <div className="astro-block">
                  <Sunrise className="astro-icon-sunrise" />
                  <div className="astro-info">
                    <span className="astro-label">Sunrise</span>
                    <span className="astro-val">
                      {weatherData.forecast.forecastday[0].astro.sunrise}
                    </span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="astro-divider" />

                {/* Sunset Column */}
                <div className="astro-block">
                  <Sunset className="astro-icon-sunset" />
                  <div className="astro-info">
                    <span className="astro-label">Sunset</span>
                    <span className="astro-val">
                      {weatherData.forecast.forecastday[0].astro.sunset}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Row: 5-Day Forecast Card Container */}
            {weatherData.forecast?.forecastday && (
              <div className="forecast-card-container">
                <h3 className="forecast-title">5-Day Forecast</h3>
                <div className="forecast-columns">
                  {weatherData.forecast.forecastday.map((dayData) => (
                    <div key={dayData.date} className="forecast-column-item">
                      <span className="forecast-date">
                        {formatForecastDate(dayData.date)}
                      </span>
                      <div className="forecast-icon">
                        <img 
                          src={`https:${dayData.day.condition.icon}`} 
                          alt={dayData.day.condition.text} 
                        />
                      </div>
                      <span className="forecast-temps">
                        {Math.round(dayData.day.maxtemp_c)}° / {Math.round(dayData.day.mintemp_c)}°
                      </span>
                      <span className="forecast-condition">
                        {dayData.day.condition.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
