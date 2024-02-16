import { useDraggable } from '@dnd-kit/core';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
export function DragHandle({ display, rowId, data, resizeDirection, continuesPrior, continuesAfter }) {

  const uniqueId = useRef(uuidv4());
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: uniqueId.current + `-${resizeDirection}-handle`,
    data: { ...data, type: resizeDirection + 'Resize', uuid: uniqueId.current },
  });

  const resizeTransformPosition = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const classNames = {
    'left': 'resize-handle-left',
    'right': 'resize-handle-right',
  };

  return (
    <div className={classNames[resizeDirection]}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={{ ...resizeTransformPosition, ...{
        touchAction: 'none'
      } }}
    >
    </div>
  );
}

DragHandle.propTypes = {
  display: PropTypes.object,
  rowId: PropTypes.string,
  data: PropTypes.object,
  resizeDirection: PropTypes.string,
  continuesPrior: PropTypes.bool,
  continuesAfter: PropTypes.bool,
};