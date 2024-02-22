import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import CellTitle from '../cells/cell-title';
import { v4 as uuidv4 } from 'uuid';
import { useDraggable } from '@dnd-kit/core';
import TimeGridEventDragHandle from './drag-handle';
import { stringifyPercent } from '../../utils/common';

// height of a single slot, a half hour
const minimalHeightUnit = 2.0833333333333357;

/**
 * duplication from EventCell.getRbcEventStyle for colored style of week/day events
 *
 * @see EventCell.getRbcEventStyle
 * @param props
 * @return {{borderLeft: string, color, background}}
 */
const getRbcEventStyle = (props) => {
  const { event } = props;
  const { bgColor, highlightColor, textColor } = event;
  return {
    background: bgColor,
    borderLeft: highlightColor && `3px solid ${highlightColor}`,
    color: textColor,
  };
};

/* eslint-disable react/prop-types */
function TimeGridEvent(props) {

  const {
    style,
    className,
    event,
    accessors,
    rtl,
    selected,
    label,
    continuesEarlier,
    continuesLater,
    getters,
    onClick,
    onDoubleClick,
    components: { event: Event, eventWrapper: EventWrapper }
  } = props;

  const [eventHeight, setEventHeight] = useState(style.height);
  const [eventTop, setEventTop] = useState(style.top);
  const [singleSlotHeight, setSingleSlotHeight] = useState(19.5);

  useEffect(() => {
    setEventTop(props.style.top);
  }, [props.style.top]);

  useEffect(() => {
    setEventHeight(props.style.height);
  }, [props.style.height]);

  // evaluate just once after mounted
  useEffect(() => {
    computeSingleSlotHeight();
    window.addEventListener('resize', computeSingleSlotHeight);
    return () => window.removeEventListener('resize', computeSingleSlotHeight);
  }, []);

  function computeSingleSlotHeight() {
    const container = document.querySelector('#rbc-time-content');
    // minus 24 top borders height,
    const containerHeight = container.clientHeight - 24;
    const singleSlotHeight = containerHeight * minimalHeightUnit / 100;
    setSingleSlotHeight(singleSlotHeight);
  }

  // drag handle to resize event height
  function resizeEventHeight(diff) {
    let newEventHeight = eventHeight + diff * minimalHeightUnit;
    if (newEventHeight < minimalHeightUnit) newEventHeight = minimalHeightUnit;
    setEventHeight(newEventHeight);
  }

  function resizeEventTop(diff) {
    const currentEnd = eventTop + eventHeight;
    let newEventTop = eventTop - diff * minimalHeightUnit;
    //  keep a minimal height
    if (newEventTop >= currentEnd ) newEventTop = currentEnd - minimalHeightUnit;
    setEventTop(newEventTop);
  }

  const uniqueId = useRef(uuidv4());
  // dnd, a.k.a drag and drop
  const { attributes: dndAttributes, listeners: dndListeners, setNodeRef: dndSetNodeRef, transform: dndTransform } = useDraggable({
    id: uniqueId.current + '-dnd',
    data: { ...props, type: 'dnd', uuid: uniqueId.current },
  });
  
  const dndTransformPosition = dndTransform ? {
    transform: `translate(${dndTransform.x}px, ${dndTransform.y}px)`,
    // rise zIndex after drag start
    zIndex: 1000,
  } : {};

  function changeTitle(title, label) {
    if (this.dndSetNodeRef.current) {
      this.dndSetNodeRef.current.title = title ? (typeof label === 'string' ? label + ': ' : '') + title : undefined;
    }
  }

  let title = <CellTitle event={event} changeTitle={(title) => {changeTitle(title, label);}} />;
  let tooltip = accessors.tooltip(event);
  let end = accessors.end(event);
  let start = accessors.start(event);

  let userProps = getters.eventProp(event, start, end, selected);

  let { width, xOffset } = style;
  const eventInSingleLine = eventHeight < 3.5 ? true : false;
  const inner = [
    <div key='1'
      className='rbc-event-label'
      {...dndListeners}
      {...dndAttributes} 
    >
      <span>
        {label}
      </span>
    </div>,
    <div key='2'
      className={classnames('rbc-event-content', 'rbc-event-content-timeslot', { 'd-flex align-items-center text-nowrap': eventInSingleLine })}
      {...dndListeners}
      {...dndAttributes} 
    >
      {Event ? <Event event={event} title={title} /> : title}
    </div>
  ];

  return (
    <EventWrapper type='time' {...props}>
      <div
        ref={dndSetNodeRef}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        style={{
          ...getRbcEventStyle(props),
          ...userProps.style,
          top: stringifyPercent(eventTop),
          [rtl ? 'right' : 'left']: stringifyPercent(xOffset),
          width: stringifyPercent(width),
          height: stringifyPercent(eventHeight),
          ...dndTransformPosition
        }}
        title={
          tooltip
            ? (typeof label === 'string' ? label + ': ' : '') + tooltip
            : undefined
        }
        className={classnames('rbc-event', className, userProps.className, {
          'rbc-selected': selected,
          'rbc-event-continues-earlier': continuesEarlier,
          'rbc-event-continues-later': continuesLater
        })}
      >
        <TimeGridEventDragHandle direction="top"
          resizeEventTop={resizeEventTop}
          resizeEventHeight={resizeEventHeight}         
          singleSlotHeight={singleSlotHeight}
          event={event}
        />
        {inner}
        <TimeGridEventDragHandle direction="bottom" 
          resizeEventTop={resizeEventTop}
          resizeEventHeight={resizeEventHeight}
          singleSlotHeight={singleSlotHeight}
          event={event}
        />
      </div>
    </EventWrapper>
  );
}

export default TimeGridEvent;
