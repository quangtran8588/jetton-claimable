import { Address, beginCell, OpenedContract, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { JettonMinter, MintTokenReq } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) {
  const args = process.argv.slice(6);
  if (args.length !== 1) throw new Error('Error: Invalid arguments!');

  //  sender = receiver. It can be modified as `sender` != `receiver`
  //  Note: Claimable Jetton Minter has cooldown time. It counts on `receiver`
  const fromAddress = provider.sender().address as Address;
  const toAddress = provider.sender().address as Address;

  const forwardPayload = beginCell()
    .storeUint(0, 32) // 0 opcode means we have a comment
    .storeStringTail('Hello, Mint POP')
    .endCell();
  const minterAddress = Address.parse(args[0] as string);
  const minter: OpenedContract<JettonMinter> = provider.open(JettonMinter.createFromAddress(minterAddress));

  const result = await minter.getJettonMinterFullData();
  const jettonAmt: bigint = result.fixedAmount;
  const cooldown: bigint = result.cooldown;

  console.log('\n===== Mint Token ===== ');

  const mintReq: MintTokenReq = {
    to: toAddress,
    amount: toNano('0.05'), //  forward Toncoin amount to Jetton Wallet
    masterMsg: beginCell()
      .storeUint(0x178d4519, 32) // op::internal_transfer
      .storeUint(0, 64) // query_id
      .storeCoins(jettonAmt) //  jetton amount
      .storeUint(cooldown, 64)
      .storeAddress(toAddress) //  from_address
      .storeAddress(fromAddress)
      .storeBit(0) //  no custom payload
      .storeCoins(toNano('0.01')) //  forward Toncoin amount for forward_payload
      .storeBit(1) // store forward_payload as a reference
      .storeRef(forwardPayload)
      .endCell(),
  };
  await minter.sendMintToken(provider.sender(), toNano('0.08'), mintReq);

  console.log('\n===== Mint Token Complete ===== ');

  console.log('\n===== DONE =====');
}
