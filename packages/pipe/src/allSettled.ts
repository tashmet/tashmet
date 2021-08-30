export interface PromiseResolution<T> {
  status: 'fulfilled';
  value: T;
}

export interface PromiseRejection<E> {
  status: 'rejected';
  reason: E;
}

export type PromiseResult<T, E = unknown> = PromiseResolution<T> | PromiseRejection<E>;

export type PromiseTuple<T extends [unknown, ...unknown[]]> = { [P in keyof T]: Promise<T[P]> };
export type PromiseResultTuple<T extends [unknown, ...unknown[]]> = { [P in keyof T]: PromiseResult<T[P]> };

/**
 * Promise.allSettled implementation
 *
 * @param iterable An iterable of promise
 */
export function allSettled<T>(iterable: Iterable<Promise<T>>): Promise<PromiseResult<T>[]> {
  const arr = Array.from(iterable, item => item
    .then(value => ({ status: 'fulfilled', value } as PromiseResolution<T>))
    .catch(reason => ({ status: 'rejected', reason } as PromiseRejection<typeof reason>))
  );
  return Promise.all(arr);
}