import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className={cn("w-full bg-muted h-1 rounded-full overflow-hidden", className)}>
      <div 
        className="h-full bg-brand-gradient rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}