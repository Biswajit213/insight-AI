import { Database, UploadCloud, FolderOpen } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && (
        <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
          )}
          {action && (
            <Button variant="primary" icon={action.icon} onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}

export function NoDatasets({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<Database size={32} />}
      title="No datasets yet"
      description="Upload your first dataset to start discovering insights and making data-driven decisions."
      action={{ label: 'Upload Dataset', onClick: onUpload, icon: <UploadCloud size={16} /> }}
    />
  );
}

export function NoReports({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen size={32} />}
      title="No reports yet"
      description="Generate your first AI-powered report from your connected datasets."
      action={{ label: 'Create Report', onClick: onCreate }}
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or filters to find what you're looking for."
    />
  );
}
