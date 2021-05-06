import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItem = async <T>(key: string): Promise<T | null> => {
  const item = await AsyncStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setItem = async (key: string, value: any) => {
  const data = JSON.stringify(value);
  return AsyncStorage.setItem(key, data);
};

export const removeItem = async (key: string) => AsyncStorage.removeItem(key);
