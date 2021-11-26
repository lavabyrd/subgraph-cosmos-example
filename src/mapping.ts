import  {tendermint} from "../types/tendermint"
import { EventList, Header, ResponseDeliverTx, TxResult } from "../generated/schema"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleBlock(events: tendermint.EventList ): void {
  const bHeader = events.newblock.block.header;
  const entity = new Header(bHeader.data_hash.toHexString())
  entity.height = bHeader.height;
  entity.chain_id = bHeader.chain_id;
  var i = 0;

  for (let index = 0; index < events.transaction.length; index++) {
    const tx = events.transaction[index];
    const txR = new ResponseDeliverTx(bHeader.data_hash.toHexString()+index.toString())
    txR.code =  new BigInt(tx.TxResult.result.code);
    txR.codespace = tx.TxResult.result.codespace;
    txR.gas_used = tx.TxResult.result.gas_used;
    txR.gas_wanted = tx.TxResult.result.gas_wanted;
    txR.info = tx.TxResult.result.info;
    txR.log = tx.TxResult.result.log;
    i++;

    // txR.events = tx.TxResult.result.events.map((event, idx) => {
    //   return new Event().
    // });
    txR.save();
  }

  entity.save()
}
