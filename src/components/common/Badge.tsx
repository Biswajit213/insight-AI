import { cn } from '../../lib/utils';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'cyan';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  green:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  yellow: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  red:    'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  gray:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  cyan:   'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
};

const dotColors: Record<BadgeVariant, string> = {
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  yellow: 'bg-amber-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
  gray:   'bg-slate-400',
  cyan:   'bg-cyan-500',
};

export function Badge({ children, variant = 'gray', dot = false, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full', variantClasses[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

// Severity badge helper
type Severity = 'critical' | 'high' | 'medium' | 'low';
const severityMap: Record<Severity, BadgeVariant> = {
  critical: 'red',
  high:     'red',
  medium:   'yellow',
  low:      'green',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={severityMap[severity]} dot>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

// Status badge helper
type Status = string;
const statusMap: Record<string, BadgeVariant> = {
  connected:    'green',
  processing:   'blue',
  needs_attention: 'yellow',
  failed:       'red',
  completed:    'green',
  running:      'blue',
  queued:       'gray',
  ready:        'green',
  generating:   'blue',
  open:         'red',
  resolved:     'green',
  investigating: 'yellow',
  dismissed:    'gray',
};

const statusLabels: Record<string, string> = {
  connected:    'Connected',
  processing:   'Processing',
  needs_attention: 'Needs Attention',
  failed:       'Failed',
  completed:    'Completed',
  running:      'Running',
  queued:       'Queued',
  ready:        'Ready',
  generating:   'Generating',
  open:         'Open',
  resolved:     'Resolved',
  investigating: 'Investigating',
  dismissed:    'Dismissed',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={statusMap[status] ?? 'gray'} dot>
      {statusLabels[status] ?? status}
    </Badge>
  );
}
