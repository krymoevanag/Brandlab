import React from "react";
import type { BusinessUnit } from "../../types/business";
import { BUSINESS_UNITS } from "../../types/business";
import { Layers, Palette, Cpu, ChevronDown } from "lucide-react";

interface BusinessUnitSwitcherProps {
  activeUnit: BusinessUnit;
  onChange: (unit: BusinessUnit) => void;
  variant?: "pill" | "dropdown";
  className?: string;
  allowedUnits?: BusinessUnit[];
}

const UNIT_ICON_CLS: Record<BusinessUnit, string> = {
  all:      "text-brand-muted",
  graphics: "text-graphics",
  cnc:      "text-cnc",
};

const UNIT_ACTIVE_CLS: Record<BusinessUnit, string> = {
  all:      "border-brand-border text-brand-charcoal",
  graphics: "border-graphics/40 text-graphics-deep bg-graphics-bg",
  cnc:      "border-cnc/40 text-cnc-deep bg-cnc-bg",
};

export const BusinessUnitSwitcher: React.FC<BusinessUnitSwitcherProps> = ({
  activeUnit,
  onChange,
  variant = "pill",
  className = "",
  allowedUnits = ["all", "graphics", "cnc"],
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getIcon = (unit: BusinessUnit) => {
    const cls = `w-3.5 h-3.5 ${UNIT_ICON_CLS[unit]}`;
    switch (unit) {
      case "graphics": return <Palette className={cls} />;
      case "cnc":      return <Cpu     className={cls} />;
      default:         return <Layers  className={cls} />;
    }
  };

  if (variant === "dropdown") {
    const activeConfig = BUSINESS_UNITS[activeUnit];
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-brand-border rounded-btn text-xs font-medium text-brand-charcoal shadow-input hover:bg-brand-surface transition-colors duration-standard"
        >
          {getIcon(activeUnit)}
          <span>{activeConfig.shortName}</span>
          <ChevronDown className="w-3 h-3 text-brand-muted" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <button
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-label="Close switcher"
            />
            <div className="absolute left-0 mt-1.5 w-60 rounded-card bg-white shadow-dialog ring-1 ring-black/5 z-50 py-1.5 animate-fade-in">
              {allowedUnits.map((unit) => {
                const config = BUSINESS_UNITS[unit];
                const isSelected = activeUnit === unit;
                return (
                  <button
                    key={unit}
                    onClick={() => { onChange(unit); setIsOpen(false); }}
                    className={[
                      "w-full flex items-start gap-3 px-4 py-2.5 text-left text-xs transition-colors duration-standard",
                      isSelected
                        ? "bg-brand-surface font-semibold text-brand-charcoal"
                        : "font-normal text-brand-text hover:bg-brand-surface",
                    ].join(" ")}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getIcon(unit)}</div>
                    <div>
                      <p>{config.name}</p>
                      <p className="text-2xs text-brand-muted mt-0.5">{config.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Pill variant ──────────────────────────────────────────────────────────
  return (
    <div className={`inline-flex p-0.5 bg-brand-surface rounded-btn border border-brand-border ${className}`}>
      {allowedUnits.map((unit) => {
        const config = BUSINESS_UNITS[unit];
        const isSelected = activeUnit === unit;
        return (
          <button
            key={unit}
            type="button"
            onClick={() => onChange(unit)}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all duration-standard",
              isSelected
                ? `bg-white shadow-input border ${UNIT_ACTIVE_CLS[unit]}`
                : "text-brand-muted hover:text-brand-charcoal",
            ].join(" ")}
          >
            {getIcon(unit)}
            <span>{unit === "all" ? "All" : config.shortName.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
