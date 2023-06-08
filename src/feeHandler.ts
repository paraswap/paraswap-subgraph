import { BigInt, Bytes } from "@graphprotocol/graph-ts";

class FeeShare {
  partnerShare: BigInt = BigInt.fromI32(0);
  paraswapShare: BigInt = BigInt.fromI32(0);
}

let partnerSharePercent = BigInt.fromI32(8500);
let maxFeePercent = BigInt.fromI32(500);
let nullAddress = "0x0000000000000000000000000000000000000000";

export function calcFeeShareV3(
  feeCode: BigInt,
  partner: Bytes,
  fromAmount: BigInt,
  receivedAmount: BigInt,
  expectedAmount: BigInt,
  swapType: string
): FeeShare {
  // Src Token
  if (_isTakeFeeFromSrcToken(feeCode)) {
    if (swapType == "sell") {
      return calcFromTokenFee(fromAmount, partner, feeCode);
    }
    // Buy
    else {
      return calcFromTokenFeeWithSlippage(
        fromAmount,
        expectedAmount,
        partner,
        feeCode
      );
    }
  }
  // Dest Token
  else {
    if (swapType == "sell") {
      return calcToTokenFeeWithSlippage(
        receivedAmount,
        expectedAmount,
        partner,
        feeCode
      );
    }
    // Buy
    else {
      return calcToTokenFee(receivedAmount, partner, feeCode);
    }
  }
}

// FeeToken: Src; Type: Sell
function calcFromTokenFee(
  fromAmount: BigInt,
  partner: Bytes,
  feeCode: BigInt
): FeeShare {
  let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
  if (fixedFeeBps.equals(BigInt.fromI32(0))) return new FeeShare();
  return _calcFixedFees(fromAmount, fixedFeeBps);
}

// FeeToken: Src; Type: Buy
function calcFromTokenFeeWithSlippage(
  fromAmount: BigInt,
  expectedAmount: BigInt,
  partner: Bytes,
  feeCode: BigInt
): FeeShare {
  let feeShare = new FeeShare();

  let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
  let slippage = _calcSlippage(fixedFeeBps, expectedAmount, fromAmount);

  if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
    feeShare = _calcFixedFees(expectedAmount, fixedFeeBps);
  }

  if (slippage.notEqual(BigInt.fromI32(0))) {
    let feeSlippageShare = _calcSlippageFees(slippage, partner, feeCode);
    feeShare.partnerShare = feeShare.partnerShare.plus(
      feeSlippageShare.partnerShare
    );
    feeShare.paraswapShare = feeShare.paraswapShare.plus(
      feeSlippageShare.paraswapShare
    );
  }

  return feeShare;
}

// FeeToken: Dest; Type: Buy
function calcToTokenFee(
  receivedAmount: BigInt,
  partner: Bytes,
  feeCode: BigInt
): FeeShare {
  let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
  if (fixedFeeBps.equals(BigInt.fromI32(0))) return new FeeShare();
  return _calcFixedFees(receivedAmount, fixedFeeBps);
}

// FeeToken: Dest; Type: Sell
function calcToTokenFeeWithSlippage(
  receivedAmount: BigInt,
  expectedAmount: BigInt,
  partner: Bytes,
  feeCode: BigInt
): FeeShare {
  let feeShare = new FeeShare();

  let fixedFeeBps = _getFixedFeeBps(partner, feeCode);
  let slippage = _calcSlippage(fixedFeeBps, receivedAmount, expectedAmount);

  if (fixedFeeBps.notEqual(BigInt.fromI32(0))) {
    feeShare = _calcFixedFees(
      slippage.notEqual(BigInt.fromI32(0)) ? expectedAmount : receivedAmount,
      fixedFeeBps
    );
  }

  if (slippage.notEqual(BigInt.fromI32(0))) {
    let feeSlippageShare = _calcSlippageFees(slippage, partner, feeCode);
    feeShare.partnerShare = feeShare.partnerShare.plus(
      feeSlippageShare.partnerShare
    );
    feeShare.paraswapShare = feeShare.paraswapShare.plus(
      feeSlippageShare.paraswapShare
    );
  }

  return feeShare;
}

function _getFixedFeeBps(partner: Bytes, feeCode: BigInt): BigInt {
  let fixedFeeBps = BigInt.fromI32(0);
  if (partner.toHex() == nullAddress) {
    return fixedFeeBps;
  }
  let version: BigInt = feeCode.rightShift(248);
  if (version.equals(BigInt.fromI32(0))) {
    fixedFeeBps = feeCode;
  } else if (
    feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0))
  ) {
    // referrer program only has slippage fees
    return fixedFeeBps;
  } else {
    fixedFeeBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));
  }
  return fixedFeeBps.gt(maxFeePercent) ? maxFeePercent : fixedFeeBps;
}

function _calcSlippage(
  fixedFeeBps: BigInt,
  positiveAmount: BigInt,
  negativeAmount: BigInt
): BigInt {
  return fixedFeeBps.le(BigInt.fromI32(50)) && positiveAmount.gt(negativeAmount)
    ? positiveAmount.minus(negativeAmount)
    : BigInt.fromI32(0);
}

