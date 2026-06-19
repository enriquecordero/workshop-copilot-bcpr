export interface ConverterFunction<T, R> {
  apply(source: T): R;
}

export interface ConverterBiFunction<T, R, V> {
  apply(source: T, extra: R): V;
}
