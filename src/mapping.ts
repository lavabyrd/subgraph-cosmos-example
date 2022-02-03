import { log, tendermint } from "@graphprotocol/graph-ts";

export function handleBlock(el: tendermint.EventList): void {
  let signatures = el.newBlock.block.lastCommit.signatures;

  for (let i = 0; i < signatures.length; i++) {
    log.info("ENUM blockIdFlag: {}", [signatures[i].blockIdFlag.toString()]);
  }
}
