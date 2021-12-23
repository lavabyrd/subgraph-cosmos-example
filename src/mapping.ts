import { BigInt, log, tendermint } from "@graphprotocol/graph-ts";
import {
  Block,
  BlockID,
  Data,
  Header,
  ResponseDeliverTx,
  Reward,
  TxResult
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  const b = el.newblock.block;
  const h = el.newblock.block.header;
  const blockHash = el.newblock.block_id.hash.toHex();
  const height = BigInt.fromString(h.height.toString());
 
  saveHeader(blockHash, el.newblock.block.header, height);
  saveBlockID(blockHash, el.newblock.block_id)
  saveData(blockHash, b.data)
  saveBlock(blockHash)

  for (let index = 0; index < el.transaction.length; index++) {
    const txResult = el.transaction[index].TxResult;
    const txID = h.data_hash.toHexString() + index.toString();

    saveResponseDeliverTx(txID, txResult);
    saveTxResult(txID, height, BigInt.fromI32(index), txResult)
  }
}

function saveHeader(id: string, h: tendermint.Header, height: BigInt): void {
  const header = new Header(id);

  header.version = BigInt.fromString(h.version.app.toString()).toString() + BigInt.fromString(h.version.block.toString()).toString();
  header.chain_id = h.chain_id;
  header.height =  height;
  header.time = new Date(h.time.seconds).toISOString();
  header.last_block_id = h.last_block_id.hash.toHex();
  header.last_commit_hash = h.last_commit_hash;
  header.data_hash = h.data_hash;
  header.validators_hash = h.validators_hash;
  header.next_validators_hash = h.next_validators_hash;
  header.consensus_hash = h.consensus_hash;
  header.app_hash = h.app_hash;
  header.last_results_hash = h.last_results_hash;
  header.evidence_hash = h.evidence_hash;
  header.proposer_address = h.proposer_address.toHex();

  header.save();
}

function saveBlockID(id: string, bID: tendermint.BlockID): void {
  const blockID = new BlockID(id);

  blockID.hash = bID.hash;

  blockID.save();
}

function saveData(id: string, d: tendermint.Data): void {
  const data = new Data(id);

  data.txs = d.txs;

  data.save();
}

function saveBlock(id: string): void {
  const block = new Block(id);

  block.data = id;
  block.header = id;

  block.save()
}

function saveResponseDeliverTx(id: string, txResult: tendermint.TxResult): void {
  const responseDeliverTx = new ResponseDeliverTx(id);

  responseDeliverTx.code = new BigInt(txResult.result.code);
  responseDeliverTx.data = txResult.tx;
  responseDeliverTx.log = txResult.result.log;
  responseDeliverTx.info = txResult.result.info;
  responseDeliverTx.gas_wanted = BigInt.fromString(txResult.result.gas_wanted.toString());
  responseDeliverTx.gas_used = BigInt.fromString(txResult.result.gas_used.toString());
  responseDeliverTx.codespace = txResult.result.codespace;

  responseDeliverTx.save();
}

function saveTxResult(id: string, height: BigInt, index: BigInt, txRes: tendermint.TxResult): void {
  const txResult = new TxResult(id);
  txResult.height = height;
  txResult.index = index;
  txResult.tx = txRes.tx;
  txResult.result = id;
  txResult.save();
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
