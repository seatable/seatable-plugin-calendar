import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import classnames from 'classnames';
import Selection, { getBoundsForNode, isEvent } from '../selection/Selection';
import * as dates from '../../utils/dates';
import { getSlotAtX, pointInBox } from '../../utils/selection';
import { DateBlock } from './date-block';


function BackgroundCells(props) {

  const currentRef = useRef(null);
  const _selector = useRef(null);
  const _initial = useRef(null);

  const [selecting, setSelecting] = useState(false);
  const [prevProps, setPrevProps] = useState(null);

  // depending on props，trigger effect once props changed
  // evaluate the frist time after componet mounted
  useEffect(() => {
    if (props.selectable && !prevProps?.selectable) _selectable();
    if (!props.selectable && prevProps?.selectable) _teardownSelectable();
    setPrevProps(props);
    return () => _teardownSelectable();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  
  function _selectable() {
    let node = currentRef.current;
    let selector = (_selector.current = new Selection(props.container, {
      longPressThreshold: props.longPressThreshold
    }));

    let selectorClicksHandler = (point, actionType) => {
      if (!isEvent(currentRef.current, point)) {
        let rowBox = getBoundsForNode(node);
        let { range, rtl } = props;

        if (pointInBox(rowBox, point)) {
          let currentCell = getSlotAtX(rowBox, point.x, rtl, range.length);

          _selectSlot({
            startIdx: currentCell,
            endIdx: currentCell,
            action: actionType,
            box: point
          });
        }
      }

      _initial.current = {};
      setSelecting(false);
    };

    selector.on('click', point => selectorClicksHandler(point, 'click'));

    selector.on('doubleClick', point =>
      selectorClicksHandler(point, 'doubleClick')
    );
  }

  function _teardownSelectable() {
    if (!_selector.current) return;
    _selector.current.teardown();
    _selector.current = null;
  }

  function _selectSlot({ endIdx, startIdx, action, bounds, box }) {
    if (endIdx !== -1 && startIdx !== -1)
      props.onSelectSlot &&  props.onSelectSlot({
        start: startIdx,
        end: endIdx,
        action,
        bounds,
        box
      });
  }
  
  let {
    range,
    getNow,
    getters,
    date: currentDate,
    components: { dateCellWrapper: Wrapper }
  } = props;

  let startIdx, endIdx;
  let current = getNow();

  return (
    <div className='rbc-row-bg' ref={currentRef}>
      {range.map((date, index) => {
        let selected = selecting && index >= startIdx && index <= endIdx;
        const { className, style } = getters.dayProp(date);

        return (
          <Wrapper key={index} value={date} range={range}>
            <DateBlock 
              blockStyle={style} 
              className={classnames(
                'rbc-day-bg',
                className,
                {
                  'rbc-selected-cell': selected,
                  'rbc-today': dates.eq(date, current, 'day'),
                  'rbc-off-range-bg': currentDate && dates.month(currentDate) !== dates.month(date)
                }
              )} 
              value={date}
              range={range}
            >
            </DateBlock>
            {/* <div
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
            /> */}
          </Wrapper>
        );
      })}
    </div>
  );
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
