import { ByteArray, log, crypto } from "@graphprotocol/graph-ts";
import {
  Bought,
  Swapped,
  FeeTaken,
  SwapOnUniswapCall,
  SwapOnUniswapForkCall,
  BuyOnUniswapCall,
  BuyOnUniswapForkCall
} from "../generated/AugustusSwapperV4/AugustusSwapperV4";
import { Swap, Fee } from "../generated/schema";

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
  swap.txGasUsed = event.transaction.gasLimit;
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
  swap.txGasUsed = event.transaction.gasLimit;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();
}

export function handleFeeTaken(event: FeeTaken): void {
  let fee = new Fee(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  fee.augustus = event.address
  fee.augustusVersion = '4.0.0'
  fee.fee = event.params.fee
  fee.partnerShare = event.params.partnerShare
  fee.paraswapShare = event.params.paraswapShare
  fee.txHash = event.transaction.hash
  fee.blockNumber = event.block.number;
  fee.timestamp = event.block.timestamp;
  fee.save()
}

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
  swap.txGasUsed = call.transaction.gasLimit;
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
  swap.txGasUsed = call.transaction.gasLimit;
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
  swap.txGasUsed = call.transaction.gasLimit;
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
  swap.txGasUsed = call.transaction.gasLimit;
  swap.txGasPrice = call.transaction.gasPrice;
  swap.blockHash = call.block.hash;
  swap.blockNumber = call.block.number;
  swap.timestamp = call.block.timestamp;
  swap.save();
}
