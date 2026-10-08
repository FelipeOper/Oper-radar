import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Dialog({ open = true, title, description, children, footer, onClose, size = 'md', inline, className }) {
  React.useEffect(() => {
    if (!open || !onClose) return;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={cx('or-dialog-scrim', inline && 'or-dialog-scrim--inline')} onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div role="dialog" aria-modal="true" className={cx('or-dialog', size === 'lg' && 'or-dialog--lg', className)}>
        <div className="or-dialog__head">
          <div>{title && <h2 className="or-dialog__t">{title}</h2>}{description && <p className="or-dialog__d">{description}</p>}</div>
          {onClose && <IconButton icon="x" label="Fechar" size="sm" onClick={onClose} />}
        </div>
        {children}
        {footer && <div className="or-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
