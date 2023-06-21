import { BigInt } from "@graphprotocol/graph-ts";
import {
  BoughtV3,
  SwappedV3,
  SwappedDirect,
  Swapped,
  Swapped2,
  Bought,
  Bought2
} from "../generated/AugustusSwapperV5/AugustusSwapperV5";
import { Swap, ReferrerFee, PartnerFee } from "../generated/schema";
import {
  calcFeeShareV3,
  _isReferralProgram,
  _isTakeFeeFromSrcToken,
  _isNoFeeAndSplitSlippage,
  _isTakeSlippage,
  calcFeeShareV2
} from "./feeHandler";

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
    swap.txGasUsed = event.transaction.gasLimit;
    swap.txGasPrice = event.transaction.gasPrice;
    swap.blockHash = event.block.hash;
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.save();
}

export function handleSwapped2(event: Swapped2): void {
    let feeShare = calcFeeShareV2(
        event.params.feePercent,
        event.params.partner,
        event.params.receivedAmount,
        event.params.expectedAmount
    );

    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.2.0';
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
    swap.referrerFee = feeShare.partnerShare;
    swap.paraswapFee = feeShare.paraswapShare;
    swap.feeCode = event.params.feePercent;
    swap.feeToken = event.params.destToken;
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

export function handleSwappedV3(event: SwappedV3): void {
  let feeShare = calcFeeShareV3(
    event.params.feePercent,
    event.params.partner,
    event.params.srcAmount,
    event.params.receivedAmount,
    event.params.expectedAmount,
    "sell"
  );

  let partnerShare = feeShare.partnerShare;
  let paraswapShare = feeShare.paraswapShare;

  let feeCode = event.params.feePercent;
  let isReferralProgramBool = _isReferralProgram(event.params.feePercent);
  let feeToken = _isTakeSlippage(feeCode, event.params.partner)
    ? event.params.destToken // sell design ensures slippage on destToken only
    : _isTakeFeeFromSrcToken(event.params.feePercent)
    ? event.params.srcToken
    : event.params.destToken;

  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.uuid = event.params.uuid;
  swap.augustus = event.address;
  swap.augustusVersion = "5.3.0";
  swap.side = "Sell";
  swap.method = "event";
  swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.beneficiary;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  swap.expectedAmount = event.params.expectedAmount;
  swap.referrer = event.params.partner.toHex();
  swap.referrerFee = partnerShare;
  swap.paraswapFee = paraswapShare;
  swap.referralProgram = isReferralProgramBool;
  swap.feeToken = feeToken;
  swap.feeCode = event.params.feePercent;
  swap.txHash = event.transaction.hash;
  swap.txOrigin = event.transaction.from;
  swap.txTarget = event.transaction.to;
  swap.txGasUsed = event.transaction.gasLimit;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();

  if (partnerShare.gt(BigInt.fromI32(0))) {
    // ReferrerFee entity
    if (isReferralProgramBool) {
      let referrerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let referrerFee = ReferrerFee.load(referrerFeeId);
      if (!referrerFee) {
        referrerFee = new ReferrerFee(referrerFeeId);
        referrerFee.referrerAddress = event.params.partner;
        referrerFee.tokenAddress = feeToken;
        referrerFee.totalRewards = partnerShare;
      } else {
        referrerFee.totalRewards = referrerFee.totalRewards.plus(partnerShare);
      }
      referrerFee.save();
    }

    // PartnerFee entity
    else {
      let partnerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let partnerFee = PartnerFee.load(partnerFeeId);
      if (!partnerFee) {
        partnerFee = new PartnerFee(partnerFeeId);
        partnerFee.partnerAddress = event.params.partner;
        partnerFee.tokenAddress = feeToken;
        partnerFee.totalRewards = partnerShare;
      } else {
        partnerFee.totalRewards = partnerFee.totalRewards.plus(partnerShare);
      }
      partnerFee.save();
    }
  }
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
    swap.txGasUsed = event.transaction.gasLimit;
    swap.txGasPrice = event.transaction.gasPrice;
    swap.blockHash = event.block.hash;
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.save();
}

export function handleBought2(event: Bought2): void {
    let feeShare = calcFeeShareV2(
        event.params.feePercent,
        event.params.partner,
        event.params.receivedAmount,
        event.params.receivedAmount //need to confirm this
    );

    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.2.0';
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
    swap.referrerFee = feeShare.partnerShare;
    swap.paraswapFee = feeShare.paraswapShare;
    swap.feeCode = event.params.feePercent;
    swap.feeToken = event.params.destToken;
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



export function handleBoughtV3(event: BoughtV3): void {
  let feeShare = calcFeeShareV3(
    event.params.feePercent,
    event.params.partner,
    event.params.srcAmount,
    event.params.receivedAmount,
    event.params.expectedAmount,
    "buy"
  );

  let partnerShare = feeShare.partnerShare;
  let paraswapShare = feeShare.paraswapShare;

  let feeCode = event.params.feePercent;
  let isReferralProgramBool = _isReferralProgram(feeCode);
  let feeToken = _isTakeSlippage(feeCode, event.params.partner)
    ? event.params.srcToken // buy design ensures slippage on srcToken only
    : _isTakeFeeFromSrcToken(feeCode)
    ? event.params.srcToken
    : event.params.destToken;

  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.uuid = event.params.uuid;
  swap.augustus = event.address;
  swap.augustusVersion = "5.3.0";
  swap.side = "Buy";
  swap.method = "event";
  swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.beneficiary;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  swap.expectedAmount = event.params.expectedAmount;
  swap.referrer = event.params.partner.toHex();
  swap.referrerFee = partnerShare;
  swap.paraswapFee = paraswapShare;
  swap.referralProgram = isReferralProgramBool;
  swap.feeToken = feeToken;
  swap.feeCode = event.params.feePercent;
  swap.txHash = event.transaction.hash;
  swap.txOrigin = event.transaction.from;
  swap.txTarget = event.transaction.to;
  swap.txGasUsed = event.transaction.gasLimit;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();

  if (partnerShare.gt(BigInt.fromI32(0))) {
    // ReferrerFee entity
    if (isReferralProgramBool) {
      let referrerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let referrerFee = ReferrerFee.load(referrerFeeId);
      if (!referrerFee) {
        referrerFee = new ReferrerFee(referrerFeeId);
        referrerFee.referrerAddress = event.params.partner;
        referrerFee.tokenAddress = feeToken;
        referrerFee.totalRewards = partnerShare;
      } else {
        referrerFee.totalRewards = referrerFee.totalRewards.plus(partnerShare);
      }
      referrerFee.save();
    }

    // PartnerFee entity
    else {
      let partnerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let partnerFee = PartnerFee.load(partnerFeeId);
      if (!partnerFee) {
        partnerFee = new PartnerFee(partnerFeeId);
        partnerFee.partnerAddress = event.params.partner;
        partnerFee.tokenAddress = feeToken;
        partnerFee.totalRewards = partnerShare;
      } else {
        partnerFee.totalRewards = partnerFee.totalRewards.plus(partnerShare);
      }
      partnerFee.save();
    }
  }
}

/*
Given that
    enum DirectSwapKind {
        UNIV3_SELL,
        UNIV3_BUY,
        CURVEV1,
        CURVEV2,
        BALV2_SELL,
        BALV2_BUY
    }
*/
let UNIV3_BUY_KIND = BigInt.fromI32(1);
let BALV2_BUY_KIND = BigInt.fromI32(5);
export function handleSwappedDirect(event: SwappedDirect): void {
  let kind = BigInt.fromI32(event.params.kind);
  let side =
    UNIV3_BUY_KIND.equals(kind) || BALV2_BUY_KIND.equals(kind) ? "Buy" : "Sell";
  let sideLow = side === "Buy" ? "buy" : "sell";
  let feeShare = calcFeeShareV3(
    event.params.feePercent,
    event.params.partner,
    event.params.srcAmount,
    event.params.receivedAmount,
    event.params.expectedAmount,
    sideLow
  );

  let partnerShare = feeShare.partnerShare;
  let paraswapShare = feeShare.paraswapShare;

  let feeCode = event.params.feePercent;
  let isReferralProgramBool = _isReferralProgram(feeCode);
  let feeToken = _isTakeSlippage(feeCode, event.params.partner)
    ? sideLow === "sell"
      ? event.params.destToken
      : event.params.srcToken
    : _isTakeFeeFromSrcToken(event.params.feePercent)
    ? event.params.srcToken
    : event.params.destToken;

  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.uuid = event.params.uuid;
  swap.augustus = event.address;
  swap.augustusVersion = "5.3.0";
  swap.side = side;
  swap.method = "event";
  swap.initiator = event.params.initiator;
  swap.beneficiary = event.params.beneficiary;
  swap.srcToken = event.params.srcToken;
  swap.destToken = event.params.destToken;
  swap.srcAmount = event.params.srcAmount;
  swap.destAmount = event.params.receivedAmount;
  swap.expectedAmount = event.params.expectedAmount;
  swap.referrer = event.params.partner.toHex();
  swap.referrerFee = partnerShare;
  swap.paraswapFee = paraswapShare;
  swap.referralProgram = isReferralProgramBool;
  swap.feeToken = feeToken;
  swap.feeCode = event.params.feePercent;
  swap.txHash = event.transaction.hash;
  swap.txOrigin = event.transaction.from;
  swap.txTarget = event.transaction.to;
  swap.txGasUsed = event.transaction.gasLimit;
  swap.txGasPrice = event.transaction.gasPrice;
  swap.blockHash = event.block.hash;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.save();

  if (partnerShare.gt(BigInt.fromI32(0))) {
    // ReferrerFee entity
    if (isReferralProgramBool) {
      let referrerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let referrerFee = ReferrerFee.load(referrerFeeId);
      if (!referrerFee) {
        referrerFee = new ReferrerFee(referrerFeeId);
        referrerFee.referrerAddress = event.params.partner;
        referrerFee.tokenAddress = feeToken;
        referrerFee.totalRewards = partnerShare;
      } else {
        referrerFee.totalRewards = referrerFee.totalRewards.plus(partnerShare);
      }
      referrerFee.save();
    }

    // PartnerFee entity
    else {
      let partnerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
      let partnerFee = PartnerFee.load(partnerFeeId);
      if (!partnerFee) {
        partnerFee = new PartnerFee(partnerFeeId);
        partnerFee.partnerAddress = event.params.partner;
        partnerFee.tokenAddress = feeToken;
        partnerFee.totalRewards = partnerShare;
      } else {
        partnerFee.totalRewards = partnerFee.totalRewards.plus(partnerShare);
      }
      partnerFee.save();
    }
  }
}