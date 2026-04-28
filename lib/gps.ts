// Haversine formula for distance calculation
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function isWithinRange(
  userLat: number,
  userLon: number,
  checkpointLat: number,
  checkpointLon: number,
  radiusMeters: number
): boolean {
  return (
    calculateDistance(userLat, userLon, checkpointLat, checkpointLon) <= radiusMeters
  )
}

export type GeolocationResult = {
  lat: number
  lon: number
  accuracy: number
}

export async function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export function watchPosition(
  onUpdate: (result: GeolocationResult) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported')
  }

  return navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
    onError,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  )
}

export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId)
}

export function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)

  return ((θ * 180) / Math.PI + 360) % 360
}

export function getCardinalDirection(bearing: number): string {
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}
