import { DEFAULT_TXN_DISMISS_MS } from '@cowprotocol/common-const'
import { BlockExplorerLinkType } from '@cowprotocol/common-utils'
import { SupportedChainId } from '@cowprotocol/cow-sdk'

import { createSlice, nanoid } from '@reduxjs/toolkit'
import { FlattenInterpolation, ThemeProps, DefaultTheme } from 'styled-components/macro'
import { Nullish } from 'types'

import { initialState } from './initialState'

type BasePopupContent = {
  failedSwitchNetwork: SupportedChainId
  // mod: unsupported network
  unsupportedNetwork?: boolean
}

// MOD: Modified PopupContent. The mod happened directly in the src file, to avoid redefining the state/hoos/etc
export type PopupContent = (TxPopupContent | MetaTxPopupContent | BasePopupContent | WarningPopupContent) & {
  // mod: custom styles
  styles?: FlattenInterpolation<ThemeProps<DefaultTheme>>
}

export type TxPopupContent = {
  txn: {
    hash: string
    success?: boolean
    summary?: string
  }
}

export interface MetaTxPopupContent {
  metatxn: {
    id: string
    success?: boolean
    summary?: string | JSX.Element
    orderType?: BlockExplorerLinkType
  }
}

export type WarningPopupContent = { warning: string }

export enum ApplicationModal {
  NETWORK_SELECTOR,
  SETTINGS,
  WALLET,
  // -----------------      MOD: CowSwap specific modals      --------------------
  TRANSACTION_ERROR,
  COW_SUBSIDY,
  CANCELLATION,
  CONFIRMATION,
  MULTIPLE_CANCELLATION,
  // ------------------------------------------------------------------------------
}

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export type AddPopupPayload = {
  readonly content: PopupContent
  readonly key?: Nullish<string>
  readonly removeAfterMs?: Nullish<number>
}

export type AddPopupActionParams = {
  readonly payload: AddPopupPayload
}

export interface ApplicationState {
  readonly chainId: number | null
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateChainId(state, action) {
      const { chainId } = action.payload
      state.chainId = chainId
    },
    setOpenModal(state, action) {
      state.openModal = action.payload
    },
    addPopup(state, action: AddPopupActionParams) {
      const {
        payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS },
      } = action

      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        } as any,
      ])
    },
    removePopup(state, { payload: { key } }) {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false
        }
      })
    },
  },
})

export const { updateChainId, setOpenModal, addPopup, removePopup } = applicationSlice.actions
export default applicationSlice.reducer
