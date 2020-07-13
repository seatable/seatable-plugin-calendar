
const config = {
  APIToken: "a616d945e5afcb8c5a23d9ce22a84a6eaf66bf07",
  server: "https://dev.seafile.com/dtable-web",
  workspaceID: "5",
  dtableName: "插件测试",
  lang: "zh-cn"
};

const dtablePluginConfig = Object.assign({}, config, {server: config.server.replace(/\/+$/, "")}) ;
window.dtablePluginConfig = dtablePluginConfig;