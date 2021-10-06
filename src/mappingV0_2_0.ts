import {
  Payed,
  Swapped,
} from "../generated/AugustusSwapperV0_2_0/AugustusSwapperV0_2_0";
import { Swap } from "../generated/schema";

export function handleSwapped(event: Swapped): void {
  let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  swap.augustus = event.address;
  swap.augustusVersion = '0.2.0';
  swap.side = 'Sell';
  swap.method = 'event';
  swap.initiator = event.params.user;
  swap.beneficiary = event.params.user;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  // swap.expectedAmount = event.params.expectedAmount;
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

export function handlePayed(event: Payed): void {
  let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  swap.augustus = event.address;
  swap.augustusVersion = '0.2.0';
  swap.side = 'Sell';
  swap.method = 'event';
  // swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.to;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  // swap.expectedAmount = event.params.expectedAmount;
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
