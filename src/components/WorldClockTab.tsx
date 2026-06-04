/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Trash2, ArrowUp, ArrowDown, Plus, Tag } from 'lucide-react';
import { AudioSynth } from '../utils/audio';

interface WorldCity {
  name: string;
  country: string;
  zone: string; // IANA Timezone ID
  lat: number;
  lng: number;
}

// Preseeded list of 85 global cities covering all continents and offsets
const SEEDED_CITIES: WorldCity[] = [
  { name: 'London', country: 'United Kingdom', zone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'United States', zone: 'America/New_York', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Dubai', country: 'United Arab Emirates', zone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Sydney', country: 'Australia', zone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Los Angeles', country: 'United States', zone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Paris', country: 'France', zone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Nairobi', country: 'Kenya', zone: 'Africa/Nairobi', lat: -1.2921, lng: 36.8219 },
  { name: 'Honolulu', country: 'United States', zone: 'Pacific/Honolulu', lat: 21.3069, lng: -157.8583 },
  { name: 'Anchorage', country: 'United States', zone: 'America/Anchorage', lat: 61.2181, lng: -149.9003 },
  { name: 'Vancouver', country: 'Canada', zone: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', zone: 'America/Mexico_City', lat: 19.4326, lng: -99.1332 },
  { name: 'Chicago', country: 'United States', zone: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Buenos Aires', country: 'Argentina', zone: 'America/Argentina/Buenos_Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Sao Paulo', country: 'Brazil', zone: 'America/Sao_Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Reykjavik', country: 'Iceland', zone: 'Atlantic/Reykjavik', lat: 64.1466, lng: -21.9426 },
  { name: 'Madrid', country: 'Spain', zone: 'Europe/Madrid', lat: 40.4167, lng: -3.7037 },
  { name: 'Berlin', country: 'Germany', zone: 'Europe/Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rome', country: 'Italy', zone: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Copenhagen', country: 'Denmark', zone: 'Europe/Copenhagen', lat: 55.6761, lng: 12.5683 },
  { name: 'Cairo', country: 'Egypt', zone: 'Africa/Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Johannesburg', country: 'South Africa', zone: 'Africa/Johannesburg', lat: -26.2041, lng: 28.0473 },
  { name: 'Moscow', country: 'Russia', zone: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Riyadh', country: 'Saudi Arabia', zone: 'Asia/Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Mumbai', country: 'India', zone: 'Asia/Kolkata', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangkok', country: 'Thailand', zone: 'Asia/Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Singapore', country: 'Singapore', zone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Hong Kong', country: 'China', zone: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Beijing', country: 'China', zone: 'Asia/Shanghai', lat: 39.9042, lng: 116.4074 },
  { name: 'Seoul', country: 'South Korea', zone: 'Asia/Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Auckland', country: 'New Zealand', zone: 'Pacific/Auckland', lat: -36.8485, lng: 174.7633 },
  { name: 'Athens', country: 'Greece', zone: 'Europe/Athens', lat: 37.9838, lng: 23.7275 },
  { name: 'Cape Town', country: 'South Africa', zone: 'Africa/Johannesburg', lat: -33.9249, lng: 18.4241 },
  { name: 'Istanbul', country: 'Turkey', zone: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Jakarta', country: 'Indonesia', zone: 'Asia/Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Lagos', country: 'Nigeria', zone: 'Africa/Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Lima', country: 'Peru', zone: 'America/Lima', lat: -12.0464, lng: -77.0428 },
  { name: 'Manila', country: 'Philippines', zone: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
  { name: 'Santiago', country: 'Chile', zone: 'America/Santiago', lat: -33.4489, lng: -70.6693 },
  { name: 'Stockholm', country: 'Sweden', zone: 'Europe/Stockholm', lat: 59.3293, lng: 18.0686 },
  { name: 'Geneva', country: 'Switzerland', zone: 'Europe/Zurich', lat: 46.2044, lng: 6.1432 },
  { name: 'Nassau', country: 'Bahamas', zone: 'America/Nassau', lat: 25.0601, lng: -77.3450 },
  { name: 'Oslo', country: 'Norway', zone: 'Europe/Oslo', lat: 59.9139, lng: 10.7522 },
  { name: 'Prague', country: 'Czech Republic', zone: 'Europe/Prague', lat: 50.0755, lng: 14.4378 },
  { name: 'Vienna', country: 'Austria', zone: 'Europe/Vienna', lat: 48.2082, lng: 16.3738 },
  { name: 'Warsaw', country: 'Poland', zone: 'Europe/Warsaw', lat: 52.2297, lng: 21.0122 },
  { name: 'Brussels', country: 'Belgium', zone: 'Europe/Brussels', lat: 50.8503, lng: 4.3517 },
  { name: 'Lisbon', country: 'Portugal', zone: 'Europe/Lisbon', lat: 38.7223, lng: -9.1393 },
  { name: 'Dublin', country: 'Ireland', zone: 'Europe/Dublin', lat: 53.3498, lng: -6.2603 },
  { name: 'Budapest', country: 'Hungary', zone: 'Europe/Budapest', lat: 47.4979, lng: 19.0402 },
  { name: 'Kyiv', country: 'Ukraine', zone: 'Europe/Kyiv', lat: 50.4501, lng: 30.5234 },
  { name: 'Heidelberg', country: 'Germany', zone: 'Europe/Berlin', lat: 49.3988, lng: 8.6724 },
  { name: 'Casablanca', country: 'Morocco', zone: 'Africa/Casablanca', lat: 33.5731, lng: -7.5898 },
  { name: 'Dhaka', country: 'Bangladesh', zone: 'Asia/Dhaka', lat: 23.8103, lng: 90.4125 },
  { name: 'Taipei', country: 'Taiwan', zone: 'Asia/Taipei', lat: 25.0330, lng: 121.5654 },
  { name: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu', lat: 27.7172, lng: 85.3240 },
  { name: 'Tashkent', country: 'Uzbekistan', zone: 'Asia/Tashkent', lat: 41.2995, lng: 69.2401 },
  { name: 'Kabul', country: 'Afghanistan', zone: 'Asia/Kabul', lat: 34.5553, lng: 69.2075 },
  { name: 'Ankara', country: 'Turkey', zone: 'Europe/Istanbul', lat: 39.9334, lng: 32.8597 },
  { name: 'Tehran', country: 'Iran', zone: 'Asia/Tehran', lat: 35.6892, lng: 51.3890 },
  { name: 'Karachi', country: 'Pakistan', zone: 'Asia/Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Manama', country: 'Bahrain', zone: 'Asia/Bahrain', lat: 26.2285, lng: 50.5860 },
  { name: 'Quito', country: 'Ecuador', zone: 'America/Quito', lat: -0.1807, lng: -78.4678 },
  { name: 'Bogota', country: 'Colombia', zone: 'America/Bogota', lat: 4.7110, lng: -74.0721 },
  { name: 'Caracas', country: 'Venezuela', zone: 'America/Caracas', lat: 10.4806, lng: -66.9036 },
  { name: 'Panama City', country: 'Panama', zone: 'America/Panama', lat: 8.9824, lng: -79.5199 }
];

export function WorldClockTab() {
  const [savedCities, setSavedCities] = useState<WorldCity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [tickerTime, setTickerTime] = useState(new Date());

  // Dynamic ticking seconds sync
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved Cities
  useEffect(() => {
    try {
      const cached = localStorage.getItem('tempo_world_cities');
      if (cached) {
        setSavedCities(JSON.parse(cached));
      } else {
        // Defaults
        const defaults = SEEDED_CITIES.slice(0, 5);
        setSavedCities(defaults);
        localStorage.setItem('tempo_world_cities', JSON.stringify(defaults));
      }
    } catch {
      setSavedCities(SEEDED_CITIES.slice(0, 5));
    }
  }, []);

  const saveCitiesList = (list: WorldCity[]) => {
    try {
      setSavedCities(list);
      localStorage.setItem('tempo_world_cities', JSON.stringify(list));
    } catch {}
  };

  const handleAddCity = (city: WorldCity) => {
    AudioSynth.playHapticClick();
    if (savedCities.some(sc => sc.name === city.name)) return;
    const list = [...savedCities, city];
    saveCitiesList(list);
    setShowSearchSheet(false);
    setSearchQuery('');
  };

  const handleRemoveCity = (name: string) => {
    AudioSynth.playHapticClick();
    const list = savedCities.filter(c => c.name !== name);
    saveCitiesList(list);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    AudioSynth.playHapticClick();
    const list = [...savedCities];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    saveCitiesList(list);
  };

  const handleMoveDown = (index: number) => {
    if (index === savedCities.length - 1) return;
    AudioSynth.playHapticClick();
    const list = [...savedCities];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    saveCitiesList(list);
  };

  // Time and Date fetch helper (Dst-safe)
  const getCityFormattedData = (zone: string) => {
    try {
      // Hour details for Day/Night calculation
      const fHour = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', hour12: false }).format(tickerTime);
      const hourVal = parseInt(fHour);
      
      const fTime = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(tickerTime);

      const fDate = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        month: 'short',
        day: 'numeric'
      }).format(tickerTime);

      // Local offsets comparison
      const localString = tickerTime.toLocaleString('en-US', { timeZone: zone });
      const localDate = new Date(localString);
      const sysDate = new Date(tickerTime.toLocaleString('en-US'));
      const diffHrs = Math.round((localDate.getTime() - sysDate.getTime()) / (1000 * 60 * 60));

      const isNight = hourVal < 6 || hourVal > 18;
      
      // Part of day banner
      let bannerLabel = 'Morning';
      if (hourVal >= 12 && hourVal < 17) bannerLabel = 'Afternoon';
      else if (hourVal >= 17 && hourVal < 21) bannerLabel = 'Evening';
      else if (hourVal >= 21 || hourVal < 5) bannerLabel = 'Night';

      return {
        formattedTime: fTime,
        formattedDate: fDate,
        offsetStr: diffHrs >= 0 ? `+${diffHrs}h` : `${diffHrs}h`,
        isNight,
        bannerLabel,
        hourVal
      };
    } catch {
      return { formattedTime: '--:--', formattedDate: '', offsetStr: '+0h', isNight: false, bannerLabel: 'Day', hourVal: 12 };
    }
  };

  // Filtering Search Lists
  const filteredSearch = SEEDED_CITIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(c => !savedCities.some(sc => sc.name === c.name));

  // Premium status check to show ads
  const adFreeActive = (window as any).AdManager?.isAdFree();

  return (
    <div className="p-4 py-6 max-w-lg mx-auto" id="worldclock-pane">
      {/* 1. Timezone Map Strip axis visualizer */}
      <div className="bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/20 dark:border-zinc-800/20 rounded-2xl p-4 mb-6">
        <h3 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-3 text-left">
          24-Hour GMT Sync-strip
        </h3>

        {/* Dynamic coordinate strip indicating daylight */}
        <div className="relative h-6 bg-gradient-to-r from-indigo-950 via-amber-200 to-indigo-950 rounded-lg flex items-center justify-between px-2 overflow-hidden shadow-inner font-mono text-[8px] text-zinc-600/60 select-none">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>

          {/* Dots indicating where major city sits on active diurnal rotation */}
          {savedCities.map((city, idx) => {
            const data = getCityFormattedData(city.zone);
            // Translate hours scale (0 to 24) to percentage coordinate (0 to 100)
            const leftPct = (data.hourVal / 24) * 100;
            return (
              <motion.div
                key={city.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-2 h-2 rounded-full border border-white bg-sky-500 shadow-sm"
                style={{ left: `calc(${leftPct}% - 4px)` }}
                title={`${city.name}: ${data.formattedTime}`}
              />
            );
          })}
        </div>
      </div>

      {savedCities.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-400 select-none">
          <Globe size={40} className="mb-4 text-zinc-200 dark:text-zinc-800" />
          <h4 className="text-sm font-semibold">Stay in sync</h4>
          <p className="text-xs">Add key cities to check overlapping timelines.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          <AnimatePresence initial={false}>
            {savedCities.map((city, idx) => {
              const data = getCityFormattedData(city.zone);
              const cardGradient = data.isNight 
                ? 'from-zinc-950 to-indigo-950/20 text-zinc-300 border-zinc-900' 
                : 'from-white to-orange-50/30 text-zinc-800 dark:from-zinc-900 dark:to-zinc-850 dark:text-zinc-100 border-zinc-200/40 dark:border-zinc-800/40';

              // Simulated native ad insert logic
              const showAdSlot = (idx + 1) % 5 === 0 && !adFreeActive;

              return (
                <React.Fragment key={city.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border rounded-2xl p-4 flex justify-between items-center shadow-sm bg-gradient-to-r relative ${cardGradient}`}
                  >
                    <div className="text-left flex-grow truncate mr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-lg font-bold truncate">
                          {city.name}
                        </h4>
                        <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded uppercase">
                          {data.bannerLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium truncate">
                        {city.country} • {data.offsetStr} {data.offsetStr.startsWith('+') ? 'ahead' : 'behind'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                        {data.formattedDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Formatted Clock Time */}
                      <div className="text-right">
                        <span className="text-2xl font-light tracking-tight tabular-nums block font-mono">
                          {data.formattedTime.substring(0, 5)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                          {data.formattedTime.split(' ')[1]}
                        </span>
                      </div>

                      {/* Controls target columns reorder */}
                      <div className="flex flex-col gap-1">
                        {idx > 0 && (
                          <button onClick={() => handleMoveUp(idx)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 animate-pulse" title="Move up">
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {idx < savedCities.length - 1 && (
                          <button onClick={() => handleMoveDown(idx)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 animate-pulse" title="Move down">
                            <ArrowDown size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveCity(city.name)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/40 rounded-lg text-red-500"
                        aria-label={`Remove ${city.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>

                  {/* AD SLOT INLINE SPONSORED CARD */}
                  {showAdSlot && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ad-native border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl p-4 flex justify-between items-center text-left"
                      data-ad-slot="native-feed"
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-1 mb-1 text-zinc-400 font-semibold text-[9px] uppercase tracking-wider">
                          <Tag size={10} />
                          <span>Sponsored</span>
                        </div>
                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Chronos Timepieces</h5>
                        <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                          Elegance for your wrists designed with swiss precise balance. Savor every beat.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          AudioSynth.playHapticClick();
                          alert('Chronos Ad Clicked!');
                        }}
                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap"
                      >
                        Explore
                      </button>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* SEARCH OR ADD FAB */}
      <button
        onClick={() => {
          AudioSynth.playHapticClick();
          setShowSearchSheet(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
        aria-label="Find city to add"
      >
        <Plus size={24} />
      </button>

      {/* SEARCH LIST SLIDE UP DRAWERS */}
      <AnimatePresence>
        {showSearchSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchSheet(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-5 z-50 pb-8 border-t border-zinc-200/40 dark:border-zinc-800/40 max-h-[80vh] overflow-y-auto"
              id="search-cities-sheet"
            >
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Search Cities</h3>
                <button 
                  onClick={() => {
                    setShowSearchSheet(false);
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-950"
                >
                  Close
                </button>
              </div>

              {/* Input Queries */}
              <div className="relative mb-4 flex items-center">
                <Search size={16} className="absolute left-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Find Zurich, Bogota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-850 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-sky-500"
                />
              </div>

              {/* Suggestions grid of searchable items */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {filteredSearch.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center select-none">No results matching search filters.</p>
                ) : (
                  filteredSearch.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleAddCity(city)}
                      className="w-full text-left p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/40 rounded-xl flex justify-between items-center transition-all duration-200 border border-zinc-50 dark:border-zinc-900/10"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{city.name}</h4>
                        <p className="text-[10px] text-zinc-400">{city.country}</p>
                      </div>
                      <Plus size={14} className="text-zinc-400 group-hover:text-sky-500" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
