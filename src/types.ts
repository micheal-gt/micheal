/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Alarm {
  id: string;
  time: string; // HH:MM
  label: string;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  sound: 'sine' | 'classic' | 'pulse' | 'gentle';
  snoozeDuration: number; // 5, 10, 15 minutes
  enabled: boolean;
}

export interface SavedTimer {
  id: string;
  name: string;
  durationSeconds: number; // Initial duration
  remainingSeconds: number;
  isRunning: boolean;
}

export interface CitySelection {
  name: string;
  country: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface ReactionRecord {
  id: string;
  scoreMs: number;
  timestamp: number;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  quality: number; // 1 to 5
}

export interface AppPreferences {
  accentColor: string; // HEX code
  clockFaceStyle: 'Minimal' | 'Classic' | 'Bold';
  use12hr: boolean;
  volume: number; // 0 to 100
  vibration: boolean;
  premiumActive: boolean;
  premiumExpiry: number; // timestamp
}
