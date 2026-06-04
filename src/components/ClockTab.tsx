/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Eye, EyeOff, LayoutTemplate, Sparkles } from 'lucide-react';
import { AudioSynth } from '../utils/audio';

interface ClockTabProps {
  accentColor: string;
  preferences: {
    clockFaceStyle: 'Minimal' | 'Classic' | 'Bold';
    use12hr: boolean;
  };
  setPreferences: React.Dispatch<React.SetStateAction<any>>;
}

export function ClockTab({ accentColor, preferences, setPreferences }: ClockTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [digitalTime, setDigitalTime] = useState('');
  const [digitalDate, setDigitalDate] = useState('');
  const [timezoneLabel, setTimezoneLabel] = useState('');
  const [blink, setBlink] = useState(true);
  
  const [showNumerals, setShowNumerals] = useState(true);
  const [showSecondHand, setShowSecondHand] = useState(true);
  const [showStyleSheet, setShowStyleSheet] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);

  const longPressTimerRef = useRef<number | null>(null);
  const progressAnimationRef = useRef<number | null>(null);

  // Digital time and date update loop
  useEffect(() => {
    const updateDigital = () => {
      const now = new Date();
      setBlink(now.getSeconds() % 2 === 0);

      // format digital time
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      let ampm = '';

      if (preferences.use12hr) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
      }

      setDigitalTime(`${String(hours).padStart(2, '0')}:${mins}:${secs}${ampm}`);

      // format date
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      setDigitalDate(now.toLocaleDateString('en-US', options));

      // timezone offset
      const offset = -now.getTimezoneOffset() / 60;
      const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
      setTimezoneLabel(`${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${offsetStr})`);
    };

    updateDigital();
    const interval = setInterval(updateDigital, 100);
    return () => clearInterval(interval);
  }, [preferences.use12hr]);

  // Analog Clock animation loop (sub-second smooth movement)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const size = canvas.clientWidth;

      // scale for High-DPI screens
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
      }

      const radius = size / 2;
      ctx.clearRect(0, 0, size, size);

      const isDarkMode = document.documentElement.classList.contains('dark');
      const tickColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(29, 29, 31, 0.15)';
      const majorTickColor = isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(29, 29, 31, 0.35)';
      const numeralColor = isDarkMode ? '#FFFFFF' : '#1D1D1F';

      // 1. Draw outer ticks
      ctx.save();
      ctx.translate(radius, radius);

      for (let i = 0; i < 60; i++) {
        const isMajor = i % 5 === 0;
        ctx.strokeStyle = isMajor ? majorTickColor : tickColor;
        ctx.lineWidth = isMajor ? (preferences.clockFaceStyle === 'Bold' ? 3.0 : 2.0) : 1.0;

        ctx.beginPath();
        const tickLength = isMajor ? 12 : 6;
        ctx.moveTo(0, -radius + 6);
        ctx.lineTo(0, -radius + 6 + tickLength);
        ctx.stroke();

        // Numerals
        if (showNumerals && isMajor) {
          ctx.save();
          ctx.translate(0, -radius + 30);
          ctx.rotate(-i * 6 * Math.PI / 180); // Un-rotate letters
          ctx.fillStyle = numeralColor;
          ctx.font = preferences.clockFaceStyle === 'Bold' ? '600 13px Inter' : '400 13px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const hrVal = i / 5 === 0 ? 12 : i / 5;
          ctx.fillText(String(hrVal), 0, 0);
          ctx.restore();
        }

        ctx.rotate(6 * Math.PI / 180);
      }
      ctx.restore();

      // 2. Compute smooth hands rotation
      const now = new Date();
      const ms = now.getMilliseconds();
      const rawSecs = now.getSeconds() + (showSecondHand ? (ms / 1000) : 0);
      const rawMins = now.getMinutes() + rawSecs / 60;
      const rawHours = (now.getHours() % 12) + rawMins / 60;

      // Draw hands
      ctx.save();
      ctx.translate(radius, radius);

      // Hour Hand
      ctx.save();
      ctx.rotate(rawHours * 30 * Math.PI / 180);
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1D1D1F';
      ctx.lineWidth = preferences.clockFaceStyle === 'Bold' ? 8 : (preferences.clockFaceStyle === 'Classic' ? 6 : 4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(0, -radius * 0.52);
      ctx.stroke();
      ctx.restore();

      // Minute Hand
      ctx.save();
      ctx.rotate(rawMins * 6 * Math.PI / 180);
      ctx.strokeStyle = isDarkMode ? '#AEAEB2' : '#8E8E93';
      ctx.lineWidth = preferences.clockFaceStyle === 'Bold' ? 5 : (preferences.clockFaceStyle === 'Classic' ? 4 : 2.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(0, -radius * 0.75);
      ctx.stroke();
      ctx.restore();

      // Second Hand
      if (showSecondHand) {
        ctx.save();
        ctx.rotate(rawSecs * 6 * Math.PI / 180);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // Tapered hand line
        ctx.beginPath();
        ctx.moveTo(0, 24); // Hand tail counterweight
        ctx.lineTo(0, -radius * 0.85);
        ctx.stroke();

        if (preferences.clockFaceStyle !== 'Minimal') {
          // Counterweight circle
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(0, -radius * 0.62, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center cap
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else {
        // Standard center dot if no second hand
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#1D1D1F';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [accentColor, preferences.clockFaceStyle, showNumerals, showSecondHand]);

  // Long press gesture handling
  const startLongPressTimer = () => {
    AudioSynth.playHapticClick();
    let start = Date.now();
    
    // Animate progress indicators
    const animateProgress = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1.0, elapsed / 500); // 500ms trigger threshold
      setLongPressProgress(pct);

      if (pct < 1) {
        progressAnimationRef.current = requestAnimationFrame(animateProgress);
      } else {
        // Hold threshold achieved
        setLongPressProgress(0);
        setShowStyleSheet(true);
        AudioSynth.playHapticClick();
        if (navigator.vibrate) navigator.vibrate([40]);
      }
    };

    progressAnimationRef.current = requestAnimationFrame(animateProgress);
  };

  const cancelLongPressTimer = () => {
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
    }
    setLongPressProgress(0);
  };

  // Split digital time into pieces for Geometric Balance alignment
  const timeStr = digitalTime.replace(' PM', '').replace(' AM', '').trim();
  const pieces = timeStr.split(':');
  const p_hours = pieces[0] || '00';
  const p_mins = pieces[1] || '00';
  const p_secs = pieces[2] || '00';
  const p_ampm = preferences.use12hr ? (digitalTime.includes('PM') ? 'PM' : 'AM') : '';

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] text-center select-none" id="clock-pane">
      {/* Dynamic haptic scale indicator representing active long-press progress */}
      <div className="relative w-full max-w-sm flex justify-center items-center py-6 clock-panel-wrapper">
        <AnimatePresence>
          {longPressProgress > 0 && (
            <svg className="absolute w-96 h-96 -z-10 opacity-70" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={accentColor}
                strokeWidth="1.5"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * longPressProgress)}
                transform="rotate(-90 50 50)"
                className="transition-all duration-75"
              />
            </svg>
          )}
        </AnimatePresence>

        <motion.div
          onMouseDown={startLongPressTimer}
          onMouseUp={cancelLongPressTimer}
          onMouseLeave={cancelLongPressTimer}
          onTouchStart={startLongPressTimer}
          onTouchEnd={cancelLongPressTimer}
          animate={longPressProgress > 0 ? { scale: 0.96 } : { scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative cursor-pointer rounded-full p-6 bg-white dark:bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/80 dark:border-zinc-805/80 backdrop-blur-md"
          id="analog-face-wrapper"
        >
          <canvas
            ref={canvasRef}
            className="w-72 h-72 md:w-85 md:h-85 block select-none rounded-full"
            id="clock-face-canvas"
          />
        </motion.div>
      </div>

      {/* Digital clock & and dates */}
      <div className="mt-8 flex flex-col items-center">
        {/* Tabular figures used to lock layouts from wobbling */}
        <h2 
          className="text-7xl md:text-8xl font-extralight tracking-tight font-sans text-zinc-900 dark:text-zinc-50 tabular-nums select-all cursor-pointer flex items-baseline justify-center"
          onClick={() => AudioSynth.playHapticClick()}
        >
          <span>{p_hours}</span>
          <span className={`transition-opacity duration-300 mx-1 select-none ${blink ? 'opacity-30' : 'opacity-10'}`}>:</span>
          <span>{p_mins}</span>
          <span className="text-2xl md:text-3xl font-light opacity-50 ml-4 mb-1 md:mb-2 tabular-nums">
            {p_secs}
          </span>
          {p_ampm && (
            <span className="text-lg font-light opacity-50 ml-2 uppercase">
              {p_ampm}
            </span>
          )}
        </h2>
        
        <div className="text-[13px] md:text-[14px] font-medium tracking-widest text-zinc-400 dark:text-zinc-500 mt-4 uppercase select-all">
          {digitalDate} • {timezoneLabel.split(' (')[0]}
        </div>
      </div>

      {/* Long Press prompt indicator */}
      <p className="text-[10px] text-zinc-400/80 dark:text-zinc-500/80 mt-6 tracking-wider uppercase font-medium flex items-center gap-1">
        <Sparkles size={10} className="animate-pulse" />
        <span>Press and hold face to customize</span>
      </p>

      {/* BOTTOM SHEET DRAWER - CLOCK STYLE SETTING */}
      <AnimatePresence>
        {showStyleSheet && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStyleSheet(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-6 z-50 pb-8 border-t border-zinc-200/40 dark:border-zinc-800/40"
              id="clock-style-bottomsheet"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setShowStyleSheet(false)} />
              
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 text-left mb-5">
                Customize Clock Face
              </h3>

              <div className="space-y-5">
                {/* 1. Style Selection Row */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-zinc-400 text-left font-medium uppercase tracking-wide">Face Density</span>
                  <div className="grid grid-cols-3 gap-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                    {(['Minimal', 'Classic', 'Bold'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => {
                          AudioSynth.playHapticClick();
                          setPreferences((prev: any) => ({ ...prev, clockFaceStyle: style }));
                        }}
                        className={`py-2 rounded-lg text-xs font-medium transition-all ${
                          preferences.clockFaceStyle === style
                            ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Toggle controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <LayoutTemplate size={16} />
                      <span className="text-sm font-medium">Display Numerals</span>
                    </div>
                    <button
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setShowNumerals(!showNumerals);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        showNumerals ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                        transition={{ type: 'spring', damping: 15 }}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      {showSecondHand ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span className="text-sm font-medium">Sweeping Second Hand</span>
                    </div>
                    <button
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setShowSecondHand(!showSecondHand);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        showSecondHand ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                        transition={{ type: 'spring', damping: 15 }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStyleSheet(false)}
                className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 rounded-xl py-3 text-sm font-semibold mt-6 transition-all"
              >
                Close Panel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
