import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import getHeight from 'dom-helpers/height';
import qsa from 'dom-helpers/querySelectorAll';
import classnames from 'classnames';
import * as dates from '../../utils/dates';
import * as DateSlotMetrics from '../../utils/DateSlotMetrics';
import EventRow from './EventRow';
import EventEndingRow from './EventEndingRow';
import BackgroundCells from '../cells/BackgroundCells';

class DateContentRow extends React.PureComponent {

  constructor(...args) {
    super(...args);
    this.slotMetrics = DateSlotMetrics.getSlotMetrics();
  }

  handleSelectSlot = slot => {
    const { range, onSelectSlot } = this.props;
    onSelectSlot(range.slice(slot.start, slot.end + 1), slot);
  };

  handleShowMore = (slot, target) => {
    const { range, onShowMore } = this.props;
    let metrics = this.slotMetrics(this.props);
    let row = qsa(findDOMNode(this), '.rbc-row-bg')[0];

    let cell;
    if (row) cell = row.children[slot - 1];

    let events = metrics.getEventsForSlot(slot);
    onShowMore(events, range[slot - 1], cell, slot, target);
  };

  createHeadingRef = r => {
    this.headingRow = r;
  };

  createEventRef = r => {
    this.eventRow = r;
  };

  getContainer = () => {
    const { container } = this.props;
    return container ? container() : findDOMNode(this);
  };

  getRowLimit() {
    let eventHeight = getHeight(this.eventRow);
    let headingHeight = this.headingRow ? getHeight(this.headingRow) : 0;
    let eventSpace = getHeight(findDOMNode(this)) - headingHeight;

    return Math.max(Math.floor(eventSpace / eventHeight), 1);
  }

  renderHeadingCell = (date, index) => {
    let { renderHeader, getNow } = this.props;

    return renderHeader({
      date,
      key: `header_${index}`,
      className: classnames(
        'rbc-date-cell',
        {
          'rbc-now': dates.eq(date, getNow(), 'day')
        }
      )
    });
  };

  renderDummy = () => {
    let { className, range, renderHeader } = this.props;
    return (
      <div className={className}>
        <div className='rbc-row-content'>
          {renderHeader && (
            <div className='rbc-row' ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          <div className='rbc-row' ref={this.createEventRef}>
            <div className='rbc-row-segment'>
              <div className='rbc-event'>
                <div className='rbc-event-content'>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      date,
      rtl,
      range,
      className,
      selected,
      selectable,
      renderForMeasure,
      accessors,
      getters,
      components,
      getNow,
      renderHeader,
      renderFestival,
      onRowExpand,
      localizer,
      onSelectStart,
      onSelectEnd,
      onDoubleClick,
      resourceId,
      longPressThreshold,
      isAllDay,
      isMobile,
    } = this.props;
    if (renderForMeasure) return this.renderDummy();
    let metrics = this.slotMetrics(this.props);
    let { levels, extra } = metrics;

    let WeekWrapper = components.weekWrapper;

    const eventRowProps = {
      selected,
      accessors,
      getters,
      localizer,
      components,
      onRowExpand,
      onDoubleClick,
      resourceId,
      slotMetrics: metrics,
    };

    return (
      <div className={className}>
        <BackgroundCells
          date={date}
          getNow={getNow}
          rtl={rtl}
          range={range}
          selectable={selectable}
          container={this.getContainer}
          getters={getters}
          onSelectStart={onSelectStart}
          onSelectEnd={onSelectEnd}
          onSelectSlot={this.handleSelectSlot}
          components={components}
          longPressThreshold={longPressThreshold}
        />
        <div className='rbc-row-content'>
          {renderHeader && (
            <div className='rbc-row rbc-header-row' ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          <WeekWrapper isAllDay={isAllDay} {...eventRowProps}>
            {renderFestival && (
              <div className='rbc-row'>
                {range.map((date, index) => {
                  return <div key={index} className="rbc-festival-row-segment">{renderFestival(date)}</div>;
                })}
              </div>
            )}
            {levels.map((segs, idx) => (
              <EventRow key={idx} segments={segs} {...eventRowProps} />
            ))}
            {((!isMobile && !!extra.length) || isMobile) && (
              <EventEndingRow
                segments={extra}
                onShowMore={this.handleShowMore}
                isMobile={isMobile}
                {...eventRowProps}
              />
            )}
          </WeekWrapper>
        </div>
      </div>
    );
  }
}

DateContentRow.propTypes = {
  date: PropTypes.instanceOf(Date),
  events: PropTypes.array.isRequired,
  range: PropTypes.array.isRequired,
  rtl: PropTypes.bool,
  resourceId: PropTypes.any,
  renderForMeasure: PropTypes.bool,
  renderHeader: PropTypes.func,
  container: PropTypes.func,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,
  onShowMore: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onRowExpand: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  onDoubleClick: PropTypes.func,
  dayPropGetter: PropTypes.func,
  getNow: PropTypes.func.isRequired,
  isAllDay: PropTypes.bool,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  minRows: PropTypes.number.isRequired,
  maxRows: PropTypes.number.isRequired,
  className: PropTypes.string
};

DateContentRow.defaultProps = {
  minRows: 0,
  maxRows: Infinity
};

export default DateContentRow;
