import React from 'react';
import PropTypes from 'prop-types';
import CellTitle from '../cells/cell-title';
import addClass from 'dom-helpers/addClass';
import removeClass from 'dom-helpers/removeClass';
import getWidth from 'dom-helpers/width';
import scrollbarSize from 'dom-helpers/scrollbarSize';
import * as dates from '../../utils/dates';
import { inRange } from '../../utils/eventLevels';
import { isSelected } from '../../utils/selection';
import { navigate } from '../../constants';
import intl from 'react-intl-universal';

class Agenda extends React.Component {

  constructor(props) {
    super(props);
    this.headerRef = React.createRef();
    this.dateColRef = React.createRef();
    this.timeColRef = React.createRef();
    this.contentRef = React.createRef();
    this.tbodyRef = React.createRef();
  }

  componentDidMount() {
    this._adjustHeader();
  }

  componentDidUpdate() {
    this._adjustHeader();
  }

  render() {
    let { length, date, events, accessors, localizer, isMobile } = this.props;
    let { messages } = localizer;
    let end = dates.add(date, length, 'day');
    let range = dates.range(date, end, 'day');

    events = events.filter(event => inRange(event, date, end, accessors));
    events.sort((a, b) => +accessors.start(a) - +accessors.start(b));

    const desktopView = (
      <React.Fragment>
        <table ref={this.headerRef} className='rbc-agenda-table'>
          <thead>
            <tr>
              <th className='rbc-header' ref={this.dateColRef}>
                {intl.get('.rbc.messages.date').d(messages.date)}
              </th>
              <th className='rbc-header' ref={this.timeColRef}>
                {intl.get('.rbc.messages.time').d(messages.time)}
              </th>
              <th className='rbc-header'>{intl.get('.rbc.messages.event').d(messages.event)}</th>
            </tr>
          </thead>
        </table>
        <div className='rbc-agenda-content' ref={this.contentRef}>
          <table className='rbc-agenda-table'>
            <tbody ref={this.tbodyRef}>
              {range.map((day, idx) => this.renderDay(day, events, idx))}
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );

    const mobileView = (
      <React.Fragment>
        {range.map((day, idx) => this.renderDayForMobile(day, events, idx))}
      </React.Fragment>
    );

    const renderedView = isMobile ? mobileView : desktopView;

    return (
      <div className='rbc-agenda-view'>
        {events.length !== 0 ? renderedView : (
          <span className='rbc-agenda-empty'>{intl.get('.rbc.messages.noEventsInRange').d(messages.noEventsInRange)}</span>
        )}
      </div>
    );
  }

  renderDay = (day, events, dayKey) => {
    let {
      selected,
      getters,
      accessors,
      localizer,
      components: { event: Event, date: AgendaDate }
    } = this.props;

    events = events.filter(e =>
      inRange(e, dates.startOf(day, 'day'), dates.endOf(day, 'day'), accessors)
    );

    return events.map((event, idx) => {
      let title = <CellTitle event={event} />;
      let end = accessors.end(event);
      let start = accessors.start(event);

      const userProps = getters.eventProp(
        event,
        start,
        end,
        isSelected(event, selected)
      );

      let dateLabel = idx === 0 && localizer.format(day, 'agendaDateFormat');
      let first =
        idx === 0 ? (
          <td rowSpan={events.length} className='rbc-agenda-date-cell'>
            {AgendaDate ? (
              <AgendaDate day={day} label={dateLabel} />
            ) : (
              dateLabel
            )}
          </td>
        ) : false;

      return (
        <tr
          key={dayKey + '_' + idx}
          className={userProps.className}
          style={userProps.style}
        >
          {first}
          <td className='rbc-agenda-time-cell'>
            {this.timeRangeLabel(day, event)}
          </td>
          <td className='rbc-agenda-event-cell'>
            {Event ? <Event event={event} title={title} /> : title}
          </td>
        </tr>
      );
    }, []);
  };

