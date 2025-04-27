'use client'

import { useEffect, useState } from 'react'

export default function Debug() {
  const [debugInfo, setDebugInfo] = useState({
    isClient: false,
    environment: process.env.NODE_ENV,
    baseUrl: '',
    assetsLoaded: false,
    mainJsLoaded: false
  })
  
  useEffect(() => {
    // Check if main JS chunk is loaded
    const checkMainJs = () => {
      const scripts = document.getElementsByTagName('script')
      const mainJsLoaded = Array.from(scripts).some(script => 
        script.src.includes('main-app')
      )
      return mainJsLoaded
    }

    // Check if static assets are accessible
    const checkAssets = async () => {
      try {
        const response = await fetch('/_next/static/chunks/main-app.js')
        return response.ok
      } catch (error) {
        console.error('Asset check failed:', error)
        return false
      }
    }

    const updateDebugInfo = async () => {
      const assetsLoaded = await checkAssets()
      setDebugInfo({
        isClient: true,
        environment: process.env.NODE_ENV,
        baseUrl: window.location.origin,
        assetsLoaded,
        mainJsLoaded: checkMainJs()
      })
    }

    updateDebugInfo()
    console.log('Debug info:', debugInfo)
  }, [])

  if (!debugInfo.isClient) return null

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: '#f0f0f0', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <pre>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}