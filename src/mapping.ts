import { tendermint } from "@graphprotocol/graph-ts/chain/tendermint";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Header,
  ResponseBeginBlock,
  ResponseDeliverTx,
  Reward
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  const blockHash = el.newblock.block_id.hash.toHex();

  const h = el.newblock.block.header;
  const header = new Header(blockHash);
  // header.version = h.version.;
  header.chain_id = h.chain_id;
  header.height =  BigInt.fromString(h.height.toString());
  // let date = Date.s;
  // date.setSeconds(h.time.seconds,h.time.nanos)
  // header.time = toISOString(date);
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
    responseDeliverTx.gas_wanted = BigInt.fromString(txResult.result.gas_wanted.toString());
    responseDeliverTx.gas_used = BigInt.fromString(txResult.result.gas_used.toString());
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


function toISOString(date: Date): string {
  return (date.getFullYear() + '-' + ((date.getMonth() + 1)) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
} 
