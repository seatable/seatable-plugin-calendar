import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import moment from 'moment';
import getPosition from 'dom-helpers/position';
import { getDtableLang, getDtablePermission } from '../../utils/common';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import { getFestival } from '../../utils/festival';
import {
  getInitialState,
  getOverscanStartIndex,
  getOverscanEndIndex,
  getRenderedRowsCount,
  getNextMonthDate,
  isNextMonth,
  getAllWeeksStartDates,
  getVisibleStartIndexByDate,
  getWeekEndDate
} from '../../utils/monthViewUtils';
import { navigate, MONTH_ROW_HEIGHT, OVERSCAN_ROWS, OFFSET_ROWS } from '../../constants';
import { DATE_UNIT } from '../../constants/date';
import Popup from '../popup/Popup';
import DateContentRow from '../rows/DateContentRow';
import Header from '../header/Header';
import DateHeader from '../header/DateHeader';
import { sortEvents } from '../../utils/eventLevels';
import intl from 'react-intl-universal';

class MonthView extends React.Component {
  constructor(...args) {
    super(...args);
    this._bgRows = [];
    this._pendingSelection = [];
    this.slotRowRef = React.createRef();
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
    this.isScrolling = false;
    this.festivals = {};
  }

  getWeekEventsMap = (events, accessors) => {
    let weekEventsMap = {};
    events.forEach((event) => {
      const { start, end } = event;
      const m_end = moment(end);
      let m_eventWeekStart = moment(dates.startOf(start, DATE_UNIT.WEEK, this.props.localizer.startOfWeek()));
      let m_eventWeekEnd = moment(dates.endOf(start, DATE_UNIT.WEEK, this.props.localizer.startOfWeek()));
      this.updateWeekEvents(weekEventsMap, m_eventWeekStart, event);
      while(m_end.isAfter(m_eventWeekEnd)) {
        m_eventWeekStart.add(7, DATE_UNIT.DAY);
        m_eventWeekEnd.add(7, DATE_UNIT.DAY);
        this.updateWeekEvents(weekEventsMap, m_eventWeekStart, event);
      }
    });
    this.sortWeeksEvents(weekEventsMap, accessors);
    return weekEventsMap;
  }

  updateWeekEvents = (weekEventsMap, m_eventWeekStart, event) => {
    const formatEventWeekStart = m_eventWeekStart.format('YYYY-MM-DD');
    if (weekEventsMap[formatEventWeekStart]) {
      weekEventsMap[formatEventWeekStart].push(event);
    } else {
      weekEventsMap[formatEventWeekStart] = [event];
    }
  }

  sortWeeksEvents = (weekEventsMap, accessors) => {
    Object.keys(weekEventsMap).forEach((weekStart) => {
      let events = weekEventsMap[weekStart];
      weekEventsMap[weekStart].events = events.sort((prevEvent, nextEvent) => sortEvents(prevEvent, nextEvent, accessors));
    });
  }

