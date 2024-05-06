import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { handleEnterKeyDown } from '../../../utils/accessibility';

class YearDay extends React.PureComponent {

  onEventsToggle = () => {
    this.props.handleShowMore({
      cell: findDOMNode(this),
    });
  };

  hideDayEvents = () => {
    this.setState({ isShowEvents: false });
  };

  render() {
    const { isOffRange, isCurrentDay, hasEvents, label, labelDate, firstDayOfTheYear } = this.props;
   
    let tabIndex = 0;
    if (labelDate < firstDayOfTheYear) {
      tabIndex = -1;
    }

    if (labelDate.getMonth() === firstDayOfTheYear.getMonth() && isOffRange) {
      tabIndex = -1;
    }
    
    return (
      <div
        className="rbc-year-day-item"
        onClick={this.onEventsToggle}
        onKeyDown={handleEnterKeyDown(this.onEventsToggle)}
        tabIndex={tabIndex}
      >
        <div className="rbc-year-day-content">
          <div className={classnames('rbc-year-day', { 'rbc-off-range': isOffRange, 'rbc-current': isCurrentDay })} >{label}</div>
        </div>
        {hasEvents && <span className="day-events"></span>}
      </div>
    );
  }
}

YearDay.propTypes = {
  hasEvents: PropTypes.bool,
  isOffRange: PropTypes.bool,
  isCurrentDay: PropTypes.bool,
  handleShowMore: PropTypes.func,
  label: PropTypes.number,
  labelDate: PropTypes.object,
  currentDate: PropTypes.object,
  firstDayOfTheYear: PropTypes.object,
  currentMonth: PropTypes.string,
};

export default YearDay;
