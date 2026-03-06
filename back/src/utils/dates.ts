import { addYears, differenceInMonths, differenceInDays, format } from "date-fns";

/** Calculate contract end date: startDate + durationYears */
export const calcContractEndDate = (startDate: Date, durationYears: number): Date => {
  return addYears(startDate, durationYears);
};

/** Days remaining until a date (negative if already passed) */
export const daysUntil = (date: Date): number => {
  return differenceInDays(date, new Date());
};

/** Months lived in property since moveInDate */
export const monthsLived = (moveInDate: Date): number => {
  return differenceInMonths(new Date(), moveInDate);
};

/** Format a date to "MMM d, yyyy" */
export const formatDate = (date: Date): string => {
  return format(date, "MMM d, yyyy");
};

/** Current day of month (1-31) */
export const currentDayOfMonth = (): number => {
  return new Date().getDate();
};

/** Returns { month, year } for the current billing period */
export const currentBillingPeriod = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};
