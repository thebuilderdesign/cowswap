import React from 'react'

import { genericPropsChecker } from '@cowprotocol/common-utils'
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'

import styled from 'styled-components/macro'

import { HighFeeWarning } from 'legacy/components/SwapWarnings'
import TradeGp from 'legacy/state/swap/TradeGp'

import { CompatibilityIssuesWarning } from 'modules/trade/pure/CompatibilityIssuesWarning'
import { NoImpactWarning } from 'modules/trade/pure/NoImpactWarning'
import { TradeUrlParams } from 'modules/trade/types/TradeRawState'

import { BundleTxApprovalBanner, BundleTxSafeWcBanner, BundleTxWrapBanner } from 'common/pure/InlineBanner/banners'
import { ZeroApprovalWarning } from 'common/pure/ZeroApprovalWarning'

import { TwapSuggestionBanner } from './banners/TwapSuggestionBanner'

export interface SwapWarningsTopProps {
  chainId: SupportedChainId
  trade: TradeGp | undefined
  account: string | undefined
  feeWarningAccepted: boolean
  impactWarningAccepted: boolean
  hideUnknownImpactWarning: boolean
  isExpertMode: boolean
  showApprovalBundlingBanner: boolean
  showWrapBundlingBanner: boolean
  shouldZeroApprove: boolean
  showSafeWcBundlingBanner: boolean
  nativeCurrencySymbol: string
  wrappedCurrencySymbol: string
  buyingFiatAmount: CurrencyAmount<Currency> | null
  priceImpact: Percent | undefined
  tradeUrlParams: TradeUrlParams
  setFeeWarningAccepted(cb: (state: boolean) => boolean): void
  setImpactWarningAccepted(cb: (state: boolean) => boolean): void
}

export interface SwapWarningsBottomProps {
  isSupportedWallet: boolean
  swapIsUnsupported: boolean
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

const StyledNoImpactWarning = styled(NoImpactWarning)`
  margin-bottom: 15px;
`

export const SwapWarningsTop = React.memo(function (props: SwapWarningsTopProps) {
  const {
    chainId,
    trade,
    account,
    feeWarningAccepted,
    impactWarningAccepted,
    isExpertMode,
    hideUnknownImpactWarning,
    showApprovalBundlingBanner,
    showWrapBundlingBanner,
    showSafeWcBundlingBanner,
    nativeCurrencySymbol,
    wrappedCurrencySymbol,
    setFeeWarningAccepted,
    setImpactWarningAccepted,
    shouldZeroApprove,
    buyingFiatAmount,
    priceImpact,
    tradeUrlParams,
  } = props

  console.debug('SWAP WARNING RENDER TOP: ', props)

  return (
    <>
      {shouldZeroApprove && <ZeroApprovalWarning currency={trade?.inputAmount.currency} />}
      <HighFeeWarning
        trade={trade}
        acceptedStatus={feeWarningAccepted}
        acceptWarningCb={!isExpertMode && account ? () => setFeeWarningAccepted((state) => !state) : undefined}
      />
      {!hideUnknownImpactWarning && (
        <StyledNoImpactWarning
          withoutAccepting={isExpertMode}
          isAccepted={impactWarningAccepted}
          acceptCallback={() => setImpactWarningAccepted((state) => !state)}
        />
      )}
      {showApprovalBundlingBanner && <BundleTxApprovalBanner />}
      {showWrapBundlingBanner && (
        <BundleTxWrapBanner nativeCurrencySymbol={nativeCurrencySymbol} wrappedCurrencySymbol={wrappedCurrencySymbol} />
      )}
      {showSafeWcBundlingBanner && (
        <BundleTxSafeWcBanner nativeCurrencySymbol={nativeCurrencySymbol} supportsWrapping />
      )}

      <TwapSuggestionBanner
        chainId={chainId}
        priceImpact={priceImpact}
        buyingFiatAmount={buyingFiatAmount}
        tradeUrlParams={tradeUrlParams}
        sellAmount={trade?.inputAmount.toExact()}
      />
    </>
  )
}, genericPropsChecker)

export const SwapWarningsBottom = React.memo(function (props: SwapWarningsBottomProps) {
  const { isSupportedWallet, swapIsUnsupported, currencyIn, currencyOut } = props

  console.debug('SWAP WARNING RENDER BOTTOM: ', props)

  return (
    <>
      {currencyIn && currencyOut && swapIsUnsupported && (
        <CompatibilityIssuesWarning
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          isSupportedWallet={isSupportedWallet}
        />
      )}
    </>
  )
}, genericPropsChecker)
