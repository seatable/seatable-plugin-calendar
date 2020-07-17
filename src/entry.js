import React from 'react';
import ReactDOM from 'react-dom';
import App from './app'

class DTableCalendar {

  static execute() {
    let wrapper = document.querySelector('#plugin-wrapper');
    ReactDOM.render(<App showDialog={true} />, wrapper);
  }

}

export { DTableCalendar };