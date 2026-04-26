import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { Link } from "react-router-dom";

type Tone = "primary" | "secondary" | "tertiary" | "danger";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  tone = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button className={cn("button", `button-${tone}`, className)} {...props} />;
}

export function ButtonLink({
  to,
  tone = "primary",
  className,
  children
}: {
  to: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link className={cn("button", `button-${tone}`, className)} to={to}>
      {children}
    </Link>
  );
}

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn("app-card", className)} {...props} />;
});

export function Badge({
  tone = "neutral",
  children
}: {
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

export function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} className="input" {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  return <textarea ref={ref} className="textarea" {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  return <select ref={ref} className="select" {...props} />;
});

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <span className="section-tag">{eyebrow}</span> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <Card className="empty-state">
      <h3>{title}</h3>
      <p>{copy}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </Card>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <Card className="loading-block">
      <div className="loading-shimmer" />
      <p>{label}</p>
    </Card>
  );
}

export function InlineNotice({
  tone = "info",
  children
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return <div className={cn("inline-notice", `inline-notice-${tone}`)}>{children}</div>;
}

export function Stat({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

export function Tabs({
  value,
  onChange,
  items
}: {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.value}
          className={cn("tab-button", value === item.value && "tab-button-active")}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

function DialogSurface({
  open,
  title,
  children,
  onClose,
  overlayClassName,
  cardClassName
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  overlayClassName?: string;
  cardClassName: string;
}) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActiveElementRef.current = document.activeElement;
    const focusable = getFocusableElements(cardRef.current);
    const nextFocusTarget = focusable[0] ?? cardRef.current;
    nextFocusTarget?.focus();

    return () => {
      const previousActiveElement = previousActiveElementRef.current;
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusableElements(cardRef.current);
    if (!focusable.length) {
      event.preventDefault();
      cardRef.current?.focus();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className={cn("overlay", overlayClassName)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card ref={cardRef} className={cardClassName} tabIndex={-1}>
        <div className="modal-top">
          <h3 id={titleId}>{title}</h3>
          <button className="icon-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return <DialogSurface cardClassName="modal-card" onClose={onClose} open={open} title={title}>{children}</DialogSurface>;
}

export function Drawer({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <DialogSurface cardClassName="drawer-card" onClose={onClose} open={open} overlayClassName="drawer-overlay" title={title}>
      {children}
    </DialogSurface>
  );
}
