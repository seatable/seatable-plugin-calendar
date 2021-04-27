import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import moment from 'moment';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import DTable from 'dtable-sdk';
import ReactBigCalendar from './ReactBigCalendar';
import { PLUGIN_NAME, SETTING_KEY, DATE_FORMAT } from './constants';
import { CALENDAR_DIALOG_MODAL } from './constants/zIndexes';
import ViewsTabs from './components/views-tabs';
import ViewSetting from './components/view-setting';
import TimeRangeDialog from './components/dialog/time-range-dialog';
import { generatorViewId, getDtableUuid, checkDesktop} from './utils/common';
import View from './model/view';

import './locale';

import './css/plugin-layout.css';

import icon from './image/icon.png';

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

const DEFAULT_PLUGIN_SETTINGS = {
  views: [
    {
      _id: '0000',
      name: `${intl.get('Default_View')}`,
      settings: {}
    }
  ]
};

const KEY_SELECTED_VIEW_IDS = `${PLUGIN_NAME}-selectedViewIds`;

const propTypes = {
  showDialog: PropTypes.bool
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showDialog: props.showDialog || false,
      plugin_settings: {},
      selectedViewIdx: 0,
      isViewSettingPanelOpen: false,
      rows: [],
      isTimeRangeDialogOpen: false
    };
    this.dtable = new DTable();
  }

  componentDidMount() {
    this.initPluginDTableData();
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
      let relatedUsersRes = await this.getRelatedUsersFromServer(this.dtable.dtableStore);
      window.app.collaborators = relatedUsersRes.data.user_list;
      this.dtable.subscribe('dtable-connect', () => { this.onDTableConnect(); });
    } else {
      // integrated to dtable app
      this.dtable.initInBrowser(window.app.dtableStore);
    }
    this.unsubscribeLocalDtableChanged = this.dtable.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = this.dtable.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData(true);
  }

  async getRelatedUsersFromServer(dtableStore) {
    return dtableStore.dtableAPI.getTableRelatedUsers();
  }

  onDTableConnect = () => {
    this.resetData();
  }

  onDTableChanged = () => {
    this.resetData();
  }

  resetData = (init = false) => {
    let { isViewSettingPanelOpen } = this.state;
    let plugin_settings = this.dtable.getPluginSettings(PLUGIN_NAME) || {};
    if (!plugin_settings || Object.keys(plugin_settings).length === 0 || !plugin_settings.views) {
      plugin_settings = DEFAULT_PLUGIN_SETTINGS;
    }
    let { views } = plugin_settings;
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS) || {};
    let selectedViewId = selectedViewIds[dtableUuid];
    let selectedViewIdx = Array.isArray(views) && views.findIndex(v => v._id === selectedViewId);
    selectedViewIdx = selectedViewIdx > 0 ? selectedViewIdx : 0;
    if (init) {
      isViewSettingPanelOpen = !this.isValidViewSettings(views[selectedViewIdx].settings);
    }

    this.cellType = this.dtable.getCellType();
    this.optionColors = this.dtable.getOptionColors();
    this.highlightColors = this.dtable.getHighlightColors();
    this.columnIconConfig = this.dtable.getColumnIconConfig();
    this.collaborators = this.getRelatedUsersFromLocal();
    this.currentUser = this.getCurrentUserFromLocal();
    const selectedPluginView = views[selectedViewIdx];
    const rows = selectedPluginView ? this.getPluginViewRows(selectedPluginView.settings) : [];
    this.setState({
      isLoading: false,
      plugin_settings,
      selectedViewIdx,
      isViewSettingPanelOpen,
      rows,
    });
  }

  getPluginViewRows = (settings) => {
    const tables = this.dtable.getTables();
    const selectedTable = this.getSelectedTable(tables, settings);
    const tableViews = this.dtable.getViews(selectedTable);
    const selectedTableView = this.getSelectedView(selectedTable, settings) || tableViews[0];
    return this.getRows(selectedTable, selectedTableView);
  }

  getSelectedViewIds = (key) => {
    let selectedViewIds = window.localStorage.getItem(key);
    return selectedViewIds ? JSON.parse(selectedViewIds) : {};
  }

  onPluginToggle = () => {
    this.setState({showDialog: false});
    window.app.onClosePlugin && window.app.onClosePlugin();
  }

  getRelatedUsersFromLocal = () => {
    let { collaborators, state } = window.app;
    if (!collaborators) {
      // dtable app
      return state && state.collaborators;
    }
    return collaborators; // local develop
  }

  getCurrentUserFromLocal = () => {
    let username, userId;
    if (window.dtable) {
      username = window.dtable.username;
      userId = window.dtable.userId;
    }
    return { username, userId };
  }

  getRows = (table, view) => {
    let rows = [];
    let { name: tableName } = table;
    let { name: viewName } = view;
    let { username, userId } = this.currentUser;
    this.dtable.forEachRow(tableName, viewName, (row) => {
      rows.push(row);
    }, {username, userId});
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

  onInsertRow = (rowData, activeTable, activeView, rowId) => {
    let initData = this.dtable.getInsertedRowInitData(activeView, activeTable, rowId);
    let newRowData = Object.assign({}, initData, rowData);
    this.dtable.appendRow(activeTable, newRowData, activeView);
    let viewRows = this.dtable.getViewRows(activeView, activeTable);
    let insertedRow = viewRows[viewRows.length - 1];
    if (insertedRow && window.app.expandRow) {
      window.app.expandRow(insertedRow, activeTable);
    }
  }

  toggleViewSettingPanel = () => {
    this.setState({isViewSettingPanelOpen: !this.state.isViewSettingPanelOpen});
  }

  hideViewSettingPanel = () => {
    if (this.state.isViewSettingPanelOpen) {
      this.setState({isViewSettingPanelOpen: false});
    }
  }

  toggleTimeRangeDialog = () => {
    this.setState({isTimeRangeDialogOpen: !this.state.isTimeRangeDialogOpen});
  }

  exportSelectedMonths = (start, end) => {
    let exportedMonths = [];
    const startMonth = moment(start, DATE_FORMAT.YEAR_MONTH);
    const endMonth = moment(end, DATE_FORMAT.YEAR_MONTH);
    const diffMonthAmount = endMonth.diff(startMonth, 'months');
    for (let i = 0; i < diffMonthAmount + 1; i++) {
      // `push` the 1st day of each month, in the native Date object
      exportedMonths.push(moment(startMonth).add(i, 'months').date(1).toDate());
    }
    this.setState({
      isExporting: true,
      exportedMonths: exportedMonths
    }, () => {
      const iframeID = 'iframe-for-print';
      const printIframe = document.getElementById(iframeID) || document.body.appendChild(document.createElement('iframe'));
      const printWindow = printIframe.contentWindow;
      const prtContent = document.getElementById('exported-months');
      const removeIframe = function() {
        printWindow.document.open();
        printWindow.document.close();
      };
      printIframe.id = iframeID;
      printIframe.className = 'position-fixed fixed-bottom w-0 h-0 border-0 invisible';
      printWindow.document.open();
      printWindow.document.write('<!DOCTYPE html><html><head>' + document.head.innerHTML + '</head><body>' + prtContent.innerHTML + '</body></html>');
      printWindow.document.title = `${intl.get('Calendar')}–${start}${start === end ? '' : '–' + end}.pdf`;
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
      };
      printWindow.onafterprint = removeIframe;
      setTimeout(() => {
        this.setState({
          isExporting: false,
          exportedMonths: []
        });
        this.toggleTimeRangeDialog();
      });
    });
  }

  renderBtnGroups = () => {
    return (
      <div className="d-flex align-items-center">
        <span className="op-icon mr-2" onClick={this.toggleTimeRangeDialog}>
          <i className="dtable-font dtable-icon-print"></i>
        </span>
        <span className="op-icon mr-2" onClick={this.toggleViewSettingPanel}>
          <i className="dtable-font dtable-icon-settings"></i>
        </span>
        <span className="dtable-font dtable-icon-x op-icon" onClick={this.onPluginToggle}></span>
      </div>
    );
  }

  onAddView = (viewName) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let selectedViewIdx = updatedViews.length;
    let _id = generatorViewId(updatedViews);
    let newView = new View({_id, name: viewName});
    updatedViews.push(newView);
    let { settings } = updatedViews[selectedViewIdx];
    let isViewSettingPanelOpen = !this.isValidViewSettings(settings);
    plugin_settings.views = updatedViews;
    this.setState({
      plugin_settings,
      selectedViewIdx,
      isViewSettingPanelOpen
    }, () => {
      this.storeSelectedViewId(updatedViews[selectedViewIdx]._id);
      this.dtable.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      this.viewsTabs && this.viewsTabs.setViewsTabsScroll();
    });
  }

  onRenameView = (viewName) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let updatedView = plugin_settings.views[selectedViewIdx];
    updatedView = Object.assign({}, updatedView, {name: viewName});
    plugin_settings.views[selectedViewIdx] = updatedView;
    this.setState({
      plugin_settings
    }, () => {
      this.dtable.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  }

  onDeleteView = (viewId) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;
    let viewIdx = updatedViews.findIndex(v => v._id === viewId);
    selectedViewIdx = updatedViews.length - 1 === viewIdx ? viewIdx - 1 : selectedViewIdx;
    if (viewIdx > -1) {
      updatedViews.splice(viewIdx, 1);
      let { settings } = updatedViews[selectedViewIdx];
      let isViewSettingPanelOpen = !this.isValidViewSettings(settings);
      plugin_settings.views = updatedViews;
      this.setState({
        plugin_settings,
        selectedViewIdx,
        isViewSettingPanelOpen
      }, () => {
        this.storeSelectedViewId(updatedViews[selectedViewIdx]._id);
        this.dtable.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      });
    }
  }

  onSelectView = (viewId) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let viewIdx = updatedViews.findIndex(v => v._id === viewId);
    if (viewIdx > -1) {
      let { settings } = updatedViews[viewIdx];
      const isViewSettingPanelOpen = !this.isValidViewSettings(settings);
      const rows = this.getPluginViewRows(settings);
      this.setState({selectedViewIdx: viewIdx, isViewSettingPanelOpen, rows});
      this.storeSelectedViewId(viewId);
    }
  }

  storeSelectedViewId = (viewId) => {
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS);
    selectedViewIds[dtableUuid] = viewId;
    window.localStorage.setItem(KEY_SELECTED_VIEW_IDS, JSON.stringify(selectedViewIds));
  }

  isValidViewSettings = (settings) => {
    return settings && Object.keys(settings).length > 0;
  }

  getSelectedTable = (tables, settings = {}) => {
    let selectedTable = this.dtable.getTableByName(settings[SETTING_KEY.TABLE_NAME]);
    if (!selectedTable) {
      return tables[0];
    }
    return selectedTable;
  }

  onModifyViewSettings = (updated) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;
    let updatedView = plugin_settings.views[selectedViewIdx];
    let { settings: updatedSettings} = updatedView || {};
    updatedSettings = Object.assign({}, updatedSettings, updated);
    updatedView.settings = updatedSettings;
    updatedViews[selectedViewIdx] = updatedView;
    plugin_settings.views = updatedViews;
    this.setState({plugin_settings}, () => {
      this.dtable.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  }

  getSelectedView = (table, settings = {}) => {
    return this.dtable.getViewByName(table, settings[SETTING_KEY.VIEW_NAME]);
  }

  getCurrentSettings = () => {
    let { plugin_settings, selectedViewIdx } = this.state;
    if (!plugin_settings || !plugin_settings.views || !Array.isArray(plugin_settings.views)) {
      return {};
    }
    return plugin_settings.views[selectedViewIdx] || {};
  }

  modifyRow = (table, row, updated) => {
    this.dtable.modifyRow(table, row, updated);
  }

  appendRow = (table, rowData) => {
    this.dtable.appendRow(table, rowData);
  }

  render() {
    const isDesktop = checkDesktop();
    let { isLoading, showDialog, plugin_settings, selectedViewIdx,
      rows,
      isViewSettingPanelOpen,
      isTimeRangeDialogOpen
    } = this.state;
    if (isLoading || !showDialog) {
      return '';
    }

    let { views } = plugin_settings;
    let selectedPluginView = views[selectedViewIdx];
    let { settings } = selectedPluginView || { settings: {} };
    let tables = this.dtable.getTables();
    let selectedTable = this.getSelectedTable(tables, settings);
    let tableViews = this.dtable.getViews(selectedTable);
    let selectedTableView = this.getSelectedView(selectedTable, settings) || tableViews[0];

    let columns = this.dtable.getColumns(selectedTable);
    let currentSetting = this.getCurrentSettings();

    const ViewsTabsEl = (
      <ViewsTabs
        ref={ref => this.viewsTabs = ref}
        views={views}
        selectedViewIdx={selectedViewIdx}
        onAddView={this.onAddView}
        onRenameView={this.onRenameView}
        onDeleteView={this.onDeleteView}
        onSelectView={this.onSelectView}
      />
    );

    return (
      <Modal isOpen={true} toggle={this.onPluginToggle} className="dtable-plugin calendar-plugin-container" size="lg" zIndex={CALENDAR_DIALOG_MODAL}>
        <ModalHeader className="plugin-header h-7" close={this.renderBtnGroups()}>
          <div className="logo-title d-flex align-items-center">
            <img className="plugin-logo mr-2" src={icon} alt="" width="24" />
            <span className="plugin-title">{intl.get('Calendar')}</span>
          </div>
          {isDesktop && ViewsTabsEl}
        </ModalHeader>
        {!isDesktop && <div className="h-7 d-flex pr-4 border-bottom">{ViewsTabsEl}</div>}
        <ModalBody className="calendar-plugin-content">
          <ReactBigCalendar
            activeTable={selectedTable}
            activeView={selectedTableView}
            selectedViewIdx={selectedViewIdx}
            columns={columns}
            rows={rows}
            getRowById={this.dtable.getRowById}
            appendRow={this.appendRow}
            modifyRow={this.modifyRow}
            setting={currentSetting}
            CellType={this.cellType}
            optionColors={this.optionColors}
            highlightColors={this.highlightColors}
            collaborators={this.collaborators}
            onRowExpand={this.onRowExpand}
            onInsertRow={this.onInsertRow}
            hideViewSettingPanel={this.hideViewSettingPanel}
            isExporting={this.state.isExporting}
            exportedMonths={this.state.exportedMonths}
          />
          {isViewSettingPanelOpen &&
            <ViewSetting
              tables={tables}
              views={tableViews}
              settings={settings}
              columns={columns}
              CellType={this.cellType}
              columnIconConfig={this.columnIconConfig}
              onModifyViewSettings={this.onModifyViewSettings}
              toggleViewSettingPanel={this.toggleViewSettingPanel}
            />
          }
          {isTimeRangeDialogOpen &&
            <TimeRangeDialog
              isExporting={this.state.isExporting}
              onConfirmTimeRange={this.exportSelectedMonths}
              toggleDialog={this.toggleTimeRangeDialog}
            />
          }
        </ModalBody>
      </Modal>
    );
  }
}

App.propTypes = propTypes;

export default App;
