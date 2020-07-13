
const config = {
  APIToken: "1bec8558f23811cc28e7d895d8549b6e6ce69e59",
  server: "https://dev.seafile.com/dtable-web",
  workspaceID: "5",
  dtableName: "插件测试",
  lang: "zh-cn"
};

const dtablePluginConfig = Object.assign({}, config, {server: config.server.replace(/\/+$/, "")}) ;
window.dtablePluginConfig = dtablePluginConfig;