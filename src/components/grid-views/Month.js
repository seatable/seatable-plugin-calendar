import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import getPosition from 'dom-helpers/position';
import * as animationFrame from 'dom-helpers/animationFrame';
import { chunk, getDtableLang, getDtablePermission } from '../../utils/common';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import { inRange, sortEvents } from '../../utils/eventLevels';
import { getFestival } from '../../utils/festival';
import { navigate } from '../../constants';
import Popup from '../popup/Popup';
import DateContentRow from '../rows/DateContentRow';
import Header from '../header/Header';
import DateHeader from '../header/DateHeader';

let eventsForWeek = (evts, start, end, accessors) =>
  evts.filter(e => inRange(e, start, end, accessors));

class MonthView extends React.Component {
  constructor(...args) {
    super(...args);
    this._bgRows = [];
    this._pendingSelection = [];
    this.slotRowRef = React.createRef();
    this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
      popup: false,
      hoverDate: null,
      hoverDateCellPosition: {}
    };
    this.rbcDateCells = {};
    this.lang = getDtableLang();
    this.isChinese = this.lang && this.lang.toLowerCase() === 'zh-cn';
    this.isTableReadOnly = getDtablePermission() === 'r';
  }

  componentWillReceiveProps({ date }) {
    this.setState({
      needLimitMeasure: !dates.eq(date, this.props.date, 'month')
    });
  }

  componentDidMount() {
    let running;

    if (this.state.needLimitMeasure) this.measureRowLimit(this.props);

    window.addEventListener(
      'resize',
      (this._resizeListener = () => {
        if (!running) {
          animationFrame.request(() => {
            running = false;
            this.setState({ needLimitMeasure: true }); //eslint-disable-line
          });
        }
      }),
      false
    );
  }

  componentDidUpdate() {
    if (this.state.needLimitMeasure) this.measureRowLimit(this.props);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false);
  }

  getContainer = () => {
    return findDOMNode(this);
  };

  onMonthViewScroll = (event) => {
    const { scrollLeft, scrollTop } = event.target;
    this._scroll = { scrollLeft, scrollTop };
  }

  handleShowMore = (events, date, cell, slot, target) => {
    //cancel any pending selections so only the event click goes through.
    const { containerPaddingTop, calendarHeaderHeight, popup } = this.props;
    if (!popup) {
      this.clearSelection();
      let position = getPosition(cell, findDOMNode(this));
      let { top } = position;
      top = top + containerPaddingTop + calendarHeaderHeight;
      position.top = top;
      this.setState({
        overlay: { date, events, position, target },
        popup: true
      });
    }
  };

  onRowExpand = (row) => {
    this.props.onRowExpand(row);
  };

  onHidePopup = () => {
    this.setState({popup: false, overlay: {}});
  }

  onInsertRow = (date) => {
    this.props.onInsertRow(dates.getFormattedDate(date, 'YYYY-MM-DD'));
  }

  render() {
    let { date, localizer, className } = this.props,
      month = dates.visibleDays(date, localizer),
      weeks = chunk(month, 7);
    this._weekCount = weeks.length;

    return (
      <div className={classnames('rbc-month-view', className)} onScroll={this.onMonthViewScroll}>
        <div className='rbc-month-header'>
          {this.renderHeaders(weeks[0])}
        </div>
        {weeks.map(this.renderWeek)}
        {this.state.popup && this.renderOverlay()}
      </div>
    );
  }

  renderWeek = (week, weekIdx) => {
    let {
      events,
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters
    } = this.props;

    const { needLimitMeasure, rowLimit } = this.state;

    events = eventsForWeek(events, week[0], week[week.length - 1], accessors);
    events = events.sort((a, b) => sortEvents(a, b, accessors));
    events = events.slice();
    return (
      <DateContentRow
        key={weekIdx}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
        container={this.getContainer}
        className='rbc-month-row'
        getNow={getNow}
        date={date}
        range={week}
        events={events}
        maxRows={rowLimit}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onRowExpand={this.onRowExpand}
        onDoubleClick={this.handleDoubleClickEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
      />
    );
  };

  readerDateHeading = ({ date, className, ...props }) => {
    let { date: currentDate, getDrilldownView, localizer } = this.props;
    let isOffRange = dates.month(date) !== dates.month(currentDate);
    let isCurrent = dates.eq(date, currentDate, 'day');
    let drilldownView = getDrilldownView(date);
    let label = localizer.format(date, 'dateFormat');
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader;
    return (
      <div
        {...props}
        className={classnames(
          className,
          {
            'rbc-off-range': isOffRange,
            'rbc-current': isCurrent
          }
        )}
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={e => this.handleHeadingClick(date, drilldownView, e)}
        />
        {this.isChinese && this.renderFestival(date)}
        {!this.isTableReadOnly && <div className="calendar-insert-row-btn" onClick={this.onInsertRow.bind(this, date)}><i className="dtable-font dtable-icon-add-table"></i></div>}
      </div>
    );
  };

  renderFestival(date) {
    let festival = getFestival(date);
    if (festival) {
      return <div className="rbc-festival">
        <span className="rbc-festival-context" title={festival}>{festival}</span>
      </div>;
    }
    return null;
  }

  renderHeaders(row) {
    let { localizer, components } = this.props;
    let first = row[0];
    let last = row[row.length - 1];
    let HeaderComponent = components.header || Header;

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className='rbc-header'>
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, 'weekdayFormat')}
          isShowWeek={true}
        />
      </div>
    ));
  }

  renderOverlay() {
    let overlay = (this.state && this.state.overlay) || {};
    let {
      accessors,
      localizer,
      components,
      getters,
      selected,
      popupOffset
    } = this.props;

    return (
      <Popup
        {...this.props}
        scrolled={this._scroll || null}
        popupOffset={popupOffset}
        accessors={accessors}
        getters={getters}
        selected={selected}
        components={components}
        localizer={localizer}
        position={overlay.position}
        events={overlay.events}
        slotStart={overlay.date}
        slotEnd={overlay.end}
        onSelect={this.onRowExpand}
        onDoubleClick={this.handleDoubleClickEvent}
        onHidePopup={this.onHidePopup}
      />
    );
  }

  measureRowLimit() {
    this.setState({
      needLimitMeasure: false,
      rowLimit: this.slotRowRef.current.getRowLimit()
    });
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range);

    clearTimeout(this._selectTimer);
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo));
  };

  handleHeadingClick = (date, view, e) => {
    e.preventDefault();
    this.clearSelection();
    notify(this.props.onDrillDown, [date, view]);
  };

  handleDoubleClickEvent = (...args) => {
    this.clearSelection();
    notify(this.props.onDoubleClickEvent, args);
  };

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice();

    this._pendingSelection = [];

    slots.sort((a, b) => +a - +b);

    notify(this.props.onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1],
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box
    });
  }

  clearSelection() {
    clearTimeout(this._selectTimer);
    this._pendingSelection = [];
  }
}

MonthView.propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),
  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),
  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,
  scrollToTime: PropTypes.instanceOf(Date),
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
  onRowExpand: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  popup: PropTypes.bool,
  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    })
  ]),
  className: PropTypes.object,
  containerPaddingTop: PropTypes.number,
  calendarHeaderHeight: PropTypes.number,
  onHidePopup: PropTypes.func,
  onInsertRow: PropTypes.func,
};

MonthView.range = (date, { localizer }) => {
  let start = dates.firstVisibleDay(date, localizer);
  let end = dates.lastVisibleDay(date, localizer);
  return { start, end };
};

MonthView.navigate = (date, action) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -1, 'month');

    case navigate.NEXT:
      return dates.add(date, 1, 'month');

    default:
      return date;
  }
};

MonthView.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat');

export default MonthView;