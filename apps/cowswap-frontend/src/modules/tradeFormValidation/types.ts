import { Command } from '@cowprotocol/types'

import { TradeDerivedState } from 'modules/trade'
import { TradeQuoteState } from 'modules/tradeQuote'

import { ApprovalState } from 'common/hooks/useApproveState'

export enum TradeFormValidation {
  // Wrap/unwrap
  WrapUnwrapFlow,

  // Quote errors
  QuoteErrors,
  CurrencyNotSupported,

  // Wallet
  WalletNotConnected,
  WalletNotSupported,
  SafeReadonlyUser,

  // Quote request params
  CurrencyNotSet,
  InputAmountNotSet,
  RecipientInvalid,

  // Quote loading indicator
  QuoteLoading,

  // Balances
  BalancesNotLoaded,
  BalanceInsufficient,

  // Approve
  ExpertApproveAndSwap,
  ApproveAndSwap,
  ApproveRequired,

  // Native
  SellNativeToken,
}

export interface TradeFormValidationLocalContext {
  isExpertMode: boolean
}

export interface TradeFormValidationCommonContext {
  account: string | undefined
  derivedTradeState: TradeDerivedState
  approvalState: ApprovalState
  tradeQuote: TradeQuoteState
  recipientEnsAddress: string | null
  isWrapUnwrap: boolean
  isBundlingSupported: boolean
  isSupportedWallet: boolean
  isSwapUnsupported: boolean
  isSafeReadonlyUser: boolean
  isPermitSupported: boolean
}

export interface TradeFormValidationContext extends TradeFormValidationLocalContext, TradeFormValidationCommonContext {}

export interface TradeFormButtonContext {
  defaultText: string
  derivedState: TradeDerivedState
  quote: TradeQuoteState
  isSupportedWallet: boolean

  doTrade(): void
  confirmTrade(): void
  connectWallet: Command | null
  wrapNativeFlow(): void
}
