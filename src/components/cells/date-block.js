import { useDroppable } from '@dnd-kit/core';
import { set } from 'lodash-es';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

export default function DateBlock({ className, blockStyle, value, range, setIsOverAllDaySlot }) {

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
