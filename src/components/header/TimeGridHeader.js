import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import Header from './Header';
import ResourceHeader from './ResourceHeader';
import DateContentRow from '../rows/DateContentRow';
import * as dates from '../../utils/dates';
import { notify } from '../../utils/helpers';
import { isMobile } from '../../utils/common';
import dayjs from 'dayjs';
import { UncontrolledTooltip } from 'reactstrap';
import intl from 'react-intl-universal';

class TimeGridHeader extends React.Component {

  handleHeaderClick = (date, view, e) => {
    e.preventDefault();
    notify(this.props.onDrillDown, [date, view]);
  };

  onInsertRow = (date) => {
    const { canAddRecord } = this.props;
    if (!canAddRecord || isMobile) return;
    this.props.onInsertRow(dates.getFormattedDate(date, 'YYYY-MM-DD'));
  };

  renderHeaderCells(range) {
    let {
      localizer,
      getDrilldownView,
      getNow,
      getters: { dayProp },
      components: { header: HeaderComponent = Header },
      canAddRecord,
    } = this.props;

    const today = getNow();

    return range.map((date, i) => {
      let drilldownView = getDrilldownView(date);
      let label = localizer.format(date, 'dayFormat');
      const dateStr = dayjs(date).format('YYYY-MM-DD-HH-mm-ss');

      const { className, style } = dayProp(date);

      let header = (
        <HeaderComponent date={date} label={label} localizer={localizer} />
      );

      return (
        <div
          key={i}
          style={style}
          className={classnames(
            'rbc-header',
            className,
            {
              'rbc-today': dates.eq(date, today, 'day')
            }
          )}
          onDoubleClick={() => this.onInsertRow(date)}
        >
          {drilldownView ? (
            <>
              <button
                onClick={e => this.handleHeaderClick(date, drilldownView, e)}
                className='rbc-header-drilldown-btn'
              >
                {header}
              </button>
              {canAddRecord && !isMobile && (
                <>
                  <div
                    id={`calendar-insert-${dateStr}`}
                    className="calendar-insert-row-btn"
                    onClick={this.onInsertRow.bind(this, date)}
                  >
                    <i className="dtable-font dtable-icon-add-table"></i>
                  </div>
                  <UncontrolledTooltip
                    modifiers={[{ preventOverflow: { boundariesElement: document.body } }]}
                    target={`calendar-insert-${dateStr}`}
                    placement="bottom"
                  >
                    {intl.get('New_record')}
                  </UncontrolledTooltip>
                </>
              )}
            </>
          ) : (
            <span>{header}</span>
          )}
        </div>
      );
    });
  }

  renderRow = resource => {
    let {
      events,
      rtl,
      selectable,
      getNow,
      range,
      getters,
      localizer,
      accessors,
      components,
      canAddRecord
    } = this.props;

    const resourceId = accessors.resourceId(resource);
    let eventsToDisplay = resource
      ? events.filter(event => accessors.resource(event) === resourceId)
      : events;

    return (
      <DateContentRow
        isAllDay
        rtl={rtl}
        getNow={getNow}
        minRows={2}
        range={range}
        events={eventsToDisplay}
        resourceId={resourceId}
        className='rbc-allday-cell'
        selectable={selectable}
        selected={this.props.selected}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        handleRowExpand={this.props.handleRowExpand}
        onDoubleClick={this.props.onDoubleClickEvent}
        onSelectSlot={this.props.onSelectSlot}
        longPressThreshold={this.props.longPressThreshold}
        onInsertRow={this.onInsertRow}
        canAddRecord={canAddRecord}
        isDesktop={!isMobile}
      />
    );
  };

  render() {
    let {
      width,
      rtl,
      resources,
      range,
      events,
      getNow,
      accessors,
      selectable,
      components,
      getters,
      scrollRef,
      localizer,
      isOverflowing,
      components: {
        timeGutterHeader: TimeGutterHeader,
        resourceHeader: ResourceHeaderComponent = ResourceHeader
      }
    } = this.props;

    let style = {};
    // if (isOverflowing) {
    //   style[rtl ? 'marginLeft' : 'marginRight'] = `${scrollbarSize()}px`;
    // }

    const groupedEvents = resources.groupEvents(events);

    return (
      <div
        style={style}
        ref={scrollRef}
        className={classnames('rbc-time-header', { 'rbc-overflowing': isOverflowing })}
      >
        <div
          className='rbc-label rbc-time-header-gutter'
          style={{ width, minWidth: width, maxWidth: width }}
        >
          {TimeGutterHeader && <TimeGutterHeader {...this.props} />}
        </div>

        {resources.map(([id, resource], idx) => (
          <div className='rbc-time-header-content' key={id || idx}>
            {resource && (
              <div className='rbc-row rbc-row-resource' key={`resource_${idx}`}>
                <div className='rbc-header'>
                  <ResourceHeaderComponent
                    index={idx}
                    label={accessors.resourceTitle(resource)}
                    resource={resource}
                  />
                </div>
              </div>
            )}
            <div
              className='rbc-row rbc-time-header-cell'
            >
              {this.renderHeaderCells(range)}
            </div>
            <DateContentRow
              isAllDay
              rtl={rtl}
              getNow={getNow}
              minRows={2}
              range={range}
              events={groupedEvents.get(id) || []}
              resourceId={resource && id}
              className='rbc-allday-cell'
              selectable={selectable}
              selected={this.props.selected}
              components={components}
              accessors={accessors}
              getters={getters}
              localizer={localizer}
              handleRowExpand={this.props.handleRowExpand}
              onDoubleClick={this.props.onDoubleClickEvent}
              onSelectSlot={this.props.onSelectSlot}
              longPressThreshold={this.props.longPressThreshold}
              onInsertRow={this.onInsertRow}
              canAddRecord={this.props.canAddRecord}
              isDesktop={!isMobile}
            />
          </div>
        ))}
      </div>
    );
  }
}

TimeGridHeader.propTypes = {
  range: PropTypes.array.isRequired,
  events: PropTypes.array.isRequired,
  resources: PropTypes.object,
  getNow: PropTypes.func.isRequired,
  isOverflowing: PropTypes.bool,
  rtl: PropTypes.bool,
  width: PropTypes.number,
  localizer: PropTypes.object.isRequired,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,
  onSelectSlot: PropTypes.func,
  handleRowExpand: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  scrollRef: PropTypes.any
};

export default TimeGridHeader;
