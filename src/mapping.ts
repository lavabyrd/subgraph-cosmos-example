import { BigInt, log, tendermint } from "@graphprotocol/graph-ts";
import {
  Block,
  BlockID,
  Commit,
  CommitSig,
  Consensus,
  DuplicateVoteEvidence,
  EventVote,
  Evidence,
  EvidenceList,
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
    saveTxResult(txID, height, BigInt.fromI32(index), txResult);
  }

  saveEndBlock(blockHash, el.new_block.result_end_block);

  log.info("BLOCK {} txs: {}", [height.toString(), txLen.toString()]);
}

function saveBlockID(id: string, bID: tendermint.BlockID): string {
  const blockID = new BlockID(id);
  blockID.hash = bID.hash;
  blockID.part_set_header = savePartSetHeader(id, bID.part_set_header);
  blockID.save();
  return id;
}

function savePartSetHeader(id: string, psh: tendermint.PartSetHeader): string {
  const partSetHeader = new PartSetHeader(id);
  partSetHeader.total = BigInt.fromString(psh.total.toString());
  partSetHeader.hash = psh.hash;
  partSetHeader.save();
  return id;
}

function saveBlock(id: string, b: tendermint.Block): void {
  const block = new Block(id);
  block.header = saveHeader(id, b.header);
  block.evidence = saveEvidenceList(id, b.evidence);
  block.last_commit = saveCommit(id, b.last_commit);
  block.save();
}

function saveHeader(id: string, h: tendermint.Header): string {
  const height = BigInt.fromString(h.height.toString());
  const header = new Header(id);
  header.version = saveVersion(id, h.version);
  header.chain_id = h.chain_id;
  header.height = height;
  header.time = saveTimestamp(id, h.time);
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
  return id;
}

function saveVersion(id: string, v: tendermint.Consensus): string {
  const version = new Consensus(id);
  version.block = BigInt.fromString(v.block.toString());
  version.app = BigInt.fromString(v.app.toString());
  version.save();
  return id;
}

function saveTimestamp(id: string, ts: tendermint.Timestamp): string {
  const timestamp = new Timestamp(id);
  timestamp.seconds = BigInt.fromString(ts.seconds.toString());
  timestamp.nanos = ts.nanos;
  timestamp.save();
  return id;
}

function saveEvidenceList(id: string, el: tendermint.EvidenceList): string {
  const evidenceList = new EvidenceList(id);
  evidenceList.evidence = saveEvidences(id, el.evidence);
  evidenceList.save();
  return id;
}

function saveEvidences(
  id: string,
  evs: Array<tendermint.Evidence>
): Array<string> {
  let evidenceIDs = new Array<string>(evs.length);
  for (let i = 0; i < evs.length; i++) {
    evidenceIDs[i] = saveEvidence(`${id}-${i}`, evs[i]);
  }
  return evidenceIDs;
}

function saveEvidence(id: string, e: tendermint.Evidence): string {
  const evidence = new Evidence(id);
  if (e.duplicate_vote_evidence !== null) {
    evidence.duplicate_vote_evidence = saveDuplicateVoteEvidence(
      id,
      e.duplicate_vote_evidence
    );
  } else if (e.light_client_attack_evidence !== null) {
    evidence.light_client_attack_evidence = saveLightClientAttackEvidence(
      id,
      e.light_client_attack_evidence
    );
  }
  evidence.save();
  return id;
}

function saveDuplicateVoteEvidence(
  id: string,
  e: tendermint.DuplicateVoteEvidence
): string {
  const duplicateVoteEvidence = new DuplicateVoteEvidence(id);
  duplicateVoteEvidence.vote_a = saveEventVote(`${id}-voteA`, e.vote_a);
  duplicateVoteEvidence.vote_b = saveEventVote(`${id}-voteB`, e.vote_a);
  duplicateVoteEvidence.total_voting_power = BigInt.fromString(
    e.total_voting_power.toString()
  );
  duplicateVoteEvidence.validator_power = BigInt.fromString(
    e.validator_power.toString()
  );
  duplicateVoteEvidence.timestamp = saveTimestamp(id, e.timestamp);
  duplicateVoteEvidence.save();
  return id;
}

function saveEventVote(id: string, ev: tendermint.EventVote): string {
  const eventVote = new EventVote(id);
  eventVote.event_vote_type = ev.event_vote_type.toString();
  eventVote.height = BigInt.fromString(ev.height.toString());
  eventVote.round = ev.round;
  eventVote.block_id = ev.block_id.hash.toHexString();
  eventVote.timestamp = saveTimestamp(id, ev.timestamp);
  eventVote.validator_address = ev.validator_address;
  eventVote.validator_index = ev.validator_index;
  eventVote.signature = ev.signature;
  eventVote.save();
  return id;
}

function saveLightClientAttackEvidence(
  id: string,
  e: tendermint.LightClientAttackEvidence
): string {
  const lightClientAttackEvidence = new LightClientAttackEvidence(id);
  lightClientAttackEvidence.conflicting_block = saveLightBlock(
    id,
    e.conflicting_block
  );
  lightClientAttackEvidence.save();
  return id;
}

function saveLightBlock(id: string, lb: tendermint.LightBlock): string {
  const lightBlock = new LightBlock(id);
  lightBlock.signed_header = saveSignedHeader(id, lb.signed_header);
  lightBlock.validator_set = saveValidatorSet(id, lb.validator_set);
  lightBlock.save();
  return id;
}

function saveSignedHeader(id: string, sh: tendermint.SignedHeader): string {
  const signedHeader = new SignedHeader(id);
  signedHeader.header = saveHeader(id, sh.header);
  signedHeader.commit = saveCommit(id, sh.commit);
  signedHeader.save();
  return id;
}

