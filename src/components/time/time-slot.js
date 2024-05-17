import { useDroppable } from '@dnd-kit/core';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

export function TimeSlot({ value }) {

  const uniqueId = useRef(uuidv4());

  const { isOver, setNodeRef, active } = useDroppable({
    // use time as id cause it's unique
    id: uniqueId.current,
    data: {
      value: value,
      type: 'TimeSlot',
    }
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

