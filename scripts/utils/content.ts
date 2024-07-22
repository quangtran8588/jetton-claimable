import { Dictionary, beginCell, Cell } from '@ton/core';
import { sha256_sync } from '@ton/crypto';

export function toSha256(s: string): bigint {
  return BigInt('0x' + sha256_sync(s).toString('hex'));
}

export function toTextCell(s: string): Cell {
  return beginCell().storeUint(0, 8).storeStringTail(s).endCell();
}

export type jettonContent = {
  name: string;
  description: string;
  image: string;
  symbol: string;
  decimals: string;
  amountStyle: string;
  renderType: string;
};

export function buildJettonContentCell(content: jettonContent): Cell {
  const jettonContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
    .set(toSha256('name'), toTextCell(content.name))
    .set(toSha256('description'), toTextCell(content.description))
    .set(toSha256('image'), toTextCell(content.image))
    .set(toSha256('symbol'), toTextCell(content.symbol))
    .set(toSha256('decimals'), toTextCell(content.decimals))
    .set(toSha256('amount_stye'), toTextCell(content.amountStyle))
    .set(toSha256('render_type'), toTextCell(content.renderType));

  return beginCell() // need to fix
    .storeUint(0, 8)
    .storeDict(jettonContentDict)
    .endCell();
}
