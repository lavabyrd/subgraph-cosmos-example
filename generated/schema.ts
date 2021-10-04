import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Block extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
    this.set("hash", Value.fromBytes(new Bytes()));
    this.set("height", Value.fromBigInt(new BigInt()));


  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Block entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Block entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Block", id.toString(), this);
    }
  }

  static load(id: string): Block | null {
    return changetype<Block | null>(store.get("Block", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get hash(): Bytes {
    let value = this.get("hash");
    return value!.toBytes();
  }

  set owner(value: Bytes) {
    this.set("hash", Value.fromBytes(value));
  }

  get height(): BigInt {
    let value = this.get("height");
    return value!.toBigInt();
  }

  set height(value: BigInt) {
    this.set("height", Value.fromBigInt(value));
  }
}
