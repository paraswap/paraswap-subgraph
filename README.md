# Paraswap Subgraph
[ParaSwap](https://www.paraswap.io/) aggregates decentralized exchanges and other DeFi services in one comprehensive interface to streamline and facilitate users' interactions with decentralized finance.
> To read more about Paraswap, visit the official documentaion page [here](https://doc.paraswap.network/).

### About the Subgraph
This subgraph dynamically tracks **all the transactions** (swaps) made via Paraswap on the **Fantom** (fantom) chain. This subgraph supports the latest v5 release.

> You can query the subgraph via GraphQL from the legacy explorer [here](https://thegraph.com/hosted-service/subgraph/paraswap/paraswap-subgraph-fantom).

### Instructions to run locally
#### Setup Graph Node
1. Have a local graph-node setup. Please visit https://github.com/graphprotocol/graph-node for more instructions.

2. Start the local graph-node using the instructions. Replace the `[url]` segment of the cargo command with your RPC provider's url with the network prefix. Example (for mainnet):  
    ```
    cargo run -p graph-node --release -- \
    --postgres-url postgresql://USERNAME[:PASSWORD]@localhost:5432/graph-node \
    --ethereum-rpc mainnet:<URL> \
    --ipfs 127.0.0.1:5001
    ```
#### Build the Subgraph
1. Clone the subgraph, and run `yarn codegen` to generate the required schema and TS files.
2. Run `yarn build` to generate the build files to be deployed.
3. Run `yarn create-local` followed by `yarn deploy-local` to deploy the subgraph to the local graph-node.
4. If you wish to remove the local deployed graph, run `yarn remove-local`.
5. To redploy, follow steps 2 and 3 again.
> Checkout package.json to check the corresponding yarn commands.
