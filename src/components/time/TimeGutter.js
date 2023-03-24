import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import dayjs from 'dayjs';
import TimeSlotGroup from './TimeSlotGroup';
import * as TimeSlotUtils from '../../utils/TimeSlots';

export default class TimeGutter extends Component {
  constructor(...args) {
    super(...args);

    const { min, max, timeslots, step } = this.props;
    this.slotMetrics = TimeSlotUtils.getSlotMetrics({min, max, timeslots, step});
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { min, max, timeslots, step } = nextProps;
    this.slotMetrics = this.slotMetrics.update({ min, max, timeslots, step });
  }

  renderSlot = (value, idx) => {
    if (idx !== 0) return null;
    const { localizer, getNow } = this.props;
    const time = dayjs(value).format('HH:mm');
    const currentDay = dayjs().format('YYYY-MM-DD');
    const formatTime = dayjs(`${currentDay} ${time}`);

    //When the current time with slot scale is less than 30 minutes, the slot scale is not displayed
    const diffMinutes = Math.abs(dayjs().diff(formatTime, 'minutes'));
    if (diffMinutes < 30) {
      return;
    }
    const isNow = this.slotMetrics.dateIsInGroup(getNow(), idx);
    return (
      <span className={classnames('rbc-label', {'rbc-now': isNow})}>
        {localizer.format(value, 'timeGutterFormat')}
      </span>
    );
  };

  render() {
    const { resource, components } = this.props;

    return (
      <div className='rbc-time-gutter rbc-time-column'>
        {this.slotMetrics.groups.map((grp, idx) => {
          return (
            <TimeSlotGroup
              key={idx}
              group={grp}
              resource={resource}
              components={components}
              renderSlot={this.renderSlot}
            />
          );
        })}
      </div>
    );
  }
}

TimeGutter.propTypes = {
  min: PropTypes.instanceOf(Date).isRequired,
  max: PropTypes.instanceOf(Date).isRequired,
  timeslots: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  getNow: PropTypes.func.isRequired,
  components: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  resource: PropTypes.string
};
