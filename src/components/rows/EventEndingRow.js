import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import EventRowMixin from './EventRowMixin';
import { eventLevels } from '../../utils/eventLevels';
import { range } from '../../utils/common';

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot;
let eventsInSlot = (segments, slot) =>
  segments.filter(seg => isSegmentInSlot(seg, slot)).length;

class EventEndingRow extends React.Component {

  render() {
    let {
      segments,
      slotMetrics: { slots },
      isMobile,
    } = this.props;
    let rowSegments = eventLevels(segments).levels[0];


    let current = 1;
    let lastEnd = 1;
    let row = [];

    while (current <= slots) {
      let key = '_lvl_' + current;

      if (isMobile) {
        row.push(
          EventRowMixin.renderSpan(
            slots,
            1,
            key,
            this.renderShowMore(segments, current)
          )
        );
        current++;
        continue;
      }

      let { event, left, right, span } =
        (rowSegments && rowSegments.filter(seg => isSegmentInSlot(seg, current))[0]) || {}; //eslint-disable-line

      if (!event) {
        current++;
        continue;
      }

      let gap = Math.max(0, left - lastEnd);

      if (this.canRenderSlotEvent(left, span)) {
        let content = EventRowMixin.renderEvent(this.props, event);

        if (gap) {
          row.push(EventRowMixin.renderSpan(slots, gap, key + '_gap'));
        }

        row.push(EventRowMixin.renderSpan(slots, span, key, content));

        lastEnd = current = right + 1;
      } else {
        if (gap) {
          row.push(EventRowMixin.renderSpan(slots, gap, key + '_gap'));
        }

        row.push(
          EventRowMixin.renderSpan(
            slots,
            1,
            key,
            this.renderShowMore(segments, current)
          )
        );
        lastEnd = current = current + 1;
      }
    }

    return <div className='rbc-row'>{row}</div>;
  }

  canRenderSlotEvent(slot, span) {
    let { segments } = this.props;

    return range(slot, slot + span).every(s => {
      let count = eventsInSlot(segments, s);

      return count === 1;
    });
  }

  renderShowMore(segments, slot) {
    let count = eventsInSlot(segments, slot);
    if (this.props.isMobile) {
      return <div className="rbc-mobile-date-cover" onClick={e => this.showMore(slot, e)}></div>;
    }
    return count ? (
      <button
        key={'sm_' + slot}
        className={'rbc-link-button rbc-show-more'}
        onClick={e => this.showMore(slot, e)}
      >
        {`+${count} ${intl.get('more')}`}
      </button>
    ) : false;
  }

  showMore(slot, e) {
    e.preventDefault();
    this.props.onShowMore(slot, e.target);
  }
}

EventEndingRow.propTypes = {
  segments: PropTypes.array,
  slots: PropTypes.number,
  onShowMore: PropTypes.func,
  ...EventRowMixin.propTypes,
};

EventEndingRow.defaultProps = {
  ...EventRowMixin.defaultProps
};

export default EventEndingRow;
