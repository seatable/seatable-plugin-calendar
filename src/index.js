import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './setting';

ReactDOM.render(<App showDialog={true} key={(new Date()).getTime()} />, document.getElementById('root'));

/**
 * plugin development window.app shim (dtable-ui)
 *
 * @link https://docs.seatable.io/published/dtable-sdk/dtable-ui.md
 */
window.app = window.app ? window.app : {};
window.app.expandRow = window.app.expandRow || ((row, rowTable) => {
  console.log('dtable-ui shim: app.expandRow', [row, rowTable]);
});
