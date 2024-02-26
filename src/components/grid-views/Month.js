import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import dayjs from 'dayjs';
import getPosition from 'dom-helpers/position';
import { getDtableLang, getDtablePermission } from '../../utils/common';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import { getFestival } from '../../utils/festival';
import {
  getInitialState,
  getInitStateByDateRange,
  getOverscanStartIndex,
  getOverscanEndIndex,
  getRenderedRowsCount,
  getNextMonthDate,
  isNextMonth,
  getAllWeeksStartDates,
  getVisibleStartIndexByDate,
  getWeekEndDate,
  getVisibleBoundariesByScrollTop,
  getOverscanStartIndexWithinDateRange,
  getOverScanEndIdxWithinDateRange,
  getVisibleStartIndexByWeekStartDate,
  getVisibleEndIndex,
} from '../../utils/monthViewUtils';
import { navigate, MONTH_ROW_HEIGHT, OVERSCAN_ROWS, OFFSET_ROWS } from '../../constants';
import { DATE_UNIT } from '../../constants/date';
import Popup from '../popup/Popup';
import DateContentRow from '../rows/DateContentRow';
import Header from '../header/Header';
import DateHeader from '../header/DateHeader';
import { sortEvents } from '../../utils/eventLevels';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DndContext } from '@dnd-kit/core';
import { pointerWithin, rectIntersection } from '@dnd-kit/core';
import { isEmptyObject } from 'dtable-utils';
import { throttle } from 'lodash-es';

dayjs.extend(customParseFormat);

class MonthView extends React.Component {

