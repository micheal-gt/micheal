/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Trash, Plus, Sparkles, Flame, CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { AudioSynth } from '../utils/audio';

interface TimerInstance {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
}

// Pomodoro cycle stages definition
type PomodoroStage = 'work' | 'short_break' | 'long_break';

export function TimerTab() {
  const [timers, setTimers] = useState<TimerInstance[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  
  // Custom picker state
  const [customHH, setCustomHH] = useState('00');
  const [customMM, setCustomMM] = useState('05');
  const [customSS, setCustomSS] = useState('00');
  const [timerLabel, setTimerLabel] = useState('');

  // Pomodoro cycle control states
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoStage, setPomoStage] = useState<PomodoroStage>('work');
  const [pomoCycleCount, setPomoCycleCount] = useState(1); // tracks 1 to 4 sessions
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);

  // Active timers ticking thread (1s delta)
  useEffect(() => {
    const handleTick = () => {
      setTimers(prevTimers => {
        let updated = false;
        const result = prevTimers.map(t => {
          if (t.isRunning && t.remainingSeconds > 0) {
            updated = true;
            const rem = t.remainingSeconds - 1;
            if (rem === 0) {
              // Trigger finished alarm bells procedural-style
              AudioSynth.startAlarmTone('classic');
              if ((window as any).AdManager?.incrementTimerCompletion()) {
                document.dispatchEvent(new CustomEvent('tempo_trigger_interstitial'));
              }
              return { ...t, remainingSeconds: 0, isRunning: false, isCompleted: true };
            }
            return { ...t, remainingSeconds: rem };
          }
          return t;
        });
        return updated ? result : prevTimers;
      });

      // Handle Pomodoro chain ticks
      if (pomoActive) {
        setPomoSecondsLeft(prev => {
          if (prev <= 1) {
            // cycle stage completes!
            AudioSynth.playHapticClick();
            AudioSynth.startAlarmTone('pulse');
            setTimeout(() => AudioSynth.stopAllActiveAlarmTones(), 2000);

            // Shift cycles
            if (pomoStage === 'work') {
              if (pomoCycleCount < 4) {
                setPomoStage('short_break');
                return 5 * 60; // 5 min
              } else {
                setPomoStage('long_break');
                return 15 * 60; // 15 min
              }
            } else if (pomoStage === 'short_break') {
              setPomoStage('work');
              setPomoCycleCount(curr => curr + 1);
              return 25 * 60;
            } else {
              // Long break finishes, cycle resets
              setPomoStage('work');
              setPomoCycleCount(1);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }
    };

    const interval = setInterval(handleTick, 1000);
    return () => clearInterval(interval);
  }, [pomoActive, pomoStage, pomoCycleCount]);

  // Sync timers to cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem('tempo_timers');
      if (cached) {
        setTimers(JSON.parse(cached).map((tc: any) => ({ ...tc, isRunning: false }))); // never auto restart on load
      }
    } catch {}
  }, []);

  const saveTimers = (list: TimerInstance[]) => {
    try {
      localStorage.setItem('tempo_timers', JSON.stringify(list));
    } catch {}
  };

  const handleCreateTimer = (hours: number, minutes: number, seconds: number, name = '') => {
    AudioSynth.playHapticClick();
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    if (totalSecs <= 0) return;

    if (timers.length >= 6) {
      alert('Maximum 6 concurrent timers allowed under Jony Ive design specs!');
      return;
    }

    const newTimer: TimerInstance = {
      id: Math.random().toString(),
      name: name.trim() || `Timer (${minutes}m)`,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      isRunning: false,
      isCompleted: false
    };

    const list = [...timers, newTimer];
    setTimers(list);
    saveTimers(list);
    setShowAddSheet(false);
  };

  const handleToggleTimer = (id: string) => {
    AudioSynth.playHapticClick();
    const updated = timers.map(t => {
      if (t.id === id) {
        // If completed, resetting first
        if (t.isCompleted) {
          AudioSynth.stopAllActiveAlarmTones();
          return { ...t, remainingSeconds: t.totalSeconds, isRunning: true, isCompleted: false };
        }
        return { ...t, isRunning: !t.isRunning };
      }
      return t;
    });
    setTimers(updated);
    saveTimers(updated);
  };

  const handleResetTimer = (id: string) => {
    AudioSynth.playHapticClick();
    AudioSynth.stopAllActiveAlarmTones();
    const updated = timers.map(t => 
      t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false, isCompleted: false } : t
    );
    setTimers(updated);
    saveTimers(updated);
  };

  const handleDeleteTimer = (id: string) => {
    AudioSynth.playHapticClick();
    AudioSynth.stopAllActiveAlarmTones();
    const updated = timers.filter(t => t.id !== id);
    setTimers(updated);
    saveTimers(updated);
  };

  const formatTimerDigits = (totalSecs: number) => {
    const hh = Math.floor(totalSecs / 3600);
    const mm = Math.floor((totalSecs % 3600) / 60);
    const ss = totalSecs % 60;

    const fH = hh > 0 ? `${String(hh).padStart(2, '0')}:` : '';
    const fM = String(mm).padStart(2, '0');
    const fS = String(ss).padStart(2, '0');

    return `${fH}${fM}:${fS}`;
  };

  const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minsOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const secsOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Quick Presets Trigger
  const PRESETS = [
    { label: '1 min', math: [0, 1, 0] },
    { label: '5 min', math: [0, 5, 0] },
    { label: '10 min', math: [0, 10, 0] },
    { label: 'Pomodoro', math: [0, 25, 0], tag: 'Work' },
    { label: '45 min', math: [0, 45, 0] },
    { label: '1 hr', math: [1, 0, 0] }
  ];

  return (
    <div className="p-4 py-6 max-w-lg mx-auto" id="timer-pane">
      {/* 1. Pomodoro Task Auto Chain Container */}
      <div className="bg-zinc-50/70 dark:bg-zinc-900/40 p-4 border border-zinc-200/20 dark:border-zinc-800/20 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-orange-500">
            <Flame size={18} />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider text-left">
              Pomodoro Chain Loop
            </h3>
          </div>
          {pomoActive && (
            <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 uppercase animate-pulse select-none">
              Active
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-left">
            <h4 className="text-3xl font-extralight tracking-tight font-sans text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatTimerDigits(pomoSecondsLeft)}
            </h4>
            <p className="text-xs text-orange-500 font-bold capitalize mt-1">
              Currently: {pomoStage.replace('_', ' ')}
            </p>
            <p className="text-[10px] text-zinc-400 font-medium">
              Daily Interval Block: #{pomoCycleCount}/4 Completed
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                AudioSynth.playHapticClick();
                setPomoActive(!pomoActive);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow"
            >
              {pomoActive ? 'Pause focus' : 'Initiate Session'}
            </button>
            <button
              onClick={() => {
                AudioSynth.playHapticClick();
                setPomoActive(false);
                setPomoStage('work');
                setPomoCycleCount(1);
                setPomoSecondsLeft(25 * 60);
              }}
              className="p-2 border border-orange-200 text-orange-500 rounded-xl hover:bg-orange-50 dark:border-orange-950 dark:hover:bg-orange-950/20"
              title="Reset Pomodoro session"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Timer Presets Container */}
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-3 text-left">
        Quick launch timer presets
      </span>
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleCreateTimer(p.math[0], p.math[1], p.math[2], p.label)}
            className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 text-center flex flex-col items-center justify-center gap-1 shadow-sm"
          >
            <span>{p.label}</span>
            {p.tag && <span className="text-[9px] text-orange-500 tracking-wide font-semibold uppercase">{p.tag}</span>}
          </button>
        ))}
      </div>

      {/* 3. Grid of multiple timers */}
      {timers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 text-zinc-450 select-none">
          <Clock size={40} className="mb-3 text-zinc-200 dark:text-zinc-800" />
          <h4 className="text-xs font-semibold text-zinc-400">No active countdowns</h4>
          <p className="text-[10px] text-zinc-400">Launch presets or create custom times below.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          <AnimatePresence initial={false}>
            {timers.map((timer) => {
              const fractionLeft = timer.remainingSeconds / timer.totalSeconds;
              const completed = timer.isCompleted;

              return (
                <motion.div
                  key={timer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex justify-between items-center transition-all ${
                    completed 
                      ? 'border-amber-500 bg-amber-500/5 animate-pulse' 
                      : 'border-zinc-200/60 dark:border-zinc-800/60'
                  }`}
                >
                  <div className="text-left flex-grow mr-4">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate mb-1">
                      {timer.name}
                    </h4>
                    <p className="text-3xl font-light tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50">
                      {completed ? 'Times Up!' : formatTimerDigits(timer.remainingSeconds)}
                    </p>
                    
                    {/* Tiny visual progress bar indicator under countdown */}
                    <div className="w-24 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden relative">
                      <div 
                        className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300 ${completed ? 'bg-amber-500 w-full' : 'bg-sky-500'}`}
                        style={{ width: `${fractionLeft * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Circle SVG Progress Ring loading indicators */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTimer(timer.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-all active:scale-95 ${
                        timer.isRunning 
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100' 
                          : 'bg-sky-500 text-white'
                      }`}
                      aria-label="Start / Pause toggle"
                    >
                      {timer.isRunning ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <button
                      onClick={() => handleResetTimer(timer.id)}
                      className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500"
                      title="Reset Timer countdown"
                    >
                      <RotateCcw size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteTimer(timer.id)}
                      className="p-2 border border-red-100 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-red-500"
                      title="Discard timer"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE CUSTOM TIMER FAB */}
      <button
        onClick={() => {
          AudioSynth.playHapticClick();
          setShowAddSheet(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
        aria-label="Open Custom Timer Creation"
      >
        <Plus size={24} />
      </button>

      {/* BOTTOM SHEET CUSTOM BUILD EDITOR */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSheet(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-6 z-50 pb-8 border-t border-zinc-200/40 dark:border-zinc-800/40"
              id="timer-custom-sheet"
            >
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Create Timer</h3>
                <button onClick={() => setShowAddSheet(false)} className="text-xs text-zinc-400">Cancel</button>
              </div>

              {/* IOS roller drum cylinder pickers */}
              <div className="grid grid-cols-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 gap-2 relative h-40 overflow-hidden select-none border border-zinc-100 dark:border-zinc-850">
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />

                {/* Hours List */}
                <div className="overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center h-full">
                  <div className="h-12" />
                  {hoursOptions.map(h => (
                    <button
                      key={h}
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setCustomHH(h);
                      }}
                      className={`h-10 w-full flex items-center justify-center snap-center text-xl font-light ${customHH === h ? 'text-sky-500 font-normal scale-110' : 'text-zinc-300 dark:text-zinc-700 scale-90'}`}
                    >
                      {h} h
                    </button>
                  ))}
                  <div className="h-12" />
                </div>

                {/* Minutes List */}
                <div className="overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center h-full">
                  <div className="h-12" />
                  {minsOptions.map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setCustomMM(m);
                      }}
                      className={`h-10 w-full flex items-center justify-center snap-center text-xl font-light ${customMM === m ? 'text-sky-500 font-normal scale-110' : 'text-zinc-300 dark:text-zinc-700 scale-90'}`}
                    >
                      {m} m
                    </button>
                  ))}
                  <div className="h-12" />
                </div>

                {/* Seconds List */}
                <div className="overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center h-full">
                  <div className="h-12" />
                  {secsOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setCustomSS(s);
                      }}
                      className={`h-10 w-full flex items-center justify-center snap-center text-xl font-light ${customSS === s ? 'text-sky-500 font-normal scale-110' : 'text-zinc-300 dark:text-zinc-700 scale-90'}`}
                    >
                      {s} s
                    </button>
                  ))}
                  <div className="h-12" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />
              </div>

              {/* Timer title label */}
              <div className="mt-4">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">Timer Label</label>
                <input
                  type="text"
                  maxLength={30}
                  placeholder="Egg boiling, Stretching"
                  value={timerLabel}
                  onChange={(e) => setTimerLabel(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                />
              </div>

              <button
                onClick={() => handleCreateTimer(parseInt(customHH), parseInt(customMM), parseInt(customSS), timerLabel)}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all mt-6"
              >
                Create Timer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
