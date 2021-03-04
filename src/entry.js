import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

class TaskList {
  static execute() {
    let wrapper = document.querySelector('#plugin-wrapper');
    ReactDOM.render(<App showDialog={true} key={(new Date()).getTime()} />, wrapper);
  }
}

export default TaskList;

window.app.registerPluginItemCallback('calendar', TaskList.execute);
