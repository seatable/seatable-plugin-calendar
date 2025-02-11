import React from 'react';
import PropTypes from 'prop-types';
import EventCell from '../cells/EventCell';
import { isSelected } from '../../utils/selection';

const mixins = {
  propTypes: {
    slotMetrics: PropTypes.object.isRequired,
    selected: PropTypes.object,
    isAllDay: PropTypes.bool,
    accessors: PropTypes.object.isRequired,
    localizer: PropTypes.object.isRequired,
    components: PropTypes.object.isRequired,
    getters: PropTypes.object.isRequired,
    handleRowExpand: PropTypes.func,
    onDoubleClick: PropTypes.func
  },

  defaultProps: {
    segments: [],
    selected: {}
  },

  renderEvent(props, event) {
    let {
      selected,
      accessors,
      getters,
      handleRowExpand,
      onDoubleClick,
      localizer,
      slotMetrics,
      components,
      isAllDay,
    } = props;

    let continuesPrior = slotMetrics.continuesPrior(event);
    let continuesAfter = slotMetrics.continuesAfter(event);

    return (
      <EventCell
        event={event}
        getters={getters}
        localizer={localizer}
        accessors={accessors}
        components={components}
        handleRowExpand={handleRowExpand}
        onDoubleClick={onDoubleClick}
        continuesPrior={continuesPrior}
        continuesAfter={continuesAfter}
        slotStart={slotMetrics.first}
        slotEnd={slotMetrics.last}
        selected={isSelected(event, selected)}
        isAllDay={isAllDay}
      />
    );
  },

  // randerSpan component wraps both empty space and events，compute width of them
  renderSpan(slots, len, key, content = ' ', isAllDayCell) {
    let per = (Math.abs(len) / slots) * 100 + '%';

    const props = {
      key,
      // IE10/11 need max-width. flex-basis doesn't respect box-sizing
      style: {
        WebkitFlexBasis: per,
        flexBasis: per,
        maxWidth: per,
        position: 'relative',
        paddingRight: isAllDayCell ? '12px' : '0',
      },
      className: 'rbc-row-segment',
    };

    return (
      <div
        {...props}
      >
        {content}
      </div>
    );
  }
};
export default mixins;
