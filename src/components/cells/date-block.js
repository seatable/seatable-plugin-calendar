import { useDroppable } from '@dnd-kit/core';
import { set } from 'lodash-es';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

export default function DateBlock({ className, blockStyle, value, range, setIsOverAllDaySlot }) {

  // const [initialStartTime, setInitialStartTime] = useState(null); 
  // const [initialEndTime, setInitialEndTime] = useState(null);

  const { isOver, setNodeRef, active, } =  useDroppable({
    id: value,
    data: {
      date: value,
      range
    }
  });

  // let current;
  // active is current dragging item
  if (active) {
    // current = active.data.current;

    // const isLeftHandleStartDragging = current.type === 'leftResize' && !initialStartTime;
    // const isRightHandleStartDragging = current.type === 'rightResize' && !initialEndTime;

    // //  record initial start time, compare with dropped date, to determine bg color
    // if (isLeftHandleStartDragging) setInitialStartTime(current.event.start);
    // if (isRightHandleStartDragging) setInitialEndTime(current.event.end);

    // const isDnd = current.type === 'dnd';
    
    // if left resize, dropped date must greater than event start date, and if right resize, dropped date must less than event end date
    // if !initialStartTime, still shows bg color
    // const isCorrectTimeResize =  isLeftHandleStartDragging
    //                             || isRightHandleStartDragging
    //                             || (current.type === 'leftResize' && current.event.start >= initialStartTime)
    //                             || (current.type === 'rightResize' && current.event.end <= initialStartTime);
    const isOverClassName = ' rbc-day-bg-is-over';
    // dnd or correct resize shows bg color
    if (isOver) {
      className += isOverClassName;
    }
  }

  return ( <div
    ref={setNodeRef}
    style={{ ...blockStyle }}
    className={className} 
  />);
}

DateBlock.propTypes = {
  className: PropTypes.string,
  blockStyle: PropTypes.object,
  value: PropTypes.instanceOf(Date).isRequired,
  range: PropTypes.array.isRequired
};
