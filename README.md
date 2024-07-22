# Jetton Claimable

This contract provides an example of creating the `Jetton Claimable Minter` on TON network. Contract has not been testing nor audit to check security issues. Please be carefull when using this contract in the production.

### Project structure

- `contracts` - source code of all the smart contracts of the project and their dependencies.
- `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
- `tests` - tests for the contracts.
- `scripts` - scripts used by the project, mainly the deployment scripts.

### Running Experiment

- Install dependencies

```bash
yarn
```

- Build contracts

```bash
yarn build
```

- Run basic testing script

```bash
yarn test
```

- Deploy `jetton-claimable-minter` to the TON Testnet:

```bash
//  Take a look at ./scripts/deployMinter.ts
//  and modify `metadata`, `cdTime`, and `amountPerClaim` settings
yarn deploy_minter
```

- Make a claim:

```bash
yarn claim <JETTON_MINTER_CONTRACT_ADDRESS>
```

- Make a transfer:

```bash
yarn transfer <JETTON_WALLET_ADDRESS> <TO_TON_ACCOUNT_ADDRESS> <AMOUNT>
```

- Query contract's data:

```bash
//  query info from Jetton Minter contract
yarn query minter_data <JETTON_MINTER_CONTRACT_ADDRESS>
yarn query minter_fulldata <JETTON_MINTER_CONTRACT_ADDRESS>

//  query Jetton Wallet Address of one TON Account
yarn query wallet_address <JETTON_MINTER_CONTRACT_ADDRESS> <TON_ACCOUNT_ADDRESS>

//  query info from Jetton Wallet contract
yarn query wallet_data <JETTON_WALLET_CONTRACT_ADDRESS>
yarn query wallet_lastclaim <JETTON_WALLET_CONTRACT_ADDRESS>
```
