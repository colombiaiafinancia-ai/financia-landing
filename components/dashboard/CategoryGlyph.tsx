'use client'

import type React from 'react'
import {
  Tag,
  ShoppingCart,
  Car,
  Utensils,
  Home,
  Heart,
  GraduationCap,
  Film,
  Wallet,
  Briefcase,
  PiggyBank,
  Gift,
  Plane,
  BookOpen,
  Music,
  Gamepad2,
  Baby,
  Dog,
  Smartphone,
  Wifi,
  Zap,
  Coffee,
  Shirt,
  Dumbbell,
  Landmark,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type CategoryIconKey } from '@/features/categories/domain/categoryIcons'

const ICON_COMPONENTS: Record<CategoryIconKey, React.ComponentType<{ className?: string }>> = {
  tag: Tag,
  shopping: ShoppingCart,
  transport: Car,
  food: Utensils,
  home: Home,
  health: Heart,
  salary: Wallet,
  business: Briefcase,
  gift: Gift,
  plane: Plane,
  book: BookOpen,
  music: Music,
  gamepad: Gamepad2,
  baby: Baby,
  pet: Dog,
  smartphone: Smartphone,
  wifi: Wifi,
  utilities: Zap,
  coffee: Coffee,
  clothing: Shirt,
  entertainment: Film,
  fitness: Dumbbell,
  education: GraduationCap,
  savings: PiggyBank,
  bank: Landmark,
  coins: Coins,
}

/**
 * Icono Lucide según `iconKey` en BD. Base 16×16, color por defecto muted.
 * Si la clave no existe → Tag.
 */
export function CategoryGlyph({ iconKey, className }: { iconKey?: string | null; className?: string }) {
  const valid = iconKey && iconKey in ICON_COMPONENTS
  const Icon = valid ? ICON_COMPONENTS[iconKey as CategoryIconKey] : Tag
  return <Icon className={cn('h-4 w-4 text-muted-foreground', className)} />
}
