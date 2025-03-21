import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

class TaskList {

  static execute() {
    const root = createRoot(document.querySelector('#plugin-wrapper'));
    root.render(<App showDialog key={(new Date()).getTime()} />);
  }
}

export default TaskList;

window.app.registerPluginItemCallback('calendar', TaskList.execute);
