import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import YearMonth from './year-widgets/YearMonth';
import { chunk } from '../../utils/common';
import * as dates from '../../utils/dates';
import { navigate } from '../../constants';
import { MONTHS } from '../../constants/date';

class YearView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      scroll: {scrollLeft: 0, scrollTop: 0},
    };
    this.rbcYearViewSize = {};
  }

  onYearViewScroll = (event) => {
    const { scrollLeft, scrollTop } = event.target;
    this.setState({scroll: {scrollLeft, scrollTop}});
  }

  componentDidMount() {
    let { offsetWidth, offsetHeight } = this.rbcYearView;
    this.rbcYearViewSize = {height: offsetHeight, width: offsetWidth};
  }

  render() {
    let { date: todayDate, localizer, className } = this.props;

    return (
      <div className={classnames('rbc-year-view', className)} onScroll={this.onYearViewScroll} ref={ref => this.rbcYearView = ref} >
        {MONTHS.map(item => {
          let year = dates.year(todayDate);
          let monthDate = new Date(`${year}-${item}`);
          let month = dates.visibleYearDays(monthDate, localizer);
          let weeks = chunk(month, 7);
          return <div className="rbc-year-month-view" key={`rbc-year-month-${item}`}>
            <YearMonth
              {...this.props}
              rbcYearViewSize={this.rbcYearViewSize}
              rbcYearViewScroll={this.state.scroll}
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
  return intl.get('xxx_Year', {yearNumber: localizer.format(date, 'yearHeaderFormat')});
};

export default YearView;