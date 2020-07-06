import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { navigate } from '../../constants';

class Toolbar extends React.Component {
  render() {
    let {
      localizer: { messages },
      label,
      onToggleSelectColumn,
      startDateColumn,
      isToday,
    } = this.props;
    const selectFieldBtntitle = startDateColumn && Object.keys(startDateColumn).length > 0 ? intl.get('Using_xxx_column', {columnName: startDateColumn.name}) : intl.get('Select_Column');
    return (
      <div className='rbc-toolbar'>
        <div className='rbc-btn-group'>
          <div className='rbc-tool-icon-group'>
            <span onClick={this.navigate.bind(null, navigate.PREVIOUS)} className={'rbc-tool-icon'}>
              <i className="dtable-font dtable-icon-left"></i>
            </span>
            <span className="rbc-split-line"></span>
            <span onClick={this.navigate.bind(null, navigate.NEXT)} className={'rbc-tool-icon'}>
              <i className="dtable-font dtable-icon-right"></i>
            </span>
          </div>
          <span
            className={classnames('rbc-tool-btn', {'today-btn-disabled': isToday})}
            onClick={!isToday ? this.navigate.bind(null, navigate.TODAY) : undefined}
          >
            {messages.today}
          </span>
          <span onClick={onToggleSelectColumn} className={'selected-column'}>
            <i className="dtable-font dtable-icon-calendar-alt-solid"></i><span title={selectFieldBtntitle}>{selectFieldBtntitle}</span>
          </span>
        </div>
        <span className='rbc-toolbar-label'>{label}</span>
        <div className='rbc-btn-group view-type'>
          <div className='view-type-list'>{this.viewNamesGroup(messages)}</div>
        </div>
      </div>
    );
  }

  navigate = action => {
    this.props.onNavigate(action);
  };

  onSelectView = view => {
    this.props.onSelectView(view);
  };

  viewNamesGroup(messages) {
    let { views: viewNames, activeView } = this.props;
    if (viewNames.length > 0) {
      return viewNames.map(name => (
        <div
          key={name}
          className={classnames({ 'rbc-view-type': true, 'rbc-active': activeView === name })}
          onClick={this.onSelectView.bind(null, name)}
        >
          {intl.get(messages[name])}
        </div>
      ));
    }
  }
}

Toolbar.propTypes = {
  activeView: PropTypes.string.isRequired,
  views: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.node.isRequired,
  localizer: PropTypes.object,
  onNavigate: PropTypes.func.isRequired,
  onSelectView: PropTypes.func.isRequired,
  t: PropTypes.func,
  onToggleSelectColumn: PropTypes.func,
  startDateColumn: PropTypes.object,
  isToday: PropTypes.bool,
};

export default Toolbar;
