import { BigInt, Bytes, log, cosmos, liquidity } from "@graphprotocol/graph-ts";
import {
  AuthInfo,
  Coin,
  CompactBitArray,
  CosmosHeader,
  Fee,
  Height,
  Input,
  ModeInfo,
  MsgAcknowledgement,
  MsgBeginRedelegate,
  MsgDelegate,
  MsgFundCommunityPool,
  MsgMultiSend,
  MsgRecvPacket,
  MsgSend,
  MsgSetWithdrawAddress,
  MsgTimeout,
  MsgTransfer,
  MsgUndelegate,
  MsgUpdateClient,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
  Multi,
  Output,
  Packet,
  PubKey,
  SignerInfo,
  Single,
  Tip,
  Tx,
  TxBody,
} from "../generated/schema";

const pubKey = "/cosmos.crypto.secp256k1.PubKey"

export function decodeTxs(id: string, txs: Array<Bytes>): void {
  for (let i = 0; i < txs.length; i++) {
    saveTx(`${id}-${i}`, cosmos.v1.decodeTx(txs[i]));
  }
}

function saveTx(id: string, tx: cosmos.v1.Tx): void {
  const cTx = new Tx(id);
  cTx.authInfo = saveAuthInfo(id, tx.auth_info as cosmos.v1.AuthInfo);
  cTx.body = saveBody(id, tx.body as cosmos.v1.TxBody);
  cTx.signatures = uInt8ArrayToStringArray(id, tx.signatures as Array<Uint8Array>);
  cTx.save();
}

function saveAuthInfo(id: string, ai: cosmos.v1.AuthInfo): string {
  const authInfo = new AuthInfo(id);
  authInfo.fee = saveFee(`${id}-fee`, ai.fee as cosmos.v1.Fee);
  authInfo.signerInfos = saveSignerInfos(id, ai.signer_infos);
  if (ai.tip) {
    authInfo.tip = saveTip(`${id}-tip`, ai.tip as cosmos.v1.Tip);
  }
  authInfo.save();
  return id;
}

function saveFee(id: string, f: cosmos.v1.Fee): string {
  const fee = new Fee(id);
  fee.amount = saveCoins(id, f.amount);
  fee.gasLimit = BigInt.fromString(f.gas_limit.toString());
  fee.payer = f.payer;
  fee.granter = f.granter;
  fee.save();
  return id;
}

function saveTip(id: string, t: cosmos.v1.Tip): string {
  const tip = new Tip(id);
  tip.amount = saveCoins(id, t.amount);
  tip.tipper = t.tipper;
  tip.save();
  return id;
}

function saveCoins(id: string, coins: Array<cosmos.v1.Coin>): Array<string> {
  const len = coins.length;
  let coinIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    coinIDs[i] = saveCoin(`${id}-${i}`, coins[i]);
  }
  return coinIDs;
}

function saveCoin(id: string, c: cosmos.v1.Coin): string {
  const coin = new Coin(id);
  coin.amount = c.amount;
  coin.denom = c.denom;
  coin.save();
  return id;
}

function saveSignerInfos(
  id: string,
  sis: Array<cosmos.v1.SignerInfo>
): Array<string> {
  let signerInfoIDs = new Array<string>(sis.length);
  for (let i = 0; i < sis.length; i++) {
    signerInfoIDs[i] = saveSignerInfo(`${id}-${i}`, sis[i]);
  }
  return signerInfoIDs;
}

function saveSignerInfo(id: string, si: cosmos.v1.SignerInfo): string {
  const signerInfo = new SignerInfo(id);
  signerInfo.publicKey = savePublicKey(id, si.public_key as cosmos.v1.Any);
  signerInfo.modeInfo = saveModeInfo(id, si.mode_info as cosmos.v1.ModeInfo);
  signerInfo.sequence = BigInt.fromString(si.sequence.toString());
  signerInfo.save();
  return id;
}

