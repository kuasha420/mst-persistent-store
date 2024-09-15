import { PartialDeep } from '../types/partial-deep';

const isObject = (obj: any) => {
  if (typeof obj === 'object' && obj !== null) {
    if (typeof Object.getPrototypeOf === 'function') {
      const prototype = Object.getPrototypeOf(obj);
      return prototype === Object.prototype || prototype === null;
    }

    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  return false;
};

export default function recursiveObjectSpread<T extends Record<string, any>>(
  original: T,
  overrides?: PartialDeep<T>
): T {
  if (!overrides) {
    return original;
  }

  const result = { ...original };

  Object.keys(overrides).forEach((key) => {
    const originalValue = original[key];
    const overrideValue = overrides[key];

    if (originalValue && overrideValue) {
      if (isObject(originalValue) && isObject(overrideValue)) {
        // If the override value is an empty object, we should replace the original value with it
        if (Object.keys(overrideValue).length === 0) {
          // @ts-ignore -- Too complex for TS to understand
          result[key] = overrideValue;
        } else {
          // @ts-ignore -- Too complex for TS to understand
          result[key] = recursiveObjectSpread(originalValue, overrideValue);
        }
      } else {
        // @ts-ignore -- Too complex for TS to understand
        result[key] = overrideValue;
      }
    }
  });

  return result;
}
