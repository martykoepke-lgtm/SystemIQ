import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'standard' | 'wide' | 'full';
  footer?: ReactNode;
}

const SIZE_MAP = {
  standard: 'max-w-lg',
  wide: 'max-w-2xl',
  full: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'standard', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`${SIZE_MAP[size]} w-full mx-4 rounded-xl shadow-2xl overflow-hidden animate-slide-in`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable button styles for modal footers
export function ModalButton({
  children,
  variant = 'secondary',
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary-brand-color)',
      color: 'white',
      opacity: disabled ? 0.5 : 1,
    },
    secondary: {
      backgroundColor: 'var(--bg-surface-hover)',
      color: 'var(--text-body)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'white',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={styles[variant]}
    >
      {children}
    </button>
  );
}
