
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash-es';

function TimeGridEventDragHandle({ direction, resizeEventHeight, resizeEventTop, singleSlotHeight, event }) {

  const uniqueId = useRef(uuidv4());
  const [mouseDirection, setMouseDirection] = useState(null);

  const { attributes, listeners, setNodeRef } = useDraggable(
    {
      id: uniqueId.current,
      data: { type: 'grid-event-resize', event, direction, mouseDirection }
    }
  );

  const startY = useRef(0);
  const isDragging = useRef(false);

  function customRound(number) {
    if (number >= 0) {
      return Math.ceil(number); 
    } else {
      return Math.floor(number); 
    }
  }

  function handleMouseDown(e) {
    isDragging.current = true;
    startY.current = e.clientY;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if (!isDragging.current) return;
    const diffY = e.clientY - startY.current;
    if (diffY > 0) {
      setMouseDirection('down');
    }
    if (diffY < 0) {
      setMouseDirection('up');
    }
    const diff = customRound(diffY / singleSlotHeight);
    if (diff === 0) return;
    // if resize direction is top, we need to both resize the event height and top
    // and the diff should be negative
    if (direction === 'top') {
      resizeEventHeight(-diff);
      resizeEventTop(-diff);
    } else {
      resizeEventHeight(diff);
    }
  }

  function handleMouseUp() {
    isDragging.current = false;
    startY.current = 0;
    window.removeEventListener('mousemove', debounce(handleMouseMove, 100) );
    window.removeEventListener('mouseup', handleMouseUp);
  }

  const directionClass = {
    top: 'event-drag-handle-top',
    bottom: 'event-drag-handle-bottom'
  };
  const cls = directionClass[direction];
  return <div 
    className={`time-gird-event-drag-handle ${cls}`}
    {...listeners}
    {...attributes}
    ref={setNodeRef}
    onMouseDown={handleMouseDown}
  ></div>;
}

TimeGridEventDragHandle.propTypes = {
  direction: PropTypes.oneOf(['top', 'bottom']).isRequired,
  resizeEventHeight: PropTypes.func.isRequired,
  resizeEventTop: PropTypes.func.isRequired,
  singleSlotHeight: PropTypes.number.isRequired,
  event: PropTypes.object.isRequired
};

export default TimeGridEventDragHandle;