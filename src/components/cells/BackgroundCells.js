import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import classnames from 'classnames';
import Selection, { getBoundsForNode, isEvent } from '../selection/Selection';
import * as dates from '../../utils/dates';
import { getSlotAtX, pointInBox } from '../../utils/selection';

class BackgroundCells extends React.PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      selecting: false
    };
  }

  componentDidMount() {
    this.props.selectable && this._selectable();
  }

  componentWillUnmount() {
    this._teardownSelectable();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectable && !this.props.selectable) this._selectable();
    if (!nextProps.selectable && this.props.selectable) this._teardownSelectable();
  }

  render() {
    let {
      range,
      getNow,
      getters,
      date: currentDate,
      components: { dateCellWrapper: Wrapper }
    } = this.props;
    let { selecting, startIdx, endIdx } = this.state;
    let current = getNow();

    return (
      <div className='rbc-row-bg'>
        {range.map((date, index) => {
          let selected = selecting && index >= startIdx && index <= endIdx;
          const { className, style } = getters.dayProp(date);

          return (
            <Wrapper key={index} value={date} range={range}>
              <div
                style={style}
                className={classnames(
                  'rbc-day-bg',
                  className,
                  {
                    'rbc-selected-cell': selected,
                    'rbc-today': dates.eq(date, current, 'day'),
                    'rbc-off-range-bg': currentDate && dates.month(currentDate) !== dates.month(date)
                  }
                )}
              />
            </Wrapper>
          );
        })}
      </div>
    );
  }

  _selectable() {
    let node = findDOMNode(this);
    let selector = (this._selector = new Selection(this.props.container, {
      longPressThreshold: this.props.longPressThreshold
    }));

    let selectorClicksHandler = (point, actionType) => {
      if (!isEvent(findDOMNode(this), point)) {
        let rowBox = getBoundsForNode(node);
        let { range, rtl } = this.props;

        if (pointInBox(rowBox, point)) {
          let currentCell = getSlotAtX(rowBox, point.x, rtl, range.length);

          this._selectSlot({
            startIdx: currentCell,
            endIdx: currentCell,
            action: actionType,
            box: point
          });
        }
      }

      this._initial = {};
      this.setState({ selecting: false });
    };

    selector.on('click', point => selectorClicksHandler(point, 'click'));

    selector.on('doubleClick', point =>
      selectorClicksHandler(point, 'doubleClick')
    );
  }

  _teardownSelectable() {
    if (!this._selector) return;
    this._selector.teardown();
    this._selector = null;
  }

  _selectSlot({ endIdx, startIdx, action, bounds, box }) {
    if (endIdx !== -1 && startIdx !== -1)
      this.props.onSelectSlot &&
        this.props.onSelectSlot({
          start: startIdx,
          end: endIdx,
          action,
          bounds,
          box
        });
  }
}

BackgroundCells.propTypes = {
  date: PropTypes.instanceOf(Date),
  getNow: PropTypes.func.isRequired,
  getters: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  container: PropTypes.func,
  dayPropGetter: PropTypes.func,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,
  onSelectSlot: PropTypes.func.isRequired,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  rtl: PropTypes.bool,
  type: PropTypes.string
};

export default BackgroundCells;
