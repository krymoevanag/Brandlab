import React from "react";
import graphicsLogo from "../../assets/logos/az-graphics.jpg";
import cncLogo from "../../assets/logos/az-cnc-services.jpg";

export type LogoVariant = "graphics" | "cnc" | "combined" | "compact";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  showText?: boolean;
}

const sizeClasses: Record<LogoSize, { img: string; text: string; sub: string }> = {
  xs: { img: "w-6 h-6", text: "text-xs", sub: "text-[10px]" },
  sm: { img: "w-8 h-8", text: "text-sm", sub: "text-[11px]" },
  md: { img: "w-10 h-10", text: "text-base", sub: "text-xs" },
  lg: { img: "w-14 h-14", text: "text-lg", sub: "text-xs" },
  xl: { img: "w-20 h-20", text: "text-xl", sub: "text-sm" },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "graphics",
  size = "md",
  className = "",
  showText = false,
}) => {
  const currentSize = sizeClasses[size];

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-center font-bold text-white bg-brand-charcoal rounded-btn shadow-sm border border-white/20 ${currentSize.img} ${className}`}
        title="A to Z Business Management"
      >
        <span className="tracking-tighter font-display text-graphics">A</span>
        <span className="tracking-tighter font-display text-cnc">Z</span>
      </div>
    );
  }

  if (variant === "combined") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img
          src={graphicsLogo}
          alt="A to Z Graphics"
          className={`${currentSize.img} object-contain rounded-full shadow-sm border border-sky-100 bg-white`}
        />
        <div className="w-[1px] h-6 bg-slate-200" />
        <img
          src={cncLogo}
          alt="A to Z CNC Services"
          className={`${currentSize.img} object-contain rounded-lg shadow-sm border border-orange-100 bg-white`}
        />
      </div>
    );
  }

  const isGraphics = variant === "graphics";
  const logoSrc = isGraphics ? graphicsLogo : cncLogo;
  const label = isGraphics ? "A to Z Graphics" : "A to Z CNC Services";
  const subtitle = isGraphics ? "Branding & Gifts" : "Precision Machining";
  const borderClass = isGraphics ? "border-sky-100" : "border-orange-100";
  const roundedClass = isGraphics ? "rounded-full" : "rounded-lg";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <img
          src={logoSrc}
          alt={label}
          className={`${currentSize.img} object-contain ${roundedClass} shadow-sm border ${borderClass} bg-white p-0.5`}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-semibold text-slate-900 ${currentSize.text}`}>
            {label}
          </span>
          <span className={`text-slate-500 ${currentSize.sub}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
