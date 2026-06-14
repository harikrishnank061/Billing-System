import React from "react";
import { generateBarcodeSvgMarkup } from "@/lib/barcode";

type BarcodeProps = {
  value: string;
  type?: "CODE128" | "EAN13" | "UPC";
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
};

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  type = "CODE128",
  width = 200,
  height = 60,
  showText = true,
  className = "",
}) => {
  if (!value) return null;

  const { path, totalModules } = generateBarcodeSvgMarkup(value, type, width, height);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalModules} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="stroke-foreground text-foreground"
        style={{ strokeWidth: 1.4 }}
      >
        <path d={path} />
      </svg>
      {showText && (
        <span className="text-[10px] font-mono tracking-widest mt-1 text-muted-foreground uppercase">
          {value}
        </span>
      )}
    </div>
  );
};
