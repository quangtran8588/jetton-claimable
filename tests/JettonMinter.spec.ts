import '@ton/test-utils';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, toNano } from '@ton/core';
import { compile } from '@ton/blueprint';

import { JettonMinter, JettonMinterConfig, MintTokenReq } from '../wrappers/JettonMinter';
import { JettonWallet, JettonWalletTransfer } from '../wrappers/JettonWallet';
import { buildJettonContentCell, jettonContent } from '../scripts/utils/content';

describe('Jetton', () => {
  let minterCode: Cell, walletCode: Cell;

  beforeAll(async () => {
    minterCode = await compile('JettonMinter');
    walletCode = await compile('JettonWallet');
  });

  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>, user2: SandboxContract<TreasuryContract>;

  let minter: SandboxContract<JettonMinter>;
  let wallet1: SandboxContract<JettonWallet>, wallet2: SandboxContract<JettonWallet>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury('deployer');
    user1 = await blockchain.treasury('user1');
    user2 = await blockchain.treasury('user2');

    const metadata: jettonContent = {
      name: '$POP',
      description: '$$$ Proof of Participant Meme coin',
      symbol: '$POP',
      decimals: '9',
      amountStyle: 'n',
      renderType: 'currency',
      image: 'https://example.com',
    };

    const content = buildJettonContentCell(metadata);

    const config: JettonMinterConfig = {
      totalSupply: BigInt(0), //  total_supply
      admin: deployer.address, //  admin_address
      fixedAmount: BigInt(0), //  fixed_claim_amount
      cooldown: BigInt(0), //  cooldown_time
      content: content, //  content
      walletCode: walletCode, //  jetton_wallet_code
    };
    minter = blockchain.openContract(JettonMinter.createFromConfig(config, minterCode));
    const deployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: minter.address,
      deploy: true,
      success: true,
    });
  });

  it('Mint tokens to Wallet1 and Wallet2', async () => {
    //  set `cooldown_time`
    const cdTime = 24 * 60 * 60;
    await minter.sendSetCooldown(deployer.getSender(), toNano('0.01'), BigInt(cdTime));
    const fixedAmount = toNano('100');
    await minter.sendSetFixedAmount(deployer.getSender(), toNano('0.01'), fixedAmount);
    console.log('Jetton Minter fulldata (Before claim): ', await minter.getJettonMinterFullData());

    const amount = toNano('0.03'); //  forward Toncoin amount to Wallet
    const jettonAmt = 100;
    let forwardPayload = beginCell()
      .storeUint(0, 32) // 0 opcode means we have a comment
      .storeStringTail(`Hello, Mint ${jettonAmt} $POP`)
      .endCell();

    const mintReq1: MintTokenReq = {
      to: user1.address,
      amount: amount,
      masterMsg: beginCell()
        .storeUint(0x178d4519, 32) // op::internal_transfer
        .storeUint(0, 64) // query_id
        .storeCoins(fixedAmount) //  jetton amount
        .storeUint(BigInt(cdTime), 64) // cooldown
        .storeAddress(deployer.address) //  from_address
        .storeAddress(user1.address)
        .storeCoins(toNano('0.01')) //  forward Toncoin amount for forward_payload
        .storeRef(forwardPayload)
        .endCell(),
    };
    await minter.sendMintToken(deployer.getSender(), toNano('0.06'), mintReq1);
    console.log('Jetton Minter fulldata (After 1st claim): ', await minter.getJettonMinterFullData());

    const wallet1Address = await minter.getJettonWalletAddress(user1.address);
    console.log('Jetton Wallet1 address: ', wallet1Address);
    wallet1 = blockchain.openContract(JettonWallet.createFromAddress(wallet1Address));
    console.log('Jetton Wallet1 data: ', await wallet1.getWalletData());

    const mintReq2: MintTokenReq = {
      to: user2.address,
      amount: amount,
      masterMsg: beginCell()
        .storeUint(0x178d4519, 32) // op::internal_transfer
        .storeUint(0, 64) // query_id
        .storeCoins(fixedAmount) //  jetton amount
        .storeUint(BigInt(cdTime), 64) // cooldown
        .storeAddress(deployer.address) //  from_address
        .storeAddress(user1.address)
        .storeCoins(toNano('0.01')) //  forward Toncoin amount for forward_payload
        .storeRef(forwardPayload)
        .endCell(),
    };

    await minter.sendMintToken(deployer.getSender(), toNano('0.06'), mintReq2);
    console.log('Jetton Minter fulldata (After 2nd claim): ', await minter.getJettonMinterFullData());
    const wallet2Address = await minter.getJettonWalletAddress(user2.address);
    console.log('Jetton Wallet2 address: ', wallet2Address);
    wallet2 = blockchain.openContract(JettonWallet.createFromAddress(wallet2Address));
    console.log('Jetton Wallet2 data: ', await wallet2.getWalletData());

    forwardPayload = beginCell()
      .storeUint(0, 32) // 0 opcode means we have a comment
      .storeStringTail('Hello, TON!')
      .endCell();
    const transferReq: JettonWalletTransfer = {
      amount: toNano('50'),
      toAddress: user2.address,
      responseAddress: user2.address,
      forwardTonAmount: toNano('0.01'),
      forwardPayload: forwardPayload,
    };
    await wallet1.sendTransfer(user1.getSender(), toNano('0.08'), transferReq);
    wallet2 = blockchain.openContract(JettonWallet.createFromAddress(wallet2Address));
    console.log('Jetton Wallet2 data: (After transfer)', await wallet2.getWalletData());
  });
});
