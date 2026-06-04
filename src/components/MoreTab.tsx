/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateSolar, SolarTimes } from '../utils/solar';
import { AudioSynth } from '../utils/audio';
import { SleepLog, ReactionRecord } from '../types';
import { Play, Pause, Compass, CompassIcon, Music, Flame, Zap, Calendar, Music4, ShieldAlert, Award, Star, ListCollapse } from 'lucide-react';

export function MoreTab() {
  const [activeMenu, setActiveMenu] = useState<'root' | 'sunrise' | 'focus' | 'reaction' | 'date_calc' | 'metronome' | 'sleep_debt'>('root');

  // 1. SUNRISE STATE
  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 }); // default London
  const [solarResult, setSolarResult] = useState<SolarTimes | null>(null);

  useEffect(() => {
    // Attempt location fetch
    if (activeMenu === 'sunrise' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.warn('Location blocked. Defaulting to Greenwich coordinates.')
      );
    }
  }, [activeMenu]);

  useEffect(() => {
    const sol = calculateSolar(coords.lat, coords.lng);
    setSolarResult(sol);
  }, [coords, activeMenu]);

  // 2. FOCUS AMBIENT MUSIC STATE
  const [isPlayingNoise, setIsPlayingNoise] = useState(false);
  const [noiseType, setNoiseType] = useState<'rain' | 'white' | 'cafe'>('rain');

  const handleNoiseToggle = (type: 'rain' | 'white' | 'cafe') => {
    AudioSynth.playHapticClick();
    if (isPlayingNoise && noiseType === type) {
      AudioSynth.stopFocusSound();
      setIsPlayingNoise(false);
    } else {
      setNoiseType(type);
      setIsPlayingNoise(true);
      AudioSynth.startFocusSound(type);
    }
  };

  // 3. REACTION GAME STATE
  const [reactionStage, setReactionStage] = useState<'idle' | 'waiting' | 'flash' | 'score' | 'ended'>('idle');
  const [reactionAttempts, setReactionAttempts] = useState<number[]>([]);
  const [reactionTime, setReactionTime] = useState(0);
  const [reactionScores, setReactionScores] = useState<ReactionRecord[]>([]);

  const reactionTimeoutRef = useRef<number | null>(null);
  const reactionStartTimestampRef = useRef<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tempo_reaction_leaderboard');
      if (saved) setReactionScores(JSON.parse(saved));
    } catch {}
  }, []);

  const startReactionGame = () => {
    AudioSynth.playHapticClick();
    setReactionAttempts([]);
    triggerReactionRound();
  };

  const triggerReactionRound = () => {
    setReactionStage('waiting');
    const delay = 1500 + Math.random() * 3000; // 1.5s - 4.5s
    reactionTimeoutRef.current = setTimeout(() => {
      // Flash screen!
      setReactionStage('flash');
      AudioSynth.playHapticClick();
      reactionStartTimestampRef.current = Date.now();
    }, delay) as any;
  };

  const handleReactionTap = () => {
    if (reactionStage === 'waiting') {
      // Early tap is a foul
      AudioSynth.playHapticClick();
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      alert('Foul trigger! You clicked too early! Resetting round...');
      setReactionStage('idle');
    } else if (reactionStage === 'flash') {
      const tappedMs = Date.now() - reactionStartTimestampRef.current;
      AudioSynth.playHapticClick();
      const updated = [...reactionAttempts, tappedMs];
      setReactionAttempts(updated);
      setReactionTime(tappedMs);

      if (updated.length >= 5) {
        setReactionStage('ended');
        const avg = Math.round(updated.reduce((a, b) => a + b, 0) / 5);
        // Write record to local storage
        const newRecord: ReactionRecord = { id: Math.random().toString(), scoreMs: avg, timestamp: Date.now() };
        const board = [...reactionScores, newRecord].sort((a, b) => a.scoreMs - b.scoreMs).slice(0, 10);
        setReactionScores(board);
        try { localStorage.setItem('tempo_reaction_leaderboard', JSON.stringify(board)); } catch {}
      } else {
        setReactionStage('score');
      }
    }
  };

  // 4. DATE CALCULATIONS
  const [d1, setD1] = useState('2026-06-04');
  const [d2, setD2] = useState('2026-06-15');
  const [calcResultDays, setCalcResultDays] = useState<number | null>(null);

  const calculateDaysBetween = () => {
    AudioSynth.playHapticClick();
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diff = Math.abs(date2.getTime() - date1.getTime());
    setCalcResultDays(Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // 5. METRONOME STATE
  const [bpm, setBpm] = useState(120);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);

  const metronomeIntervalRef = useRef<number | null>(null);

  // Handle metronome sounds ticking
  useEffect(() => {
    if (isMetronomeRunning) {
      const tick = () => {
        AudioSynth.playMetronomeClick();
      };
      const intervalMs = (60 / bpm) * 1000;
      metronomeIntervalRef.current = setInterval(tick, intervalMs) as any;
    } else {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomeRunning, bpm]);

  const handleTapTempo = () => {
    AudioSynth.playHapticClick();
    const now = Date.now();
    const updated = [...tapTimestamps, now].slice(-4); // keep last 4 taps
    setTapTimestamps(updated);

    if (updated.length >= 2) {
      const deltas = [];
      for (let i = 1; i < updated.length; i++) {
        deltas.push(updated[i] - updated[i - 1]);
      }
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const calculatedBpm = Math.round(60000 / avgDelta);
      if (calculatedBpm >= 20 && calculatedBpm <= 300) {
        setBpm(calculatedBpm);
      }
    }
  };

  // 6. SLEEP DEBT TRACKER STATE
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepRating, setSleepRating] = useState(4);
  const [sleepHistory, setSleepHistory] = useState<SleepLog[]>([]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('tempo_sleep_debt_logs');
      if (cached) setSleepHistory(JSON.parse(cached));
    } catch {}
  }, []);

  const handleAddSleepLog = () => {
    AudioSynth.playHapticClick();
    const log: SleepLog = {
      id: Math.random().toString(),
      date: new Date().toISOString().substring(0, 10),
      hours: sleepHours,
      quality: sleepRating
    };
    const updated = [log, ...sleepHistory].slice(0, 7); // keep last 7 days details
    setSleepHistory(updated);
    try { localStorage.setItem('tempo_sleep_debt_logs', JSON.stringify(updated)); } catch {}
    alert('Today\'s sleep record successfully logged!');
  };

  const getSleepDebtInsight = () => {
    if (sleepHistory.length === 0) return 'Complete 3 days sleep log to generate debt analysis.';
    const avg = sleepHistory.reduce((acc, curr) => acc + curr.hours, 0) / sleepHistory.length;
    if (avg >= 7.5) {
      return 'Superb rest balance! You are operating with healthy restorative sleep debt metrics.';
    } else if (avg >= 6) {
      return 'Borderline exhaustion levels detected. Recommend targeting 8.0 hours tonight to eliminate subtle operational debt.';
    } else {
      return 'High sleep debt hazard! High risk of coordination slips. Schedule mandatory wind down sleep pairs immediately.';
    }
  };

  return (
    <div className="p-4 py-6 max-w-lg mx-auto" id="more-pane">
      <AnimatePresence mode="wait">
        
        {/* ROOT MAIN MORE DIRECTORIES */}
        {activeMenu === 'root' && (
          <motion.div
            key="root"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2 px-1">
              Select Precision Utility
            </span>

            <div className="grid grid-cols-2 gap-3 pb-24">
              
              {/* Sunrise */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('sunrise'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                  <Compass size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Sunrise Arc</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">NOAA Solar coordinate twilight visualizer.</p>
                </div>
              </button>

              {/* Focus */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('focus'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                  <Music4 size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Ambient Synthesizer</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Procedural rainfall & cafe hubbub generator.</p>
                </div>
              </button>

              {/* Reaction */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('reaction'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Reaction Timer</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Test visual delay latency. Local leaderboards.</p>
                </div>
              </button>

              {/* Date Calc */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('date_calc'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Calendar Delta</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Calculate spans between dates & milestones.</p>
                </div>
              </button>

              {/* Metronome */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('metronome'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Music size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">BPM Metronome</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Visual rhythmic pulse + synthetic clicking.</p>
                </div>
              </button>

              {/* Sleep debt logs */}
              <button
                onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('sleep_debt'); }}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all shadow-sm active:scale-95"
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Star size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Rest & Sleep Debt</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">Log rest hours. Chart sleep quality indicators.</p>
                </div>
              </button>

            </div>
          </motion.div>
        )}

        {/* 1. SUNRISE ARC SCREEN */}
        {activeMenu === 'sunrise' && (
          <motion.div
            key="sunrise"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-805 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Astro Sunrise Arc</h3>
              <button onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('root'); }} className="text-xs text-sky-500 font-semibold">Back</button>
            </div>

            {solarResult && (
              <div className="space-y-6">
                {/* SVG Solar arc projection */}
                <div className="relative h-32 flex items-end justify-center select-none bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl p-4 overflow-hidden mb-4">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
                    {/* Sky path arc */}
                    <path
                      d="M 10 46 A 40 40 0 0 1 90 46"
                      fill="none"
                      stroke="#E5E5EA"
                      strokeDasharray="4 4"
                      className="stroke-zinc-300 dark:stroke-zinc-700"
                    />
                    
                    {/* Active sun place along coordinate path */}
                    {solarResult.isDay && (
                      <circle
                        cx={10 + (80 * (solarResult.sunAltPct / 100))}
                        cy={25 - Math.sin((solarResult.sunAltPct / 100) * Math.PI) * 15}
                        r="3.5"
                        fill="#FF9500"
                        className="animate-pulse shadow-lg"
                      />
                    )}
                  </svg>
                  <div className="flex justify-between w-full text-[10px] text-zinc-400 font-mono">
                    <span>Rise {solarResult.sunrise}</span>
                    <span>Set {solarResult.sunset}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Golden Hour</span>
                    <p className="text-lg font-light mt-1">{solarResult.goldenHour}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Civil Twilight</span>
                    <p className="text-lg font-light mt-1">{solarResult.twilight}</p>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 leading-normal p-1 italic">
                  *Astro variables calculated completely client side using NOAA Kepler solar models.
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 2. FOCUS AMBIENT MUSIC COMPONENT */}
        {activeMenu === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-805 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Focus Synthesizer</h3>
              <button 
                onClick={() => { 
                  AudioSynth.playHapticClick(); 
                  AudioSynth.stopFocusSound();
                  setIsPlayingNoise(false);
                  setActiveMenu('root'); 
                }} 
                className="text-xs text-sky-500 font-semibold"
              >
                Back
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Generate comforting background low-frequency white noise, falling rainfall, or soft café murmurs synthetically using browser oscillators. No external audio files downloaded.
            </p>

            <div className="space-y-3">
              {(['rain', 'white', 'cafe'] as const).map(type => {
                const active = isPlayingNoise && noiseType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleNoiseToggle(type)}
                    className={`w-full p-4.5 rounded-2xl border flex justify-between items-center transition-all ${
                      active 
                        ? 'border-violet-500 bg-violet-500/5' 
                        : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-sm capitalize text-zinc-800 dark:text-zinc-100">
                        {type === 'rain' ? '🌦️ Brownian Rain rumbles' : (type === 'cafe' ? '☕ Soft Cafe murmur' : '💨 Gaussian White Noise')}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {type === 'rain' ? 'Deep procedural rain sweeps & gusts' : (type === 'cafe' ? 'Distant clutter clicks + low frequency hum' : 'Even frequency distribution blocking noise')}
                      </p>
                    </div>
                    
                    <div className={`p-2.5 rounded-full ${active ? 'bg-violet-500 text-white shadow' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-450'}`}>
                      {active ? <Pause size={14} /> : <Play size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 3. REACTION DELAY GAME SCREEN */}
        {activeMenu === 'reaction' && (
          <motion.div
            key="reaction"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-805 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Reaction delay game</h3>
              <button 
                onClick={() => { 
                  AudioSynth.playHapticClick(); 
                  if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
                  setActiveMenu('root'); 
                }} 
                className="text-xs text-sky-500 font-semibold"
              >
                Back
              </button>
            </div>

            {/* Tap Targets game panels */}
            {reactionStage === 'idle' && (
              <div className="text-center py-6">
                <ShieldAlert size={40} className="mx-auto text-sky-500 mb-3" />
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Test Your Sensory Taps</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-2 leading-relaxed">
                  Tap when the black box below suddenly flashes electric green. We calculate average reflex latency over 5 attempts.
                </p>
                <button
                  onClick={startReactionGame}
                  className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-5 py-2.5 font-bold text-xs mt-6 transition-all"
                >
                  Launch Test Session
                </button>
              </div>
            )}

            {(reactionStage === 'waiting' || reactionStage === 'flash' || reactionStage === 'score') && (
              <div className="space-y-4">
                <div 
                  onClick={handleReactionTap}
                  className={`w-full h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-75 select-none ${
                    reactionStage === 'flash' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-zinc-950 text-zinc-400'
                  }`}
                >
                  {reactionStage === 'waiting' && <span className="text-xs tracking-wider animate-pulse uppercase">Wait for color change...</span>}
                  {reactionStage === 'flash' && <span className="text-xl font-black uppercase tracking-widest scale-105">TAP NOW!</span>}
                  {reactionStage === 'score' && (
                    <div className="text-center">
                      <span className="text-3xl font-mono tabular-nums text-white font-bold">{reactionTime} ms</span>
                      <p className="text-[10px] text-zinc-400 tracking-wide uppercase mt-2">Tap box to load next round ({reactionAttempts.length}/5)</p>
                    </div>
                  )}
                </div>

                {reactionStage === 'score' && (
                  <button
                    onClick={() => {
                      AudioSynth.playHapticClick();
                      triggerReactionRound();
                    }}
                    className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 rounded-xl transition-all"
                  >
                    Next Round
                  </button>
                )}
              </div>
            )}

            {reactionStage === 'ended' && (
              <div className="text-center space-y-4 py-3">
                <Award size={36} className="mx-auto text-emerald-500" />
                <h4 className="text-lg font-bold">Reflex Delay complete</h4>
                <p className="text-xs text-zinc-400">
                  Daily Score computed: <span className="font-mono font-bold text-sky-500 text-lg">{reactionAttempts.length > 0 ? Math.round(reactionAttempts.reduce((a,b)=>a+b,0)/5) : 0} ms</span>
                </p>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl max-w-xs mx-auto text-left">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">TOP 10 LEADERS</span>
                  <div className="space-y-1 text-xs">
                    {reactionScores.map((score, i) => (
                      <div key={score.id} className="flex justify-between font-mono py-1 border-b border-zinc-100 dark:border-zinc-900/40">
                        <span className="text-zinc-400">#{i+1} Record:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">{score.scoreMs} ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startReactionGame}
                  className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-5 py-2.5 font-bold text-xs"
                >
                  Retry Reflexes
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* 4. DATE CALCULATOR SCREEN */}
        {activeMenu === 'date_calc' && (
          <motion.div
            key="date_calc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-850 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Date Span Calculators</h3>
              <button onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('root'); }} className="text-xs text-sky-500 font-semibold">Back</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Starting point Date</label>
                <input
                  type="date"
                  value={d1}
                  onChange={(e) => setD1(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl text-sm border-none outline-none dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Target Milestone Date</label>
                <input
                  type="date"
                  value={d2}
                  onChange={(e) => setD2(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl text-sm border-none outline-none dark:text-zinc-200"
                />
              </div>

              <button
                onClick={calculateDaysBetween}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all mt-2"
              >
                Compute Days Span
              </button>

              {calcResultDays !== null && (
                <div className="p-4 bg-sky-500/10 text-sky-500 rounded-xl text-center select-all">
                  <span className="text-xs font-semibold">Calculated Calendar Delta:</span>
                  <h4 className="text-4xl font-extralight font-mono tracking-tight mt-1">{calcResultDays} Days</h4>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 5. METRONOME COMPONENT */}
        {activeMenu === 'metronome' && (
          <motion.div
            key="metronome"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-850 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Aesthetic Metronome</h3>
              <button 
                onClick={() => { 
                  AudioSynth.playHapticClick(); 
                  setIsMetronomeRunning(false); 
                  setActiveMenu('root'); 
                }} 
                className="text-xs text-sky-500 font-semibold"
              >
                Back
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
              {/* Visual pulsing circle */}
              <motion.div
                animate={isMetronomeRunning ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={isMetronomeRunning ? { repeat: Infinity, duration: 60 / bpm, ease: 'easeInOut' } : {}}
                className="w-24 h-24 rounded-full border border-sky-500/30 flex items-center justify-center relative bg-sky-500/5 select-none"
              >
                <div className="w-4 h-4 rounded-full bg-sky-500" />
              </motion.div>

              <div className="w-full space-y-2 select-none">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Slow</span>
                  <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{bpm} BPM</span>
                  <span>Presto</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={bpm}
                  onChange={(e) => {
                    AudioSynth.playHapticClick();
                    setBpm(parseInt(e.target.value));
                  }}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 appearance-none rounded-lg accent-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => {
                    AudioSynth.playHapticClick();
                    setIsMetronomeRunning(!isMetronomeRunning);
                  }}
                  className={`py-3.5 rounded-xl text-xs font-bold transition-all ${
                    isMetronomeRunning ? 'bg-zinc-850 hover:bg-zinc-900 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white shadow'
                  }`}
                >
                  {isMetronomeRunning ? 'Halt beat' : 'Trigger click'}
                </button>
                <button
                  onClick={handleTapTempo}
                  className="border border-zinc-200 dark:border-zinc-800 font-semibold rounded-xl text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850"
                >
                  Tap Tempo Beat
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 6. SLEEP DEBT TRACKER SCREEN */}
        {activeMenu === 'sleep_debt' && (
          <motion.div
            key="sleep_debt"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-left bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-zinc-850 shadow-sm"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Sleep Debt Logs</h3>
              <button onClick={() => { AudioSynth.playHapticClick(); setActiveMenu('root'); }} className="text-xs text-sky-500 font-semibold">Back</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Hours Rested</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value) || 7)}
                    className="w-full bg-zinc-55 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm outline-none dark:text-zinc-200 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Qualities rating</label>
                  <div className="flex gap-1 justify-center bg-zinc-55 dark:bg-zinc-955 p-3 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => { AudioSynth.playHapticClick(); setSleepRating(star); }}
                        className={`text-sm ${sleepRating >= star ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`}
                        aria-label={`Rate quality ${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddSleepLog}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all"
              >
                Log Today's sleep
              </button>

              {/* Weekly Chart visual list */}
              {sleepHistory.length > 0 && (
                <div className="space-y-3 pt-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sleep metrics history</span>
                  
                  {/* CSS flex vertical bar chart representation */}
                  <div className="flex items-end h-24 gap-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 overflow-hidden select-none">
                    {sleepHistory.map((log) => {
                      const heightPct = Math.max(10, (log.hours / 12) * 100);
                      return (
                        <div key={log.id} className="flex-1 flex flex-col items-center h-full justify-end">
                          <span className="text-[8px] text-zinc-400 tabular-nums">{log.hours}h</span>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t-sm bg-sky-500/50 hover:bg-sky-500 transition-all`}
                          />
                          <span className="text-[7px] text-zinc-400 mt-1">{log.date.split('-')[2]}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-semibold text-zinc-650 leading-relaxed text-left flex items-start gap-2">
                    <Star size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p>{getSleepDebtInsight()}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
