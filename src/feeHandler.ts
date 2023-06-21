import { BigInt, Bytes } from "@graphprotocol/graph-ts";

class FeeShare {
  partnerShare: BigInt = BigInt.fromI32(0);
  paraswapShare: BigInt = BigInt.fromI32(0);
}

let partnerSharePercent = BigInt.fromI32(8500);
let maxFeePercent = BigInt.fromI32(500);
let nullAddress = "0x0000000000000000000000000000000000000000";
let paraswapSlippageShare = BigInt.fromI32(10000); // taking 100% since https://vote.paraswap.network/#/proposal/0x95c0961f9cb8ea22723621a05e4e1142e70c108e35c3973d1b03b1e8ba70c165
let paraswapReferralShare = BigInt.fromI32(5000); // taking 50% and split with referrer with 25% and user 25% since https://vote.paraswap.network/#/proposal/0x9e24543d4e7b932904f5082a635ef8cca82e9e1800458fc9d53fd895467658e7

// Since https://vote.paraswap.network/#/proposal/0x95c0961f9cb8ea22723621a05e4e1142e70c108e35c3973d1b03b1e8ba70c165,
// partner fees are applied on top of received amounts and if partner choose to take only slippage it's mutually exclusive with take non-zero fixed fee scenario
export function calcFeeShareV3(
  feeCode: BigInt,
  partner: Bytes,
  fromAmount: BigInt,
  receivedAmount: BigInt,
  expectedAmount: BigInt,
  swapType: string
): FeeShare {
  if (_isTakeSlippage(feeCode, partner)) {
    if (swapType == "sell") {
      return calcToTokenFeeWithSlippage(
        receivedAmount,
        expectedAmount,
        partner,
        feeCode
      );
    } else {
      return calcFromTokenFeeWithSlippage(
        fromAmount,
        expectedAmount,
        partner,
        feeCode
      );
    }
  }

  if (_isTakeFeeFromSrcToken(feeCode)) {
    return calcFromTokenFee(fromAmount, partner, feeCode);
  } else {
    return calcToTokenFee(receivedAmount, partner, feeCode);
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
  let slippageFeeBps = _getFixedFeeBps(partner, feeCode);
  let slippage = _calcSlippage(slippageFeeBps, expectedAmount, fromAmount);

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
  let slippageFeeShareBps = _getFixedFeeBps(partner, feeCode);
  let slippage = _calcSlippage(
    slippageFeeShareBps,
    receivedAmount,
    expectedAmount
  );

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

// Note: this function now returns non-zero fees even for cases where we don't have fixed fees
function _getFixedFeeBps(partner: Bytes, feeCode: BigInt): BigInt {
  let fixedFeeBps = BigInt.fromI32(0);

  let version: BigInt = feeCode.rightShift(248);
  if (version.equals(BigInt.fromI32(0))) {
    fixedFeeBps = feeCode;
  } else if (
    feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0))
  ) {
    // both referrer and isNoFeeAndPositiveSlippageToPartner falls here too. Returning to prevent capping with max here as not related
    // note: this is deviation from contract logic but used for convience. Better design: refactor contract and subgraph together
    return feeCode.bitAnd(BigInt.fromI32(0x3fff));
  } else {
    fixedFeeBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));
  }
  return fixedFeeBps.gt(maxFeePercent) ? maxFeePercent : fixedFeeBps;
}

function _calcSlippage(
  fixedFeeBps: BigInt, // not used anymore as contract logic has been removed
  positiveAmount: BigInt,
  negativeAmount: BigInt
): BigInt {
  return positiveAmount.gt(negativeAmount)
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

  if (partner.toHex() == nullAddress) {
    feeShare.paraswapShare = slippage
      .times(paraswapSlippageShare)
      .div(BigInt.fromI32(10000));
    return feeShare;
  }

  // both _isReferral and _isNoFeeAndSplitSlippage should fall into this case
  let slippageFeeShareBps = feeCode.bitAnd(BigInt.fromI32(0x3fff));

  feeShare.paraswapShare = slippage
    .times(paraswapReferralShare)
    .div(BigInt.fromI32(10000));
  feeShare.partnerShare = slippage
    .times(slippageFeeShareBps)
    .div(BigInt.fromI32(10000));

  return feeShare;
}

export function _isTakeFeeFromSrcToken(feeCode: BigInt): boolean {
  return (
    feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) &&
    feeCode.bitAnd(BigInt.fromI32(1 << 15)).notEqual(BigInt.fromI32(0))
  );
}

export function _isNoFeeAndSplitSlippage(feeCode: BigInt): boolean {
  return feeCode.bitAnd(BigInt.fromI32(1 << 17)).notEqual(BigInt.fromI32(0));
}

export function _isReferralProgram(feeCode: BigInt): boolean {
  // This is a special hack check, when partnerFee is 0 and we split slippage between partner and ParaSwap
  // To understand that, we pass 17 bit from backend and here we check for it
  // We should return false in that case, because it is not normal referral situation
  if (_isNoFeeAndSplitSlippage(feeCode)) return false;

  return (
    feeCode.rightShift(248).notEqual(BigInt.fromI32(0)) &&
    feeCode.bitAnd(BigInt.fromI32(1 << 16)).notEqual(BigInt.fromI32(0))
  );
}

export function _isTakeSlippage(feeCode: BigInt, partner: Bytes): boolean {
  return (
    _isReferralProgram(feeCode) ||
    _isNoFeeAndSplitSlippage(feeCode) ||
    partner.toHex() == nullAddress
  );
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
