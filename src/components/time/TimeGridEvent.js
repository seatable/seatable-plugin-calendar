import React from 'react';
import classnames from 'classnames';
import CellTitle from '../cells/cell-title';

function stringifyPercent(v) {
  return typeof v === 'string' ? v : v + '%';
}

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

  let title = <CellTitle event={event} />;
  let tooltip = accessors.tooltip(event);
  let end = accessors.end(event);
  let start = accessors.start(event);

  let userProps = getters.eventProp(event, start, end, selected);

  let { height, top, width, xOffset } = style;
  const eventInSingleLine = height < 3.5 ? true : false;
  const inner = [
    <div key='1' className='rbc-event-label'>
      <span>
        {label}
      </span>
    </div>,
    <div key='2' className={classnames('rbc-event-content', {'d-flex align-items-center text-nowrap': eventInSingleLine})} >
      {Event ? <Event event={event} title={title} /> : title}
    </div>
  ];

  return (
    <EventWrapper type='time' {...props}>
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        style={{
          ...getRbcEventStyle(props),
          ...userProps.style,
          top: stringifyPercent(top),
          [rtl ? 'right' : 'left']: stringifyPercent(xOffset),
          width: stringifyPercent(width),
          height: stringifyPercent(height)
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
        {inner}
      </div>
    </EventWrapper>
  );
}

export default TimeGridEvent;
