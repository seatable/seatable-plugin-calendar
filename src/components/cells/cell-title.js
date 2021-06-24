import React, { Component } from 'react';
import { getMediaUrl, isValidEmail } from '../../utils/common';
import { getCollaboratorsName } from '../../utils/value-format-utils';

class CellTitle extends Component {

  constructor(props) {
    super(props);
    this.state = {
      ...this.initCollaboratorState(props),
    };
  }

  componentDidMount() {
    if (!this.state.isDataLoaded) {
      this.calculateCollaboratorData(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.calculateCollaboratorData(nextProps);
  }

  initCollaboratorState = (props) => {
    const { event, CellType, collaborators } = props;
    const { row, titleColumn } = event;
    const mediaUrl = getMediaUrl();
    const defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
    let email, collaborator;
    if (titleColumn.type === CellType.LAST_MODIFIER) {
      email = row._last_modifier;
    } else if (titleColumn.type === CellType.CREATOR) {
      email = row._creator;
    }

    if (email === 'anonymous') {
      collaborator = {
        name: 'anonymous',
        avatar_url: defaultAvatarUrl,
      };
    } else if (!isValidEmail(email)) {
      collaborator = {
        name: email,
        avatar_url: defaultAvatarUrl,
      };
    } else {
      collaborator = collaborators.find(collaborator => collaborator.email === email);
    }
    if (collaborator) {
      return {
        isDataLoaded: true,
        collaborator,
      };
    }
    return {
      isDataLoaded: false,
      collaborator: null,
    };
  }

  calculateCollaboratorData = (props) => {
    const { event, CellType } = props;
    const { row, titleColumn } = event;
    if (titleColumn.type === CellType.LAST_MODIFIER) {
      this.getCollaborator(row._last_modifier);
    } else if (titleColumn.type === CellType.CREATOR) {
      this.getCollaborator(row._creator);
    }
  }

  getCollaborator = (value) => {
    if (!value) {
      this.setState({isDataLoaded: true, collaborator: null});
      return;
    }
    let { collaborators } = this.props;
    let collaborator = collaborators && collaborators.find(c => c.email === value);
    if (collaborator) {
      this.setState({isDataLoaded: true, collaborator});
      return;
    }

    if (!isValidEmail(value)) {
      let mediaUrl = getMediaUrl();
      let defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
      collaborator = {
        name: value,
        avatar_url: defaultAvatarUrl,
      };
      this.setState({isDataLoaded: true, collaborator});
      return;
    }

    this.getUserCommonInfo(value).then(res => {
      collaborator = res.data;
      this.setState({isDataLoaded: true, collaborator});
    }).catch(() => {
      let mediaUrl = getMediaUrl();
      let defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
      collaborator = {
        name: value,
        avatar_url: defaultAvatarUrl,
      };
      this.setState({isDataLoaded: true, collaborator});
    });
  }

  getUserCommonInfo = (email, avatarSize = '') => {
    if (!window.dtableWebAPI) return Promise.reject();
    return window.dtableWebAPI.getUserCommonInfo(email, avatarSize);
  }

  renderCellTitle = () => {
    const { CellType, collaborators, event } = this.props;
    const { isDataLoaded, collaborator } = this.state;
    const { row, titleColumn } = event;
    const { type, key, data } = titleColumn;
    const title = row[key];
    switch (type) {
      case CellType.SINGLE_SELECT: {
        if (!title || !data) return null;
        const options = data.options || [];
        const option = options.find(option => option.id === title);
        return option && option.name;
      }
      case CellType.COLLABORATOR: {
        return getCollaboratorsName(collaborators, title);
      }
      case CellType.CREATOR: {
        if (!row._creator || !isDataLoaded || !collaborator) return null;
        return collaborator.name;
      }
      case CellType.LAST_MODIFIER: {
        if (!row._last_modifier || !isDataLoaded || !collaborator) return null;
        return collaborator.name;
      }
      default: return title;
    }
  }

  render() {
    return (
      <span>{this.renderCellTitle()}</span>
    );
  }
}

export default CellTitle;