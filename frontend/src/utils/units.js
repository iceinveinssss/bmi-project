export const UNITS = {
  metric: { weightLabel: 'кг', heightLabel: 'см' },
  imperial: { weightLabel: 'lb', heightLabel: 'in' },
};

export function kgToLb(kg) {
  return kg * 2.2046226218;
}

export function lbToKg(lb) {
  return lb / 2.2046226218;
}

export function cmToIn(cm) {
  return cm / 2.54;
}

export function inToCm(inches) {
  return inches * 2.54;
}

export function toMetricWeight(value, units) {
  if (value == null) return value;
  return units === 'imperial' ? lbToKg(value) : value;
}

export function toMetricHeight(value, units) {
  if (value == null) return value;
  return units === 'imperial' ? inToCm(value) : value;
}

export function fromMetricWeight(value, units) {
  if (value == null) return value;
  return units === 'imperial' ? kgToLb(value) : value;
}

export function fromMetricHeight(value, units) {
  if (value == null) return value;
  return units === 'imperial' ? cmToIn(value) : value;
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}

export function format1(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return String(round1(value));
}

