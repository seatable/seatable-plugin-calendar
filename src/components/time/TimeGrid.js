import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as animationFrame from 'dom-helpers/animationFrame';
import getWidth from 'dom-helpers/width';
import dayjs from 'dayjs';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import DayColumn from './DayColumn';
import TimeGridHeader from '../header/TimeGridHeader';
import TimeGutter from './TimeGutter';
import memoize from '../../utils/memoize';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import Resources from '../../utils/Resources';
import { inRange, sortEvents } from '../../utils/eventLevels';
import { DayLayoutAlgorithmPropType } from '../../utils/propTypes';
import { DndContext, rectIntersection, pointerWithin } from '@dnd-kit/core';
import { isEmptyObject } from 'dtable-utils';
import { throttle } from 'lodash-es';

export default class TimeGrid extends Component {
  constructor(props) {
    super(props);

    this.state = { 
      gutterWidth: undefined, 
      isOverflowing: null, 
      isDraggingToAllDaySlot: false,
    };

    this.scrollRef = React.createRef();
    this.contentRef = React.createRef();
    this._scrollRatio = null;
  }

  UNSAFE_componentWillMount() {
    this.calculateScroll();
  }

  componentDidMount() {
    this.checkOverflow();

    if (this.props.width == null) {
      this.measureGutter();
    }

    this.applyScroll();

    window.addEventListener('resize', this.handleResize);
  }

