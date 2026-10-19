import React from "react";
import type { BusinessUnit } from "../../types/business";
import { BUSINESS_UNITS } from "../../types/business";
import { BrandLogo } from "./BrandLogo";
import { MapPin } from "lucide-react";

interface BrandHeaderProps {
  businessUnit: BusinessUnit;
  branchName?: string;
  branchCode?: string;
  className?: string;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  businessUnit,
  branchName = "Nairobi Branch",
  branchCode = "NBI",
  className = "",
}) => {
  const config = BUSINESS_UNITS[businessUnit];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-card border border-slate-200/80 shadow-card ${className}`}>
      <div className="flex items-center gap-3.5">
        <BrandLogo
          variant={config.logoKey}
          size="lg"
          showText={false}
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {config.name}
            </h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeBg} ${config.badgeText}`}>
              {config.shortName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {config.tagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-brand-navy" />
          <span>{branchName}</span>
          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
            {branchCode}
          </span>
        </div>
      </div>
    </div>
  );
};
