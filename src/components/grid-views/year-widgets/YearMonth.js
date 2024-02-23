import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import Header from '../../header/Header';
import * as dates from '../../../utils/dates';
import { chunk } from '../../../utils/common';
import YearDay from './YearDay';

class YearMonth extends React.PureComponent {

  constructor(props) {
    super(props);
    const { year, month } = props;
    this.monthDate = new Date(`${year}-${month}`);
  }

  renderMonthHeader() {
    let { localizer } = this.props;
    return (
      <div className='rbc-year-month-header'>
        <Header
          label={localizer.format(this.monthDate, 'monthFormat')}
        />
      </div>
    );
  }

  renderWeekDayHeaders(row) {
    let { localizer } = this.props;
    return row.map((day, idx) => (
      <div key={'header_' + idx} className='rbc-header'>
        <Header
          label={localizer.format(day, 'yearMonthWeekdayFormat')}
        />
      </div>
    ));
  }

  renderDays = (weeks, dayEventsMap, currentMonth, isCurrentMonth, dateOfToday) => {
    const now = new Date();
    return weeks.map(week => {
      return (
        <div className="rbc-row rbc-year-week" key={`rbc-year-week-${week[0] + ''}`}>
          {week.map(date => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const displayMonth = month > 9 ? month + '' : `0${month}`;
            const displayDy = day > 9 ? day : `0${day}`;
            const displayDate = `${year}-${displayMonth}-${displayDy}`;
            const dayEvents = dayEventsMap[displayDate];
            const isOffRange = displayMonth !== currentMonth;
            const isCurrentDay = isCurrentMonth && day === dateOfToday && dayjs(now).isSame(date, 'day');
            const hasEvents = dayEvents && dayEvents.length > 0;
            return (
              <YearDay
                key={`rbc-year-day-${displayDate}`}
                isOffRange={isOffRange}
                isCurrentDay={isCurrentDay}
                hasEvents={hasEvents}
                localizer={this.props.localizer}
                label={day}
                handleShowMore={this.handleShowMore.bind(this, date, dayEvents)}
              />
            );
          })}
        </div>
      );
    });
  };

  handleShowMore = (date, events, overlay) => {
    this.props.handleShowMore({
      ...overlay,
      date,
      events,
    });
  };

  render() {
    const { localizer, dayEventsMap, month, isCurrentMonth, dateOfToday } = this.props;
    const monthDates = dates.visibleYearDays(this.monthDate, localizer);
    const weeks = chunk(monthDates, 7);
    return (
      <div className="rbc-year-month">
        {this.renderMonthHeader()}
        <div className='rbc-row'>
          {this.renderWeekDayHeaders(weeks[0])}
        </div>
        {this.renderDays(weeks, dayEventsMap, month, isCurrentMonth, dateOfToday)}
      </div>
    );
  }
}

YearMonth.propTypes = {
  year: PropTypes.number,
  month: PropTypes.string,
  isCurrentMonth: PropTypes.bool,
  dateOfToday: PropTypes.number,
  dayEventsMap: PropTypes.object,
  localizer: PropTypes.object,
  handleShowMore: PropTypes.func,
};

export default YearMonth;
