import { MONTH_ROW_HEIGHT, OVERSCAN_ROWS, OFFSET_ROWS } from '../constants';
import { DATE_UNIT } from '../constants/date';
import moment from 'moment';
import { startOf } from './dates';

export const getInitialState = (date, renderedRowsCount, localizer) => {
  let visibleStartIndex = OFFSET_ROWS + OVERSCAN_ROWS;
  let visibleEndIndex = visibleStartIndex + renderedRowsCount;
  let overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
  let overscanEndIndex = getOverscanEndIndex(visibleEndIndex);
  let allWeeksStartDates = getAllWeeksStartDates(date, renderedRowsCount, localizer);
  return {
    visibleStartIndex,
    visibleEndIndex,
    overscanStartIndex,
    overscanEndIndex,
    allWeeksStartDates,
  };
};

export const getAllWeeksStartDates = (date, renderedRowsCount, localizer) => {
  const visibleStartWeekDate = moment(startOf(date, DATE_UNIT.WEEK, localizer.startOfWeek())).subtract(7, DATE_UNIT.DAY);
  const gridStartWeekDate = moment(visibleStartWeekDate).subtract((OVERSCAN_ROWS + OFFSET_ROWS) * 7, DATE_UNIT.DAY).toDate();
  const gridEndWeekDate = moment(visibleStartWeekDate).add((renderedRowsCount + OVERSCAN_ROWS + OFFSET_ROWS) * 7, DATE_UNIT.DAY).toDate();
  return getWeeksStartDates(gridStartWeekDate, gridEndWeekDate);
};

export const getRenderedRowsCount = (viewportHeight) => {
  return Math.ceil(viewportHeight / MONTH_ROW_HEIGHT);
};

export const getOverscanStartIndex = (visibleStartIndex) => {
  return visibleStartIndex - OVERSCAN_ROWS;
};

export const getOverscanEndIndex = (visibleEndIndex) => {
  return visibleEndIndex + OVERSCAN_ROWS;
};

export const isNextMonth = (prevDate, weeks, visibleStartIndex) => {
  if (!weeks) return true;
  let nextWeekStartDate = weeks[visibleStartIndex + 2];
  if (!nextWeekStartDate) return true;
  let comparedDate = getWeekEndDate(nextWeekStartDate);
  return !moment(comparedDate).isSame(prevDate, 'month');
};

export const getNextMonthDate = (weeks, visibleStartIndex) => {
  return weeks[visibleStartIndex + 1];
};

export const getWeekEndDate = (weekStartDate) => {
  return moment(weekStartDate).add(6, DATE_UNIT.DAY).toDate();
};

export const getVisibleStartIndexByDate = (date, weeks) => {
  let weeksLen = weeks.length;
  let index = 0;
  for (let i = 0; i < weeksLen; i++) {
    if (moment(weeks[i]).isSame(date, DATE_UNIT.DAY)) {
      index = i;
      break;
    }
  }
  return index;
};

function getWeeksStartDates(startDate, endDate) {
  let dates = [];
  while(moment(startDate).isSameOrBefore(endDate)) {
    dates.push(startDate);
    startDate = moment(startDate).add(7, DATE_UNIT.DAY).toDate();
  }
  return dates;
}
