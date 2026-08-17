import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropdownItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

interface MenuPosition {
  top: number;
  left?: number;
  right?: number;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll so the menu doesn't drift away from the trigger
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  const handleTriggerClick = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      if (align === 'right') {
        setMenuPos({
          top: rect.bottom + 4,
          right: viewportWidth - rect.right,
        });
      } else {
        setMenuPos({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
    setOpen((v) => !v);
  };

  const menu = open ? (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menuPos.top,
        ...(menuPos.right !== undefined ? { right: menuPos.right } : { left: menuPos.left }),
        zIndex: 9999,
      }}
      className="w-48 py-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl animate-fade-in"
      role="menu"
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 border-t border-slate-100 dark:border-slate-700" />
        ) : (
          <button
            key={i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick?.();
              setOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  ) : null;

  return (
    <div ref={triggerRef} className={cn('relative inline-block', className)}>
      <div
        onClick={handleTriggerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleTriggerClick()}
      >
        {trigger}
      </div>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  const selected = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between cursor-pointer"
      >
        <span className={selected ? '' : 'text-slate-400'}>{selected?.label ?? placeholder ?? 'Select...'}</span>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full py-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left transition-colors',
                option.value === value
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
