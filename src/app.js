import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody } from 'reactstrap';
import DTable from 'dtable-sdk';
import './locale/index.js'
import ReactBigCalendar from './ReactBigCalendar';
import { PLUGIN_NAME } from './constants';
import { CALENDAR_DIALOG_MODAL } from './constants/zIndexes';

import './locale';

import './css/plugin-layout.css';

/**
 * the data structure of settings
 * {
 *  [table_id]: {
 *    start_date_column_key,
 *    end_date_column_key,
 *    label_column_key
 *  }
 * }
 */

const propTypes = {
  showDialog: PropTypes.bool
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showDialog: props.showDialog || false,
    };
    this.dtable = new DTable();
  }

  componentDidMount() {
    this.initPluginDTableData();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({showDialog: nextProps.showDialog});
  } 

  componentWillUnmount() {
    this.unsubscribeLocalDtableChanged();
    this.unsubscribeRemoteDtableChanged();
  }

  async initPluginDTableData() {
    if (window.app === undefined) {
      // local develop
      window.app = {};
      await this.dtable.init(window.dtablePluginConfig);
      await this.dtable.syncWithServer();
      this.dtable.subscribe('dtable-connect', () => { this.onDTableConnect(); });
    } else {
      // integrated to dtable app
      this.dtable.initInBrowser(window.app.dtableStore);
    }
    this.unsubscribeLocalDtableChanged = this.dtable.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = this.dtable.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData(true);
  }

  onDTableConnect = () => {
    this.resetData();
  }

  onDTableChanged = () => {
    this.resetData();
  }

  resetData = (init = false) => {
    let { showDialog } = this.state;
    let plugin_settings = this.dtable.getPluginSettings(PLUGIN_NAME) || {};
    if (init) {
      showDialog = true;
    }
    this.setState({
      isLoading: false,
      showDialog: showDialog,
      plugin_settings
    });
  }

  onPluginToggle = () => {
    this.setState({showDialog: false});
    window.app.onClosePlugin();
  }

  getRows = (table, view) => {
    let rows = [];
    let { name: tableName } = table;
    let { name: viewName } = view;
    this.dtable.forEachRow(tableName, viewName, (row) => {
      rows.push(row);
    });
    return rows;
  }

  updateSettings = (table, start_date_column_key, label_column_key, end_date_column_key) => {
    let { plugin_settings } = this.state;
    let { _id } = table;
    plugin_settings[_id] = {start_date_column_key, end_date_column_key, label_column_key};
    this.setState({plugin_settings}, () => {
      this.dtable.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  }

  onRowExpand = (row, table) => {
    if (window.app.expandRow) {
      window.app.expandRow(row, table);
    }
  }

  onInsertRow = (rowData, activeTable, activeView) => {
    this.dtable.appendRow(activeTable, rowData, activeView);
    let viewRows = this.dtable.getViewRows(activeView, activeTable);
    let insertedRow = viewRows[viewRows.length - 1];
    if (insertedRow) {
      window.app.expandRow(insertedRow, activeTable);
    }
  }

  render() {
    let { isLoading, showDialog, plugin_settings } = this.state;
    if (isLoading || !showDialog) {
      return '';
    }

    let activeTable = this.dtable.getActiveTable();
    let activeView = this.dtable.getActiveView()
    let columns = this.dtable.getColumns(activeTable);
    let cellType = this.dtable.getCellType();
    let optionColors = this.dtable.getOptionColors();
    let highlightColors = this.dtable.getHighlightColors();
    let rows = this.getRows(activeTable, activeView);
    let currentSetting = plugin_settings[activeTable._id] || {};
    return (
      <Modal isOpen={true} toggle={this.onPluginToggle} className="dtable-plugin calendar-plugin-container" size="lg" zIndex={CALENDAR_DIALOG_MODAL}>
        <ModalBody className="calendar-plugin-content">
          <ReactBigCalendar
            activeTable={activeTable}
            activeView={activeView}
            columns={columns}
            rows={rows}
            getRowById={this.dtable.getRowById}
            CellType={cellType}
            setting={currentSetting}
            optionColors={optionColors}
            highlightColors={highlightColors}
            onRowExpand={this.onRowExpand}
            updateSettings={this.updateSettings}
            onInsertRow={this.onInsertRow}
          />
        </ModalBody>
      </Modal>
    );
  }
}

App.propTypes = propTypes;

export default App;
