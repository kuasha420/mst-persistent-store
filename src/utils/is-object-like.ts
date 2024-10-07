const isObjectLike = (value: any): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export default isObjectLike;
