import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import dayjs from 'dayjs';
import getPosition from 'dom-helpers/position';
import chunk from 'lodash/chunk';
import { getDtableLang, getDtablePermission } from '../../utils/common';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import { getFestival } from '../../utils/festival';
import { DATE_UNIT } from '../../constants/date';
import DateContentRow from '../rows/DateContentRow';
import Header from '../header/Header';
import DateHeader from '../header/DateHeader';
import { sortEvents } from '../../utils/eventLevels';

class ExportedMonth extends React.Component {
  constructor(...args) {
    super(...args);
    this._bgRows = [];
    this._pendingSelection = [];
    this.state = {
      needLimitMeasure: false,
      popup: false,
      hoverDate: null,
      hoverDateCellPosition: {},
      weekEventsMap: this.getWeekEventsMap(this.props.events, this.props.accessors)
    };
    this.rbcDateCells = {};
    this.lang = getDtableLang();
    this.isChinese = this.lang && this.lang.toLowerCase() === 'zh-cn';
    this.isTableReadOnly = getDtablePermission() === 'r';
    this.festivals = {};
  }

  getWeekEventsMap = (events, accessors) => {
    let weekEventsMap = {};
    events.forEach((event) => {
      const { start, end } = event;
      const m_end = dayjs(end);
      let m_eventWeekStart = dayjs(dates.startOf(start, DATE_UNIT.WEEK, this.props.localizer.startOfWeek()));
      let m_eventWeekEnd = dayjs(dates.endOf(start, DATE_UNIT.WEEK, this.props.localizer.startOfWeek()));
      this.updateWeekEvents(weekEventsMap, m_eventWeekStart, event);
      while (m_end.isAfter(m_eventWeekEnd)) {
        m_eventWeekStart = m_eventWeekStart.add(7, DATE_UNIT.DAY);
        m_eventWeekEnd = m_eventWeekEnd.add(7, DATE_UNIT.DAY);
        this.updateWeekEvents(weekEventsMap, m_eventWeekStart, event);
      }
    });
    this.sortWeeksEvents(weekEventsMap, accessors);
    return weekEventsMap;
  };

  updateWeekEvents = (weekEventsMap, m_eventWeekStart, event) => {
    const formatEventWeekStart = m_eventWeekStart.format('YYYY-MM-DD');
    if (weekEventsMap[formatEventWeekStart]) {
      weekEventsMap[formatEventWeekStart].push(event);
    } else {
      weekEventsMap[formatEventWeekStart] = [event];
    }
  };

  sortWeeksEvents = (weekEventsMap, accessors) => {
    Object.keys(weekEventsMap).forEach((weekStart) => {
      let events = weekEventsMap[weekStart];
      weekEventsMap[weekStart].events = events.sort((prevEvent, nextEvent) => sortEvents(prevEvent, nextEvent, accessors));
    });
  };

  getContainer = () => {
    return findDOMNode(this);
  };

  handleShowMore = (events, date, cell, slot, target) => {
    // cancel any pending selections so only the event click goes through.
    const { containerPaddingTop, calendarHeaderHeight } = this.props;
    if (!this.state.popup) {
      this.clearSelection();
      let position = getPosition(cell, findDOMNode(this));
      let { top } = position;
      top = top + containerPaddingTop + calendarHeaderHeight;
      position.top = top;
      this.setState({
        overlay: { date, events, position, target },
        popup: true
      });
    }
  };

  handleRowExpand = (row) => {
    this.props.handleRowExpand(row);
  };

  onHidePopup = () => {
    this.setState({ popup: false, overlay: {} });
  };

  onInsertRow = (date) => {
    this.props.onInsertRow(dates.getFormattedDate(date, 'YYYY-MM-DD'));
  };

