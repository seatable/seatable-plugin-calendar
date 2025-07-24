import React from 'react';
import PropTypes from 'prop-types';
import '../assets/icon.css';

const components = {};
const requireContext = require.context('../assets/icons', false, /\.svg$/);

requireContext.keys().forEach(path => {
  const iconName = path.replace(/^\.\/(.*?)\.svg$/, '$1').toLowerCase();
  components[iconName] = requireContext(path).default;
});

const needScaleIcons = ['check', 'dot', 'cross'];

const SvgIcon = ({ className, symbol, color }) => {
  let iconClass = `multicolor-icon multicolor-icon-${symbol} ${className || ''}`;
  if (needScaleIcons.includes(symbol) && window.isMobile) {
    iconClass += ' scale-icon';
  }
  let containerStyle = {
    color: color || '',
  };
  const IconComponent = components[symbol];
  if (!IconComponent) return;
  return (<IconComponent className={iconClass} style={containerStyle} aria-hidden="true"/>);
};

SvgIcon.propTypes = {
  color: PropTypes.string,
  symbol: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default SvgIcon;
