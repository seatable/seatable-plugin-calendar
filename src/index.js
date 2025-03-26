import React from 'react';
import { createRoot } from 'react-dom/client';
import DTable from 'dtable-sdk';
import App from './app';
import { getMediaUrl } from './utils/common';
import './setting';

class TaskList {

  static async init() {
    const dtableSDK = new DTable();

    // local develop
    window.app = {};
    window.app.state = {};
    window.app.collaboratorsCache = {};
    window.dtable = { lang: window.dtablePluginConfig.lang };
    await dtableSDK.init(window.dtablePluginConfig);
    await dtableSDK.syncWithServer();
    await dtableSDK.dtableWebAPI.login();

    window.app.collaborators = dtableSDK.dtableStore.collaborators;
    window.app.state.collaborators = dtableSDK.dtableStore.collaborators;
    window.app.getUserCommonInfo = this.getUserCommonInfo;
    window.dtableSDK = dtableSDK;
  }

  static getUserCommonInfo = (email, callback) => {
    const dtableCollaborators = window.app.collaboratorsCache;
    window.dtableSDK.dtableWebAPI.getUserCommonInfo(email).then(res => {
      const collaborator = res.data;
      dtableCollaborators[email] = collaborator;
      callback && callback();
    }).catch(() => {
      const mediaUrl = getMediaUrl();
      const defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
      const collaborator = {
        name: email,
        avatar_url: defaultAvatarUrl,
      };
      dtableCollaborators[email] = collaborator;
      callback && callback();
    });
  };

  static async execute() {
    await this.init();
    const ele = document.getElementById('root');
    if (!ele) return null;
    const root = createRoot(document.getElementById('root'));
    root.render(<App isDevelopment showDialog key={(new Date()).getTime()} />);
  }
}

TaskList.execute();
