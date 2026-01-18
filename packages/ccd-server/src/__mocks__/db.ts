// Database mock for testing
export const mockDb = {
  prepare: () => ({
    get: () => null,
    all: () => [],
    run: () => ({ changes: 0 }),
    transaction: (fn: any) => fn
  }),
  exec: () => {},
  close: () => {}
};