import { Address, OpenedContract, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';

import { JettonMinter, JettonMinterConfig } from '../wrappers/JettonMinter';
import { buildJettonContentCell, jettonContent } from './utils/content';

export async function run(provider: NetworkProvider) {
  const minterCode = await compile('JettonMinter');
  const walletCode = await compile('JettonWallet');

  const admin = provider.sender().address as Address;
  const metadata: jettonContent = {
    name: 'Testing Token',
    description: 'TON: Testing Token',
    image: '', //  your image URL
    symbol: '$KFI',
    decimals: '9',
    amountStyle: 'n',
    renderType: 'currency',
  };
  const content = buildJettonContentCell(metadata);
  const cdTime = BigInt(2 * 60); //  Cooldown time before two claims (e.g. 24 hours)
  const amountPerClaim = '100';

  console.log('\n===== Deploy Jetton Minter contract ===== ');

  const config: JettonMinterConfig = {
    totalSupply: BigInt(0),
    admin: admin,
    fixedAmount: toNano(amountPerClaim),
    cooldown: cdTime,
    content: content,
    walletCode: walletCode,
  };

  const minter: OpenedContract<JettonMinter> = provider.open(JettonMinter.createFromConfig(config, minterCode));
  await minter.sendDeploy(provider.sender(), toNano('0.05'));
  await provider.waitForDeploy(minter.address);

  console.log('\n===== Deploy Complete ===== ');

  console.log('Jetton Minter address: ', minter.address);

  console.log('\n===== DONE =====');
}
