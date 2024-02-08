import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { CellType, getRowById, getCellValueStringResult } from 'dtable-utils';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/intl-decorator';
import { getDtableUuid } from './utils/common';
import { isValidDateObject } from './utils/dates';
import { KEY_SELECTED_CALENDAR_VIEW, SETTING_KEY, TITLE_COLUMN_TYPES } from './constants';
import TableEvent from './model/event';
import withDragAndDrop from './addons/dragAndDrop';

import './css/react-big-calendar.css';
import './addons/dragAndDrop/styles.css';

const DragAndDropCalendar = withDragAndDrop(Calendar);

const propTypes = {
  activeTable: PropTypes.object,
  activeView: PropTypes.object,
  selectedViewIdx: PropTypes.number,
  columns: PropTypes.array,
  rows: PropTypes.array,
  calendarViews: PropTypes.array,
  settings: PropTypes.object,
  isMobile: PropTypes.bool,
  getSelectedGridView: PropTypes.func,
  onRowExpand: PropTypes.func,
  onInsertRow: PropTypes.func,
};

class ReactBigCalendar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedView: this.getSelectedView(),
      events: this.getEvents(props),
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.rows !== this.props.rows) {
      const newEvents = this.getEvents(this.props);
      this.setState({ events: newEvents });
    }
    if (this.props.selectedViewIdx !== prevProps.selectedViewIdx) {
      this.setState({ selectedView: this.getSelectedView() });
    }
  }

  getSelectedView = () => {
    const { activeTable, activeView } = this.props;
    return this.props.getSelectedGridView(activeTable, activeView);
  };

  onSelectView = (view) => {
    let selectedCalendarView = JSON.parse(localStorage.getItem(KEY_SELECTED_CALENDAR_VIEW)) || {};
    let { activeTable, activeView } = this.props;
    let dtableUuid = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    selectedCalendarView[key] = view;
    localStorage.setItem(KEY_SELECTED_CALENDAR_VIEW, JSON.stringify(selectedCalendarView));
    this.setState({ selectedView: view });
  };

  getTitle = (row, column) => {
    const { collaborators, formulaRows } = this.props;
    const { type, name } = column;
    const value = row[name];
    if (type === CellType.LINK) {
      return getCellValueStringResult(row, column, { formulaRows, collaborators });
    }
    return value;
  };

  getTitleColumn = (columnName) => {
    const { columns } = this.props;
    if (!Array.isArray(columns)) return {};
    if (columnName) {
      return columns.find(c => c.name === columnName) || {};
    }
    return columns.find(c => TITLE_COLUMN_TYPES.includes(c.type)) || {};
  };

  getDateColumn = (columnName) => {
    const { columns } = this.props;
    if (!Array.isArray(columns)) return null;
    return columns.find(c => c.name === columnName) || null;
  };

  getColorColumn = (columnName) => {
    const { columns } = this.props;
    if (!Array.isArray(columns)) return null;
    if (columnName) {
      return columns.find(c => c.name === columnName) || null;
    }
    return null; // for 'Not used': settings[SETTING_KEY.COLUMN_COLOR] is `''`
  };

  getEvents = (props) => {
    const { activeTable, rows, settings } = props;
    const titleColumnName = settings[SETTING_KEY.COLUMN_TITLE];
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    const colorColumnName = settings[SETTING_KEY.COLUMN_COLOR];
    let titleColumn = this.getTitleColumn(titleColumnName);
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    let colorColumn = this.getColorColumn(colorColumnName);
    let events = [];
    if (!startDateColumn) {
      return [];
    }

    rows.forEach((row) => {
      const formattedRow = getRowById(activeTable, row._id);
      const event = this.getEvent(row, formattedRow, titleColumn, startDateColumn, endDateColumn, colorColumn);
      if (event) {
        events.push(event);
      }
    });
    return events;
  };

  getEventEndDate = (rawRow, row, columnType, columnName, columnKey, startDate) => {
    switch (columnType) {
      case CellType.DATE: return row[columnKey];
      case CellType.FORMULA: return rawRow[columnName];
      case CellType.DURATION:
        return dayjs(startDate).add(rawRow[columnName], 'seconds').format('YYYY-MM-DD HH:mm');
      default: return null;
    }
  };

  getEvent = (rawRow, row, titleColumn, startDateColumn, endDateColumn, colorColumn) => {
    const { rowsColor, rowColorsMap, settings } = this.props;
    const { key: startDateColumnKey, name: startDateColumnName, type: startDateColumnType } = startDateColumn || {};
    const { key: endDateColumnKey, name: endDateColumnName, type: endDateColumnType } = endDateColumn || {};
    const title = this.getTitle(rawRow, titleColumn);
    const date = this.getFormattedDateWithDifferentClient(
      startDateColumnType === 'formula' ? rawRow[startDateColumnName] : row[startDateColumnKey]
    );
    // start date must exist and be valid.
    if (!date || !isValidDateObject(new Date(date))) {
      return null;
    }
    const endDate = this.getFormattedDateWithDifferentClient(
      this.getEventEndDate(rawRow, row, endDateColumnType, endDateColumnName, endDateColumnKey, date)
    );
    // end date if exists must be valid
    // NOTE: end date might be before start date, this is delegated to TableEvent()
    if (endDate && !isValidDateObject(new Date(endDate))) {
      return null;
    }

    const configuredUseRowColor = settings[SETTING_KEY.COLORED_BY_ROW_COLOR];
    const eventColors = TableEvent.getColors({ row, colorColumn, configuredUseRowColor, rowsColor, rowColorsMap });
    return new TableEvent({ row, date, endDate, title, titleColumn, ...eventColors });
  };

  getFormattedDateWithDifferentClient = (date) => {
    if (!date) {
      return null;
    }
    const { isIosMobile, isSafari } = this.props;
    if (isIosMobile || isSafari) {
      return (date + '').split('-').join('/');
    }
    return date;
  };

  onRowExpand = (row) => {
    this.props.onRowExpand(row, this.props.activeTable);
  };

  onSelectEvent = ({ row }) => this.onRowExpand(row);

  onInsertRow = (rowData) => {
    let { activeTable, activeView, onInsertRow, rows } = this.props;
    let row_id = rows.length > 0 ? rows[rows.length - 1]._id : '';
    onInsertRow(rowData, activeTable, activeView, row_id);
  };

  getFormattedDate = (date, originalFormat) => {
    const targetFormat = originalFormat && originalFormat.indexOf('HH:mm') > -1 ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
    return dayjs(date).format(targetFormat);
  };

  /**
   * create new event row
   *
   * @param {Date} start
   * @param {Date} end
   */
  createEvent = ({ start, end }) => {
    const { activeTable, appendRow, settings } = this.props;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    const startDateColumn = this.getDateColumn(startDateColumnName);
    const endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    if (startDateColumn.type !== CellType.DATE) {
      return;
    }
    const rowData = {};
    const startDateFormat = startDateColumn.data && startDateColumn.data.format;
    const startDateMinutePrecision = startDateFormat && startDateFormat.indexOf('HH:mm') > -1;
    rowData[startDateColumn.name] = this.getFormattedDate(start, startDateFormat);
    if (startDateMinutePrecision) {
      switch (endDateColumn.type) {
        case CellType.DATE:
          if (endDateColumn !== startDateColumn) {
            rowData[endDateColumn.name] = this.getFormattedDate(end, endDateColumn.data && endDateColumn.data.format);
          }
          break;
        case CellType.DURATION:
          rowData[endDateColumn.name] = (Math.abs(end - start) / 1000).toFixed();
          break;
        default:
          break;
      }
    }
    appendRow(activeTable, rowData);
  };

  moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    const { events } = this.state;
    const idx = events.indexOf(event);
    let updatedData = {};
    const { activeTable, modifyRow, settings } = this.props;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    if (startDateColumn) {
      const { type, data } = startDateColumn;
      if (type === CellType.FORMULA) {
        return;
      }
      const startDateFormat = data && data.format;
      const startDateMinutePrecision = startDateFormat && startDateFormat.indexOf('HH:mm') > -1;
      updatedData[startDateColumn.name] = this.getFormattedDate(start, startDateFormat);
      if (!droppedOnAllDaySlot && startDateMinutePrecision && event.allDay) {
        event.allDay = false;
        end = new Date(start.valueOf());
        end.setHours(end.getHours() + TableEvent.FIXED_PERIOD_OF_TIME_IN_HOURS);
      }
      if (droppedOnAllDaySlot && startDateMinutePrecision) {
        // an event can only be made all-day if it has a true end-date field when its start-date is with
        // time (with minute precision) [if an event is across two days, it is also displayed on top]
        if (endDateColumn && (endDateColumn !== startDateColumn) && endDateColumn.type === CellType.DATE) {
          const startEndSameDay = dayjs(start).format('YYYY-MM-DD') === dayjs(end).format('YYYY-MM-DD');
          if (startEndSameDay) {
            end = dayjs(end).add(1, 'day').startOf('day').toDate();
          }
        }
      }
    }
    if (endDateColumn) {
      const { type, data } = endDateColumn;
      if (type === CellType.FORMULA) {
        end = event.end; // the end date get from the formula column is read only.
      }
      if (type === CellType.DATE) {
        const endDateFormat = data && data.format;
        updatedData[endDateColumn.name] = this.getFormattedDate(end, endDateFormat);
      }
    }
    modifyRow(activeTable, event.row, updatedData);

    const updatedEvent = {
      ...event,
      start,
      end,
      ...{ row: getRowById(activeTable, event.row._id) }
    };
    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    this.setState({
      events: nextEvents
    });
  };

  handleSelectSlot = ({ action, start, end }) => {
    if (action === 'select') {
      this.createEvent({ start, end });
    }
  };

  handleSelecting = ({ start, end }) => {
    const { settings } = this.props;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const startDateColumn = this.getDateColumn(startDateColumnName);
    return startDateColumn.type === CellType.DATE;
  };

  render() {
    const { settings, calendarViews } = this.props;
    const { events } = this.state;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const startDateColumn = this.getDateColumn(startDateColumnName);

    const configuredWeekStart = settings[SETTING_KEY.WEEK_START];
    const startYearFirstWeek = settings[SETTING_KEY.START_YEAR_FIRST_WEEK];
    const localizer = momentLocalizer(dayjs, configuredWeekStart, startYearFirstWeek);
    return (
      <DragAndDropCalendar
        {...this.props}
        startDateColumn={startDateColumn}
        configuredWeekStart={configuredWeekStart}
        localizer={localizer}
        events={events}
        views={calendarViews}
        view={this.state.selectedView}
        onSelectView={this.onSelectView}
        defaultDate={new Date()}
        onRowExpand={this.onRowExpand}
        onSelectEvent={this.onSelectEvent}
        onInsertRow={this.onInsertRow}
        selectable
        onSelectSlot={this.handleSelectSlot}
        onSelecting={this.handleSelecting}
        onEventDrop={this.moveEvent}
      />
    );
  }
}

ReactBigCalendar.propTypes = propTypes;

export default ReactBigCalendar;
