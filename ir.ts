
import {None, optional, Optional, Some} from './option';



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
  TyStruct = 'struct'
}

abstract class Type {
  protected id: TypeID;
  protected context: Context;
  protected constructor(id: TypeID, context: Context) {
    this.id = id;
    this.context = context;
    context.add(this);
  }

  abstract getBitWidth(): number;
  abstract getAlignBytes(): number;
}

class VoidType extends Type {
  private constructor(context: Context) {
    super(TypeID.TyVoid, context);
  }

  getBitWidth(): number {
    return 0;
  }
  getAlignBytes(): number {
    return 0;
  }

  static getInstance(context: Context): VoidType {
    if (!VoidType.instance) {
      VoidType.instance = new VoidType(context);
    }
    return VoidType.instance;
  }

  private static instance: VoidType;
}

class IntegerType extends Type {
  protected signed: boolean;
  protected width_in_bits: number;

  private constructor(s: boolean, w: number, c: Context) {
    super(TypeID.TyInt, c);
    this.signed = s;
    this.width_in_bits = w;
  }

  getBitWidth(): number {
    return this.width_in_bits;
  }
  getAlignBytes(): number {
    return this.width_in_bits / 8;  // FIXME check int30
  }

  static getBoolType(c: Context): IntegerType {
    if (!IntegerType.bool_ty) {
      IntegerType.bool_ty = new IntegerType(false, 1, c);
    }
    return IntegerType.bool_ty;
  }
  static getI8Type(c: Context): IntegerType {
    if (!IntegerType.i8) {
      IntegerType.i8 = new IntegerType(true, 8, c);
    }
    return IntegerType.i8;
  }

  static getI16Type(c: Context): IntegerType {
    if (!IntegerType.i16) {
      IntegerType.i16 = new IntegerType(true, 16, c);
    }
    return IntegerType.i16;
  }
  static getI32Type(c: Context): IntegerType {
    if (!IntegerType.i32) {
      IntegerType.i32 = new IntegerType(true, 32, c);
    }
    return IntegerType.i32;
  }
  static getI64Type(c: Context): IntegerType {
    if (!IntegerType.i64) {
      IntegerType.i64 = new IntegerType(true, 64, c);
    }
    return IntegerType.i64;
  }
  static getU8Type(c: Context): IntegerType {
    if (!IntegerType.u8) {
      IntegerType.u8 = new IntegerType(false, 8, c);
    }
    return IntegerType.u8;
  }
  static getU16Type(c: Context): IntegerType {
    if (!IntegerType.u16) {
      IntegerType.u16 = new IntegerType(false, 16, c);
    }
    return IntegerType.u16;
  }
  static getU32Type(c: Context): IntegerType {
    if (!IntegerType.u32) {
      IntegerType.u32 = new IntegerType(false, 32, c);
    }
    return IntegerType.u32;
  }
  static getU64Type(c: Context): IntegerType {
    if (!IntegerType.u64) {
      IntegerType.u64 = new IntegerType(false, 64, c);
    }
    return IntegerType.u64;
  }

  private static bool_ty: IntegerType;
  private static i8: IntegerType;
  private static i16: IntegerType;
  private static i32: IntegerType;
  private static i64: IntegerType;
  private static u8: IntegerType;
  private static u16: IntegerType;
  private static u32: IntegerType;
  private static u64: IntegerType;
}

class Float32Type extends Type {
  private constructor(c: Context) {
    super(TypeID.TyFloat32, c);
  }

  getBitWidth(): number {
    return 32;
  }
  getAlignBytes(): number {
    return 32;
  }

  static getInstance(context: Context): Float32Type {
    if (!Float32Type.instance) {
      Float32Type.instance = new Float32Type(context);
    }
    return Float32Type.instance;
  }
  private static instance: Float32Type;
}

class Float64Type extends Type {
  private constructor(c: Context) {
    super(TypeID.TyFloat64, c);
  }

