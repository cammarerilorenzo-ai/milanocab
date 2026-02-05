import { useState } from "react";
import { cn } from "@/lib/utils";

interface VehicleTypeSelectorProps {
  value: "economy" | "premium";
  onChange: (value: "economy" | "premium") => void;
}

// Custom Fiat 500-style icon
const CompactCarIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 64 32" 
    className={className}
    fill="currentColor"
  >
    {/* Body */}
    <path d="M8 22 C8 22 10 12 20 10 C30 8 40 8 48 12 C52 14 56 18 56 22 L56 24 L8 24 Z" />
    {/* Roof - rounded like Fiat 500 */}
    <path d="M18 10 C18 10 20 4 32 4 C44 4 46 10 46 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    {/* Windows */}
    <path d="M20 9 C20 9 22 6 32 6 C42 6 44 9 44 9 L42 12 L22 12 Z" fill="currentColor" opacity="0.3"/>
    {/* Front wheel */}
    <circle cx="16" cy="24" r="5" />
    <circle cx="16" cy="24" r="2.5" fill="white" opacity="0.3"/>
    {/* Rear wheel */}
    <circle cx="48" cy="24" r="5" />
    <circle cx="48" cy="24" r="2.5" fill="white" opacity="0.3"/>
    {/* Headlight */}
    <circle cx="10" cy="18" r="2" fill="white" opacity="0.6"/>
  </svg>
);

// Custom T-Roc Cabriolet-style icon
const SUVCabrioIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 72 32" 
    className={className}
    fill="currentColor"
  >
    {/* Body - SUV shape */}
    <path d="M6 20 C6 20 8 14 16 12 L52 12 C58 12 64 16 66 20 L66 24 L6 24 Z" />
    {/* Open top / windshield frame */}
    <path d="M18 12 L18 6 C18 5 20 4 22 4 L24 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Roll bars (cabrio) */}
    <path d="M44 12 L44 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M48 12 L48 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Windshield */}
    <path d="M18 6 L24 4 L26 12 L18 12 Z" fill="currentColor" opacity="0.3"/>
    {/* Side styling */}
    <path d="M28 14 L54 14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    {/* Front wheel - larger for SUV */}
    <circle cx="18" cy="24" r="6" />
    <circle cx="18" cy="24" r="3" fill="white" opacity="0.3"/>
    {/* Rear wheel - larger for SUV */}
    <circle cx="54" cy="24" r="6" />
    <circle cx="54" cy="24" r="3" fill="white" opacity="0.3"/>
    {/* Headlight */}
    <rect x="6" y="16" width="4" height="2" rx="1" fill="white" opacity="0.6"/>
    {/* Grille */}
    <rect x="8" y="19" width="6" height="3" rx="1" fill="currentColor" opacity="0.5"/>
  </svg>
);

export function VehicleTypeSelector({ value, onChange }: VehicleTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Economy option */}
        <button
          type="button"
          onClick={() => onChange("economy")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            value === "economy"
              ? "border-yellow-400 bg-yellow-400/10"
              : "border-border bg-card hover:border-yellow-400/50 hover:bg-yellow-400/5"
          )}
        >
          <CompactCarIcon className="w-16 h-8 text-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">Utilitaria</p>
            <p className="text-xs text-muted-foreground">Comoda e conveniente</p>
          </div>
          {value === "economy" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />
          )}
        </button>

        {/* Premium SUV option */}
        <button
          type="button"
          onClick={() => onChange("premium")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            value === "premium"
              ? "border-yellow-400 bg-yellow-400/10"
              : "border-border bg-card hover:border-yellow-400/50 hover:bg-yellow-400/5"
          )}
        >
          <SUVCabrioIcon className="w-18 h-8 text-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">SUV Cabrio</p>
            <p className="text-xs text-muted-foreground">Spazio e stile</p>
          </div>
          {value === "premium" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />
          )}
        </button>
      </div>
    </div>
  );
}
