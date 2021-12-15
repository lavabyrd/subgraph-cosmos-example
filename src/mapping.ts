import { t } from "../types/tendermint";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Header,
  ResponseDeliverTx,
  Reward
} from "../generated/schema";

export function handleBlock(el: t.EventList): void {
  const h = el.newblock.block.header;
  const entity = new Header(el.newblock.block_id.hash.toHex());
  entity.height = BigInt.fromString(h.height.toString());
  entity.chain_id = h.chain_id;

  for (let index = 0; index < el.transaction.length; index++) {
    const j = el.transaction[index];
    const txR = new ResponseDeliverTx(
      h.data_hash.toHexString() + index.toString()
    );
    txR.code = new BigInt(j.TxResult.result.code);
    txR.codespace = j.TxResult.result.codespace;
    txR.gas_used = BigInt.fromString(j.TxResult.result.gas_used.toString());
    txR.gas_wanted = BigInt.fromString(j.TxResult.result.gas_wanted.toString());
    txR.info = j.TxResult.result.info;
    txR.log = j.TxResult.result.log;

    txR.save();
  }

  entity.save();
}

export function handleReward(eventData: t.EventData): void {
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(amount);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
