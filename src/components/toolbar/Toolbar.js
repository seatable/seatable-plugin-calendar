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
      isToday,
    } = this.props;
    return (
      <div className='rbc-toolbar'>
        <div className='rbc-btn-group d-flex'>
          <div className='rbc-tool-icon-group d-flex'>
            <span onClick={this.navigate.bind(null, navigate.PREVIOUS)} className={'rbc-tool-icon'}>
              <i className="dtable-font dtable-icon-left"></i>
            </span>
            <span className="rbc-split-line"></span>
            <span onClick={this.navigate.bind(null, navigate.NEXT)} className={'rbc-tool-icon'}>
              <i className="dtable-font dtable-icon-right"></i>
            </span>
          </div>
          <span
            className={classnames('rbc-tool-btn text-truncate', { 'today-btn-disabled': isToday })}
            onClick={!isToday ? this.navigate.bind(null, navigate.TODAY) : undefined}
          >
            {intl.get('.rbc.messages.today').d(messages.today)}
          </span>
        </div>
        <span className='rbc-toolbar-label'>{label}</span>
        <div className='rbc-btn-group view-type'>
          {this.viewNamesGroup(messages)}
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

  handleSelectView = (e) => {
    const view = e.target.value;
    this.props.onSelectView(view);
  };

  viewNamesGroup(messages) {
    let { views: viewNames, activeView, isMobile } = this.props;
    if (viewNames.length > 0) {
      return isMobile ? (
        <select value={activeView} onChange={this.handleSelectView} className="mobile-view-selector">
          {viewNames.map(name => (
            <option key={name} value={name}>
              {intl.get(`.rbc.messages.${name}`).d(messages[name])}
            </option>
          ))}
        </select>
      ) : (
        <div className="view-type-list">
          {viewNames.map(name => (
            <div
              key={name}
              className={classnames({ 'rbc-view-type': true, 'rbc-active': activeView === name })}
              onClick={this.onSelectView.bind(null, name)}
            >
              {intl.get(`.rbc.messages.${name}`).d(messages[name])}
            </div>
          ))}
        </div>
      );
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
  isMobile: PropTypes.bool
};

export default Toolbar;
