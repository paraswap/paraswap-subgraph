import { BigInt } from "@graphprotocol/graph-ts";
import {
    Bought,
    Bought2,
    BoughtV3,
    Swapped,
    Swapped2,
    SwappedV3,
} from "../generated/AugustusSwapperV5/AugustusSwapperV5";
import { Swap, ReferrerFee, PartnerFee } from "../generated/schema";
import { calcFeeShareV3, calcFeeShareV2, _isReferralProgram, _isTakeFeeFromSrcToken } from "./feeHandler";

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
    swap.txGasUsed = event.transaction.gasUsed;
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
        'sell'
    );

    let partnerShare = feeShare.partnerShare;
    let paraswapShare = feeShare.paraswapShare;

    let isReferralProgramBool = _isReferralProgram(event.params.feePercent);
    let feeToken = _isTakeFeeFromSrcToken(event.params.feePercent) ? event.params.srcToken : event.params.destToken;

    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.3.0';
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
    swap.referrerFee = partnerShare;
    swap.paraswapFee = paraswapShare;
    swap.referralProgram = isReferralProgramBool;
    swap.feeToken = feeToken;
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

    if (partnerShare > BigInt.fromI32(0)) {
        // ReferrerFee entity
        if (isReferralProgramBool) {
            let referrerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
            let referrerFee = ReferrerFee.load(referrerFeeId);
            if (!referrerFee) {
                referrerFee = new ReferrerFee(referrerFeeId);
                referrerFee.referrerAddress = event.params.partner;
                referrerFee.tokenAddress = feeToken;
                referrerFee.totalRewards = partnerShare;
            }
            else {
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
            }
            else {
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
    swap.txGasUsed = event.transaction.gasUsed;
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
    swap.txGasUsed = event.transaction.gasUsed;
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
        'buy'
    );

    let partnerShare = feeShare.partnerShare;
    let paraswapShare = feeShare.paraswapShare;

    let isReferralProgramBool = _isReferralProgram(event.params.feePercent);
    let feeToken = _isTakeFeeFromSrcToken(event.params.feePercent) ? event.params.srcToken : event.params.destToken;

    let swap = new Swap(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    swap.uuid = event.params.uuid;
    swap.augustus = event.address;
    swap.augustusVersion = '5.3.0';
    swap.side = 'Buy';
    swap.method = 'event';
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
    swap.txGasUsed = event.transaction.gasUsed;
    swap.txGasPrice = event.transaction.gasPrice;
    swap.blockHash = event.block.hash;
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.save();

    if (partnerShare > BigInt.fromI32(0)) {
        // ReferrerFee entity
        if (isReferralProgramBool) {
            let referrerFeeId = event.params.partner.toHex() + "-" + feeToken.toHex();
            let referrerFee = ReferrerFee.load(referrerFeeId);
            if (!referrerFee) {
                referrerFee = new ReferrerFee(referrerFeeId);
                referrerFee.referrerAddress = event.params.partner;
                referrerFee.tokenAddress = feeToken;
                referrerFee.totalRewards = partnerShare;
            }
            else {
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
            }
            else {
                partnerFee.totalRewards = partnerFee.totalRewards.plus(partnerShare);
            }
            partnerFee.save();
        }
    }
}
