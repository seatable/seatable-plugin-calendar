import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './setting';

ReactDOM.render(<App showDialog={true} key={(new Date()).getTime()} />, document.getElementById('root'));

