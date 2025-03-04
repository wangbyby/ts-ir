
// 定义 Optional 类的抽象基类
abstract class Optional<T> {
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
class Some<T> extends Optional<T> {
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
class None<T> extends Optional<T> {
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

// 工厂函数，用于创建 Some 或 None
function optional<T>(value: T|null|undefined): Optional<T> {
  return value === null || value === undefined ? new None() : new Some(value);
}


class ilist_node<T> {
  protected prev: Optional<ilist_node<T>>;
  protected next: Optional<ilist_node<T>>;
  constructor() {
    this.prev = new None();
    this.next = new None();
  }

  getPrev(): Optional<ilist_node<T>> {
    return this.prev;
  }
  getNext(): Optional<ilist_node<T>> {
    return this.next;
  }

  setPrev(p: Optional<ilist_node<T>>) {
    this.prev = p;
  }
  setNext(n: Optional<ilist_node<T>>) {
    this.next = n;
  }
}

interface HasParent<P> {
  getParent(): Optional<P>;
}

class ilist_node_parent<T, P> extends ilist_node<T> {
  constructor() {
    super();
  }
}

class ilist<T, P> {
  private head: Optional<ilist_node_parent<T, P>>;
  private tail: Optional<ilist_node_parent<T, P>>;
  private len: number;
  constructor() {
    this.head = new None();
    this.tail = new None();
    this.len = 0;
  }

  push_front(node: ilist_node_parent<T, P>) {
    node.setNext(this.head);
    this.head.map((n) => node.setPrev(optional(node)));
    this.len += 1;
    this.head = optional(node);
  }
}

class Value{
    private name: string;
    constructor(name: string){
        this.name = name;
    }
}

class BasicBlock extends Value{

}

class Instruction extends Value, ilist_node_parent<Instruction, BasicBlock>  {

}


console.log('hello world');