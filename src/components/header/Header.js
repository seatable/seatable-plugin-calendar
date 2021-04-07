import PropTypes from 'prop-types';
import React from 'react';

const Header = ({ label }) => (
  <span role="columnheader" aria-sort="none">
    {label}
  </span>
);

Header.propTypes = {
  label: PropTypes.node,
};

export default Header;
