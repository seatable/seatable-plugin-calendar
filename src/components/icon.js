import SvgIcon from './svg-icon';
import React from 'react';

export default function Icon(props) {
  const { className, title, symbol, color } = props;

  if (symbol.startsWith('dtable-icon')) {
    return (
      <span
        className={`dtable-font ${symbol} ${className || ''}`}
        style={{ color }}
      />
    );
  }

  return (
    <SvgIcon
      symbol={symbol}
      color={color}
      className={className}
      title={title}
    />
  );
}
