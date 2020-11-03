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

  getDateColumn = (columnName) => {
    const { columns, CellType } = this.props;
    if (!Array.isArray(columns)) return null;
    if (!columnName) {
      return columns.find(c => c.type === CellType.DATE) || null;
    }
    return columns.find(c => c.name === columnName) || null;
  }

  getLabelColumn = () => {
    const { setting, columns, CellType } = this.props;
    const { settings = {} } = setting;
    const labelColumnName = settings[SETTING_KEY.COLUMN_COLOR];
    if (!Array.isArray(columns)) return null;
    if (labelColumnName) {
      return columns.find(c => c.name === labelColumnName) || null;
    }
    return columns.find(c => c.type === CellType.SINGLE_SELECT) || null;
  }

  getEvents = (startDateColumn, endDateColumn, labelColumn) => {
    let { activeTable, rows, getRowById } = this.props;
    let events = [];
    if (!startDateColumn) {
      return [];
    }
    rows.forEach((row) => {
      const formattedRow = getRowById(activeTable, row._id);
      const event = this.getEvent(formattedRow, startDateColumn, endDateColumn, labelColumn);
      events.push(event);
    });
    return events;
  }

  getEvent = (row, startDateColumn, endDateColumn, labelColumn) => {
    const { optionColors, highlightColors } = this.props;
    const { key: startDateColumnKey } = startDateColumn || {};
    const { key: endDateColumnKey } = endDateColumn || {};
    const title = this.getRecordName(row);
    const date = row[startDateColumnKey];
    const endDate = row[endDateColumnKey];
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

  getRecordName = (row) => {
    return row['0000'] || intl.get('Unnamed_record');
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
      const { data = {} } = startDateColumn; // `data = {}`: to be compatible with old data
      const { format = 'YYYY-MM-DD' } = data;
      updatedData[startDateColumn.name] = moment(start).format(format);
    }
    if (endDateColumn) {
      const { data = {} } = endDateColumn;
      const { format = 'YYYY-MM-DD' } = data;
      updatedData[endDateColumn.name] = moment(start).format(format);
    }
    modifyRow(activeTable, event.row, updatedData);
  }

  render() {
    let { columns, setting } = this.props;
    const { settings = {} } = setting;
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    let startDateColumn = this.getDateColumn(startDateColumnName);
    let endDateColumn = endDateColumnName ? this.getDateColumn(endDateColumnName) : null;
    let labelColumn = this.getLabelColumn();
    let events = this.getEvents(startDateColumn, endDateColumn, labelColumn);
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
