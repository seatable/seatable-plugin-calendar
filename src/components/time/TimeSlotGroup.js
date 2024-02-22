import React, { Component, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BackgroundWrapper from '../wrapper/BackgroundWrapper';
import { TimeSlot } from './time-slot';


export default function TimeSlotGroup(props) {

  const {
    renderSlot,
    resource,
    group,
    getters,
    components: { timeSlotWrapper: Wrapper = BackgroundWrapper } = {}
  } = props;  
  
  return (
    <div className='rbc-timeslot-group'>
      {group.map((value, idx) => {
        const slotProps = getters ? getters.slotProp(value, resource) : {};
        return (
          <Wrapper key={idx} value={value} resource={resource}>
            <div
              {...slotProps}
              className={classnames('rbc-time-slot', slotProps.className)}
            >
              {renderSlot ? renderSlot(value, idx) : <TimeSlot value={value} ></TimeSlot>}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}


TimeSlotGroup.propTypes = {
  renderSlot: PropTypes.func,
  group: PropTypes.array.isRequired,
  resource: PropTypes.any,
  components: PropTypes.object,
  getters: PropTypes.object
};
