import { BigInt, Bytes, log, cosmos } from "@graphprotocol/graph-ts";
import { AuthInfo, Coin, CompactBitArray, Fee, ModeInfo, MsgDelegate, MsgWithdrawDelegatorReward, Multi, PubKey, SignerInfo, Single, Tip, Tx, TxBody,
} from "../generated/schema";

export function decodeTxs(id: string, txs: Array<Bytes>): void {
    txs.forEach((tx, i) => {
        saveTx(`${id}-${i}`, cosmos.v1.decodeTx(tx));
    });
}

function saveTx(id: string, tx: cosmos.v1.Tx): void{
    const cTx = new Tx(id);
    cTx.auth_info = saveAuthInfo(id, tx.auth_info as cosmos.v1.AuthInfo);
    cTx.body = saveBody(id, tx.body as cosmos.v1.TxBody);
    cTx.save();
}

function saveAuthInfo(id: string, ai: cosmos.v1.AuthInfo): string {
    const authInfo = new AuthInfo(id);
    authInfo.fee = saveFee(`${id}-fee`, ai.fee as cosmos.v1.Fee);;
    authInfo.signer_infos = saveSignerInfos(id, ai.signer_infos);
    authInfo.tip = saveTip(`${id}-tip`, ai.tip as cosmos.v1.Tip);;
    authInfo.save()
    return id;
}

function saveFee(id: string, f: cosmos.v1.Fee): string {
    const fee = new Fee(id);
    fee.amount = saveCoins(id, f.amount);
    fee.gas_limit = BigInt.fromString(f.gas_limit.toString());
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

function saveSignerInfos(id: string, sis: Array<cosmos.v1.SignerInfo>): Array<string> {
    let signerInfoIDs = new Array<string>(sis.length);
    sis.forEach((si, i) => {
        signerInfoIDs[i] = saveSignerInfo(`${id}-${i}`, si);
    });
    return signerInfoIDs;
}

function saveSignerInfo(id: string, si: cosmos.v1.SignerInfo): string {
    const signerInfo = new SignerInfo(id);
    signerInfo.public_key = savePublicKey(id, si.public_key as cosmos.v1.Any);
    signerInfo.mode_info = saveModeInfo(id, si.mode_info as cosmos.v1.ModeInfo);
    signerInfo.sequence = BigInt.fromString(si.sequence.toString());
    signerInfo.save();
    return id;
}

function savePublicKey(id: string, pk: cosmos.v1.Any): string {
    let pkURL = pk.type_url as string;
    let pv = pk.value as Uint8Array;

    if (pkURL == "/cosmos.crypto.secp256k1.PubKey") {
        return saveSecp256k1PublicKey(id, cosmos.v1.decodePubKey(pv));
    }

    log.info("public key: {} value: {}", [pkURL, pv.toString()])
    log.error("Unknown public key type {}", [pkURL]);
}

function saveSecp256k1PublicKey(id: string, pk: cosmos.v1.PubKey): string {
    const publicKey = new PubKey(id);
    publicKey.key = Bytes.fromUint8Array(pk.key as Uint8Array);
    publicKey.save()
    return id;
}

function saveModeInfos(id: string, mis: Array<cosmos.v1.ModeInfo>): Array<string> {
    let modeInfoIDs = new Array<string>(mis.length);
    mis.forEach((mi, i) => {
        modeInfoIDs[i] = saveModeInfo(`${id}-${i}`, mi);
    });
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
    multi.bitarray = saveCompactBitArray(id, m.bitarray as cosmos.v1.CompactBitArray);
    multi.mode_infos = saveModeInfos(id, m.mode_infos);
    multi.save();
    return id;
}

function getSignMode(mi: cosmos.v1.SignMode): string {
    switch (mi) {
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
            log.error("Unknown mode info {}", [mi.toString()]);
            return "unknown";
    }
}

function saveCompactBitArray(id: string, c: cosmos.v1.CompactBitArray): string {
    const compactBitArray = new CompactBitArray(id);
    compactBitArray.extra_bits_stored = BigInt.fromString(c.extra_bits_stored.toString());
    compactBitArray.elems = Bytes.fromUint8Array(c.elems as Uint8Array);
    compactBitArray.save();
    return id;
}

function saveBody(id: string, b: cosmos.v1.TxBody): string {
    const txBody = new TxBody(id);
    txBody.messages = saveMessages(id, b.messages);
    txBody.memo = b.memo;
    txBody.timeout_height = BigInt.fromString(b.timeout_height.toString());
    txBody.save();
    return id;
}

function saveMessages(id: string, msgs: Array<cosmos.v1.Any>): Array<string>{
    let messageIDs = new Array<string>(msgs.length);
    msgs.forEach((msg, i) => {
        messageIDs[i] = saveMessage(`${id}-${i}`, msg);
    });
    return messageIDs;
}

function saveMessage(id: string, msg: cosmos.v1.Any): string {
    let msgType = msg.type_url as string;
    let value = msg.value as Uint8Array;

    if (msgType == "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward") {
        saveMsgWithdrawDelegatorReward(id, cosmos.v1.decodeMsgWithdrawDelegatorReward(value));
        return;
    } else if (msgType == "/cosmos.staking.v1beta1.MsgDelegate") {
        saveMsgDelegate(id, cosmos.v1.decodeMsgDelegate(value));
        return;
    }

    log.info("unknown msg type: {}", [msgType])
    return id;
}

function saveMsgDelegate(id: string, m: cosmos.v1.MsgDelegate): void {
    const msg = new MsgDelegate(id);
    msg.delegator_address = m.delegator_address;
    msg.validator_address = m.validator_address;
    msg.amount = saveCoin(id, m.amount as cosmos.v1.Coin);
    msg.save();
}

function saveMsgWithdrawDelegatorReward(id: string, m: cosmos.v1.MsgWithdrawDelegatorReward): void {
    const msg = new MsgWithdrawDelegatorReward(id);
    msg.delegator_address = m.delegator_address;
    msg.validator_address = m.validator_address;
    msg.save()
}
