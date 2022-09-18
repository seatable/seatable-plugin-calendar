import { CELL_TYPE } from 'dtable-sdk';
import * as zIndexes from './zIndexes';
export { zIndexes };

export const PLUGIN_NAME = 'calendar';

export const CALENDAR_DIALOG_PADDINGTOP = 18;

export const TITLE_COLUMN_TYPES = [
  CELL_TYPE.TEXT, CELL_TYPE.SINGLE_SELECT, CELL_TYPE.FORMULA, CELL_TYPE.LINK_FORMULA,
  CELL_TYPE.COLLABORATOR, CELL_TYPE.CREATOR, CELL_TYPE.LAST_MODIFIER, CELL_TYPE.LINK,
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
  WEEK_START: 'week_start'
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

export const DATE_FORMAT_MAP = {
  YYYY_MM_DD: 'YYYY-MM-DD',
  YYYY_MM_DD_HH_MM: 'YYYY-MM-DD HH:mm',
  YYYY_MM_DD_HH_MM_SS: 'YYYY-MM-DD HH:mm:ss',
};
