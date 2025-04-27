'use client'

import WeightTracker from '../app.js'
import Debug from '@/components/Debug'

export default function Home() {
  return (
    <>
      {process.env.NODE_ENV !== 'production' && <Debug />}
      <WeightTracker />
    </>
  )
}