import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import * as dates from '../../utils/dates';

class DateHeader extends Component {

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.label !== this.props.label ||
      nextProps.drilldownView !== this.props.drilldownView ||
      !moment(nextProps.date).isSame(this.props.date)
    );
  }

  render() {
    const { label, drilldownView, date } = this.props;
    if (!drilldownView) {
      return <span>{label}</span>;
    }
    let mDate = moment(date);
    let startOfMonthDate = mDate.startOf('month').toDate();
    let isStartOfMonth = dates.eq(date, startOfMonthDate, 'day');
    return (
      <span className="rbc-date-context">
        {isStartOfMonth && `${mDate.format('MM')}-`}
        {label}
      </span>
    );
  }
}

DateHeader.propTypes = {
  label: PropTypes.node,
  date: PropTypes.instanceOf(Date),
  drilldownView: PropTypes.string,
  onDrillDown: PropTypes.func,
  isOffRange: PropTypes.bool
};

export default DateHeader;
