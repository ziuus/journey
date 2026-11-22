'use client'

import { cn } from '@/lib/utils'
import { BookOpen, Flag, Trophy, Calendar } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

const icons = {
  modules: BookOpen,
  milestones: Flag,
  projects: Trophy,
  weeks: Calendar,
}

export function StatCard({ label, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn('p-5 rounded-xl border bg-card/50 border-border/50', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={cn('font-medium', trendUp ? 'text-accent' : 'text-destructive')}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  )
}