'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location } from '@/lib/types/ride'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapComponentProps {
  pickup: Location | null
  dropoff: Location | null
  onMapClick?: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function MapUpdater({ pickup, dropoff }: { pickup: Location | null; dropoff: Location | null }) {
  const map = useMap()

  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 13)
    } else if (dropoff) {
      map.setView([dropoff.lat, dropoff.lng], 13)
    }
  }, [pickup, dropoff, map])

  return null
}

export default function MapComponent({ pickup, dropoff, onMapClick }: MapComponentProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  const defaultCenter: [number, number] = [22.738319997560012, 88.45661170360009] // Adamas University
  const center: [number, number] = pickup
    ? [pickup.lat, pickup.lng]
    : dropoff
    ? [dropoff.lat, dropoff.lng]
    : defaultCenter

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]}>
            <Popup>
              <strong>Pickup</strong>
              <br />
              {pickup.address}
            </Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]}>
            <Popup>
              <strong>Drop-off</strong>
              <br />
              {dropoff.address}
            </Popup>
          </Marker>
        )}

        {pickup && dropoff && (
          <Polyline
            positions={[
              [pickup.lat, pickup.lng],
              [dropoff.lat, dropoff.lng],
            ]}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} />
      </MapContainer>
    </div>
  )
}
