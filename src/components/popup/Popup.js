import React from 'react';
import PropTypes from 'prop-types';
import getScrollTop from 'dom-helpers/scrollTop';
import getScrollLeft from 'dom-helpers/scrollLeft';
import intl from 'react-intl-universal';
import EventCell from '../cells/EventCell';
import * as dates from '../../utils/dates';
import { handleEnterKeyDown } from '../../utils/accessibility';

class Popup extends React.Component {

  componentDidMount() {
    let { popupOffset = 5 } = this.props;
    let { top, left, width, height } = this.popperRef.getBoundingClientRect();
    let viewBottom = window.innerHeight + getScrollTop(window);
    let viewRight = window.innerWidth + getScrollLeft(window);
    let bottom = top + height;
    let right = left + width;
    if (bottom > viewBottom || right > viewRight) {
      let topOffset, leftOffset;
      if (bottom > viewBottom) {
        topOffset = bottom - viewBottom + (popupOffset.y || + popupOffset || 0);
      }
      if (right > viewRight) {
        leftOffset = right - viewRight + (popupOffset.x || + popupOffset || 0);
      }
      this.setState({ topOffset, leftOffset });
    }
    document.addEventListener('click', this.onHidePopup, true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onHidePopup, true);
  }

  onHidePopup = (event) => {
    // eslint-disable-next-line
    if (this.popperRef && event && !this.popperRef.contains(event.target) ||
      this.closeBtn === event.target) {
      this.props.onHidePopup();
    }
  };

  setPopperRef = (node) => {
    this.popperRef = node;
  };

  handleScroll = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  render() {
    let {
      events,
      handleRowExpand,
      getters,
      accessors,
      components,
      slotStart,
      slotEnd,
      localizer,
      scrolled,
    } = this.props;

    let { top, left } = this.props.position;
    let topOffset = (this.state || {}).topOffset || 0;
    let leftOffset = (this.state || {}).leftOffset || 0;
    let style = {
      top: top - topOffset + (scrolled ? scrolled.scrollTop : 0),
      left: left - leftOffset,
    };
    return (
      <div
        style={{ ...this.props.style, ...style }}
        className='rbc-overlay'
        ref={this.setPopperRef}
      >
        <div className='rbc-overlay-header'>
          {localizer.format(slotStart, 'dayHeaderFormat')}
          <button 
            className='close'            
            onKeyDown={handleEnterKeyDown(this.props.onHidePopup)}
          >
            <span aria-hidden="true" ref={ref => this.closeBtn = ref}>×</span>
          </button>
        </div>
        <div className="rbc-overlay-body" onScroll={this.handleScroll}>
          {events.length === 0 ? <span>{intl.get('There_are_no_records')}</span> : events.map((event, idx) => (
            <EventCell
              key={idx}
              type='popup'
              event={event}
              getters={getters}
              handleRowExpand={handleRowExpand}
              accessors={accessors}
              components={components}
              continuesPrior={dates.lt(accessors.end(event), slotStart, 'day')}
              continuesAfter={dates.gte(accessors.start(event), slotEnd, 'day')}
              slotStart={slotStart}
              slotEnd={slotEnd}
            />
          ))}
        </div>
      </div>
    );
  }
}

Popup.propTypes = {
  position: PropTypes.object,
  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    })
  ]),
  events: PropTypes.array,
  selected: PropTypes.object,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  handleRowExpand: PropTypes.func,
  slotStart: PropTypes.instanceOf(Date),
  slotEnd: PropTypes.number,
  style: PropTypes.object,
  onHidePopup: PropTypes.func,
  scrolled: PropTypes.object,
};

export default Popup;
