import { PartialDeep } from '../types/partial-deep';
import isObjectLike from './is-object-like';

export default function deepObjectOverride<T extends Record<string, any>>(
  original: T,
  overrides?: PartialDeep<T>
): T {
  if (!overrides) {
    return original;
  }

  const result = { ...original };

  Object.keys(overrides).forEach((_key) => {
    const key = _key as keyof T;
    const originalValue = original[key];
    const overrideValue = overrides[key];

    if (originalValue !== undefined && overrideValue !== undefined) {
      if (isObjectLike(originalValue) && isObjectLike(overrideValue)) {
        // If the override value is an empty object, we should replace the original value with it
        if (Object.keys(overrideValue).length === 0) {
          result[key] = overrideValue as T[keyof T];
        } else {
          result[key] = deepObjectOverride(originalValue, overrideValue);
        }
      } else {
        result[key] = overrideValue as T[keyof T];
      }
    }
  });

  return result;
}
