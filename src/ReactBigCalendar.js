import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/intl-decorator';
import { getDtableUuid } from './utils/common';
import { isValidDateObject } from './utils/dates';
import { getCollaboratorsName } from './utils/value-format-utils';
import { CALENDAR_VIEWS, PLUGIN_NAME, SETTING_KEY } from './constants';
import TableEvent from './model/event';
import withDragAndDrop from './addons/dragAndDrop';

import './css/react-big-calendar.css';
import './addons/dragAndDrop/styles.css';

const LOCALSTORAGE_KEY_SELECTED_CALENDAR_VIEW = `.${PLUGIN_NAME}.selectedCalendarView`;

const DragAndDropCalendar = withDragAndDrop(Calendar);

const propTypes = {
  activeTable: PropTypes.object,
  activeView: PropTypes.object,
  selectedViewIdx: PropTypes.number,
  columns: PropTypes.array,
  rows: PropTypes.array,
  CellType: PropTypes.object,
  optionColors: PropTypes.array,
  highlightColors: PropTypes.object,
  setting: PropTypes.object,
  isMobile: PropTypes.bool,
  onRowExpand: PropTypes.func,
  onInsertRow: PropTypes.func,
  getRowById: PropTypes.func,
};

const localizer = momentLocalizer(moment);

class ReactBigCalendar extends React.Component {

  constructor(props) {
    super(props);
    this.initCalendarViews();
    this.state = {
      selectedView: this.getSelectedView(),
      events: this.getEvents(props),
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.rows !== this.props.rows) {
      const newEvents = this.getEvents(this.props);
      this.setState({events: newEvents});
    }
    if (this.props.selectedViewIdx !== prevProps.selectedViewIdx) {
      this.setState({selectedView: this.getSelectedView()});
    }
  }

  initCalendarViews = () => {
    if (this.props.isMobile) {
      this.calendarViews = [CALENDAR_VIEWS.MONTH];
    } else {
      this.calendarViews = [CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH, CALENDAR_VIEWS.WEEK, CALENDAR_VIEWS.DAY, CALENDAR_VIEWS.AGENDA];
    }
  }

