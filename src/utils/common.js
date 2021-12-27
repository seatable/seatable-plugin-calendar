import { SORT_TYPE } from '../constants/sort-constants';

// creates an object composed of the own and inherited enumerable property paths of object that are not omitted
export function omit(object, propertyName) {
  let result = {};
  if (!isObject(object)) {
    return result;
  }
  for (let key in object) {
    if ((Array.isArray(propertyName) && !propertyName.includes(key)) || propertyName !== key) {
      result[key] = object[key];
    }
  }
  return result;
}

// creates an array of elements split into groups the length of size
export function chunk(array, size = 1) {
  let result = [];
  const length = array == null ? 0 : array.length;
  if (!length || size < 1) {
    return [];
  }
  let index = 0;
  let resIndex = 0;
  result = new Array(Math.ceil(length / size));

  while (index < length) {
    result[resIndex++] = slice(array, index, (index += size));
  }
  return result;
}

/**
 * Assigns own and inherited enumerable string keyed properties of source
 * objects to the destination object for all destination properties that
 * resolve to `undefined`. Source objects are applied from left to right.
 * Once a property is set, additional values of the same property are ignored.
 *
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see defaultsDeep
 * @example
 *
 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 })
 * // => { 'a': 1, 'b': 2 }
 */
export function defaults(object, ...sources) {
  object = Object(object);
  sources.forEach((source) => {
    if (source != null) {
      source = Object(source);
      for (const key in source) {
        const value = object[key];
        if (value === undefined ||
            (eq(value, Object.prototype[key]) && !Object.prototype.hasOwnProperty.call(object, key))) {
          object[key] = source[key];
        }
      }
    }
  });
  return object;
}

export const range = createRange();

function createRange(fromRight) {
  return (start, end, step) => {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    step = step === undefined ? (start < end ? 1 : -1) : step;
    return baseRange(start, end, step, fromRight);
  };
}

/**
 * The base implementation of `range` and `rangeRight` which doesn't
 * coerce arguments.
 *
 * @private
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @param {number} step The value to increment or decrement by.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Array} Returns the range of numbers.
 */
function baseRange(start, end, step, fromRight) {
  let index = -1;
  let length = Math.max(Math.ceil((end - start) / (step || 1)), 0);
  const result = new Array(length);

  while (length--) {
    result[fromRight ? length : ++index] = start;
    start += step;
  }
  return result;
}

function isObject(value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

function slice(array, start, end) {
  let length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  start = start == null ? 0 : start;
  end = end === undefined ? length : end;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  let index = -1;
  const result = new Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * comparison between two values to determine if they are equivalent.
 *
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * const object = { 'a': 1 }
 * const other = { 'a': 1 }
 *
 * eq(object, object)
 * // => true
 *
 * eq(object, other)
 * // => false
 *
 * eq('a', 'a')
 * // => true
 *
 * eq('a', Object('a'))
 * // => false
 *
 * eq(NaN, NaN)
 * // => true
 */
function eq(value, other) {
  return value === other;
}

export const getDtableUuid = () => {
  if (window.dtable) {
    return window.dtable.dtableUuid;
  }
  return window.dtablePluginConfig.dtableUuid;
};

export const getDtableLang = () => {
  if (window.dtable) {
    return window.dtable.lang;
  }
  return 'zh-cn';
};

export const getDtablePermission = () => {
  if (window.dtable) {
    return window.dtable.permission;
  }
  return 'rw';
};

export const generatorBase64Code = (keyLength = 4) => {
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < keyLength; i++) {
    key += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return key;
};

export const generatorViewId = (views) => {
  let view_id, isUnique = false;
  while (!isUnique) {
    view_id = generatorBase64Code(4);

    // eslint-disable-next-line
    isUnique = views.every(item => {return item._id !== view_id;});
    if (isUnique) {
      break;
    }
  }
  return view_id;
};

export const isMobile = (typeof (window) !== 'undefined') && (window.innerWidth < 768 || navigator.userAgent.toLowerCase().match(/(ipod|ipad|iphone|android|coolpad|mmp|smartphone|midp|wap|xoom|symbian|j2me|blackberry|wince)/i) != null);

// Not suitable for some IOS Safari
export const isIOS = typeof (window) !== 'undefined' && navigator.userAgent.toLowerCase().match(/(ipod|ipad|iphone)/i) !== null;

export const isSafari = typeof (window) !== 'undefined' && /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome/.test(navigator.userAgent.toLowerCase());

export const isValidEmail = (email) => {
  const reg = /^[A-Za-zd]+([-_.][A-Za-zd]+)*@([A-Za-zd]+[-.])+[A-Za-zd]{2,6}$/;
  return reg.test(email);
};

export const getMediaUrl = () => {
  if (window.dtable) {
    return window.dtable.mediaUrl;
  }
  return window.dtablePluginConfig.mediaUrl;
};

export const getKnownCreatorByEmail = (email, collaborators, collaboratorsCache) => {
  const mediaUrl = getMediaUrl();
  const defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
  if (email === 'anonymous') {
    return {
      name: 'anonymous',
      avatar_url: defaultAvatarUrl,
    };
  }
  let collaborator = Array.isArray(collaborators) && collaborators.find(collaborator => collaborator.email === email);
  if (collaborator) return collaborator;
  if (!isValidEmail(email)) {
    collaborator = {
      name: email,
      avatar_url: defaultAvatarUrl,
    };
    collaboratorsCache[email] = collaborator;
    return collaborator;
  }
  return collaboratorsCache[email] || null;
};

export const sortDate = (currCellVal, nextCellVal, sortType) => {
  if (!currCellVal) {
    return 1;
  }

  if (!nextCellVal) {
    return -1;
  }
  if (currCellVal > nextCellVal) {
    return sortType === SORT_TYPE.UP ? 1 : -1;
  }
  if (currCellVal < nextCellVal){
    return sortType === SORT_TYPE.UP ? -1 : 1;
  }
  return 0;
};
