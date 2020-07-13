import PropTypes from 'prop-types';
import React from 'react';
import intl from 'react-intl-universal';

const Header = ({ label, isShowWeek }) => {
  return <span>{isShowWeek ? intl.get('Week_xxx', {weekNumber: intl.get(label)}) : intl.get(label)}</span>;
};

Header.propTypes = {
  label: PropTypes.node,
  t: PropTypes.func,
  isShowWeek: PropTypes.bool,
};

export default Header;