  getSelectedView = () => {
    let selectedCalendarView = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_SELECTED_CALENDAR_VIEW)) || {};
    let { activeTable, activeView } = this.props;
    let dtableUuid = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    let view = selectedCalendarView[key];
    return -1 === this.calendarViews.indexOf(view) ? CALENDAR_VIEWS.MONTH : view;
  }

  onSelectView = (view) => {
    let selectedCalendarView = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_SELECTED_CALENDAR_VIEW)) || {};
    let { activeTable, activeView } = this.props;
    let dtableUuid = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    selectedCalendarView[key] = view;
    localStorage.setItem(LOCALSTORAGE_KEY_SELECTED_CALENDAR_VIEW, JSON.stringify(selectedCalendarView));
    this.setState({selectedView: view});
  }

  getTitleColumn = (columnName) => {
    const { columns, CellType } = this.props;
    const titleColumnTypes = [
      CellType.TEXT, CellType.SINGLE_SELECT, CellType.FORMULA,
      CellType.COLLABORATOR, CellType.CREATOR, CellType.LAST_MODIFIER];
    if (!Array.isArray(columns)) return null;
    if (columnName) {
      return columns.find(c => c.name === columnName) || null;
    }
    return columns.find(c => titleColumnTypes.indexOf(c.type) !== -1) || null;
  }

  getDateColumn = (columnName) => {
    const { columns, CellType } = this.props;
    if (!Array.isArray(columns)) return null;
    if (!columnName) {
      return columns.find(c => {
        return c.type === CellType.DATE ||
          (c.type === CellType.FORMULA && c.data.result_type === 'date');
      }) || null;
    }
    return columns.find(c => c.name === columnName) || null;
  }

  getColorColumn = (columnName) => {
    const { columns, CellType } = this.props;
    if (!Array.isArray(columns)) return null;
    if (columnName) {
      return columns.find(c => c.name === columnName) || null;
    }
    return columns.find(c => c.type === CellType.SINGLE_SELECT) || null;
  }

  getEvents = (props) => {
    let { activeTable, rows, getRowById, setting } = props;
    const { settings = {} } = setting;
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
  }

  getEventEndDate = (rawRow, row, columnType, columnName, columnKey, startDate) => {
    const { CellType } = this.props;
    switch (columnType) {
      case CellType.DATE: return row[columnKey];
      case CellType.FORMULA: return rawRow[columnName];
      case CellType.DURATION:
        return moment(startDate).add(rawRow[columnName], 'seconds').format('YYYY-MM-DD HH:mm');
      default: return null;
    }
  }

  getEventTitle = (rawRow, columnType, columnName) => {
    const { CellType, collaborators } = this.props;
    const title = rawRow[columnName];
    switch (columnType) {
      case CellType.COLLABORATOR:
        return getCollaboratorsName(collaborators, title);
      default: return title;
    }
  }

  getEvent = (rawRow, row, titleColumn, startDateColumn, endDateColumn, colorColumn) => {
    const { optionColors, highlightColors } = this.props;
    const { type: titleColumnType, name: titleColumnName } = titleColumn || {};
    const { key: startDateColumnKey, name: startDateColumnName, type: startDateColumnType } = startDateColumn || {};
    const { key: endDateColumnKey, name: endDateColumnName, type: endDateColumnType } = endDateColumn || {};
    const title = this.getEventTitle(rawRow, titleColumnType, titleColumnName);
    const date = startDateColumnType === 'formula' ? rawRow[startDateColumnName] : row[startDateColumnKey];
    // start date must exist and be valid.
    if (!date || !isValidDateObject(new Date(date))) {
      return null;
    }
    const endDate = this.getEventEndDate(rawRow, row, endDateColumnType, endDateColumnName, endDateColumnKey, date);
    // end date if exists must be valid
    // NOTE: end date might be before start date, this is delegated to TableEvent()
    if (endDate && !isValidDateObject(new Date(endDate))) {
      return null;
    }
    const eventColors = TableEvent.getColors({row, colorColumn, optionColors, highlightColors});
    return new TableEvent({row, date, endDate, title, ...eventColors});
  }

  onRowExpand = (row) => {
    this.props.onRowExpand(row, this.props.activeTable);
  }

  onSelectEvent = ({row}) => this.onRowExpand(row);

  onInsertRow = (rowData) => {
    let { activeTable, activeView, onInsertRow, rows } = this.props;
    let row_id = rows.length > 0 ? rows[rows.length - 1]._id : '';
    onInsertRow(rowData, activeTable, activeView, row_id);
  }

  getFormattedDate = (date, originalFormat) => {
    const targetFormat = originalFormat && originalFormat.indexOf('HH:mm') > -1 ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
    return moment(date).format(targetFormat);
  }

  /**
   * create new event row
   *
   * @param {Date} start
   * @param {Date} end
   */
  createEvent = ({ start, end }) => {
    const { CellType, activeTable, appendRow, setting: {settings} } = this.props;
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
  }

  moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    const { events } = this.state;
    const idx = events.indexOf(event);
    let updatedData = {};
    let { activeTable, modifyRow, setting: {settings}, CellType, getRowById} = this.props;
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
          const startEndSameDay = moment(start).format('YYYY-MM-DD') === moment(end).format('YYYY-MM-DD');
          if (startEndSameDay) {
            end = moment(end).add(1, 'day').startOf('day').toDate();
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

    const updatedEvent = { ...event, start, end, ...{row: getRowById(activeTable, event.row._id)}};
    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    this.setState({
      events: nextEvents
    });
  }

  handleSelectSlot = ({ action, start, end}) => {
    if (action === 'select') {
      this.createEvent({start, end});
    }
  }

  handleSelecting = ({ start, end }) => {
    const { CellType, setting: {settings} } = this.props;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const startDateColumn = this.getDateColumn(startDateColumnName);
    return startDateColumn.type === CellType.DATE;
  }

  render() {
    const { columns, setting: {settings = {}} } = this.props;
    const { events } = this.state;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const startDateColumn = this.getDateColumn(startDateColumnName);
    return (
      <DragAndDropCalendar
        columns={columns}
        startDateColumn={startDateColumn}
        localizer={localizer}
        configuredWeekStart={settings[SETTING_KEY.WEEK_START]}
        events={events}
        views={this.calendarViews}
        view={this.state.selectedView}
        onSelectView={this.onSelectView}
        defaultDate={new Date()}
        onRowExpand={this.onRowExpand}
        onSelectEvent={this.onSelectEvent}
        onInsertRow={this.onInsertRow}
        hideViewSettingPanel={this.props.hideViewSettingPanel}
        selectable
        onSelectSlot={this.handleSelectSlot}
        onSelecting={this.handleSelecting}
        onEventDrop={this.moveEvent}
        isExporting={this.props.isExporting}
        exportedMonths={this.props.exportedMonths}
        isMobile={this.props.isMobile}
      />
    );
  }
}

ReactBigCalendar.propTypes = propTypes;

export default ReactBigCalendar;
