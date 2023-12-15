import React from 'react';
import PropTypes from 'prop-types';
import YearMonth from './YearMonth';

class YearMonthsRow extends React.PureComponent {

  constructor(props) {
    super(props);
    this.months = this.getMonths();
  }

  getMonths = () => {
    const { isMobile, month } = this.props;
    if (isMobile) {
      const displayMonth = month > 9 ? month + '' : `0${month}`;
      return [displayMonth];
    }

    // for pc.
    let months = [];
    for (let i = 0; i < 4; i++) {
      let _month = month + i;
      months.push(_month > 9 ? _month + '' : `0${_month}`);
    }
    return months;
  };

  render() {
    const { year, yearOfToday, sMonthOfToday, dateOfToday, dayEventsMap, localizer } = this.props;
    return (
      <div className="year-months-row">
        {this.months.map((month) => {
          const isCurrentMonth = year === yearOfToday && month === sMonthOfToday;
          const key = `${year}-${month}`;
          return (
            <YearMonth
              key={`year-month-${key}`}
              year={year}
              month={month}
              isCurrentMonth={isCurrentMonth}
              dateOfToday={dateOfToday}
              dayEventsMap={dayEventsMap}
              localizer={localizer}
              handleShowMore={this.props.handleShowMore}
            />
          );
        })}
      </div>
    );
  }
}

YearMonthsRow.propTypes = {
  year: PropTypes.number,
  month: PropTypes.number,
  yearOfToday: PropTypes.number,
  sMonthOfToday: PropTypes.string,
  dateOfToday: PropTypes.number,
  dayEventsMap: PropTypes.object,
  localizer: PropTypes.object,
  handleShowMore: PropTypes.func,
};

export default YearMonthsRow;
