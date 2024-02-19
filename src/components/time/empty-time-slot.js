import { useDroppable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import * as dates from '../../utils/dates';

export function TimeSlot({ value, }) {

  const currentSlotValue = useRef(null);

  if (!currentSlotValue.current){
    if (dates.isJustDate(value)) {
      // if it's a isJustDate date, add 1s to making it not
      currentSlotValue.current = new Date(value.getTime() + 1000);
    } else {
      currentSlotValue.current = value;
    }
  }

  const { isOver, setNodeRef, active } =  useDroppable({
    // use time as id cause it's unique
    id: currentSlotValue.current,
    type: 'TimeSlot'
  });

  const bgCls = 'empty-time-slot-is-drag-over';
  let cls = 'empty-time-slot';
  // grid-event-resize do not add bg
  if (isOver && active && active.data.current.type !== 'grid-event-resize'){
    cls += ` ${bgCls}`;
  }
  
  return <div className={cls} ref={setNodeRef}></div>;
}

TimeSlot.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
};

