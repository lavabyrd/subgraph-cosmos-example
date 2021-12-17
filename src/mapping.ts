import { tendermint } from "../types/tendermint";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Header,
  ResponseBeginBlock,
  ResponseDeliverTx,
  Reward
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  // const h = el.newblock.block.header;
  // const entity = new Header(el.newblock.block_id.hash.toHex());
  // entity.height = new BigInt(i32(h.height));
  // entity.chain_id = h.chain_id;

  // for (let index = 0; index < el.transaction.length; index++) {
  //   const j = el.transaction[index];
  //   const txR = new ResponseDeliverTx(
  //     h.data_hash.toHexString() + index.toString()
  //   );
  //   txR.code = new BigInt(j.TxResult.result.code);
  //   txR.codespace = j.TxResult.result.codespace;
  //   txR.gas_used = new BigInt(i32(j.TxResult.result.gas_used));
  //   txR.gas_wanted = new BigInt(i32(j.TxResult.result.gas_wanted));
  //   txR.info = j.TxResult.result.info;
  //   txR.log = j.TxResult.result.log;

  //   txR.save();
  // }
  // entity.save();
  
  // old is above
  // my changes:
  

  // const eventList = new EventList(el.newblock.block_id.hash.toHex());
  // // eventList.newblock = new EventBlock(el.newblock.block_id.hash.toHex())
  // eventList.newblock = 

  const blockHash = el.newblock.block_id.hash.toHex();

  const h = el.newblock.block.header;
  const header = new Header(blockHash);
  // header.version = h.version.;
  header.chain_id = h.chain_id;
  header.height = new BigInt(i32(h.height));
  header.time = h.time.toISOString();
  header.save();

  // const b = el.newblock.block;
  // const block = new Block(blockHash);
  // // block.header = b.header.;
  // // block.data = b.data;
  // // block.evidence = b.evidence;
  // // block.last_commit = b.last_commit;
  // block.save()


  // const eventBlock = new EventBlock(blockHash)
  // // eventBlock.block = el.newblock.block.toString();
  // // eventBlock.block = el.newblock.block.get_s
  // eventBlock.block_id = el.newblock.block_id.hash.toHex();
  // // eventBlock.result_begin_block = el.newblock.result_begin_block.toString();
  // // eventBlock.result_end_block = el.newblock.result_end_block.toString();
  // eventBlock.save();
  
 
  // const responseBeginBlock = new ResponseBeginBlock(blockHash);
  // responseBeginBlock.events = null;
  // responseBeginBlock.save();


  

  for (let index = 0; index < el.transaction.length; index++) {
    const txResult = el.transaction[index].TxResult;
    const responseDeliverTx = new ResponseDeliverTx(
      h.data_hash.toHexString() + index.toString()
    );
    // const events = new Array<string>();

    responseDeliverTx.code = new BigInt(txResult.result.code);
    responseDeliverTx.data = txResult.tx;
    responseDeliverTx.log = txResult.result.log;
    responseDeliverTx.info = txResult.result.info;
    responseDeliverTx.gas_wanted = new BigInt(i32(txResult.result.gas_wanted));
    responseDeliverTx.gas_used = new BigInt(i32(txResult.result.gas_used));
    // responseDeliverTx.events = events
    responseDeliverTx.codespace = txResult.result.codespace;
    responseDeliverTx.save();
  }

  
}

export function handleReward(eventData: tendermint.EventData): void {
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(amount);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