  render() {
    let { className } = this.props;
    let renderWeeks = [];

    let { localizer, date } = this.props;
    let month = dates.visibleDays(date, localizer);
    let weeks = chunk(month, 7);
    renderWeeks = weeks.map(week => week[0]);
    let weeksCount = renderWeeks.length; // usually there are 5 weeks in a month, but in months such as 2021-05, there are 6 weeks.

    return (
      <div className={classnames('rbc-month-view-exported', className)}>
        <h3 className="mb-3 h4 text-center font-weight-normal">{ExportedMonth.title(date, { localizer })}</h3>
        <div className='rbc-month-header'>
          {weeksCount > 0 && this.renderHeaders(dates.getWeekDates(renderWeeks[0]))}
        </div>
        <div className={`rbc-month-rows ${weeksCount === 6 ? 'rbc-month-rows-6weeks' : ''}`}>
          {weeksCount > 0 && renderWeeks.map(this.renderWeek)}
        </div>
      </div>
    );
  }

  renderWeek = (weekStartDate, weekIdx) => {
    let { components, selectable, getNow, selected, date, localizer, longPressThreshold,
      accessors, getters } = this.props;
    const { needLimitMeasure, weekEventsMap } = this.state;
    const formatWeekStartDate = dayjs(weekStartDate).format('YYYY-MM-DD');
    let weekDates = dates.getWeekDates(weekStartDate);
    let weekEvents = weekEventsMap[formatWeekStartDate] || [];

    return (
      <DateContentRow
        key={formatWeekStartDate}
        uuid={formatWeekStartDate}
        container={this.getContainer}
        className='rbc-month-row'
        getNow={getNow}
        date={date}
        range={weekDates}
        events={weekEvents}
        maxRows={4}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        handleRowExpand={this.handleRowExpand}
        onDoubleClick={this.handleDoubleClickEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
      />
    );
  };

  readerDateHeading = ({ date, className, ...props }) => {
    let { date: currentDate, getDrilldownView, localizer } = this.props;
    let isOffRange = dates.month(date) !== dates.month(currentDate);
    let drilldownView = getDrilldownView(date);
    let label = localizer.format(date, 'dateFormat');
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader;
    return (
      <div
        {...props}
        className={classnames(className, { 'rbc-off-range': isOffRange })}
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={e => this.handleHeadingClick(date, drilldownView, e)}
        />
        {this.isChinese && this.renderFestival(date)}
        {!this.isTableReadOnly && <div className="calendar-insert-row-btn" onClick={this.onInsertRow.bind(this, date)}><i className="dtable-font dtable-icon-add-table"></i></div>}
      </div>
    );
  };

  renderFestival(date) {
    let festival;
    if (Object.keys(this.festivals).includes(date)) {
      festival = this.festivals[date];
    } else {
      festival = getFestival(date);
      this.festivals[date] = festival;
    }
    if (festival) {
      return (
        <div className="rbc-festival">
          <span className="rbc-festival-context" title={festival}>{festival}</span>
        </div>
      );
    }
    return null;
  }

  renderHeaders(row) {
    let { localizer, components } = this.props;
    let first = row[0];
    let last = row[row.length - 1];
    let HeaderComponent = components.header || Header;

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className='rbc-header'>
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, 'weekdayFormat')}
        />
      </div>
    ));
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range);

    clearTimeout(this._selectTimer);
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo));
  };

  handleHeadingClick = (date, view, e) => {
    e.preventDefault();
    this.clearSelection();
    notify(this.props.onDrillDown, [date, view]);
  };

  handleDoubleClickEvent = (...args) => {
    this.clearSelection();
    notify(this.props.onDoubleClickEvent, args);
  };

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice();

    this._pendingSelection = [];

    slots.sort((a, b) => +a - +b);

    notify(this.props.onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1],
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box
    });
  }

  clearSelection() {
    clearTimeout(this._selectTimer);
    this._pendingSelection = [];
  }
}

ExportedMonth.propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),
  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),
  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,
  scrollToTime: PropTypes.instanceOf(Date),
  rtl: PropTypes.bool,
  width: PropTypes.number,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,
  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  handleRowExpand: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  popup: PropTypes.bool,
  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    })
  ]),
  className: PropTypes.object,
  containerPaddingTop: PropTypes.number,
  calendarHeaderHeight: PropTypes.number,
  onHidePopup: PropTypes.func,
  onInsertRow: PropTypes.func,
};

ExportedMonth.range = (date, { localizer }) => {
  let start = dates.firstVisibleDay(date, localizer);
  let end = dates.lastVisibleDay(date, localizer);
  return { start, end };
};

ExportedMonth.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat');

export default ExportedMonth;
