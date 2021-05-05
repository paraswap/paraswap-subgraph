import { BigInt, ByteArray, log, crypto } from "@graphprotocol/graph-ts";
import {
  AugustusSwapperV4,
  AdapterInitialized,
  Bought,
  FeeTaken,
  OwnershipTransferred,
  Swapped,
  SwapOnUniswapCall,
  SwapOnUniswapForkCall,
  BuyOnUniswapCall,
  BuyOnUniswapForkCall
} from "../generated/AugustusSwapperV4/AugustusSwapperV4";
import { ExampleEntity, Swap } from "../generated/schema";

export function handleAdapterInitialized(event: AdapterInitialized): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.adapter = event.params.adapter

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.getChangeRequestedBlock(...)
  // - contract.getData(...)
  // - contract.getFeeWallet(...)
  // - contract.getPartnerRegistry(...)
  // - contract.getPendingUniswapProxy(...)
  // - contract.getTimeLock(...)
  // - contract.getTokenTransferProxy(...)
  // - contract.getUniswapProxy(...)
  // - contract.getVersion(...)
  // - contract.getWhitelistAddress(...)
  // - contract.isInitialized(...)
  // - contract.owner(...)
}

export function handleSwapped(event: Swapped): void {
  let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  swap.augustus = event.address;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Sell';
  swap.method = 'event';
  swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.beneficiary;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  swap.expectedAmount = event.params.expectedAmount;
  swap.referrer = event.params.referrer;
  swap.txHash = event.transaction.hash;
  swap.txOrigin = event.transaction.from;
  swap.txTarget = event.transaction.to;
  swap.txGasUsed = event.transaction.gasUsed;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();
}

export function handleBought(event: Bought): void {
  let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  swap.augustus = event.address;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Buy';
  swap.method = 'event';
  swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.beneficiary;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  //swap.expectedAmount
  swap.referrer = event.params.referrer;
  swap.txHash = event.transaction.hash;
  swap.txOrigin = event.transaction.from;
  swap.txTarget = event.transaction.to;
  swap.txGasUsed = event.transaction.gasUsed;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();
}

export function handleFeeTaken(event: FeeTaken): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleSwapOnUniswap(call: SwapOnUniswapCall): void {
  let path = call.inputs.path;
  let pathLength = path.length;
  if (pathLength < 2) {
    log.error('Invalid path length {} on swapOnUniswap tx {}', [
      pathLength.toString(),
      call.transaction.hash.toHex()
    ]);
    return;
  }
  let srcToken = path[0];
  let destToken = path[pathLength - 1];
  let swap = new Swap(
    crypto.keccak256(ByteArray.fromUTF8(
      'swapOnUniswap-'
      + call.transaction.hash.toHex() + '-'
      + srcToken.toHex() + '-'
      + destToken.toHex() + '-'
      + call.inputs.amountIn.toString() + '-'
      + call.inputs.amountOutMin.toString()
    )).toHex()
  );
  swap.augustus = call.to;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Sell';
  swap.method = 'swapOnUniswap';
  swap.initiator = call.from;
  swap.beneficiary = call.from;
  swap.srcToken = srcToken;
  swap.destToken = destToken;
  swap.srcAmount = call.inputs.amountIn;
  swap.destAmount = call.inputs.amountOutMin;
  //swap.expectedAmount
  let referrer = call.inputs.referrer;
  swap.referrer = referrer.toString();
  swap.txHash = call.transaction.hash;
  swap.txOrigin = call.transaction.from;
  swap.txTarget = call.transaction.to;
  swap.txGasUsed = call.transaction.gasUsed;
  swap.txGasPrice = call.transaction.gasPrice;
  swap.blockHash = call.block.hash;
  swap.blockNumber = call.block.number;
  swap.timestamp = call.block.timestamp;
  swap.save();
}

