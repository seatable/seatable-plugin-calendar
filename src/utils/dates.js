/* eslint no-fallthrough: off */
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DATE_UNIT, MULTIPLIER_MILLI, MONTHS } from '../constants/date';
// import dayjs from 'dayjs';
dayjs.extend(isSameOrBefore);
dayjs.extend(localizedFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);

export function monthsInYear(year) {
  return MONTHS.map(m => dayjs(`${year}-${m}`).startOf(DATE_UNIT.MONTH).toDate());
}

export function firstVisibleDay(date, localizer) {
  let firstOfMonth = startOf(date, DATE_UNIT.MONTH);

  return startOf(firstOfMonth, DATE_UNIT.WEEK, localizer.startOfWeek());
}

export function lastVisibleDay(date, localizer) {
  let endOfMonth = endOf(date, DATE_UNIT.MONTH);

  return endOf(endOfMonth, DATE_UNIT.WEEK, localizer.startOfWeek());
}

export function visibleDays(date, localizer) {
  let current = firstVisibleDay(date, localizer);
  let last = lastVisibleDay(date, localizer);
  let days = [];

  while (lte(current, last, DATE_UNIT.DAY)) {
    days.push(current);
    current = add(current, 1, DATE_UNIT.DAY);
  }

  return days;
}

export function visibleYearDays(date, localizer) {
  let current = firstVisibleDay(date, localizer);
  let days = [];

  while (days.length < 42) {
    days.push(current);
    current = add(current, 1, DATE_UNIT.DAY);
  }

  return days;
}

export function ceil(date, unit) {
  let floor = startOf(date, unit);

  return eq(floor, date) ? floor : add(floor, 1, unit);
}

export function range(start, end, unit = DATE_UNIT.DAY) {
  let current = start;
  let days = [];

  while (lte(current, end, unit)) {
    days.push(current);
    current = add(current, 1, unit);
  }

  return days;
}

export function merge(date, time) {
  if (time == null && date == null) return null;

  if (time == null) time = new Date();
  if (date == null) date = new Date();

  date = startOf(date, DATE_UNIT.DAY);
  date = hours(date, hours(time));
  date = minutes(date, minutes(time));
  date = seconds(date, seconds(time));
  return milliseconds(date, milliseconds(time));
}

export function eqTime(dateA, dateB) {
  return (
    hours(dateA) === hours(dateB) &&
    minutes(dateA) === minutes(dateB) &&
    seconds(dateA) === seconds(dateB)
  );
}

export function isJustDate(date) {
  if (!date) return false;
  const dayjsDate = dayjs(date);
  return (
    dayjsDate.hour() === 0 &&
    dayjsDate.minute() === 0 &&
    dayjsDate.second() === 0 &&
    dayjsDate.millisecond() === 0
  );
}

export function duration(start, end, unit, firstOfWeek) {
  if (unit === DATE_UNIT.DAY) unit = DATE_UNIT.DATE;
  return Math.abs(
    [unit](start, undefined, firstOfWeek) -
      [unit](end, undefined, firstOfWeek)
  );
}

export function diff(dateA, dateB, unit) {
  if (!unit || unit === DATE_UNIT.MILI) return Math.abs(+dateA - +dateB);

  // the .round() handles an edge case
  // with DST where the total won't be exact
  // since one day in the range may be shorter/longer by an hour
  return Math.round(
    Math.abs(
      +startOf(dateA, unit) / MULTIPLIER_MILLI[unit] -
        +startOf(dateB, unit) / MULTIPLIER_MILLI[unit]
    )
  );
}

export function total(date, unit) {
  let ms = date.getTime();
  let div = 1;

  // noinspection FallThroughInSwitchStatementJS
  switch (unit) {
    case DATE_UNIT.WEEK:
      div *= 7;
    case DATE_UNIT.DAY:
      div *= 24;
    case DATE_UNIT.HOURS:
      div *= 60;
    case DATE_UNIT.MINUTES:
      div *= 60;
    case DATE_UNIT.SECONDS:
      div *= 1000;
    default:
      break;
  }

  return ms / div;
}

export function week(date) {
  let d = dayjs(date);
  d = d.hour(0);
  d = d.date(d.date() + 4 - (d.days() || 7));
  return Math.ceil((d.diff(dayjs([d.year(), 0, 1])) / 8.64e7 + 1) / 7);
}

export function today() {
  return dayjs().startOf(DATE_UNIT.DAY).toDate();
}

export function yesterday() {
  return dayjs().subtract(1, DATE_UNIT.DAY).startOf(DATE_UNIT.DAY).toDate();
}

export function tomorrow() {
  return dayjs().add(1, DATE_UNIT.DAY).startOf(DATE_UNIT.DAY).toDate();
}

export function add(d, num, unit) {
  if (unit) {
    return dayjs(d).add(num, unit).toDate();
  }

  throw new TypeError('Invalid units: "' + unit + '"');
}

export function subtract(d, num, unit) {
  return add(d, -num, unit);
}

