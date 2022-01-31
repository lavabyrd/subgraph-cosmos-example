import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { cosmos } from "@graphprotocol/graph-ts/chain/tendermint/cosmos";
import { Protobuf } from "as-proto";
import { AuthInfo, Coin, CompactBitArray, Fee, ModeInfo, Multi, SignerInfo, Single, Tx, TxBody,
} from "../generated/schema";

export function decodeTxs(id: string, txs: Array<Bytes>): void {
    const len = txs.length;
    log.info("txs len: {}", [len.toString()]);

    for (let i = 0; i < len; i++) {

        // log.info("bytes: {} \n\n hex bytes: {}", [txs[i].toString(), txs[i].toHexString()])

        let tx = decodeTx(txs[i]);
        saveTx(`${id}-${i}`, tx);
        // let typeURL: string = any.type_url as string;

        // log.info("auth_info fee: ", [tx.auth_info.fee.amount.toString()])

        // log.info("tx signatures len: {} \n", [tx.signatures.length.toString()]);

        // let tx = decodeTxResponse(txs[i]);
        // let txRaw = decodeTxBody(txs[i]);


        // let txAny = decodeTx(any.value as Uint8Array);
        // let txBody = decodeTxBody(txRaw.body_bytes as Uint8Array);

        // let body: cosmos.v1.TxBody = tx.body as cosmos.v1.TxBody;
        // let messages: Array<cosmos.v1.Any> = body.messages as Array<cosmos.v1.Any>;
        // let memo: string = body.memo as string; // fee in memo??
        // let timeout_height: u64 = body.timeout_height as u64;
        // // let extension_options: Array<cosmos.v1.Any>;
        // // let non_critical_extension_options: Array<cosmos.v1.Any>;


        // // let authInfo: cosmos.v1.AuthInfo = tx.auth_info as cosmos.v1.AuthInfo;
        // // let signatures: Array<Uint8Array> = tx.signatures as Array<Uint8Array>;

        // // log.info("tx any type_url: {} \nmemo: {} \n timeout_height: {} \n", [typeURL, memo, timeout_height.toString()]);

        // log.info("msgs len: {}", [messages.length.toString()]);

        // for (let j=0; j< messages.length; j++) {
        //     // let message: cosmos.v1.Any = messages[i];
        //     // let msg = decodeAny(messages[i]);
        //     let msgTypeURL: string = messages[j].type_url as string;
        //     log.info("msg {} any type_url: {}", [j.toString(), msgTypeURL]);
        // }


        // let value: Uint8Array = any.value as Uint8Array;
    }
}

// export function decodeTx(tx: Bytes): void {
//     let any = decodeAny(tx);
//     let typeURL: string = any.type_url as string;

//     log.info("tx any type_url: {} \n", [typeURL]);
// }

function saveTx(id: string, tx: cosmos.v1.Tx): void{
    saveAuthInfo(id, tx.auth_info as cosmos.v1.AuthInfo);
    saveBody(id, tx.body as cosmos.v1.TxBody);

    const cTx = new Tx(id);
    cTx.auth_info = id;
    cTx.body = id;
    cTx.save();
}

function saveAuthInfo(id: string, ai: cosmos.v1.AuthInfo): void{
    saveFee(id, ai.fee as cosmos.v1.Fee);

    const authInfo = new AuthInfo(id);
    authInfo.fee = id;
    authInfo.signer_infos = saveSignerInfos(id, ai.signer_infos);
    // authInfo.tip
    authInfo.save()
}

function saveFee(id: string, f: cosmos.v1.Fee): void {
    const fee = new Fee(id);
    fee.amount = saveCoins(id, f.amount);
    fee.gas_limit = BigInt.fromString(f.gas_limit.toString());
    fee.payer = f.payer;
    fee.granter = f.granter;
    fee.save();
}

function saveCoins(id: string, coins: Array<cosmos.v1.Coin>): Array<string> | null {
    const len = coins.length;
    let coinIDs = new Array<string>(len);
    for (let i = 0; i < len; i++) {
        saveCoin(`${id}-${i}`, coins[i])
    }
    return coinIDs;
}

function saveCoin(id: string, c: cosmos.v1.Coin): void{
    const coin = new Coin(id);
    coin.amount = c.amount;
    coin.denom = c.denom;
    coin.save();
}

function saveSignerInfos(id: string, sis: Array<cosmos.v1.SignerInfo>): Array<string> | null {
    const len = sis.length;
    let signerInfoIDs = new Array<string>(len);
    for (let i = 0; i < len; i++) {
        saveSignerInfo(`${id}-${i}`, sis[i])
    }
    return signerInfoIDs;
}

