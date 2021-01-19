import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import intl from 'react-intl-universal';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/moment';
import { getDtableUuid } from './utils/common';
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
const globalizeLocalizer = momentLocalizer(moment);

class ReactBigCalendar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedView: this.getSelectedView()
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedViewIdx !== prevProps.selectedViewIdx) {
      this.setState({selectedView: this.getSelectedView()});
    }
  }

  getSelectedView = () => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable, activeView } = this.props;
    let { dtableUuid } = getDtableUuid();
    let key = `${dtableUuid}_${activeTable._id}_${activeView._id}`;
    return selectedCalendarView[key] || CALENDAR_VIEWS.MONTH;
  }

  onSelectView = (view) => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable, activeView } = this.props;
    let { dtableUuid } = getDtableUuid();
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
    return columns.find(c => titleColumnTypes.indexOf(c.type) != -1) || null;
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

  getEvents = (titleColumn, startDateColumn, endDateColumn, labelColumn) => {
    let { activeTable, rows, getRowById } = this.props;
    let events = [];
    if (!startDateColumn) {
      return [];
    }
    rows.forEach((row) => {
      const formattedRow = getRowById(activeTable, row._id);
      const event = this.getEvent(row, formattedRow, titleColumn, startDateColumn, endDateColumn, labelColumn);
      events.push(event);
    });
    return events;
  }

  getEvent = (rawRow, row, titleColumn, startDateColumn, endDateColumn, labelColumn) => {
    const { optionColors, highlightColors } = this.props;
    const { key: titleColumnKey, name: titleColumnName, type: titleColumnType } = titleColumn || {};
    const { key: startDateColumnKey, name: startDateColumnName, type: startDateColumnType } = startDateColumn || {};
    const { key: endDateColumnKey, name: endDateColumnName, type: endDateColumnType } = endDateColumn || {};
    const title = rawRow[titleColumnName];
    const date = startDateColumnType == 'formula' ? rawRow[startDateColumnName] : row[startDateColumnKey];
    const endDate = endDateColumnType == 'formula' ? rawRow[endDateColumnName] : row[endDateColumnKey];
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

  moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    let updatedData = {};
    let { activeTable, modifyRow, setting } = this.props;
    const { settings = {} } = setting;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    if (startDateColumn) {
      const { type, data = {} } = startDateColumn; // `data = {}`: to be compatible with old data
      const { format = 'YYYY-MM-DD' } = data;
      if (type == 'formula') {
        return;
      }
      updatedData[startDateColumn.name] = moment(start).format(format);
    }
    if (endDateColumn) {
      const { type, data = {} } = endDateColumn;
      const { format = 'YYYY-MM-DD' } = data;
      if (type == 'formula') {
        return;
      }
      updatedData[endDateColumn.name] = moment(end).format(format);
    }
    modifyRow(activeTable, event.row, updatedData);
  }

  render() {
    let { columns, setting } = this.props;
    const { settings = {} } = setting;
    const titleColumnName = settings[SETTING_KEY.COLUMN_TITLE];
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    const colorColumnName = settings[SETTING_KEY.COLUMN_COLOR];
    let titleColumn = this.getTitleColumn(titleColumnName);
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    let labelColumn = this.getLabelColumn(colorColumnName);
    let events = this.getEvents(titleColumn, startDateColumn, endDateColumn, labelColumn);
    return (
      <React.Fragment>
        <DragAndDropCalendar
          columns={columns}
          startDateColumn={startDateColumn}
          labelColumn={labelColumn}
          localizer={globalizeLocalizer}
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
        />
      </React.Fragment>
    );
  }
}

ReactBigCalendar.propTypes = propTypes;

export default ReactBigCalendar;
