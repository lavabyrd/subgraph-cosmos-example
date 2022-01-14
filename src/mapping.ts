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
  Validator,
  ValidatorUpdate
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
    const txID = `${header.data_hash.toHexString()}-${index.toString()}`;

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
  if (endBlock.validator_updates.length == 0) {
    // responseEndBlock.validator_updates = saveValidatorUpdates(id, endBlock.validator_updates);
  }
  responseEndBlock.save();
}

// function saveValidatorUpdates(id: string, validators: Array<tendermint.ValidatorUpdate>): Array<string> {
//   const len = validators.length;
//   let validatorIDs = new Array<string>(len);
//   for (let i = 0; i < len; i++) {
//     const v = validators[i];
//     // const address = v.pub_key.slice(0,20).toHexString();
//     const validatorID = `${id}-${address}`;
//     log.info("address = {} validator_id = {}", [address, validatorID])
//     saveValidatorUpdate(validatorID, address, v);
//     validatorIDs.push(validatorID);
//   }
//   return validatorIDs;
// }

function saveValidatorUpdate(id: string, address: string,  v: tendermint.ValidatorUpdate): void {
  savePublicKey(address, v.pub_key);
  

  const validatorUpdate = new ValidatorUpdate(id);
  // validatorUpdate.pub_key = v.pub_key;
  validatorUpdate.power = BigInt.fromString(v.power.toString());
  validatorUpdate.save();
}

function saveValidator(id: string, v: tendermint.Validator): void {
  let validator = Validator.load(id);
  if (validator !== null) {
    return
  }

  // savePublicKey(v.address, v.pub_key);

  validator = new Validator(id);
  validator.address = v.address;
  // validator.pub_key = v.address;
  validator.voting_power = BigInt.fromString(v.voting_power.toString());
  validator.proposer_priority = BigInt.fromString(v.proposer_priority.toString());
  validator.save();
}

function savePublicKey(id: string, publicKey: tendermint.PublicKey): void {
  let pk = PublicKey.load(id);
  if (pk !== null) {
    log.debug("Validator with {} already exists", [id])
    return
  }

  pk = new PublicKey(id);
  pk.ed25519 = publicKey.ed25519;
  pk.secp256k1 = publicKey.secp256k1;
  pk.save();
}

export function handleReward(eventData: tendermint.EventData): void {
  const height = eventData.block.new_block.block.header.height
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(`${height}${validator}`);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
