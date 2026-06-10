export function convertToDevanagari(numStr: string): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return numStr.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
}

export function formatNumberWithCommas(value: number, language: string = 'en'): string {
  if (value === 0) return "";
  const formatted = value.toLocaleString("en-IN");
  if (language === 'ne') {
    return convertToDevanagari(formatted);
  }
  return formatted;
}

export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const devanagariToWestern: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const westernValue = value.replace(/[०१२३४५६७८९]/g, (digit) => devanagariToWestern[digit]);
  const parsed = parseInt(westernValue.replace(/,/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}
