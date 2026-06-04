/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Alarm } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import { AudioSynth } from '../utils/audio';
import { Plus, Trash, Copy, Bell, BellOff, Volume2, CloudMoon, Clock } from 'lucide-react';

interface AlarmsProps {
  accentColor: string;
}

const DEFAULT_ALARMS: Alarm[] = [
  { id: '1', time: '07:30', label: 'Sunrise Rise', repeatDays: [1, 2, 3, 4, 5], sound: 'gentle', snoozeDuration: 10, enabled: true },
  { id: '2', time: '09:00', label: 'Weekend Rest', repeatDays: [0, 6], sound: 'sine', snoozeDuration: 15, enabled: false }
];

export function AlarmsTab({ accentColor }: AlarmsProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState('07:00');

  // Alarm Editors Form State
  const [tempHH, setTempHH] = useState('07');
  const [tempMM, setTempMM] = useState('00');
  const [label, setLabel] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<Alarm['sound']>('gentle');
  const [snooze, setSnooze] = useState(10);

  // Load encrypted alarms
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tempo_alarms_encrypted');
      if (saved) {
        const raw = decryptData(saved);
        setAlarms(JSON.parse(raw));
      } else {
        // Fallback or Migration
        const rawPlain = localStorage.getItem('tempo_alarms');
        if (rawPlain) {
          setAlarms(JSON.parse(rawPlain));
        } else {
          setAlarms(DEFAULT_ALARMS);
          saveAlarms(DEFAULT_ALARMS);
        }
      }
    } catch {
      setAlarms(DEFAULT_ALARMS);
    }
  }, []);

  const saveAlarms = (updatedList: Alarm[]) => {
    try {
      const plain = JSON.stringify(updatedList);
      const enc = encryptData(plain);
      localStorage.setItem('tempo_alarms_encrypted', enc);
      localStorage.setItem('tempo_alarms', plain); // Backup
      
      // Update badge counts in standard environment
      const activeCount = updatedList.filter(a => a.enabled).length;
      document.dispatchEvent(new CustomEvent('tempo_badge_update', { detail: activeCount }));
    } catch (e) {
      console.error('Failed to store encrypted structures', e);
    }
  };

  const handleToggle = (id: string) => {
    AudioSynth.playHapticClick();
    const list = alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlarms(list);
    saveAlarms(list);
  };

  const handleDelete = (id: string) => {
    AudioSynth.playHapticClick();
    const list = alarms.filter(a => a.id !== id);
    setAlarms(list);
    saveAlarms(list);
  };

  const handleDuplicate = (id: string) => {
    AudioSynth.playHapticClick();
    const target = alarms.find(a => a.id === id);
    if (!target) return;
    const dupe: Alarm = {
      ...target,
      id: Math.random().toString(),
      label: `${target.label} (Copy)`
    };
    const list = [...alarms, dupe];
    setAlarms(list);
    saveAlarms(list);
  };

  const handleSaveAdd = () => {
    AudioSynth.playHapticClick();
    const finalTime = `${tempHH}:${tempMM}`;
    const newAlarm: Alarm = {
      id: Math.random().toString(),
      time: finalTime,
      label: label.trim() || 'Alarm',
      repeatDays,
      sound,
      snoozeDuration: snooze,
      enabled: true
    };

    // Sorted list chronologically
    const list = [...alarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time));
    setAlarms(list);
    saveAlarms(list);
    setShowEditor(false);

    // Reset default form state for next click
    setLabel('');
    setRepeatDays([1, 2, 3, 4, 5]);
  };

  // Day toggler chips helper
  const toggleDay = (day: number) => {
    AudioSynth.playHapticClick();
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter(d => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const getWeekDaysStr = (days: number[]) => {
    if (days.length === 0) return 'Never repeat';
    if (days.length === 7) return 'Every day';
    const equals = (a1: number[], a2: number[]) => a1.length === a2.length && a1.every(v => a2.includes(v));
    if (equals(days, [1, 2, 3, 4, 5])) return 'Weekdays';
    if (equals(days, [0, 6])) return 'Weekends';
    
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.sort().map(d => names[d]).join(', ');
  };

  // Sleep calculation helper
  const calculateSleepDuration = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);

    let hrs = eH - sH;
    let mins = eM - sM;

    if (mins < 0) {
      mins += 60;
      hrs -= 1;
    }
    if (hrs < 0) {
      hrs += 24;
    }

    return `${hrs}h ${mins}m`;
  };

  // Chronological highlight
  const getNextAlarm = () => {
    const enabled = alarms.filter(a => a.enabled);
    if (!enabled.length) return null;
    const nowStr = new Date().toTimeString().substring(0, 5);
    // Find first starting after current hour minutes
    const future = enabled.find(a => a.time.localeCompare(nowStr) > 0);
    return future || enabled[0]; // If none future, rolls to early morning next day
  };

  const nextActive = getNextAlarm();

  // Weekday alarms vs weekend ones classification
  const weekdaysAlarms = alarms.filter(a => a.repeatDays.some(d => d >= 1 && d <= 5));
  const weekendAlarms = alarms.filter(a => !a.repeatDays.some(d => d >= 1 && d <= 5));

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="p-4 py-6 max-w-lg mx-auto" id="alarms-pane">
      {/* Onboarding Sleep Bedtime calculator */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CloudMoon className="text-amber-500" size={18} />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <span>Sleep Mode</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1">Bedtime target</label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => {
                AudioSynth.playHapticClick();
                setBedtime(e.target.value);
              }}
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-100 border-none outline-none font-medium text-center"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1">Wake Time target</label>
            <input
              type="time"
              value={waketime}
              onChange={(e) => {
                AudioSynth.playHapticClick();
                setWaketime(e.target.value);
              }}
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-100 border-none outline-none font-medium text-center"
            />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-medium">Predicted sleep budget:</span>
          <span className="font-semibold text-sky-500 px-2 py-0.5 rounded-full bg-sky-100/30 dark:bg-sky-500/10 tracking-tight">
            {calculateSleepDuration(bedtime, waketime)}
          </span>
        </div>
      </div>

      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-400 select-none">
          <BellOff size={40} className="mb-4 text-zinc-300 dark:text-zinc-700" />
          <h4 className="text-sm font-semibold">No alarms set</h4>
          <p className="text-xs">Rest easy. Tap the plus icon to add one.</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {/* Chronological list */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-3">
              All Alarms ({alarms.length})
            </span>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {alarms.map((alarm) => {
                  const isNext = nextActive?.id === alarm.id;
                  return (
                    <motion.div
                      key={alarm.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className={`relative bg-white dark:bg-zinc-900 border overflow-hidden rounded-2xl p-4 flex justify-between items-center group transition-all duration-300 ${
                        isNext 
                          ? 'border-sky-500/60 dark:border-sky-500/40 shadow-sm shadow-sky-500/5' 
                          : 'border-zinc-200/50 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleDuplicate(alarm.id);
                      }}
                    >
                      {/* Swipe / hover hidden actions block */}
                      <div className="flex flex-col flex-grow text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-3xl font-light tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">
                            {alarm.time}
                          </h4>
                          {isNext && (
                            <span className="text-[10px] font-semibold text-white bg-sky-500 px-1.5 py-0.5 rounded tracking-wider uppercase scale-90 select-none">
                              Next
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-sky-500 select-none">
                          {getWeekDaysStr(alarm.repeatDays)}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-0.5 font-medium">
                          {alarm.label || 'No Name'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Status Slider iOS styled */}
                        <button
                          onClick={() => handleToggle(alarm.id)}
                          aria-label={`Toggle alarm at ${alarm.time}`}
                          className={`relative w-12 h-6 rounded-full flex items-center transition-colors p-0.5 duration-200 ${
                            alarm.enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'
                          }`}
                        >
                          <motion.div
                            layout
                            className="w-5 h-5 rounded-full bg-white shadow"
                            transition={{ type: 'spring', damping: 15 }}
                          />
                        </button>

                        {/* Dupe Option */}
                        <button
                          onClick={() => handleDuplicate(alarm.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 transition-all select-none"
                          title="Duplicate Alarm"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(alarm.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-lg text-red-500 transition-all"
                          title="Delete Alarm"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT ADD FAB BUTTON */}
      <button
        onClick={() => {
          AudioSynth.playHapticClick();
          // Seed standard default hour and minutes
          const time = new Date();
          setTempHH(String(time.getHours()).padStart(2, '0'));
          setTempMM(String(time.getMinutes()).padStart(2, '0'));
          setShowEditor(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
        aria-label="Create new Alarm"
      >
        <Plus size={24} />
      </button>

      {/* BOTTOM SHEET - ALARM EDITOR */}
      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditor(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-6 z-50 pb-8 border-t border-zinc-200/45 dark:border-zinc-800/45 max-h-[85vh] overflow-y-auto"
              id="alarm-editor-sheet"
            >
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Add Alarm</h3>
                <button 
                  onClick={() => setShowEditor(false)}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>

              {/* iOS-styled wheel picker for times */}
              <div className="flex items-center justify-center gap-3 font-extralight text-3xl tabular-nums h-44 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl relative overflow-hidden my-4 border border-zinc-100 dark:border-zinc-800">
                {/* 3D cylindrical shadow gradient masks */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />
                
                {/* Hours roller list */}
                <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center w-16" id="h-drum">
                  <div className="h-16" />
                  {hoursList.map(h => (
                    <button
                      key={h}
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setTempHH(h);
                      }}
                      className={`h-12 w-full flex items-center justify-center snap-center text-2xl transition-all ${
                        tempHH === h ? 'text-sky-500 font-normal scale-110' : 'text-zinc-300 dark:text-zinc-700 scale-90'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                  <div className="h-16" />
                </div>

                <span className="text-zinc-300 dark:text-zinc-700 font-thin -mt-1 select-none">:</span>

                {/* Minutes roller list */}
                <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center w-16" id="m-drum">
                  <div className="h-16" />
                  {minutesList.map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        AudioSynth.playHapticClick();
                        setTempMM(m);
                      }}
                      className={`h-12 w-full flex items-center justify-center snap-center text-2xl transition-all ${
                        tempMM === m ? 'text-sky-500 font-normal scale-110' : 'text-zinc-300 dark:text-zinc-700 scale-90'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <div className="h-16" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />
              </div>

              {/* Alarm configuration metadata */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-2">Repeat Days</label>
                  <div className="flex gap-2 justify-between">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                      const selected = repeatDays.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                            selected
                              ? 'bg-sky-500 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">Label (max 32 chars)</label>
                  <input
                    type="text"
                    maxLength={32}
                    placeholder="Wake up, stretch"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-sky-500/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">Snooze (min)</label>
                    <select
                      value={snooze}
                      onChange={(e) => setSnooze(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                    >
                      <option value={5}>5 Min</option>
                      <option value={10}>10 Min</option>
                      <option value={15}>15 Min</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">Tone</label>
                    <select
                      value={sound}
                      onChange={(e) => setSound(e.target.value as any)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                    >
                      <option value="gentle">Gentle Chords</option>
                      <option value="classic">Classic Beep</option>
                      <option value="pulse">Pulse Synth</option>
                      <option value="sine">Simple Pure Tone</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAdd}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all mt-6"
              >
                Save Alarm
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
