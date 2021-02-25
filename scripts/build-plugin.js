const JSZip = require('jszip');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const paths = require('../config/paths');

const config = {
  dir: paths.appBuild + '/static/'
};

// verify zip output path against the file-system
const zipPathFromZipFile = (file) => path.join(paths.zipPath, file);
if (!fs.existsSync(zipPathFromZipFile('.'))) {
  console.error(`fatal: paths.zipPath: '${paths.zipPath}' does not exists`);
  process.exit(1);
}

const zip = new JSZip();

// build file
const jsFilePath = getFullFileName(config.dir + 'js');
const cssFilePath = getFullFileName(config.dir + 'css');

zip.folder('task');
zip.folder('task/media');

zip.file('task/main.js', getFileContent(jsFilePath));
if (isDirExist(paths.appBuild + '/static/css') && cssFilePath) {
  zip.file('task/media/main.css', getFileContent(cssFilePath));
}

if (isFileExist(paths.pluginConfigPath, 'icon.png')) {
  const iconPath = path.join(paths.pluginConfigPath, 'icon.png');
  zip.file('task/media/icon.png', fs.readFileSync(iconPath));
}

if (isFileExist(paths.pluginConfigPath, 'card_image.png')) {
  const cardImagePath = path.join(paths.pluginConfigPath, 'card_image.png');
  zip.file('task/media/card_image.png', fs.readFileSync(cardImagePath));
}

// info file
const pluginInfoFilePath = path.join(paths.pluginConfigPath, 'info.json');
const pluginInfoContent = JSON.parse(getFileContent(pluginInfoFilePath));

const pluginInfoContentExpand = {
  'last_modified': moment().format(),
  'has_css': !!(isDirExist(paths.appBuild + '/static/css') && cssFilePath),
  'has_icon': isFileExist(paths.pluginConfigPath, 'icon.png'),
  'has_card_image': isFileExist(paths.pluginConfigPath, 'card_image.png')
};

let jsonFileContent = Object.assign({}, pluginInfoContent, pluginInfoContentExpand);

zip.file('task/info.json', JSON.stringify(jsonFileContent, null, '  '));

zip.generateAsync({type: 'nodebuffer'}).then(function(content) {
  let zip = `${pluginInfoContent.name}-${pluginInfoContent.version}.zip`;
  { /* do backups similar to cp(1) --backup=numbered */
    const zipPath = zipPathFromZipFile(zip);
    let number = 1;
    let bakFile = zipPath + `.~${number}~`;
    if (fs.existsSync(zipPath)) {
      while (fs.existsSync(bakFile)) {
        bakFile = zipPath + `.~${number++}~`;
      }
      console.log(`overwriting '${zip}' (backup: '${bakFile.replace(/^.*\/([^/]+)$/, '$1')}')`);
      fs.renameSync(zipPath , bakFile);
    }
  }
  fs.writeFile(zipPathFromZipFile(zip), content, function(err) {
    if (err) {
      console.log(zip + ' failed');
      console.log(err);
      return;
    }
    console.log(zip + ' successful');
  });
});

function isDirExist(path) {
  return fs.existsSync(path);
}

function isFileExist(overallPath, fileName) {
  return fs.readdirSync(overallPath).includes(fileName);
}

/**
 * Get the full file path
 * @param  {string} overallPath File parent path
 */
function getFullFileName(overallPath) {
  if (!isDirExist(overallPath)) {
    return false;
  }
  const moduleFileExtensions = ['js', 'css'];
  const fileName = fs.readdirSync(overallPath).find(fileItem => {
    let extension = fileItem.substring(fileItem.lastIndexOf('.') + 1);
    if (moduleFileExtensions.includes(extension)) {
      return fileItem;
    }
  });
  if (!fileName) {
    return false;
  }
  return path.join(overallPath, fileName);
}

/**
 * Get file content
 * @param  {string} overallPath full file path
 */
function getFileContent (overallPath) {
  // Specifying encoding returns a string, otherwise returns a Buffer
  return fs.readFileSync(overallPath, {encoding: 'utf-8'});
}
