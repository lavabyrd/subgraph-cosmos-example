import { Bytes, BigInt} from '@graphprotocol/graph-ts'


export class Block {
    constructor(
    public hash: Bytes,
    public height: BigInt,
    public timestamp: BigInt,
    ) {}
}
