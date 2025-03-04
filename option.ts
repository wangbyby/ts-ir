// 定义 Optional 类的抽象基类
export abstract class Optional<T> {
  // 判断是否为 Some
  abstract isSome(): boolean;

  // 判断是否为 None
  abstract isNone(): boolean;

  // 获取值，如果为 None 则抛出错误
  abstract unwrap(): T;

  // 获取值，如果为 None 则返回默认值
  abstract unwrapOr(defaultValue: T): T;

  // 映射值（如果为 Some）
  abstract map<U>(fn: (value: T) => U): Optional<U>;

  // 扁平化映射（如果为 Some）
  abstract flatMap<U>(fn: (value: T) => Optional<U>): Optional<U>;
}

// Some 类，表示有值
export class Some<T> extends Optional<T> {
  private value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Optional<U> {
    return new Some(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Optional<U>): Optional<U> {
    return fn(this.value);
  }
}

// None 类，表示无值
export class None<T> extends Optional<T> {
  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  unwrap(): T {
    throw new Error('Cannot unwrap a None value');
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  map<U>(_fn: (value: T) => U): Optional<U> {
    return new None();
  }

  flatMap<U>(_fn: (value: T) => Optional<U>): Optional<U> {
    return new None();
  }
}