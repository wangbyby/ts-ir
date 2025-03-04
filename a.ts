
import {None, Optional, Some} from './option';


// 工厂函数，用于创建 Some 或 None
function optional<T>(value: T|null|undefined): Optional<T> {
  return value === null || value === undefined ? new None() : new Some(value);
}


interface ilist_node_i<T> {
  getPrev(): Optional<T>;
  getNext(): Optional<T>;
  setPrev(p: Optional<T>): void;
  setNext(n: Optional<T>): void;
}

interface ilist_node_parent_i<T, P> extends ilist_node_i<T> {
  getParent(): Optional<P>;
  setParent(p: Optional<P>): void;
}

class ilist_node<T> implements ilist_node_i<T> {
  prev: Optional<T>;
  next: Optional<T>;

  constructor() {
    this.next = new None();
    this.prev = new None();
  }

  getPrev(): Optional<T> {
    return this.prev;
  }
  getNext(): Optional<T> {
    return this.next;
  }
  setNext(n: Optional<T>): void {
    this.next = n;
  }
  setPrev(p: Optional<T>): void {
    this.prev = p;
  }
}

class ilist_node_parent<T, P> extends ilist_node<T> implements
    ilist_node_parent_i<T, P> {
  protected parent: Optional<P>;
  constructor() {
    super();
    this.parent = new None();
  }
  getParent(): Optional<P> {
    return this.parent;
  }
  setParent(p: Optional<P>) {
    this.parent = p;
  }
}

class ilist<T extends ilist_node_parent_i<T, P>, P> {
  private head: Optional<T>;
  private tail: Optional<T>;
  private len: number;
  constructor() {
    this.head = new None();
    this.tail = new None();
    this.len = 0;
  }

  push_front(node: T) {
    node.setNext(this.head);
    this.head.map((n) => n.setPrev(new Some(node)));
    this.head = new Some(node);
    this.len += 1;
  }
}

class Value {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Module {
  protected func_list: ilist<Func, Module>;
  protected module_name: string;
  constructor(name: string) {
    this.module_name = name;
    this.func_list = new ilist();
  }

  createFunction(fname: string): Func {
    let fn = new Func(fname);
    this.func_list.push_front(fn);
    fn.setParent(new Some(this));
    return fn;
  }
}

class Func extends Value implements ilist_node_parent_i<Func, Module> {
  protected block_list: ilist<BasicBlock, Func>;
  protected node: ilist_node_parent<Func, Module>;
  constructor(name: string) {
    super(name);
    this.block_list = new ilist();
    this.node = new ilist_node_parent();
  }
  getParent(): Optional<Module> {
    return this.node.getParent();
  }
  setParent(p: Optional<Module>): void {
    this.node.setParent(p);
  }
  getNext(): Optional<Func> {
    return this.node.getNext();
  }
  getPrev(): Optional<Func> {
    return this.node.getPrev();
  }
  setNext(n: Optional<Func>): void {
    this.node.setNext(n);
  }
  setPrev(p: Optional<Func>): void {
    this.node.setPrev(p);
  }
}

class BasicBlock extends Value implements
    ilist_node_parent_i<BasicBlock, Func> {
  protected inst_list: ilist<Instruction, BasicBlock>;
  protected node: ilist_node_parent<BasicBlock, Func>;

  constructor(name: string) {
    super(name);
    this.inst_list = new ilist();
    this.node = new ilist_node_parent();
  }

  getParent(): Optional<Func> {
    return this.node.getParent();
  }
  setParent(p: Optional<Func>): void {
    this.node.setParent(p);
  }
  getNext(): Optional<BasicBlock> {
    return this.node.getNext();
  }
  getPrev(): Optional<BasicBlock> {
    return this.node.getPrev();
  }
  setNext(n: Optional<BasicBlock>): void {
    this.node.setNext(n);
  }
  setPrev(p: Optional<BasicBlock>): void {
    this.node.setPrev(p);
  }
}

class Instruction extends Value implements
    ilist_node_parent_i<Instruction, BasicBlock> {
  protected node: ilist_node_parent<Instruction, BasicBlock>;
  constructor(name: string) {
    super(name);
    this.node = new ilist_node_parent();
  }

  getParent(): Optional<BasicBlock> {
    return this.node.getParent();
  }
  setParent(p: Optional<BasicBlock>): void {
    this.node.setParent(p);
  }
  getNext(): Optional<Instruction> {
    return this.node.getNext();
  }
  getPrev(): Optional<Instruction> {
    return this.node.getPrev();
  }
  setNext(n: Optional<Instruction>): void {
    this.node.setNext(n);
  }
  setPrev(p: Optional<Instruction>): void {
    this.node.setPrev(p);
  }
}


let mod = new Module('test');
let f = mod.createFunction('foo');


console.log(mod);
console.log(f);