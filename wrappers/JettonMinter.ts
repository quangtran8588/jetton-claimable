import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  TupleBuilder,
  TupleReader,
} from '@ton/core';

export type JettonMinterConfig = {
  totalSupply: bigint;
  admin: Address;
  fixedAmount: bigint;
  cooldown: bigint;
  content: Cell;
  walletCode: Cell;
};

export type MintTokenReq = {
  to: Address; //  Jetton Wallet's owner
  amount: bigint; //  forward Toncoin amount
  masterMsg: Cell;
};

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
  return beginCell()
    .storeCoins(config.totalSupply)
    .storeAddress(config.admin)
    .storeCoins(config.fixedAmount)
    .storeUint(config.cooldown, 64)
    .storeRef(config.content)
    .storeRef(config.walletCode)
    .endCell();
}

export class JettonMinter implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new JettonMinter(address);
  }

  static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
    const data = jettonMinterConfigToCell(config);
    const init = { code, data };
    return new JettonMinter(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, sender: Sender, value: bigint) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendChangeAdmin(provider: ContractProvider, sender: Sender, value: bigint, admin: Address) {
    const msgBody = beginCell()
      .storeUint(3, 32) //  op = 3 for changing Admin
      .storeUint(0, 64) //  query_id  (not use)
      .storeAddress(admin)
      .endCell();
    await provider.internal(sender, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msgBody,
    });
  }

  async sendSetCooldown(provider: ContractProvider, sender: Sender, value: bigint, cooldown: bigint) {
    const msgBody = beginCell()
      .storeUint(5, 32) //  op = 5 for change cooldown time
      .storeUint(0, 64) //  query_id  (not use)
      .storeUint(cooldown, 64)
      .endCell();
    await provider.internal(sender, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msgBody,
    });
  }

  async sendSetFixedAmount(provider: ContractProvider, sender: Sender, value: bigint, fixedAmount: bigint) {
    const msgBody = beginCell()
      .storeUint(6, 32) //  op = 6 for change fixed_claim_amount
      .storeUint(0, 64) //  query_id  (not use)
      .storeCoins(fixedAmount)
      .endCell();
    await provider.internal(sender, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msgBody,
    });
  }

  async sendMintToken(provider: ContractProvider, sender: Sender, value: bigint, req: MintTokenReq) {
    const msgBody = beginCell()
      .storeUint(21, 32) //  op::mint() = 21
      .storeUint(0, 64) //  query_id  (not use)
      .storeAddress(req.to) //  to_address: Jetton Wallet's owner
      .storeCoins(req.amount) //  forward Toncoin amount
      .storeRef(req.masterMsg)
      .endCell();
    await provider.internal(sender, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msgBody,
    });
  }

  async getJettonMinterFullData(provider: ContractProvider) {
    const result: TupleReader = (await provider.get('get_full_jetton_data', [])).stack;

    const totalSupply = result.readBigNumber();
    result.readBigNumber(); //  mintable value
    const admin = result.readAddress();
    const fixedAmount = result.readBigNumber(); //  cooldown time
    const cooldown = result.readBigNumber(); //  cooldown time
    result.readCell(); // content
    result.readCell(); // jetton-wallet code

    return {
      admin: admin,
      totalSupply: totalSupply,
      fixedAmount: fixedAmount,
      cooldown: cooldown,
    };
  }

  async getJettonMinterData(provider: ContractProvider) {
    const result: TupleReader = (await provider.get('get_jetton_data', [])).stack;

    const totalSupply = result.readBigNumber();
    result.readBigNumber(); //  mintable value
    const admin = result.readAddress();
    result.readCell(); // content
    result.readCell(); // jetton-wallet code

    return {
      admin: admin,
      totalSupply: totalSupply,
    };
  }

  async getJettonWalletAddress(provider: ContractProvider, owner: Address) {
    const tuple = new TupleBuilder();
    tuple.writeAddress(owner);

    const result = await provider.get('get_wallet_address', tuple.build());
    return result.stack.readAddress();
  }
}
