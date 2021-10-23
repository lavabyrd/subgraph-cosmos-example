import { Block as TBlock} from "../types/tendermint"
import { Block } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleBlock(block: TBlock): void {
  let id = block.hash.toHex()

  let entity = new Block(id)
  entity.header = BigInt.fromString(block.height.toString());
  //entity.hash = block.hash;
  entity.save()
}
