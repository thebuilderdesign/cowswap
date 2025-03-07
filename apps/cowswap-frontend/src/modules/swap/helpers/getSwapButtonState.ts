import { Token } from '@uniswap/sdk-core'

import { QuoteError } from 'legacy/state/price/actions'
import TradeGp from 'legacy/state/swap/TradeGp'

import { getEthFlowEnabled } from 'modules/swap/helpers/getEthFlowEnabled'

import { ApprovalState } from 'common/hooks/useApproveState'

import { AmountsForSignature } from './getAmountsForSignature'

export enum SwapButtonState {
  SwapIsUnsupported = 'SwapIsUnsupported',
  WalletIsUnsupported = 'WalletIsUnsupported',
  FeesExceedFromAmount = 'FeesExceedFromAmount',
  InsufficientLiquidity = 'InsufficientLiquidity',
  ZeroPrice = 'ZeroPrice',
  TransferToSmartContract = 'TransferToSmartContract',
  UnsupportedToken = 'UnsupportedToken',
  FetchQuoteError = 'FetchQuoteError',
  OfflineBrowser = 'OfflineBrowser',
  Loading = 'Loading',
  WalletIsNotConnected = 'WalletIsNotConnected',
  ReadonlyGnosisSafeUser = 'ReadonlyGnosisSafeUser',
  NeedApprove = 'NeedApprove',
  SwapDisabled = 'SwapDisabled',
  SwapError = 'SwapError',
  ExpertModeSwap = 'ExpertModeSwap',
  RegularSwap = 'RegularSwap',
  SwapWithWrappedToken = 'SwapWithWrappedToken',
  RegularEthFlowSwap = 'EthFlowSwap',
  ExpertModeEthFlowSwap = 'ExpertModeEthFlowSwap',
  ApproveAndSwap = 'ApproveAndSwap',
  ExpertApproveAndSwap = 'ExpertApproveAndSwap',

  WrapAndSwap = 'WrapAndSwap',
  ExpertWrapAndSwap = 'ExpertWrapAndSwap',
}

export interface SwapButtonStateParams {
  account: string | undefined
  isSupportedWallet: boolean
  isReadonlyGnosisSafeUser: boolean
  isExpertMode: boolean
  isSwapUnsupported: boolean
  isBundlingSupported: boolean
  quoteError: QuoteError | undefined | null
  inputError?: string
  approvalState: ApprovalState
  feeWarningAccepted: boolean
  impactWarningAccepted: boolean
  isGettingNewQuote: boolean
  swapCallbackError: string | null
  trade: TradeGp | undefined | null
  isNativeIn: boolean
  isSmartContractWallet: boolean | undefined
  isBestQuoteLoading: boolean
  wrappedToken: Token
  isPermitSupported: boolean
  amountsForSignature: AmountsForSignature | undefined
}

const quoteErrorToSwapButtonState: { [key in QuoteError]: SwapButtonState | null } = {
  'fee-exceeds-sell-amount': SwapButtonState.FeesExceedFromAmount,
  'insufficient-liquidity': SwapButtonState.InsufficientLiquidity,
  'zero-price': SwapButtonState.ZeroPrice,
  'transfer-eth-to-smart-contract': SwapButtonState.TransferToSmartContract,
  'fetch-quote-error': SwapButtonState.FetchQuoteError,
  'offline-browser': SwapButtonState.OfflineBrowser,
  'unsupported-token': SwapButtonState.UnsupportedToken,
}

export function getSwapButtonState(input: SwapButtonStateParams): SwapButtonState {
  const { quoteError, approvalState, isPermitSupported, amountsForSignature } = input

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isPermitSupported &&
    !input.inputError &&
    (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING)

  const isValid = !input.inputError && input.feeWarningAccepted && input.impactWarningAccepted
  const swapBlankState = !input.inputError && !input.trade

  if (quoteError) {
    const quoteErrorState = quoteErrorToSwapButtonState[quoteError]

    if (quoteErrorState) return quoteErrorState
  }

  if (input.isSwapUnsupported) {
    return SwapButtonState.SwapIsUnsupported
  }

  if (!input.account) {
    return SwapButtonState.WalletIsNotConnected
  }

  if (!input.isSupportedWallet) {
    return SwapButtonState.WalletIsUnsupported
  }

  if (swapBlankState || input.isGettingNewQuote || input.isBestQuoteLoading) {
    return SwapButtonState.Loading
  }

  if (input.isReadonlyGnosisSafeUser) {
    return SwapButtonState.ReadonlyGnosisSafeUser
  }

  if (!input.isNativeIn && showApproveFlow) {
    if (input.isBundlingSupported) {
      return input.isExpertMode ? SwapButtonState.ExpertApproveAndSwap : SwapButtonState.ApproveAndSwap
    }
    return SwapButtonState.NeedApprove
  }

  if (input.inputError) {
    return SwapButtonState.SwapError
  }

  if (!isValid || !!input.swapCallbackError) {
    return SwapButtonState.SwapDisabled
  }

  if (amountsForSignature?.outputAmount.lessThan(0)) {
    return SwapButtonState.FeesExceedFromAmount
  }

  if (input.isNativeIn) {
    if (getEthFlowEnabled(input.isSmartContractWallet === true)) {
      return input.isExpertMode ? SwapButtonState.ExpertModeEthFlowSwap : SwapButtonState.RegularEthFlowSwap
    } else if (input.isBundlingSupported) {
      return input.isExpertMode ? SwapButtonState.ExpertWrapAndSwap : SwapButtonState.WrapAndSwap
    } else {
      return SwapButtonState.SwapWithWrappedToken
    }
  }

  if (input.isExpertMode) {
    return SwapButtonState.ExpertModeSwap
  }

  return SwapButtonState.RegularSwap
}