  constructor(...args) {
    super(...args);
    this._bgRows = [];
    this._pendingSelection = [];
    this.state = {
      needLimitMeasure: false,
      popup: false,
      hoverDate: null,
      hoverDateCellPosition: {},
      weekEventsMap: this.getWeekEventsMap(this.props.events, this.props.accessors),
    };
    this.rbcDateCells = {};
    this.lang = getDtableLang();
    this.isChinese = this.lang && this.lang.toLowerCase() === 'zh-cn';
    this.isTableReadOnly = getDtablePermission() === 'r';
    this.isScrolling = false;
    this.festivals = {};
    this.initDateRange();
    this.shouldSortEvents = true;
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

    if (this.shouldSortEvents) {
      this.sortWeeksEvents(weekEventsMap, accessors);
    }
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

  componentDidMount() {
    if (this.rbcMonthRows) {
      const { localizer, isMobile } = this.props;
      let monthRowsHeight = this.rbcMonthRows.offsetHeight;
      let renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
      let initState;
      if (isMobile) {
        initState = getInitStateByDateRange(this.startDate, this.endDate, this.props.date, renderedRowsCount, localizer);
      } else {
        initState = getInitialState(this.props.date, renderedRowsCount, localizer);
      }
      this.setState({
        ...initState
      }, () => {
        this.rbcMonthRows.scrollTop = this.state.visibleStartIndex * MONTH_ROW_HEIGHT;
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.events !== this.props.events) {
      const newWeekEventsMap = this.getWeekEventsMap(this.props.events, this.props.accessors);
      this.setState({ weekEventsMap: newWeekEventsMap });
    }

    if (prevProps.configuredWeekStart !== this.props.configuredWeekStart) { // for set 'week start'
      const monthRowsHeight = this.rbcMonthRows.offsetHeight;
      const renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
      const allWeeksStartDates = getAllWeeksStartDates(this.props.date, renderedRowsCount, this.props.localizer);
      let updated = { allWeeksStartDates };
      if (this.props.isMobile) {
        this.isScrolling = false;
        const { visibleStartIndex, visibleEndIndex, overscanStartIndex, overscanEndIndex } = this.getVisibleBoundariesByDate(this.props.date, allWeeksStartDates, monthRowsHeight);
        updated.visibleStartIndex = visibleStartIndex;
        updated.visibleEndIndex = visibleEndIndex;
        updated.overscanStartIndex = overscanStartIndex;
        updated.overscanEndIndex = overscanEndIndex;
        this.setState(updated, () => {
          this.rbcMonthRows.scrollTop = visibleStartIndex * MONTH_ROW_HEIGHT;
        });
        return;
      }
      this.setState(updated);
    }

    if (prevProps.date !== this.props.date && this.props.changeDateByNavicate) {
      if (this.props.isMobile) {
        this.updateScrollByDateOnMobile(this.props.date, this.state.allWeeksStartDates);
        return;
      }
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

  initDateRange = () => {
    if (!this.props.isMobile) return;
    this.startDate = dates.startOf(dayjs(this.props.date).startOf(DATE_UNIT.YEAR).subtract(2, DATE_UNIT.YEAR), DATE_UNIT.WEEK, this.props.localizer.startOfWeek());
    this.endDate = dates.startOf(dayjs(this.props.date).endOf(DATE_UNIT.YEAR).add(2, DATE_UNIT.YEAR), DATE_UNIT.WEEK, this.props.localizer.startOfWeek());
  };

  onMonthViewScroll = (evt) => {
    if (!this.isScrolling) {
      this.isScrolling = true;
      return;
    }
    const scrollTop = evt.target.scrollTop;
    const { date, isMobile } = this.props;
    const { allWeeksStartDates } = this.state;
    const monthRowsHeight = this.rbcMonthRows.offsetHeight;
    if (isMobile) {
      this.onScrollOnMobile(scrollTop, date, allWeeksStartDates, monthRowsHeight);
    } else {
      this.onScrollOnDesktop(scrollTop, date, allWeeksStartDates, monthRowsHeight);
    }
  };

  onScrollOnDesktop = (scrollTop, currentDate, allWeeksStartDates, monthRowsHeight) => {
    const renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
    const overRowsCount = scrollTop / MONTH_ROW_HEIGHT;
    const fract = overRowsCount - Math.trunc(overRowsCount);
    let visibleStartIndex = Math.ceil(overRowsCount) - 1;
    visibleStartIndex = visibleStartIndex < 0 ? 0 : visibleStartIndex;
    if (isNextMonth(currentDate, allWeeksStartDates, visibleStartIndex)) {
      this.isScrolling = false;
      const nextMonthDate = getNextMonthDate(allWeeksStartDates, visibleStartIndex);
      const lastVisibleWeekStartDate = allWeeksStartDates[visibleStartIndex];
      allWeeksStartDates = getAllWeeksStartDates(nextMonthDate, renderedRowsCount, this.props.localizer);
      visibleStartIndex = getVisibleStartIndexByDate(lastVisibleWeekStartDate, allWeeksStartDates);
      scrollTop = (visibleStartIndex + (fract || 1)) * MONTH_ROW_HEIGHT;
      this.props.updateCurrentDate(getWeekEndDate(nextMonthDate));
    }
    const visibleEndIndex = visibleStartIndex + renderedRowsCount;
    this.updateScroll(scrollTop, visibleStartIndex, visibleEndIndex, allWeeksStartDates);
  };

  onScrollOnMobile = (scrollTop, currentDate, allWeeksStartDates, monthRowsHeight) => {
    const datesCount = allWeeksStartDates.length;
    const { visibleStartIndex, visibleEndIndex } = getVisibleBoundariesByScrollTop(scrollTop, monthRowsHeight, datesCount);
    const overscanStartIndex = getOverscanStartIndexWithinDateRange(visibleStartIndex);
    const overscanEndIndex = getOverScanEndIdxWithinDateRange(visibleEndIndex, datesCount);
    if (isNextMonth(currentDate, allWeeksStartDates, visibleStartIndex)) {
      const nextMonthDate = getNextMonthDate(allWeeksStartDates, visibleStartIndex);
      this.props.updateCurrentDate(getWeekEndDate(nextMonthDate));
    }
    this.setState({
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
    });
  };

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
  };

  updateScrollByDateOnMobile = (date, allWeeksStartDates) => {
    const monthRowsHeight = this.rbcMonthRows.offsetHeight;
    const { visibleStartIndex, visibleEndIndex, overscanStartIndex, overscanEndIndex } = this.getVisibleBoundariesByDate(date, allWeeksStartDates, monthRowsHeight);
    this.setState({
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
    }, () => {
      this.rbcMonthRows.scrollTop = visibleStartIndex * MONTH_ROW_HEIGHT;
    });
  };

  getVisibleBoundariesByDate = (date, allWeeksStartDates, monthRowsHeight) => {
    const datesCount = allWeeksStartDates.length;
    const currentWeekStartDate = dayjs(dates.startOf(date, DATE_UNIT.WEEK, this.props.localizer.startOfWeek())).subtract(1, DATE_UNIT.WEEK);
    const renderedRowsCount = getRenderedRowsCount(monthRowsHeight);
    const visibleStartIndex = getVisibleStartIndexByWeekStartDate(currentWeekStartDate, allWeeksStartDates);
    const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, datesCount);
    const overscanStartIndex = getOverscanStartIndexWithinDateRange(visibleStartIndex);
    const overscanEndIndex = getOverScanEndIdxWithinDateRange(visibleEndIndex, datesCount);
    return {
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
    };
  };

  isDateBetweenDateRange = (date) => {
    return dates.inRange(date, this.startDate, this.endDate, DATE_UNIT.MONTH);
  };

  scrollToTop = () => {
    let scrollTop = this.rbcMonthRows.scrollTop;
    if (scrollTop === 0) {
      return;
    }
    this.rbcMonthRows.scrollTop = 0;
  };

  scrollToBottom = () => {
    const { scrollHeight, offsetHeight, scrollTop } = this.rbcMonthRows;
    const restScrollTop = scrollHeight - offsetHeight;
    if (restScrollTop - scrollTop === 0) {
      return;
    }
    this.rbcMonthRows.scrollTop = restScrollTop;
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

  measureRowLimit() {
    this.setState({ needLimitMeasure: false });
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

  renderWeek = (weekStartDate, weekIdx) => {
    let { components, selectable, getNow, selected, date, localizer, longPressThreshold,
      accessors, getters, isMobile } = this.props;
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
        isMobile={isMobile}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderFestival={isMobile && this.isChinese && this.renderFestivalCell}
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
    let { date: currentDate, getDrilldownView, localizer, isMobile } = this.props;
    let isOffRange = dates.month(date) !== dates.month(currentDate);
    let drilldownView = getDrilldownView(date);
    let label = localizer.format(date, 'dateFormat');
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader;
    const isDesktop = !isMobile;
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
        {isDesktop && this.isChinese && this.renderFestival(date)}
        {isDesktop && !this.isTableReadOnly && <div className="calendar-insert-row-btn" onClick={this.onInsertRow.bind(this, date)}><i className="dtable-font dtable-icon-add-table"></i></div>}
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

  renderFestivalCell = (date) => {
    return this.renderFestival(date);
  };

  renderHeaders(row) {
    let { localizer, components, isMobile } = this.props;
    let first = row[0];
    let last = row[row.length - 1];
    let HeaderComponent = components.header || Header;
    const isDesktop = !isMobile;

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className='rbc-header'>
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, isDesktop ? 'weekdayFormat' : 'yearMonthWeekdayFormat')}
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
        onSelect={this.handleRowExpand}
        onDoubleClick={this.handleDoubleClickEvent}
        onHidePopup={this.onHidePopup}
      />
    );
  }

  customCollisionDetectionAlgorithm =  (args) => {
    // First, let's see if there are any collisions with the pointer
    const pointerCollisions = pointerWithin(args);
    
    // Collision detection algorithms return an array of collisions
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // If there are no collisions with the pointer, return rectangle intersections
    return rectIntersection(args);
  };
  
  getNewEventTime = (event, newStartDate) => {
    const dateRange = dates.range(event.start, event.end, 'day');
    const newStart = newStartDate;
    const newEnd = dates.add(newStartDate, dateRange.length - 1, 'day');
    return { start: newStart, end: newEnd };

  };

  handleEventDrag = (event, newTime) => {
    // i just use date as the dropped item id, cause they are unique
    const { start, end } = this.getNewEventTime(event, newTime);
    this.props.onEventDragDrop({ event, start, end, allDay: event.allDay });
  };

  handleEventResizeDrop = () => {
    this.props.onResizeDrop();
    // sort after resize end
    setTimeout(() => {
      this.setShouldSort(true);
    }, 500);
  };

  handleEventDrop = (e) => {

    // fix use double clicking on event was recognized as drag and drop
    const endDragging = new Date();
    const timeDiff = endDragging - this.startDragging;
    if (timeDiff < 300) {
      this.props.onSelectEvent(e.active.data.current.event.row._id);
      this.setShouldSort(true);
      this.startDragging = null;
      return;
    }

    const dropData = e.active.data.current;
    const event = dropData.event;
    if (!e.over || !event) return;

    const droppedValue = e.over.data.current?.value;

    if (dropData.type === 'dnd') {
      this.handleEventDrag(event, droppedValue);
    } else if (dropData.type === 'leftResize' || dropData.type === 'rightResize') {
      this.handleEventResizeDrop();
    }
  };

  handleEventResizing = (e) => {
    if (!e.over) return;
    const operateType = e.active.data.current?.type;
    if (operateType?.includes('dnd') || !operateType ) return;

    const resizingData = e.active.data.current;
    if (isEmptyObject(resizingData)) return;

    let newTime = e.over.data.current?.value;
    let start, end;
    if (resizingData.type === 'leftResize') {
      start = newTime;
      end = resizingData.event.end;
    } else if ( resizingData.type === 'rightResize') {
      end = newTime;
      start = resizingData.event.start;
    }
    if (start > end) return;
    this.props.onEventDragResize({ event: resizingData.event, start, end, isAllDay: resizingData.event.allDay });
  };

  setShouldSort = (bool) => { 
    this.shouldSortEvents = bool;
  };

  render() {
    const throttleHandleEventDrop = throttle(this.handleEventDrop, 50);
    const throttleHandleEventResize = throttle(this.handleEventResizing, 50);
    let { className, isMobile } = this.props;
    let { overscanStartIndex, overscanEndIndex, allWeeksStartDates } = this.state;
    let renderWeeks = [], offsetTop = 0, offsetBottom = 0;
    if (allWeeksStartDates) {
      renderWeeks = allWeeksStartDates.slice(overscanStartIndex, overscanEndIndex);
      offsetTop = overscanStartIndex * MONTH_ROW_HEIGHT;
      offsetBottom = (allWeeksStartDates.length - overscanEndIndex) * MONTH_ROW_HEIGHT;
    }
    let weeksCount = renderWeeks.length;
    return (
      <div className={classnames('rbc-month-view', className)} ref={ref => this.currentView = ref}>
        <div className='rbc-month-header'>
          {weeksCount > 0 && this.renderHeaders(dates.getWeekDates(renderWeeks[0]))}
        </div>
        <div className={classnames('rbc-month-rows', { 'rbc-mobile-month-rows': isMobile })} ref={ref => this.rbcMonthRows = ref} onScroll={this.onMonthViewScroll}>
          <DndContext
            collisionDetection={this.customCollisionDetectionAlgorithm}
            onDragEnd={throttleHandleEventDrop}
            onDragMove={throttleHandleEventResize}
            onDragStart={() => {
              this.setShouldSort(false);
              this.startDragging = new Date();
            }}
          >
            <div style={{ paddingTop: offsetTop, paddingBottom: offsetBottom, }}>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {weeksCount > 0 && renderWeeks.map(this.renderWeek)}
              </div>
            </div>
          </DndContext>
        </div>
        {this.state.popup && this.renderOverlay()}
      </div>
    );
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
  onEventDrop: PropTypes.func,
  onEventResize: PropTypes.func,
  onResizeDrop: PropTypes.func,
  onEventDragResize: PropTypes.func,
  onEventDragDrop: PropTypes.func,
  onSelectEvent: PropTypes.func,
  isMobile: PropTypes.bool,
  configuredWeekStart: PropTypes.number,
  changeDateByNavicate: PropTypes.bool,
  updateCurrentDate: PropTypes.func,

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
