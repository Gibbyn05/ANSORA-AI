'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Job } from '@/types'

const CITY_COORDS: Record<string, [number, number]> = {
  'oslo': [59.9139, 10.7522],
  'bergen': [60.3913, 5.3221],
  'trondheim': [63.4305, 10.3951],
  'stavanger': [58.9700, 5.7331],
  'tromsø': [69.6492, 18.9553],
  'drammen': [59.7440, 10.2045],
  'kristiansand': [58.1599, 8.0182],
  'fredrikstad': [59.2186, 10.9298],
  'sandnes': [58.8519, 5.7348],
  'ålesund': [62.4723, 6.1549],
  'bodø': [67.2827, 14.4049],
  'sandefjord': [59.1316, 10.2167],
  'hamar': [60.7945, 11.0677],
  'sarpsborg': [59.2839, 11.1089],
  'skien': [59.2091, 9.6095],
  'moss': [59.4368, 10.6578],
  'arendal': [58.4613, 8.7725],
  'lillehammer': [61.1153, 10.4663],
  'haugesund': [59.4127, 5.2680],
  'tønsberg': [59.2671, 10.4080],
  'gjøvik': [60.7948, 10.6918],
  'halden': [59.1220, 11.3874],
  'narvik': [68.4385, 17.4279],
  'steinkjer': [64.0149, 11.4957],
  'hjemmekontor': [59.9139, 10.7522],
  'remote': [59.9139, 10.7522],
  'flexibel': [59.9139, 10.7522],
}

function getCoords(location: string): [number, number] | null {
  const key = location.toLowerCase().split(',')[0].trim()
  return CITY_COORDS[key] ?? null
}

interface MapViewProps {
  jobs: (Job & { companies?: { name: string; logo?: string } })[]
  onJobSelect: (job: Job & { companies?: { name: string; logo?: string } }) => void
  selectedJobId?: string
}

export function MapView({ jobs, onJobSelect, selectedJobId }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  const handleJobSelect = useCallback(onJobSelect, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([64.5, 15], 5)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const bounds: [number, number][] = []

      jobs.forEach((job) => {
        const coords = getCoords(job.location)
        if (!coords) return
        bounds.push(coords)

        const marker = L.marker(coords).addTo(map)
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="color:#111;font-size:14px">${job.title}</strong><br/>
            <span style="color:#555;font-size:12px">${job.companies?.name ?? ''}</span><br/>
            <span style="color:#777;font-size:11px">📍 ${job.location} · ${job.percentage}%</span>
          </div>
        `)
        marker.on('click', () => handleJobSelect(job))
      })

      if (bounds.length > 0) {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 10 })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // only mount once

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#29524A]/25" style={{ height: 520 }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 bg-[#0e1c17]/90 border border-[#29524A]/25 rounded-lg px-3 py-1.5 text-xs text-[#94A187] z-[1000]">
        {jobs.filter(j => getCoords(j.location)).length} av {jobs.length} stillinger vises på kartet
      </div>
    </div>
  )
}
