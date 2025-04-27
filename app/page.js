'use client'

import WeightTracker from '../app.js'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    console.log('Page mounted')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Base path:', process.env.NEXT_PUBLIC_BASE_PATH)
  }, [])

  return (
    <div>
      <div id="debug-info" style={{display: 'none'}}>
        <p>Build time: {new Date().toISOString()}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
      <WeightTracker />
    </div>
  )
}