export function handleSwapOnUniswapFork(call: SwapOnUniswapForkCall): void {
  let path = call.inputs.path;
  let pathLength = path.length;
  if (pathLength < 2) {
    log.error('Invalid path length {} on swapOnUniswapFork tx {}', [
      pathLength.toString(),
      call.transaction.hash.toHex()
    ]);
    return;
  }
  let srcToken = path[0];
  let destToken = path[pathLength - 1];
  let swap = new Swap(
    crypto.keccak256(ByteArray.fromUTF8(
      'swapOnUniswapFork-'
      + call.transaction.hash.toHex() + '-'
      + srcToken.toHex() + '-'
      + destToken.toHex() + '-'
      + call.inputs.amountIn.toString() + '-'
      + call.inputs.amountOutMin.toString()
    )).toHex()
  );
  swap.augustus = call.to;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Sell';
  swap.method = 'swapOnUniswapFork';
  swap.initiator = call.from;
  swap.beneficiary = call.from;
  swap.srcToken = srcToken;
  swap.destToken = destToken;
  swap.srcAmount = call.inputs.amountIn;
  swap.destAmount = call.inputs.amountOutMin;
  //swap.expectedAmount
  let referrer = call.inputs.referrer;
  swap.referrer = referrer.toString();
  swap.txHash = call.transaction.hash;
  swap.txOrigin = call.transaction.from;
  swap.txTarget = call.transaction.to;
  swap.txGasUsed = call.transaction.gasUsed;
  swap.txGasPrice = call.transaction.gasPrice;
  swap.blockHash = call.block.hash;
  swap.blockNumber = call.block.number;
  swap.timestamp = call.block.timestamp;
  swap.save();
}

export function handleBuyOnUniswap(call: BuyOnUniswapCall): void {
  let path = call.inputs.path;
  let pathLength = path.length;
  if (pathLength < 2) {
    log.error('Invalid path length {} on buyOnUniswap tx {}', [
      pathLength.toString(),
      call.transaction.hash.toHex()
    ]);
    return;
  }
  let srcToken = path[0];
  let destToken = path[pathLength - 1];
  let swap = new Swap(
    crypto.keccak256(ByteArray.fromUTF8(
      'buyOnUniswap-'
      + call.transaction.hash.toHex() + '-'
      + srcToken.toHex() + '-'
      + destToken.toHex() + '-'
      + call.inputs.amountInMax.toString() + '-'
      + call.inputs.amountOut.toString()
    )).toHex()
  );
  swap.augustus = call.to;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Buy';
  swap.method = 'buyOnUniswap';
  swap.initiator = call.from;
  swap.beneficiary = call.from;
  swap.srcToken = srcToken;
  swap.destToken = destToken;
  swap.srcAmount = call.inputs.amountInMax;
  swap.destAmount = call.inputs.amountOut;
  //swap.expectedAmount
  let referrer = call.inputs.referrer;
  swap.referrer = referrer.toString();
  swap.txHash = call.transaction.hash;
  swap.txOrigin = call.transaction.from;
  swap.txTarget = call.transaction.to;
  swap.txGasUsed = call.transaction.gasUsed;
  swap.txGasPrice = call.transaction.gasPrice;
  swap.blockHash = call.block.hash;
  swap.blockNumber = call.block.number;
  swap.timestamp = call.block.timestamp;
  swap.save();
}

export function handleBuyOnUniswapFork(call: BuyOnUniswapForkCall): void {
  let path = call.inputs.path;
  let pathLength = path.length;
  if (pathLength < 2) {
    log.error('Invalid path length {} on buyOnUniswapFork tx {}', [
      pathLength.toString(),
      call.transaction.hash.toHex()
    ]);
    return;
  }
  let srcToken = path[0];
  let destToken = path[pathLength - 1];
  let swap = new Swap(
    crypto.keccak256(ByteArray.fromUTF8(
      'buyOnUniswapFork-'
      + call.transaction.hash.toHex() + '-'
      + srcToken.toHex() + '-'
      + destToken.toHex() + '-'
      + call.inputs.amountInMax.toString() + '-'
      + call.inputs.amountOut.toString()
    )).toHex()
  );
  swap.augustus = call.to;
  swap.augustusVersion = '4.0.0';
  swap.side = 'Buy';
  swap.method = 'buyOnUniswapFork';
  swap.initiator = call.from;
  swap.beneficiary = call.from;
  swap.srcToken = srcToken;
  swap.destToken = destToken;
  swap.srcAmount = call.inputs.amountInMax;
  swap.destAmount = call.inputs.amountOut;
  //swap.expectedAmount
  let referrer = call.inputs.referrer;
  swap.referrer = referrer.toString();
  swap.txHash = call.transaction.hash;
  swap.txOrigin = call.transaction.from;
  swap.txTarget = call.transaction.to;
  swap.txGasUsed = call.transaction.gasUsed;
  swap.txGasPrice = call.transaction.gasPrice;
  swap.blockHash = call.block.hash;
  swap.blockNumber = call.block.number;
  swap.timestamp = call.block.timestamp;
  swap.save();
}
