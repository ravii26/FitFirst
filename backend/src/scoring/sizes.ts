export function normalizeSize(size: string): string {
  const value = size.trim().toUpperCase();
  return ({ XXL: "2XL", XXXL: "3XL", "ONE SIZE": "FREE", ONESIZE: "FREE" } as Record<string, string>)[value] ?? value;
}
export function selectedSizes(input: string): string[] {
  return [...new Set(input.split(";").map(normalizeSize).filter(Boolean))];
}
export function getAdjacentSizes(size: string): string[] {
  const value = normalizeSize(size);
  const sequence = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const index = sequence.indexOf(value);
  if (index !== -1) return sequence.filter((_, i) => Math.abs(i - index) === 1);
  if (/^\d+Y$/.test(value)) {
    const age = Number(value.slice(0, -1));
    return [age - 2, age + 2].filter(n => n > 0 && n <= 18).map(n => `${n}Y`);
  }
  if (/^\d+$/.test(value)) return [Number(value) - 2, Number(value) + 2].filter(n => n > 0).map(String);
  return [];
}
export function matchingSize(range: string[], selections: string[]): string | undefined {
  return range.find(s => selections.includes(normalizeSize(s))) ?? range.find(s => normalizeSize(s) === "FREE");
}
