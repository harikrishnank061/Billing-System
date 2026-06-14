import React, { useEffect, useState } from "react";
import { generateQrCodeSvg } from "@/lib/barcode";

type QrCodeProps = {
  value: string;
  className?: string;
  size?: number;
};

export const QrCode: React.FC<QrCodeProps> = ({ value, className = "", size = 100 }) => {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (value) {
      generateQrCodeSvg(value).then(setSvg);
    }
  }, [value]);

  if (!value) return null;

  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-secondary/40 animate-pulse rounded-lg border border-border/50 ${className}`}
      />
    );
  }

  // Adjust width/height from QR Code's original generated output to scale inside wrapper
  const scaledSvg = svg
    .replace(/width="[^"]+"/, `width="100%"`)
    .replace(/height="[^"]+"/, `height="100%"`);

  return (
    <div
      className={`flex items-center justify-center bg-white p-1 rounded-xl shadow-sm border border-border/60 ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: scaledSvg }}
    />
  );
};
