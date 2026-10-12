import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App, { AppRoutes } from './App.tsx'
import 'leaflet/dist/leaflet.css';
import type { Product } from './types/product'
import type { TireSizeLandingData, VehicleLandingData } from './api/seo'

declare global {
  interface Window {
    __INITIAL_PRODUCT__?: Product
    __INITIAL_TIRE_SIZE__?: TireSizeLandingData
    __INITIAL_VEHICLE__?: VehicleLandingData
    __INITIAL_SSR_PAGE__?: boolean
  }
}

const root = document.getElementById('root')!
const initialProduct = window.__INITIAL_PRODUCT__

if (window.__INITIAL_SSR_PAGE__) {
  hydrateRoot(
    root,
    <BrowserRouter>
      <AppRoutes
        initialProduct={initialProduct}
        initialTireSizeData={window.__INITIAL_TIRE_SIZE__}
        initialVehicleData={window.__INITIAL_VEHICLE__}
        initialBranch={0}
        initialMenuOpen
      />
    </BrowserRouter>,
  )
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
