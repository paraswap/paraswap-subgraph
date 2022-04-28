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
): Map<string, BigInt> {

    let feeShare = new Map<string, BigInt>();
    // Src Token
    if (_isTakeFeeFromSrcToken(feeCode)) {
        if (swapType == "sell") {
            feeShare = calcFromTokenFee(fromAmount, partner, feeCode);
        }
        // Buy
        else {
            feeShare = calcFromTokenFeeWithSlippage(fromAmount, expectedAmount, partner, feeCode);
        }
    }
    // Dest Token
    else {
        if (swapType == "sell") {
            feeShare = calcToTokenFeeWithSlippage(receivedAmount, expectedAmount, partner, feeCode);
        }
        // Buy
        else {
            feeShare = calcToTokenFee(receivedAmount, partner, feeCode);
        }
    }
    return feeShare;

}
// FeeToken: Src; Type: Sell
function calcFromTokenFee(
    fromAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): Map<string, BigInt> {

    let feeShare = new Map<string, BigInt>();
    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        feeShare = _calcFixedFees(fromAmount, fixedFeeBps);
    }
    return feeShare;
}

// FeeToken: Src; Type: Buy
function calcFromTokenFeeWithSlippage(
    fromAmount: BigInt,
    expectedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): Map<string, BigInt> {
    let feeShare = new Map<string, BigInt>();

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    let slippage = _calcSlippage(fixedFeeBps, expectedAmount, fromAmount);

    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        feeShare = _calcFixedFees(expectedAmount, fixedFeeBps);
    }

    if (slippage.notEqual(BigInt.fromI32(0))) {
        let feeSlippageShare = _calcSlippageFees(slippage, partner, feeCode);
        let partnerShare = feeShare.get('partnerShare');
        let paraswapShare = feeShare.get('paraswapShare');

        feeShare.set('partnerShare', partnerShare.plus(feeSlippageShare.get('partnerShare')));
        feeShare.set('paraswapShare', paraswapShare.plus(feeSlippageShare.get('paraswapShare')));
    }

    return feeShare;
}

// FeeToken: Dest; Type: Buy
function calcToTokenFee(
    receivedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): Map<string, BigInt> {

    let feeShare = new Map<string, BigInt>();

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        feeShare = _calcFixedFees(receivedAmount, fixedFeeBps);
    }
    return feeShare;
}

// FeeToken: Dest; Type: Sell
function calcToTokenFeeWithSlippage(
    receivedAmount: BigInt,
    expectedAmount: BigInt,
    partner: Bytes,
    feeCode: BigInt
): Map<string, BigInt> {

    let feeShare = new Map<string, BigInt>();

    let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
    let slippage = _calcSlippage(fixedFeeBps, receivedAmount, expectedAmount);

    if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
        feeShare = _calcFixedFees(
            slippage.notEqual(BigInt.fromI32(0)) ? expectedAmount : receivedAmount, fixedFeeBps
        );
    }

    if (slippage.notEqual(BigInt.fromI32(0))) {
        let feeSlippageShare = _calcSlippageFees(slippage, partner, feeCode);
        let partnerShare = feeShare.get('partnerShare');
        let paraswapShare = feeShare.get('paraswapShare');

        feeShare.set('partnerShare', partnerShare.plus(feeSlippageShare.get('partnerShare')));
        feeShare.set('paraswapShare', paraswapShare.plus(feeSlippageShare.get('paraswapShare')));
    }
    return feeShare;
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
    fixedFeeBps: BigInt
): Map<string, BigInt> {

    let fee = amount.times(fixedFeeBps).div(BigInt.fromI32(10000));
    let _partnerShare = fee.times(partnerSharePercent).div(BigInt.fromI32(10000));
    let _paraswapShare = fee.minus(_partnerShare);

    let feeShare = new Map<string, BigInt>();
    feeShare.set('partnerShare', _partnerShare);
    feeShare.set('paraswapShare', _paraswapShare);
    return feeShare;
}

function _calcSlippageFees(
    slippage: BigInt,
    partner: Bytes,
    feeCode: BigInt
): Map<string, BigInt> {
    let _paraswapShare = slippage.div(BigInt.fromI32(2));
    let _partnerShare: BigInt = BigInt.fromI32(0);

    if (partner.toHex() != nullAddress) {
        let version = feeCode.rightShift(248);
        if (version.notEqual(BigInt.fromI32(0))) {
            if ((feeCode.bitAnd(BigInt.fromI32(1 << 16))).notEqual(BigInt.fromI32(0))) {
                let feeBps = feeCode.bitAnd(BigInt.fromI32(0x3FFF));
                _partnerShare = _paraswapShare.times(feeBps > BigInt.fromI32(10000) ? BigInt.fromI32(10000) : feeBps).div(BigInt.fromI32(10000));
            }
            else if ((feeCode.bitAnd(BigInt.fromI32((1 << 14)))).equals(BigInt.fromI32(0))) {
                _partnerShare = _paraswapShare;
            }
        }
    }
    let feeShare = new Map<string, BigInt>();
    feeShare.set('partnerShare', _partnerShare);
    feeShare.set('paraswapShare', _paraswapShare);
    return feeShare;
}

export function _isTakeFeeFromSrcToken(feeCode: BigInt): boolean {
    return feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) && feeCode.bitAnd(BigInt.fromI32(1 << 15)).notEqual(BigInt.fromI32(0));
}

export function _isReferralProgram(feeCode: BigInt): boolean {
    return feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) && feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0));
}