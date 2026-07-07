import { type ComponentProps } from "react";

const variants = {
  sprint: "bg-kart-50 text-kart-700",
  endurance: "bg-blue-100 text-blue-700",
  junior: "bg-green-100 text-green-700",
  special: "bg-violet-100 text-violet-700",
  full: "bg-red-100 text-red-600",
  "almost-full": "bg-yellow-100 text-yellow-700",
  available: "bg-green-100 text-green-700",
  indoor: "bg-indigo-100 text-indigo-600",
  outdoor: "bg-emerald-100 text-emerald-700",
  premium: "bg-kart-50 text-kart-700",
} as const;

type BadgeVariant = keyof typeof variants;

type BadgeProps = ComponentProps<"span"> & {
  variant: BadgeVariant;
};

export function Badge({ variant, className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
