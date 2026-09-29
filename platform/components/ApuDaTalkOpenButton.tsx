"use client";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ApuDaTalkOpenButton({ children, className }: Props) {
  return (
    <button
      type="button"
      className={className ?? ""}
      onClick={() => window.dispatchEvent(new CustomEvent("apuda:talk-open"))}
    >
      {children}
    </button>
  );
}
