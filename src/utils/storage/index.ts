import localforage from 'localforage';

export const getItem = (key: string) => localforage.getItem(key);

export const setItem = (key: string, value: any) => localforage.setItem(key, value);

export const removeItem = (key: string) => localforage.removeItem(key);
