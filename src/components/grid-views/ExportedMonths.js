import React from 'react';
import PropTypes from 'prop-types';
import ExportedMonth from './ExportedMonth';

class ExportedMonths extends React.Component {
  render() {
    const { exportedMonths, date, ...props } = this.props;
    return (<div id="exported-months" className="position-absolute w-100" style={{'zIndex':'-1000'}}>
      {exportedMonths.map((startDate, index) => {
        return <ExportedMonth {...props} key={index} date={startDate} />;
      })}
    </div>);
  }
}

ExportedMonths.propTypes = {
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

export default ExportedMonths;
