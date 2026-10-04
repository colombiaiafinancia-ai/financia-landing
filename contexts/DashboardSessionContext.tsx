'use client'

import { createContext, useContext } from 'react'
import type { DashboardProfile, DashboardUser } from '@/lib/dashboard/types'

type DashboardSession = {
  user: DashboardUser
  profile: DashboardProfile
}

const DashboardSessionContext = createContext<DashboardSession | null>(null)

/** Usuario y perfil verificados en el servidor: el cliente no vuelve a pedirlos a Supabase. */
export function DashboardSessionProvider({
  user,
  profile,
  children,
}: DashboardSession & { children: React.ReactNode }) {
  return (
    <DashboardSessionContext.Provider value={{ user, profile }}>
      {children}
    </DashboardSessionContext.Provider>
  )
}

export function useDashboardSession() {
  const ctx = useContext(DashboardSessionContext)
  if (!ctx) {
    throw new Error('useDashboardSession debe usarse dentro de DashboardSessionProvider')
  }
  return ctx
}
