import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { handleEnterKeyDown } from '../../../utils/accessibility';

class YearDay extends React.PureComponent {

  clickCount = 0;
  timeout = null;
  containerRef = React.createRef();

  onClick = () => {
    this.clickCount++;
    if (this.clickCount === 1) {
      this.timeout = setTimeout(() => {
        this.props.handleShowMore({
          cell: this.containerRef.current,
        });
        this.clickCount = 0;
        this.timeout = null;
      }, 200);
    } else if (this.clickCount === 2) {
      this.onJumpToDay();
      this.clickCount = 0;
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  hideDayEvents = () => {
    this.setState({ isShowEvents: false });
  };

  onJumpToDay = (e) => {
    const { labelDate, onJumpToDay } = this.props;
    onJumpToDay(labelDate);
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
        onClick={this.onClick}
        onKeyDown={handleEnterKeyDown(this.onClick)}
        tabIndex={tabIndex}
        ref={this.containerRef}
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
  onJumpToDay: PropTypes.func,
};

export default YearDay;
