import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { findDOMNode } from 'react-dom';
import getPosition from 'dom-helpers/position';
import YearMonthsRow from './year-widgets/YearMonthsRow';
import Popup from '../popup/Popup';
import * as dates from '../../utils/dates';
import { getInitState, getInitStateWithDates, getMonthStartDates, getMonthStartDatesByDateRange,
  getOverscanEndIndex, getOverscanStartIndex, getRenderedRowsCount, getVisibleBoundariesByScrollTop,
  getVisibleEndIndex, getVisibleStartIndexByDate, isNextYear } from '../../utils/year-view-utils';
import { navigate, YEAR_MONTHS_ROW_HEIGHT } from '../../constants';
import { DATE_UNIT } from '../../constants/date';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);


class YearView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      scroll: {scrollLeft: 0, scrollTop: 0},
      popup: false,
      dayEventsMap: this.getDayEventsMap(props.events),
      localizer: props.localizer,
    };
    const today = new Date();
    const monthOfToday = today.getMonth() + 1;
    this.yearOfToday = today.getFullYear();
    this.sMonthOfToday = monthOfToday > 9 ? monthOfToday + '' : `0${monthOfToday}`;
    this.dateOfToday = today.getDate();
    this.initDateRange();
    this.isScrolling = false;
  }

  initDateRange = () => {
    if (!this.props.isMobile) return;
    // if current date is '2021-08-18'
    // the startDate will be '2017-01-01'
    // the endDate will be '2025-12-01'
    this.startDate = dayjs(this.props.date).startOf(DATE_UNIT.YEAR).subtract(4, DATE_UNIT.YEAR);
    this.endDate = dayjs(this.props.date).endOf(DATE_UNIT.YEAR).add(4, DATE_UNIT.YEAR).startOf(DATE_UNIT.MONTH);
  }

  componentDidMount() {
    if (!this.rbcYearView) return;
    const { isMobile, date } = this.props;
    const { offsetHeight } = this.rbcYearView;
    const renderedRowsCount = getRenderedRowsCount(offsetHeight);
    let initState;
    if (isMobile) {
      this.renderMonthStartDates = getMonthStartDatesByDateRange(this.startDate, this.endDate);
      initState = getInitStateWithDates(this.renderMonthStartDates, date, renderedRowsCount);
    } else {
      const initDate = new Date(new Date(date).getFullYear(), 0);
      this.renderMonthStartDates = getMonthStartDates(initDate, renderedRowsCount);
      initState = getInitState(renderedRowsCount, this.renderMonthStartDates);
    }
    this.setState({...initState}, () => {
      this.rbcYearView.scrollTop = initState.visibleStartIndex * YEAR_MONTHS_ROW_HEIGHT;
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.events !== this.props.events) {
      const newDayEventsMap = this.getDayEventsMap(this.props.events);
      this.setState({dayEventsMap: newDayEventsMap});
    }
    if (prevProps.configuredWeekStart !== this.props.configuredWeekStart) {
      this.setState({
        localizer: this.props.localizer
      });
    }
    const { date, changeDateByNavicate, isMobile } = this.props;
    if (prevProps.date !== date && changeDateByNavicate) {
      if (isMobile) {
        this.updateScrollByDateOnMobile(date);
        return;
      }

      this.isScrolling = false;
      const { offsetHeight } = this.rbcYearView;
      const renderedRowsCount = getRenderedRowsCount(offsetHeight);
      const initDate = new Date(new Date(date).getFullYear(), 0);
      this.renderMonthStartDates = getMonthStartDates(initDate, renderedRowsCount);
      const initState = getInitState(renderedRowsCount, this.renderMonthStartDates);
      this.setState({...initState}, () => {
        this.rbcYearView.scrollTop = initState.visibleStartIndex * YEAR_MONTHS_ROW_HEIGHT;
      });
    }
  }

  getDayEventsMap = (events) => {
    let dayEventsMap = {};
    events.forEach((event) => {
      const { start, end } = event;
      let m_start = dayjs(start);
      let m_end = dayjs(end);
      while(m_end.isSameOrAfter(m_start, DATE_UNIT.DAY)) {
        const formattedStart = m_start.format('YYYY-MM-DD');
        if (dayEventsMap[formattedStart]) {
          dayEventsMap[formattedStart].push(event);
        } else {
          dayEventsMap[formattedStart] = [event];
        }
        m_start = dayjs(m_start).add(1, DATE_UNIT.DAY);
      }
    });
    return dayEventsMap;
  }

  onYearViewScroll = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isScrolling) {
      this.isScrolling = true;
      return;
    }
    let { scrollTop } = event.target;
    const { isMobile } = this.props;
    const { offsetHeight } = this.rbcYearView;
    if (isMobile) {
      this.onScrollOnMobile(scrollTop, offsetHeight);
    } else {
      this.onScrollOnDesktop(scrollTop, offsetHeight);
    }
  }

  onScrollOnDesktop = (scrollTop, viewportHeight) => {
    const { date } = this.props;
    const renderedRowsCount = getRenderedRowsCount(viewportHeight);
    const overRowsCount = scrollTop / YEAR_MONTHS_ROW_HEIGHT;
    const currentScrollTo = Math.max(0, Math.round(overRowsCount));
    let rowsCount = this.renderMonthStartDates.length;
    let visibleStartIndex = Math.max(0, Math.ceil(overRowsCount) - 1);
    if (isNextYear(date, this.renderMonthStartDates, currentScrollTo)) {
      const fract = overRowsCount - Math.trunc(overRowsCount);
      const nextDateIndex = Math.min(Math.max(0, currentScrollTo + 1), rowsCount - 1);
      const nextDate = this.renderMonthStartDates[nextDateIndex];
      const nextYear = nextDate.getFullYear();
      const nextMonth = nextDate.getMonth();
      const currentMonth = new Date(date).getMonth();
      this.props.updateCurrentDate(new Date(nextYear, currentMonth));

      this.isScrolling = false;
      const lastVisibleDate = this.renderMonthStartDates[visibleStartIndex];
      this.renderMonthStartDates = getMonthStartDates(new Date(nextYear, nextMonth), renderedRowsCount);
      rowsCount = this.renderMonthStartDates.length;
      visibleStartIndex = getVisibleStartIndexByDate(lastVisibleDate, this.renderMonthStartDates);
      scrollTop = (visibleStartIndex + (fract || 1)) * YEAR_MONTHS_ROW_HEIGHT;
    }
    const visibleEndIndex = getVisibleEndIndex(visibleStartIndex, renderedRowsCount, rowsCount);
    const overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
    const overscanEndIndex = getOverscanEndIndex(visibleEndIndex, rowsCount);
    this.setState({
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
    }, () => {
      this.rbcYearView.scrollTop = scrollTop;
    });
  }

  onScrollOnMobile = (scrollTop, viewportHeight) => {
    const { date } = this.props;
    const dateObj = new Date(date);
    const currentYear = dateObj.getFullYear();
    const currentMonth = dateObj.getMonth();
    const rowsCount = this.renderMonthStartDates.length;
    const { visibleStartIndex, visibleEndIndex } = getVisibleBoundariesByScrollTop(scrollTop, viewportHeight, rowsCount);
    const overscanStartIndex = getOverscanStartIndex(visibleStartIndex);
    const overscanEndIndex = getOverscanEndIndex(visibleEndIndex, rowsCount);
    const nextVisibleStartIndex = visibleStartIndex + 1;
    const nextDateYear = this.renderMonthStartDates[nextVisibleStartIndex].getFullYear();
    if (nextDateYear !== currentYear) {
      const nextDate = new Date(nextDateYear, currentMonth);
      this.props.updateCurrentDate(nextDate);
    }
    this.setState({
      visibleStartIndex,
      visibleEndIndex,
      overscanStartIndex,
      overscanEndIndex,
    });
  }

  updateScrollByDateOnMobile = (date) => {
    const { offsetHeight } = this.rbcYearView;
    const renderedRowsCount = getRenderedRowsCount(offsetHeight);
    const initState = getInitStateWithDates(this.renderMonthStartDates, date, renderedRowsCount);
    this.setState({
      ...initState
    }, () => {
      this.rbcYearView.scrollTop = initState.visibleStartIndex * YEAR_MONTHS_ROW_HEIGHT;
    });
  }

  isDateBetweenDateRange = (date) => {
    return dates.inRange(date, this.startDate, this.endDate, DATE_UNIT.MONTH);
  }

  scrollToTop = () => {
    let scrollTop = this.rbcYearView.scrollTop;
    if (scrollTop === 0) {
      return;
    }
    this.rbcYearView.scrollTop = 0;
  }

  scrollToBottom = () => {
    const { scrollHeight, offsetHeight, scrollTop } = this.rbcYearView;
    const restScrollTop = scrollHeight - offsetHeight;
    if (restScrollTop - scrollTop === 0) {
      return;
    }
    this.rbcYearView.scrollTop = restScrollTop;
  }

  handleShowMore = ({cell, events, date}) => {
    if (!this.state.popup) {
      const position = getPosition(cell, findDOMNode(this));
      const scrollTop = this.rbcYearView.scrollTop;
      let { top } = position;
      position.top = top - scrollTop;
      this.setState({
        overlay: {position, events: events || [], date},
        popup: true,
      });
    }
  }

  onHidePopup = () => {
    this.setState({popup: false, overlay: {}});
  }

  render() {
    const { className, isMobile } = this.props;
    const { dayEventsMap, overlay, overscanStartIndex, overscanEndIndex, localizer } = this.state;
    let renderMonthsRows = [], offsetTop = 0, offsetBottom = 0;
    if (this.renderMonthStartDates) {
      renderMonthsRows = this.renderMonthStartDates.slice(overscanStartIndex, overscanEndIndex);
      offsetTop = overscanStartIndex * YEAR_MONTHS_ROW_HEIGHT;
      offsetBottom = (this.renderMonthStartDates.length - overscanEndIndex) * YEAR_MONTHS_ROW_HEIGHT;
    }
    return (
      <div className={classnames('rbc-year-view', className, isMobile && 'mobile')} onScroll={this.onYearViewScroll} ref={ref => this.rbcYearView = ref} >
        <div style={{paddingTop: offsetTop, paddingBottom: offsetBottom}}>
          {renderMonthsRows.map(monthStartDate => {
            const year = monthStartDate.getFullYear();
            const month = monthStartDate.getMonth() + 1;
            return (
              <YearMonthsRow
                key={`year-months-row-${year}-${month}`}
                year={year}
                month={month}
                yearOfToday={this.yearOfToday}
                sMonthOfToday={this.sMonthOfToday}
                dateOfToday={this.dateOfToday}
                dayEventsMap={dayEventsMap}
                localizer={localizer}
                isMobile={this.props.isMobile}
                handleShowMore={this.handleShowMore}
              />
            );
          })}
        </div>
        {this.state.popup &&
          <Popup
            {...this.props}
            position={overlay.position}
            events={overlay.events}
            slotStart={overlay.date}
            onSelect={this.props.onRowExpand}
            onHidePopup={this.onHidePopup}
          />
        }
      </div>
    );
  }
}

YearView.propTypes = {
  date: PropTypes.instanceOf(Date),
  localizer: PropTypes.object.isRequired,
  className: PropTypes.object,
  onInsertRow: PropTypes.func,
};

YearView.range = (date, { localizer }) => {
  let start = dates.firstVisibleDay(date, localizer);
  let end = dates.lastVisibleDay(date, localizer);
  return {start, end};
};

YearView.navigate = (date, action) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -1, 'year');
    case navigate.NEXT:
      return dates.add(date, 1, 'year');
    default:
      return date;
  }
};

YearView.title = (date, { localizer }) => {
  return localizer.format(date, 'yearHeaderFormat');
};

export default YearView;
