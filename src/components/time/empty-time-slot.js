import { useDroppable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

export function TimeSlot({ value }) {

  const uuid = useRef(uuidv4());

  const { isOver, setNodeRef, active } =  useDroppable({
    id: uuid.current,
    time: value
  });

  const bg = 'empty-time-slot-is-drag-over';

  let cls = 'empty-time-slot';
  if (isOver){
    cls += ` ${bg}`;
  }
  
  return <div className={cls} ref={setNodeRef}></div>;
}

TimeSlot.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired
};

