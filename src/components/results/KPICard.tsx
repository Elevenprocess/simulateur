import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface KPICardProps {
  title: string;
  value: number;
  suffix: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
  delay?: number;
}

function AnimatedValue({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const startVal = displayValue;
    const endVal = value;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export function KPICard({ title, value, suffix, icon: Icon, variant = "secondary", delay = 0 }: KPICardProps) {
  const isPrimary = variant === "primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`p-3 md:p-5 rounded-xl border ${
        isPrimary 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-start gap-2 md:gap-3">
        <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${isPrimary ? "bg-white/20" : "bg-primary/10"}`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isPrimary ? "text-white" : "text-primary"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs md:text-sm leading-tight ${isPrimary ? "text-white/80" : "text-muted-foreground"}`}>
            {title}
          </p>
          <p className={`text-lg md:text-2xl font-bold mt-0.5 md:mt-1 ${isPrimary ? "text-white" : "text-foreground"}`}>
            <AnimatedValue value={value} suffix={suffix} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
