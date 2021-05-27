import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import YearMonth from './year-widgets/YearMonth';
import { chunk } from '../../utils/common';
import * as dates from '../../utils/dates';
import { navigate } from '../../constants';
import { DATE_UNIT, MONTHS } from '../../constants/date';
import moment from 'moment';

class YearView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dayEventsMap: this.getDayEventsMap(props.events),
    };
  }

  getDayEventsMap = (events) => {
    let dayEventsMap = {};
    events.forEach((event) => {
      const { start, end } = event;
      let m_start = moment(start);
      let m_end = moment(end);
      while(m_end.isSameOrAfter(m_start)) {
        let formattedStart = moment(m_start).format('YYYY-MM-DD');
        if (dayEventsMap[formattedStart]) {
          dayEventsMap[formattedStart].push(event);
        } else {
          dayEventsMap[formattedStart] = [event];
        }
        m_start.add(1, DATE_UNIT.DAY);
      }
    });
    return dayEventsMap;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.events !== this.props.events) {
      const newDayEventsMap = this.getDayEventsMap(this.props.events);
      this.setState({dayEventsMap: newDayEventsMap});
    }
  }

  render() {
    let { date: todayDate, localizer, className } = this.props;
    const { dayEventsMap } = this.state;

    return (
      <div className={classnames('rbc-year-view', className)} ref={ref => this.rbcYearView = ref} >
        {MONTHS.map(item => {
          let year = dates.year(todayDate);
          let monthDate = new Date(`${year}-${item}`);
          let month = dates.visibleYearDays(monthDate, localizer);
          let weeks = chunk(month, 7);
          return <div className="rbc-year-month-view" key={`rbc-year-month-${item}`}>
            <YearMonth
              {...this.props}
              dayEventsMap={dayEventsMap}
              weeks={weeks}
              monthDate={monthDate}
            />
          </div>;
        })}
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