function saveSignerInfo(id: string, si: cosmos.v1.SignerInfo): void {
    savePublicKey(id, si.public_key as cosmos.v1.Any);
    saveModeInfo(id, si.mode_info as cosmos.v1.ModeInfo);

    const signerInfo = new SignerInfo(id);
    signerInfo.public_key = id;
    signerInfo.mode_info = id;
    signerInfo.sequence = BigInt.fromString(si.sequence.toString());
    signerInfo.save();
}

function savePublicKey(id: string, pk: cosmos.v1.Any): void{
    let pv = pk.value as Uint8Array;
    log.info("public key: {} value: {}", [pk.type_url as string, pv.toString()])
}

function saveModeInfo(id: string, mi: cosmos.v1.ModeInfo): void {
    const modeInfo = new ModeInfo(id);
    if (mi.single !== null) {
        saveSingle(id, mi.single as cosmos.v1.Single);
        modeInfo.single = id;
    }
    if (mi.multi !== null) {
        saveMulti(id, mi.multi as cosmos.v1.Multi);
        modeInfo.multi = id;
    }
    
    modeInfo.save()
}

function saveSingle(id: string, s: cosmos.v1.Single): void {
    const single = new Single(id);
    single.mode = s.mode.toString();
    single.save();
}

function saveMulti(id: string, m: cosmos.v1.Multi): void {
    saveCompactBitArray(id, m.bitarray as cosmos.v1.CompactBitArray);
    
    const multi = new Multi(id);
    multi.bitarray = id;
    multi.save();
}

function saveCompactBitArray(id: string, c: cosmos.v1.CompactBitArray): void{
    const compactBitArray = new CompactBitArray(id);
    compactBitArray.extra_bits_stored = BigInt.fromString(c.extra_bits_stored.toString());
    compactBitArray.elems = Bytes.fromUint8Array(c.elems as Uint8Array);
    compactBitArray.save();
}

function saveBody(id: string, b: cosmos.v1.TxBody): void{
    const txBody = new TxBody(id);
    txBody.messages = saveMessages(id, b.messages);
    txBody.memo = b.memo;
    txBody.timeout_height = BigInt.fromString(b.timeout_height.toString());
    txBody.extension_options = saveExtensionOptions(`${id}-extension_options`, b.extension_options);
    txBody.non_critical_extension_options = saveExtensionOptions(`${id}-non_critical_extension_options`, b.non_critical_extension_options);
    txBody.save();
}

function saveMessages(id: string, msgs: Array<cosmos.v1.Any>): Array<string>{
    const len = msgs.length;
    let messegeIDs = new Array<string>(len);
    for (let i = 0; i < len; i++) {
        saveMessege(`${id}-${i}`, msgs[i])
    }
    return messegeIDs;
}

function saveMessege(id: string, msg: cosmos.v1.Any): void {
    let v = msg.value as Uint8Array;
    log.info("msg type: {} value {} ", [msg.type_url as string, v.toString()])
}

function saveExtensionOptions(id: string, eops: Array<cosmos.v1.Any>): Array<string> {
    const len = eops.length;
    let extensionOptionIDs = new Array<string>(len);
    for (let i = 0; i < len; i++) {
        saveExtensionOption(`${id}-${i}`, eops[i])
    }
    return extensionOptionIDs;
}

function saveExtensionOption(id: string, eop: cosmos.v1.Any): void {
    let v = eop.value as Uint8Array;
    log.info("eop type: {} value {} ", [eop.type_url as string, v.toString()])
}

function decodeAny(data: Uint8Array): cosmos.v1.Any {
    return Protobuf.decode<cosmos.v1.Any>(data, cosmos.v1.Any.decode);
}

function decodeTx(tx: Uint8Array): cosmos.v1.Tx {
    return Protobuf.decode<cosmos.v1.Tx>(tx, cosmos.v1.Tx.decode);
}

function decodeTxResponse(tx: Uint8Array): cosmos.v1.TxResponse {
    return Protobuf.decode<cosmos.v1.TxResponse>(tx, cosmos.v1.TxResponse.decode);
}

function decodeTxRaw(txRaw: Uint8Array): cosmos.v1.TxRaw {
    return Protobuf.decode<cosmos.v1.TxRaw>(txRaw, cosmos.v1.TxRaw.decode);
}

function decodeTxBody(tx: Uint8Array): cosmos.v1.TxBody {
    return Protobuf.decode<cosmos.v1.TxBody>(tx, cosmos.v1.TxBody.decode);
}