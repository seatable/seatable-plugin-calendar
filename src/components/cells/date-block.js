import { useDroppable } from '@dnd-kit/core';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

export function DateBlock({ className, blockStyle, value, range }) {

  const [initialStartTime, setInitialStartTime] = useState(null); 

  const { isOver, setNodeRef, active, } =  useDroppable({
    id: value,
    data: {
      date: value,
      range
    }
  });

  let current;
  // active is current dragging item
  if (active) {
    current = active.data.current;

    //  record initial start time, compare with dropped date, to determine bg color
    if (!initialStartTime) setInitialStartTime(current.event.start);

    const isDnd = current.type === 'dnd';

    // if left resize, dropped date must greater than event start date, and if right resize, dropped date must less than event end date
    // if !initialStartTime, still shows bg color
    const isCorrectTimeResize = !initialStartTime || ( current.type === 'leftResize' && current.event.start >= initialStartTime) || (current.type === 'rightResize' && current.event.end <= initialStartTime);

    const isOverClassName = ' rbc-day-bg-is-over';
    
    // dnd or correct resize shows bg color
    if (isOver && ( isDnd || isCorrectTimeResize )) {
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
