import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as dates from '../../../utils/dates';
import Popup from '../../popup/Popup';

class YearDay extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowEvents: false,
    };
    this.position = {};
  }

  componentDidMount() {
    let { offsetParent: rbcYearMonth, offsetLeft: rbcYearMonthLeft } = this.rbcYearDayItem;
    let { offsetTop: rbcYearTop, offsetParent: rbcYear } = rbcYearMonth;
    let { offsetTop, offsetLeft } = rbcYear;

    this.position = {left: offsetLeft + rbcYearMonthLeft + 34, top: offsetTop + rbcYearTop};
  }

  onEventsToggle = () => {
    this.setState({isShowEvents: !this.state.isShowEvents});
  }

  hideDayEvents = () => {
    this.setState({isShowEvents: false});
  }

  render() {
    let { day, monthDate, localizer, accessors, selected, getters, components, popupOffset, onRowExpand, dayEvents } = this.props;
    let { isShowEvents } = this.state;
    let isOffRange = dates.month(day) !== dates.month(monthDate);
    let isCurrentDay = dates.eq(day, new Date(), 'day');
    let label = localizer.format(day, 'dateFormat');

    return (
      <div className="rbc-year-day-item" ref={ref => this.rbcYearDayItem = ref}>
        <div className="rbc-year-day-content" onClick={this.onEventsToggle}>
          <div className={classnames('rbc-year-day', {'rbc-off-range': isOffRange, 'rbc-current': isCurrentDay})} >{Number(label)}</div>
        </div>
        {dayEvents.length > 0 && <span className="day-events"></span>}
        {isShowEvents &&
        <Popup
          {...this.props}
          popupOffset={popupOffset}
          accessors={accessors}
          getters={getters}
          selected={selected}
          components={components}
          localizer={localizer}
          position={this.position}
          events={dayEvents}
          slotStart={day}
          onSelect={onRowExpand}
          onHidePopup={this.hideDayEvents}
        />}
      </div>
    );
  }
}

YearDay.propTypes = {
  day: PropTypes.instanceOf(Date),
  dayEvents: PropTypes.array,
  monthDate: PropTypes.instanceOf(Date),
  localizer: PropTypes.object,
  rbcYearViewScroll: PropTypes.object,
  accessors: PropTypes.object,
  getters: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onDoubleClickEvent: PropTypes.func,
  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })
  ]),
  components: PropTypes.object,
  onRowExpand: PropTypes.func,
};

export default YearDay;
