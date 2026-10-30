import {
  CalculationResult,
  DualOilCalculationResult,
  MultiOilCalculationResult,
  MultiOilItemResult,
  AppSettings,
} from '../types';

/**
 * Perfume Formulation Calculation Engine
 * 
 * Formulas:
 * 1. Oil Volume (ml) = Bottle Volume (ml) × (Oil Concentration (%) ÷ 100)
 * 2. Alcohol Volume (ml) = Bottle Volume (ml) − Oil Volume (ml)
 * 3. Oil Weight (g) = Oil Volume (ml) × Oil Density (g/ml)
 * 4. Alcohol Weight (g) = Alcohol Volume (ml) × Alcohol Density (g/ml)
 */

export function calculateFormula(
  bottleSize: number,
  concentration: number,
  settings: AppSettings
): CalculationResult {
  const safeBottleSize = Math.max(0, Number(bottleSize) || 0);
  const safeConcentration = Math.min(100, Math.max(0, Number(concentration) || 0));
  const safeOilDensity = Math.max(0.001, Number(settings.oilDensity) || 1.0);
  const safeAlcoholDensity = Math.max(0.001, Number(settings.alcoholDensity) || 0.789);

  // Exact volumetric calculation
  const oilMlRaw = (safeBottleSize * safeConcentration) / 100;
  const alcoholMlRaw = safeBottleSize - oilMlRaw;

  // Exact gravimetric (mass) calculation using configured densities
  const oilGramsRaw = oilMlRaw * safeOilDensity;
  const alcoholGramsRaw = alcoholMlRaw * safeAlcoholDensity;

  const precision = settings.roundingPrecision || 2;

  return {
    bottleSize: roundTo(safeBottleSize, precision),
    concentration: roundTo(safeConcentration, precision),
    oilMl: roundTo(oilMlRaw, precision),
    oilGrams: roundTo(oilGramsRaw, precision),
    alcoholMl: roundTo(alcoholMlRaw, precision),
    alcoholGrams: roundTo(alcoholGramsRaw, precision),
    totalVolume: roundTo(safeBottleSize, precision),
    oilPercentage: roundTo(safeConcentration, precision),
    alcoholPercentage: roundTo(100 - safeConcentration, precision),
    oilDensity: safeOilDensity,
    alcoholDensity: safeAlcoholDensity,
  };
}

/**
 * Mix 2 Oils Calculation Engine (Backward compatible)
 */
export function calculateDualOilFormula(
  bottleSize: number,
  totalConcentration: number,
  oil1AllocationPercent: number,
  oil2AllocationPercent: number,
  settings: AppSettings
): DualOilCalculationResult {
  const safeBottleSize = Math.max(0, Number(bottleSize) || 0);
  const safeConcentration = Math.min(100, Math.max(0, Number(totalConcentration) || 0));
  const safeOilDensity = Math.max(0.001, Number(settings.oilDensity) || 1.0);
  const safeAlcoholDensity = Math.max(0.001, Number(settings.alcoholDensity) || 0.789);

  // Exact Total Oil and Alcohol volumetric calculation
  const totalOilMlRaw = (safeBottleSize * safeConcentration) / 100;
  const alcoholMlRaw = Math.max(0, safeBottleSize - totalOilMlRaw);

  // Validation: oil1 + oil2 must sum to 100%
  const sumAllocation = Number((oil1AllocationPercent + oil2AllocationPercent).toFixed(4));
  const isValidAllocation = Math.abs(sumAllocation - 100) < 0.05;
  const allocationError = isValidAllocation
    ? undefined
    : `Total allocation equals ${sumAllocation}% (must equal exactly 100%)`;

  // Oil 1 and Oil 2 individual quantities
  const safeOil1Alloc = Math.max(0, Number(oil1AllocationPercent) || 0);
  const safeOil2Alloc = Math.max(0, Number(oil2AllocationPercent) || 0);

  const oil1MlRaw = (totalOilMlRaw * safeOil1Alloc) / 100;
  const oil2MlRaw = (totalOilMlRaw * safeOil2Alloc) / 100;

  const oil1GramsRaw = oil1MlRaw * safeOilDensity;
  const oil2GramsRaw = oil2MlRaw * safeOilDensity;
  const totalOilGramsRaw = oil1GramsRaw + oil2GramsRaw;
  const alcoholGramsRaw = alcoholMlRaw * safeAlcoholDensity;

  const precision = settings.roundingPrecision || 2;

  return {
    bottleSize: roundTo(safeBottleSize, precision),
    totalConcentration: roundTo(safeConcentration, precision),
    totalOilMl: roundTo(totalOilMlRaw, precision),
    totalOilGrams: roundTo(totalOilGramsRaw, precision),
    alcoholMl: roundTo(alcoholMlRaw, precision),
    alcoholGrams: roundTo(alcoholGramsRaw, precision),
    totalVolume: roundTo(safeBottleSize, precision),
    alcoholPercentage: roundTo(100 - safeConcentration, precision),
    oil1: {
      allocationPercent: roundTo(safeOil1Alloc, precision),
      oilMl: roundTo(oil1MlRaw, precision),
      oilGrams: roundTo(oil1GramsRaw, precision),
    },
    oil2: {
      allocationPercent: roundTo(safeOil2Alloc, precision),
      oilMl: roundTo(oil2MlRaw, precision),
      oilGrams: roundTo(oil2GramsRaw, precision),
    },
    oilDensity: safeOilDensity,
    alcoholDensity: safeAlcoholDensity,
    isValidAllocation,
    allocationError,
  };
}

