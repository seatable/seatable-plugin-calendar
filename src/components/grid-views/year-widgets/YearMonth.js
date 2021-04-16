import React, { Fragment } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import Header from '../../header/Header';
import * as dates from '../../../utils/dates';
import YearDay from './YearDay';
import moment from 'moment';
import intl from 'react-intl-universal';

class YearMonth extends React.Component {

  renderMonthHeaders() {
    let { localizer, components, monthDate } = this.props;
    let HeaderComponent = components.header || Header;

    return (
      <div className='rbc-year-month-header'>
        <HeaderComponent
          label={intl.get(localizer.format(monthDate, 'monthFormat'))}
        />
      </div>
    );
  }

  renderWeekDayHeaders(row) {
    let { localizer, components } = this.props;
    let first = row[0];
    let last = row[row.length - 1];
    let HeaderComponent = components.header || Header;

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className='rbc-header'>
        <HeaderComponent
          label={intl.get(localizer.format(day, 'weekdayFormat'))}
        />
      </div>
    ));
  }

  renderDay = (week, weekIdx) => {
    let { monthDate, dayEventsMap } = this.props;
    return (
      <div className="rbc-year-day-container" key={`rbc-year-day-container-${weekIdx}`}>
        {week.map((day, i) => {
          const formatDate = moment(day).format('YYYY-MM-DD');
          const dayEvents = dayEventsMap[formatDate] || [];
          return (
            <YearDay
              key={`rbc-year-day-${weekIdx}-${i}`}
              day={day}
              monthDate={monthDate}
              range={week}
              dayEvents={dayEvents}
              {...this.props}
            />
          );
        })}
      </div>
    );
  }

  getContainer = () => {
    return findDOMNode(this);
  }

  render() {
    let { weeks } = this.props;

    return (
      <Fragment>
        {this.renderMonthHeaders()}
        <div className='rbc-row'>
          {this.renderWeekDayHeaders(weeks[0])}
        </div>
        {weeks.map(this.renderDay)}
      </Fragment>
    );
  }
}

YearMonth.propTypes = {
  weeks: PropTypes.array,
  monthDate: PropTypes.object,
  dayEventsMap: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
};

export default YearMonth;
