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
  const block = el.newBlock.block;
  const blockID = el.newBlock.blockId;
  const header = block.header;
  const blockHash = blockID.hash.toHexString();
  const height = BigInt.fromString(header.height.toString());
  const txLen = el.transaction.length;

  saveBlockID(blockHash, blockID);
  saveBlock(blockHash, block);

  for (let index = 0; index < txLen; index++) {
    const txResult = el.transaction[index].txResult;
    const txID = `${header.dataHash.toHexString()}-${index.toString()}`;

    saveResponseDeliverTx(txID, txResult);
    saveTxResult(txID, height, BigInt.fromI32(index), txResult)
  }

  saveEndBlock(blockHash, el.newBlock.resultEndBlock);

  log.info("BLOCK {} txs: {}", [height.toString(), txLen.toString()])
}

function saveBlockID(id: string, bID: tendermint.BlockID): void {
  savePartSetHeader(id, bID.partSetHeader);

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
  saveCommit(id, b.lastCommit)

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
  header.chain_id = h.chainId;
  header.height = height;
  header.time = id;
  header.last_block_id = h.lastBlockId.hash.toHexString();
  header.last_commit_hash = h.lastCommitHash;
  header.data_hash = h.dataHash;
  header.validators_hash = h.validatorsHash;
  header.next_validators_hash = h.nextValidatorsHash;
  header.consensus_hash = h.consensusHash;
  header.app_hash = h.appHash;
  header.last_results_hash = h.lastResultsHash;
  header.evidence_hash = h.evidenceHash;
  header.proposer_address = h.proposerAddress;
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
  if (e.duplicateVoteEvidence !== null) {
    saveDuplicateVoteEvidence(id, e.duplicateVoteEvidence);
    evidence.duplicate_vote_evidence = id;

  } else if (e.lightClientAttackEvidence !== null) {
    saveLightClientAttackEvidence(id, e.lightClientAttackEvidence);
    evidence.light_client_attack_evidence = id;
  }
  evidence.save();
}

function saveDuplicateVoteEvidence(id: string, e: tendermint.DuplicateVoteEvidence): void {
  const voteAID = `${id}-voteA`;
  const voteBID = `${id}-voteB`;
  saveEventVote(voteAID, e.voteA);
  saveEventVote(voteBID, e.voteB);
  saveTimestamp(id, e.timestamp);

  const duplicateVoteEvidence = new DuplicateVoteEvidence(id);
  duplicateVoteEvidence.vote_a = voteAID;
  duplicateVoteEvidence.vote_b = voteBID;
  duplicateVoteEvidence.total_voting_power = BigInt.fromString(e.totalVotingPower.toString());
  duplicateVoteEvidence.validator_power = BigInt.fromString(e.validatorPower.toString());
  duplicateVoteEvidence.timestamp = id;
  duplicateVoteEvidence.save();
}

function saveEventVote(id: string, ev: tendermint.EventVote): void {
  saveTimestamp(id, ev.timestamp);

  const eventVote = new EventVote(id);
  eventVote.event_vote_type = ev.eventVoteType.toString();
  eventVote.height = BigInt.fromString(ev.height.toString());
  eventVote.round = ev.round;
  eventVote.block_id = ev.blockId.hash.toHexString();
  eventVote.timestamp = id;
  eventVote.validator_address = ev.validatorAddress;
  eventVote.validator_index = ev.validatorIndex;
  eventVote.signature = ev.signature;
  eventVote.save();
}

function saveLightClientAttackEvidence(id: string, e: tendermint.LightClientAttackEvidence): void {
  saveLightBlock(id, e.conflictingBlock);

  const lightClientAttackEvidence = new LightClientAttackEvidence(id);
  lightClientAttackEvidence.conflicting_block = id;
  lightClientAttackEvidence.save();
}

function saveLightBlock(id: string, lb: tendermint.LightBlock): void {
  saveSignedHeader(id, lb.signedHeader);
  saveValidatorSet(id, lb.validatorSet);

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
  validatorSet.total_voting_power = BigInt.fromString(sh.totalVotingPower.toString());
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
  savePublicKey(v.address.toHexString(), v.pubKey);

  const validator = new Validator(id);
  validator.address = v.address;
  validator.voting_power = BigInt.fromString(v.votingPower.toString());
  validator.proposer_priority = BigInt.fromString(v.proposerPriority.toString());
  validator.save();
}

function saveCommit(id: string, c: tendermint.Commit): void {
  saveBlockID(id, c.blockId);

  const commit = new Commit(id);
  commit.height = BigInt.fromString(c.height.toString());
  commit.round = c.round;
  commit.block_id = c.blockId.hash.toHexString();
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
  commitSig.block_id_flag = getBlockIDFlag(cs.blockIdFlag);
  commitSig.validator_address = cs.validatorAddress;
  commitSig.timestamp = id;
  commitSig.signature = cs.signature;
  commitSig.save();
}

function getBlockIDFlag(bf: tendermint.BlockIDFlag): string {
  switch (bf) {
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_UNKNOWN:
      return "BLOCK_ID_FLAG_UNKNOWN"
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_ABSENT:
      return "BLOCK_ID_FLAG_ABSENT"
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_COMMIT:
      return "BLOCK_ID_FLAG_COMMIT"
    case tendermint.BlockIDFlag.BLOCK_ID_FLAG_NIL:
      return "BLOCK_ID_FLAG_NIL"
    default:
      log.error("unknown block_id_flag: {}", [bf.toString()])
      return "unknown"
  }
}

function saveResponseDeliverTx(id: string, txResult: tendermint.TxResult): void {
  const responseDeliverTx = new ResponseDeliverTx(id);
  responseDeliverTx.code = new BigInt(txResult.result.code);
  responseDeliverTx.data = txResult.tx;
  responseDeliverTx.log = txResult.result.log;
  responseDeliverTx.info = txResult.result.info;
  responseDeliverTx.gas_wanted = BigInt.fromString(txResult.result.gasWanted.toString());
  responseDeliverTx.gas_used = BigInt.fromString(txResult.result.gasUsed.toString());
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
  responseEndBlock.validator_updates = saveValidatorUpdates(id, endBlock.validatorUpdates);
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
  savePublicKey(validatorAddress, v.pubKey);

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
  const height = eventData.block.block.header.height
  const amount = eventData.event.attributes[0].value;
  const validator = eventData.event.attributes[1].value;

  log.info("REWARD amount = {}, validator = {}", [amount, validator]);

  let reward = new Reward(`${height}-${validator}`);

  reward.amount = amount;
  reward.validator = validator;

  reward.save();
}
