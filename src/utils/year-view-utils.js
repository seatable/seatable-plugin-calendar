import { YEAR_MONTHS_ROW_HEIGHT, YEAR_OFFSET_ROWS, YEAR_OVERSCAN_ROWS } from '../constants';

export const getInitState = (renderedRowsCount, dates) => {
  const rowsCount = dates.length;
  const visibleStartIndex = YEAR_OVERSCAN_ROWS + YEAR_OFFSET_ROWS;
  const visibleEndIndex = visibleStartIndex + renderedRowsCount;
  const overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
  const overscanEndIndex = getOverscanEndIndex(visibleEndIndex, rowsCount);
  return {
    visibleStartIndex,
    visibleEndIndex,
    overscanStartIndex,
    overscanEndIndex,
  };
};

export const getInitStateWithDates = (dates, currentDate, renderedRowsCount) => {
  const datesLength = dates.length;
  const visibleStartIndex = getVisibleStartIndexByDate(currentDate, dates);
  const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, datesLength);
  const overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
  const overscanEndIndex = getOverscanEndIndex(visibleEndIndex, datesLength);
  return {
    visibleStartIndex,
    visibleEndIndex,
    overscanStartIndex,
    overscanEndIndex,
  };
};

export const getRenderedRowsCount = (viewportHeight) => {
  return Math.round(viewportHeight / YEAR_MONTHS_ROW_HEIGHT);
};

export const getVisibleStartIndexByDate = (currentDate, dates) => {
  const dateObj = new Date(currentDate);
  const currentYear = dateObj.getFullYear();
  const currentMonth = dateObj.getMonth();
  return dates.findIndex(date => date.getFullYear() === currentYear && date.getMonth() === currentMonth);
};

export const getVisibleEndIndex = (visibleStartIndex, renderedRowsCount, rowsCount) => {
  return Math.min(rowsCount, visibleStartIndex + renderedRowsCount);
};

export const getVisibleBoundariesByScrollTop = (scrollTop, viewportHeight, rowsCount) => {
  const renderedRowsCount = getRenderedRowsCount(viewportHeight);
  const visibleStartIndex = Math.max(0, Math.round(scrollTop / YEAR_MONTHS_ROW_HEIGHT));
  const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, rowsCount);
  return { visibleStartIndex, visibleEndIndex };
};

export const getOverscanStartIndex = (visibleStartIndex) => {
  return Math.max(0, Math.floor(visibleStartIndex / 10) * 10 - YEAR_OVERSCAN_ROWS);
};

export const getOverscanEndIndex = (visibleEndIndex, rowsCount) => {
  return Math.min(Math.ceil(visibleEndIndex / 10) * 10 + YEAR_OVERSCAN_ROWS, rowsCount);
};

export const getMonthStartDates = (currentDate, renderedRowsCount) => {
  const objCurrentDate = new Date(currentDate);
  const currentYear = objCurrentDate.getFullYear();
  const currentMonth = objCurrentDate.getMonth();

  const startDate = new Date(currentYear, currentMonth - (YEAR_OVERSCAN_ROWS + YEAR_OFFSET_ROWS) * 4);
  const endDate = new Date(currentYear, currentMonth + (YEAR_OVERSCAN_ROWS + YEAR_OFFSET_ROWS + renderedRowsCount) * 4);

  let rows = [];
  let current = startDate;
  while (current <= endDate) {
    rows.push(current);
    current = new Date(current.getFullYear(), current.getMonth() + 4);
  }
  return rows;
};

export const getMonthStartDatesByDateRange = (startDate, endDate) => {
  let dates = [];
  let current = new Date(startDate);
  let end = new Date(endDate);
  while (current <= end) {
    dates.push(current);
    current = new Date(current.getFullYear(), current.getMonth() + 1);
  }
  return dates;
};

export const isNextYear = (prevDate, renderMonthStartDates, visibleStartIndex) => {
  if (!renderMonthStartDates) return true;
  let nextMonthStartDateStartDate = renderMonthStartDates[visibleStartIndex + 1];
  if (!nextMonthStartDateStartDate) return true;
  return nextMonthStartDateStartDate.getFullYear() !== (new Date(prevDate)).getFullYear();
};
