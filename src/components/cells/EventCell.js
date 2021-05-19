import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import * as dates from '../../utils/dates';
import { checkDesktop } from '../../utils/common';

class EventCell extends React.Component {

  getRbcEventStyle = () => {
    const { event } = this.props;
    const { bgColor, highlightColor, textColor } = event;
    return {
      background: bgColor,
      borderLeft: highlightColor && `3px solid ${highlightColor}`,
      color: textColor,
    };
  }

  onRowExpand = (data) => {
    this.props.onRowExpand(data.row);
  }


  render() {
    let {
      style,
      className,
      event,
      selected,
      isAllDay,
      onRowExpand,
      onDoubleClick,
      localizer,
      continuesPrior,
      continuesAfter,
      accessors,
      getters,
      children,
      components: { event: Event, eventWrapper: EventWrapper },
      slotStart,
      slotEnd,
      ...props
    } = this.props;

    let title = accessors.title(event);
    let tooltip = accessors.tooltip(event);
    let end = accessors.end(event);
    let start = accessors.start(event);
    let allDay = accessors.allDay(event);

    let showAsAllDay =
      isAllDay ||
      allDay ||
      dates.diff(start, dates.ceil(end, 'day'), 'day') > 1;

    let userProps = getters.eventProp(event, start, end, selected);

    const isDesktop = checkDesktop();

    const content = (
      <div className='rbc-event-content' title={tooltip || undefined}>
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
    );

    return (
      <EventWrapper {...this.props} type='date'>
        <div
          {...props}
          tabIndex={0}
          style={{ ...userProps.style, ...style, ...this.getRbcEventStyle() }}
          className={classnames('rbc-event', className, userProps.className, {
            'rbc-selected': selected,
            'rbc-event-mobile': !isDesktop,
            'rbc-event-allday': showAsAllDay,
            'rbc-event-continues-prior': continuesPrior,
            'rbc-event-continues-after': continuesAfter
          })}
          onClick={e => this.onRowExpand(event, e)}
          onDoubleClick={e => onDoubleClick && onDoubleClick(event, e)}
        >
          {typeof children === 'function' ? children(content) : content}
        </div>
      </EventWrapper>
    );
  }
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
