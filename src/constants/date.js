export const DATE_UNIT = {
  MILI: 'milliseconds',
  SECONDS: 'seconds',
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  DECADE: 'decade',
  CENTURY: 'century',
  DATE: 'date'
};

export const MULTIPLIER_MILLI = {
  [DATE_UNIT.MILI]: 1,
  [DATE_UNIT.SECONDS]: 1000,
  [DATE_UNIT.MINUTES]: 60 * 1000,
  [DATE_UNIT.HOURS]: 60 * 60 * 1000,
  [DATE_UNIT.DAY]: 24 * 60 * 60 * 1000,
  [DATE_UNIT.WEEK]: 7 * 24 * 60 * 60 * 1000
};

export const MULTIPLIER_MONTH = {
  [DATE_UNIT.MONTH]: 1,
  [DATE_UNIT.YEAR]: 12,
  [DATE_UNIT.DECADE]: 10 * 12,
  [DATE_UNIT.CENTURY]: 100 * 12
};

export const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
