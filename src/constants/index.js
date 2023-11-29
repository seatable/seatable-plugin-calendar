import { CellType } from 'dtable-utils';
import * as zIndexes from './zIndexes';
export { zIndexes };

export const PLUGIN_NAME = 'calendar';

export const KEY_SELECTED_CALENDAR_VIEW = `.${PLUGIN_NAME}.selectedCalendarView`;

export const CALENDAR_DIALOG_PADDINGTOP = 18;

export const TITLE_COLUMN_TYPES = [
  CellType.TEXT, CellType.SINGLE_SELECT, CellType.FORMULA, CellType.LINK_FORMULA,
  CellType.COLLABORATOR, CellType.CREATOR, CellType.LAST_MODIFIER, CellType.LINK,
];

export const navigate = {
  PREVIOUS: 'PREV',
  NEXT: 'NEXT',
  TODAY: 'TODAY',
  DATE: 'DATE'
};

export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  WORK_WEEK: 'work_week',
  DAY: 'day',
  AGENDA: 'agenda',
  YEAR: 'year'
};

export const VIEWS_SUPPORT_SCROLL_ON_MOBILE = [CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH];

export const CALENDAR_HEADER_HEIGHT = 46;

export const YEAR_MONTHS_ROW_HEIGHT = 216;

export const MONTH_ROW_HEIGHT = 126;

export const OVERSCAN_ROWS = 10;

export const OFFSET_ROWS = 10;

export const YEAR_OVERSCAN_ROWS = 3;

export const YEAR_OFFSET_ROWS = 10;

export const SETTING_KEY = {
  TABLE_NAME: 'table_name',
  VIEW_NAME: 'view_name',
  COLUMN_TITLE: 'column_title',
  COLUMN_START_DATE: 'column_start_date',
  COLUMN_END_DATE: 'column_end_date',
  COLUMN_COLOR: 'column_color',
  COLORED_BY_ROW_COLOR: 'colored_by_row_color',
  WEEK_START: 'week_start',
  START_YEAR_FIRST_WEEK: 'start_year_first_week', // 'year_first_day' | 'year_first_full_week'
};

export const SETTING_VALUE = {
  YEAR_FIRST_DAY: 'year_first_day',
  YEAR_FIRST_FULL_WEEK: 'year_first_full_week',
};


export const DATE_UNIT = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day',
};

export const DATE_FORMAT = {
  YEAR_MONTH_DAY: 'YYYY-MM-DD',
  YEAR_MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
  MONTH: 'MM',
  DAY: 'DD'
};