  getBitWidth(): number {
    return 64;
  }
  getAlignBytes(): number {
    return 64;
  }
  static getInstance(context: Context): Float64Type {
    if (!Float64Type.instance) {
      Float64Type.instance = new Float64Type(context);
    }
    return Float64Type.instance;
  }
  private static instance: Float64Type;
}

class PtrType extends Type {
  private ele_ty: Type;
  private ptr_width_bits: number;

  private constructor(ty: Type, c: Context) {
    super(TypeID.TyPtr, c);
    this.ele_ty = ty;
    this.ptr_width_bits = 0;  // FIXME ...target related
  }

  getBitWidth(): number {
    return this.ptr_width_bits;
  }
  getAlignBytes(): number {
    return this.ptr_width_bits;  // FIXME
  }

  static getPtrType(ty: Type, c: Context): PtrType {
    let p = new PtrType(ty, c);
    if (c.has(p)) return p;
    c.add(p);
    return p;
  }
}

class ArrayType extends Type {
  private element_ty: Type;
  private len: number;
  private constructor(ele: Type, len: number, c: Context) {
    super(TypeID.TyArray, c);
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

/// fn: A -> B -> C means (A, B):C
class FunctionType extends Type {
  private types: Type[];
  private constructor(ty: Type[], c: Context) {
    super(TypeID.TyFunc, c);
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

  static getCreateFuncType(c: Context, ty: Type[]): FunctionType {
    if (ty.length < 1) {
      console.error('function type should have at least one type void');
    }

    let fty = new FunctionType(ty, c);
    if (c.has(fty)) return c.addFuncType(fty);
    c.add(fty);
    return fty;
  }
}

class StructType extends Type {
  private fields: [string, Type][];
  private is_union: boolean;
  private constructor(c: Context, is_union: boolean) {
    super(TypeID.TyStruct, c);
    this.fields = [];
    this.is_union = is_union;
  }

  getBitWidth(): number {
    console.error('do not call this for struct type');
    return 0;
  }
  getAlignBytes(): number {
    console.error('TODO');
    return 0;
  }
  
}

class TargetInfo {}

// record type info, make sure the type is unique
// and target machine info
class Context {
  private type_set: Set<Type>;
  private ti: TargetInfo;
  constructor() {
    this.type_set = new Set();
    this.ti = new TargetInfo();
  }

  add(ty: Type): void {
    this.type_set.add(ty);
  }
  contains(ty: Type): boolean {
    return this.type_set.has(ty);
  }
  has(ty: Type): boolean {
    return this.contains(ty);
  }

  addFuncType(fty: FunctionType): FunctionType {
    this.add(fty);
    return fty;
  }

  getPtrType(ty: Type): PtrType {
    let p = PtrType.getPtrType(ty, this);
    return p;
  }

  getVoidType(): VoidType {
    return VoidType.getInstance(this);
  }
  getF32Type(): Float32Type {
    return Float32Type.getInstance(this);
  }
  getF64Type(): Float64Type {
    return Float64Type.getInstance(this);
  }
  getBoolType(): IntegerType {
    return IntegerType.getBoolType(this);
  }
}

class Module {
  private func_list: ilist<Func, Module>;
  private global_list: ilist<GlobalVariable, Module>;
  private symbol_map: Map<string, GlobalBase>;
  private module_name: string;
  private context: Context;
  constructor(name: string) {
    this.module_name = name;
    this.func_list = new ilist();
    this.global_list = new ilist();
    this.symbol_map = new Map();
    this.context = new Context();
  }

  createFunction(fname: string, ty: FunctionType): Func {
    let already = this.getSymbol(fname);
    if (already.isSome()) {
      console.error('function already defined');
    }

    let fn = new Func(fname, ty);
    this.func_list.push_front(fn);
    fn.setParent(new Some(this));
    this.symbol_map.set(fname, fn);
    return fn;
  }

  createGlobalVariable(name: string, ty: Type): GlobalVariable {
    let already = this.getSymbol(name);
    if (already.isSome()) {
      console.error('global variable already defined');
    }

    let gv = new GlobalVariable(name, ty);
    this.global_list.push_front(gv);
    gv.setParent(new Some(this));
    this.symbol_map.set(name, gv);
    return gv;
  }

  private getSymbol(name: string): Optional<GlobalBase> {
    let gv = this.symbol_map.get(name);
    return optional(gv);
  }

  getFunction(fname: string): Optional<Func> {
    let f = this.symbol_map.get(fname);
    if (f == undefined) return new None();
    if (f.isFunction()) {
      return new Some(f as Func);
    }
    return new None();
  }
  getGlobal(fname: string): Optional<GlobalVariable> {
    let f = this.symbol_map.get(fname);
    if (f == undefined || f == null) return new None();
    if (f.isFunction()) return new None();
    return new Some(f as GlobalVariable);
  }

  getContext(): Context {
    return this.context;
  }
}


class Value {
  private name: string;
  private ty: Type;
  private uses: User[];
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

  /// replace all uses of this into val
  public replaceAllUseOf(val: Value): void {
    while (this.uses.length > 0) {
      let u = this.uses.pop();
      if (u == undefined) break;
      u.replaceOperand(this, val);
    }
  }
  public addUser(u: User): void {
    let i = this.uses.find((v) => v == u);
    if (i != undefined) return;
    this.uses.push(u);
  }
}

class User extends Value {
  protected operands: Value[];
  constructor(name: string, ty: Type, ops: Value[]) {
    super(name, ty);
    this.operands = ops;
  }


  replaceOperand(old: Value, new_val: Value): void {
    for (let i = 0; i < this.operands.length; i++) {
      if (this.operands[i] == old) {
        this.operands[i] = new_val;
        new_val.addUser(this);
      }
    }
  }

  setOperand(idx: number, val: Value): void {
    this.operands[idx] = val;
  }
  getOperand(idx: number): Value {
    return this.operands[idx];
  }
  getNumOperands(): number {
    return this.getOperands().length;
  }

  getOperands(): Value[] {
    return this.operands;
  }
}

abstract class GlobalBase extends Value {
  constructor(name: string, ty: Type) {
    super(name, ty);
  }

  abstract isFunction(): boolean;
}

class GlobalVariable extends GlobalBase implements
    ilist_node_parent_i<GlobalVariable, Module> {
  protected node: ilist_node_parent<GlobalVariable, Module>;
  constructor(name: string, ty: Type) {
    super(name, ty);
    this.node = new ilist_node_parent();
  }

  isFunction(): boolean {
    return false;
  }
  getParent(): Optional<Module> {
    return this.node.getParent();
  }
  setParent(p: Optional<Module>): void {
    this.node.setParent(p);
  }
  getNext(): Optional<GlobalVariable> {
    return this.node.getNext();
  }
  getPrev(): Optional<GlobalVariable> {
    return this.node.getPrev();
  }
  setNext(n: Optional<GlobalVariable>): void {
    this.node.setNext(n);
  }
  setPrev(p: Optional<GlobalVariable>): void {
    this.node.setPrev(p);
  }
}

class Func extends GlobalBase implements ilist_node_parent_i<Func, Module> {
  protected block_list: ilist<BasicBlock, Func>;
  protected node: ilist_node_parent<Func, Module>;
  constructor(name: string, ty: Type) {
    super(name, ty);
    this.block_list = new ilist();
    this.node = new ilist_node_parent();
  }

  isFunction(): boolean {
    return true;
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

  getModule(): Optional<Module> {
    return this.getParent();
  }
  getContext(): Optional<Context> {
    return this.getModule().map((m) => m.getContext());
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

  getFunction(): Optional<Func> {
    return this.getParent();
  }
  getModule(): Optional<Module> {
    return this.getFunction().flatMap((f) => f.getParent());
  }
}

class Instruction extends User implements
    ilist_node_parent_i<Instruction, BasicBlock> {
  protected node: ilist_node_parent<Instruction, BasicBlock>;
  constructor(name: string, ty: Type, op: Value[]) {
    super(name, ty, op);
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

  getFunction(): Optional<Func> {
    return this.getParent().flatMap((p) => p.getParent());
  }
  getModule(): Optional<Module> {
    return this.getFunction().flatMap((f) => f.getParent());
  }
  getContext(): Optional<Context> {
    return this.getModule().map((m) => m.getContext());
  }
}

class UnaryInstruction extends Instruction {
  constructor(name: string, ty: Type, op: Value) {
    super(name, ty, [op]);
  }
}

class BinaryInstruction extends Instruction {
  constructor(name: string, ty: Type, op0: Value, op1: Value) {
    super(name, ty, [op0, op1]);
  }
}


enum CmpPredict {
  I_CMP_BEGIN,
  I_EQ,   // ==
  I_NQ,   // !=
  I_UGT,  // > unsigned
  I_ULT,  // < unsigned
  I_UGE,  // >= unsigned
  I_ULE,  // <= unsigned
  I_SGT,  // > signed
  I_SLT,  // < signed
  I_SGE,  // >= signed
  I_SLE,  // <= signed
  I_CMP_END,

  F_CMP_BEGIN,
  // TODO
  F_CMP_END,

}

namespace CmpPredict {
  export function isValidICmp(p: CmpPredict): boolean {
    return p > CmpPredict.I_CMP_BEGIN && p < CmpPredict.I_CMP_END;
  }
  export function isValidFCmp(p: CmpPredict): boolean {
    return p > CmpPredict.F_CMP_BEGIN && p < CmpPredict.F_CMP_END;
  }
}

class CmpInst extends Instruction {
  protected predict: CmpPredict;

  constructor(c: Context, name: string, p: CmpPredict, a: Value, b: Value) {
    super(name, c.getBoolType(), [a, b]);
    this.predict = p;
  }
}

class ICmpInst extends CmpInst {
  constructor(c: Context, name: string, p: CmpPredict, a: Value, b: Value) {
    if (!CmpPredict.isValidICmp(p)) throw new Error('invalid cmp predict');
    super(c, name, p, a, b);
  }
}

class FCmpInst extends CmpInst {
  constructor(c: Context, name: string, p: CmpPredict, a: Value, b: Value) {
    if (!CmpPredict.isValidFCmp(p)) throw new Error('invalid cmp predict');
    super(c, name, p, a, b);
  }
}

class AllocInstruction extends Instruction {
  protected ele_num: Optional<Value>;
  protected ele_ty: Type;
  constructor(
      c: Context, name: string, ele_num: Optional<Value>, ele_ty: Type) {
    super(name, c.getPtrType(ele_ty), []);  // TODO for array
    this.ele_num = ele_num;
    this.ele_ty = ele_ty;
  }
}

class MemoryAccess {
  protected is_volatile: boolean;
  protected is_atomic: boolean;
  protected is_align: boolean;
  constructor() {
    this.is_volatile = false;
    this.is_atomic = false;
    this.is_align = false;
  }

  setVolatile(): void {
    this.is_volatile = true;
  }
  setAtomic(): void {
    this.is_atomic = true;
  }
  setAlign(): void {
    this.is_align = true;
  }

  getVolatile(): boolean {
    return this.is_volatile;
  }
  getAtomic(): boolean {
    return this.is_atomic;
  }
  getAlign(): boolean {
    return this.is_align;
  }
}

class LoadInstruction extends Instruction {
  protected mem_access: MemoryAccess;
  constructor(name: string, ty: Type, address: Value) {
    super(name, ty, [address]);
    this.mem_access = new MemoryAccess();
  }

  setVolatile(): LoadInstruction {
    this.mem_access.setVolatile();
    return this;
  }
  setAtomic(): LoadInstruction {
    this.mem_access.setAtomic();
    return this;
  }
  setAlign(): LoadInstruction {
    this.mem_access.setAlign();
    return this;
  }
  isVolatile(): boolean {
    return this.mem_access.getVolatile();
  }
  isAtomic(): boolean {
    return this.mem_access.getAtomic();
  }
  isAlign(): boolean {
    return this.mem_access.getAlign();
  }

  getAddress(): Value {
    return this.getOperand(0);
  }
}

/// store val -> address.
class StoreInstruction extends Instruction {
  protected mem_access: MemoryAccess;

  constructor(name: string, ty: Type, val: Value, address: Value) {
    super(name, ty, [val, address]);
    this.mem_access = new MemoryAccess();
  }

  getAddress(): Value {
    return this.getOperand(1);
  }
  getValue(): Value {
    return this.getOperand(0);
  }

  isVolatile(): boolean {
    return this.mem_access.getVolatile();
  }
  isAtomic(): boolean {
    return this.mem_access.getAtomic();
  }
  isAlign(): boolean {
    return this.mem_access.getAlign();
  }

  setVolatile(): StoreInstruction {
    this.mem_access.setVolatile();
    return this;
  }
  setAtomic(): StoreInstruction {
    this.mem_access.setAtomic();
    return this;
  }
  setAlign(): StoreInstruction {
    this.mem_access.setAlign();
    return this;
  }
}

class PhiInstruction extends Instruction {
  protected incoming_blocks: BasicBlock[];
  constructor(
      name: string, ty: Type, incoming_vals: Value[],
      incoming_blocks: BasicBlock[]) {
    super(name, ty, incoming_vals);
    this.incoming_blocks = incoming_blocks;
  }
}

class CallInstruction extends Instruction {
  constructor(name: string, ty: Type, fn_args: Value[]) {
    super(name, ty, fn_args);
  }
}

abstract class TerminateInstruction extends Instruction {
  abstract getSuccessors(): BasicBlock[];
}

/// jump bb.0
class UnCondJumpInstruction extends TerminateInstruction {
  constructor(c: Context, name: string, tgt: BasicBlock) {
    super(name, c.getVoidType(), [tgt]);
  }


  override getSuccessors(): BasicBlock[] {
    return this.getOperands().map((v) => v as BasicBlock);
  }
  getSuccess(): BasicBlock {
    return this.getOperand(0) as BasicBlock;
  }
}

// jump cond, bb_t, bb_f
class CondJumpInstruction extends TerminateInstruction {
  constructor(
      c: Context, name: string, cond: Value, true_label: BasicBlock,
      false_label: BasicBlock) {
    super(name, c.getVoidType(), [cond, true_label, false_label]);
  }

  override getSuccessors(): BasicBlock[] {
    return this.getOperands().slice(-2).map((v) => v as BasicBlock);
  }
}

class ReturnInstruction extends TerminateInstruction {
  constructor(c: Context, name: string, val: Optional<Value>) {
    if (val.isSome()) {
      super(name, val.unwrap().getType(), [val.unwrap()]);
    } else {
      super(name, c.getVoidType(), []);
    }
  }

  override getSuccessors(): BasicBlock[] {
    return [];
  }
}

/// switch (cond) {
///   case 1: bb1;
///   case 2: bb2;
///}
/// values: [cond,      1,   2, ... ]
/// blocks: [default, bb1, bb2, ... ]
class SwitchInstruction extends TerminateInstruction {
  protected blocks: BasicBlock[];
  constructor(c: Context, name: string, values: Value[], bbs: BasicBlock[]) {
    super(name, c.getVoidType(), values);
    this.blocks = bbs;
  }


  getCondition(): Value {
    return this.getOperand(0);
  }
  getDefaultBlock(): BasicBlock {
    return this.blocks[0];
  }

  override getSuccessors(): BasicBlock[] {
    return this.blocks;
  }
}

class IRBuilder {
  private current_bb: Optional<BasicBlock>;
  constructor(bb: Optional<BasicBlock>) {
    this.current_bb = bb;
  }

  clear(): void {
    this.current_bb = new None();
  }
  getInsertPoint(): Optional<BasicBlock> {
    return this.current_bb;
  }
  setInsertPoint(bb: BasicBlock): void {
    this.current_bb = optional(bb);
  }

  // create instruction ...
}


let mod = new Module('test');
let f = mod.createFunction(
    'foo',
    FunctionType.getCreateFuncType(
        mod.getContext(), [mod.getContext().getVoidType()]));


console.log(mod);
console.log(f);