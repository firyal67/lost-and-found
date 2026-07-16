const MAX_WIDTHS = {
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
  "2xl": "max-w-2xl",
  xl: "max-w-xl",
  lg: "max-w-lg",
  md: "max-w-md",
  sm: "max-w-sm",
  full: "max-w-full",
};

export default function PageContainer({ children, className, maxWidth = "7xl", noPadding = false }) {
  return (
    <div
      className={[
        "mx-auto w-full",
        MAX_WIDTHS[maxWidth] || "max-w-7xl",
        !noPadding && "px-4 sm:px-6 lg:px-8",
        className || "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}