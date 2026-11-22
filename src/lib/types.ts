export interface Module {
  id: string
  title: string
  topics: string[]
}

export interface Track {
  id: string
  name: string
  modules: Module[]
}

export interface Layer {
  id: string
  title: string
  description: string
  tracks?: Track[]
  modules?: Module[]
  sections?: Module[]
  status: 'pending' | 'in-progress' | 'completed'
  estimatedWeeks: number | string
}

export interface MilestoneSubtask {
  id: string
  title: string
  completed: boolean
}

export interface Milestone {
  id: string
  title: string
  description: string
  layer: string
  status: 'pending' | 'completed'
  week: number
  subtasks?: MilestoneSubtask[]
}

export interface Project {
  id: string
  title: string
  level: string
  phase: string
  description: string
  skills: string[]
  standout: string
}

export interface Role {
  id: string
  title: string
  options: string[]
}

export interface TimelinePhase {
  id: string
  name: string
  layers: string[]
  focus: string
  outcome: string
}

export interface CareerSupport {
  resumeOptimization: string[]
  linkedInOptimization: string[]
  portfolioBuilding: string[]
  mockInterviews: string[]
  jobApplicationStrategy: string[]
  hiringNetworkReferrals: string[]
  exclusiveEvents: string[]
}

export interface SalaryOutcomes {
  medianSalary: string
  averageSalary: string
  highestSalary: string
  highestIncrease: string
  averageIncrease: string
  salaryBands: Record<string, string>
}

export interface CohortComposition {
  experience: Record<string, string>
  industries: string[]
}

export interface Instructor {
  name: string
  title: string
}

export interface ToolsAndTechnologies {
  aiToolStack: string[]
  backendStack: string[]
}

export interface ProgressTracking {
  totalModules: number
  completedModules: number
  totalMilestones: number
  completedMilestones: number
  totalProjects: number
  completedProjects: number
  currentLayer: string
  currentWeek: number
  track: string | null
  overallProgressPercent: number
}

export interface Roadmap {
  version: string
  source: string
  programDuration: string
  lastUpdated: string
  layers: Layer[]
  milestones: Milestone[]
  roles: Role[]
  timelinePhases: TimelinePhase[]
  projects: Project[]
  careerSupport: CareerSupport
  salaryOutcomes: SalaryOutcomes
  cohortComposition: CohortComposition
  knowledgePartner: string
  instructors: Instructor[]
  toolsAndTechnologies: ToolsAndTechnologies
  progressTracking: ProgressTracking
  suggestedStudentPath: string[]
  notes: string
}