import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import qsa from 'dom-helpers/querySelectorAll';
import classnames from 'classnames';
import * as dates from '../../utils/dates';
import * as DateSlotMetrics from '../../utils/DateSlotMetrics';
import EventRow from './EventRow';
import EventEndingRow from './EventEndingRow';
import BackgroundCells from '../cells/BackgroundCells';
import dayjs from 'dayjs';
import { throttle } from 'lodash-es';

const slotMetrics = DateSlotMetrics.getSlotMetrics();

function DateContentRow(props) {

  const dateContentRowRef = useRef(null);
  const headingRowRef = useRef(null);
  const eventRowRef = useRef(null);
  const rbcRowContentRef = useRef(null);
  const currentActiveDate = useRef(null);

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
    handleRowExpand,
    localizer,
    onSelectStart,
    onSelectEnd,
    onDoubleClick,
    resourceId,
    longPressThreshold,
    isAllDay,
    isMobile,
    onInsertRow,
    canAddRecord,
  } = props;

  if (renderForMeasure) return renderDummy();

  let metrics = slotMetrics(props);

  let { levels, extra, slots } = metrics;

  const isAllDayCell = className === 'rbc-allday-cell';

  const onMouseLeave = () => {
    range.forEach(date => {
      const dateStr = dayjs(date).format('YYYY-MM-DD-HH-mm-ss');
      const insertBtn = document.querySelector(`#calendar-insert-${dateStr}`);
      if (!insertBtn) return;
      insertBtn.style.display = 'none';
    });
    currentActiveDate.current = null;
  };

  const onMouseMove = (e) => {
    if (e.target.closest('.rbc-row-segment') && !e.target.matches('.rbc-row-segment')) {
      // when mouse moved into event cell, hide current block insert button
      onMouseLeave();
      return;
    }
    // determine the currently hovered date based on the mouse position.
    const rbcRowContentWidth = rbcRowContentRef.current.clientWidth;
    const singleBlockWidth = rbcRowContentWidth / slots;
    const x = e.clientX - rbcRowContentRef.current.getBoundingClientRect().left;
    const slot = Math.floor(x / singleBlockWidth);
    currentActiveDate.current = range[slot];
    range.forEach(date => {
      const dateStr = dayjs(date).format('YYYY-MM-DD-HH-mm-ss');
      const insertBtn = document.querySelector(`#calendar-insert-${dateStr}`);
      if (!insertBtn) return;
      if (date === currentActiveDate.current) {
        insertBtn.style.display = 'flex';
      } else {
        insertBtn.style.display = 'none';
      }
    });
  };

  const onDoubleClickAddRecord = () => {
    currentActiveDate.current && onInsertRow(currentActiveDate.current);
  };

  const eventRowProps = {
    selected,
    accessors,
    getters,
    localizer,
    components,
    handleRowExpand,
    onDoubleClick,
    resourceId,
    slotMetrics: metrics,
    isAllDay
  };

  const addRowProps = canAddRecord && !isMobile ? {
    onMouseMove: throttle(onMouseMove, 100, { trailing: false }),
    onMouseLeave,
    onDoubleClick: onDoubleClickAddRecord
  } : {};

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
      />
      <div
        className='rbc-row-content'
        ref={rbcRowContentRef}
        {...addRowProps}
      >
        {renderHeader && (
          <div className='rbc-row rbc-header-row' ref={headingRowRef}>
            {range.map(renderHeadingCell)}
          </div>
        )}
        {renderFestival && (
          <div className='rbc-row'>
            {range.map((date, index) => {
              return <div key={index} className="rbc-festival-row-segment">{renderFestival(date)}</div>;
            })}
          </div>
        )}
        {levels.map((segs, idx) => (
          <EventRow isAllDayCell={isAllDayCell} range={range} key={idx} segments={segs} {...eventRowProps} />
        ))}
        {((!isMobile && !!extra.length) || isMobile) && (
          <EventEndingRow
            segments={extra}
            onShowMore={handleShowMore}
            isMobile={isMobile}
            {...eventRowProps}
          />
        )}
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
  handleRowExpand: PropTypes.func,
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
  minRows: PropTypes.number,
  maxRows: PropTypes.number,
  className: PropTypes.string,
  uuid: PropTypes.string,
  renderFestival: PropTypes.bool,
  isMobile: PropTypes.bool,
  onInsertRow: PropTypes.func,
  canAddRecord: PropTypes.bool,
};

export default DateContentRow;
