import  {tendermint} from "../types/tendermint"
import { Header } from "../generated/schema"
import { BigInt,Bytes } from "@graphprotocol/graph-ts"

export function handleBlock(el: tendermint.EventList ): void {
  let h = el.newblock.block.header
  let entity = new Header(h.data_hash.toString())
  entity.height = BigInt.fromString(h.height.toString());
  entity.chain_id = h.chain_id;
  entity.save()
}
