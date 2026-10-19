"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { back } from "@/lib/router";
import { confirmGuardActive } from "@/lib/ui-store";

export function cn(...a: (string | false | null | undefined)[]) {
  return twMerge(clsx(a));
}

type BtnVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type BtnSize = "sm" | "md" | "lg" | "xl";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; block?: boolean }
>(function Button({ variant = "secondary", size = "md", block, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,opacity] duration-200 ease-calm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-9 px-4 text-[14px]",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-[52px] px-6 text-[16px]",
        size === "xl" && "h-16 px-8 text-[17px]",
        variant === "primary" && "bg-sage-deep text-bg shadow-soft hover:opacity-95 dark:text-bg",
        variant === "secondary" && "bg-surface text-ink shadow-soft ring-1 ring-line hover:bg-surface-2",
        variant === "ghost" && "bg-transparent text-ink hover:bg-surface-2",
        variant === "quiet" && "bg-surface-2 text-ink hover:bg-sand/60",
        variant === "danger" && "bg-transparent text-clay ring-1 ring-line hover:bg-surface-2",
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});

export function IconButton({ label, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, as: As = "div", ...props }: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return <As className={cn("rounded-3xl bg-surface p-5 shadow-soft ring-1 ring-line/60", className)} {...props} />;
}

export function CardButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "block w-full rounded-3xl bg-surface p-5 text-left shadow-soft ring-1 ring-line/60 transition-transform duration-200 ease-calm active:scale-[0.99]",
        className,
      )}
      {...props}
    />
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-full bg-surface-2 p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-full px-3 font-medium transition-all duration-300 ease-calm",
              size === "md" ? "h-10 text-[15px]" : "h-8 text-[13px]",
              active ? "bg-surface text-ink shadow-soft" : "text-ink-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-[15px] text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-2">{description}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300", checked ? "bg-sage" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-300 ease-calm",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </label>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (v: number) => string;
}) {
  return (
    <label className="block py-2">
      <span className="flex justify-between text-[14px] text-ink-2">
        <span>{label}</span>
        <span className="tabular text-ink">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[rgb(var(--sage))]"
      />
    </label>
  );
}

export function Chip({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] transition-colors duration-200",
        active ? "bg-sage-deep text-bg" : "bg-surface text-ink ring-1 ring-line",
        className,
      )}
      aria-pressed={active}
      {...props}
    />
  );
}

export function ScreenHeader({ title, subtitle, onBack, right, fallback = "today" }: { title?: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode; fallback?: string }) {
  return (
    <header className="safe-top sticky top-0 z-30 -mx-5 mb-2 bg-bg/90 px-3 pb-2 backdrop-blur-xl">
      <div className="flex h-11 items-center justify-between">
        <IconButton label="Wstecz" onClick={onBack ?? (() => back(fallback))}>
          <ChevronLeft className="h-6 w-6" />
        </IconButton>
        <div className="flex items-center gap-1">{right}</div>
      </div>
      {title && (
        <div className="px-2 pt-1">
          <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
        </div>
      )}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-end justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">{children}</h2>
      {action}
    </div>
  );
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3 shadow-lift outline-none data-[state=open]:animate-fade-up"
          // a confirmation dialog opened from inside a sheet must not close the sheet underneath
          onPointerDownOutside={(e) => confirmGuardActive() && e.preventDefault()}
          onFocusOutside={(e) => confirmGuardActive() && e.preventDefault()}
          onInteractOutside={(e) => confirmGuardActive() && e.preventDefault()}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[22px] leading-snug text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[14px] text-ink-2">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Zamknij" className="-mr-2 -mt-1">
                <X className="h-5 w-5" />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="pb-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TextField({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] text-ink-2">{label}</span>}
      <input
        className={cn(
          "h-12 w-full rounded-2xl bg-surface px-4 text-[16px] text-ink ring-1 ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-sage",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextArea({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] text-ink-2">{label}</span>}
      <textarea
        className={cn(
          "w-full rounded-2xl bg-surface p-4 text-[16px] leading-relaxed text-ink ring-1 ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-sage",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function Screen({ children, className, tabbed = false }: { children: React.ReactNode; className?: string; tabbed?: boolean }) {
  return <main className={cn("mx-auto min-h-[100dvh] w-full max-w-lg px-5 animate-fade-in", tabbed ? "pb-tabbar" : "pb-16", className)}>{children}</main>;
}

export function Row({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("flex w-full items-center gap-3 py-3.5 text-left", onClick && "active:opacity-70", className)}>
      {children}
    </Comp>
  );
}

export function Notice({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <div className={cn("rounded-2xl px-4 py-3 text-[14px] leading-relaxed", tone === "warn" ? "bg-sand/50 text-ink" : "bg-surface-2 text-ink-2")}>
      {children}
    </div>
  );
}
