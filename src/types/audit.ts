export type PersonaId = 'solo' | 'lead' | 'a11y' | 'founder' | 'consultant';

export interface Persona {
  id: PersonaId;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  color: string;
  glowClass: string;
}

export type AuditStep = 'persona' | 'config' | 'running' | 'results';

export type InputMode = 'image' | 'figma';

export interface AuditConfig {
  fidelity: 'wireframe' | 'mvp' | 'high-fidelity';
  purpose: 'pre-handoff' | 'review' | 'portfolio' | 'stakeholder';
  frameCount: number;
}

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  suggestion: string;
  ruleId?: string;
  principle?: string;
  x?: number;
  y?: number;
}

export interface AuditCategory {
  name: string;
  score: number;
  icon: string;
  issues: AuditIssue[];
}

export interface AuditResult {
  overallScore: number;
  categories: AuditCategory[];
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface ScreenAuditResult {
  screenName: string;
  screenImageUrl: string;
  result: AuditResult | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface FigmaFrame {
  id: string;
  name: string;
  nodeId: string;
  imageUrl: string;
}

export const personas: Persona[] = [
  {
    id: 'solo',
    title: 'Solo Designer',
    subtitle: 'Quick quality check',
    icon: '🟢',
    description: 'Pre-handoff validation, portfolio polish, fast quality checks',
    color: 'persona-solo',
    glowClass: 'glow-persona-solo',
  },
  {
    id: 'lead',
    title: 'UX Lead',
    subtitle: 'Team review & scoring',
    icon: '🔵',
    description: 'Structured scoring, exportable reports, system consistency',
    color: 'persona-lead',
    glowClass: 'glow-persona-lead',
  },
  {
    id: 'a11y',
    title: 'Accessibility',
    subtitle: 'WCAG compliance',
    icon: '🟣',
    description: 'Contrast ratios, touch targets, WCAG AA/AAA compliance',
    color: 'persona-a11y',
    glowClass: 'glow-persona-a11y',
  },
  {
    id: 'founder',
    title: 'Founder / PM',
    subtitle: 'Simple "Is this good?"',
    icon: '🟡',
    description: 'Business language, risk assessment, stakeholder-ready summary',
    color: 'persona-founder',
    glowClass: 'glow-persona-founder',
  },
  {
    id: 'consultant',
    title: 'UX Consultant',
    subtitle: 'Professional audit',
    icon: '🔴',
    description: 'Heuristic review, formal reports, client-ready documentation',
    color: 'persona-consultant',
    glowClass: 'glow-persona-consultant',
  },
];
