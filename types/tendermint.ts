import { Bytes, Address } from '@graphprotocol/graph-ts/common'


export class Block {
    constructor(
    public hash: Bytes,
    public height: BigInt,
    public timestamp: BigInt,
    ) {}
}
