import PropTypes from 'prop-types';
import React from 'react';
import intl from 'react-intl-universal';

const Header = ({ label, isShowWeek }) => {
  const weekNumber = intl.get(label).defaultMessage(label);
  return <span>{isShowWeek ? intl.get('Week_xxx', {weekNumber: weekNumber}) : weekNumber}</span>;
};

Header.propTypes = {
  label: PropTypes.node,
  isShowWeek: PropTypes.bool,
};

export default Header;
