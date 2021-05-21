import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { navigate } from '../../constants';
import { isMobile, isIOS } from '../../utils/common';

class Toolbar extends React.Component {

  constructor(props) {
    super(props);
    this.isIosMobile = isMobile && isIOS;
    this.enableHover = !this.isIosMobile;
  }

  render() {
    let {
      localizer: { messages },
      label,
      isToday,
    } = this.props;
    return (
      <div className='rbc-toolbar'>
        <div className='rbc-btn-group d-flex'>
          <div className='rbc-tool-icon-group d-flex'>
            <span onClick={this.navigate.bind(null, navigate.PREVIOUS)} className={classnames('rbc-tool-icon', {'enable-hover': this.enableHover})}>
              <i className="dtable-font dtable-icon-left"></i>
            </span>
            <span className="rbc-split-line"></span>
            <span onClick={this.navigate.bind(null, navigate.NEXT)} className={classnames('rbc-tool-icon', {'enable-hover': this.enableHover})}>
              <i className="dtable-font dtable-icon-right"></i>
            </span>
          </div>
          <span
            className={classnames('rbc-tool-btn text-truncate', {'today-btn-disabled': isToday, 'enable-hover': this.enableHover})}
            onClick={!isToday ? this.navigate.bind(null, navigate.TODAY) : undefined}
          >
            {intl.get('.rbc.messages.today').d(messages.today)}
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
          {intl.get(`.rbc.messages.${name}`).d(messages[name])}
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
  isToday: PropTypes.bool,
};

export default Toolbar;
