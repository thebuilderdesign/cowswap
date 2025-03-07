import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'

import { isSellOrder } from '@cowprotocol/common-utils'

import { updateLimitOrdersRawStateAtom } from 'modules/limitOrders'
import { useLimitOrdersDerivedState } from 'modules/limitOrders/hooks/useLimitOrdersDerivedState'
import { useUpdateCurrencyAmount } from 'modules/limitOrders/hooks/useUpdateCurrencyAmount'
import { limitRateAtom, LimitRateState, updateLimitRateAtom } from 'modules/limitOrders/state/limitRateAtom'

type RateUpdateParams = Pick<LimitRateState, 'activeRate' | 'isTypedValue' | 'isRateFromUrl'>

export interface UpdateRateCallback {
  (update: RateUpdateParams): void
}

export function useUpdateActiveRate(): UpdateRateCallback {
  const { inputCurrencyAmount, outputCurrencyAmount, orderKind } = useLimitOrdersDerivedState()
  const rateState = useAtomValue(limitRateAtom)
  const updateLimitOrdersState = useSetAtom(updateLimitOrdersRawStateAtom)
  const updateCurrencyAmount = useUpdateCurrencyAmount()
  const updateRateState = useSetAtom(updateLimitRateAtom)

  const { isRateFromUrl: currentIsRateFromUrl } = rateState

  return useCallback(
    (update: RateUpdateParams) => {
      const { activeRate, isRateFromUrl } = update

      updateRateState(update)

      const isSell = isSellOrder(orderKind)

      if (activeRate) {
        // Don't update amounts when rate is set from URL. See useSetupLimitOrderAmountsFromUrl()
        if (currentIsRateFromUrl || isRateFromUrl) {
          return
        }

        updateCurrencyAmount({
          activeRate,
          amount: isSell ? inputCurrencyAmount : outputCurrencyAmount,
          orderKind,
        })
      }

      // Clear input/output amount based on the orderKind, when there is no active rate
      if (activeRate === null) {
        if (isSell) {
          updateLimitOrdersState({ outputCurrencyAmount: null })
        } else {
          updateLimitOrdersState({ inputCurrencyAmount: null })
        }
      }
    },
    [
      updateRateState,
      currentIsRateFromUrl,
      updateCurrencyAmount,
      inputCurrencyAmount,
      outputCurrencyAmount,
      orderKind,
      updateLimitOrdersState,
    ]
  )
}
