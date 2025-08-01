import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import TimeSlotGroup from './TimeSlotGroup';
import TimeGridEvent from './TimeGridEvent';
import Selection, { getBoundsForNode, isEvent } from '../selection/Selection';
import * as dates from '../../utils/dates';
import * as TimeSlotUtils from '../../utils/TimeSlots';
import { isSelected } from '../../utils/selection';
import { notify } from '../../utils/helpers';
import * as DayEventLayout from '../../utils/DayEventLayout';
import { DayLayoutAlgorithmPropType } from '../../utils/propTypes';
import intl from 'react-intl-universal';
import { debounce } from 'lodash-es';
import { isMobile } from '../../utils/common';
import dayjs from 'dayjs';

const SLOT_HEIGHT = 20;

class DayColumn extends React.Component {
  state = {
    selecting: false,
  };

  static defaultProps = {
    dragThroughEvents: true,
    timeslots: 2
  };

  constructor(...args) {
    super(...args);

    this.slotMetrics = TimeSlotUtils.getSlotMetrics(this.props);
    this.timeRange = this.slotMetrics.groups.reduce((arr, group) => {
      arr.push(...group);
      return arr;
    }, []);
    this.dayColumnRef = React.createRef();
    this.containerRef = React.createRef();
    this.currentActiveTime = null;
    this.currentActiveEndTime = null;
  }

  componentDidMount() {
    this.props.selectable && this._selectable();
    this.timeRange = this.slotMetrics.groups.reduce((arr, group) => {
      arr.push(...group);
      return arr;
    }, []);
  }

  componentWillUnmount() {
    this._teardownSelectable();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.selectable && !this.props.selectable) this._selectable();
    if (!nextProps.selectable && this.props.selectable)
      this._teardownSelectable();

