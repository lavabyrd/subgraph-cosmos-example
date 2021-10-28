import  {tendermint} from "../types/tendermint"
import { EventList, Header, ResponseDeliverTx, TxResult } from "../generated/schema"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleBlock(el: tendermint.EventList ): void {
  const h = el.newblock.block.header;
  const entity = new Header(h.data_hash.toHexString())
  entity.height = h.height;
  entity.chain_id = h.chain_id;
  var i = 0;

  for (let index = 0; index < el.transaction.length; index++) {
    const j = el.transaction[index];
    const txR = new ResponseDeliverTx(h.data_hash.toHexString()+index.toString())
    txR.code =  new BigInt(j.TxResult.result.code);
    txR.codespace = j.TxResult.result.codespace;
    txR.gas_used = j.TxResult.result.gas_used;
    txR.gas_wanted = j.TxResult.result.gas_wanted;
    txR.info = j.TxResult.result.info;
    txR.log = j.TxResult.result.log;
    i++;

    //txR.events = j.TxResult.result.events;
    txR.save();
  }

  entity.save()
}
