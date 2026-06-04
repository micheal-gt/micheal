/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, ChevronRight, ChevronLeft } from 'lucide-react';

const TIP_CARDS = [
  {
    title: "Considered Experience",
    text: "Long-press the Clock face to customize numerals, style density, and enable sub-second sweeping.",
    icon: "⏱️"
  },
  {
    title: "Procedural Soundscapes",
    text: "Under Focus Mode, generate real-time ambient rain, white noise, and café murmurs generated entirely in browser.",
    icon: "🎧"
  },
  {
    title: "Snooze & Alarms",
    text: "Swipe any alarm to delete it immediately. Set Bedtime to calculate exact sleep spans prior to rest.",
    icon: "🛌"
  }
];

interface OnboardingProps {
  onOnboarded: () => void;
}

export function Onboarding({ onOnboarded }: OnboardingProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (index < TIP_CARDS.length - 1) {
        setIndex(prev => prev + 1);
      } else {
        // auto dismiss after final card has completed
        handleDismiss();
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [index]);

  const handleDismiss = () => {
    try {
      localStorage.setItem('tempo_onboarded', 'true');
    } catch {}
    onOnboarded();
  };

  const currentTip = TIP_CARDS[index];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-2xl p-5 z-40 backdrop-blur-xl bg-white/90 dark:bg-zinc-950/90"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2 text-xs font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center gap-1">
            <Info size={12} />
            <span>Introducing Tempo</span>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1"
          aria-label="Dismiss tips"
        >
          <X size={16} />
        </button>
      </div>

      <div className="relative h-28 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex gap-4 items-center pt-2"
          >
            <span className="text-4xl select-none" role="img" aria-label="decor">{currentTip.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{currentTip.title}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                {currentTip.text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
        <div className="flex gap-1.5">
          {TIP_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-4 bg-sky-500' : 'w-1.5 bg-zinc-200 dark:bg-zinc-750'
              }`}
              aria-label={`Go to tip ${i + 1}`}
            />
          ))}
        </div>
        
        <div className="flex gap-1">
          {index > 0 && (
            <button 
              onClick={() => setIndex(prev => prev - 1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {index < TIP_CARDS.length - 1 ? (
            <button 
              onClick={() => setIndex(prev => prev + 1)}
              className="p-1.5 rounded-lg text-center bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold px-2.5 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button 
              onClick={handleDismiss}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
