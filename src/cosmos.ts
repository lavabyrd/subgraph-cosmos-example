import { Bytes, log } from "@graphprotocol/graph-ts";
import { cosmos } from "@graphprotocol/graph-ts/chain/tendermint/cosmos";
import { Protobuf } from "as-proto";

export function decodeTxs(txs: Array<Bytes>): void {
    const len = txs.length;
    log.info("txs len: {}", [len.toString()]);

    for (let i = 0; i < len; i++) {

        log.info("bytes: {} \n\n hex bytes: {}", [txs[i].toString(), txs[i].toHexString()])

        let tx = decodeTx(txs[i]);
        // let typeURL: string = any.type_url as string;

        log.info("tx signatures len: {} \n", [tx.signatures.length.toString()]);

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