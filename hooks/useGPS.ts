'use client'
import { useState, useEffect, useCallback } from 'react'
import { getCurrentPosition, type GeolocationResult } from '@/lib/gps'

type GPSState = {
  position: GeolocationResult | null
  error: string | null
  isLoading: boolean
  accuracy: number | null
}

export function useGPS() {
  const [state, setState] = useState<GPSState>({
    position: null,
    error: null,
    isLoading: false,
    accuracy: null,
  })

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const pos = await getCurrentPosition()
      setState({ position: pos, error: null, isLoading: false, accuracy: pos.accuracy })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'GPS取得失敗'
      setState(s => ({ ...s, error: message, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = navigator.geolocation?.watchPosition(
      (pos) => setState({
        position: { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy },
        error: null,
        isLoading: false,
        accuracy: pos.coords.accuracy,
      }),
      (err) => setState(s => ({ ...s, error: err.message, isLoading: false })),
      { enableHighAccuracy: true }
    )
    return () => { if (id !== undefined) navigator.geolocation?.clearWatch(id) }
  }, [refresh])

  return { ...state, refresh }
}
