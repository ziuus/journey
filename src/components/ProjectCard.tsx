'use client'

import { cn } from '@/lib/utils'
import { Code2, Database, Brain, Globe, Zap, Shield, GitBranch } from 'lucide-react'
import type { Project } from '@/lib/types'

const levelColors = {
  Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const levelIcons = {
  Beginner: Code2,
  Intermediate: Database,
  Advanced: Brain,
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const LevelIcon = levelIcons[project.level as keyof typeof levelIcons] || Code2
  const levelColor = levelColors[project.level as keyof typeof levelColors] || levelColors.Beginner

  return (
    <div className="group p-5 rounded-xl border border-border/50 bg-card/50 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <LevelIcon className="w-5 h-5 text-muted-foreground" />
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', levelColor)}>
            {project.level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{project.phase}</span>
      </div>
      <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
        {project.title}
      </h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.skills.slice(0, 5).map((skill, i) => (
          <span key={i} className="px-2 py-0.5 text-xs bg-muted rounded text-muted-foreground">
            {skill}
          </span>
        ))}
        {project.skills.length > 5 && (
          <span className="px-2 py-0.5 text-xs bg-muted rounded text-muted-foreground">
            +{project.skills.length - 5} more
          </span>
        )}
      </div>
      <div className="pt-3 border-t border-border/50">
        <p className="text-xs text-accent font-medium flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {project.standout}
        </p>
      </div>
    </div>
  )
}