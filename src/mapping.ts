import { BigInt, log, tendermint } from "@graphprotocol/graph-ts";
import {
  Block,
  BlockID,
  Commit,
  CommitSig,
  Consensus,
  Data,
  DuplicateVoteEvidence,
  EventVote,
  Evidence,
  Header,
  LightBlock,
  LightClientAttackEvidence,
  PartSetHeader,
  PublicKey,
  ResponseDeliverTx,
  ResponseEndBlock,
  Reward,
  SignedHeader,
  Timestamp,
  TxResult,
  Validator,
  ValidatorSet,
  ValidatorUpdate,
} from "../generated/schema";

export function handleBlock(el: tendermint.EventList): void {
  const block = el.new_block.block;
  const blockID = el.new_block.block_id;
  const header = block.header;
  const blockHash = blockID.hash.toHex();
  const height = BigInt.fromString(header.height.toString());
  const txLen = el.transaction.length;

  saveBlockID(blockHash, blockID);
  saveBlock(blockHash, block);

  for (let index = 0; index < txLen; index++) {
    const txResult = el.transaction[index].tx_result;
    const txID = `${header.data_hash.toHexString()}-${index.toString()}`;

    saveResponseDeliverTx(txID, txResult);
    saveTxResult(txID, height, BigInt.fromI32(index), txResult)
  }

  saveEndBlock(blockHash, el.new_block.result_end_block);

  log.info("BLOCK {} txs: {}", [height.toString(), txLen.toString()])
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

function saveBlock(id: string, b: tendermint.Block): void {
  saveData(id, b.data);
  saveHeader(id, b.header);
  saveEvidenceList(id, b.evidence);
  saveCommit(id, b.last_commit)

  const block = new Block(id);
  block.data = id;
  block.header = id;
  block.evidence = id;
  block.last_commit = id;
  block.save()
}

function saveData(id: string, d: tendermint.Data): void {
  const data = new Data(id);
  data.txs = d.txs;
  data.save();
}

function saveHeader(id: string, h: tendermint.Header): void {
  const height = BigInt.fromString(h.height.toString());

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

function saveEvidenceList(id: string, el: tendermint.EvidenceList): Array<string> {
  const len = el.evidence.length;
  let evidenceIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    const evidence = el.evidence[i];
    const evidenceID = `${id}-${i}`;
    saveEvidence(evidenceID, evidence);
    evidenceIDs[i] = evidenceID;
  }
  return evidenceIDs;
}

function saveEvidence(id: string, e: tendermint.Evidence): void {
  const evidence = new Evidence(id);
  if (e.duplicate_vote_evidence !== null) {
    saveDuplicateVoteEvidence(id, e.duplicate_vote_evidence);
    evidence.duplicate_vote_evidence = id;

  } else if (e.light_client_attack_evidence !== null) {
    saveLightClientAttackEvidence(id, e.light_client_attack_evidence);
    evidence.light_client_attack_evidence = id;
  }
  evidence.save();
}

function saveDuplicateVoteEvidence(id: string, e: tendermint.DuplicateVoteEvidence): void {
  const voteAID = `${id}-voteA`;
  const voteBID = `${id}-voteB`;
  saveEventVote(voteAID, e.vote_a);
  saveEventVote(voteBID, e.vote_a);
  saveTimestamp(id, e.timestamp);

  const duplicateVoteEvidence = new DuplicateVoteEvidence(id);
  duplicateVoteEvidence.vote_a = voteAID;
  duplicateVoteEvidence.vote_b = voteBID;
  duplicateVoteEvidence.total_voting_power = BigInt.fromString(e.total_voting_power.toString());
  duplicateVoteEvidence.validator_power = BigInt.fromString(e.validator_power.toString());
  duplicateVoteEvidence.timestamp = id;
  duplicateVoteEvidence.save();
}

function saveEventVote(id: string, ev: tendermint.EventVote): void {
  saveTimestamp(id, ev.timestamp);

  const eventVote = new EventVote(id);
  eventVote.event_vote_type = ev.event_vote_type.toString();
  eventVote.height = BigInt.fromString(ev.height.toString());
  eventVote.round = ev.round;
  eventVote.block_id = ev.block_id.hash.toHexString();
  eventVote.timestamp = id;
  eventVote.validator_address = ev.validator_address;
  eventVote.validator_index = ev.validator_index;
  eventVote.signature = ev.signature;
  eventVote.save();
}

function saveLightClientAttackEvidence(id: string, e: tendermint.LightClientAttackEvidence): void {
  saveLightBlock(id, e.conflicting_block);

  const lightClientAttackEvidence = new LightClientAttackEvidence(id);
  lightClientAttackEvidence.conflicting_block = id;
  lightClientAttackEvidence.save();
}

function saveLightBlock(id: string, lb: tendermint.LightBlock): void {
  saveSignedHeader(id, lb.signed_header);
  saveValidatorSet(id, lb.validator_set);

  const lightBlock = new LightBlock(id);
  lightBlock.signed_header = id;
  lightBlock.validator_set = id;
  lightBlock.save();
}

function saveSignedHeader(id: string, sh: tendermint.SignedHeader): void {
  saveHeader(id, sh.header);
  saveCommit(id, sh.commit);

  const signedHeader = new SignedHeader(id);
  signedHeader.header = id;
  signedHeader.commit = id;
  signedHeader.save();
}

function saveValidatorSet(id: string, sh: tendermint.ValidatorSet): void {
  saveValidator(id, sh.proposer)

  const validatorSet = new ValidatorSet(id);
  validatorSet.validators = saveValidators(id, sh.validators);
  validatorSet.proposer = id;
  validatorSet.total_voting_power = BigInt.fromString(sh.total_voting_power.toString());
  validatorSet.save();
}

function saveValidators(id: string, v: Array<tendermint.Validator>): Array<string> {
  const len = v.length;
  let validatorIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    const validator = v[i];
    const validatorID = `${id}-${i}`;
    saveValidator(validatorID, validator);
    validatorIDs[i] = validatorID;
  }
  return validatorIDs;
}

