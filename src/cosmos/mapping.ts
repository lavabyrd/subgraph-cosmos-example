import { Address as tAddress, BigInt, Bytes, log, tendermint, cosmos as c, ByteArray } from "@graphprotocol/graph-ts";
import {
  Address,
  Any,
  AuthInfo,
  Block,
  BlockID,
  Coin,
  CompactBitArray,
  Consensus,
  Data,
  Fee,
  Header,
  ModeInfo,
  ModeInfoMulti,
  ModeInfoSingle,
  ResponseDeliverTx,
  Reward,
  SignerInfo,
  Timestamp,
  Tip,
  Tx,
  TxBody,
  TxResult,
  Version
} from "../../generated/schema";

export namespace cosmos {
  export function saveTx(id: string, body: c.TxBody, authInfo: c.AuthInfo, signatures: ByteArray): void {
    saveTxBody(id)
    saveAuthInfo(id, authInfo)

    const tx = new Tx(id);
    tx.body = id;
    tx.auth_info = id;
    tx.signatures = signatures;
    tx.save();
  }
  
  export function saveAuthInfo(id: string, ai: c.AuthInfo): void {
    saveFee(id, ai.fee);
    saveTip(id, ai.tip);
    
    const authInfo = new AuthInfo(id);
    authInfo.signer_infos = saveSignerInfos(id, ai.signer_infos);;
    authInfo.fee = id;
    authInfo.tip = id;
    authInfo.save();
  }
  
  export function saveFee(id: string, f: c.Fee): void {
    const fee = new Fee(id);
    fee.amount = saveCoins(id, f.amount);
    fee.gas_limit = BigInt.fromString(f.gas_limit);
    fee.payer = f.payer;
    fee.granter = f.granter;
    fee.save();
  }

  export function saveCoins(id: string, cs: Array<c.Coin>): string[] {
    const coinIDs = [];
    for (let i = 0; i < cs.length; i++) {
        const coinID = `${id}-${i}`;
        coinIDs.push(coinID);
        saveCoin(coinID, cs[i])
    }
    return coinIDs;
  }

  export function saveCoin(id: string, c: c.Coin): void {
    const coin = new Coin(id);
    coin.denom = c.denom;
    coin.amount = c.amount;
    coin.save();
  }
  
  export function saveTip(id: string, t: c.Tip): void {
    const tip = new Tip(id);
    tip.amount = saveCoins(id, t.amount);
    tip.tipper = t.tipper;
    tip.save();
  }
  
  export function saveTxBody(id: string): void {
    const body = new TxBody(id);
    body.messages = [];
    body.memo = "";
    body.timeout_height = BigInt.fromString("");
    body.extension_options = [];
    body.non_critical_extension_options = [];
    body.save();
  }
  
  export function saveSignerInfos(id: string, sis: Array<c.SignerInfo>): string[] {
    const signerInfosIDs = [];
    for (let i = 0; i < sis.length; i++) {
        const signerInfoID = `${id}-${i}`;
        signerInfosIDs.push(signerInfoID);
        saveSignerInfo(signerInfoID, sis[i])
    }
    return signerInfosIDs;
  }
  
  export function saveSignerInfo(id: string, si: c.SignerInfo): void {
    savePublicKey(id, si.public_key)
    saveModeInfo(id, si.mode_info);
  
    const signerInfo = new SignerInfo(id);
    signerInfo.public_key = id;
    signerInfo.mode_info = id;
    signerInfo.sequence = BigInt.fromString(si.sequence.toString());
    signerInfo.save();
  }

  export function savePublicKey(id: string, pk: c.Any): void {
    const publicKey = new Any(id)
    publicKey.type_url = pk.type_url;
    publicKey.value = pk.value;
    publicKey.save();
  }
  
  export function saveModeInfo(id: string, mi: c.ModeInfo): void {
    saveModeInfoSingle(id, mi.single)
    saveModeInfoMulti(id, mi.multi)

    const modeInfo = new ModeInfo(id);
    modeInfo.single = id;
    modeInfo.multi = id;
    modeInfo.save();
  }

  export function saveModeInfoSingle(id: string, s: c.ModeInfoSingle): void {
    const single = new ModeInfoSingle(id);
    single.mode = s.mode;
    single.save();
  }

  export function saveModeInfoMulti(id: string, m: c.ModeInfoMulti): void {
    saveCompactBitArray(id, m.bitarray);

    let modeInfos = [];
    for (let i = 0; i < m.mode_infos.length; i++) {
        const modeInfoID = `${id}-${i}`;
        modeInfos.push(modeInfoID);
        saveModeInfo(modeInfoID, m.mode_infos[i])
    }

    const multi = new ModeInfoMulti(id);
    multi.bitarray = id;
    multi.mode_infos = modeInfos;
    multi.save();
  }

  export function saveCompactBitArray(id: string, c: c.CompactBitArray): void {
    const compactBitArray = new CompactBitArray(id);
    compactBitArray.extra_bits_stored = c.extra_bits_stored;
    compactBitArray.elems = c.elems;
    compactBitArray.save();
  }
}