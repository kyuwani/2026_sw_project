function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function calculateLearningStreak(
  studiedDates: Date[],
  today: Date,
): number {
  const studiedDateKeys = new Set(studiedDates.map(toDateKey));
  let cursor = today;

  if (!studiedDateKeys.has(toDateKey(cursor))) {
    cursor = addUtcDays(cursor, -1);
  }

  let streak = 0;

  while (studiedDateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }

  return streak;
}
