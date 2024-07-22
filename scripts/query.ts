import { Address, OpenedContract, beginCell, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider) {
  const args = process.argv.slice(6);
  const option = args[0] as string;
  const contractAddress = Address.parse(args[1] as string);

  let result: any;
  if (option === 'minter_data') {
    const minter: OpenedContract<JettonMinter> = provider.open(JettonMinter.createFromAddress(contractAddress));

    result = await minter.getJettonMinterData();
  } else if (option === 'minter_fulldata') {
    const minter: OpenedContract<JettonMinter> = provider.open(JettonMinter.createFromAddress(contractAddress));

    result = await minter.getJettonMinterFullData();
  } else if (option === 'wallet_data') {
    const wallet: OpenedContract<JettonWallet> = provider.open(JettonWallet.createFromAddress(contractAddress));

    result = await wallet.getWalletData();
  } else if (option === 'wallet_lastclaim') {
    const wallet: OpenedContract<JettonWallet> = provider.open(JettonWallet.createFromAddress(contractAddress));

    result = await wallet.getLastClaim();
  } else if (option === 'wallet_address') {
    const owner = Address.parse(args[2] as string);
    const minter: OpenedContract<JettonMinter> = provider.open(JettonMinter.createFromAddress(contractAddress));

    result = await minter.getJettonWalletAddress(owner);
  }

  console.log('Result: ', result);

  console.log('\n===== DONE =====');
}
