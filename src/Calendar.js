import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import {
  accessor,
  dateFormat,
  dateRangeFormat,
  DayLayoutAlgorithmPropType,
  views as componentViews
} from './utils/propTypes';
import { notify } from './utils/helpers';
import message from './utils/messages';
import moveDate from './utils/move';
import { omit, defaults } from './utils/common';
import { wrapAccessor } from './utils/accessors';
import { mergeWithDefaults } from './utils/localizers/localizer';
import * as dates from './utils/dates';
import { navigate, CALENDAR_VIEWS, CALENDAR_HEADER_HEIGHT, CALENDAR_DIALOG_PADDINGTOP, VIEWS_SUPPORT_SCROLL_ON_MOBILE } from './constants';
import VIEWS from './components/grid-views';
import ExportedMonths from './components/grid-views/ExportedMonths';
import NoopWrapper from './components/wrapper/NoopWrapper';
import Toolbar from './components/toolbar/Toolbar';

function viewNames(_views) {
  return !Array.isArray(_views) ? Object.keys(_views) : _views;
}

function isValidView(view, { views: _views }) {
  let names = viewNames(_views);
  return names.indexOf(view) !== -1;
}

class Calendar extends React.Component {

  static propTypes = {
    localizer: PropTypes.object.isRequired,

    /**
     * Props passed to main calendar `<div>`.
     *
     */
    elementProps: PropTypes.object,

    /**
     * The current date value of the calendar. Determines the visible view range.
     * If `date` is omitted then the result of `getNow` is used; otherwise the
     * current date is used.
     *
     * @controllable onNavigate
     */
    defaultDate: PropTypes.instanceOf(Date),

    /**
     * The current view of the calendar.
     *
     * @default 'month'
     * @controllable onSelectView
     */
    view: PropTypes.string,

    /**
     * The initial view set for the Calendar.
     * @type Calendar.Views ('month'|'week'|'work_week'|'day'|'agenda')
     * @default 'month'
     */
    // defaultView: PropTypes.string,

    /**
     * An array of event objects to display on the calendar. Events objects
     * can be any shape, as long as the Calendar knows how to retrieve the
     * following details of the event:
     *
     *  - start time
     *  - end time
     *  - titleColumn
     *  - whether its an 'all day' event or not
     *  - any resource the event may be related to
     *
     * Each of these properties can be customized or generated dynamically by
     * setting the various 'accessor' props. Without any configuration the default
     * event should look like:
     *
     * ```js
     * Event {
     *   title: string,
     *   titleColumn: object,
     *   start: Date,
     *   end: Date,
     *   allDay?: boolean
     *   resource?: any,
     * }
     * ```
     */
    events: PropTypes.arrayOf(PropTypes.object),

    /**
     * Accessor for the event title, used to display event information. Should
     * resolve to a `renderable` value.
     *
     * ```js
     * string | (event: Object) => string
     * ```
     *
     * @type {(func|string)}
     */
    titleAccessor: accessor,

    /**
     * Accessor for the event tooltip. Should
     * resolve to a `renderable` value. Removes the tooltip if null.
     *
     * ```js
     * string | (event: Object) => string
     * ```
     *
     * @type {(func|string)}
     */
    tooltipAccessor: accessor,

    /**
     * Determines whether the event should be considered an 'all day' event and ignore time.
     * Must resolve to a `boolean` value.
     *
     * ```js
     * string | (event: Object) => boolean
     * ```
     *
     * @type {(func|string)}
     */
    allDayAccessor: accessor,

    /**
     * The start date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    startAccessor: accessor,

    /**
     * The end date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    endAccessor: accessor,

    /**
     * Returns the id of the `resource` that the event is a member of. This
     * id should match at least one resource in the `resources` array.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    resourceAccessor: accessor,

    /**
     * An array of resource objects that map events to a specific resource.
     * Resource objects, like events, can be any shape or have any properties,
     * but should be uniquly identifiable via the `resourceIdAccessor`, as
     * well as a 'title' or name as provided by the `resourceTitleAccessor` prop.
     */
    resources: PropTypes.arrayOf(PropTypes.object),

    /**
     * Provides a unique identifier for each resource in the `resources` array
     *
     * ```js
     * string | (resource: Object) => any
     * ```
     *
     * @type {(func|string)}
     */
    resourceIdAccessor: accessor,

    /**
     * Provides a human readable name for the resource object, used in headers.
     *
     * ```js
     * string | (resource: Object) => any
     * ```
     *
     * @type {(func|string)}
     */
    resourceTitleAccessor: accessor,

    /**
     * Determines the current date/time which is highlighted in the views.
     *
     * The value affects which day is shaded and which time is shown as
     * the current time. It also affects the date used by the Today button in
     * the toolbar.
     *
     * Providing a value here can be useful when you are implementing time zones
     * using the `startAccessor` and `endAccessor` properties.
     *
     * @type {func}
     * @default () => new Date()
     */
    getNow: PropTypes.func,

    /**
     * Callback fired when the `view` value changes.
     *
     * @controllable view
     */
    onSelectView: PropTypes.func,

    /**
     * Callback fired when date header, or the truncated events links are clicked
     *
     */
    onDrillDown: PropTypes.func,

    /**
     *
     * ```js
     * (dates: Date[] | { start: Date; end: Date }, view?: 'month'|'week'|'work_week'|'day'|'agenda') => void
     * ```
     *
     * Callback fired when the visible date range changes. Returns an Array of dates
     * or an object with start and end dates for BUILTIN views. Optionally new `view`
     * will be returned when callback called after view change.
     *
     * Custom views may return something different.
     */
    onRangeChange: PropTypes.func,

    /**
     * A callback fired when a date selection is made. Only fires when `selectable` is `true`.
     *
     * ```js
     * (
     *   slotInfo: {
     *     start: Date,
     *     end: Date,
     *     resourceId:  (number|string),
     *     slots: Array<Date>,
     *     action: 'select' | 'click' | 'doubleClick',
     *     bounds: ?{ // For 'select' action
     *       x: number,
     *       y: number,
     *       top: number,
     *       right: number,
     *       left: number,
     *       bottom: number,
     *     },
     *     box: ?{ // For 'click' or 'doubleClick' actions
     *       clientX: number,
     *       clientY: number,
     *       x: number,
     *       y: number,
     *     },
     *   }
     * ) => any
     * ```
     */
    onSelectSlot: PropTypes.func,

    /**
     * Callback fired when a calendar event is selected.
     *
     * ```js
     * (event: Object, e: SyntheticEvent) => any
     * ```
     *
     * @controllable selected
     */
    onSelectEvent: PropTypes.func,

    /**
     * Callback fired when a calendar event is clicked twice.
     *
     * ```js
     * (event: Object, e: SyntheticEvent) => void
     * ```
     */
    onDoubleClickEvent: PropTypes.func,

    /**
     * Callback fired when dragging a selection in the Time views.
     *
     * Returning `false` from the handler will prevent a selection.
     *
     * ```js
     * (range: { start: Date, end: Date, resourceId: (number|string) }) => ?boolean
     * ```
     */
    onSelecting: PropTypes.func,

    /**
     * The selected event, if any.
     */
    selected: PropTypes.object,

    /**
     * An array of built-in view names to allow the calendar to display.
     * accepts either an array of builtin view names,
     *
     * ```jsx
     * views={['month', 'day', 'agenda']}
     * ```
     * or an object hash of the view name and the component (or boolean for builtin).
     *
     * ```jsx
     * views={{
     *   month: true,
     *   week: false,
     *   myweek: WorkWeekViewComponent,
     * }}
     * ```
     *
     * Custom views can be any React component, that implements the following
     * interface:
     *
     * ```js
     * interface View {
     *   static title(date: Date, { formats: DateFormat[], culture: string?, ...props }): string
     *   static navigate(date: Date, action: 'PREV' | 'NEXT' | 'DATE'): Date
     * }
     * ```
     *
     * @type Views ('month'|'week'|'work_week'|'day'|'agenda')
     * @View
     ['month', 'week', 'day', 'agenda']
     */
    views: componentViews,

    /**
     * The string name of the destination view for drill-down actions, such
     * as clicking a date header, or the truncated events links. If
     * `getDrilldownView` is also specified it will be used instead.
     *
     * Set to `null` to disable drill-down actions.
     *
     * ```js
     * <Calendar
     *   drilldownView='agenda'
     * />
     * ```
     */
    drilldownView: PropTypes.string,

    /**
     * Functionally equivalent to `drilldownView`, but accepts a function
     * that can return a view name. It's useful for customizing the drill-down
     * actions depending on the target date and triggering view.
     *
     * Return `null` to disable drill-down actions.
     *
     * ```js
     * <Calendar
     *   getDrilldownView={(targetDate, currentViewName, configuredViewNames) =>
     *     if (currentViewName === 'month' && configuredViewNames.includes('week'))
     *       return 'week'
     *
     *     return null;
     *   }}
     * />
     * ```
     */
    getDrilldownView: PropTypes.func,

    /**
     * Determines the end date from date prop in the agenda view
     * date prop + length (in number of days) = end date
     */
    length: PropTypes.number,

    /**
     * Determines whether the toolbar is displayed
     */
    toolbar: PropTypes.bool,

    /**
     * Distance in pixels, from the edges of the viewport, the 'show more' overlay should be positioned.
     *
     * ```jsx
     * <Calendar popupOffset={30}/>
     * <Calendar popupOffset={{x: 30, y: 20}}/>
     * ```
     */
    popupOffset: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })
    ]),

    /**
     * Allows mouse selection of ranges of dates/times.
     *
     * The 'ignoreEvents' option prevents selection code from running when a
     * drag begins over an event. Useful when you want custom event click or drag
     * logic
     */
    selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),

    /**
     * Specifies the number of miliseconds the user must press and hold on the screen for a touch
     * to be considered a 'long press.' Long presses are used for time slot selection on touch
     * devices.
     *
     * @type {number}
     * @default 250
     */
    longPressThreshold: PropTypes.number,

    /**
     * Determines the selectable time increments in week and day views
     */
    step: PropTypes.number,

    /**
     * The number of slots per 'section' in the time grid views. Adjust with `step`
     * to change the default of 1 hour long groups, with 30 minute slots.
     */
    timeslots: PropTypes.number,

    /**
     *Switch the calendar to a `right-to-left` read direction.
     */
    rtl: PropTypes.bool,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the event node.
     *
     * ```js
     * (
     * 	event: Object,
     * 	start: Date,
     * 	end: Date,
     * 	isSelected: boolean
     * ) => { className?: string, style?: Object }
     * ```
     */
    eventPropGetter: PropTypes.func,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the time-slot node. Caution! Styles that change layout or
     * position may break the calendar in unexpected ways.
     *
     * ```js
     * (date: Date, resourceId: (number|string)) => { className?: string, style?: Object }
     * ```
     */
    slotPropGetter: PropTypes.func,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the day background. Caution! Styles that change layout or
     * position may break the calendar in unexpected ways.
     *
     * ```js
     * (date: Date) => { className?: string, style?: Object }
     * ```
     */
    dayPropGetter: PropTypes.func,

    /**
     * Support to show multi-day events with specific start and end times in the
     * main time grid (rather than in the all day header).
     *
     * **Note: This may cause calendars with several events to look very busy in
     * the week and day views.**
     */
    showMultiDayTimes: PropTypes.bool,

    /**
     * Constrains the minimum _time_ of the Day and Week views.
     */
    min: PropTypes.instanceOf(Date),

    /**
     * Constrains the maximum _time_ of the Day and Week views.
     */
    max: PropTypes.instanceOf(Date),

    /**
     * Determines how far down the scroll pane is initially scrolled down.
     */
    scrollToTime: PropTypes.instanceOf(Date),

    /**
     * Specify a specific culture code for the Calendar.
     *
     * **Note: it's generally better to handle this globally via your i18n library.**
     */
    culture: PropTypes.string,

    /**
     * Localizer specific formats, tell the Calendar how to format and display dates.
     *
     * `format` types are dependent on the configured localizer; both Moment and Globalize
     * accept strings of tokens according to their own specification, such as: `'DD mm yyyy'`.
     *
     * ```jsx
     * let formats = {
     *   dateFormat: 'dd',
     *
     *   dayFormat: (date, , localizer) =>
     *     localizer.format(date, 'DDD', culture),
     *
     *   dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
     *     localizer.format(start, { date: 'short' }, culture) + ' – ' +
     *     localizer.format(end, { date: 'short' }, culture)
     * }
     *
     * <Calendar formats={formats} />
     * ```
     *
     * All localizers accept a function of
     * the form `(date: Date, culture: ?string, localizer: Localizer) -> string`
     */
    formats: PropTypes.shape({
      /**
       * Format for the day of the month heading in the Month view.
       * e.g. '01', '02', '03', etc
       */
      dateFormat,

      /**
       * A day of the week format for Week and Day headings,
       * e.g. 'Wed 01/04'
       *
       */
      dayFormat: dateFormat,

      /**
       * Week day name format for the Month week day headings,
       * e.g: 'Sun', 'Mon', 'Tue', etc
       *
       */
      weekdayFormat: dateFormat,

      /**
       * The timestamp cell formats in Week and Time views, e.g. '4:00 AM'
       */
      timeGutterFormat: dateFormat,

      /**
       * Toolbar header format for the Month view, e.g '2015 April'
       *
       */
      monthHeaderFormat: dateFormat,

      /**
       * Toolbar header format for the Week views, e.g. 'Mar 29 - Apr 04'
       */
      dayRangeHeaderFormat: dateRangeFormat,

      /**
       * Toolbar header format for the Day view, e.g. 'Wednesday Apr 01'
       */
      dayHeaderFormat: dateFormat,

      /**
       * Toolbar header format for the Agenda view, e.g. '4/1/2015 – 5/1/2015'
       */
      agendaHeaderFormat: dateRangeFormat,

      /**
       * A time range format for selecting time slots, e.g '8:00am – 2:00pm'
       */
      selectRangeFormat: dateRangeFormat,

      agendaDateFormat: dateFormat,
      agendaTimeFormat: dateFormat,
      agendaTimeRangeFormat: dateRangeFormat,

      /**
       * Time range displayed on events.
       */
      eventTimeRangeFormat: dateRangeFormat,

      /**
       * An optional event time range for events that continue onto another day
       */
      eventTimeRangeStartFormat: dateFormat,

      /**
       * An optional event time range for events that continue from another day
       */
      eventTimeRangeEndFormat: dateFormat
    }),

    /**
     * Customize how different sections of the calendar render by providing custom Components.
     * In particular the `Event` component can be specified for the entire calendar, or you can
     * provide an individual component for each view type.
     *
     * ```jsx
     * let components = {
     *   event: MyEvent, // used by each view (Month, Day, Week)
     *   eventWrapper: MyEventWrapper,
     *   eventContainerWrapper: MyEventContainerWrapper,
     *   dateCellWrapper: MyDateCellWrapper,
     *   timeSlotWrapper: MyTimeSlotWrapper,
     *   timeGutterHeader: MyTimeGutterWrapper,
     *   toolbar: MyToolbar,
     *   agenda: {
     *   	 event: MyAgendaEvent // with the agenda view use a different component to render events
     *     time: MyAgendaTime,
     *     date: MyAgendaDate,
     *   },
     *   day: {
     *     header: MyDayHeader,
     *     event: MyDayEvent,
     *   },
     *   week: {
     *     header: MyWeekHeader,
     *     event: MyWeekEvent,
     *   },
     *   month: {
     *     header: MyMonthHeader,
     *     dateHeader: MyMonthDateHeader,
     *     event: MyMonthEvent,
     *   }
     * }
     * <Calendar components={components} />
     * ```
     */
    components: PropTypes.shape({
      event: PropTypes.elementType,
      eventWrapper: PropTypes.elementType,
      eventContainerWrapper: PropTypes.elementType,
      dateCellWrapper: PropTypes.elementType,
      timeSlotWrapper: PropTypes.elementType,
      timeGutterHeader: PropTypes.elementType,
      resourceHeader: PropTypes.elementType,

      toolbar: PropTypes.elementType,

      agenda: PropTypes.shape({
        date: PropTypes.elementType,
        time: PropTypes.elementType,
        event: PropTypes.elementType
      }),

      day: PropTypes.shape({
        header: PropTypes.elementType,
        event: PropTypes.elementType
      }),
      week: PropTypes.shape({
        header: PropTypes.elementType,
        event: PropTypes.elementType
      }),
      month: PropTypes.shape({
        header: PropTypes.elementType,
        dateHeader: PropTypes.elementType,
        event: PropTypes.elementType
      })
    }),

    /**
     * String messages used throughout the component, override to provide localizations
     */
    messages: PropTypes.shape({
      allDay: PropTypes.node,
      previous: PropTypes.node,
      next: PropTypes.node,
      today: PropTypes.node,
      month: PropTypes.node,
      week: PropTypes.node,
      day: PropTypes.node,
      agenda: PropTypes.node,
      date: PropTypes.node,
      time: PropTypes.node,
      event: PropTypes.node,
      noEventsInRange: PropTypes.node,
      showMore: PropTypes.func
    }),

    /**
     * A day event layout(arrangement) algorithm.
     * `overlap` allows events to be overlapped.
     * `no-overlap` resizes events to avoid overlap.
     * or custom `Function(events, minimumStartDifference, slotMetrics, accessors)`
     */
    dayLayoutAlgorithm: DayLayoutAlgorithmPropType,
    style: PropTypes.object,
    className: PropTypes.string,
    columns: PropTypes.array,
    startDateColumn: PropTypes.object,
    isMobile: PropTypes.bool,
    onRowExpand: PropTypes.func,
    onInsertRow: PropTypes.func,
    onDoubleClick: PropTypes.func,
    renderFestival: PropTypes.func,
    onShowMore: PropTypes.func,
    hideViewSettingPanel: PropTypes.bool,
    onEventDragDrop: PropTypes.func,
    onEventDragResize: PropTypes.func,
    onEventResize: PropTypes.func,
    onResizeDrop: PropTypes.func,
    isExporting: PropTypes.bool,
  };

  static defaultProps = {
    elementProps: {},
    toolbar: true,
    view: CALENDAR_VIEWS.MONTH,
    views: [CALENDAR_VIEWS.MONTH],
    step: 30,
    length: 30,
    drilldownView: CALENDAR_VIEWS.DAY,
    titleAccessor: 'title',
    tooltipAccessor: 'title',
    allDayAccessor: 'allDay',
    startAccessor: 'start',
    endAccessor: 'end',
    resourceAccessor: 'resourceId',

    resourceIdAccessor: 'id',
    resourceTitleAccessor: 'title',

    longPressThreshold: 250,
    getNow: () => new Date(),
    dayLayoutAlgorithm: 'overlap'
  };

  constructor(...args) {
    super(...args);
    this.state = {
      date: this.props.defaultDate || '',
      changeDateByNavicate: false,
    };
    this.view2ComponentMap = this.getView2ComponentMap();
  }

  getContext({
    startAccessor,
    endAccessor,
    allDayAccessor,
    tooltipAccessor,
    titleAccessor,
    resourceAccessor,
    resourceIdAccessor,
    resourceTitleAccessor,
    eventPropGetter,
    slotPropGetter,
    dayPropGetter,
    view,
    views,
    localizer,
    culture,
    messages = {},
    components = {},
    formats = {}
  }) {
    let names = viewNames(views);
    const msgs = message(messages);

    components[CALENDAR_VIEWS.WEEK] = {
      timeGutterHeader: (props) => {
        const { localizer, range } = props;
        return (
          <div className={'rbc-week-of-year'}>
            {localizer.format(range[1], 'weekOfYearFormat')}
          </div>
        );
      }
    };

    const context = {
      viewNames: names,
      localizer: mergeWithDefaults(localizer, culture, formats, msgs),
      getters: {
        eventProp: (...args) =>
          (eventPropGetter && eventPropGetter(...args)) || {},
        slotProp: (...args) =>
          (slotPropGetter && slotPropGetter(...args)) || {},
        dayProp: (...args) => (dayPropGetter && dayPropGetter(...args)) || {}
      },
      components: defaults(components[view] || {}, omit(components, names), {
        eventWrapper: NoopWrapper,
        eventContainerWrapper: NoopWrapper,
        dateCellWrapper: NoopWrapper,
        weekWrapper: NoopWrapper,
        timeSlotWrapper: NoopWrapper
      }),
      accessors: {
        start: wrapAccessor(startAccessor),
        end: wrapAccessor(endAccessor),
        allDay: wrapAccessor(allDayAccessor),
        tooltip: wrapAccessor(tooltipAccessor),
        title: wrapAccessor(titleAccessor),
        resource: wrapAccessor(resourceAccessor),
        resourceId: wrapAccessor(resourceIdAccessor),
        resourceTitle: wrapAccessor(resourceTitleAccessor)
      }
    };

    return context; 
  }

  getView2ComponentMap = () => {
    const views = this.props.views;
    let view2ComponentMap = {};
    Array.isArray(views) && views.forEach((v) => {
      view2ComponentMap[v] = VIEWS[v];
    });
    return view2ComponentMap;
  };

  getCurrentView = () => {
    return this.view2ComponentMap[this.props.view];
  };

  getDrilldownView = date => {
    const { view, drilldownView, getDrilldownView } = this.props;
    if (!getDrilldownView) return drilldownView;
    return getDrilldownView(date, view, Object.keys(this.view2ComponentMap));
  };

  /**
   *
   * @param date
   * @param viewComponent
   * @param {'month'|'week'|'work_week'|'day'|'agenda'} [view] - optional
   * parameter. It appears when range change on view changing. It could be handy
   * when you need to have both: range and view type at once, i.e. for manage rbc
   * state via url
   */
  handleRangeChange = (date, viewComponent, view) => {
    let { onRangeChange, localizer } = this.props;

    if (onRangeChange) {
      if (viewComponent.range) {
        onRangeChange(viewComponent.range(date, { localizer }), view);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line
          console.error('onRangeChange prop not supported for this view');
        }
      }
    }
  };

  handleNavigate = (action, newDate) => {
    let { view, getNow, isMobile, ...props } = this.props;
    let { date } = this.state;
    let ViewComponent = this.getCurrentView();
    let today = getNow();
    let updatedDate = moveDate(ViewComponent, {
      ...props,
      action,
      date: newDate || date || today,
      today
    });

    if (isMobile) {
      const isValidDate = this.checkCurrentDate(updatedDate);
      if (!isValidDate) {
        this.scrollToBoundary(action);
        return;
      }
    }
    this.handleRangeChange(updatedDate, ViewComponent);
    this.setState({ date: updatedDate, changeDateByNavicate: true });
  };

  checkCurrentDate = date => {
    if (VIEWS_SUPPORT_SCROLL_ON_MOBILE.includes(this.props.view)) {
      return this.currentView && this.currentView.isDateBetweenDateRange(date);
    }
    return true;
  };

  scrollToBoundary = (action) => {
    if (VIEWS_SUPPORT_SCROLL_ON_MOBILE.includes(this.props.view)) {
      if (!this.currentView) return;
      if (action === navigate.NEXT) {
        this.currentView.scrollToBottom();
      } else if (action === navigate.PREVIOUS) {
        this.currentView.scrollToTop();
      }
    }
  };

  onSelectView = view => {
    if (view !== this.props.view && isValidView(view, this.props)) {
      this.props.onSelectView(view);
    }

    this.handleRangeChange(
      this.state.date || this.props.getNow(),
      this.view2ComponentMap[view],
      view
    );
  };

  handleDoubleClickEvent = (...args) => {
    notify(this.props.onDoubleClickEvent, args);
  };

  handleSelectSlot = slotInfo => {
    notify(this.props.onSelectSlot, slotInfo);
  };

  handleDrillDown = (date, view) => {
    const { onDrillDown } = this.props;
    if (onDrillDown) {
      onDrillDown(date, view, this.drilldownView);
      return;
    }
    if (view) this.onSelectView(view);

    this.handleNavigate(navigate.DATE, date);
  };

  onInsertRow = (date) => {
    const { startDateColumn, onInsertRow } = this.props;
    const { name } = startDateColumn;
    onInsertRow({ [name]: date });
  };

  updateCurrentDate = (date) => {
    this.setState({ date, changeDateByNavicate: false });
  };

  render() {
    let {
      view,
      toolbar,
      events,
      style,
      className,
      elementProps,
      getNow,
      length,
      showMultiDayTimes,
      components: _0,
      formats: _1,
      messages: _2,
      culture: _3,
      startDateColumn,
      ...props
    } = this.props;
    let { date } = this.state;
    const current = date || getNow();
    const isToday = dates.isToday(current, view);
    const View = this.getCurrentView();
    const { accessors, components, getters, localizer, viewNames } = this.getContext(this.props);
    const CalToolbar = components.toolbar || Toolbar;
    const label = View.title(current, { localizer, length });
    return (
      <div
        {...elementProps}
        className={classnames(className, 'rbc-calendar', { 'rbc-rtl': props.rtl })}
        style={style}
        onClick={this.props.hideViewSettingPanel}
      >
        {toolbar && (
          <CalToolbar
            date={current}
            activeView={view}
            views={viewNames}
            label={label}
            startDateColumn={startDateColumn}
            onSelectView={this.onSelectView}
            onNavigate={this.handleNavigate}
            localizer={localizer}
            isToday={isToday}
            isMobile={this.props.isMobile}
          />
        )}
        {startDateColumn ? (
          <React.Fragment>
            <View
              {...props}
              ref={ref => this.currentView = ref}
              events={events}
              date={current}
              getNow={getNow}
              length={length}
              localizer={localizer}
              getters={getters}
              components={components}
              accessors={accessors}
              showMultiDayTimes={showMultiDayTimes}
              getDrilldownView={this.getDrilldownView}
              onNavigate={this.handleNavigate}
              onDrillDown={this.handleDrillDown}
              onRowExpand={this.props.onRowExpand}
              onDoubleClickEvent={this.handleDoubleClickEvent}
              onSelectSlot={this.handleSelectSlot}
              containerPaddingTop={CALENDAR_DIALOG_PADDINGTOP}
              calendarHeaderHeight={CALENDAR_HEADER_HEIGHT}
              onInsertRow={this.onInsertRow}
              updateCurrentDate={this.updateCurrentDate}
              changeDateByNavicate={this.state.changeDateByNavicate}
              isMobile={this.props.isMobile}
              onEventDragDrop={this.props.onEventDragDrop}
              onEventDragResize={this.props.onEventDragResize}
              onResizeDrop={this.props.onResizeDrop}
              onSelectEvent={this.props.onSelectEvent}
            />
            {this.props.isExporting && (
              <ExportedMonths
                {...props}
                events={events}
                date={current}
                getNow={getNow}
                length={length}
                localizer={localizer}
                getters={getters}
                components={components}
                accessors={accessors}
                showMultiDayTimes={showMultiDayTimes}
                getDrilldownView={this.getDrilldownView}
                onNavigate={this.handleNavigate}
                onDrillDown={this.handleDrillDown}
                onRowExpand={this.props.onRowExpand}
                onDoubleClickEvent={this.handleDoubleClickEvent}
                onSelectSlot={this.handleSelectSlot}
                containerPaddingTop={CALENDAR_DIALOG_PADDINGTOP}
                calendarHeaderHeight={CALENDAR_HEADER_HEIGHT}
                onInsertRow={this.onInsertRow}
                updateCurrentDate={this.updateCurrentDate}
                changeDateByNavicate={this.state.changeDateByNavicate}
                isMobile={this.props.isMobile}
              />
            )}
          </React.Fragment>
        ) :
          <div className="empty-date-tips">{intl.get('No_date_field_to_place_records_on_the_calendar')}</div>
        }
      </div>
    );
  }
}

export default Calendar;
