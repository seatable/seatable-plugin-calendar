import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import YearMonth from './year-widgets/YearMonth';
import { chunk } from '../../utils/common';
import * as dates from '../../utils/dates';
import { navigate } from '../../constants';
import { DATE_UNIT, MONTHS } from '../../constants/date';
import moment from 'moment';

const PADDING_Y = 1000;
const OFFSET_THRESHOLD = 200; // for vertical scroll

class YearView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dayEventsMap: this.getDayEventsMap(props.events),
    };
    this.handlingScroll = false; // false: the scroll is not to be handled by function 'handleScroll'
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
    if (prevProps.date !== this.props.date) {
      this.setInitialScrollTop();
    }
  }

  componentDidMount() {
    this.setInitialScrollTop();
  }

  setInitialScrollTop = () => {
    this.initialScrollTop = PADDING_Y + document.getElementById(this.currentYear - 1).scrollHeight + 20;
    this.rbcYearView.scrollTop = this.initialScrollTop;
    this.handlingScroll = false;
  }

  renderYear = (year) => {
    const { localizer, className } = this.props;
    const { dayEventsMap } = this.state;

    return (
      <div key={year} id={year}>
        <h3 className="h4 text-center font-weight-normal my-0">{year}</h3>
        <div className={classnames('rbc-year-view', className)}>
          {MONTHS.map(item => {
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
      </div>
    );
  }

  handleScroll = (e) => {
    if (!this.handlingScroll) {
      this.handlingScroll = true;
      return;
    }
    let currentScrollTop = e.target.scrollTop;
    let newDate;
    if (currentScrollTop < this.initialScrollTop &&
      this.initialScrollTop - currentScrollTop > OFFSET_THRESHOLD) {
      newDate = moment(this.props.date).subtract(1, DATE_UNIT.YEAR).toDate();
    }
    if (currentScrollTop > this.initialScrollTop &&
      currentScrollTop - this.initialScrollTop > document.getElementById(this.currentYear).scrollHeight) {
      newDate = moment(this.props.date).add(1, DATE_UNIT.YEAR).toDate();
    }
    if (newDate) {
      this.props.updateCurrentDate(newDate);
    }
  }

  render() {
    const { date: todayDate } = this.props;
    const currentYear = dates.year(todayDate);
    const style = {
      paddingTop: PADDING_Y,
      paddingBottom: PADDING_Y
    };
    const renderedYears = [currentYear - 1, currentYear, currentYear + 1];
    this.currentYear = currentYear;

    return (
      <div className="flex-fill o-hidden d-flex">
        <div className="flex-fill o-auto" ref={ref => this.rbcYearView = ref} onScroll={this.handleScroll}>
          <div style={style}>
            {renderedYears.map(this.renderYear)}
          </div>
        </div>
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
