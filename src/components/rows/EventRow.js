import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import EventRowMixin from './EventRowMixin';

class EventRow extends React.Component {
  render() {
    let {
      segments,
      slotMetrics: { slots },
      className,
      isAllDayCell
    } = this.props;

    let lastEnd = 1;

    return (
      <div className={classnames(className, 'rbc-row')}>
        {segments.reduce((row, { event, left, right, span }, li) => {
          let key = '_lvl_' + li;
          let gap = left - lastEnd;

          let content = EventRowMixin.renderEvent(this.props, event);

          if (gap) row.push(EventRowMixin.renderSpan(slots, gap, `${key}_gap`));

          row.push(EventRowMixin.renderSpan(slots, span, key, content, isAllDayCell));

          lastEnd = right + 1;

          return row;
        }, [])}
      </div>
    );
  }
}

EventRow.propTypes = {
  segments: PropTypes.array,
  ...EventRowMixin.propTypes
};

EventRow.defaultProps = {
  ...EventRowMixin.defaultProps
};

export default EventRow;
