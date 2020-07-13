
const config = {
  APIToken: "",
  server: "https://dev.seafile.com/dtable-web",
  workspaceID: "",
  dtableName: "",
  lang: "zh-cn"
};

const dtablePluginConfig = Object.assign({}, config, {server: config.server.replace(/\/+$/, "")}) ;
window.dtablePluginConfig = dtablePluginConfig;