export function startOf(d, unit, firstOfWeek) {
  d = new Date(d);

  // noinspection FallThroughInSwitchStatementJS
  switch (unit) {
    case DATE_UNIT.CENTURY:
    case DATE_UNIT.DECADE:
    case DATE_UNIT.YEAR:
      d = month(d, 0);
    case DATE_UNIT.MONTH:
      d = date(d, 1);
    case DATE_UNIT.WEEK:
    case DATE_UNIT.DAY:
      d = hours(d, 0);
    case DATE_UNIT.HOURS:
      d = minutes(d, 0);
    case DATE_UNIT.MINUTES:
      d = seconds(d, 0);
    case DATE_UNIT.SECONDS:
      d = milliseconds(d, 0);
    default:
      break;
  }

  if (unit === DATE_UNIT.DECADE)
    d = subtract(d, year(d) % 10, DATE_UNIT.YEAR);

  if (unit === DATE_UNIT.CENTURY)
    d = subtract(d, year(d) % 100, DATE_UNIT.YEAR);

  if (unit === DATE_UNIT.WEEK)
    d = weekday(d, 0, firstOfWeek);

  return d;
}

export function endOf(d, unit, firstOfWeek){
  d = new Date(d);
  d = startOf(d, unit, firstOfWeek);
  switch (unit) {
    case DATE_UNIT.CENTURY:
    case DATE_UNIT.DECADE:
    case DATE_UNIT.YEAR:
    case DATE_UNIT.MONTH:
    case DATE_UNIT.WEEK:
      d = add(d, 1, unit);
      d = subtract(d, 1, DATE_UNIT.DAY);
      d.setHours(23, 59, 59, 999);
      break;
    case DATE_UNIT.DAY:
      d.setHours(23, 59, 59, 999);
      break;
    case DATE_UNIT.HOURS:
    case DATE_UNIT.MINUTES:
    case DATE_UNIT.SECONDS:
      d = add(d, 1, unit);
      d = subtract(d, 1, DATE_UNIT.MILI);
      break;
    default:
      break;
  }
  return d;
}

export const eq = createComparer(function (a, b){
  return a === b;
});
export const neq = createComparer(function (a, b){
  return a !== b;
});
export const gt = createComparer(function (a, b){
  return a > b;
});
export const gte = createComparer(function (a, b){
  return a >= b;
});
export const lt = createComparer(function (a, b){
  return a < b;
});
export const lte = createComparer(function (a, b){
  return a <= b;
});

export function min(){
  return dayjs(Math.min.apply(Math, arguments)).toDate();
}

export function max(){
  return dayjs(Math.max.apply(Math, arguments)).toDate();
}

export function inRange(day, min, max, unit){
  unit = unit || 'day';

  return (!min || gte(day, min, unit))
      && (!max || lte(day, max, unit));
}

export function weekday(d, val, firstDay) {
  const w = (day(d) + 7 - (firstDay || 0)) % 7;

  return val === undefined
    ? w
    : add(d, val - w, DATE_UNIT.DAY);
}

export const milliseconds = createAccessor('Milliseconds');
export const seconds = createAccessor('Seconds');
export const minutes = createAccessor('Minutes');
export const hours = createAccessor('Hours');
export const day = createAccessor('Day');
export const date = createAccessor('Date');
export const month = createAccessor('Month');
export const year = createAccessor('FullYear');

export function decade(d, val) {
  return val === undefined
    ? year(startOf(d, DATE_UNIT.DECADE))
    : add(d, val + 10, DATE_UNIT.YEAR);
}

export function century(d, val) {
  return val === undefined
    ? year(startOf(d, DATE_UNIT.CENTURY))
    : add(d, val + 100, DATE_UNIT.YEAR);
}

export function getFormattedDate(d, format) {
  return dayjs(d).format(format);
}

export function getMonthStartDate(date) {
  let mDate = dayjs(date);
  let startOfMonth = mDate.startOf(DATE_UNIT.MONTH);
  return startOfMonth.subtract(startOfMonth.weekday(), DATE_UNIT.DAY).toDate();
}

export function getMonthEndDate(date) {
  let mDate = dayjs(date);
  let startOfMonth = mDate.endOf(DATE_UNIT.MONTH);
  return startOfMonth.add(6 - startOfMonth.weekday(), DATE_UNIT.DAY).toDate();
}

export function getDatesInRange(startDate, endDate, unit = DATE_UNIT.DAY) {
  let dates = [];
  while (dayjs(startDate).isSameOrBefore(endDate)) {
    dates.push(startDate);
    startDate = dayjs(startDate).add(1, unit).toDate();
  }
  return dates;
}

export function getWeekDates(weekStartDate) {
  let dates = []; let startDate = weekStartDate;
  for (let i = 0; i < 7; i++) {
    dates.push(startDate);
    startDate = dayjs(startDate).add(1, DATE_UNIT.DAY).toDate();
  }
  return dates;
}

export function isToday(date, unit) {
  return dayjs().isSame(date, unit);
}

function createAccessor(method){
  let hourLength = (function (method) {
    switch (method) {
      case 'Milliseconds':
        return 3600000;
      case 'Seconds':
        return 3600;
      case 'Minutes':
        return 60;
      case 'Hours':
        return 1;
      default:
        return null;
    }
  })(method);

  return function (d, val){
    if (val === undefined)
      return d['get' + method]();

    const dateOut = new Date(d);
    dateOut['set' + method](val);

    // eslint-disable-next-line
    if(hourLength && dateOut['get'+method]() !== val && (method === 'Hours' || val >= hourLength && (dateOut.getHours() - d.getHours() < Math.floor(val / hourLength)))){
      // Skip DST hour, if it occurs
      dateOut['set' + method](val + hourLength);
    }

    return dateOut;
  };
}

function createComparer(operator) {
  return function (a, b, unit) {
    return operator(+startOf(a, unit), +startOf(b, unit));
  };
}

export function isValidDateObject(date) {
  return date && date instanceof Date && !isNaN(date.getTime());
}
