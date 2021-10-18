import {
  Bought,
  Swapped,
  FeeTaken,
  TransferTokensCall,
} from "../generated/AugustusSwapperV4/AugustusSwapperV4";
import { Swap, Fee, TokenTransfer } from "../generated/schema";
import { crypto, ByteArray } from "@graphprotocol/graph-ts";

export function handleSwapped(event: Swapped): void {
  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.augustus = event.address;
  swap.augustusVersion = "4.0.0";
  swap.side = "Sell";
  swap.method = "event";
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
  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.augustus = event.address;
  swap.augustusVersion = "4.0.0";
  swap.side = "Buy";
  swap.method = "event";
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

export function handleFeeTaken(event: FeeTaken): void {
  let fee = new Fee(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  fee.augustus = event.address;
  fee.augustusVersion = "4.0.0";
  fee.fee = event.params.fee;
  fee.partnerShare = event.params.partnerShare;
  fee.paraswapShare = event.params.paraswapShare;
  fee.txHash = event.transaction.hash;
  fee.blockNumber = event.block.number;
  fee.timestamp = event.block.timestamp;
  fee.save();
}

export function handleTransferTokens(call: TransferTokensCall): void {
  let tokenTransfer = new TokenTransfer(
    crypto
      .keccak256(
        ByteArray.fromUTF8(
          "tokenTransfer-" +
            call.transaction.hash.toHex() +
            "-" +
            call.inputs.token.toString() +
            "-" +
            call.inputs.amount.toString() +
            "-" +
            call.inputs.destination.toString()
        )
      )
      .toHex()
  );
  tokenTransfer.augustusVersion = "4.0.0";
  tokenTransfer.token = call.inputs.token;
  tokenTransfer.tokenAmount = call.inputs.amount;
  tokenTransfer.toAddress = call.inputs.destination;
  tokenTransfer.blockNumber = call.block.number;
  tokenTransfer.timestamp = call.block.timestamp;
  tokenTransfer.txHash = call.transaction.hash;
  tokenTransfer.save();
}
