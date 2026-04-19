import { cn } from "@/lib/utils";

interface NumberBallProps {
  number: number | string;
  variant?: "default" | "special" | "hot" | "cold";
  size?: "sm" | "md" | "lg";
}

export function NumberBall({ number, variant = "default", size = "md" }: NumberBallProps) {
  const displayNum = typeof number === "number" ? String(number).padStart(2, "0") : number;

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    special: "bg-amber-500 text-white ring-2 ring-amber-300",
    hot: "bg-red-500 text-white",
    cold: "bg-blue-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums shrink-0",
        sizeClasses[size],
        variantClasses[variant]
      )}
    >
      {displayNum}
    </span>
  );
}