function _calcFixedFees(amount: BigInt, fixedFeeBps: BigInt): FeeShare {
  let feeShare = new FeeShare();
  let fee = amount.times(fixedFeeBps).div(BigInt.fromI32(10000));
  feeShare.partnerShare = fee
    .times(partnerSharePercent)
    .div(BigInt.fromI32(10000));
  feeShare.paraswapShare = fee.minus(feeShare.partnerShare);
  return feeShare;
}

function _calcSlippageFees(
  slippage: BigInt,
  partner: Bytes,
  feeCode: BigInt
): FeeShare {
  let feeShare = new FeeShare();
  feeShare.paraswapShare = slippage.div(BigInt.fromI32(2));
  if (partner.toHex() != nullAddress) {
    let version = feeCode.rightShift(248);
    if (version.notEqual(BigInt.fromI32(0))) {
      if (feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0))) {
        let feeBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));
        feeShare.partnerShare = feeShare.paraswapShare
          .times(
            feeBps.gt(BigInt.fromI32(10000)) ? BigInt.fromI32(10000) : feeBps
          )
          .div(BigInt.fromI32(10000));
      } else if (
        feeCode.bitAnd(BigInt.fromI32(1 << 14)).equals(BigInt.fromI32(0))
      ) {
        feeShare.partnerShare = feeShare.paraswapShare;
      }
    }
  }
  return feeShare;
}

export function _isTakeFeeFromSrcToken(feeCode: BigInt): boolean {
  return (
    feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) &&
    feeCode.bitAnd(BigInt.fromI32(1 << 15)).notEqual(BigInt.fromI32(0))
  );
}

export function _isReferralProgram(feeCode: BigInt): boolean {
  // This is a special hack check, when partnerFee is 0 and we split slippage between partner and ParaSwap
  // In that case we first need to check, that equals to 5000 (50%) and if referral flag set to true
  // And we should return false in that case, because it is not normal referral situation
  const isNoFeeAndSplitSlippage =
    feeCode.bitAnd(new BigInt(0x3fff)) === new BigInt(5000) &&
    feeCode.bitAnd(new BigInt(1 << 14)) === new BigInt(1);

  return isNoFeeAndSplitSlippage
    ? false
    : feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) &&
        feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0));
}

// V2 (Swapped2 & Bought2)
export function calcFeeShareV2(
  feeCode: BigInt,
  partner: Bytes,
  receivedAmount: BigInt,
  expectedAmount: BigInt
): FeeShare {
  let feeShare = new FeeShare();
  if (feeCode.notEqual(BigInt.fromI32(0)) && partner.toHex() != nullAddress) {
    let version = feeCode.rightShift(248);
    if (version.equals(BigInt.fromI32(0))) {
      feeShare = calcCompleteFeeV2(
        feeCode.gt(maxFeePercent) ? maxFeePercent : feeCode,
        receivedAmount,
        expectedAmount,
        true
      );
    }
    // version == 1
    else {
      let feeBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));
      let positiveSlippageToUser = feeCode
        .bitAnd(BigInt.fromI32(1 << 14))
        .notEqual(BigInt.fromI32(0));
      feeShare = calcCompleteFeeV2(
        feeBps.gt(maxFeePercent) ? maxFeePercent : feeBps,
        receivedAmount,
        expectedAmount,
        positiveSlippageToUser
      );
    }
  }

  // If fee = 0
  if (
    feeShare.paraswapShare.plus(feeShare.partnerShare).equals(BigInt.fromI32(0))
  ) {
    if (receivedAmount.gt(expectedAmount)) {
      let posSlippageShare = receivedAmount
        .minus(expectedAmount)
        .div(BigInt.fromI32(2));
      feeShare.paraswapShare = posSlippageShare;
    }
  }
  return feeShare;
}

function calcCompleteFeeV2(
  feeCode: BigInt,
  receivedAmount: BigInt,
  expectedAmount: BigInt,
  positiveSlippageToUser: boolean
): FeeShare {
  let feeShare = new FeeShare();
  let takeSlippage: boolean =
    feeCode.le(BigInt.fromI32(50)) && receivedAmount.gt(expectedAmount);

  if (feeCode.gt(BigInt.fromI32(0))) {
    let baseAmount: BigInt = takeSlippage ? expectedAmount : receivedAmount;
    let totalFees: BigInt = baseAmount
      .times(feeCode)
      .div(BigInt.fromI32(10000));
    feeShare.partnerShare = totalFees
      .times(partnerSharePercent)
      .div(BigInt.fromI32(10000));
    feeShare.paraswapShare = totalFees.minus(feeShare.partnerShare);
  }

  if (takeSlippage) {
    let halfPositiveSlippage = receivedAmount
      .minus(expectedAmount)
      .div(BigInt.fromI32(2));
    let currentParaswapShare = feeShare.paraswapShare;
    feeShare.paraswapShare = currentParaswapShare.plus(halfPositiveSlippage);

    if (!positiveSlippageToUser) {
      let currentPartnerShare = feeShare.partnerShare;
      feeShare.partnerShare = currentPartnerShare.plus(halfPositiveSlippage);
    }
  }
  return feeShare;
}