  componentDidMount() {
    if (this.rbcMonthRows) {
      let monthRowsHeight = this.rbcMonthRows.offsetHeight;
      let renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
      this.setState({
        ...getInitialState(this.props.date, renderedRowsCount, this.props.localizer)
      }, () => {
        this.rbcMonthRows.scrollTop = this.state.visibleStartIndex * MONTH_ROW_HEIGHT;
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.events !== this.props.events) {
      const newWeekEventsMap = this.getWeekEventsMap(this.props.events, this.props.accessors);
      this.setState({weekEventsMap: newWeekEventsMap});
    }
    if (prevProps.date !== this.props.date && this.props.changeDateByNavicate) {
      this.isScrolling = false;
      let visibleStartIndex = OVERSCAN_ROWS + OFFSET_ROWS;
      let monthRowsHeight = this.rbcMonthRows.offsetHeight;
      let renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
      let allWeeksStartDates = getAllWeeksStartDates(this.props.date, renderedRowsCount, this.props.localizer);
      let visibleEndIndex = visibleStartIndex + renderedRowsCount;
      let scrollTop = visibleStartIndex * MONTH_ROW_HEIGHT;
      this.updateScroll(scrollTop, visibleStartIndex, visibleEndIndex, allWeeksStartDates);
    }
  }

  getContainer = () => {
    return findDOMNode(this);
  };

  onMonthViewScroll = (evt) => {
    if (!this.isScrolling) {
      this.isScrolling = true;
      return;
    }
    let { date } = this.props;
    let { allWeeksStartDates } = this.state;
    let scrollTop = evt.target.scrollTop;
    let monthRowsHeight = this.rbcMonthRows.offsetHeight;
    let renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
    let overRowsCount = scrollTop / MONTH_ROW_HEIGHT;
    let fract = overRowsCount - Math.trunc(overRowsCount);
    let overDatesCount = Math.ceil(overRowsCount) - 1;
    let visibleStartIndex = overDatesCount;
    if (isNextMonth(date, allWeeksStartDates, visibleStartIndex)) {
      this.isScrolling = false;
      let nextMonthDate = getNextMonthDate(allWeeksStartDates, visibleStartIndex);
      let lastVisibleWeekStartDate = allWeeksStartDates[visibleStartIndex];
      allWeeksStartDates = getAllWeeksStartDates(nextMonthDate, renderedRowsCount, this.props.localizer);
      visibleStartIndex = getVisibleStartIndexByDate(lastVisibleWeekStartDate, allWeeksStartDates);
      scrollTop = (visibleStartIndex + (fract || 1)) * MONTH_ROW_HEIGHT;
      this.props.updateCurrentDate(getWeekEndDate(nextMonthDate));
    }
    let visibleEndIndex = visibleStartIndex + renderedRowsCount;
    this.updateScroll(scrollTop, visibleStartIndex, visibleEndIndex, allWeeksStartDates);
  }

  updateScroll = (scrollTop, visibleStartIndex, visibleEndIndex, allWeeksStartDates) => {
    let overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
    let overscanEndIndex = getOverscanEndIndex(visibleEndIndex);
    this.setState({
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
      allWeeksStartDates
    }, () => {
      this.rbcMonthRows.scrollTop = scrollTop;
    });
  }

  handleShowMore = (events, date, cell, slot, target) => {
    //cancel any pending selections so only the event click goes through.
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

  onRowExpand = (row) => {
    this.props.onRowExpand(row);
  };

  onHidePopup = () => {
    this.setState({popup: false, overlay: {}});
  }

  onInsertRow = (date) => {
    this.props.onInsertRow(dates.getFormattedDate(date, 'YYYY-MM-DD'));
  }

  render() {
    let { className } = this.props;
    let { overscanStartIndex, overscanEndIndex, allWeeksStartDates } = this.state;
    let renderWeeks = [], offsetTop = 0, offsetBottom = 0;
    if (allWeeksStartDates) {
      renderWeeks = allWeeksStartDates.slice(overscanStartIndex, overscanEndIndex);
      offsetTop = overscanStartIndex * MONTH_ROW_HEIGHT;
      offsetBottom = (allWeeksStartDates.length - overscanEndIndex) * MONTH_ROW_HEIGHT;
    }
    let weeksCount = renderWeeks.length;
    return (
      <div className={classnames('rbc-month-view', className)}>
        <div className='rbc-month-header'>
          {weeksCount > 0 && this.renderHeaders(dates.getWeekDates(renderWeeks[0]))}
        </div>
        <div className="rbc-month-rows" ref={ref => this.rbcMonthRows = ref} onScroll={this.onMonthViewScroll}>
          <div style={{paddingTop: offsetTop, paddingBottom: offsetBottom}}>
            {weeksCount > 0 && renderWeeks.map(this.renderWeek)}
          </div>
        </div>
        {this.state.popup && this.renderOverlay()}
      </div>
    );
  }

  renderWeek = (weekStartDate, weekIdx) => {
    let { components, selectable, getNow, selected, date, localizer, longPressThreshold,
      accessors, getters } = this.props;
    const { needLimitMeasure, weekEventsMap } = this.state;
    const formatWeekStartDate = moment(weekStartDate).format('YYYY-MM-DD');
    let weekDates = dates.getWeekDates(weekStartDate);
    let weekEvents = weekEventsMap[formatWeekStartDate] || [];

    return (
      <DateContentRow
        key={formatWeekStartDate}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
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
        onRowExpand={this.onRowExpand}
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
        className={classnames(className, {'rbc-off-range': isOffRange})}
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
      return <div className="rbc-festival">
        <span className="rbc-festival-context" title={festival}>{festival}</span>
      </div>;
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
          label={intl.get('Week_xxx', {weekNumber: intl.get(localizer.format(day, 'weekdayFormat'))})}
        />
      </div>
    ));
  }

  renderOverlay() {
    let overlay = (this.state && this.state.overlay) || {};
    let { accessors, localizer, components, getters, selected, popupOffset } = this.props;

    return (
      <Popup
        {...this.props}
        scrolled={this._scroll || null}
        popupOffset={popupOffset}
        accessors={accessors}
        getters={getters}
        selected={selected}
        components={components}
        localizer={localizer}
        position={overlay.position}
        events={overlay.events}
        slotStart={overlay.date}
        slotEnd={overlay.end}
        onSelect={this.onRowExpand}
        onDoubleClick={this.handleDoubleClickEvent}
        onHidePopup={this.onHidePopup}
      />
    );
  }

  measureRowLimit() {
    this.setState({needLimitMeasure: false});
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

MonthView.propTypes = {
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
  onRowExpand: PropTypes.func,
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

MonthView.range = (date, { localizer }) => {
  let start = dates.firstVisibleDay(date, localizer);
  let end = dates.lastVisibleDay(date, localizer);
  return { start, end };
};

MonthView.navigate = (date, action) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -1, DATE_UNIT.MONTH);

    case navigate.NEXT:
      return dates.add(date, 1, DATE_UNIT.MONTH);

    default:
      return date;
  }
};

MonthView.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat');

export default MonthView;