  renderDayForMobile = (day, events, dayKey) => {
    let {
      selected,
      getters,
      accessors,
      localizer,
      components: { event: Event, date: AgendaDate }
    } = this.props;

    const dayEvents = events.filter(e =>
      inRange(e, dates.startOf(day, 'day'), dates.endOf(day, 'day'), accessors)
    );

    if (!dayEvents.length) {
      return null;
    }

    let dateLabel = localizer.format(day, 'agendaDateFormat');
    let eventsDate =  AgendaDate ? (
      <AgendaDate day={day} label={dateLabel} />
    ) : dateLabel;


    let eventItems = dayEvents.map((event, idx) => {
      let title = <CellTitle event={event} />;
      let end = accessors.end(event);
      let start = accessors.start(event);

      const userProps = getters.eventProp(
        event,
        start,
        end,
        isSelected(event, selected)
      );

      return (
        <li
          key={dayKey + '_' + idx}
          className="agenda-event-item d-flex justify-content-between text-gray"
          style={userProps.style}
        >
          {Event ? <Event event={event} title={title} /> : title}
          {this.timeRangeLabel(day, event)}
        </li>
      );
    }, []);

    return (
      <div key={dayKey}>
        <h4 className="h6 font-weight-normal agenda-events-date m-0">{eventsDate}</h4>
        <ul className="m-0 p-0">{eventItems}</ul>
      </div>
    );
  };

  timeRangeLabel = (day, event) => {
    let { accessors, localizer, components } = this.props;

    let labelClass = '',
      TimeComponent = components.time,
      label = intl.get('.rbc.messages.allDay').d(localizer.messages.allDay);

    let end = accessors.end(event);
    let start = accessors.start(event);

    if (!accessors.allDay(event)) {
      if (dates.eq(start, end)) {
        label = localizer.format(start, 'agendaTimeFormat');
      } else if (dates.eq(start, end, 'day')) {
        label = localizer.format({ start, end }, 'agendaTimeRangeFormat');
      } else if (dates.eq(day, start, 'day')) {
        label = localizer.format(start, 'agendaTimeFormat');
      } else if (dates.eq(day, end, 'day')) {
        label = localizer.format(end, 'agendaTimeFormat');
      }
    }

    if (dates.gt(day, start, 'day')) labelClass = 'rbc-continues-prior';
    if (dates.lt(day, end, 'day')) labelClass += ' rbc-continues-after';

    return (
      <span className={labelClass.trim()}>
        {TimeComponent ? (
          <TimeComponent event={event} day={day} label={label} />
        ) : (
          label
        )}
      </span>
    );
  };

  _adjustHeader = () => {
    if (!this.tbodyRef.current) return;

    let header = this.headerRef.current;
    let firstRow = this.tbodyRef.current.firstChild;

    if (!firstRow) return;

    let isOverflowing =
      this.contentRef.current.scrollHeight >
      this.contentRef.current.clientHeight;

    this._widths = [
      getWidth(firstRow.children[0]),
      getWidth(firstRow.children[1])
    ];

    this.dateColRef.current.style.width = this._widths[0] + 'px';
    this.timeColRef.current.style.width = this._widths[1] + 'px';

    if (isOverflowing) {
      addClass(header, 'rbc-header-overflowing');
      header.style.marginRight = scrollbarSize() + 'px';
    } else {
      removeClass(header, 'rbc-header-overflowing');
    }
  };
}

Agenda.propTypes = {
  events: PropTypes.array,
  date: PropTypes.instanceOf(Date),
  length: PropTypes.number.isRequired,
  selected: PropTypes.object,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired
};

Agenda.defaultProps = {
  length: 30
};

Agenda.range = (start, { length = Agenda.defaultProps.length }) => {
  let end = dates.add(start, length, 'day');
  return { start, end };
};

Agenda.navigate = (date, action, { length = Agenda.defaultProps.length }) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -length, 'day');

    case navigate.NEXT:
      return dates.add(date, length, 'day');

    default:
      return date;
  }
};

Agenda.title = (start, { length = Agenda.defaultProps.length, localizer }) => {
  let end = dates.add(start, length, 'day');
  return localizer.format({ start, end }, 'agendaHeaderFormat');
};

export default Agenda;
