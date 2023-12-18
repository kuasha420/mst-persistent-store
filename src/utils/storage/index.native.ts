import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItem = async (key: string) => {
  const item = await AsyncStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setItem = (key: string, value: any) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

export const removeItem = (key: string) => AsyncStorage.removeItem(key);