function savePublicKey(id: string, pk: cosmos.v1.Any): string {
  let pkURL = pk.type_url as string;
  let pv = pk.value as Uint8Array;

  if (pkURL == pubKey) {
    return saveSecp256k1PublicKey(id, cosmos.v1.decodePubKey(pv));
  }

  log.error("Unknown public key type {}", [pkURL]);
  return "";
}

function saveSecp256k1PublicKey(id: string, pk: cosmos.v1.PubKey): string {
  const publicKey = new PubKey(id);
  publicKey.key = Bytes.fromUint8Array(pk.key as Uint8Array);
  publicKey.save();
  return id;
}

function saveModeInfos(
  id: string,
  mis: Array<cosmos.v1.ModeInfo>
): Array<string> {
  let modeInfoIDs = new Array<string>(mis.length);
  for (let i = 0; i < mis.length; i++) {
    modeInfoIDs[i] = saveModeInfo(`${id}-${i}`, mis[i]);
  }
  return modeInfoIDs;
}

function saveModeInfo(id: string, mi: cosmos.v1.ModeInfo): string {
  const modeInfo = new ModeInfo(id);
  if (mi.single !== null) {
    modeInfo.single = saveSingle(id, mi.single as cosmos.v1.Single);
  }
  if (mi.multi !== null) {
    modeInfo.multi = saveMulti(id, mi.multi as cosmos.v1.Multi);
  }
  modeInfo.save();
  return id;
}

function saveSingle(id: string, s: cosmos.v1.Single): string {
  const single = new Single(id);
  single.mode = getSignMode(s.mode);
  single.save();
  return id;
}

function saveMulti(id: string, m: cosmos.v1.Multi): string {
  const multi = new Multi(id);
  multi.bitarray = saveCompactBitArray(
    id,
    m.bitarray as cosmos.v1.CompactBitArray
  );
  multi.modeInfos = saveModeInfos(id, m.mode_infos);
  multi.save();
  return id;
}

function getSignMode(sm: cosmos.v1.SignMode): string {
  switch (sm) {
    case cosmos.v1.SignMode.SIGN_MODE_UNSPECIFIED:
      return "SIGN_MODE_UNSPECIFIED";
    case cosmos.v1.SignMode.SIGN_MODE_DIRECT:
      return "SIGN_MODE_DIRECT";
    case cosmos.v1.SignMode.SIGN_MODE_TEXTUAL:
      return "SIGN_MODE_TEXTUAL";
    case cosmos.v1.SignMode.SIGN_MODE_DIRECT_AUX:
      return "SIGN_MODE_DIRECT_AUX";
    case cosmos.v1.SignMode.SIGN_MODE_LEGACY_AMINO_JSON:
      return "SIGN_MODE_LEGACY_AMINO_JSON";
    default:
      log.error("Unknown mode info {}", [sm.toString()]);
      return "unknown";
  }
}

function saveCompactBitArray(id: string, c: cosmos.v1.CompactBitArray): string {
  const compactBitArray = new CompactBitArray(id);
  compactBitArray.extraBitsStored = BigInt.fromString(
    c.extra_bits_stored.toString()
  );
  compactBitArray.elems = Bytes.fromUint8Array(c.elems as Uint8Array);
  compactBitArray.save();
  return id;
}

function saveBody(id: string, b: cosmos.v1.TxBody): string {
  const txBody = new TxBody(id);
  txBody.messages = saveMessages(id, b.messages);
  txBody.memo = b.memo;
  txBody.timeoutHeight = BigInt.fromString(b.timeout_height.toString());
  txBody.save();
  return id;
}

function saveMessages(id: string, msgs: Array<cosmos.v1.Any>): Array<string> {
  let messageIDs = new Array<string>(msgs.length);
  for (let i = 0; i < msgs.length; i++) {
    messageIDs[i] = saveMessage(`${id}-${i}` as string, msgs[i]);
  }
  return messageIDs;
}

