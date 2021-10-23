import React, { Component } from 'react';
import { CELL_TYPE, FORMULA_RESULT_TYPE } from 'dtable-sdk';
import { getKnownCreatorByEmail } from '../../utils/common';
import { getCollaboratorsName } from '../../utils/value-format-utils';

const COLLABORATOR_COLUMN_TYPES = [CELL_TYPE.COLLABORATOR, CELL_TYPE.CREATOR, CELL_TYPE.LAST_MODIFIER];

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
    const { event } = props;
    const { state, collaboratorsCache } = window.app;
    const collaborators = (state && state.collaborators) || [];
    const { row, titleColumn } = event;
    let email;
    if (titleColumn.type === 'last-modifier') {
      email = row._last_modifier;
    } else if (titleColumn.type === 'creator') {
      email = row._creator;
    }
    const collaborator = getKnownCreatorByEmail(email, collaborators, collaboratorsCache);
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
    const { event } = props;
    const { row, titleColumn } = event;
    if (titleColumn.type === 'last-modifier') {
      this.getCollaborator(row._last_modifier);
    } else if (titleColumn.type === 'creator') {
      this.getCollaborator(row._creator);
    }
  }

  getCollaborator = (value) => {
    if (!value) {
      this.setState({isDataLoaded: true, collaborator: null});
      return;
    }
    const { state, collaboratorsCache, getUserCommonInfo } = window.app;
    const collaborators = (state && state.collaborators) || [];
    const collaborator = getKnownCreatorByEmail(value, collaborators, collaboratorsCache);
    if (collaborator) {
      this.setState({isDataLoaded: true, collaborator});
      return;
    }
    getUserCommonInfo(value, () => {
      const collaborator = getKnownCreatorByEmail(value, collaborators, collaboratorsCache);
      this.setState({isDataLoaded: true, collaborator});
      return;
    });
  }

  renderCellTitle = () => {
    const { event } = this.props;
    const { isDataLoaded, collaborator } = this.state;
    const { state } = window.app;
    const collaborators = (state && state.collaborators) || [];
    const { row, title, titleColumn } = event;
    const { type } = titleColumn;
    switch (type) {
      case CELL_TYPE.COLLABORATOR: {
        return getCollaboratorsName(collaborators, title);
      }
      case CELL_TYPE.CREATOR: {
        if (!row._creator || !isDataLoaded || !collaborator) return null;
        return collaborator.name;
      }
      case CELL_TYPE.LAST_MODIFIER: {
        if (!row._last_modifier || !isDataLoaded || !collaborator) return null;
        return collaborator.name;
      }
      case CELL_TYPE.FORMULA:
      case CELL_TYPE.LINK_FORMULA: {
        const { data } = titleColumn;
        const { result_type, array_type } = data || {};
        if (result_type === FORMULA_RESULT_TYPE.ARRAY && COLLABORATOR_COLUMN_TYPES.includes(array_type)) {
          return getCollaboratorsName(collaborators, title);
        }
        return title;
      }
      default: {
        return title;
      }
    }
  }

  render() {
    return (
      <span>{this.renderCellTitle()}</span>
    );
  }
}

export default CellTitle;