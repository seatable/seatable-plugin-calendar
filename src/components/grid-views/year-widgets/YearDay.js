import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

class YearDay extends React.PureComponent {

  getPosition = () => {
    const { top, right } = this.rbcYearDayItem.getBoundingClientRect();
    const innerWidth = window.innerWidth;
    let posLeft = right + 5;
    if (innerWidth > 1100) {
      posLeft = posLeft - (innerWidth - 1100) / 2;
    }
    return {top: top - 80, left: posLeft};
  }

  onEventsToggle = () => {
    this.props.handleShowMore({
      position: this.getPosition()
    });
  }

  hideDayEvents = () => {
    this.setState({isShowEvents: false});
  }

  render() {
    const { isOffRange, isCurrentDay, hasEvents, label } = this.props;

    return (
      <div
        className="rbc-year-day-item"
        ref={ref => this.rbcYearDayItem = ref}
        onClick={this.onEventsToggle}
      >
        <div className="rbc-year-day-content">
          <div className={classnames('rbc-year-day', {'rbc-off-range': isOffRange, 'rbc-current': isCurrentDay})} >{label}</div>
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
};

export default YearDay;
