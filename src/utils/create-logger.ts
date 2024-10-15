export default function createLogger(logging: boolean) {
  return function logger(...args: unknown[]) {
    if (logging) {
      console.log('[MST-PERSISTENT-STORE]:', ...args);
    }
  };
}
