import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import dayjs from 'dayjs';
import classnames from 'classnames';
import {
  CellType, SELECT_OPTION_COLORS, getTableByName, getViewByName,
  getNonArchiveViews, getNonPrivateViews, getViewShownColumns,
} from 'dtable-utils';
import { toaster } from 'dtable-ui-component';
import ReactBigCalendar from './ReactBigCalendar';
import { PLUGIN_NAME, SETTING_KEY, DATE_FORMAT, CALENDAR_VIEWS, KEY_SELECTED_CALENDAR_VIEW } from './constants';
import ViewsTabs from './components/views-tabs';
import ViewSetting from './components/view-setting';
import TimeRangeDialog from './components/dialog/time-range-dialog';
import { generatorViewId, getDtableUuid, isIOS, isMobile, isSafari } from './utils/common';
import View from './model/view';
import icon from './image/icon.png';
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
  isDevelopment: PropTypes.bool,
  showDialog: PropTypes.bool,
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
      rowsColor: {},
      isTimeRangeDialogOpen: false,
      exportedMonths: [],
    };
    this.isMobile = isMobile;
    this.isIosMobile = isMobile && isIOS;
    this.isSafari = isSafari;
    this.initCalendarViews();
  }

  componentDidMount() {
    this.initPluginDTableData();
  }

  componentWillUnmount() {
    this.unsubscribeLocalDtableChanged();
    this.unsubscribeRemoteDtableChanged();
  }

  async initPluginDTableData() {
    if (this.props.isDevelopment) {
      // local develop
      window.dtableSDK.subscribe('dtable-connect', () => { this.onDTableConnect(); });
    }
    this.unsubscribeLocalDtableChanged = window.dtableSDK.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = window.dtableSDK.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData(true);
  }

  onDTableConnect = () => {
    this.resetData();
  };

  onDTableChanged = () => {
    this.resetData();
  };

  resetData = (init = false) => {
    let { isViewSettingPanelOpen } = this.state;
    let plugin_settings = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || {};
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

    let rowColorsMap = {};
    SELECT_OPTION_COLORS.forEach((optionColor) => {
      rowColorsMap[optionColor.COLOR] = optionColor.TEXT_COLOR;
    });
    this.rowColorsMap = rowColorsMap;

    const selectedPluginView = views[selectedViewIdx];
    const rows = selectedPluginView ? this.getPluginViewRows(selectedPluginView.settings) : [];
    const rowsColor = this.getRowsColor(selectedPluginView.settings);
    this.setState({
      isLoading: false,
      plugin_settings,
      selectedViewIdx,
      isViewSettingPanelOpen,
      rows,
      rowsColor
    });
  };

  initCalendarViews = () => {
    if (this.isMobile) {
      this.calendarViews = [
        CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH, CALENDAR_VIEWS.AGENDA,
      ];
    } else {
      this.calendarViews = [
        CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH, CALENDAR_VIEWS.WEEK,
        CALENDAR_VIEWS.DAY, CALENDAR_VIEWS.AGENDA,
      ];
    }
  };

  getPluginViewRows = (settings) => {
    const selectedTable = this.getSelectedTable(settings);
    const selectedTableView = this.getSelectedView(selectedTable, settings);
    return this.getRows(selectedTable, selectedTableView);
  };

  getSelectedViewIds = (key) => {
    const selectedViewIds = window.localStorage.getItem(key);
    return selectedViewIds ? JSON.parse(selectedViewIds) : {};
  };

  onPluginToggle = () => {
    this.setState({ showDialog: false });
    window.app.onClosePlugin && window.app.onClosePlugin();
  };

  getRows = (table, view) => {
    const { name: tableName } = table;
    const { name: viewName } = view;
    let rows = [];
    window.dtableSDK.forEachRow(tableName, viewName, (row) => {
      rows.push(row);
    }, { convertLinkID: true });
    return rows;
  };

  updateSettings = (table, start_date_column_key, label_column_key, end_date_column_key) => {
    const { _id } = table;
    let { plugin_settings } = this.state;
    plugin_settings[_id] = { start_date_column_key, end_date_column_key, label_column_key };
    this.setState({ plugin_settings }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  handleRowExpand = (row, table) => {
    if (window.app.expandRow) {
      window.app.expandRow(row, table);
    }
  };

  onInsertRow = (rowData, activeTable, activeView, rowId) => {
    const initData = window.dtableSDK.getInsertedRowInitData(activeView, activeTable, rowId);
    const newRowData = Object.assign({}, initData, rowData);
    window.dtableSDK.appendRow(activeTable, newRowData, activeView);
    const viewRows = window.dtableSDK.getViewRows(activeView, activeTable);
    const insertedRow = viewRows[viewRows.length - 1];
    if (insertedRow && window.app.expandRow) {
      window.app.expandRow(insertedRow, activeTable);
    }
  };

  toggleViewSettingPanel = () => {
    this.setState({ isViewSettingPanelOpen: !this.state.isViewSettingPanelOpen });
  };

  hideViewSettingPanel = () => {
    if (this.state.isViewSettingPanelOpen) {
      this.setState({ isViewSettingPanelOpen: false });
    }
  };

  toggleTimeRangeDialog = () => {
    this.setState({ isTimeRangeDialogOpen: !this.state.isTimeRangeDialogOpen });
  };

  exportSelectedMonths = (start, end) => {
    let exportedMonths = [];
    const startMonth = dayjs(start, DATE_FORMAT.YEAR_MONTH);
    const endMonth = dayjs(end, DATE_FORMAT.YEAR_MONTH);
    const diffMonthAmount = endMonth.diff(startMonth, 'months');
    for (let i = 0; i < diffMonthAmount + 1; i++) {
      // `push` the 1st day of each month, in the native Date object
      exportedMonths.push(dayjs(startMonth).add(i, 'months').date(1).toDate());
    }
    const prtContent = document.getElementById('exported-months');

    if (!document.head?.innerHTML || !prtContent?.innerHTML) {
      toaster.danger(intl.get('Exporting_failed'));
      exportedMonths.length = 0;
      return;
    }
    
    this.setState({
      isExporting: true,
      exportedMonths: exportedMonths
    }, () => {
      const iframeID = 'iframe-for-print';
      const printIframe = document.getElementById(iframeID) || document.body.appendChild(document.createElement('iframe'));
      const printWindow = printIframe.contentWindow;
      const removeIframe = function () {
        printWindow.document.open();
        printWindow.document.close();
      };
      printIframe.id = iframeID;
      printIframe.className = 'invisible w-0 h-0 border-0 position-fixed fixed-bottom';
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
  };

  renderBtnGroups = () => {
    return (
      <div className="d-flex align-items-center plugin-calendar-operators">
        {!this.isMobile &&
          <span className="mr-1 op-icon" onClick={this.toggleTimeRangeDialog}>
            <i className="dtable-font dtable-icon-print"></i>
          </span>
        }
        <span className="mr-1 op-icon" onClick={this.toggleViewSettingPanel}>
          <i className="dtable-font dtable-icon-set-up"></i>
        </span>
        <span className="dtable-font dtable-icon-x op-icon btn-close" onClick={this.onPluginToggle}></span>
      </div>
    );
  };

  onAddView = (viewName) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let selectedViewIdx = updatedViews.length;
    let _id = generatorViewId(updatedViews);
    let newView = new View({ _id, name: viewName });
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
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      this.viewsTabs && this.viewsTabs.setViewsTabsScroll();
    });
  };

  onRenameView = (viewName) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let updatedView = plugin_settings.views[selectedViewIdx];
    updatedView = Object.assign({}, updatedView, { name: viewName });
    plugin_settings.views[selectedViewIdx] = updatedView;
    this.setState({
      plugin_settings
    }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

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
        window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      });
    }
  };

  // move view, update `selectedViewIdx`
  onMoveView = (targetViewID, targetIndexViewID, relativePosition) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;

    let viewIDMap = {};
    updatedViews.forEach((view, index) => {
      viewIDMap[view._id] = view;
    });
    const targetView = viewIDMap[targetViewID];
    const targetIndexView = viewIDMap[targetIndexViewID];
    const selectedView = updatedViews[selectedViewIdx];

    const originalIndex = updatedViews.indexOf(targetView);
    let targetIndex = updatedViews.indexOf(targetIndexView);
    // `relativePosition`: 'before'|'after'
    targetIndex += relativePosition == 'before' ? 0 : 1;

    if (originalIndex < targetIndex) {
      if (targetIndex < updatedViews.length) {
        updatedViews.splice(targetIndex, 0, targetView);
      } else {
        // drag it to the end
        updatedViews.push(targetView);
      }
      updatedViews.splice(originalIndex, 1);
    } else {
      updatedViews.splice(originalIndex, 1);
      updatedViews.splice(targetIndex, 0, targetView);
    }

    const newSelectedViewIndex = updatedViews.indexOf(selectedView);

    plugin_settings.views = updatedViews;
    this.setState({
      plugin_settings,
      selectedViewIdx: newSelectedViewIndex
    }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  onSelectView = (viewId) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let viewIdx = updatedViews.findIndex(v => v._id === viewId);
    if (viewIdx > -1) {
      let { settings } = updatedViews[viewIdx];
      const isViewSettingPanelOpen = !this.isValidViewSettings(settings);
      const rows = this.getPluginViewRows(settings);
      const rowsColor = this.getRowsColor(settings);
      this.setState({ selectedViewIdx: viewIdx, isViewSettingPanelOpen, rows, rowsColor });
      this.storeSelectedViewId(viewId);
    }
  };

  storeSelectedViewId = (viewId) => {
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS);
    selectedViewIds[dtableUuid] = viewId;
    window.localStorage.setItem(KEY_SELECTED_VIEW_IDS, JSON.stringify(selectedViewIds));
  };

  isValidViewSettings = (settings) => {
    return settings && Object.keys(settings).length > 0;
  };

  getSelectedTable = (settings = {}) => {
    const tables = window.dtableSDK.getTables();
    return getTableByName(tables, settings[SETTING_KEY.TABLE_NAME]) || tables[0];
  };

  onModifyViewSettings = (updated) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;
    let updatedView = plugin_settings.views[selectedViewIdx];
    updatedView.settings = updated;
    updatedViews[selectedViewIdx] = updatedView;
    plugin_settings.views = updatedViews;
    this.setState({ plugin_settings }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  getSelectedView = (table, settings = {}) => {
    const selectedView = getViewByName(table.views, settings[SETTING_KEY.VIEW_NAME]);
    if (!selectedView) {
      const tableViews = getNonPrivateViews(getNonArchiveViews(table.views));
      return tableViews[0];
    }
    return selectedView;
  };

  modifyRow = (table, row, updated) => {
    window.dtableSDK.modifyRow(table, row, updated);
  };

  appendRow = (table, rowData) => {
    window.dtableSDK.appendRow(table, rowData);
  };

  getRowsColor = (settings) => {
    const configuredUseRowColor = settings[SETTING_KEY.COLORED_BY_ROW_COLOR];
    if (!configuredUseRowColor) {
      return {};
    }
    const selectedTable = this.getSelectedTable(settings);
    const selectedTableView = this.getSelectedView(selectedTable, settings);
    const viewRows = window.dtableSDK.getViewRows(selectedTableView, selectedTable);
    return window.dtableSDK.getViewRowsColor(viewRows, selectedTableView, selectedTable);
  };

  getRelatedUsersFromLocal = () => {
    let { collaborators, state } = window.app;
    if (!collaborators) {
      // dtable app
      return state && state.collaborators;
    }
    return collaborators; // local develop
  };

  getSelectedGridView = (table, view) => {
    if (!table || !view) {
      return CALENDAR_VIEWS.MONTH;
    }
    const keySelectedCalendarView = JSON.parse(localStorage.getItem(KEY_SELECTED_CALENDAR_VIEW)) || {};
    const dtableUuid = getDtableUuid();
    const key = `${dtableUuid}_${table._id}_${view._id}`;
    const calendarView = keySelectedCalendarView[key];
    return this.calendarViews.indexOf(calendarView) < 0 ? CALENDAR_VIEWS.MONTH : calendarView;
  };

  getTableFormulaRows = (table, view) => {
    const rows = window.dtableSDK.getViewRows(view, table);
    return window.dtableSDK.getTableFormulaResults(table, rows);
  };

  render() {
    const {
      isLoading, showDialog, plugin_settings, selectedViewIdx,
      rows, rowsColor, isViewSettingPanelOpen, isTimeRangeDialogOpen,
    } = this.state;
    if (isLoading || !showDialog) {
      return '';
    }

    const { views } = plugin_settings;
    const selectedPluginView = views[selectedViewIdx];
    const { settings } = selectedPluginView || { settings: {} };
    const tables = window.dtableSDK.getTables();
    const selectedTable = this.getSelectedTable(settings);
    const tableViews = getNonPrivateViews(getNonArchiveViews(selectedTable.views));
    let selectedTableView = this.getSelectedView(selectedTable, settings);
    const formulaRows = this.getTableFormulaRows(selectedTable, selectedTableView);
    selectedTableView = Object.assign({}, selectedTableView, { formula_rows: formulaRows });
    const columns = getViewShownColumns(selectedTableView, selectedTable.columns);
    const modalClassNames = classnames(
      'dtable-plugin',
      'calendar-plugin-container',
      {
        'plugin-calendar-mobile': this.isMobile
      }
    );
    const ViewsTabsEl = (
      <ViewsTabs
        ref={ref => this.viewsTabs = ref}
        views={views}
        selectedViewIdx={selectedViewIdx}
        isMobile={this.isMobile}
        onAddView={this.onAddView}
        onRenameView={this.onRenameView}
        onDeleteView={this.onDeleteView}
        onSelectView={this.onSelectView}
        onMoveView={this.onMoveView}
      />
    );

    // set default value for 'color field' in settings
    const singleSelectColumn = columns.filter(item => item.type == CellType.SINGLE_SELECT)[0];
    if (singleSelectColumn) {
      if (!settings[SETTING_KEY.COLORED_BY_ROW_COLOR] && settings[SETTING_KEY.COLUMN_COLOR] == undefined) {
        settings[SETTING_KEY.COLUMN_COLOR] = singleSelectColumn.name;
      }
    }

    return (
      <div className={modalClassNames} ref={ref => this.plugin = ref}>
        <div className={`d-flex plugin-header flex-shrink-0 h-7 ${this.isMobile ? 'justify-content-between' : ''}`}>
          <div className="logo-title d-flex align-items-center">
            <img className="mr-2 plugin-logo" src={icon} alt="" width="24" />
            <span className="plugin-title">{intl.get('Calendar')}</span>
          </div>
          {!this.isMobile && ViewsTabsEl}
          {this.renderBtnGroups()}
        </div>
        {this.isMobile && <div className="flex-shrink-0 pl-4 pr-4 h-7 d-flex border-bottom">{ViewsTabsEl}</div>}
        <div className="calendar-plugin-content">
          <ReactBigCalendar
            ref={ref => this.calendar = ref}
            activeTable={selectedTable}
            activeView={selectedTableView}
            selectedViewIdx={selectedViewIdx}
            columns={columns}
            rows={rows}
            rowsColor={rowsColor}
            calendarViews={this.calendarViews}
            appendRow={this.appendRow}
            modifyRow={this.modifyRow}
            settings={settings}
            collaborators={this.getRelatedUsersFromLocal()}
            formulaRows={formulaRows}
            rowColorsMap={this.rowColorsMap}
            getSelectedGridView={this.getSelectedGridView}
            handleRowExpand={this.handleRowExpand}
            onInsertRow={this.onInsertRow}
            hideViewSettingPanel={this.hideViewSettingPanel}
            isExporting={this.state.isExporting}
            exportedMonths={this.state.exportedMonths}
            isMobile={this.isMobile}
            isIosMobile={this.isIosMobile}
            isSafari={this.isSafari}
          />
          {isTimeRangeDialogOpen &&
            <TimeRangeDialog
              isExporting={this.state.isExporting}
              onConfirmTimeRange={this.exportSelectedMonths}
              toggleDialog={this.toggleTimeRangeDialog}
            />
          }
        </div>
        {isViewSettingPanelOpen &&
          <ViewSetting
            tables={tables}
            views={tableViews}
            settings={settings}
            columns={columns}
            selectedGridView={this.getSelectedGridView(selectedTable, selectedTableView)}
            onModifyViewSettings={this.onModifyViewSettings}
            toggleViewSettingPanel={this.toggleViewSettingPanel}
          />
        }
      </div>
    );
  }
}

App.propTypes = propTypes;

export default App;