/**
 * Universal Multi-Oil Calculation Engine (1, 2, 3, or 4 Oils)
 * 
 * 1. Total Oil Volume (ml) = Bottle Volume (ml) × (Total Oil Concentration (%) ÷ 100)
 * 2. Alcohol Volume (ml) = Bottle Volume (ml) − Total Oil Volume (ml)
 * 3. For each oil i:
 *    Oil i Volume (ml) = Total Oil Volume (ml) × (Oil i Allocation (%) ÷ 100)
 *    Oil i Weight (g) = Oil i Volume (ml) × Oil Density (g/ml)
 * 4. Alcohol Weight (g) = Alcohol Volume (ml) × Alcohol Density (g/ml)
 * 
 * Constraint: Sum of Oil Allocations (%) MUST equal 100%
 */
export function calculateMultiOilFormula(
  bottleSize: number,
  totalConcentration: number,
  oilAllocations: number[],
  settings: AppSettings,
  oilDetails?: { perfumeId?: string; perfumeCode?: string; perfumeName?: string; category?: any }[]
): MultiOilCalculationResult {
  const safeBottleSize = Math.max(0, Number(bottleSize) || 0);
  const safeConcentration = Math.min(100, Math.max(0, Number(totalConcentration) || 0));
  const safeOilDensity = Math.max(0.001, Number(settings.oilDensity) || 1.0);
  const safeAlcoholDensity = Math.max(0.001, Number(settings.alcoholDensity) || 0.789);
  const precision = settings.roundingPrecision || 2;

  // 1. Total Oil & Alcohol Volume
  const totalOilMlRaw = (safeBottleSize * safeConcentration) / 100;
  const alcoholMlRaw = Math.max(0, safeBottleSize - totalOilMlRaw);

  // 2. Sum of allocations check
  const numOils = Math.max(1, oilAllocations.length);
  const allocationSumRaw = oilAllocations.reduce((sum, val) => sum + (Number(val) || 0), 0);
  const allocationSum = roundTo(allocationSumRaw, 2);
  const isValidAllocation = Math.abs(allocationSum - 100) < 0.05;
  const allocationError = isValidAllocation
    ? undefined
    : `Oil allocations total ${allocationSum}% (must equal exactly 100%).`;

  // 3. Calculate each oil's volume and mass
  let totalOilGramsRaw = 0;
  const calculatedOils: MultiOilItemResult[] = oilAllocations.map((alloc, idx) => {
    const safeAlloc = Math.max(0, Number(alloc) || 0);
    const oilMlRaw = (totalOilMlRaw * safeAlloc) / 100;
    const oilGramsRaw = oilMlRaw * safeOilDensity;
    totalOilGramsRaw += oilGramsRaw;

    const detail = oilDetails && oilDetails[idx] ? oilDetails[idx] : {};

    return {
      index: idx + 1,
      perfumeId: detail.perfumeId,
      perfumeCode: detail.perfumeCode,
      perfumeName: detail.perfumeName,
      category: detail.category,
      allocationPercent: roundTo(safeAlloc, 2),
      oilMl: roundTo(oilMlRaw, 3), // allow precise 3 decimals e.g. 5.775 ml or standard rounded
      oilGrams: roundTo(oilGramsRaw, precision),
    };
  });

  const alcoholGramsRaw = alcoholMlRaw * safeAlcoholDensity;

  return {
    bottleSize: roundTo(safeBottleSize, precision),
    totalConcentration: roundTo(safeConcentration, precision),
    totalOilMl: roundTo(totalOilMlRaw, 3),
    totalOilGrams: roundTo(totalOilGramsRaw, precision),
    alcoholMl: roundTo(alcoholMlRaw, 3),
    alcoholGrams: roundTo(alcoholGramsRaw, precision),
    totalVolume: roundTo(safeBottleSize, precision),
    alcoholPercentage: roundTo(100 - safeConcentration, precision),
    numberOfOils: numOils,
    oils: calculatedOils,
    oilDensity: safeOilDensity,
    alcoholDensity: safeAlcoholDensity,
    isValidAllocation,
    allocationSum,
    allocationError,
  };
}

export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatMl(val: number): string {
  return `${val.toFixed(2)} ml`;
}

export function formatGrams(val: number): string {
  return `${val.toFixed(2)} g`;
}

