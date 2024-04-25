// utils for accessibility
function HandleKeyDownFactory(keyCode, fn){
  return function (e){
    if (e.keyCode === keyCode){
      if (typeof fn === 'function') fn(e);
    }
  };
}

export function handleEnterKeyDown(fn){
  return HandleKeyDownFactory(13, fn);
}

export function handleShiftKeyDown(fn){
  return HandleKeyDownFactory(16, fn);
}


