import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import intl from 'react-intl-universal';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/moment';
import { getDtableUuid } from './utils/common';
import { CALENDAR_VIEWS } from './constants';
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
      this.setState({selectedView: this.getSelectedView()})
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

  getDateColumn = (columnKey) => {
    const { columns, CellType } = this.props;
    if (!Array.isArray(columns)) return null;
    if (!columnKey) {
      return columns.find(c => c.type === CellType.DATE) || null;
    }
    return columns.find(c => c.key === columnKey) || null;
  }

  getLabelColumn = () => {
    const { setting, columns, CellType } = this.props;
    const { label_column_key } = setting || {};
    if (!Array.isArray(columns)) return null;
    if (label_column_key) {
      return columns.find(c => c.key === label_column_key) || null;
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
      textColor = optionColors[2].TEXT_COLOR
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
    let { start_date_column_key, end_date_column_key } = setting;
    let startDateColumn = this.getDateColumn(start_date_column_key);
    let endDateColumn = end_date_column_key ? this.getDateColumn(end_date_column_key) : null;
    if (startDateColumn) {
      updatedData[startDateColumn.name] = (new Date(start)).toJSON().substring(0,10);
    }
    if (endDateColumn) {
      updatedData[endDateColumn.name] = (new Date(end)).toJSON().substring(0,10);
    }
    modifyRow(activeTable, event.row, updatedData);
  }

  render() {
    let { columns, setting } = this.props;
    let { start_date_column_key, end_date_column_key } = setting;
    let startDateColumn = this.getDateColumn(start_date_column_key);
    let endDateColumn = end_date_column_key ? this.getDateColumn(end_date_column_key) : null;
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
