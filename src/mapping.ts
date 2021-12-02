import { t } from "../types/tendermint";
import {
  EventList,
  Header,
  ResponseDeliverTx,
  TxResult,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleBlock(el: t.EventList): void {
  const h = el.newblock.block.header;
  const entity = new Header(el.newblock.block_id.hash.toHex());
  entity.height = new BigInt(i32(h.height));
  entity.chain_id = h.chain_id;

  for (let index = 0; index < el.transaction.length; index++) {
    const j = el.transaction[index];
    const txR = new ResponseDeliverTx(
      h.data_hash.toHexString() + index.toString()
    );
    txR.code = new BigInt(j.TxResult.result.code);
    txR.codespace = j.TxResult.result.codespace;
    txR.gas_used = new BigInt(i32(j.TxResult.result.gas_used));
    txR.gas_wanted = new BigInt(i32(j.TxResult.result.gas_wanted));
    txR.info = j.TxResult.result.info;
    txR.log = j.TxResult.result.log;

    txR.save();
  }

  entity.save();
}
