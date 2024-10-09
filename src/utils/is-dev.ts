const isDev = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV === 'development';
    } else if (typeof import.meta.env !== 'undefined' && import.meta.env.MODE) {
      return import.meta.env.MODE === 'development';
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

export default isDev;
