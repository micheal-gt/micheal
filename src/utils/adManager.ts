/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AdSystemManager {
  private adFreeKey = 'tempo_adfree_expiry';
  private stopwatchCountKey = 'tempo_stopwatch_resets';
  private timerCountKey = 'tempo_timer_completions';

  init() {
    // Basic checks
    if (this.isAdFree()) {
      console.log('Tempo: Premium session active. Ads suspended.');
    }
  }

  isAdFree(): boolean {
    try {
      const expiry = localStorage.getItem(this.adFreeKey);
      if (!expiry) return false;
      return parseInt(expiry) > Date.now();
    } catch {
      return false;
    }
  }

  getDaysLeftAdFree(): number {
    try {
      const expiry = localStorage.getItem(this.adFreeKey);
      if (!expiry) return 0;
      const diff = parseInt(expiry) - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }

  unlockAdFree24h() {
    try {
      const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours
      localStorage.setItem(this.adFreeKey, expiry.toString());
      this.init();
    } catch (e) {
      console.error(e);
    }
  }

  resetPremium() {
    try {
      localStorage.removeItem(this.adFreeKey);
    } catch {}
  }

  // Session tallies
  incrementStopwatchReset(): boolean {
    if (this.isAdFree()) return false;
    try {
      let count = parseInt(localStorage.getItem(this.stopwatchCountKey) || '0');
      count++;
      localStorage.setItem(this.stopwatchCountKey, count.toString());
      if (count % 5 === 0) {
        return true; // Trigger Interstitial!
      }
    } catch {}
    return false;
  }

  incrementTimerCompletion(): boolean {
    if (this.isAdFree()) return false;
    try {
      let count = parseInt(localStorage.getItem(this.timerCountKey) || '0');
      count++;
      localStorage.setItem(this.timerCountKey, count.toString());
      if (count % 3 === 0) {
        return true; // Trigger Interstitial!
      }
    } catch {}
    return false;
  }

  // Integrators for Google AdSense or similar networks
  injectGoogleAds() {
    /*
      NOTE ON AD REPLACEMENT WITH REAL SERVICES (Google AdSense / Google Publisher Tags):
      ----------------------------------------------------------------------------------
      To plug in real advertisements, paste this snippet inside your HTML head:
      
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXX"
           crossorigin="anonymous"></script>

      And fill matching div targets on matching ad selectors:
      (adsbygoogle = window.adsbygoogle || []).push({});
    */
    if ((window as any).googletag) {
      console.log('Tempo: Real Google Publisher Tags discovered.');
      // Integrate GPT slots or dynamic refresh routines
    }
  }
}

export const AdManager = new AdSystemManager();
(window as any).AdManager = AdManager;
