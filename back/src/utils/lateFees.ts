// Late fee calculation engine
// Business rules (configurable from admin panel):
//   Days 1–3:  Grace period — no charge
//   Day 4:     base_rent + flat_fee ($42.00 default)
//   Day 5+:    + daily_fee per additional day ($11.35 default)
//
// Example: rent $2,700 → Day 4 = $2,742 → Day 5 = $2,753.35 → Day 6 = $2,764.70

export interface LateFeeConfigInput {
  gracePeriodDays: number;
  flatFeeDay4: number;
  dailyFeeAfter: number;
}

const DEFAULT_CONFIG: LateFeeConfigInput = {
  gracePeriodDays: 3,
  flatFeeDay4: 42.0,
  dailyFeeAfter: 11.35,
};

/**
 * Calculates the late fee amount for a given day of the month.
 * Returns 0 if within the grace period.
 */
export const calculateLateFeeAmount = (
  dayOfMonth: number,
  config: LateFeeConfigInput = DEFAULT_CONFIG
): number => {
  if (dayOfMonth <= config.gracePeriodDays) return 0;

  const daysAfterGrace = dayOfMonth - config.gracePeriodDays;
  // daysAfterGrace = 1 → day 4 (just flat fee)
  // daysAfterGrace = 2 → day 5 (flat fee + 1 × daily)
  const fee = config.flatFeeDay4 + Math.max(0, daysAfterGrace - 1) * config.dailyFeeAfter;

  return Math.round(fee * 100) / 100; // round to 2 decimal places
};

/**
 * Calculates the total amount due (rent + late fee) for a given day.
 */
export const calculateTotalDue = (
  baseRent: number,
  dayOfMonth: number,
  config: LateFeeConfigInput = DEFAULT_CONFIG
): { lateFee: number; total: number } => {
  const lateFee = calculateLateFeeAmount(dayOfMonth, config);
  return {
    lateFee,
    total: Math.round((baseRent + lateFee) * 100) / 100,
  };
};

/**
 * Returns a projection of fees for a range of days.
 * Useful for the "collect today" view.
 */
export const projectFees = (
  baseRent: number,
  fromDay: number,
  toDay: number,
  config: LateFeeConfigInput = DEFAULT_CONFIG
): Array<{ day: number; lateFee: number; total: number }> => {
  return Array.from({ length: toDay - fromDay + 1 }, (_, i) => {
    const day = fromDay + i;
    return { day, ...calculateTotalDue(baseRent, day, config) };
  });
};
