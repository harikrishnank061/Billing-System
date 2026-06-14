import QRCode from "qrcode";

// Code 128 Subset B patterns (widths of bars and spaces)
const CODE128_PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
];

const START_B = "211214"; // Index 104
const STOP = "2331112"; // Index 106

// EAN-13 / UPC-A Digit Encodings
const EAN_L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];

const EAN_G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];

const EAN_R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];

const PARITY_TABLE = [
  ["L", "L", "L", "L", "L", "L"], // 0
  ["L", "L", "G", "L", "G", "G"], // 1
  ["L", "L", "G", "G", "L", "G"], // 2
  ["L", "L", "G", "G", "G", "L"], // 3
  ["L", "G", "L", "L", "G", "G"], // 4
  ["L", "G", "G", "L", "L", "G"], // 5
  ["L", "G", "G", "G", "L", "L"], // 6
  ["L", "G", "L", "G", "L", "G"], // 7
  ["L", "G", "L", "G", "G", "L"], // 8
  ["L", "G", "G", "L", "G", "L"], // 9
];

/**
 * Converts a pattern of widths (e.g. "211214") into binary "1s" and "0s"
 */
function patternToBinary(pattern: string): string {
  let binary = "";
  let isBar = true;
  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10);
    binary += (isBar ? "1" : "0").repeat(width);
    isBar = !isBar;
  }
  return binary;
}

/**
 * Encodes a string into Code 128 subset B binary string
 */
function encodeCode128(text: string): string {
  let binary = patternToBinary(START_B);
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const value = charCode - 32;
    if (value < 0 || value > 102) {
      // Out of bounds character, skip or replace with space
      checksum += (i + 1) * 0;
      binary += patternToBinary(CODE128_PATTERNS[0]);
    } else {
      checksum += (i + 1) * value;
      binary += patternToBinary(CODE128_PATTERNS[value]);
    }
  }

  const checkValue = checksum % 103;
  binary += patternToBinary(CODE128_PATTERNS[checkValue]);
  binary += patternToBinary(STOP);
  return binary;
}

/**
 * Encodes a numeric string into EAN-13 binary string
 */
function encodeEAN13(digits: string): string {
  // Pad digits if necessary
  let clean = digits.replace(/\D/g, "");
  if (clean.length < 13) {
    clean = clean.padStart(13, "0");
  } else if (clean.length > 13) {
    clean = clean.substring(0, 13);
  }

  const firstDigit = parseInt(clean[0], 10);
  const parity = PARITY_TABLE[firstDigit];

  // Left guard
  let binary = "101";

  // First 6 digits (left group)
  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(clean[i], 10);
    const type = parity[i - 1];
    binary += type === "L" ? EAN_L[digit] : EAN_G[digit];
  }

  // Center guard
  binary += "01010";

  // Last 6 digits (right group)
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(clean[i], 10);
    binary += EAN_R[digit];
  }

  // Right guard
  binary += "101";
  return binary;
}

/**
 * Encodes a numeric string into UPC-A binary string
 * UPC-A is essentially EAN-13 with a leading '0'
 */
function encodeUPC(digits: string): string {
  let clean = digits.replace(/\D/g, "");
  if (clean.length < 12) {
    clean = clean.padStart(12, "0");
  } else if (clean.length > 12) {
    clean = clean.substring(0, 12);
  }
  // Convert to EAN-13 starting with 0
  return encodeEAN13("0" + clean);
}

/**
 * Generates an SVG path for drawing barcode lines
 * Returns the inner SVG rect elements or coordinates.
 */
export function generateBarcodeBinary(text: string, type: "CODE128" | "EAN13" | "UPC"): string {
  try {
    if (type === "EAN13") {
      return encodeEAN13(text);
    } else if (type === "UPC") {
      return encodeUPC(text);
    } else {
      return encodeCode128(text);
    }
  } catch (error) {
    console.error("Failed to encode barcode:", error);
    return encodeCode128(text); // Fallback to Code 128
  }
}

/**
 * Generate a complete barcode SVG element as a React-renderable structure or string.
 */
export function generateBarcodeSvgMarkup(
  text: string,
  type: "CODE128" | "EAN13" | "UPC" = "CODE128",
  width: number = 200,
  height: number = 80,
): { binary: string; path: string; totalModules: number } {
  const binary = generateBarcodeBinary(text, type);
  const totalModules = binary.length;

  // Calculate SVG lines
  let path = "";
  for (let i = 0; i < totalModules; i++) {
    if (binary[i] === "1") {
      path += `M${i},0 L${i},${height} `;
    }
  }

  return { binary, path, totalModules };
}

/**
 * Async generates a QR Code as an SVG string
 */
export async function generateQrCodeSvg(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#1F2937", // Charcoal
        light: "#FFFFFF",
      },
    });
    return svgString;
  } catch (err) {
    console.error("QR Generation failed:", err);
    return `<svg width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eee"/><text x="10" y="50" font-size="10">QR Code Error</text></svg>`;
  }
}
