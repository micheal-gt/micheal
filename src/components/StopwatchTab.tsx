/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Flag, Share2, BarChart2 } from 'lucide-react';
import { AudioSynth } from '../utils/audio';

interface Lap {
  lapNum: number;
  splitTime: number; // MS
  cumulative: number; // MS
}

export function StopwatchTab() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeState, setTimeState] = useState(0); // MS
  const [laps, setLaps] = useState<Lap[]>([]);
  const [showChart, setShowChart] = useState(false);

  const startTimestampRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Smooth millisecond-accurate update
  useEffect(() => {
    if (isRunning) {
      const update = () => {
        if (startTimestampRef.current !== null) {
          const delta = Date.now() - startTimestampRef.current;
          setTimeState(accumulatedTimeRef.current + delta);
        }
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  const handleStartPause = () => {
    AudioSynth.playHapticClick();
    if (!isRunning) {
      startTimestampRef.current = Date.now();
      setIsRunning(true);
    } else {
      accumulatedTimeRef.current = timeState;
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    AudioSynth.playHapticClick();
    // Safely increment ad stopwatch count
    if ((window as any).AdManager?.incrementStopwatchReset()) {
      document.dispatchEvent(new CustomEvent('tempo_trigger_interstitial'));
    }

    setIsRunning(false);
    setTimeState(0);
    accumulatedTimeRef.current = 0;
    startTimestampRef.current = null;
    setLaps([]);
  };

  const handleLap = () => {
    AudioSynth.playHapticClick();
    if (!isRunning) return;

    const lapNum = laps.length + 1;
    const cumulative = timeState;
    const splitTime = laps.length === 0 ? cumulative : cumulative - laps[0].cumulative;

    // Insert new lap on top
    setLaps([{ lapNum, splitTime, cumulative }, ...laps]);
  };

  // Calculations for Best / Worst
  const getLapHighlights = () => {
    if (laps.length < 2) return { bestId: -1, worstId: -1 };
    let minTime = Infinity;
    let maxTime = -Infinity;
    let bestNum = -1;
    let worstNum = -1;

    laps.forEach(l => {
      if (l.splitTime < minTime) {
        minTime = l.splitTime;
        bestNum = l.lapNum;
      }
      if (l.splitTime > maxTime) {
        maxTime = l.splitTime;
        worstNum = l.lapNum;
      }
    });

    return { bestId: bestNum, worstId: worstNum };
  };

  const { bestId, worstId } = getLapHighlights();

  const formatTime = (totalMs: number) => {
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10); // Display double digits centiseconds

    const fM = String(mins).padStart(2, '0');
    const fS = String(secs).padStart(2, '0');
    const fMs = String(ms).padStart(2, '0');

    return `${fM}:${fS}.${fMs}`;
  };

  const handleShare = () => {
    AudioSynth.playHapticClick();
    if (!laps.length) return;
    const formatted = laps.map(l => 
      `Lap ${l.lapNum}: ${formatTime(l.splitTime)} (Total: ${formatTime(l.cumulative)})`
    ).join('\n');

    const shareText = `Tempo Stopwatch Sessions:\nTotal Time: ${formatTime(timeState)}\n\nLaps:\n${formatted}`;
    navigator.clipboard.writeText(shareText);

    alert('Session laps copied to clipboard!');
  };

  // Find max splits for CSS bar scale calculations
  const maxSplit = laps.length > 0 ? Math.max(...laps.map(l => l.splitTime)) : 100;

  return (
    <div className="p-4 py-6 max-w-lg mx-auto" id="stopwatch-pane">
      {/* Centred Displays */}
      <div className="flex flex-col items-center justify-center py-8 text-center sticky top-0 bg-white/60 dark:bg-black/40 backdrop-blur-md z-10 border-b border-zinc-100 dark:border-zinc-900 mb-6">
        <h2 className="text-6xl font-light tracking-tight font-sans text-zinc-950 dark:text-zinc-50 tabular-nums">
          {formatTime(timeState)}
        </h2>

        {/* Animated dynamic running scale bar track */}
        <div className="w-full max-w-xs h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-6 overflow-hidden relative">
          {isRunning && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute inset-0 bg-sky-500 w-1/3 rounded-full"
            />
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Reset button or Lap */}
        <button
          onClick={isRunning ? handleLap : handleReset}
          disabled={timeState === 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center border font-medium text-sm transition-all shadow active:scale-95 disabled:opacity-20 ${
            isRunning 
              ? 'bg-zinc-100/70 border-zinc-300 text-zinc-700 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200' 
              : 'bg-red-50/70 border-red-200 text-red-500 dark:bg-red-950/20 dark:border-red-900/60'
          }`}
          aria-label={isRunning ? "Trigger Lap" : "Reset Timer"}
        >
          {isRunning ? <Flag size={18} /> : <RotateCcw size={18} />}
        </button>

        {/* Start / Pause */}
        <button
          onClick={handleStartPause}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg font-semibold transition-all hover:scale-105 active:scale-95 ${
            isRunning ? 'bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-950' : 'bg-sky-500 hover:bg-sky-600'
          }`}
          aria-label={isRunning ? "Pause Stopwatch" : "Start Stopwatch"}
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} />}
        </button>

        {/* Chart popup inline slider */}
        <button
          onClick={() => {
            AudioSynth.playHapticClick();
            setShowChart(!showChart);
          }}
          disabled={laps.length === 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all shadow active:scale-95 disabled:opacity-20 ${
            showChart 
              ? 'bg-sky-500 border-sky-600 text-white' 
              : 'bg-zinc-100/70 border-zinc-300 text-zinc-700 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200'
          }`}
          aria-label="Toggle Lap Visual Charts"
        >
          <BarChart2 size={18} />
        </button>
      </div>

      {/* Sharing options */}
      {laps.length > 0 && (
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl mb-4 text-xs">
          <span className="text-zinc-400 font-medium">Session recorded {laps.length} Laps</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 font-bold text-sky-500 hover:text-sky-600"
          >
            <Share2 size={13} />
            <span>Copy Session</span>
          </button>
        </div>
      )}

      {/* Lap Chart Panel */}
      <AnimatePresence>
        {showChart && laps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 mb-4 select-none overflow-hidden"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 text-left mb-3">Split Times Comparison</h4>
            <div className="flex items-end h-28 gap-2 px-2 overflow-x-auto pt-4 min-w-[200px]">
              {/* Plot laps ascending */}
              {[...laps].reverse().map((lap) => {
                const heightPct = Math.max(12, (lap.splitTime / maxSplit) * 100);
                const isBest = lap.lapNum === bestId;
                const isWorst = lap.lapNum === worstId;

                const barColor = isBest ? 'bg-emerald-500' : (isWorst ? 'bg-amber-500' : 'bg-sky-500/50 dark:bg-zinc-750');

                return (
                  <div key={lap.lapNum} className="flex-1 flex flex-col items-center h-full justify-end">
                    <span className="text-[9px] text-zinc-400 tabular-nums mb-1">{formatTime(lap.splitTime).replace('00:', '')}</span>
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${barColor}`} 
                    />
                    <span className="text-[9px] text-zinc-500 mt-1">L{lap.lapNum}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lap List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
        <AnimatePresence initial={false}>
          {laps.map((lap) => {
            const isBest = lap.lapNum === bestId;
            const isWorst = lap.lapNum === worstId;

            let badgeClass = 'text-zinc-400 dark:text-zinc-500';
            let rowBorder = 'border-zinc-100 dark:border-zinc-900';
            if (isBest) {
              badgeClass = 'text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded';
              rowBorder = 'border-emerald-500/20 bg-emerald-500/5';
            } else if (isWorst) {
              badgeClass = 'text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded';
              rowBorder = 'border-amber-500/20 bg-amber-500/5';
            }

            return (
              <motion.div
                key={lap.lapNum}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex justify-between items-center text-sm p-3.5 border rounded-xl ${rowBorder}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-300 dark:text-zinc-640">#{String(lap.lapNum).padStart(3, '0')}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${badgeClass}`}>
                    {isBest ? 'Fastest' : (isWorst ? 'Slowest' : `Lap ${lap.lapNum}`)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-100 tabular-nums">
                    {formatTime(lap.splitTime)}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 tabular-nums">
                    Cumulative: {formatTime(lap.cumulative)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
