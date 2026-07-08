import { cn } from "@/lib/utils";

export default function PageContainer({ children, className, maxWidth = "7xl", noPadding = false }) {
  return (
    <div className={cn("mx-auto w-full", `max-w-${maxWidth}`, !noPadding && "px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
