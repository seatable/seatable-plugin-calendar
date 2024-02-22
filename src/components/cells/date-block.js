import { useDroppable } from '@dnd-kit/core';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function DateBlock({ className, blockStyle, value, range }) {

  const uniqueId = useRef(uuidv4());

  const { isOver, setNodeRef, active } = useDroppable({
    id: uniqueId.current,
    data: {
      value,
      range,
      type: 'DateBlock',
    },
  });

  // active is current dragging item
  if (active && !active?.data?.current?.type?.toLowerCase().includes('resize')) {
    const isOverClassName = ' rbc-day-bg-is-over';
    // dnd or correct resize shows bg color
    if (isOver) {
      className += isOverClassName;
    }
  }

  return (
    <div ref={setNodeRef} style={{ ...blockStyle }} className={className} />
  );
}

DateBlock.propTypes = {
  className: PropTypes.string,
  blockStyle: PropTypes.object,
  value: PropTypes.instanceOf(Date).isRequired,
  range: PropTypes.array.isRequired,
};