function saveMessage(id: string, msg: cosmos.v1.Any): string {
  let msgType = msg.type_url as string;
  let value = msg.value as Uint8Array;

  if (msgType == "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward") {
    return saveMsgWithdrawDelegatorReward(
      id,
      cosmos.v1.decodeMsgWithdrawDelegatorReward(value)
    );
  } else if (msgType == "/cosmos.staking.v1beta1.MsgDelegate") {
    return saveMsgDelegate(id, cosmos.v1.decodeMsgDelegate(value));
  } else if (msgType == "/cosmos.distribution.v1beta1.MsgFundCommunityPool") {
    return saveMsgFundCommunityPool(id, cosmos.v1.decodeMsgFundCommunityPool(value));
  } else if (msgType == "/cosmos.distribution.v1beta1.MsgSetWithdrawAddress") {
    return saveMsgSetWithdrawAddress(id, cosmos.v1.decodeMsgSetWithdrawAddress(value));
  } else if (msgType == "/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission") {
    return saveMsgWithdrawValidatorCommission(id, cosmos.v1.decodeMsgWithdrawValidatorCommission(value));
  } else if (msgType == "/ibc.core.client.v1.MsgUpdateClient") {
    return saveIbcMsgUpdateClient(id, cosmos.v1.decodeMsgUpdateClient(value));
  } else if (msgType == "/ibc.core.channel.v1.MsgRecvPacket") {
    return saveIbcMsgRecvPacket(id, cosmos.v1.decodeMsgRecvPacket(value));
  } else if (msgType == "/ibc.core.channel.v1.MsgAcknowledgement") {
    return saveIbcMsgAcknowledgement(id, cosmos.v1.decodeMsgAcknowledgement(value));
  } else if (msgType == "/cosmos.bank.v1beta1.MsgSend") {
    return saveMsgSend(id, cosmos.v1.decodeMsgSend(value));
  } else if (msgType == "/ibc.lightclients.tendermint.v1.Header") {
    return saveIbcHeader(id, cosmos.v1.decodeCosmosHeader(value));
  }  else if (msgType == "/ibc.applications.transfer.v1.MsgTransfer") {
    return saveMsgTransfer(id, cosmos.v1.decodeMsgTransfer(value));
  }  else if (msgType == "/ibc.core.channel.v1.MsgTimeout") {
    return saveMsgTimeout(id, cosmos.v1.decodeMsgTimeout(value));
  } else if (msgType == "/cosmos.staking.v1beta1.MsgUndelegate") {
    return saveMsgUndelegate(id, cosmos.v1.decodeMsgUndelegate(value));
  } else if (msgType == "/cosmos.staking.v1beta1.MsgBeginRedelegate") {
    return saveMsgBeginRedelegate(id, cosmos.v1.decodeMsgBeginRedelegate(value));
  } else if (msgType == "/tendermint.liquidity.v1beta1.MsgSwapWithinBatch") {
    return saveMsgSwapWithinBatch(id, liquidity.v1.decodeMsgSwapWithinBatch(value));
  } else if (msgType == "/cosmos.bank.v1beta1.MsgMultiSend") {
    return saveMsgMultisend(id, cosmos.v1.decodeMsgMultiSend(value));
  }

  log.info("Unknown msg type: {}", [msgType]);
  return "";
}

function saveMsgDelegate(id: string, m: cosmos.v1.MsgDelegate): string {
  const msg = new MsgDelegate(id);
  msg.delegatorAddress = m.delegator_address;
  msg.validatorAddress = m.validator_address;
  msg.amount = saveCoin(id, m.amount as cosmos.v1.Coin);
  msg.save();
  return id;
}

