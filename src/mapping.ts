import { Address as tAddress, BigInt, log, tendermint } from "@graphprotocol/graph-ts";
import {
  Block,
  BlockID,
  Consensus,
  Data,
  Header,
  PartSetHeader,
  PublicKey,
  ResponseDeliverTx,
  ResponseEndBlock,
  Reward,
  Timestamp,
  TxResult,
  Validator
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  const block = el.newblock.block;
  const blockID = el.newblock.block_id;
  const header = block.header;
  const blockHash = blockID.hash.toHex();
  const height = BigInt.fromString(header.height.toString());

  saveHeader(blockHash, header, height);
  saveBlockID(blockHash, blockID);
  saveData(blockHash, block.data);
  saveBlock(blockHash);

  for (let index = 0; index < el.transaction.length; index++) {
    const txResult = el.transaction[index].TxResult;
    const txID = header.data_hash.toHexString() + index.toString();

    saveResponseDeliverTx(txID, txResult);
    saveTxResult(txID, height, BigInt.fromI32(index), txResult)
  }

  saveEndBlock(blockHash, el.newblock.result_end_block);
}

function saveHeader(id: string, h: tendermint.Header, height: BigInt): void {
  saveTimestamp(id, h.time);
  saveVersion(id, h.version);

  const header = new Header(id);
  header.version = id;
  header.chain_id = h.chain_id;
  header.height = height;
  header.time = id;
  header.last_block_id = h.last_block_id.hash.toHexString();
  header.last_commit_hash = h.last_commit_hash;
  header.data_hash = h.data_hash;
  header.validators_hash = h.validators_hash;
  header.next_validators_hash = h.next_validators_hash;
  header.consensus_hash = h.consensus_hash;
  header.app_hash = h.app_hash;
  header.last_results_hash = h.last_results_hash;
  header.evidence_hash = h.evidence_hash;
  header.proposer_address = h.proposer_address;
  header.save();
}

function saveVersion(id: string, v: tendermint.Consensus): void {
  const version = new Consensus(id);
  version.block = BigInt.fromString(v.block.toString());
  version.app = BigInt.fromString(v.app.toString());
  version.save();
}

function saveTimestamp(id: string, ts: tendermint.Timestamp): void {
  const timestamp = new Timestamp(id);
  timestamp.seconds = BigInt.fromString(ts.seconds.toString());
  timestamp.nanos = ts.nanos;
  timestamp.save();
}

function saveBlockID(id: string, bID: tendermint.BlockID): void {
  savePartSetHeader(id, bID.part_set_header);

  const blockID = new BlockID(id);
  blockID.hash = bID.hash;
  blockID.part_set_header = id;
  blockID.save();
}

function savePartSetHeader(id: string, psh: tendermint.PartSetHeader): void {
  const partSetHeader = new PartSetHeader(id);
  partSetHeader.total = BigInt.fromString(psh.total.toString());
  partSetHeader.hash = psh.hash;
  partSetHeader.save();
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

function saveEndBlock(id: string, endBlock: tendermint.ResponseEndBlock): void {
  const responseEndBlock = new ResponseEndBlock(id);
  responseEndBlock.validator_updates = saveValidatorUpdates(endBlock.validator_updates);
  responseEndBlock.save();
}

function saveValidatorUpdates(validators: Array<tendermint.Validator>): Array<string> {
  let validatorIDs = new Array<string>(validators.length);
  for (let i = 0; i < validators.length; i++) {
    const v = validators[i];
    const validatorID = v.address.toHexString();
    saveValidator(validatorID, v);
    validatorIDs.push(validatorID);
  }
  return validatorIDs;
}

function saveValidator(id: string, v: tendermint.Validator): void {
  let validator = Validator.load(id);
  if (validator !== null) {
    return
  }

  savePublicKey(id, v.pub_key);

  validator = new Validator(id);
  validator.address = v.address;
  validator.pub_key = id;
  validator.voting_power = BigInt.fromString(v.voting_power.toString());
  validator.proposer_priority = BigInt.fromString(v.proposer_priority.toString());
  validator.save();
}

function savePublicKey(id: string, pk: tendermint.PublicKey): void {
  const publicKey = new PublicKey(id);
  publicKey.ed25519 = pk.ed25519;
  publicKey.secp256k1 = pk.secp256k1;
  publicKey.save();
}

export function handleReward(eventData: tendermint.EventData): void {
  const height = eventData.block.newblock.block.header.height
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(`${height}${validator}`);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
