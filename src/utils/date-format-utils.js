import dayjs from 'dayjs';
const zhCN = require('dayjs/locale/zh-cn');
const zhTW = require('dayjs/locale/zh-tw');
const en = require('dayjs/locale/en');
const fr = require('dayjs/locale/fr');
const de = require('dayjs/locale/de');
const es = require('dayjs/locale/es');
const pl = require('dayjs/locale/pl');
const cs = require('dayjs/locale/cs');
const ru = require('dayjs/locale/ru');

function formatDayjsLocale() {
  const lang = window.dtable ? window.dtable.lang : 'zh-cn';
  let now;
  switch (lang) {
    case 'zh-cn':
      now = dayjs().locale(zhCN);
      break;
    case 'zh-tw':
      now = dayjs().locale(zhTW);
      break;
    case 'en':
      now = dayjs().locale(en);
      break;
    case 'fr':
      now = dayjs().locale(fr);
      break;
    case 'de':
      now = dayjs().locale(de);
      break;
    case 'es':
      now = dayjs().locale(es);
      break;
    case 'es-ar':
      now = dayjs().locale(es);
      break;
    case 'es-mx':
      now = dayjs().locale(es);
      break;
    case 'pl':
      now = dayjs().locale(pl);
      break;
    case 'cs':
      now = dayjs().locale(cs);
      break;
    case 'ru':
      now = dayjs().locale(ru);
      break;
    default:
      now = dayjs().locale(zhCN);
  }
  return now;
}

export { formatDayjsLocale };
