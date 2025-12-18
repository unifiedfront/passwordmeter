import { ReactNode, useId, useState } from "react";

type TooltipProps = {
  label: string;            // screen-reader label for the trigger
  content: ReactNode;       // tooltip content
  className?: string;
};

export function Tooltip({ label, content, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`tip ${className ?? ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="tip-trigger"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)} // works on touch too
      >
        i
      </button>

      {open && (
        <span id={id} role="tooltip" className="tip-bubble">
          {content}
        </span>
      )}
    </span>
  );
}
