import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import intl from 'react-intl-universal';
import Calendar from './Calendar';
import momentLocalizer from './utils/localizers/moment';
import { getDtableUuid } from './utils/common';
import { CALENDAR_VIEWS } from './constants';
import CalendarSelectColumnDialog from './components/dialog/calendar-select-column-dialog';
import TableEvent from './model/event';

import './css/react-big-calendar.css';

const propTypes = {
  activeTable: PropTypes.object,
  activeView: PropTypes.object,
  columns: PropTypes.array,
  rows: PropTypes.array,
  CellType: PropTypes.object,
  optionColors: PropTypes.array,
  highlightColors: PropTypes.object,
  setting: PropTypes.object,
  onRowExpand: PropTypes.func,
  updateSettings: PropTypes.func,
  onInsertRow: PropTypes.func,
};

const calendarViews = [CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH];
const globalizeLocalizer = momentLocalizer(moment);

class ReactBigCalendar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedView: this.getSelectedView(),
      isShowSelectColumnDialog: false,
    };
  }

  getSelectedView = () => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable } = this.props;
    let { dtableUuid } = getDtableUuid();
    let key = dtableUuid + '_' + activeTable._id;
    return selectedCalendarView[key] || CALENDAR_VIEWS.MONTH;
  }

  onSelectView = (view) => {
    let selectedCalendarView = JSON.parse(localStorage.getItem('selectedCalendarView')) || {};
    let { activeTable } = this.props;
    let { dtableUuid } = getDtableUuid();
    let key = dtableUuid + '_' + activeTable._id;
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
    let { rows } = this.props;
    let events = [];
    if (!startDateColumn) {
      return [];
    }
    rows.forEach((row) => {
      const event = this.getEvent(row, startDateColumn, endDateColumn, labelColumn);
      events.push(event);
    });
    return events;
  }

  getEvent = (row, startDateColumn, endDateColumn, labelColumn) => {
    const { optionColors, highlightColors } = this.props;
    const { name: startDateColumnName } = startDateColumn || {};
    const { name: endDateColumnName } = endDateColumn || {};
    const title = this.getRecordName(row);
    const date = row[startDateColumnName];
    const endDate = row[endDateColumnName];
    let bgColor, textColor;
    if (labelColumn) {
      const { name: colorColumnName, data } = labelColumn;
      const colorDataOptions = data && data.options;
      const colorName = row[colorColumnName];
      const colorOption = colorDataOptions && colorDataOptions.find(o => o.name === colorName);
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

  modifySelectedColumn = (startDateColumn, endDateColumn, labelColumn) => {
    let { key: start_date_column_key } = startDateColumn || {};
    let { key: end_date_column_key } = endDateColumn || {};
    let { key: label_column_key } = labelColumn || {};
    this.props.updateSettings(this.props.activeTable, start_date_column_key, label_column_key, end_date_column_key);
    this.setState({ isShowSelectColumnDialog: false });
  }

  onToggleSelectColumn= () => {
    this.setState({isShowSelectColumnDialog: !this.state.isShowSelectColumnDialog});
  }

  onRowExpand = (row) => {
    this.props.onRowExpand(row, this.props.activeTable);
  }

  onInsertRow = (rowData) => {
    let { activeTable, activeView, onInsertRow } = this.props;
    onInsertRow(rowData, activeTable, activeView);
  }

  render() {
    let { columns, CellType, setting } = this.props;
    let { start_date_column_key, end_date_column_key } = setting;
    let startDateColumn = this.getDateColumn(start_date_column_key);
    let endDateColumn = end_date_column_key ? this.getDateColumn(end_date_column_key) : null;
    let labelColumn = this.getLabelColumn();
    let events = this.getEvents(startDateColumn, endDateColumn, labelColumn);
    return (
      <React.Fragment>
        <Calendar
          columns={columns}
          startDateColumn={startDateColumn}
          labelColumn={labelColumn}
          onToggleSelectColumn={this.onToggleSelectColumn}
          localizer={globalizeLocalizer}
          events={events}
          views={calendarViews}
          view={this.state.selectedView}
          onSelectView={this.onSelectView}
          defaultDate={new Date()}
          onRowExpand={this.onRowExpand}
          onInsertRow={this.onInsertRow}
        />
        {this.state.isShowSelectColumnDialog &&
          <CalendarSelectColumnDialog
            onToggleSelectColumn={this.onToggleSelectColumn}
            modifySelectedColumn={this.modifySelectedColumn}
            columns={columns}
            startDateColumn={startDateColumn}
            endDateColumn={endDateColumn}
            labelColumn={labelColumn}
            CellType={CellType}
          />
        }
      </React.Fragment>
    );
  }
}

ReactBigCalendar.propTypes = propTypes;

export default ReactBigCalendar;