import { BigInt, Bytes } from "@graphprotocol/graph-ts";

const partnerSharePercent = BigInt.fromI32(8500);
const nullAddress = "0x0000000000000000000000000000000000000000";

export function calcFeeShare(
    feeCode: BigInt,
    partner: Bytes,
    fromAmount: BigInt,
    receivedAmount: BigInt,
    expectedAmount: BigInt,
    swapType: string
): [BigInt, BigInt] {

    let paraswapShare: BigInt;
    let partnerShare: BigInt;

    // Src Token
    if (_isTakeFeeFromSrcToken(feeCode)) {
        if (swapType == "sell") {
            [partnerShare, paraswapShare] = calcFromTokenFee(fromAmount, partner, feeCode);
        }
        // Buy
        else {
            [partnerShare, paraswapShare] = calcFromTokenFeeWithSlippage(fromAmount, expectedAmount, partner, feeCode);
        }
    }
    // Dest Token
    else {
        if (swapType == "sell") {
            [partnerShare, paraswapShare] = calcToTokenFeeWithSlippage(receivedAmount, expectedAmount, partner, feeCode);
        }
        // Buy
        else {
            [partnerShare, paraswapShare] = calcToTokenFee(receivedAmount, partner, feeCode);
        }
    }
    return [partnerShare, paraswapShare];

}
// FeeToken: Src; Type: Sell
function calcFromTokenFee(
    fromAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): [BigInt, BigInt] {

    let partnerShare: BigInt;
    let paraswapShare: BigInt;

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        [partnerShare, paraswapShare] = _calcFixedFees(fromAmount, fixedFeeBps);
    }
    return [partnerShare, paraswapShare];
}

// FeeToken: Src; Type: Buy
function calcFromTokenFeeWithSlippage(
    fromAmount: BigInt,
    expectedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): [BigInt, BigInt] {
    let partnerShare: BigInt;
    let paraswapShare: BigInt;

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    let slippage = _calcSlippage(fixedFeeBps, expectedAmount, fromAmount)

    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        [partnerShare, paraswapShare] = _calcFixedFees(expectedAmount, fixedFeeBps);
    }

    if (slippage.notEqual(BigInt.fromI32(0))) {
        let [partnerSlippageShare, paraswapSlippageShare] = _calcSlippageFees(slippage, partner, feeCode)
        partnerShare = partnerShare.plus(partnerSlippageShare);
        paraswapShare = paraswapShare.plus(paraswapSlippageShare);
    }
    return [partnerShare, paraswapShare];
}

// FeeToken: Dest; Type: Buy
function calcToTokenFee(
    receivedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): [BigInt, BigInt] {

    let partnerShare: BigInt;
    let paraswapShare: BigInt;

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        [partnerShare, paraswapShare] = _calcFixedFees(receivedAmount, fixedFeeBps);
    }
    return [partnerShare, paraswapShare];
}

// FeeToken: Dest; Type: Sell
function calcToTokenFeeWithSlippage(
    receivedAmount: BigInt,
    expectedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): [BigInt, BigInt] {

    let partnerShare: BigInt;
    let paraswapShare: BigInt;

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    let slippage = _calcSlippage(fixedFeeBps, receivedAmount, expectedAmount);

    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        [partnerShare, paraswapShare] = _calcFixedFees(
            slippage.notEqual(BigInt.fromI32(0)) ? expectedAmount : receivedAmount, fixedFeeBps
        );
    }

    if (slippage.notEqual(BigInt.fromI32(0))) {
        let [partnerSlippageShare, paraswapSlippageShare] = _calcSlippageFees(slippage, partner, feeCode)
        partnerShare = partnerShare.plus(partnerSlippageShare);
        paraswapShare = paraswapShare.plus(paraswapSlippageShare);
    }
    return [partnerShare, paraswapShare];
}

function _getFixedFeeBps(partner: Bytes, feeCode: BigInt): BigInt {
    let fixedFeeBps = BigInt.fromI32(0);
    if (partner.toHex() == nullAddress) {
        return fixedFeeBps;
    }
    let version: BigInt = feeCode.rightShift(248);
    if (version == BigInt.fromI32(0)) {
        fixedFeeBps = feeCode;
    } else if (
        feeCode
            .bitAnd(BigInt.fromI32(1 << 16))
            .notEqual(BigInt.fromI32(0))
    ) {
        // referrer program only has slippage fees
        return fixedFeeBps;
    } else {
        fixedFeeBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));
    }
    return fixedFeeBps;
}

function _calcSlippage(
    fixedFeeBps: BigInt,
    positiveAmount: BigInt,
    negativeAmount: BigInt): BigInt {
    return (fixedFeeBps <= BigInt.fromI32(50) && positiveAmount > negativeAmount) ? positiveAmount.minus(negativeAmount) : BigInt.fromI32(0);
}

function _calcFixedFees(
    amount: BigInt,
    fixedFeeBps: BigInt): [BigInt, BigInt] {
    let fee = amount.times(fixedFeeBps).div(BigInt.fromI32(10000));
    let partnerShare = fee.times(partnerSharePercent).div(BigInt.fromI32(10000));
    let paraswapShare = fee.minus(partnerShare);
    return [partnerShare, paraswapShare];
}

function _calcSlippageFees(
    slippage: BigInt,
    partner: Bytes,
    feeCode: BigInt
): [BigInt, BigInt] {
    let paraswapShare = slippage.div(BigInt.fromI32(2));
    let partnerShare: BigInt;

    if (partner.toHex() != nullAddress) {
        let version = feeCode.rightShift(248);
        if (version.notEqual(BigInt.fromI32(0))) {
            if ((feeCode.bitAnd(BigInt.fromI32(1 << 16))).notEqual(BigInt.fromI32(0))) {
                let feeBps = feeCode.bitAnd(BigInt.fromI32(0x3FFF));
                partnerShare = paraswapShare.times(feeBps > BigInt.fromI32(10000) ? BigInt.fromI32(10000) : feeBps).div(BigInt.fromI32(10000));
            }
            else if ((feeCode.bitAnd(BigInt.fromI32((1 << 14)))).equals(BigInt.fromI32(0))) {
                partnerShare = paraswapShare
            }
        }
    }
    return [partnerShare, paraswapShare]
}

export function _isTakeFeeFromSrcToken(feeCode: BigInt): boolean {
    return feeCode.rightShift(BigInt.fromI32(248)).notEqual(BigInt.fromI32(0)) && feeCode.bitAnd(BigInt.fromI32(1 << 15)).notEqual(BigInt.fromI32(0));
}

export function _isReferralProgram(feeCode: BigInt): boolean {
    return feeCode.rightShift(BigInt.fromI32(248)).notEqual(BigInt.fromI32(0)) && feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0));
}