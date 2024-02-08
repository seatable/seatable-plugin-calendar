import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import CellTitle from './cell-title';
import * as dates from '../../utils/dates';
import { isMobile } from '../../utils/common';
import { useDraggable } from '@dnd-kit/core';
import { DragHandle } from './drag-handle';


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
    components: { event: Event, eventWrapper: EventWrapper },
    slotStart,
    slotEnd,
    continuesPrior, 
    continuesAfter,
    ...restProps
  } = props;

  // dnd, a.k.a drag and drop
  const { attributes: dndAttributes, listeners: dndListeners, setNodeRef: dndSetNodeRef, transform: dndTransform } = useDraggable({
    id: props.event.row._id + continuesAfter + continuesPrior + '-dnd',
    // id: Math.random().toString(36).substring(7),
    data: { ...props, type: 'dnd' },
  });
  
  const dndTransformPosition = dndTransform ? {
    transform: `translate3d(${dndTransform.x}px, ${dndTransform.y}px, 0)`,
  } : undefined;

  const getRbcEventStyle = () => {
    const { event } = props;
    const { bgColor, highlightColor, textColor } = event;
    return {
      background: bgColor,
      borderLeft: highlightColor && `3px solid ${highlightColor}`,
      color: textColor,
    };
  };

  const onRowExpand = (data) => {
    props.onRowExpand(data.row);
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

  return (
    <EventWrapper {...restProps} type='date'>
      {  (normalEvent || eventCrossWeeksStartHandler)  && 
        <DragHandle 
          continuesPrior={continuesPrior}
          continuesAfter={continuesAfter}
          rowId={event.row._id}
          data={props}
          resizeDirection='left'
        ></DragHandle>
      }
      <div
        ref={dndSetNodeRef}
        {...restProps}
        tabIndex={0}
        style={{ ...userProps.style, ...style, ...getRbcEventStyle(), ...dndTransformPosition }}
        className={classnames('rbc-event', className, userProps.className, {
          'rbc-selected': selected,
          'rbc-event-mobile': isMobile,
          'rbc-event-allday': showAsAllDay,
          'rbc-event-continues-prior': continuesPrior,
          'rbc-event-continues-after': continuesAfter
        })}
        onClick={e => onRowExpand(event, e)}
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
        ></DragHandle>
      }
    </EventWrapper>
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
  onRowExpand: PropTypes.func,
  onDoubleClick: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.object,
  children: PropTypes.object
};

export default EventCell;
