import areInputsEqual from './are-inputs-equal';


export default function memoizeOne(resultFn, isEqual = areInputsEqual) {
  let lastArgs = [];
  let lastResult;
  let calledOnce = false;

  return (...newArgs) => {
    if (calledOnce && isEqual(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(null, newArgs);
    calledOnce = true;
    lastArgs = newArgs;
    return lastResult;
  };
}
