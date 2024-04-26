import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import classnames from 'classnames';
import CellTitle from './cell-title';
import * as dates from '../../utils/dates';
import { isMobile } from '../../utils/common';
import { useDraggable } from '@dnd-kit/core';
import { DragHandle } from './drag-handle';
import { v4 as uuidv4 } from 'uuid';
import { handleEnterKeyDown } from '../../utils/accessibility';

function EventCell(props) {
  
  let {
    style,
    className,
    event,
    selected,
    isAllDay,
    onDoubleClick,
    localizer,
    accessors,
    getters,
    children,
    components: { event: Event },
    slotStart,
    slotEnd,
    continuesPrior, 
    continuesAfter,
    handleRowExpand,
    ...restProps
  } = props;

  const uniqueId = useRef(uuidv4());
  // dnd, a.k.a drag and drop
  const { attributes: dndAttributes, listeners: dndListeners, setNodeRef: dndSetNodeRef, transform: dndTransform } = useDraggable({
    id: uniqueId.current + '-dnd',
    data: { ...props, type: 'dnd', uuid: uniqueId.current },
  });
  
  const dndTransformPosition = dndTransform ? {
    transform: `translate3d(${dndTransform.x}px, ${dndTransform.y}px, 0)`,
  } : {};

  const getRbcEventStyle = () => {
    const { event } = props;
    const { bgColor, highlightColor, textColor } = event;
    return {
      background: bgColor,
      borderLeft: highlightColor && `3px solid ${highlightColor}`,
      color: textColor,
    };
  };

  let title = <CellTitle event={event} />;
  let tooltip = accessors.tooltip(event);
  let end = accessors.end(event);
  let start = accessors.start(event);
  let allDay = accessors.allDay(event);

  let showAsAllDay =
      isAllDay ||
      allDay ||
      dates.diff(start, dates.ceil(end, 'day'), 'day') > 1;

  let userProps = getters.eventProp(event, start, end, selected);

  const content = (
    <div>   
      <div 
        {...dndListeners}
        {...dndAttributes} 
        className='rbc-event-content'
        style={{
          touchAction: 'none'
        }}
        tabIndex={-1}
        title={tooltip || undefined}>
        {Event ? (
          <Event
            event={event}
            continuesPrior={continuesPrior}
            continuesAfter={continuesAfter}
            title={title}
            isAllDay={allDay}
            localizer={localizer}
            slotStart={slotStart}
            slotEnd={slotEnd}
          />
        ) : (title)}
      </div>
    </div>
  );

  const normalEvent = !continuesAfter && !continuesPrior;
  const eventCrossWeeksStartHandler = (continuesAfter && !continuesPrior);
  const eventCrossWeeksEndHandler = (continuesPrior && !continuesAfter);

  const onRowExpand = () => {    
    props.handleRowExpand(event.row._id);
  }; 
  return (
    <div 
      tabIndex={0}
      onKeyDown={handleEnterKeyDown(onRowExpand)}
    >
      {(normalEvent || eventCrossWeeksStartHandler) &&
        <DragHandle 
          continuesPrior={continuesPrior}
          continuesAfter={continuesAfter}
          rowId={event.row._id}
          data={props}
          resizeDirection='left'
        />
      }
      <div
        ref={dndSetNodeRef}
        {...restProps}
        tabIndex={-1}
        style={{ ...userProps.style, ...style, ...getRbcEventStyle(), ...dndTransformPosition }}
        className={classnames('rbc-event', className, userProps.className, {
          'rbc-selected': selected,
          'rbc-event-mobile': isMobile,
          'rbc-event-allday': showAsAllDay,
          'rbc-event-continues-prior': continuesPrior,
          'rbc-event-continues-after': continuesAfter
        })}
        onClick={onRowExpand}
        onDoubleClick={e => onDoubleClick && onDoubleClick(event, e)}
      >
        {typeof children === 'function' ? children(content) : content}
      </div>
      {
        (normalEvent || eventCrossWeeksEndHandler) &&
        <DragHandle 
          continuesPrior={continuesPrior}
          continuesAfter={continuesAfter}
          rowId={event.row._id}
          data={props}
          resizeDirection='right'
        />
      }
    </div>
  );
}

EventCell.propTypes = {
  event: PropTypes.object.isRequired,
  slotStart: PropTypes.instanceOf(Date),
  slotEnd: PropTypes.instanceOf(Date),
  selected: PropTypes.bool,
  isAllDay: PropTypes.bool,
  continuesPrior: PropTypes.bool,
  continuesAfter: PropTypes.bool,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object,
  handleRowExpand: PropTypes.func,
  onDoubleClick: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.object,
  children: PropTypes.object
};

export default EventCell;
