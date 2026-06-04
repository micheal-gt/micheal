/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ShieldCheck, Sun, Moon, Volume2, RotateCcw, Paintbrush, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { AudioSynth } from '../utils/audio';
import { AdManager } from '../utils/adManager';

interface SettingsPanelProps {
  preferences: {
    accentColor: string;
    use12hr: boolean;
    volume: number;
    vibration: boolean;
    clockFaceStyle: 'Minimal' | 'Classic' | 'Bold';
  };
  setPreferences: React.Dispatch<React.SetStateAction<any>>;
  onSettingsClose: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Electric Blue', hex: '#007AFF' },
  { name: 'Emerald Green', hex: '#34C759' },
  { name: 'Sunrise Orange', hex: '#FF9500' },
  { name: 'Crimson Sunset', hex: '#FF3B30' },
  { name: 'Lavender Mist', hex: '#AF52DE' },
  { name: 'Royal Gold', hex: '#FFD60A' }
];

export function SettingsPanel({ preferences, setPreferences, onSettingsClose }: SettingsPanelProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(10);

  // Triggering simulated video ad playback for getting premium license
  const handleWatchRewardedAd = () => {
    AudioSynth.playHapticClick();
    setIsWatchingAd(true);
    setAdSecondsLeft(10);

    const intv = setInterval(() => {
      setAdSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intv);
          // Reward completed! Enable 24 hour premium key
          AdManager.unlockAdFree24h();
          setPreferences((old: any) => ({ ...old, premiumActive: true }));
          setIsWatchingAd(false);
          AudioSynth.playHapticClick();
          alert('Congratulations! Premium unlocked. Ads successfully disabled for 24 hours!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMasterFactoryReset = () => {
    AudioSynth.playHapticClick();
    try {
      localStorage.clear();
      alert('Application settings reset to factory defaults. Reloading...');
      window.location.reload();
    } catch {}
  };

  const adFreeLicensed = AdManager.isAdFree();

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-50 overflow-y-auto p-5 pb-12 select-none" id="settings-standalone-panel">
      {/* Structural Header */}
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6 pt-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-sky-500 animate-spin-slow" size={20} />
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Tempo Settings</h2>
          </div>
          <button
            onClick={() => {
              AudioSynth.playHapticClick();
              onSettingsClose();
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          >
            Close Settings
          </button>
        </div>

        {/* Content Settings Divisions */}
        <div className="space-y-6 text-left">
          
          {/* 1. Theme and visual swatches */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/20 dark:border-zinc-800/20 p-4 rounded-2xl">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Paintbrush size={12} />
              <span>Aesthetic Accents</span>
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = preferences.accentColor === swatch.hex;
                return (
                  <button
                    key={swatch.hex}
                    onClick={() => {
                      AudioSynth.playHapticClick();
                      setPreferences((p: any) => ({ ...p, accentColor: swatch.hex }));
                      // update custom global property
                      document.documentElement.style.setProperty('--accent-theme', swatch.hex);
                    }}
                    style={{ backgroundColor: swatch.hex }}
                    className={`w-10 h-10 rounded-full transition-all relative ${
                      isSelected ? 'ring-4 ring-sky-500/40 scale-110 shadow' : 'hover:scale-105 shadow-sm'
                    }`}
                    title={swatch.name}
                    aria-label={`Select accent color ${swatch.name}`}
                  />
                );
              })}
            </div>
          </div>

          {/* 2. Format Switches */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/20 dark:border-zinc-800/20 p-4 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Display Formatting</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">24-Hour Military Format</span>
              <button
                onClick={() => {
                  AudioSynth.playHapticClick();
                  setPreferences((p: any) => ({ ...p, use12hr: !p.use12hr }));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                  !preferences.use12hr ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    !preferences.use12hr ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Haptic/Vibration Pulses</span>
              <button
                onClick={() => {
                  AudioSynth.playHapticClick();
                  setPreferences((p: any) => ({ ...p, vibration: !p.vibration }));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                  preferences.vibration ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.vibration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Audio Sound volume level dial */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/20 dark:border-zinc-800/20 p-4 rounded-2xl">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Volume2 size={12} />
              <span>Chimes Volume</span>
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.volume}
                onChange={(e) => {
                  const vol = parseInt(e.target.value);
                  setPreferences((p: any) => ({ ...p, volume: vol }));
                  localStorage.setItem('tempo_volume', vol.toString());
                }}
                className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-xs font-mono w-8 text-right text-zinc-500">
                {preferences.volume}%
              </span>
            </div>
          </div>

          {/* 4. PREMIUM UNLOCK MODULE */}
          <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/20 p-5 rounded-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-sky-500 flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={16} />
              <span>Ad-Free Premium Suite</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mb-4">
              Unlock the entire Premium design. Removes interstitial overlays, in-feed sponsored timers, and unlocks the VIP emblem. Valid for 24h.
            </p>

            {adFreeLicensed ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 rounded-full px-3.5 py-1.5">
                <Zap size={12} className="animate-pulse" />
                <span>VIP Active (Expires soon)</span>
              </div>
            ) : (
              <button
                onClick={handleWatchRewardedAd}
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                Simulate 10s Rewarded Ad
              </button>
            )}
          </div>

          {/* 5. DANGEROUS RESET AREA */}
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Danger Zone</h3>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Resets all saved configurations (alarms, timers, sleep trackers, stopwatch statistics) and starts fresh. This cannot be undone.
            </p>
            {showConfirmReset ? (
              <div className="flex gap-3">
                <button
                  onClick={handleMasterFactoryReset}
                  className="bg-red-500 text-white hover:bg-red-650 text-xs font-bold px-4 py-2.5 rounded-xl flex-1 text-center"
                >
                  Confirm Master Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold px-4 py-2.5 rounded-xl flex-1 text-center"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="border border-red-500/30 hover:bg-red-500/15 text-red-500 text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all"
              >
                Reset All App Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REWARDED VIDEO AD MODAL TAKEOVER */}
      <AnimatePresence>
        {isWatchingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-55 flex flex-col items-center justify-center p-6 text-center text-white"
          >
            {/* Minimalist Apple Video Ad Box mockup */}
            <div className="max-w-md w-full border border-zinc-800 bg-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                Ad Playing
              </div>

              <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <RefreshCw size={28} className="animate-spin-slow" />
              </div>

              <div>
                <h4 className="text-lg font-semibold tracking-tight">Watching Corporate Spotlight</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 p-1">
                  "Tempo Premium integrates fully synced alarms, sleep logs, and metronomes. Double click to customize." Only a few seconds remain.
                </p>
              </div>

              {/* Loader circle of seconds */}
              <div className="text-4xl font-extralight font-mono text-sky-500 py-3 tabular-nums">
                00:{String(adSecondsLeft).padStart(2, '0')}
              </div>

              <p className="text-[10px] text-zinc-500 font-medium">
                Do not exit the stream. Exiting now forfeits Premium rewards.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