function saveValidatorSet(id: string, sh: tendermint.ValidatorSet): string {
  const validatorSet = new ValidatorSet(id);
  validatorSet.validators = saveValidators(id, sh.validators);
  validatorSet.proposer = saveValidator(id, sh.proposer);
  validatorSet.total_voting_power = BigInt.fromString(
    sh.total_voting_power.toString()
  );
  validatorSet.save();
  return id;
}

function saveValidators(
  id: string,
  validators: Array<tendermint.Validator>
): Array<string> {
  let validatorIDs = new Array<string>(validators.length);
  for (let i = 0; i < validators.length; i++) {
    validatorIDs[i] = saveValidator(`${id}-${i}`, validators[i]);
  }
  return validatorIDs;
}

function saveValidator(id: string, v: tendermint.Validator): string {
  const validator = new Validator(id);
  validator.address = v.address;
  validator.voting_power = BigInt.fromString(v.voting_power.toString());
  validator.proposer_priority = BigInt.fromString(
    v.proposer_priority.toString()
  );
  validator.pub_key = savePublicKey(v.address.toHexString(), v.pub_key);
  validator.save();
  return id;
}

function saveCommit(id: string, c: tendermint.Commit): string {
  const commit = new Commit(id);
  commit.height = BigInt.fromString(c.height.toString());
  commit.round = c.round;
  commit.block_id = saveBlockID(c.block_id.hash.toHexString(), c.block_id);
  commit.signatures = saveCommitSigs(id, c.signatures);
  commit.save();
  return id;
}

function saveCommitSigs(
  id: string,
  cs: Array<tendermint.CommitSig>
): Array<string> {
  let commitSigIDs = new Array<string>(cs.length);
  for (let i = 0; i < cs.length; i++) {
    commitSigIDs[i] = saveCommitSig(`${id}-${i}`, cs[i]);
  }
  return commitSigIDs;
}

function saveCommitSig(id: string, cs: tendermint.CommitSig): string {
  const commitSig = new CommitSig(id);
  commitSig.block_id_flag = getBlockIDFlag(cs.block_id_flag);
  commitSig.validator_address = cs.validator_address;
  commitSig.timestamp = saveTimestamp(id, cs.timestamp);
  commitSig.signature = cs.signature;
  commitSig.save();
  return id;
}

function getBlockIDFlag(bf: tendermint.BlockIDFlag): string {
  switch (bf) {
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_UNKNOWN:
      return "BLOCK_ID_FLAG_UNKNOWN";
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_ABSENT:
      return "BLOCK_ID_FLAG_ABSENT";
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_COMMIT:
      return "BLOCK_ID_FLAG_COMMIT";
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_NIL:
      return "BLOCK_ID_FLAG_NIL";
    default:
      log.error("unknown block_id_flag: {}", [bf.toString()]);
      return "unknown";
  }
}

function saveResponseDeliverTx(
  id: string,
  txResult: tendermint.TxResult
): void {
  const responseDeliverTx = new ResponseDeliverTx(id);
  responseDeliverTx.code = new BigInt(txResult.result.code);
  responseDeliverTx.data = txResult.tx;
  responseDeliverTx.log = txResult.result.log;
  responseDeliverTx.info = txResult.result.info;
  responseDeliverTx.gas_wanted = BigInt.fromString(
    txResult.result.gas_wanted.toString()
  );
  responseDeliverTx.gas_used = BigInt.fromString(
    txResult.result.gas_used.toString()
  );
  responseDeliverTx.codespace = txResult.result.codespace;
  responseDeliverTx.save();
}

function saveTxResult(
  id: string,
  height: BigInt,
  index: BigInt,
  txRes: tendermint.TxResult
): void {
  const txResult = new TxResult(id);
  txResult.height = height;
  txResult.index = index;
  txResult.tx = txRes.tx;
  txResult.result = id;
  txResult.save();
}

function saveEndBlock(id: string, endBlock: tendermint.ResponseEndBlock): void {
  const responseEndBlock = new ResponseEndBlock(id);
  responseEndBlock.validator_updates = saveValidatorUpdates(
    id,
    endBlock.validator_updates
  );
  responseEndBlock.consensus_param_updates = id;
  responseEndBlock.save();
}

function saveValidatorUpdates(
  id: string,
  validators: Array<tendermint.ValidatorUpdate>
): Array<string> {
  let validatorIDs = new Array<string>(validators.length);
  for (let i = 0; i < validators.length; i++) {
    const v = validators[i];
    validatorIDs[i] = saveValidatorUpdate(`${id}-${v.address}`, v);
  }
  return validatorIDs;
}

function saveValidatorUpdate(
  id: string,
  v: tendermint.ValidatorUpdate
): string {
  const validatorUpdate = new ValidatorUpdate(id);
  validatorUpdate.address = v.address;
  validatorUpdate.pub_key = savePublicKey(v.address.toHexString(), v.pub_key);
  validatorUpdate.power = BigInt.fromString(v.power.toString());
  validatorUpdate.save();
  return id;
}

function savePublicKey(id: string, publicKey: tendermint.PublicKey): string {
  let pk = PublicKey.load(id);
  if (pk !== null) {
    log.debug("Validator with id: {} already exists", [id]);
    return id;
  }

  pk = new PublicKey(id);
  pk.ed25519 = publicKey.ed25519;
  pk.secp256k1 = publicKey.secp256k1;
  pk.save();
  return id;
}

export function handleReward(eventData: tendermint.EventData): void {
  const height = eventData.block.block.header.height;
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(`${height}-${validator}`);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
