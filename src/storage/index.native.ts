import AsyncStorage from '@react-native-async-storage/async-storage';

const getItem = async (key: string) => {
  const item = await AsyncStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

const setItem = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

const removeItem = (key: string) => AsyncStorage.removeItem(key);

const defaultStorage = {
  getItem,
  setItem,
  removeItem,
};

export default defaultStorage;
