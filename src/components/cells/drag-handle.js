import { useDraggable } from '@dnd-kit/core';
import React from 'react';
import PropTypes from 'prop-types';

export function DragHandle({ display, rowId, data, resizeDirection, continuesPrior, continuesAfter }) {

  const leftHandle = resizeDirection === 'left' && !continuesPrior && continuesAfter;
  const rightHandle = resizeDirection === 'right' && continuesPrior && !continuesAfter;

  if (!(leftHandle || rightHandle)) {
    display = { display: 'none' };
  }

  const { attributes: resizeAttributes, listeners: resizeListeners, setNodeRef: resizeSetNodeRef, transform: resizeTransform } = useDraggable({
    id: rowId + `-${resizeDirection}-resize-handle`,
    data: { ...data, type: resizeDirection + 'Resize' },
  });

  const resizeTransformPosition = resizeTransform ? {
    transform: `translate3d(${resizeTransform.x}px, ${resizeTransform.y}px, 0)`,
  } : undefined;

  const bg = {
    backgroundColor: 'lightgrey',
  };

  const classNames = {
    'left': 'resize-handle-left',
    'right': 'resize-handle-right',
  };

  return (
    <div className={classNames[resizeDirection]}
      {...resizeAttributes}
      {...resizeListeners}
      ref={resizeSetNodeRef}
      style={{ ...resizeTransformPosition, ...bg, ...display }}
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