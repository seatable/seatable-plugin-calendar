import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

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
    const { isOffRange, isCurrentDay, hasEvents, label } = this.props;

    return (
      <div
        className="rbc-year-day-item"
        onClick={this.onEventsToggle}
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
};

export default YearDay;
