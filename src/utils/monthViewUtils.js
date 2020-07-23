import { MONTH_ROW_HEIGHT, OVERSCAN_ROWS, OFFSET_ROWS } from '../constants';
import { getMonthStartDate, getDatesInRange } from './dates';
import moment from 'moment';

export const getInitialState = (date, viewportHeight) => {
  let renderedRowsCount = getRenderedRowsCount(viewportHeight);
  let visibleStartIndex = OFFSET_ROWS + OVERSCAN_ROWS;
  let visibleEndIndex = visibleStartIndex + renderedRowsCount;
  let overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
  let overscanEndIndex = getOverscanEndIndex(visibleEndIndex);
  let gridDates = getGridDates(date, renderedRowsCount);
  return {
    visibleStartIndex,
    visibleEndIndex,
    overscanStartIndex,
    overscanEndIndex,
    gridDates
  };
}

export const getGridDates = (date, renderedRowsCount) => {
  let visibleStartDate = getMonthStartDate(date);
  let gridStartDate = moment(visibleStartDate).subtract((OVERSCAN_ROWS + OFFSET_ROWS) * 7, 'd').toDate();
  let gridEndDate = moment(visibleStartDate).add((renderedRowsCount + OVERSCAN_ROWS + OFFSET_ROWS) * 7 - 1, 'd').toDate();
  return getDatesInRange(gridStartDate, gridEndDate);
}

export const getRenderedRowsCount = (viewportHeight) => {
  return Math.ceil(viewportHeight / MONTH_ROW_HEIGHT);
}

export const getOverscanStartIndex = (visibleStartIndex) => {
  return visibleStartIndex - OVERSCAN_ROWS;
}

export const getOverscanEndIndex = (visibleEndIndex) => {
  return visibleEndIndex + OVERSCAN_ROWS;
}

export const isNextMonth = (prevDate, weeks, visibleStartIndex) => {
  if (!weeks) return true;
  let visibleStartWeek = weeks[visibleStartIndex + 1];
  if (!visibleStartWeek) return true;
  return !moment(prevDate).isSame(visibleStartWeek[6], 'month')
}

export const getNextMonthDate = (weeks, visibleStartIndex) => {
  let visibleStartWeek = weeks[visibleStartIndex + 1];
  return visibleStartWeek[6];
}

export const getVisibleStartIndexByDate = (date, weeks) => {
  let index = 0, weeksLen = weeks.length;
  while(index < weeksLen) {
    if (weeks[index].findIndex(d => moment(d).isSame(date, 'd')) > -1) {
      break;
    }
    index++;
  }
  return index;
}