export default function createLogger(logging: boolean) {
  return function logger(...args: any[]) {
    if (logging) {
      console.log('[MST-PERSISTENT-STORE]:', ...args);
    }
  };
}