  handleScroll = e => {
    if (this.scrollRef.current) {
      this.scrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  handleResize = () => {
    animationFrame.cancel(this.rafHandle);
    this.rafHandle = animationFrame.request(this.checkOverflow);
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

    animationFrame.cancel(this.rafHandle);

    if (this.measureGutterAnimationFrameRequest) {
      window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest);
    }
  }

  componentDidUpdate() {
    if (this.props.width == null) {
      this.measureGutter();
    }

    this.applyScroll();
    // this.checkOverflow()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { range, scrollToTime } = this.props;
    // When paginating, reset scroll
    if (
      !dates.eq(nextProps.range[0], range[0], 'minute') ||
      !dates.eq(nextProps.scrollToTime, scrollToTime, 'minute')
    ) {
      this.calculateScroll(nextProps);
    }
  }

  gutterRef = ref => {
    this.gutter = ref && findDOMNode(ref);
  };

  onRowExpand = (...args) => {
    // cancel any pending selections so only the event click goes through.
    this.clearSelection();
    notify(this.props.onRowExpand, args);
  };

  handleSelectAllDaySlot = (slots, slotInfo) => {
    const { onSelectSlot } = this.props;
    notify(onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1],
      action: slotInfo.action
    });
  };

  renderEvents(range, events, now) {
    let {
      min,
      max,
      components,
      accessors,
      localizer,
      dayLayoutAlgorithm
    } = this.props;

    const resources = this.memoizedResources(this.props.resources, accessors);
    const groupedEvents = resources.groupEvents(events);

    return resources.map(([id, resource], i) =>
      range.map((date, jj) => {
        let daysEvents = (groupedEvents.get(id) || []).filter(event =>
        { 
          // special case: 00:00 is inRange of next day, which renders useless span
          if (dates.isJustDate(accessors.end(event)) && dates.eq(date, accessors.end(event), 'day' )) return false;

          const inRange =  dates.inRange(
            date,
            accessors.start(event),
            accessors.end(event),
            'day');  
          return inRange;
        }
        );

        return (
          <DayColumn
            {...this.props}
            localizer={localizer}
            min={dates.merge(date, min)}
            max={dates.merge(date, max)}
            resource={resource && id}
            components={components}
            isNow={dates.eq(date, now, 'day')}
            key={i + '-' + jj}
            date={date}
            events={daysEvents}
            dayLayoutAlgorithm={dayLayoutAlgorithm}
          />
        );
      })
    );
  }

  isOverHorizontalBoundrys = (boundaryWIdth, nodeRect, targetRect) => {
    if (nodeRect.right > targetRect.left && nodeRect.left < targetRect.left) {
      if (nodeRect.right - targetRect.left < boundaryWIdth) {
        return false;
      } 
      return true;
    } else if (nodeRect.left < targetRect.right && nodeRect.right > targetRect.right) {
      if (targetRect.right - nodeRect.left < boundaryWIdth) {
        return false;
      } 
      return true;
    }
    return false;
  }; 
  
  isOverVerticalBoundrys = (boundaryHeight, nodeRect, targetRect) => {
    if (nodeRect.bottom > targetRect.top && nodeRect.top < targetRect.top ) {
      if (targetRect.top - nodeRect.bottom > boundaryHeight) {
        return true;
      }
      return false;
    } else if (nodeRect.bottom > targetRect.bottom && nodeRect.top < targetRect.bottom ) {
      if (targetRect.bottom - nodeRect.top > boundaryHeight) {
        return true;
      }
      return false;
    }
    return true;
  };

  timeSlotDetectionAlgorithm = ({
    active,
    collisionRect,
    droppableRects,
    droppableContainers,
    pointerCoordinates,
  }) => {
    // allDayslot use pointerWithin
    if (active.data.current.type === 'dnd' && active.data.current.isAllDay) {
      return pointerWithin({
        active,
        collisionRect,
        droppableRects,
        droppableContainers,
        pointerCoordinates,
      });
    }
    // custom detection Algorith for is overed slots background
    this.clearIsOveredNodes();
    const collisions = rectIntersection({ active, collisionRect, droppableRects, droppableContainers, pointerCoordinates });

    const boundaryWidth = (collisionRect.right - collisionRect.left) * 0.5;
    const boundaryheight = (droppableContainers[0].rect.current.height) * 0.5;

    const currentNodes = collisions.filter(v => {
      return this.isOverHorizontalBoundrys(boundaryWidth, v.data.droppableContainer.rect.current, collisionRect) && this.isOverVerticalBoundrys(boundaryheight, v.data.droppableContainer.rect.current, collisionRect);
    });
    currentNodes.forEach(v => { v.data.droppableContainer.node.current.classList.add('empty-time-slot-is-drag-over');});
    this.prevNodes = currentNodes;
    return collisions;  
  };

  clearIsOveredNodes = () => {
    if (this.prevNodes?.length) {
      this.prevNodes.forEach(v => {
        v.data.droppableContainer.node.current.classList.remove('empty-time-slot-is-drag-over');
      });
    }
    this.prevNodes = [];
  };

  getNewEventTime = (event, newStartDate, direction, isJustDate, isAllDay, type ) => {
    let unit;
    isJustDate ? unit = 'day' : unit = 'minute';
    let dateRange = dates.range(event.start, event.end, unit);
    let newStart, newEnd;
    // drag from allDaySlot to allDaySlot
    if (type === 'DateBlock' && isAllDay) {
      newStart = newStartDate;
      newEnd = dates.add(newStartDate, dateRange.length - 1, unit);
    } else  if (type === 'DateBlock' && !isAllDay) {
      // from timeSlot to allDaySlot
      newStart = newStartDate;
      newEnd = newStartDate;
    } else if (type === 'TimeSlot' && !isAllDay) {
      // from timeSlot to timeSlot

      // resize
      if (direction) {
        // top/bottom resize
        if (direction === 'top') {
          if (newStartDate >= event.end && dates.eq(newStartDate, event.end, 'day')) {
            newStartDate = dates.add(event.end, -30, 'minutes');
          }

          if (!dates.eq(newStartDate, event.start, 'day')) {
            newStartDate = event.start.setHours(newStartDate.getHours(), newStartDate.getMinutes(), 0);
            newStartDate = new Date(newStartDate);
          }
          
          newStart = newStartDate;
          newEnd = event.end;
        } else {
          if (newStartDate <= event.start && dates.eq(newStartDate, event.start, 'day')) {
            newStartDate = dates.add(event.start, 30, 'minutes');
          }

          const startOfDate = new Date(newStartDate.getTime()).setHours(0, 0, 0, 0);

          if ( newStartDate > event.end && !dates.eq(newStartDate, event.end, 'day') && !dates.eq(newStartDate, new Date(startOfDate), 'minutes') ) {
            newStartDate = event.end.setHours(newStartDate.getHours(), newStartDate.getMinutes(), 0);
            newStartDate = new Date(newStartDate);
          }
          
          newStart = event.start;
          newEnd = newStartDate;
        }
      } else {
      // drag and drop
        newStart = newStartDate;
        let mins;
        if (dateRange.length === 1) {
          mins = 30;
        } else {
          mins = dateRange.length - 1;
        }
        newEnd = dates.add(newStartDate, mins, unit);
      }
     
    } else {
      // drag from allDaySlot to timeSlot, initially set a 30 minutes duration
      newStart = newStartDate;
      newEnd = dates.add(newStartDate, 30, 'minutes');
    }
    return { start: newStart, end: newEnd };
  };

  // isAllDay used to determine if the event is dragged from allDaySlot or not
  // type used to determine if the event is dropped to timeSlot/DateBlock
  handleEventDragDrop = (event, newTime, isAllDay, direction, type) => {

    if (dates.isJustDate(newTime) && dates.eq(event.start, newTime) && isAllDay) return;
  
    const { start, end } = this.getNewEventTime(event, newTime, direction, dates.isJustDate(newTime), isAllDay, type);
    // invalid drag & drop
    if (!start || !end) return;

    this.props.onEventDragDrop({ event, start, end, allDay: event.allDay });
  };

  handleEventResizeDrop = () => {
    this.props.onResizeDrop();
  };

  handleEventDrop = (e) => {

    // fix use double clicking on event was recognized as drag and drop
    const endDragging = new Date();
    const timeDiff = endDragging - this.startDragging;
    if (timeDiff < 300) {
      this.props.onSelectEvent(e.active.data.current.event);
      this.startDragging = null;
      return;
    }

    const dropData = e.active.data.current;
    const event = dropData.event;
    // e.over is the drop target data, event is the dragged item data
    if (!e.over || !event) return;
    const overData = e.over?.data.current;

    if (dropData.type === 'dnd' || dropData.type === 'grid-event-resize') {

      // dropData.direction handle weather start/end time need to be updated
      let newTime = e.over.data.current?.value; // fix the bug that when drag down, time is 30 mins less
      if (dropData.mouseDirection === 'down') {
        newTime = dates.add(newTime, 30, 'minutes');
      }

      this.handleEventDragDrop(event, newTime, dropData.isAllDay, dropData.direction, overData.type);
        
    } else if (dropData.type === 'leftResize' || dropData.type === 'rightResize') {
      this.handleEventResizeDrop();
    } else {
      console.log('invalid type' + dropData.type);
    }
    this.clearIsOveredNodes();
  };

  handleEventResizing = (e) => {
    if (!e.over) return;
    const operateType = e.active.data.current?.type;
    if (!operateType || operateType === 'grid-event-resize' || operateType?.includes('dnd')  ) return;

    const resizingData = e.active.data.current;
    if (isEmptyObject(resizingData)) return;

    let newTime = e.over.data.current?.value;
    let start, end;
    if (resizingData.type === 'leftResize') {
      start = newTime;
      end = resizingData.event.end;
    } else if (resizingData.type === 'rightResize') {
      end = newTime;
      start = resizingData.event.start;
    } else {
      console.log('invalid type' + resizingData.type);
    }
    if (start > end) return;
    this.props.onEventDragResize({ event: resizingData.event, start, end, isAllDay: resizingData.event.allDay });
  };

  render() {
    let {
      events,
      range,
      width,
      rtl,
      selected,
      getNow,
      resources,
      components,
      accessors,
      getters,
      localizer,
      min,
      max,
      showMultiDayTimes,
      longPressThreshold
    } = this.props;

    width = width || this.state.gutterWidth;

    let start = range[0],
      end = range[range.length - 1];

    this.slots = range.length;

    let allDayEvents = [],
      rangeEvents = [];

      

    events.forEach(event => {
      if (inRange(event, start, end, accessors)) {
        let eStart = accessors.start(event),
          eEnd = accessors.end(event);

        const a = accessors.allDay(event); 
        const b = dates.isJustDate(eStart) && dates.isJustDate(eEnd);
        const c = (!showMultiDayTimes && !dates.eq(eStart, eEnd, 'day') && dates.isJustDate(eStart) && dates.isJustDate(eEnd));

        if (
          a || c || b
        ) {
          allDayEvents.push(event);
        } else {
          rangeEvents.push(event);
        }
      }
    });

    allDayEvents.sort((a, b) => sortEvents(a, b, accessors));

    const throttleHandleEventDrop = throttle(this.handleEventDrop, 10);
    const throttleHandleEventResize = throttle(this.handleEventResizing, 10);

    return (
      <div
        className={classnames(
          'rbc-time-view',
          {
            'rbc-time-view-resources': resources
          }
        )}
      >
        <DndContext
          collisionDetection={this.timeSlotDetectionAlgorithm}
          onDragEnd={throttleHandleEventDrop}
          onDragMove={throttleHandleEventResize}
          onDragStart={(e) => { this.startDragging = new Date();}}
        >
          <div className='rbc-time-container'>
            <div className='rbc-time-overflow-controller'>
              <TimeGridHeader
                range={range}
                events={allDayEvents}
                width={width}
                rtl={rtl}
                getNow={getNow}
                localizer={localizer}
                selected={selected}
                resources={this.memoizedResources(resources, accessors)}
                selectable={this.props.selectable}
                accessors={accessors}
                getters={getters}
                components={components}
                scrollRef={this.scrollRef}
                isOverflowing={this.state.isOverflowing}
                longPressThreshold={longPressThreshold}
                onSelectSlot={this.handleSelectAllDaySlot}
                onRowExpand={this.onRowExpand}
                onDoubleClickEvent={this.props.onDoubleClickEvent}
                onDrillDown={this.props.onDrillDown}
                getDrilldownView={this.props.getDrilldownView}
              />
              <div
                ref={this.contentRef}
                className="rbc-time-content"
                id='rbc-time-content'
                onScroll={this.handleScroll}
              >
                <TimeGutter
                  date={start}
                  ref={this.gutterRef}
                  localizer={localizer}
                  min={dates.merge(start, min)}
                  max={dates.merge(start, max)}
                  step={this.props.step}
                  getNow={this.props.getNow}
                  timeslots={this.props.timeslots}
                  components={components}
                  className='rbc-time-gutter'
                />
                {this.renderEvents(range, rangeEvents, getNow())}
                <CurrentTimeIndicator
                  contentRef={this.contentRef}
                  getNow={getNow}
                  localizer={localizer}
                  min={min}
                  max={max}
                  width={width}
                />
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    );
  }

  clearSelection() {
    clearTimeout(this._selectTimer);
    this._pendingSelection = [];
  }

  measureGutter() {
    if (this.measureGutterAnimationFrameRequest) {
      window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest);
    }
    this.measureGutterAnimationFrameRequest = window.requestAnimationFrame(
      () => {
        const width = getWidth(this.gutter);

        if (width && this.state.gutterWidth !== width) {
          this.setState({ gutterWidth: width });
        }
      }
    );
  }

  applyScroll() {
    if (this._scrollRatio != null) {
      const content = this.contentRef.current;
      content.scrollTop = content.scrollHeight * this._scrollRatio;
      // Only do this once
      this._scrollRatio = null;
    }
  }

  calculateScroll(props = this.props) {
    const { min, max, scrollToTime } = props;

    const diffMillis = scrollToTime - dates.startOf(scrollToTime, 'day');
    const totalMillis = dates.diff(max, min);

    this._scrollRatio = diffMillis / totalMillis;
  }

  checkOverflow = () => {
    if (this._updatingOverflow) return;

    const content = this.contentRef.current;
    let isOverflowing = content.scrollHeight > content.clientHeight;

    if (this.state.isOverflowing !== isOverflowing) {
      this._updatingOverflow = true;
      this.setState({ isOverflowing }, () => {
        this._updatingOverflow = false;
      });
    }
  };

  memoizedResources = memoize((resources, accessors) =>
    Resources(resources, accessors)
  );
}

TimeGrid.propTypes = {
  events: PropTypes.array.isRequired,
  resources: PropTypes.array,
  step: PropTypes.number,
  timeslots: PropTypes.number,
  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),
  getNow: PropTypes.func.isRequired,
  scrollToTime: PropTypes.instanceOf(Date),
  showMultiDayTimes: PropTypes.bool,
  rtl: PropTypes.bool,
  width: PropTypes.number,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,
  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  onRowExpand: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  dayLayoutAlgorithm: DayLayoutAlgorithmPropType,
  onEventDragDrop: PropTypes.func,
  onResizeDrop: PropTypes.func,
  onEventDragResize: PropTypes.func,
};

TimeGrid.defaultProps = {
  step: 30,
  timeslots: 2,
  min: dates.startOf(new Date(), 'day'),
  max: dates.endOf(new Date(), 'day'),
  scrollToTime: dayjs().startOf('day').add(8, 'hour').toDate(),
};