    this.slotMetrics = this.slotMetrics.update(nextProps);
  }

  onMouseMove = e => {
    const mouseY = e.clientY;
    const dayColumnTop = this.dayColumnRef.current.getBoundingClientRect().top;
    const slot = Math.floor(((mouseY - dayColumnTop) / SLOT_HEIGHT));
    if (slot < 0 || slot >= this.timeRange.length) return;
    this.currentActiveTime = this.timeRange[slot];
    this.currentActiveEndTime = dates.add(this.currentActiveTime, 30, 'minutes');
    if (this.currentActiveTime.getDate() !== this.currentActiveEndTime.getDate()) {
      this.currentActiveEndTime.setMilliseconds(-1);
    }
  };

  onMouseLeave = () => {
    this.currentActiveTime = null;
    this.currentActiveEndTime = null;
  };

  formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
  };

  onDoubleClick = () => {
    if (!this.currentActiveTime || !this.currentActiveEndTime) return;
    this.props.onInsertRow(this.formatDate(this.currentActiveTime), this.formatDate(this.currentActiveEndTime));
  };

  render() {
    const {
      max,
      rtl,
      isNow,
      resource,
      localizer,
      getters: { dayProp, ...getters },
      components: { eventContainerWrapper: EventContainer, ...components },
      canAddRecord,
    } = this.props;

    let { slotMetrics } = this;
    let { selecting, top, height, startDate, endDate } = this.state;
    let selectDates = { start: startDate, end: endDate };
    const { className, style } = dayProp(max);
    const insertRecordProps = canAddRecord && !isMobile ? {
      onMouseMove: debounce(this.onMouseMove, 100, { trailing: true }),
      onMouseLeave: this.onMouseLeave,
      onDoubleClick: this.onDoubleClick
    } : {};

    return (
      <div
        style={style}
        ref={this.containerRef}
        className={classnames(
          className,
          'rbc-day-slot',
          'rbc-time-column',
          {
            'rbc-now': isNow,
            'rbc-today': isNow,
            'rbc-slot-selecting': selecting
          }
        )}
      >
        {slotMetrics.groups.map((grp, idx) => (
          <TimeSlotGroup
            key={idx}
            group={grp}
            resource={resource}
            getters={getters}
            components={components}
          />
        ))}
        <div
          ref={this.dayColumnRef}
          className={classnames('rbc-events-container', { 'rtl': rtl })}
          {...insertRecordProps}
        >
          <div className='rbc-events-content'>
            {this.renderEvents()}
          </div>
        </div>
        {selecting && (
          <div className='rbc-slot-selection' style={{ top, height }}>
            <span>{localizer.format(selectDates, 'selectRangeFormat')}</span>
          </div>
        )}
      </div>
    );
  }

  renderEvents = () => {
    let {
      events,
      rtl,
      selected,
      accessors,
      localizer,
      getters,
      components,
      step,
      timeslots,
      dayLayoutAlgorithm
    } = this.props;

    const { slotMetrics } = this;
    const { messages } = localizer;

    let styledEvents = DayEventLayout.getStyledEvents({
      events,
      accessors,
      slotMetrics,
      minimumStartDifference: Math.ceil((step * timeslots) / 2),
      dayLayoutAlgorithm
    });

    return styledEvents.map(({ event, style }, idx) => {
      let end = accessors.end(event);
      let start = accessors.start(event);
      let format = 'eventTimeRangeFormat';
      let label;

      const startsBeforeDay = slotMetrics.startsBeforeDay(start);
      const startsAfterDay = slotMetrics.startsAfterDay(end);

      const dateOfSecondDayStart = new Date(start).setHours(24, 0, 0, 0);
      const dateOfEnd = new Date(end).setHours(0, 0, 0, 0);

      const continueToAnotherDayEnd = dateOfEnd > dateOfSecondDayStart;

      if (startsBeforeDay) format = 'eventTimeRangeEndFormat';
      else if (startsAfterDay || continueToAnotherDayEnd) format = 'eventTimeRangeStartFormat';

      if (startsBeforeDay && startsAfterDay) label = intl.get('.rbc.messages.allDay').d(messages.allDay);
      else label = localizer.format({ start, end }, format);

      let continuesEarlier = startsBeforeDay || slotMetrics.startsBefore(start);
      let continuesLater = startsAfterDay || slotMetrics.startsAfter(end);

      return (
        <TimeGridEvent
          style={style}
          event={event}
          label={label}
          key={'evt_' + idx}
          getters={getters}
          rtl={rtl}
          components={components}
          continuesEarlier={continuesEarlier}
          continuesLater={continuesLater}
          accessors={accessors}
          selected={isSelected(event, selected)}
          onClick={e => this._select(event, e)}
          onDoubleClick={e => this._doubleClick(event, e)}
        />
      );
    });
  };

  _selectable = () => {
    const node = this.containerRef.current;
    let selector = (this._selector = new Selection(() => node, {
      longPressThreshold: this.props.longPressThreshold
    }));

    let maybeSelect = box => {
      let onSelecting = this.props.onSelecting;
      let current = this.state || {};
      let state = selectionState(box);
      let { startDate: start, endDate: end } = state;

      if (onSelecting) {
        if (
          (dates.eq(current.startDate, start, 'minutes') &&
            dates.eq(current.endDate, end, 'minutes')) ||
          onSelecting({ start, end, resourceId: this.props.resource }) === false
        )
          return;
      }

      if (
        this.state.start !== state.start ||
        this.state.end !== state.end ||
        this.state.selecting !== state.selecting
      ) {
        this.setState(state);
      }
    };

    let selectionState = point => {
      let currentSlot = this.slotMetrics.closestSlotFromPoint(
        point,
        getBoundsForNode(node)
      );

      if (!this.state.selecting) {
        this._initialSlot = currentSlot;
      }

      let initialSlot = this._initialSlot;
      if (dates.lte(initialSlot, currentSlot)) {
        currentSlot = this.slotMetrics.nextSlot(currentSlot);
      } else if (dates.gt(initialSlot, currentSlot)) {
        initialSlot = this.slotMetrics.nextSlot(initialSlot);
      }

      const selectRange = this.slotMetrics.getRange(
        dates.min(initialSlot, currentSlot),
        dates.max(initialSlot, currentSlot)
      );

      return {
        ...selectRange,
        selecting: true,

        top: `${selectRange.top}%`,
        height: `${selectRange.height}%`
      };
    };

    let selectorClicksHandler = (box, actionType) => {
      if (!isEvent(node, box)) {
        const { startDate, endDate } = selectionState(box);
        this._selectSlot({
          startDate,
          endDate,
          action: actionType,
          box
        });
      }
      this.setState({ selecting: false });
    };

    selector.on('selecting', maybeSelect);
    selector.on('selectStart', maybeSelect);

    selector.on('beforeSelect', box => {
      if (this.props.selectable !== 'ignoreEvents') return;

      return !isEvent(node, box);
    });

    selector.on('click', box => selectorClicksHandler(box, 'click'));

    selector.on('doubleClick', box =>
      selectorClicksHandler(box, 'doubleClick')
    );

    selector.on('select', bounds => {
      if (this.state.selecting) {
        this._selectSlot({ ...this.state, action: 'select', bounds });
        this.setState({ selecting: false });
      }
    });

    selector.on('reset', () => {
      if (this.state.selecting) {
        this.setState({ selecting: false });
      }
    });
  };

  _teardownSelectable = () => {
    if (!this._selector) return;
    this._selector.teardown();
    this._selector = null;
  };

  _selectSlot = ({ startDate, endDate, action, bounds, box }) => {
    let current = startDate;
    let slots = [];

    while (dates.lte(current, endDate)) {
      slots.push(current);
      current = dates.add(current, this.props.step, 'minutes');
    }

    notify(this.props.onSelectSlot, {
      slots,
      start: startDate,
      end: endDate,
      resourceId: this.props.resource,
      action,
      bounds,
      box
    });
  };

  _select = (...args) => {
    notify(this.props.onSelectEvent, args);
  };

  _doubleClick = (...args) => {
    notify(this.props.onDoubleClickEvent, args);
  };
}

DayColumn.propTypes = {
  events: PropTypes.array.isRequired,
  step: PropTypes.number.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  min: PropTypes.instanceOf(Date).isRequired,
  max: PropTypes.instanceOf(Date).isRequired,
  getNow: PropTypes.func.isRequired,
  isNow: PropTypes.bool,
  rtl: PropTypes.bool,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  showMultiDayTimes: PropTypes.bool,
  culture: PropTypes.string,
  timeslots: PropTypes.number,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  eventOffset: PropTypes.number,
  longPressThreshold: PropTypes.number,
  onSelecting: PropTypes.func,
  onSelectSlot: PropTypes.func.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  onDoubleClickEvent: PropTypes.func.isRequired,
  className: PropTypes.string,
  dragThroughEvents: PropTypes.bool,
  resource: PropTypes.any,
  dayLayoutAlgorithm: DayLayoutAlgorithmPropType
};

export default DayColumn;
