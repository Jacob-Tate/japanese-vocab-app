// src/ReloadPrompt.jsx
import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (offlineReady || needRefresh) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <div className="p-4 rounded-lg shadow-lg bg-white border border-gray-200">
          <div className="mb-2">
            { offlineReady
                ? <span className="font-semibold">App ready to work offline</span>
                : <span className="font-semibold">New content available, click on reload button to update.</span>
            }
          </div>
          { needRefresh &&
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-semibold mr-2" onClick={() => updateServiceWorker(true)}>
              Reload
            </button>
          }
          <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300" onClick={() => close()}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default ReloadPrompt
