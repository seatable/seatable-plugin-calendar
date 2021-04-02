import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/intl-decorator';
import { getDtableUuid } from './utils/common';
import { isValidDateObject } from './utils/dates';
import { CALENDAR_VIEWS, SETTING_KEY } from './constants';
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
  CellType: PropTypes.object,
  optionColors: PropTypes.array,
  highlightColors: PropTypes.object,
  setting: PropTypes.object,
  onRowExpand: PropTypes.func,
  onInsertRow: PropTypes.func,
  getRowById: PropTypes.func,
};

const calendarViews = [CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH];
const localizer = momentLocalizer(moment);

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
      this.setState({events: newEvents});
    }
    if (this.props.selectedViewIdx !== prevProps.selectedViewIdx) {
      this.setState({selectedView: this.getSelectedView()});
    }
  }

  getSelectedView = () => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable, activeView } = this.props;
    let dtableUuid = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    return selectedCalendarView[key] || CALENDAR_VIEWS.MONTH;
  }

  onSelectView = (view) => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable, activeView } = this.props;
    let dtableUuid = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    selectedCalendarView[key] = view;
    localStorage.setItem('selectedCalendarView', JSON.stringify(selectedCalendarView));
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

  getLabelColumn = (columnName) => {
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
    let labelColumn = this.getLabelColumn(colorColumnName);
    let events = [];
    if (!startDateColumn) {
      return [];
    }
    rows.forEach((row) => {
      const formattedRow = getRowById(activeTable, row._id);
      const event = this.getEvent(row, formattedRow, titleColumn, startDateColumn, endDateColumn, labelColumn);
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

  getEvent = (rawRow, row, titleColumn, startDateColumn, endDateColumn, labelColumn) => {
    const { optionColors, highlightColors } = this.props;
    const { name: titleColumnName } = titleColumn || {};
    const { key: startDateColumnKey, name: startDateColumnName, type: startDateColumnType } = startDateColumn || {};
    const { key: endDateColumnKey, name: endDateColumnName, type: endDateColumnType } = endDateColumn || {};
    const title = rawRow[titleColumnName];
    const date = startDateColumnType === 'formula' ? rawRow[startDateColumnName] : row[startDateColumnKey];
    // start date must exist and valid.
    if (!date || !isValidDateObject(new Date(date))) {
      return null;
    }
    const endDate = this.getEventEndDate(rawRow, row, endDateColumnType, endDateColumnName, endDateColumnKey, date);
    // Invalid event:
    // 1. invalid end date
    // 2. duration less than 0 between end date with start date.
    if (endDate && (!isValidDateObject(new Date(endDate)) || moment(endDate).isBefore(date))) {
      return null;
    }
    let bgColor, textColor;
    if (labelColumn) {
      const { key: colorColumnKey, data } = labelColumn;
      const colorDataOptions = data && data.options;
      const colorId = row[colorColumnKey];
      const colorOption = colorDataOptions && colorDataOptions.find(o => o.id === colorId);
      bgColor = colorOption ? colorOption.color : optionColors[2].COLOR;
      textColor = colorOption ? colorOption.textColor : optionColors[2].TEXT_COLOR;
    } else {
      bgColor = optionColors[2].COLOR;
      textColor = optionColors[2].TEXT_COLOR;
    }
    const highlightColor = highlightColors[bgColor];
    return new TableEvent({row, date, endDate, title, bgColor, highlightColor, textColor});
  }

  onRowExpand = (row) => {
    this.props.onRowExpand(row, this.props.activeTable);
  }

  onInsertRow = (rowData) => {
    let { activeTable, activeView, onInsertRow, rows } = this.props;
    let row_id = rows.length > 0 ? rows[rows.length - 1]._id : '';
    onInsertRow(rowData, activeTable, activeView, row_id);
  }

  getFormattedDate = (date, originalFormat) => {
    const targetFormat = originalFormat && originalFormat.indexOf('HH:mm') > -1 ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
    return moment(date).format(targetFormat);
  }

  moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    let updatedData = {};
    let { activeTable, modifyRow, setting, CellType } = this.props;
    const { settings = {} } = setting;
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
      updatedData[startDateColumn.name] = this.getFormattedDate(start, startDateFormat);
    }
    if (endDateColumn) {
      const { type, data } = endDateColumn;
      if (type === CellType.FORMULA) {
        return;
      }
      if (type !== CellType.DURATION) {
        const endDateFormat = data && data.format;
        updatedData[endDateColumn.name] = this.getFormattedDate(end, endDateFormat);
      }
    }
    modifyRow(activeTable, event.row, updatedData);
  }

  render() {
    let { columns, setting } = this.props;
    const { events } = this.state;
    const { settings = {} } = setting;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const colorColumnName = settings[SETTING_KEY.COLUMN_COLOR];
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let labelColumn = this.getLabelColumn(colorColumnName);
    return (
      <DragAndDropCalendar
        columns={columns}
        startDateColumn={startDateColumn}
        labelColumn={labelColumn}
        localizer={localizer}
        events={events}
        views={calendarViews}
        view={this.state.selectedView}
        onSelectView={this.onSelectView}
        defaultDate={new Date()}
        onRowExpand={this.onRowExpand}
        onInsertRow={this.onInsertRow}
        hideViewSettingPanel={this.props.hideViewSettingPanel}
        selectable={true}
        onEventDrop={this.moveEvent}
        isExporting={this.props.isExporting}
        exportedMonths={this.props.exportedMonths}
      />
    );
  }
}

ReactBigCalendar.propTypes = propTypes;

export default ReactBigCalendar;
