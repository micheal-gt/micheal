/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SolarTimes {
  sunrise: string; // "HH:MM"
  sunset: string; // "HH:MM"
  goldenHour: string; // "HH:MM"
  twilight: string; // "HH:MM"
  isDay: boolean;
  sunAltPct: number; // Percentage elevation (0 to 100) indicating where in the sky arc the sun is
}

/**
 * Calculates local sunrise, sunset civil twilight, and golden hours using standard astronomical equations.
 * Coordinates are provided by browser geolocation or fall back to Greenwich coordinates.
 */
export function calculateSolar(lat: number, lng: number): SolarTimes {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Day of Year
  const N1 = Math.floor(275 * month / 9);
  const N2 = Math.floor((month + 9) / 12);
  const N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));
  const N = N1 - (N2 * N3) + day - 30;

  // Convert longitude to hour value
  const lngHour = lng / 15;

  // Calculate approximate rise and set
  const tRise = N + ((6 - lngHour) / 24);
  const tSet = N + ((18 - lngHour) / 24);

  // Mean Anomaly
  const mRise = (0.9856 * tRise) - 3.2891;
  const mSet = (0.9856 * tSet) - 3.2891;

  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  // True longitude of Solar position
  let lRise = mRise + (1.916 * Math.sin(toRad(mRise))) + (0.02 * Math.sin(toRad(2 * mRise))) + 282.634;
  let lSet = mSet + (1.916 * Math.sin(toRad(mSet))) + (0.02 * Math.sin(toRad(2 * mSet))) + 282.634;

  lRise = (lRise + 360) % 360;
  lSet = (lSet + 360) % 360;

  // Right Ascension
  let raRise = toDeg(Math.atan(0.91746 * Math.tan(toRad(lRise))));
  let raSet = toDeg(Math.atan(0.91746 * Math.tan(toRad(lSet))));

  raRise = (raRise + 360) % 360;
  raSet = (raSet + 360) % 360;

  // RA Quadrant adjustment
  const lQuadRise = Math.floor(lRise / 90) * 90;
  const raQuadRise = Math.floor(raRise / 90) * 90;
  raRise = raRise + (lQuadRise - raQuadRise);

  const lQuadSet = Math.floor(lSet / 90) * 90;
  const raQuadSet = Math.floor(raSet / 90) * 90;
  raSet = raSet + (lQuadSet - raQuadSet);

  raRise = raRise / 15;
  raSet = raSet / 15;

  // Solar Declination
  const sinDecRise = 0.39782 * Math.sin(toRad(lRise));
  const cosDecRise = Math.cos(Math.asin(sinDecRise));

  const sinDecSet = 0.39782 * Math.sin(toRad(lSet));
  const cosDecSet = Math.cos(Math.asin(sinDecSet));

  // Local Hour Angle
  const hRise = (Math.cos(toRad(90.833)) - (sinDecRise * Math.sin(toRad(lat)))) / (cosDecRise * Math.cos(toRad(lat)));
  const hSet = (Math.cos(toRad(90.833)) - (sinDecSet * Math.sin(toRad(lat)))) / (cosDecSet * Math.cos(toRad(lat)));

  // If sun doesn't rise or set in high latitudes
  if (hRise > 1 || hRise < -1 || hSet > 1 || hSet < -1) {
    return {
      sunrise: "06:00",
      sunset: "18:00",
      goldenHour: "17:00",
      twilight: "18:45",
      isDay: true,
      sunAltPct: 50
    };
  }

  // Local mean time
  const tMeanRise = (360 - toDeg(Math.acos(hRise))) / 15 + raRise - (0.06571 * tRise) - 6.622;
  const tMeanSet = (toDeg(Math.acos(hSet))) / 15 + raSet - (0.06571 * tSet) - 6.622;

  // General Universal Time (UTC)
  let utRise = (tMeanRise - lngHour + 24) % 24;
  let utSet = (tMeanSet - lngHour + 24) % 24;

  // Local timezone offset conversion
  const tzOffset = -now.getTimezoneOffset() / 60;
  const localRiseHrs = (utRise + tzOffset + 24) % 24;
  const localSetHrs = (utSet + tzOffset + 24) % 24;

  const fmt = (decimalHrs: number) => {
    const totalMins = Math.round(decimalHrs * 60);
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const hrNow = now.getHours() + now.getMinutes() / 60;
  const isDay = hrNow >= localRiseHrs && hrNow <= localSetHrs;

  // Sun altitude percent calculation (relative arc movement)
  let sunAltPct = 0;
  if (isDay) {
    const totalDayLen = localSetHrs - localRiseHrs;
    if (totalDayLen > 0) {
      sunAltPct = Math.max(0, Math.min(100, ((hrNow - localRiseHrs) / totalDayLen) * 100));
    }
  } else {
    // Night elevation calculation
    const totalNightLen = 24 - (localSetHrs - localRiseHrs);
    const progress = hrNow > localSetHrs ? (hrNow - localSetHrs) : (hrNow + (24 - localSetHrs));
    sunAltPct = Math.max(0, Math.min(100, (progress / totalNightLen) * 100));
  }

  return {
    sunrise: fmt(localRiseHrs),
    sunset: fmt(localSetHrs),
    goldenHour: fmt((localSetHrs - 1 + 24) % 24),
    twilight: fmt((localSetHrs + 0.5 + 24) % 24),
    isDay,
    sunAltPct
  };
}
