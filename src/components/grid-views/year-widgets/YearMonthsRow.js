import React from 'react';
import PropTypes from 'prop-types';
import YearMonth from './YearMonth';

class YearMonthsRow extends React.PureComponent {

  getMonthsData = () => {
    const { year, month, monthCountPerRow } = this.props;
    let monthsData = [];
    for (let i = 0; i < monthCountPerRow; i++) {
      let _month = month + i;
      let _year = year;
      if (_month >= 13) {
        _month = _month - 12;
        _year++;
      }
      const m = _month > 9 ? _month + '' : `0${_month}`;
      const y = _year;
      monthsData.push({
        month: m,
        year: y,
      });
    }
    return monthsData;
  };

  renderMonths = () => {
    const { year, month, yearOfToday, sMonthOfToday, dateOfToday, dayEventsMap, localizer, isMobile } = this.props;
    if (isMobile) {
      const displayMonth = month > 9 ? month + '' : `0${month}`;
      return (
        <YearMonth
          key={`year-month-${year}-${displayMonth}`}
          year={year}
          month={displayMonth}
          isCurrentMonth={year === yearOfToday && displayMonth === sMonthOfToday}
          dateOfToday={dateOfToday}
          dayEventsMap={dayEventsMap}
          localizer={localizer}
          handleShowMore={this.props.handleShowMore}
          onJumpToDay={this.props.onJumpToDay}
        />
      );
    } else {
      const monthsData = this.getMonthsData();
      return (
        monthsData.map((monthData) => {
          const { month, year } = monthData;
          const isCurrentMonth = year === yearOfToday && month === sMonthOfToday;
          return (
            <YearMonth
              key={`year-month-${year}-${month}`}
              year={year}
              month={month}
              isCurrentMonth={isCurrentMonth}
              dateOfToday={dateOfToday}
              dayEventsMap={dayEventsMap}
              localizer={localizer}
              handleShowMore={this.props.handleShowMore}
              onJumpToDay={this.props.onJumpToDay}
            />
          );
        })
      );
    }
  };

  render() {
    return (
      <div className="year-months-row">
        {this.renderMonths()}
      </div>
    );
  }
}

YearMonthsRow.propTypes = {
  year: PropTypes.number,
  month: PropTypes.number,
  yearOfToday: PropTypes.number,
  monthCountPerRow: PropTypes.number,
  sMonthOfToday: PropTypes.string,
  dateOfToday: PropTypes.number,
  dayEventsMap: PropTypes.object,
  localizer: PropTypes.object,
  handleShowMore: PropTypes.func,
  isMobile: PropTypes.bool,
  onJumpToDay: PropTypes.func,
};

export default YearMonthsRow;
