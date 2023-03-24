import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import * as dates from '../../utils/dates';
import * as TimeSlotUtils from '../../utils/TimeSlots';

const propTypes = {
  contentRef: PropTypes.object,
  getNow: PropTypes.func,
  localizer: PropTypes.object.isRequired,
  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),
};

class CurrentTimeIndicator extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentTime: this.getCurrentTime(),
    };
    this.timeIndicatorTop = null;
    this.intervalTriggered = false;
  }

  componentDidMount() {
    this.setTimeIndicatorPositionUpdateInterval();
  }

  componentWillUnmount() {
    this.clearTimeIndicatorInterval();
  }

  componentDidUpdate(prevProps, prevState) {
    this.calculateTimeIndicatorPosition();
    const getNowChanged = !dates.eq(prevProps.getNow(), this.props.getNow(), 'minutes');
    if (getNowChanged) {
      this.clearTimeIndicatorInterval();
      this.setTimeIndicatorPositionUpdateInterval();
    }
  }

  setTimeIndicatorPositionUpdateInterval() {
    if (!this.intervalTriggered) {
      this.calculateTimeIndicatorPosition();
    }
    // Calculate how many milliseconds are left in the current time before the next minute
    const nextMinuteMilliseconds = dayjs().endOf('minute').valueOf() - dayjs().valueOf();
    this._timeIndicatorTimeout = window.setTimeout(() => {
      this.intervalTriggered = true;
      this.calculateTimeIndicatorPosition();
      this.setTimeIndicatorPositionUpdateInterval();
      this.setState({ currentTime: this.getCurrentTime() });
    }, nextMinuteMilliseconds);
  }

  clearTimeIndicatorInterval() {
    this.intervalTriggered = false;
    window.clearTimeout(this._timeIndicatorTimeout);
  }

  transformTimeToMinute(date, start, totalMin) {
    const diff = dates.diff(start, date, 'minutes') + TimeSlotUtils.getDstOffset(start, date);
    return Math.min(diff, totalMin);
  }

  calculateTimeIndicatorPosition = () => {
    const { contentRef, getNow, min, max } = this.props;
    const currentTime = getNow();
    if (currentTime >= min && currentTime <= max && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const totalMin = 1 + dates.diff(min, max, 'minutes') + TimeSlotUtils.getDstOffset(min, max);
      const transformToMinute = this.transformTimeToMinute(currentTime, min, totalMin);
      const top = Math.round((transformToMinute / totalMin) * contentHeight);
      this.timeIndicatorTop = top;
    } else {
      this.clearTimeIndicatorInterval();
    }
  }

  getCurrentTime = () => {
    const { getNow, localizer } = this.props;
    const currentTime = getNow();
    return localizer.format(currentTime, 'timeGutterFormat');
  }

  render() {
    const { currentTime } = this.state;
    return (
      <div className='rbc-current-time-indicator-container' style={{ top: this.timeIndicatorTop }}>
        <div className='rbc-current-time-indicator-label'>
          {currentTime}
        </div>
        <div className='rbc-current-time-indicator' />
      </div>
    );
  }

}

CurrentTimeIndicator.propTypes = propTypes;

export default CurrentTimeIndicator;
