export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getDateStringInTimeZone(
  date: Date,
  timeZone: string,
): string {
  if (!isValidTimeZone(timeZone)) {
    throw new Error("올바르지 않은 시간대입니다.");
  }

  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getDateInTimeZone(date: Date, timeZone: string): Date {
  return new Date(`${getDateStringInTimeZone(date, timeZone)}T00:00:00.000Z`);
}
