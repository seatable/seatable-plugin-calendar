import React, { useEffect, useRef } from 'react';
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

const slotMetrics  = DateSlotMetrics.getSlotMetrics();

function DateContentRow(props) {

  const dateContentRowRef = useRef(null);
  const headingRowRef = useRef(null);
  const eventRowRef = useRef(null);

  const handleSelectSlot = slot => {
    const { range, onSelectSlot } = props;
    onSelectSlot(range.slice(slot.start, slot.end + 1), slot);
  };

  const handleShowMore = (slot, target) => {
    const { range, onShowMore } = props;
    let metrics = slotMetrics(props);
    let row = qsa(dateContentRowRef.current, '.rbc-row-bg')[0];
    let cell;
    if (row) cell = row.children[slot - 1];

    let events = metrics.getEventsForSlot(slot);
    onShowMore(events, range[slot - 1], cell, slot, target);
  };

  const getContainer = () => {
    const { container } = props;
    return container ? container() : dateContentRowRef.current;
  };

  const renderHeadingCell = (date, index) => {
    let { renderHeader, getNow } = props;
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

  const renderDummy = () => {
    let { className, range, renderHeader } = props;
    return (
      <div className={className}>
        <div className='rbc-row-content'>
          {renderHeader && (
            <div className='rbc-row' ref={headingRowRef}>
              {range.map(renderHeadingCell)}
            </div>
          )}
          <div className='rbc-row' ref={eventRowRef}>
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
  } = props;

  if (renderForMeasure) return renderDummy();
    
  let metrics = slotMetrics(props);
  
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
    isAllDay
  };

  return (
    <div className={className} ref={dateContentRowRef} >
      <BackgroundCells
        date={date}
        getNow={getNow}
        rtl={rtl}
        range={range}
        selectable={selectable}
        container={getContainer}
        getters={getters}
        onSelectStart={onSelectStart}
        onSelectEnd={onSelectEnd}
        onSelectSlot={handleSelectSlot}
        components={components}
        longPressThreshold={longPressThreshold}
        setIsOverAllDaySlot={props.setIsOverAllDaySlot}
      />
      <div className='rbc-row-content'>
        {renderHeader && (
          <div className='rbc-row rbc-header-row' ref={headingRowRef}>
            {range.map(renderHeadingCell)}
          </div>
        )}
        {/* <WeekWrapper isAllDay={isAllDay} {...eventRowProps}> */}
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
            onShowMore={handleShowMore}
            isMobile={isMobile}
            {...eventRowProps}
          />
        )}
        {/* </WeekWrapper> */}
      </div>
    </div>
  );
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
  className: PropTypes.string,
  uuid: PropTypes.string,
};

DateContentRow.defaultProps = {
  minRows: 0,
  maxRows: Infinity
};

export default DateContentRow;
