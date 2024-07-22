import { Address, beginCell, OpenedContract, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { JettonWallet, JettonWalletTransfer } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider) {
  const args = process.argv.slice(6);
  if (args.length !== 3) throw new Error('Error: Invalid arguments!');

  const walletAddress = Address.parse(args[0] as string);
  const wallet: OpenedContract<JettonWallet> = provider.open(JettonWallet.createFromAddress(walletAddress));
  const toAddress = Address.parse(args[1] as string);
  const amount = args[2] as string;

  const forwardPayload = beginCell()
    .storeUint(0, 32) // 0 opcode means we have a comment
    .storeStringTail(`Transfer ${amount} tokens`)
    .endCell();

  console.log('\n===== Transfer Token ===== ');

  const transferReq: JettonWalletTransfer = {
    amount: toNano(amount),
    toAddress: toAddress,
    responseAddress: provider.sender().address as Address,
    forwardTonAmount: toNano('0.02'),
    forwardPayload: forwardPayload,
  };

  await wallet.sendTransfer(provider.sender(), toNano('0.05'), transferReq);

  console.log('\n===== Transfer Token Complete ===== ');

  console.log('\n===== DONE =====');
}
