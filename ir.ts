
import {None, Optional, Some} from './option';



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
  push_back(node: T) {
    node.setPrev(this.tail);
    this.tail.map((n) => n.setNext(new Some(node)));
    this.tail = new Some(node);
    this.len += 1;
  }

  pop_front(): Optional<T> {
    if (this.head.isSome()) {
      let head = this.head;
      let next = head.flatMap((n) => n.getNext());
      head.unwrap().setNext(new None());
      next.map((n) => n.setPrev(new None()));
      this.head = next;
      this.len -= 1;
      return head;
    }
    return new None();
  }

  pop_back(): Optional<T> {
    if (this.tail.isSome()) {
      let tail = this.tail;
      let prev = tail.flatMap((n) => n.getPrev());
      tail.map((n) => n.setPrev(new None()));
      prev.map((n) => n.setNext(new None()));

      this.tail = prev;
      this.len -= 1;
      return tail;
    }
    return new None();
  }

  /// insert val after pos
  insert_after(pos: T, val: T) {
    this.insert_after_pos(new Some(pos), new Some(val));
  }
  insert_after_pos(pos: Optional<T>, val: Optional<T>) {
    val.map((n) => n.setParent(pos.flatMap((p) => p.getParent())));

    let next = pos.flatMap((n) => n.getNext());
    val.map((n) => n.setNext(next));
    val.map((n) => n.setPrev(pos));

    next.map((n) => n.setPrev(val));
    pos.map((n) => n.setNext(val));

    if (pos == this.tail) {
      this.tail = val;
    }

    this.len += 1;
  }

  insert_before(pos: T, val: T) {
    this.insert_before_pos(new Some(pos), new Some(val));
  }
  insert_before_pos(pos: Optional<T>, val: Optional<T>) {
    val.map((n) => n.setParent(pos.flatMap((p) => p.getParent())));
    let prev = pos.flatMap((n) => n.getPrev());

    val.map((n) => n.setNext(pos));
    val.map((n) => n.setPrev(prev));

    prev.map((n) => n.setNext(val));
    pos.map((n) => n.setPrev(val));

    if (pos == this.head) {
      this.head = val;
    }
    this.len += 1;
  }

  // remove val from linked list
  remove(val: T) {
    // FIXME check val is in this list

    this.len -= 1;

    let prev = val.getPrev();
    let next = val.getNext();

    val.setPrev(new None());
    val.setNext(new None());

    prev.map((n) => n.setNext(next));
    next.map((n) => n.setPrev(prev));

    if (val == this.head.unwrap()) {
      this.head = next;
    }

    if (val == this.tail.unwrap()) {
      this.tail = prev;
    }
  }
}


enum TypeID {
  TyVoid = 'void',
  TyInt = 'int',
  TyFloat32 = 'f32',
  TyFloat64 = 'f64',
  TyPtr = 'ptr',
  TyArray = 'arr',
  TyFunc = 'fn',
}

abstract class Type {
  protected id: TypeID;
  protected constructor(id: TypeID) {
    this.id = id;
  }

  abstract getBitWidth(): number;
  abstract getAlignBytes(): number;
}

class VoidType extends Type {
  private constructor() {
    super(TypeID.TyVoid);
  }
  static getVoidType(): Type {
    let t = new VoidType();
    return t;
  }
  getBitWidth(): number {
    return 0;
  }
  getAlignBytes(): number {
    return 0;
  }
}

class IntegerType extends Type {
  protected signed: boolean;
  protected width_in_bits: number;

  private constructor() {
    super(TypeID.TyInt);
    this.signed = false;
    this.width_in_bits = 0;
  }

  getBitWidth(): number {
    return this.width_in_bits;
  }
  getAlignBytes(): number {
    return this.width_in_bits / 8;  // FIXME check int30
  }
}

class Float32Type extends Type {
  private constructor() {
    super(TypeID.TyFloat32);
  }

  getBitWidth(): number {
    return 32;
  }
  getAlignBytes(): number {
    return 32;
  }
}

class Float64Type extends Type {
  private constructor() {
    super(TypeID.TyFloat64);
  }

  getBitWidth(): number {
    return 64;
  }
  getAlignBytes(): number {
    return 64;
  }
}

class PtrType extends Type {
  private ptr_width_bits: number;

  private constructor() {
    super(TypeID.TyPtr);
    this.ptr_width_bits = 0;  // FIXME ...target related
  }

  getBitWidth(): number {
    return this.ptr_width_bits;
  }
  getAlignBytes(): number {
    return this.ptr_width_bits;  // fixme
  }
}

class ArrayType extends Type {
  private element_ty: Type;
  private len: number;
  private constructor(ele: Type, len: number) {
    super(TypeID.TyArray);
    this.element_ty = ele;  // FIXME ...target related
    this.len = len;
  }

  getBitWidth(): number {
    return this.len * (this.element_ty.getAlignBytes() * 8);
  }

  getAlignBytes(): number {
    return this.len * this.element_ty.getAlignBytes();
  }
}

class FunctionType extends Type {
  private types: Type[];
  private constructor(ty: Type[]) {
    super(TypeID.TyFunc);
    this.types = ty;
  }

  getBitWidth(): number {
    console.error('call bad function');
    return 0;
  }
  getAlignBytes(): number {
    console.error('do not call this for function type');
    return 0;
  }

  getReturnType(): Type {
    return this.types[this.types.length - 1];
  }

  static getFnType(ty: Type[]): FunctionType {
    let f = new FunctionType(ty);
    return f;
  }
}



class Value {
  private name: string;
  private ty: Type;
  private uses: Value[];
  constructor(name: string, ty: Type) {
    this.name = name;
    this.ty = ty;
    this.uses = [];
  }

  public getName(): string {
    return this.name;
  }

  public getType(): Type {
    return this.ty;
  }
}

class Module {
  protected func_list: ilist<Func, Module>;
  protected module_name: string;
  constructor(name: string) {
    this.module_name = name;
    this.func_list = new ilist();
  }

  createFunction(fname: string, ty: FunctionType): Func {
    let fn = new Func(fname, ty);
    this.func_list.push_front(fn);
    fn.setParent(new Some(this));
    return fn;
  }
}

class Func extends Value implements ilist_node_parent_i<Func, Module> {
  protected block_list: ilist<BasicBlock, Func>;
  protected node: ilist_node_parent<Func, Module>;
  constructor(name: string, ty: Type) {
    super(name, ty);
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

  constructor(name: string, ty: Type) {
    super(name, ty);
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
  constructor(name: string, ty: Type) {
    super(name, ty);
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
let f = mod.createFunction('foo', FunctionType.getFnType([]));


console.log(mod);
console.log(f);