function saveValidator(id: string, v: tendermint.Validator): void {
  savePublicKey(v.address.toHexString(), v.pub_key);

  const validator = new Validator(id);
  validator.address = v.address;
  validator.voting_power = BigInt.fromString(v.voting_power.toString());
  validator.proposer_priority = BigInt.fromString(v.proposer_priority.toString());
  validator.save();
}

function saveCommit(id: string, c: tendermint.Commit): void {
  saveBlockID(id, c.block_id);

  const commit = new Commit(id);
  commit.height = BigInt.fromString(c.height.toString());
  commit.round = c.round;
  commit.block_id = c.block_id.hash.toHexString();
  commit.signatures = saveCommitSigs(id, c.signatures);
  commit.save();
}

function saveCommitSigs(id: string, cs: Array<tendermint.CommitSig>): Array<string> {
  const len = cs.length;
  let commitSigIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    const commitSig = cs[i];
    const commitSigID = `${id}-${i}`;
    saveCommitSig(commitSigID, commitSig);
    commitSigIDs[i] = commitSigID;
  }
  return commitSigIDs;
}

function saveCommitSig(id: string, cs: tendermint.CommitSig): void {
  saveTimestamp(id, cs.timestamp);
  
  const commitSig = new CommitSig(id);
  commitSig.block_id_flag = cs.block_id_flag.toString();
  commitSig.validator_address = cs.validator_address;
  commitSig.timestamp = id;
  commitSig.signature = cs.signature;
  commitSig.save();
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
  responseEndBlock.validator_updates = saveValidatorUpdates(id, endBlock.validator_updates);
  responseEndBlock.consensus_param_updates = id;
  responseEndBlock.save();
}

function saveValidatorUpdates(id: string, validators: Array<tendermint.ValidatorUpdate>): Array<string> {
  const len = validators.length;
  let validatorIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    const validatorUpdate = validators[i];
    const validatorUpdateID = `${id}-${validatorUpdate.address}`;
    saveValidatorUpdate(validatorUpdateID, validatorUpdate);
    validatorIDs[i] = validatorUpdateID;
  }
  return validatorIDs;
}

function saveValidatorUpdate(id: string, v: tendermint.ValidatorUpdate): void {
  const validatorAddress = v.address.toHexString();
  savePublicKey(validatorAddress, v.pub_key);

  const validatorUpdate = new ValidatorUpdate(id);
  validatorUpdate.address = v.address;
  validatorUpdate.pub_key = validatorAddress;
  validatorUpdate.power = BigInt.fromString(v.power.toString());
  validatorUpdate.save();
}

function savePublicKey(id: string, publicKey: tendermint.PublicKey): void {
  let pk = PublicKey.load(id);
  if (pk !== null) {
    log.debug("Validator with id: {} already exists", [id])
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

  let reward = new Reward(`${height}-${validator}`);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
