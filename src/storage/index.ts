import localforage from 'localforage';

const getItem = (key: string) => localforage.getItem(key);

const setItem = (key: string, value: any) => localforage.setItem(key, value);

const removeItem = (key: string) => localforage.removeItem(key);

const defaultStorage = {
  getItem,
  setItem,
  removeItem,
};

export default defaultStorage;
