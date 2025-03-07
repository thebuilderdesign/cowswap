import { CowEventListeners } from '@cowprotocol/events'
import { IframeRpcProviderBridge } from './IframeRpcProviderBridge'
import { CowSwapWidgetParams, EthereumProvider, WidgetMethodsEmit, WidgetMethodsListen } from './types'
import { buildTradeAmountsQuery, buildWidgetPath, buildWidgetUrl } from './urlUtils'
import { IframeCowEventEmitter } from './IframeCowEventEmitter'
import { WindowListener, listenToMessageFromWindow, postMessageToWindow, stopListeningWindowListener } from './messages'

const DEFAULT_HEIGHT = '640px'
const DEFAULT_WIDTH = '450px'

/**
 * Reference: IframeResizer (apps/cowswap-frontend/src/modules/injectedWidget/updaters/IframeResizer.ts)
 * Sometimes MutationObserver doesn't trigger when the height of the widget changes and the widget displays with a scrollbar.
 * To avoid this we add a threshold to the height.
 * 20px
 */
const HEIGHT_THRESHOLD = 20

/**
 * Callback function signature for updating the CoW Swap Widget.
 */
export interface CowSwapWidgetHandler {
  updateWidget: (params: CowSwapWidgetParams, listeners?: CowEventListeners) => void
  updateListeners: (newListeners?: CowEventListeners) => void
  updateProvider: (newProvider?: EthereumProvider) => void
  destroy: () => void
}

/**
 * Generates and injects a CoW Swap Widget into the provided container.
 * @param container - The HTML element to inject the widget into.
 * @param params - Parameters for configuring the widget.
 * @returns A callback function to update the widget with new settings.
 */
export function createCowSwapWidget(
  container: HTMLElement,
  params: CowSwapWidgetParams = {},
  listeners?: CowEventListeners
): CowSwapWidgetHandler {
  const { provider } = params

  // 1. Create a brand new iframe
  const iframe = createIframe(params)

  // 2. Clear the content (delete any previous iFrame if it exists)
  container.innerHTML = ''
  container.appendChild(iframe)

  const { contentWindow: iframeWindow } = iframe
  if (!iframeWindow) {
    console.error('Iframe does not contain a window', iframe)
    throw new Error('Iframe does not contain a window!')
  }

  // 3. Send appCode (once the widget posts the ACTIVATE message)
  const windowListeners: WindowListener[] = []
  windowListeners.push(sendAppCodeOnActivation(iframeWindow, params.appCode))

  // 4. Handle widget height changes
  windowListeners.push(listenToHeightChanges(iframe, params.height))

  // 5. Handle and forward widget events to the listeners
  const iFrameCowEventEmitter = new IframeCowEventEmitter(window, listeners)

  // 6. Wire up the iframeRpcProviderBridge with the provider (so RPC calls flow back and forth)
  let iframeRpcProviderBridge = updateProvider(iframeWindow, null, provider)

  // 7. Schedule the uploading of the params, once the iframe is loaded
  iframe.addEventListener('load', () => updateWidgetParams(iframeWindow, params))

  // 8. Return the handler, so the widget, listeners, and provider can be updated
  return {
    updateWidget: (newParams: CowSwapWidgetParams) => updateWidgetParams(iframeWindow, newParams),
    updateListeners: (newListeners?: CowEventListeners) => iFrameCowEventEmitter.updateListeners(newListeners),
    updateProvider: (newProvider) => {
      iframeRpcProviderBridge = updateProvider(iframeWindow, iframeRpcProviderBridge, newProvider)
    },

    destroy: () => {
      // Stop listening for cow events
      iFrameCowEventEmitter.stopListeningIframe()

      // Disconnect all listeners
      windowListeners.forEach((listener) => window.removeEventListener('message', listener))

      // Destroy the iframe
      container.removeChild(iframe)
    },
  }
}

/**
 * Update the provider for the iframeRpcProviderBridge.
 *
 * It will disconnect from the previous provider and connect to the new one.
 *
 * @param iframe iframe window
 * @param iframeRpcProviderBridge iframe RPC manager
 * @param newProvider new provider
 *
 * @returns the iframeRpcProviderBridge
 */
function updateProvider(
  iframe: Window,
  iframeRpcProviderBridge: IframeRpcProviderBridge | null,
  newProvider?: EthereumProvider
): IframeRpcProviderBridge {
  // Disconnect from the previous provider bridge
  if (iframeRpcProviderBridge) {
    iframeRpcProviderBridge.disconnect()
  }

  const providerBridge = iframeRpcProviderBridge || new IframeRpcProviderBridge(iframe)

  // Connect to the new provider
  if (newProvider) {
    providerBridge.onConnect(newProvider)
  }

  return providerBridge
}

/**
 * Creates an iframe element for the CoW Swap Widget based on provided parameters and settings.
 * @param params - Parameters for the widget.
 * @returns The generated HTMLIFrameElement.
 */
function createIframe(params: CowSwapWidgetParams): HTMLIFrameElement {
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = params

  const iframe = document.createElement('iframe')

  iframe.src = buildWidgetUrl(params)
  iframe.width = width
  iframe.height = height
  iframe.style.border = '0'

  return iframe
}

/**
 * Updates the CoW Swap Widget based on the new settings provided.
 * @param params - New params for the widget.
 * @param contentWindow - Window object of the widget's iframe.
 */
function updateWidgetParams(contentWindow: Window, params: CowSwapWidgetParams) {
  const pathname = buildWidgetPath(params)
  const search = buildTradeAmountsQuery(params).toString()

  postMessageToWindow(contentWindow, WidgetMethodsListen.UPDATE_PARAMS, {
    urlParams: {
      pathname,
      search,
    },
    appParams: {
      ...params,
      provider: undefined,
    },
  })
}

/**
 * Sends appCode to the contentWindow of the widget once the widget is activated.
 *
 * @param contentWindow - Window object of the widget's iframe.
 * @param appCode - A unique identifier for the app.
 */
function sendAppCodeOnActivation(contentWindow: Window, appCode: string | undefined) {
  const listener = listenToMessageFromWindow(window, WidgetMethodsEmit.ACTIVATE, () => {
    // Stop listening for the ACTIVATE (once is enough)
    stopListeningWindowListener(window, listener)

    // Update the appData
    postMessageToWindow(contentWindow, WidgetMethodsListen.UPDATE_APP_DATA, {
      metaData: appCode ? { appCode } : undefined,
    })
  })

  return listener
}

/**
 * Listens for iframeHeight emitted by the widget, and applies dynamic height adjustments to the widget's iframe.
 *
 * @param iframe - The HTMLIFrameElement of the widget.
 * @param defaultHeight - Default height for the widget.
 */
function listenToHeightChanges(iframe: HTMLIFrameElement, defaultHeight = DEFAULT_HEIGHT): WindowListener {
  return listenToMessageFromWindow(window, WidgetMethodsEmit.UPDATE_HEIGHT, (data) => {
    iframe.style.height = data.height ? `${data.height + HEIGHT_THRESHOLD}px` : defaultHeight
  })
}