function saveMsgWithdrawDelegatorReward(
  id: string,
  m: cosmos.v1.MsgWithdrawDelegatorReward
): string {
  const msg = new MsgWithdrawDelegatorReward(id);
  msg.delegatorAddress = m.delegator_address;
  msg.validatorAddress = m.validator_address;
  msg.save();
  return id;
}

function saveMsgFundCommunityPool(id: string, m: cosmos.v1.MsgFundCommunityPool): string {
  const msg = new MsgFundCommunityPool(id);
  msg.amount = saveCoins(id, m.amount);
  msg.depositor = m.depositor;
  return id;
}

function saveMsgSetWithdrawAddress(id: string, m: cosmos.v1.MsgSetWithdrawAddress): string {
  const msg = new MsgSetWithdrawAddress(id);
  msg.delegatorAddress = m.delegator_address;
  msg.withdrawAddress = m.withdraw_address;
  msg.save();
  return id;
}

function saveMsgWithdrawValidatorCommission(id: string, m: cosmos.v1.MsgWithdrawValidatorCommission): string {
  const msg = new MsgWithdrawValidatorCommission(id);
  msg.validatorAddress = m.validator_address;
  msg.save();
  return id;
}

function saveIbcMsgUpdateClient(id: string, m: cosmos.v1.MsgUpdateClient): string {
  const msg = new MsgUpdateClient(id);
  msg.clientId = m.client_id;
  msg.header = saveMessage(id, m.header as cosmos.v1.Any);
  msg.signer = m.signer;
  msg.save();
  return id;
}

function saveIbcMsgRecvPacket(id: string, m: cosmos.v1.MsgRecvPacket): string {
  const msg = new MsgRecvPacket(id);
  msg.packet = msg.packet;
  msg.proofCommitment = Bytes.fromUint8Array(m.proof_commitment as Uint8Array);
  msg.proofHeight = saveHeight(id, m.proof_height as cosmos.v1.Height);
  msg.signer = m.signer;
  msg.save();
  return id;
}

function saveHeight(id: string, m: cosmos.v1.Height): string {
  const msg = new Height(id);
  msg.revisionNumber = BigInt.fromU64(m.revision_height);
  msg.revisionHeight = BigInt.fromU64(m.revision_height);
  msg.save();
  return id;
}

function saveIbcMsgAcknowledgement(id: string, m: cosmos.v1.MsgAcknowledgement): string {
  const msg = new MsgAcknowledgement(id);
  msg.packet = savePacket(id, m.packet as cosmos.v1.Packet);
  msg.acknowledgement = Bytes.fromUint8Array(m.acknowledgement as Uint8Array);
  msg.proofAcked = Bytes.fromUint8Array(m.proof_acked as Uint8Array);
  msg.proofHeight = saveHeight(id, m.proof_height as cosmos.v1.Height);
  msg.signer = m.signer;
  msg.save();
  return id;
}

function savePacket(id: string, m: cosmos.v1.Packet): string {
  const msg = new Packet(id);
  msg.sequence = BigInt.fromU64(m.sequence);
  msg.sourcePort = m.source_port;
  msg.sourceChannel = m.source_port;
  msg.destinationPort = m.destination_port;
  msg.destinationChannel = m.destination_channel;
  msg.data = Bytes.fromUint8Array(m.data as Uint8Array);
  msg.timeoutHeight = saveHeight(id, m.timeout_height as cosmos.v1.Height);
  msg.timeoutTimestamp = BigInt.fromU64(m.timeout_timestamp);
  msg.save();
  return id;
}

function saveMsgSend(id: string, m: cosmos.v1.MsgSend): string {
  const msg = new MsgSend(id);
  msg.fromAddress = m.from_address;
  msg.toAddress = m.to_address;
  msg.amount = saveCoins(id, m.amount);
  msg.save();
  return id;
}

function saveIbcHeader(id: string, h: cosmos.v1.CosmosHeader): string {
  const msg = new CosmosHeader(id);
  msg.trustedHeight = saveHeight(id, h.trusted_height as cosmos.v1.Height);
  msg.save();
  return id;
}

