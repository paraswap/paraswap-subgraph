import { Address, BigInt, ByteArray, log, crypto } from "@graphprotocol/graph-ts";
import {
    Bought,
    Bought2,
    Swapped,
    Swapped2,
    SwapOnUniswapCall,
    SwapOnUniswapForkCall,
    BuyOnUniswapCall,
    BuyOnUniswapForkCall,
    SwapOnUniswapV2ForkCall,
    SwapOnUniswapV2ForkWithPermitCall,
    BuyOnUniswapV2ForkCall,
    BuyOnUniswapV2ForkWithPermitCall,
    SwapOnZeroXv2Call,
    SwapOnZeroXv2WithPermitCall,
    SwapOnZeroXv4Call,
    SwapOnZeroXv4WithPermitCall
} from "../generated/AugustusSwapperV5/AugustusSwapperV5";
import { UniswapV2Pair } from "../generated/AugustusSwapperV5/UniswapV2Pair";
import { Swap } from "../generated/schema";

export function handleSwapped(event: Swapped): void {
    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'event';
    swap.initiator = event.params.initiator;
    swap.beneficiary = event.params.beneficiary;
    swap.srcToken = event.params.srcToken;
    swap.destToken = event.params.destToken;
    swap.srcAmount = event.params.srcAmount;
    swap.destAmount = event.params.receivedAmount;
    swap.expectedAmount = event.params.expectedAmount;
    // swap.referrer = event.params.referrer;
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

export function handleSwapped2(event: Swapped2): void {
    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'event';
    swap.initiator = event.params.initiator;
    swap.beneficiary = event.params.beneficiary;
    swap.srcToken = event.params.srcToken;
    swap.destToken = event.params.destToken;
    swap.srcAmount = event.params.srcAmount;
    swap.destAmount = event.params.receivedAmount;
    swap.expectedAmount = event.params.expectedAmount;
    swap.referrer = event.params.partner.toHex();
    swap.feeCode = event.params.feePercent;
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
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'event';
    swap.initiator = event.params.initiator;
    swap.beneficiary = event.params.beneficiary;
    swap.srcToken = event.params.srcToken;
    swap.destToken = event.params.destToken;
    swap.srcAmount = event.params.srcAmount;
    swap.destAmount = event.params.receivedAmount;
    //swap.expectedAmount
    // swap.referrer = event.params.referrer;
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

export function handleBought2(event: Bought2): void {
    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'event';
    swap.initiator = event.params.initiator;
    swap.beneficiary = event.params.beneficiary;
    swap.srcToken = event.params.srcToken;
    swap.destToken = event.params.destToken;
    swap.srcAmount = event.params.srcAmount;
    swap.destAmount = event.params.receivedAmount;
    //swap.expectedAmount
    swap.referrer = event.params.partner.toHex();
    swap.feeCode = event.params.feePercent;
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
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnUniswap';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountIn;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnUniswapFork';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountIn;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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

export function handleSwapOnZeroXv2(call: SwapOnZeroXv2Call): void {
    let srcToken = call.inputs.fromToken;
    let destToken = call.inputs.toToken;
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnZeroXv2-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.fromAmount.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnZeroXv2';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.fromAmount;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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

export function handleSwapOnZeroXv2WithPermit(call: SwapOnZeroXv2WithPermitCall): void {
    let srcToken = call.inputs.fromToken;
    let destToken = call.inputs.toToken;
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnZeroXv2WithPermit-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.fromAmount.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnZeroXv2WithPermit';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.fromAmount;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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

export function handleSwapOnZeroXv4(call: SwapOnZeroXv4Call): void {
    let srcToken = call.inputs.fromToken;
    let destToken = call.inputs.toToken;
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnZeroXv4-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.fromAmount.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnZeroXv4';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.fromAmount;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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

export function handleSwapOnZeroXv4WithPermit(call: SwapOnZeroXv4WithPermitCall): void {
    let srcToken = call.inputs.fromToken;
    let destToken = call.inputs.toToken;
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnZeroXv4WithPermit-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.fromAmount.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnZeroXv4WithPermit';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.fromAmount;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'buyOnUniswap';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountInMax;
    swap.destAmount = call.inputs.amountOut;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'buyOnUniswapFork';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountInMax;
    swap.destAmount = call.inputs.amountOut;
    //swap.expectedAmount
    // let referrer = call.inputs.referrer;
    // swap.referrer = referrer.toString();
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

export function handleSwapOnUniswapV2Fork(call: SwapOnUniswapV2ForkCall): void {
    let srcToken = call.inputs.tokenIn;
    let weth = call.inputs.weth;
    let destToken: Address;
    if (
      srcToken.toHex() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
      weth.toHex() !== '0x0000000000000000000000000000000000000000'
    ) {
      destToken = Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    } else {
      let pools = call.inputs.pools;
      let poolsLength = pools.length;
      if (poolsLength < 1) {
          log.error('Invalid pools length on swapOnUniswapV2Fork tx {}', [
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPool = pools[poolsLength - 1];
      let lastPoolHex = lastPool.toHex();
      let lastPoolHexLength = lastPoolHex.length;
      if (lastPoolHexLength < 42) {
          log.error('Invalid last pool hex {} for swapOnUniswapV2Fork tx {}', [
              lastPoolHex,
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPoolAddress = '0x' + lastPoolHex.slice(lastPoolHexLength - 40);
      let lastPool0To1 = lastPool.rightShift(160).bitAnd(BigInt.fromI32(1)).isZero();
      let lastPairContract = UniswapV2Pair.bind(Address.fromString(lastPoolAddress));
      if (lastPool0To1) {
          let result = lastPairContract.try_token1();
          if (result.reverted) {
              log.error('Failed to get token1 for pool {} in swapOnUniswapV2Fork tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      } else {
          let result = lastPairContract.try_token0();
          if (result.reverted) {
              log.error('Failed to get token0 for pool {} in swapOnUniswapV2Fork tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      }
    }
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnUniswapV2Fork-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.amountIn.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnUniswapV2Fork';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountIn;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    //swap.referrer
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

export function handleSwapOnUniswapV2ForkWithPermit(call: SwapOnUniswapV2ForkWithPermitCall): void {
    let srcToken = call.inputs.tokenIn;
    let weth = call.inputs.weth;
    let destToken: Address;
    if (
      srcToken.toHex() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
      weth.toHex() !== '0x0000000000000000000000000000000000000000'
    ) {
      destToken = Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    } else {
      let pools = call.inputs.pools;
      let poolsLength = pools.length;
      if (poolsLength < 1) {
          log.error('Invalid pools length on swapOnUniswapV2ForkWithPermit tx {}', [
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPool = pools[poolsLength - 1];
      let lastPoolHex = lastPool.toHex();
      let lastPoolHexLength = lastPoolHex.length;
      if (lastPoolHexLength < 42) {
          log.error('Invalid last pool hex {} for swapOnUniswapV2ForkWithPermit tx {}', [
              lastPoolHex,
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPoolAddress = '0x' + lastPoolHex.slice(lastPoolHexLength - 40);
      let lastPool0To1 = lastPool.rightShift(160).bitAnd(BigInt.fromI32(1)).isZero();
      let lastPairContract = UniswapV2Pair.bind(Address.fromString(lastPoolAddress));
      if (lastPool0To1) {
          let result = lastPairContract.try_token1();
          if (result.reverted) {
              log.error('Failed to get token1 for pool {} in swapOnUniswapV2ForkWithPermit tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      } else {
          let result = lastPairContract.try_token0();
          if (result.reverted) {
              log.error('Failed to get token0 for pool {} in swapOnUniswapV2ForkWithPermit tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      }
    }
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'swapOnUniswapV2ForkWithPermit-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.amountIn.toString() + '-'
            + call.inputs.amountOutMin.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Sell';
    swap.method = 'swapOnUniswapV2ForkWithPermit';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountIn;
    swap.destAmount = call.inputs.amountOutMin;
    //swap.expectedAmount
    //swap.referrer
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

export function handleBuyOnUniswapV2Fork(call: BuyOnUniswapV2ForkCall): void {
    let srcToken = call.inputs.tokenIn;
    let weth = call.inputs.weth;
    let destToken: Address;
    if (
      srcToken.toHex() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
      weth.toHex() !== '0x0000000000000000000000000000000000000000'
    ) {
      destToken = Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    } else {
      let pools = call.inputs.pools;
      let poolsLength = pools.length;
      if (poolsLength < 1) {
          log.error('Invalid pools length on buyOnUniswapV2Fork tx {}', [
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPool = pools[poolsLength - 1];
      let lastPoolHex = lastPool.toHex();
      let lastPoolHexLength = lastPoolHex.length;
      if (lastPoolHexLength < 42) {
          log.error('Invalid last pool hex {} for buyOnUniswapV2Fork tx {}', [
              lastPoolHex,
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPoolAddress = '0x' + lastPoolHex.slice(lastPoolHexLength - 40);
      let lastPool0To1 = lastPool.rightShift(160).bitAnd(BigInt.fromI32(1)).isZero();
      let lastPairContract = UniswapV2Pair.bind(Address.fromString(lastPoolAddress));
      if (lastPool0To1) {
          let result = lastPairContract.try_token1();
          if (result.reverted) {
              log.error('Failed to get token1 for pool {} in buyOnUniswapV2Fork tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      } else {
          let result = lastPairContract.try_token0();
          if (result.reverted) {
              log.error('Failed to get token0 for pool {} in buyOnUniswapV2Fork tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      }
    }
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'buyOnUniswapV2Fork-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.amountInMax.toString() + '-'
            + call.inputs.amountOut.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'buyOnUniswapV2Fork';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountInMax;
    swap.destAmount = call.inputs.amountOut;
    //swap.expectedAmount
    //swap.referrer
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

export function handleBuyOnUniswapV2ForkWithPermit(call: BuyOnUniswapV2ForkWithPermitCall): void {
    let srcToken = call.inputs.tokenIn;
    let weth = call.inputs.weth;
    let destToken: Address;
    if (
      srcToken.toHex() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
      weth.toHex() !== '0x0000000000000000000000000000000000000000'
    ) {
      destToken = Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    } else {
      let pools = call.inputs.pools;
      let poolsLength = pools.length;
      if (poolsLength < 1) {
          log.error('Invalid pools length on buyOnUniswapV2ForkWithPermit tx {}', [
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPool = pools[poolsLength - 1];
      let lastPoolHex = lastPool.toHex();
      let lastPoolHexLength = lastPoolHex.length;
      if (lastPoolHexLength < 42) {
          log.error('Invalid last pool hex {} for buyOnUniswapV2ForkWithPermit tx {}', [
              lastPoolHex,
              call.transaction.hash.toHex()
          ]);
          return;
      }
      let lastPoolAddress = '0x' + lastPoolHex.slice(lastPoolHexLength - 40);
      let lastPool0To1 = lastPool.rightShift(160).bitAnd(BigInt.fromI32(1)).isZero();
      let lastPairContract = UniswapV2Pair.bind(Address.fromString(lastPoolAddress));
      if (lastPool0To1) {
          let result = lastPairContract.try_token1();
          if (result.reverted) {
              log.error('Failed to get token1 for pool {} in buyOnUniswapV2ForkWithPermit tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      } else {
          let result = lastPairContract.try_token0();
          if (result.reverted) {
              log.error('Failed to get token0 for pool {} in buyOnUniswapV2ForkWithPermit tx {}', [
                  lastPoolAddress,
                  call.transaction.hash.toHex()
              ]);
              return;
          }
          destToken = result.value;
      }
    }
    let swap = new Swap(
        crypto.keccak256(ByteArray.fromUTF8(
            'buyOnUniswapV2ForkWithPermit-'
            + call.transaction.hash.toHex() + '-'
            + srcToken.toHex() + '-'
            + destToken.toHex() + '-'
            + call.inputs.amountInMax.toString() + '-'
            + call.inputs.amountOut.toString()
        )).toHex()
    );
    // swap.uuid
    swap.augustus = call.to;
    swap.augustusVersion = '5.0.0';
    swap.side = 'Buy';
    swap.method = 'buyOnUniswapV2ForkWithPermit';
    swap.initiator = call.from;
    swap.beneficiary = call.from;
    swap.srcToken = srcToken;
    swap.destToken = destToken;
    swap.srcAmount = call.inputs.amountInMax;
    swap.destAmount = call.inputs.amountOut;
    //swap.expectedAmount
    //swap.referrer
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
