import { MONTH_ROW_HEIGHT, OVERSCAN_ROWS, OFFSET_ROWS } from '../constants';
import { DATE_UNIT } from '../constants/date';
import dayjs from 'dayjs';
import { startOf } from './dates';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

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

export const getInitStateByDateRange = (startDate, endDate, currentDate, renderedRowsCount, localizer) => {
  const currentWeekStartDate = dayjs(startOf(currentDate, DATE_UNIT.WEEK, localizer.startOfWeek())).subtract(1, DATE_UNIT.WEEK);
  const allWeeksStartDates = getWeeksStartDates(startDate, endDate);
  const datesCount = allWeeksStartDates.length;
  const visibleStartIndex = getVisibleStartIndexByWeekStartDate(currentWeekStartDate, allWeeksStartDates);
  const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, datesCount);
  const overscanStartIndex = getOverscanStartIndexWithinDateRange(visibleStartIndex);
  const overscanEndIndex = getOverScanEndIdxWithinDateRange(visibleEndIndex, datesCount);
  return {
    visibleStartIndex,
    visibleEndIndex,
    overscanStartIndex,
    overscanEndIndex,
    allWeeksStartDates,
  };
};

export const getVisibleStartIndexByWeekStartDate = (visibleStartDate, allWeeksStartDates) => {
  const m_visibleStartDate = dayjs(visibleStartDate);
  return allWeeksStartDates.findIndex(weekStartDate => m_visibleStartDate.isSame(weekStartDate));
};

export const getOverscanStartIndexWithinDateRange = (visibleStartIdx) => {
  return Math.max(0, Math.floor(visibleStartIdx / 10) * 10 - OVERSCAN_ROWS);
};

export const getOverScanEndIdxWithinDateRange = (visibleEndIdx, datesCount) => {
  return Math.min(Math.ceil(visibleEndIdx / 10) * 10 + OVERSCAN_ROWS, datesCount);
};

export const getVisibleBoundariesByScrollTop = (scrollTop, viewportHeight, datesCount) => {
  const renderedRowsCount = getRenderedRowsCount(viewportHeight);
  const visibleStartIndex = Math.max(0, Math.round(scrollTop / MONTH_ROW_HEIGHT));
  const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, datesCount);
  return { visibleStartIndex, visibleEndIndex };
};

export const getVisibleEndIndex = (visibleStartIndex, renderedRowsCount, datesCount) => {
  return Math.min(datesCount, visibleStartIndex + renderedRowsCount);
};

export const getAllWeeksStartDates = (date, renderedRowsCount, localizer) => {
  const visibleStartWeekDate = dayjs(startOf(date, DATE_UNIT.WEEK, localizer.startOfWeek())).subtract(7, DATE_UNIT.DAY);
  const weekOffset = OFFSET_ROWS + OVERSCAN_ROWS;
  const gridStartWeekDate = dayjs(visibleStartWeekDate).subtract(weekOffset * 7, DATE_UNIT.DAY).toDate();
  const gridEndWeekDate = dayjs(visibleStartWeekDate).add((renderedRowsCount + weekOffset) * 7, DATE_UNIT.DAY).toDate();
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
  return !dayjs(comparedDate).isSame(prevDate, 'month');
};

export const getNextMonthDate = (weeks, visibleStartIndex) => {
  return weeks[visibleStartIndex + 1];
};

export const getWeekEndDate = (weekStartDate) => {
  return dayjs(weekStartDate).add(6, DATE_UNIT.DAY).toDate();
};

export const getVisibleStartIndexByDate = (date, weeks) => {
  let weeksLen = weeks.length;
  let index = 0;
  for (let i = 0; i < weeksLen; i++) {
    if (dayjs(weeks[i]).isSame(date, DATE_UNIT.DAY)) {
      index = i;
      break;
    }
  }
  return index;
};

function getWeeksStartDates(startDate, endDate) {
  let dates = [];
  while(dayjs(startDate).isSameOrBefore(endDate)) {
    dates.push(startDate);
    startDate = dayjs(startDate).add(7, DATE_UNIT.DAY).toDate();
  }
  return dates;
}
