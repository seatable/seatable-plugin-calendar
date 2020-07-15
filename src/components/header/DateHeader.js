import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import * as dates from '../../utils/dates';

const DateHeader = ({ label, drilldownView, date }) => {
  if (!drilldownView) {
    return <span>{label}</span>;
  }
  let startOfMonthDate = moment(date).startOf('month').toDate();
  let isStartOfMonth = dates.eq(date, startOfMonthDate, 'day');
  return (
    <span className="rbc-date-context">
      {isStartOfMonth && `${moment(date).format('MM')}-`}
      {label}
    </span>
  );
};

DateHeader.propTypes = {
  label: PropTypes.node,
  date: PropTypes.instanceOf(Date),
  drilldownView: PropTypes.string,
  onDrillDown: PropTypes.func,
  isOffRange: PropTypes.bool
};

export default DateHeader;
