import { tendermint } from "@graphprotocol/graph-ts/chain/tendermint";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { Bytes } from "@graphprotocol/graph-ts/common/collections";
import { json } from "@graphprotocol/graph-ts/common/json";
import { Value, ValueKind, ValuePayload } from "@graphprotocol/graph-ts/common/value";
import {
  Block,
  Evidence,
  Header,

  ResponseDeliverTx,
  Reward
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  const blockHash = el.newblock.block_id.hash.toHex();

  const h = el.newblock.block.header;
  const header = new Header(blockHash);
  header.version = BigInt.fromString(h.version.app.toString()).toString() + BigInt.fromString(h.version.block.toString()).toString();
  header.chain_id = h.chain_id;
  header.height =  BigInt.fromString(h.height.toString());
  header.time = new Date(h.time.seconds).toISOString();
  header.save();

  
  const b = el.newblock.block;
  const block = new Block(blockHash);
  block.data = json.fromBytes(new Value(ValueKind.BYTES, changetype<u32>(b.data.txs)).toBytes()).toString();
  block.save()


  for (let index = 0; index < el.transaction.length; index++) {
    const txResult = el.transaction[index].TxResult;
    const responseDeliverTx = new ResponseDeliverTx(
      h.data_hash.toHexString() + index.toString()
    );

    responseDeliverTx.code = new BigInt(txResult.result.code);
    responseDeliverTx.data = txResult.tx;
    responseDeliverTx.log = txResult.result.log;
    responseDeliverTx.info = txResult.result.info;
    responseDeliverTx.gas_wanted = BigInt.fromString(txResult.result.gas_wanted.toString());
    responseDeliverTx.gas_used = BigInt.fromString(txResult.result.gas_used.toString());
    responseDeliverTx.codespace = txResult.result.codespace;
    responseDeliverTx.save();

    // const transaction = new Transac
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

function bytesToString(bytes: Array<Bytes>): string {
  // var result = "";
  // for (var i = 0; i < bytes.length; i++) {
  //   // let cast = parseFloat(bytes.at(i).toString()) as i32;
  //   // let cast = 1;
  //   result += String.fromCharCode(changetype<u32>(bytes.at(i)))
  //   // result += String.fromCharCode(parseInt(bytes[i].toString(), 2));
  // }
  // return result;

  return bytes.toString()
  // return changetype<string>(bytes.to() as u32)
}