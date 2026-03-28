import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  glow?: "orange" | "purple" | "none";
}

export default function Card({ className, children, glow = "none" }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-3xl p-6",
        glow === "orange" && "glow-orange",
        glow === "purple" && "glow-purple",
        className
      )}
    >
      {children}
    </div>
  );
}
