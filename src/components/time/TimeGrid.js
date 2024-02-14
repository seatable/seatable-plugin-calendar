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
import { DndContext } from '@dnd-kit/core';
import { pointerWithin, rectIntersection } from '@dnd-kit/core';
import { isEmptyObject } from 'dtable-utils';
import { throttle } from 'lodash-es';

export default class TimeGrid extends Component {
  constructor(props) {
    super(props);

    this.state = { gutterWidth: undefined, isOverflowing: null };

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
          dates.inRange(
            date,
            accessors.start(event),
            accessors.end(event),
            'day'
          )
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

  customCollisionDetectionAlgorithm =  (args) => {
    // First, let's see if there are any collisions with the pointer
    const pointerCollisions = pointerWithin(args);
    
    // Collision detection algorithms return an array of collisions
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // If there are no collisions with the pointer, return rectangle intersections
    return rectIntersection(args);
  };

  getNewEventTime = (event, newStartDate) => {
    const dateRange = dates.range(event.start, event.end, 'day');
    const newStart = newStartDate;
    const newEnd = dates.add(newStartDate, dateRange.length - 1, 'day');
    return { start: newStart, end: newEnd };
  };

  handleEventDrag = (event, newTime) => {
    // i just use date as the dropped item id, cause they are unique
    const { start, end } = this.getNewEventTime(event, newTime);
    this.props.onEventDragDrop({ event, start, end, allDay: event.allDay });
  };

  handleEventResizeDrop = () => {
    this.props.onResizeDrop();
  };

  handleEventDrop = (e) => {
    const dropData = e.active.data.current;
    const event = dropData.event;
    if (!e.over || !event) return;
    if (dropData.type === 'dnd') {
      this.handleEventDrag(event, e.over.id);
    } else if (dropData.type === 'leftResize' || dropData.type === 'rightResize') {
      this.handleEventResizeDrop();
    } else {
      console.log('invalid type' + dropData.type);
    }
  };

  handleEventResizing = (e) => {
    if (!e.over) return;
    const operateType = e.active.data.current?.type;
    if (operateType?.includes('dnd') || !operateType ) return;

    const resizingData = e.active.data.current;
    if (isEmptyObject(resizingData)) return;

    let newTime = e.over.id;
    let start, end;
    if (resizingData.type === 'leftResize') {
      start = newTime;
      end = resizingData.event.end;
    } else if ( resizingData.type === 'rightResize') {
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

        if (
          accessors.allDay(event) ||
          (dates.isJustDate(eStart) && dates.isJustDate(eEnd)) ||
          (!showMultiDayTimes && !dates.eq(eStart, eEnd, 'day'))
        ) {
          allDayEvents.push(event);
        } else {
          rangeEvents.push(event);
        }
      }
    });

    allDayEvents.sort((a, b) => sortEvents(a, b, accessors));

    const throttleHandleEventDrop = throttle(this.handleEventDrop, 50);
    const throttleHandleEventResize = throttle(this.handleEventResizing, 50);
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
          collisionDetection={this.customCollisionDetectionAlgorithm}
          onDragEnd={throttleHandleEventDrop}
          onDragMove={throttleHandleEventResize}
        >
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
            className='rbc-time-content'
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
  dayLayoutAlgorithm: DayLayoutAlgorithmPropType
};

TimeGrid.defaultProps = {
  step: 30,
  timeslots: 2,
  min: dates.startOf(new Date(), 'day'),
  max: dates.endOf(new Date(), 'day'),
  scrollToTime: dayjs().startOf('day').add(8, 'hour').toDate(),
};