function saveMsgTransfer(id: string, m: cosmos.v1.MsgTransfer): string {
  const msg = new MsgTransfer(id);
  msg.sourcePort = m.source_port;
  msg.sourceChannel = m.source_channel;
  msg.token = saveCoin(id, m.token as cosmos.v1.Coin);
  msg.sender = m.sender;
  msg.receiver = m.receiver;
  if (m.timeout_height) {
    msg.timeoutHeight = saveHeight(id, m.timeout_height as cosmos.v1.Height);
  }
  msg.timeoutTimestamp = BigInt.fromU64(m.timeout_timestamp);
  msg.save();
  return id;
}

function saveMsgTimeout(id: string, m: cosmos.v1.MsgTimeout): string {
  const msg = new MsgTimeout(id);
  msg.packet = savePacket(id, m.packet as cosmos.v1.Packet);
  msg.proofUnreceived = Bytes.fromUint8Array(m.proof_unreceived as Uint8Array);
  msg.proofHeight = saveHeight(id, m.proof_height as cosmos.v1.Height);
  msg.nextSequenceRecv = BigInt.fromU64(m.next_sequence_recv); 
  msg.signer = m.signer;
  msg.save();
  return id;
}

function saveMsgUndelegate(id: string, m: cosmos.v1.MsgUndelegate): string {
  const msg = new MsgUndelegate(id);
  msg.delegatorAddress = m.delegator_address;
  msg.validatorAddress = m.validator_address;
  msg.amount = saveCoin(id, m.amount as cosmos.v1.Coin);
  msg.save()
  return id;
}

function saveMsgBeginRedelegate(id: string, m: cosmos.v1.MsgBeginRedelegate): string {
  const msg = new MsgBeginRedelegate(id);
  msg.delegatorAddress = m.delegator_address;
  msg.validatorSrcAddress = m.validator_src_address;
  msg.validatorDstAddress = m.validator_dst_address
  msg.amount = saveCoin(id, m.amount as cosmos.v1.Coin);
  msg.save()
  return id;
}

function saveMsgSwapWithinBatch(id: string, m: liquidity.v1.MsgSwapWithinBatch): string {
  return id;
}

function saveMsgMultisend(id: string, m: cosmos.v1.MsgMultiSend): string {
  const msg = new MsgMultiSend(id);
  msg.inputs = saveInputs(id, m.inputs);
  msg.outputs = saveOutputs(id, m.outputs);
  msg.save()
  return id;
}

function saveInputs(id: string, inputs: Array<cosmos.v1.Input>): Array<string> {
  const len = inputs.length;
  let inputIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    inputIDs[i] = saveInput(`${id}-${i}`, inputs[i]);
  }
  return inputIDs;
}

function saveInput(id: string, i: cosmos.v1.Input): string {
  const msg = new Input(id);
  msg.address = i.address;
  msg.coins = saveCoins(id, i.coins);
  msg.save();
  return id;
}

function saveOutputs(id: string, outputs: Array<cosmos.v1.Output>): Array<string> {
  const len = outputs.length;
  let outputIDs = new Array<string>(len);
  for (let i = 0; i < len; i++) {
    outputIDs[i] = saveOutput(`${id}-${i}`, outputs[i]);
  }
  return outputIDs;
}

function saveOutput(id: string, o: cosmos.v1.Output): string {
  const msg = new Output(id);
  msg.address = o.address;
  msg.coins = saveCoins(id, o.coins);
  msg.save();
  return id;
}
function uInt8ArrayToStringArray(is: string, uInt8Array: Array<Uint8Array>): Array<Bytes> {
  let array = new Array<Bytes>(uInt8Array.length);
  for (let i = 0; i < uInt8Array.length; i++) {
    array[i] = Bytes.fromUint8Array(uInt8Array[i]);
  }
  return array;
}