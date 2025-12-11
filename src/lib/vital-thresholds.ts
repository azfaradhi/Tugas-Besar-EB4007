// Vital signs threshold constants (standard medical values)
export const VITAL_THRESHOLDS = {
  heart_rate: {
    min: 60,
    max: 100,
    critical_min: 50,
    critical_max: 120
  },
  spo2: {
    min: 95,
    critical_min: 90
  }
};

/**
 * Check if a vital sign value is within normal, warning, or critical range
 * @param type - Type of measurement (heart_rate or spo2)
 * @param value - The measured value
 * @returns 'normal' | 'warning' | 'critical'
 */
export function checkVitalThreshold(
  type: string,
  value: number
): 'normal' | 'warning' | 'critical' {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return 'normal';
  }

  if (type === 'heart_rate') {
    const { min, max, critical_min, critical_max } = VITAL_THRESHOLDS.heart_rate;

    // Critical range
    if (numValue < critical_min || numValue > critical_max) {
      return 'critical';
    }

    // Warning range
    if (numValue < min || numValue > max) {
      return 'warning';
    }

    // Normal range
    return 'normal';
  }

  if (type === 'spo2') {
    const { min, critical_min } = VITAL_THRESHOLDS.spo2;

    // Critical range
    if (numValue < critical_min) {
      return 'critical';
    }

    // Warning range
    if (numValue < min) {
      return 'warning';
    }

    // Normal range
    return 'normal';
  }

  // For other measurement types, default to normal
  return 'normal';
}

/**
 * Get threshold information for display
 */
export function getThresholdInfo(type: string) {
  if (type === 'heart_rate') {
    return {
      unit: 'bpm',
      normal: '60-100 bpm',
      warning: '<60 or >100 bpm',
      critical: '<50 or >120 bpm'
    };
  }

  if (type === 'spo2') {
    return {
      unit: '%',
      normal: '≥95%',
      warning: '90-94%',
      critical: '<90%'
    };
  }

  return null;
}
