/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SyntheticAudioPlayer {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioWorkletNode | ScriptProcessorNode | null = null;
  private activeAlarmOscillators: OscillatorNode[] = [];
  private activeAlarmGains: GainNode[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getVolumeMultiplier(): number {
    try {
      const volStr = localStorage.getItem('tempo_volume') || '80';
      return parseFloat(volStr) / 100;
    } catch {
      return 0.8;
    }
  }

  // Plays a quick, premium-sounding synthetic haptic click
  playHapticClick() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15 * this.getVolumeMultiplier(), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio click failed', e);
    }
  }

  // Plays the metronome click
  playMetronomeClick() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.3 * this.getVolumeMultiplier(), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Metronome click failed', e);
    }
  }

  // Triggers procedural alarm audio (repeated tone chords)
  startAlarmTone(soundType: 'sine' | 'classic' | 'pulse' | 'gentle') {
    this.stopAllActiveAlarmTones();
    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.getVolumeMultiplier(), ctx.currentTime);
      masterGain.connect(ctx.destination);

      const playBeep = () => {
        const now = ctx.currentTime;
        // Create chord frequencies depending on sound type
        const freqs = 
          soundType === 'gentle' ? [220, 330, 440] :
          soundType === 'classic' ? [880, 1200] :
          soundType === 'pulse' ? [523.25, 659.25, 783.99] : // C major
          [440, 554.37, 659.25]; // A major

        const subOscs: OscillatorNode[] = [];
        const timerGain = ctx.createGain();

        timerGain.gain.setValueAtTime(0.3, now);
        // Beep duration depending on style
        const beepLen = soundType === 'pulse' ? 0.15 : 0.4;
        timerGain.gain.setValueAtTime(0.3, now);
        timerGain.gain.exponentialRampToValueAtTime(0.001, now + beepLen);

        freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          osc.type = soundType === 'gentle' ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(timerGain);
          osc.start(now);
          osc.stop(now + beepLen);
          this.activeAlarmOscillators.push(osc);
        });

        timerGain.connect(masterGain);
      };

      // Periodic trigger block
      const intervalSec = soundType === 'pulse' ? 0.25 : 1.0;
      const beepInterval = setInterval(() => {
        if (this.activeAlarmOscillators.length === 0) {
          clearInterval(beepInterval);
          return;
        }
        playBeep();
      }, intervalSec * 1000);

      // Play initial beep
      playBeep();

      // Hook so we can clear the interval by clearing oscillators array
      this.activeAlarmGains.push(masterGain as any);
    } catch (e) {
      console.warn('Alarm tone failed', e);
    }
  }

  stopAllActiveAlarmTones() {
    this.activeAlarmOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.activeAlarmOscillators = [];
    this.activeAlarmGains = [];
  }

  // Procedural focus noise generation (Brown Noise / Cafe Hubbub / White Noise)
  startFocusSound(type: 'rain' | 'white' | 'cafe') {
    this.stopFocusSound();
    try {
      const ctx = this.getContext();
      const sampleRate = ctx.sampleRate;
      const bufferSize = 2 * sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Brownian low-frequency approximation for rain rumble effect
          output[i] = (lastOut + (0.025 * white)) / 1.025;
          lastOut = output[i];
          output[i] *= 3.5;
        } else if (type === 'cafe') {
          // Low hum drone buffer
          output[i] = (lastOut + (0.003 * white)) / 1.003;
          lastOut = output[i];
          output[i] *= 5.0;
        } else {
          output[i] = white * 0.5; // pure white noise
        }
      }

      // Source setup
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 350 : (type === 'cafe' ? 600 : 1500), ctx.currentTime);

      // Volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15 * this.getVolumeMultiplier(), ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource as any;

      // For Cafe, sound extra procedural details (cutlery click high pitch beeps occasionally)
      if (type === 'cafe') {
        const interval = setInterval(() => {
          if ((this.ambientSource as any) !== noiseSource) {
            clearInterval(interval);
            return;
          }
          if (Math.random() > 0.4) this.playCafeUtensilsClatter();
        }, 1200);
      }
    } catch (e) {
      console.warn('Focus ambient sound failed', e);
    }
  }

  private playCafeUtensilsClatter() {
    try {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 1000, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.005 * this.getVolumeMultiplier(), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  stopFocusSound() {
    if (this.ambientSource) {
      try {
        (this.ambientSource as any).stop();
      } catch {}
      this.ambientSource = null;
    }
  }
}

export const AudioSynth = new SyntheticAudioPlayer();
