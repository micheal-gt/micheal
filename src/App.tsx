/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Bell, Timer, Sliders, Globe, Ellipsis, Settings, Sun, Moon, Volume2, ShieldAlert, Sparkles, X, Undo2 } from 'lucide-react';

// Subcomponents import
import { ClockTab } from './components/ClockTab';
import { AlarmsTab } from './components/AlarmsTab';
import { StopwatchTab } from './components/StopwatchTab';
import { TimerTab } from './components/TimerTab';
import { WorldClockTab } from './components/WorldClockTab';
import { MoreTab } from './components/MoreTab';
import { Onboarding } from './components/Onboarding';
import { SettingsPanel } from './components/SettingsPanel';

// Utilities
import { AdManager } from './utils/adManager';
import { AudioSynth } from './utils/audio';
import { decryptData } from './utils/crypto';
import { Alarm } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clock' | 'alarms' | 'stopwatch' | 'timer' | 'world' | 'more'>('clock');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [onboardFinished, setOnboardFinished] = useState(true);

  // Global settings configuration
  const [preferences, setPreferences] = useState({
    accentColor: '#007AFF', // Classic Blue
    use12hr: false,
    volume: 80,
    vibration: true,
    clockFaceStyle: 'Classic' as const,
    premiumActive: false
  });

  // Alarm triggering tracking
  const [activeAlarmOverlay, setActiveAlarmOverlay] = useState<Alarm | null>(null);
  const [snoozeActive, setSnoozeActive] = useState(false);
  const [snoozeSecondsLeft, setSnoozeSecondsLeft] = useState(0);

  // Interstitial Ad overlays
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialSeconds, setInterstitialSeconds] = useState(5);

  // Collapsible ad banner simulation
  const [showBottomAdBanner, setShowBottomAdBanner] = useState(true);

  const lastCheckedMinuteRef = useRef<string>('');
  const snoozeTimeoutRef = useRef<number | null>(null);

  // 1. Theme and Preferences initializer
  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark');
      document.documentElement.classList.add('dark');
    } else {
      setThemeMode('light');
      document.documentElement.classList.remove('dark');
    }

    try {
      const onboarded = localStorage.getItem('tempo_onboarded');
      if (!onboarded) setOnboardFinished(false);

      const color = localStorage.getItem('tempo_accentColor') || '#007AFF';
      const use12hr = localStorage.getItem('tempo_use12hr') === 'true';
      const volume = parseInt(localStorage.getItem('tempo_volume') || '85');
      const style = (localStorage.getItem('tempo_clockFaceStyle') || 'Classic') as any;

      const prefs = {
        accentColor: color,
        use12hr,
        volume,
        vibration: true,
        clockFaceStyle: style,
        premiumActive: AdManager.isAdFree()
      };
      setPreferences(prefs);
      document.documentElement.style.setProperty('--accent-theme', color);
    } catch {}
  }, []);

  // Sync preferences to cache
  useEffect(() => {
    try {
      localStorage.setItem('tempo_accentColor', preferences.accentColor);
      localStorage.setItem('tempo_use12hr', preferences.use12hr.toString());
      localStorage.setItem('tempo_clockFaceStyle', preferences.clockFaceStyle);
    } catch {}
  }, [preferences]);

  // Collapsible Ad collapse timer simulation
  useEffect(() => {
    if (preferences.premiumActive) {
      setShowBottomAdBanner(false);
      return;
    }
    // Simulate checking network for ad inventory. If no inventory after 1.5s, collapses height to 0!
    const timer = setTimeout(() => {
      // Simulate 80% ad fill rate
      if (Math.random() > 0.8) {
        setShowBottomAdBanner(false);
        console.log('Tempo: Ad Banner collapsed due to structural no-fill response.');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [preferences.premiumActive, activeTab]);

  // 2. Active Alarm checking interval clock (1s interval)
  useEffect(() => {
    const alarmChecker = setInterval(() => {
      // Skip checking if we are already ringing an alarm
      if (activeAlarmOverlay) return;

      const now = new Date();
      const currentHHMM = now.toTimeString().substring(0, 5);

      // Prevent triggering multiple times in the same minute
      if (lastCheckedMinuteRef.current === currentHHMM) return;

      const dayIndex = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      // Read decrypter alarm list
      try {
        const encrypted = localStorage.getItem('tempo_alarms_encrypted');
        let rawAlarms: Alarm[] = [];
        if (encrypted) {
          rawAlarms = JSON.parse(decryptData(encrypted));
        } else {
          // Plain fallback
          const rawPlain = localStorage.getItem('tempo_alarms');
          if (rawPlain) rawAlarms = JSON.parse(rawPlain);
        }

        const triggered = rawAlarms.find(alarm => {
          return (
            alarm.enabled &&
            alarm.time === currentHHMM &&
            (alarm.repeatDays.length === 0 || alarm.repeatDays.includes(dayIndex))
          );
        });

        if (triggered) {
          lastCheckedMinuteRef.current = currentHHMM;
          setActiveAlarmOverlay(triggered);
          AudioSynth.startAlarmTone(triggered.sound);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
        }
      } catch (err) {
        console.warn('Alarm checker load error', err);
      }
    }, 1000);

    return () => clearInterval(alarmChecker);
  }, [activeAlarmOverlay]);

  // 3. Interstitial Ad trigger hook listener
  useEffect(() => {
    const handleTriggerInterstitial = () => {
      if (AdManager.isAdFree()) return;
      setInterstitialSeconds(5);
      setShowInterstitial(true);

      const intv = setInterval(() => {
        setInterstitialSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intv);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    document.addEventListener('tempo_trigger_interstitial', handleTriggerInterstitial);
    return () => document.removeEventListener('tempo_trigger_interstitial', handleTriggerInterstitial);
  }, []);

  const handleThemeToggle = () => {
    AudioSynth.playHapticClick();
    if (themeMode === 'light') {
      setThemeMode('dark');
      document.documentElement.classList.add('dark');
    } else {
      setThemeMode('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // Alarm overlay functions
  const handleDismissAlarm = () => {
    AudioSynth.stopAllActiveAlarmTones();
    setActiveAlarmOverlay(null);
    setSnoozeActive(false);
  };

  const handleSnoozeAlarm = () => {
    if (!activeAlarmOverlay) return;
    AudioSynth.stopAllActiveAlarmTones();
    
    const minutes = activeAlarmOverlay.snoozeDuration;
    const durSeconds = minutes * 60;
    
    setSnoozeSecondsLeft(durSeconds);
    setSnoozeActive(true);
    setActiveAlarmOverlay(null);

    // Set countdown trigger
    snoozeTimeoutRef.current = setTimeout(() => {
      // Re-trigger alarm rings procedurally
      setActiveAlarmOverlay(activeAlarmOverlay);
      setSnoozeActive(false);
      AudioSynth.startAlarmTone(activeAlarmOverlay.sound);
    }, durSeconds * 1000) as any;
  };

  const handleSnoozeCancel = () => {
    AudioSynth.playHapticClick();
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    setSnoozeActive(false);
    setSnoozeSecondsLeft(0);
  };

  const adFreeActive = AdManager.isAdFree();

  return (
    <div 
      className="min-h-screen bg-zinc-55 text-zinc-900 dark:bg-black dark:text-zinc-100 flex flex-col justify-between transition-colors duration-400 font-sans select-none overflow-x-hidden antialiased"
      style={{ backgroundColor: themeMode === 'light' ? '#F5F5F7' : '#000000' }}
    >
      {/* Visual background atmospheric elements representing Apple-inspired aesthetic depth */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-sky-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-indigo-500/5 blur-[125px] pointer-events-none -z-10" />

      {/* FIXED TITLE HEADER */}
      <header className="px-12 py-8 flex justify-between items-center sticky top-0 backdrop-blur-md bg-transparent z-30 select-none">
        <div className="w-10 flex items-center justify-start gap-2">
          {/* Customized parameters list triggers */}
          <button
            onClick={() => {
              AudioSynth.playHapticClick();
              setShowSettings(!showSettings);
            }}
            aria-label="Open parameter customizations"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors select-none text-zinc-850 dark:text-zinc-200"
          >
            <Settings size={18} />
          </button>

          {/* Main alarm snooze remaining indicator */}
          {snoozeActive && (
            <button
              onClick={handleSnoozeCancel}
              className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded-lg select-none hover:bg-amber-500/20"
              title="Click to cancel active snooze trigger"
            >
              <span>Snoozing</span>
              <Undo2 size={10} />
            </button>
          )}
        </div>

        <h1 className="text-[18px] font-extralight tracking-[0.2em] uppercase text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5 justify-center">
          <span>Tempo</span>
          {adFreeActive && (
            <span className="text-[8px] font-bold text-white bg-sky-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest scale-90">
              PRMR
            </span>
          )}
        </h1>

        <button
          onClick={handleThemeToggle}
          aria-label="Toggle system lighting modes"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors select-none text-zinc-850 dark:text-zinc-200"
        >
          {themeMode === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <Sun size={20} className="text-zinc-50" />
          )}
        </button>
      </header>

      {/* APP WORKSPACE SWITCH MODULES */}
      <main className="flex-grow pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1.0] }}
            className="w-full"
          >
            {activeTab === 'clock' && (
              <ClockTab 
                accentColor={preferences.accentColor} 
                preferences={preferences} 
                setPreferences={setPreferences} 
              />
            )}
            {activeTab === 'alarms' && <AlarmsTab accentColor={preferences.accentColor} />}
            {activeTab === 'stopwatch' && <StopwatchTab />}
            {activeTab === 'timer' && <TimerTab />}
            {activeTab === 'world' && <WorldClockTab />}
            {activeTab === 'more' && <MoreTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* COLLAPSIBLE BANNER AD MODULE PLACEHOLDER */}
      <AnimatePresence>
        {showBottomAdBanner && !adFreeActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 60, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto bg-zinc-100/90 dark:bg-zinc-950/90 border-t border-zinc-200/50 dark:border-zinc-850 backdrop-blur-lg flex items-center justify-between px-5 py-2.5 overflow-hidden select-none z-10 select-none ad-container ad-banner"
            data-ad-slot="banner-bottom"
          >
            <div className="text-left max-w-[70%]">
              <span className="text-[8px] font-mono tracking-widest text-zinc-400 uppercase">Advertisement</span>
              <p className="text-[10px] text-zinc-650 truncate mt-0.5">Tempo VIP Premier: Savor every beat. Remove ads now.</p>
            </div>
            
            <button
              onClick={() => {
                AudioSynth.playHapticClick();
                setShowSettings(true);
              }}
              className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-3 py-1 text-[9px] font-bold uppercase tracking-wider"
            >
              Learn More
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM ESTHETIC NAVIGATION RAILS */}
      <nav 
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto h-24 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-t border-zinc-200/80 dark:border-zinc-800/80 z-30 flex justify-between items-center px-6 pb-4 select-none"
        id="bottom-accent-navigation"
      >
        {[
          { id: 'clock', label: 'Clock', icon: <Clock size={19} /> },
          { id: 'alarms', label: 'Alarms', icon: <Bell size={19} /> },
          { id: 'stopwatch', label: 'Stopwatch', icon: <Sliders size={19} className="rotate-90" /> },
          { id: 'timer', label: 'Timer', icon: <Timer size={19} /> },
          { id: 'world', label: 'World', icon: <Globe size={19} /> },
          { id: 'more', label: 'More', icon: <Ellipsis size={19} /> }
        ].map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                AudioSynth.playHapticClick();
                setActiveTab(item.id as any);
              }}
              className="flex-1 flex flex-col items-center justify-center h-full relative text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all select-none focus:outline-none"
              aria-label={`Switch to ${item.label} panel`}
            >
              <div 
                className="transition-all duration-200"
                style={{ color: active ? preferences.accentColor : 'currentColor' }}
              >
                {item.icon}
              </div>
              <span 
                className={`text-[9px] uppercase tracking-wider mt-1.5 transition-all select-none duration-200 ${
                  active 
                    ? 'font-bold' 
                    : 'font-medium'
                }`}
                style={{ color: active ? preferences.accentColor : 'currentColor' }}
              >
                {item.label}
              </span>
              
              {/* Active Underline design indicator */}
              {active && (
                <motion.div
                  layoutId="activeTabUnder"
                  className="w-4 h-[2px] rounded-full absolute bottom-1.5"
                  style={{ backgroundColor: preferences.accentColor }}
                  transition={{ type: 'spring', damping: 15 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* FLOAT ONBOARDING TIPS SCROLL TIPS */}
      <AnimatePresence>
        {!onboardFinished && (
          <Onboarding onOnboarded={() => setOnboardFinished(true)} />
        )}
      </AnimatePresence>

      {/* STANDALONE CUSTOMIZATION SETTINGS HOVER ELEMENT */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            preferences={preferences}
            setPreferences={setPreferences}
            onSettingsClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* FULL SCREEN ALARM OVERLAY TAKE OVER DISPATCHER */}
      <AnimatePresence>
        {activeAlarmOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 text-center text-white"
          >
            {/* Pulsing ring visual indicator container */}
            <div className="absolute inset-0 bg-red-650/10 animate-pulse pointer-events-none" />
            
            <div className="max-w-md w-full border border-zinc-800 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[65vh]">
              <div className="space-y-6 flex-grow flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, -5, 5, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.0 }}
                  className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2"
                >
                  <Bell size={28} />
                </motion.div>

                <div>
                  <h3 className="text-4xl font-extralight font-sans text-red-500 tracking-tight select-all">
                    {activeAlarmOverlay.time}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2 font-semibold">
                    {activeAlarmOverlay.label || 'Alarm Alert'}
                  </p>
                </div>
              </div>

              {/* Action columns toggle dismiss vs snooze */}
              <div className="space-y-3">
                <button
                  onClick={handleDismissAlarm}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl text-sm shadow transition-all hover:scale-[1.02]"
                >
                  Dismiss Alarm
                </button>
                <button
                  onClick={handleSnoozeAlarm}
                  className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-semibold py-4 rounded-2xl text-sm border border-zinc-700 transition-all"
                >
                  Snooze ({activeAlarmOverlay.snoozeDuration} min)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERSTITIAL OVERLAY TAKEOVER BANNER */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[110] flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <div className="max-w-md w-full border border-zinc-800 bg-zinc-900 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">Advertisement</span>
              
              <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Sparkles size={28} />
              </div>

              <div>
                <h4 className="text-lg font-semibold tracking-tight">Tempo VIP Premier Spotlight</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 p-1">
                  "Tempo Premium integrates fully synced alarms, sleep logs, and metronomes. Remove ads for 24-hours now." Thanks for supporting Tempo.
                </p>
              </div>

              {interstitialSeconds > 0 ? (
                <div className="text-sm font-semibold text-zinc-500">
                  Close in {interstitialSeconds}s...
                </div>
              ) : (
                <button
                  onClick={() => {
                    AudioSynth.playHapticClick();
                    setShowInterstitial(false);
                  }}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                >
                  <X size={14} />
                  <span>Dismiss Sponsor Ad</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
