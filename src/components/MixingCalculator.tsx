import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FlaskConical,
  Search,
  Check,
  ChevronDown,
  Sparkles,
  Droplet,
  Save,
  Printer,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Percent,
  Tag,
  Layers,
  Sliders,
  ArrowRightLeft,
  Equal,
  Scale,
  User,
  Users,
  UserCheck,
  Plus,
} from 'lucide-react';
import {
  Perfume,
  AppSettings,
  MixingFormula,
  CalculationResult,
  DualOilCalculationResult,
  MultiOilCalculationResult,
  MixingMode,
  SalesMan,
} from '../types';
import {
  calculateFormula,
  calculateDualOilFormula,
  calculateMultiOilFormula,
  formatMl,
  formatGrams,
} from '../services/calculator';
import {
  exportFormulaToPdf,
  exportDualFormulaToPdf,
  exportMultiFormulaToPdf,
} from '../services/export';
import {
  detectCategoryFromCode,
  getHighestCategory,
  getHighestCategoryOfAll,
  calculateSellingPrice,
  findBottleOption,
  BOTTLE_OPTIONS,
  CONCENTRATION_TIERS,
  PriceCategory,
  BottleOptionId,
  BottleOption,
} from '../services/pricing';
import { PriceChartModal } from './PriceChartModal';

interface MixingCalculatorProps {
  perfumes: Perfume[];
  settings: AppSettings;
  salesmen?: SalesMan[];
  preselectedPerfume: Perfume | null;
  preselectedFormula: MixingFormula | null;
  preselectedSalesManId?: string;
  onSaveFormula: (formula: Omit<MixingFormula, 'id' | 'createdAt'>) => MixingFormula;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSalesTeam?: () => void;
}

const CATEGORIES: PriceCategory[] = ['A', 'B', 'C', 'D'];

export type NumberOfOilsCount = 1 | 2 | 3 | 4;

interface OilSlot {
  perfumeId: string;
  allocationPercent: number;
}

export const MixingCalculator: React.FC<MixingCalculatorProps> = ({
  perfumes,
  settings,
  salesmen = [],
  preselectedPerfume,
  preselectedFormula,
  preselectedSalesManId,
  onSaveFormula,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToSalesTeam,
}) => {
  // Sales Man Tracking
  const [selectedSalesManId, setSelectedSalesManId] = useState<string>('');
  const [salesManSearchQuery, setSalesManSearchQuery] = useState<string>('');
  const [isSalesManDropdownOpen, setIsSalesManDropdownOpen] = useState<boolean>(false);
  const [salesManError, setSalesManError] = useState<string>('');
  const salesManDropdownRef = useRef<HTMLDivElement>(null);

  // Number of Oils: 1, 2, 3, or 4
  const [numberOfOils, setNumberOfOils] = useState<NumberOfOilsCount>(1);

  // Oil slots (up to 4)
  const [oilSlots, setOilSlots] = useState<OilSlot[]>([
    { perfumeId: '', allocationPercent: 100 },
    { perfumeId: '', allocationPercent: 50 },
    { perfumeId: '', allocationPercent: 33.33 },
    { perfumeId: '', allocationPercent: 25 },
  ]);

  // Manual category override (optional)
  const [manualCategoryOverride, setManualCategoryOverride] = useState<PriceCategory | null>(null);

  // Shared Bottle & Concentration
  const [selectedBottleId, setSelectedBottleId] = useState<BottleOptionId>('36ml_standard');
  const [bottleSize, setBottleSize] = useState<number>(36);
  const [concentration, setConcentration] = useState<number>(30);

  // Optional batch / client metadata
  const [customerName, setCustomerName] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [formulationNotes, setFormulationNotes] = useState<string>('');

  // Dropdown open states and search queries for each oil slot
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>(['', '', '', '']);
  const dropdownContainersRef = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  // Price chart modal
  const [isPriceChartOpen, setIsPriceChartOpen] = useState<boolean>(false);

  // Status feedback
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string>('');

  // Currency
  const currencySymbol = settings.currencySymbol || 'DH';

  // Initialize selected perfumes and repeat formulas
  useEffect(() => {
    if (preselectedFormula) {
      if (preselectedFormula.salesManId) {
        setSelectedSalesManId(preselectedFormula.salesManId);
      }
      const numOils = (preselectedFormula.numberOfOils ||
        (preselectedFormula.oils ? preselectedFormula.oils.length : preselectedFormula.mode === 'dual' ? 2 : 1)) as NumberOfOilsCount;

      setNumberOfOils(numOils);

      if (preselectedFormula.oils && preselectedFormula.oils.length > 0) {
        const newSlots: OilSlot[] = [
          { perfumeId: '', allocationPercent: 100 },
          { perfumeId: '', allocationPercent: 50 },
          { perfumeId: '', allocationPercent: 33.33 },
          { perfumeId: '', allocationPercent: 25 },
        ];

        preselectedFormula.oils.forEach((oil, idx) => {
          if (idx < 4) {
            newSlots[idx] = {
              perfumeId: oil.perfumeId,
              allocationPercent: oil.allocationPercent,
            };
          }
        });
        setOilSlots(newSlots);
      } else if (preselectedFormula.mode === 'dual' && preselectedFormula.oil1 && preselectedFormula.oil2) {
        setOilSlots([
          { perfumeId: preselectedFormula.oil1.perfumeId, allocationPercent: preselectedFormula.oil1.allocationPercent },
          { perfumeId: preselectedFormula.oil2.perfumeId, allocationPercent: preselectedFormula.oil2.allocationPercent },
          { perfumeId: perfumes[2]?.id || perfumes[0]?.id || '', allocationPercent: 33.33 },
          { perfumeId: perfumes[3]?.id || perfumes[0]?.id || '', allocationPercent: 25 },
        ]);
      } else {
        setOilSlots([
          { perfumeId: preselectedFormula.perfumeId, allocationPercent: 100 },
          { perfumeId: perfumes[1]?.id || perfumes[0]?.id || '', allocationPercent: 50 },
          { perfumeId: perfumes[2]?.id || perfumes[0]?.id || '', allocationPercent: 33.33 },
          { perfumeId: perfumes[3]?.id || perfumes[0]?.id || '', allocationPercent: 25 },
        ]);
      }

      if (preselectedFormula.highestCategory) {
        setManualCategoryOverride(preselectedFormula.highestCategory);
      } else if (preselectedFormula.priceCategory) {
        setManualCategoryOverride(preselectedFormula.priceCategory);
      }

      setBottleSize(preselectedFormula.bottleSize);
      setConcentration(preselectedFormula.concentration);
      const matchedOpt = findBottleOption(preselectedFormula.bottleSize);
      setSelectedBottleId(matchedOpt.id);
      if (preselectedFormula.customerName) setCustomerName(preselectedFormula.customerName);
      if (preselectedFormula.batchNumber) setBatchNumber(preselectedFormula.batchNumber);
      if (preselectedFormula.notes) setFormulationNotes(preselectedFormula.notes);
    } else if (preselectedPerfume) {
      setOilSlots((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], perfumeId: preselectedPerfume.id };
        return next;
      });
      setManualCategoryOverride(null);
    } else if (perfumes.length > 0) {
      setOilSlots((prev) => {
        const next = [...prev];
        if (!next[0].perfumeId) next[0].perfumeId = perfumes[0]?.id || '';
        if (!next[1].perfumeId) next[1].perfumeId = perfumes[1]?.id || perfumes[0]?.id || '';
        if (!next[2].perfumeId) next[2].perfumeId = perfumes[2]?.id || perfumes[0]?.id || '';
        if (!next[3].perfumeId) next[3].perfumeId = perfumes[3]?.id || perfumes[0]?.id || '';
        return next;
      });
    }

    // Handle salesman selection
    if (preselectedSalesManId) {
      setSelectedSalesManId(preselectedSalesManId);
    } else if (!selectedSalesManId && salesmen && salesmen.length > 0) {
      const firstActive = salesmen.find((s) => s.status === 'active' || s.isActive !== false) || salesmen[0];
      if (firstActive) {
        setSelectedSalesManId(firstActive.id);
      }
    }
  }, [preselectedPerfume, preselectedFormula, preselectedSalesManId, perfumes, salesmen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdownIndex !== null) {
        const currentContainer = dropdownContainersRef.current[openDropdownIndex];
        if (currentContainer && !currentContainer.contains(event.target as Node)) {
          setOpenDropdownIndex(null);
        }
      }
      if (isSalesManDropdownOpen && salesManDropdownRef.current) {
        if (!salesManDropdownRef.current.contains(event.target as Node)) {
          setIsSalesManDropdownOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownIndex, isSalesManDropdownOpen]);

  // Handle switching number of oils
  const handleSelectNumberOfOils = (count: NumberOfOilsCount) => {
    setNumberOfOils(count);
    setManualCategoryOverride(null);

    setOilSlots((prev) => {
      const next = [...prev];
      if (count === 1) {
        next[0] = { ...next[0], allocationPercent: 100 };
      } else if (count === 2) {
        next[0] = { ...next[0], allocationPercent: 50 };
        next[1] = { ...next[1], allocationPercent: 50 };
      } else if (count === 3) {
        next[0] = { ...next[0], allocationPercent: 33.33 };
        next[1] = { ...next[1], allocationPercent: 33.33 };
        next[2] = { ...next[2], allocationPercent: 33.34 };
      } else if (count === 4) {
        next[0] = { ...next[0], allocationPercent: 25 };
        next[1] = { ...next[1], allocationPercent: 25 };
        next[2] = { ...next[2], allocationPercent: 25 };
        next[3] = { ...next[3], allocationPercent: 25 };
      }
      return next;
    });
  };

  // Helper to split allocations equally across active oils
  const handleSplitEvenly = () => {
    setOilSlots((prev) => {
      const next = [...prev];
      if (numberOfOils === 1) {
        next[0].allocationPercent = 100;
      } else if (numberOfOils === 2) {
        next[0].allocationPercent = 50;
        next[1].allocationPercent = 50;
      } else if (numberOfOils === 3) {
        next[0].allocationPercent = 33.33;
        next[1].allocationPercent = 33.33;
        next[2].allocationPercent = 33.34;
      } else if (numberOfOils === 4) {
        next[0].allocationPercent = 25;
        next[1].allocationPercent = 25;
        next[2].allocationPercent = 25;
        next[3].allocationPercent = 25;
      }
      return next;
    });
  };

  // Helper to normalize allocations to 100%
  const handleAutoBalance = () => {
    const activeAllocations = oilSlots.slice(0, numberOfOils).map((s) => s.allocationPercent);
    const sum = activeAllocations.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
      handleSplitEvenly();
      return;
    }

    setOilSlots((prev) => {
      const next = [...prev];
      let remaining = 100;
      for (let i = 0; i < numberOfOils; i++) {
        if (i === numberOfOils - 1) {
          next[i].allocationPercent = Number(remaining.toFixed(2));
        } else {
          const scaled = Number(((prev[i].allocationPercent / sum) * 100).toFixed(2));
          next[i].allocationPercent = scaled;
          remaining -= scaled;
        }
      }
      return next;
    });
  };

  // Update specific oil slot allocation
  const handleUpdateAllocation = (index: number, value: number) => {
    const clampedVal = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
    setOilSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], allocationPercent: clampedVal };

      // In 2-oil mode, auto-balance the other oil for convenient workflow
      if (numberOfOils === 2) {
        const otherIndex = index === 0 ? 1 : 0;
        next[otherIndex] = {
          ...next[otherIndex],
          allocationPercent: Number((100 - clampedVal).toFixed(2)),
        };
      }
      return next;
    });
  };

  // Update selected perfume for a slot
  const handleSelectPerfumeForSlot = (index: number, perfumeId: string) => {
    setOilSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], perfumeId };
      return next;
    });
    setOpenDropdownIndex(null);
    setSearchQueries((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
  };

  // Selected perfume objects for active slots
  const activeSelectedPerfumes = useMemo(() => {
    return Array.from({ length: numberOfOils }, (_, i) => {
      const slot = oilSlots[i];
      const perf =
        perfumes.find((p) => p.id === slot?.perfumeId) ||
        perfumes[i % perfumes.length] ||
        perfumes[0] ||
        null;
      return perf;
    });
  }, [oilSlots, numberOfOils, perfumes]);

  // Detected categories for active oils
  const activeOilCategories = useMemo(() => {
    return activeSelectedPerfumes.map((perf) => detectCategoryFromCode(perf?.code));
  }, [activeSelectedPerfumes]);

  // Highest category among ALL active selected oils
  const autoHighestCategory = useMemo(() => {
    return getHighestCategoryOfAll(activeOilCategories);
  }, [activeOilCategories]);

  // Final active category used for pricing
  const activeCategory: PriceCategory = useMemo(() => {
    if (manualCategoryOverride) return manualCategoryOverride;
    return autoHighestCategory;
  }, [manualCategoryOverride, autoHighestCategory]);

  // Active allocations array
  const activeAllocations = useMemo(() => {
    return oilSlots.slice(0, numberOfOils).map((s) => s.allocationPercent);
  }, [oilSlots, numberOfOils]);

  // Allocation sum & validity check
  const allocationSum = useMemo(() => {
    return Number(activeAllocations.reduce((a, b) => a + b, 0).toFixed(2));
  }, [activeAllocations]);

  const isAllocationValid = useMemo(() => {
    if (numberOfOils === 1) return true;
    return Math.abs(allocationSum - 100) < 0.05;
  }, [numberOfOils, allocationSum]);

  // Multi-Oil Calculation Result
  const multiCalcResult: MultiOilCalculationResult = useMemo(() => {
    const oilDetails = activeSelectedPerfumes.map((perf, idx) => ({
      perfumeId: perf?.id || `oil-${idx + 1}`,
      perfumeCode: perf?.code || `CODE-${idx + 1}`,
      perfumeName: perf?.name || `Oil ${idx + 1}`,
      category: activeOilCategories[idx] || 'A',
    }));

    return calculateMultiOilFormula(
      bottleSize,
      concentration,
      activeAllocations,
      settings,
      oilDetails
    );
  }, [
    bottleSize,
    concentration,
    activeAllocations,
    settings,
    activeSelectedPerfumes,
    activeOilCategories,
  ]);

  // Real-time Selling Price from Kprime Chart (Always uses the highest category among all oils)
  const priceResult = useMemo(() => {
    return calculateSellingPrice(selectedBottleId, activeCategory, concentration);
  }, [selectedBottleId, activeCategory, concentration]);

  // When a bottle option is clicked
  const handleSelectBottleOption = (bottle: BottleOption) => {
    setSelectedBottleId(bottle.id);
    setBottleSize(bottle.volumeMl);
  };

  // When a custom bottle size is changed
  const handleCustomBottleSize = (size: number) => {
    setBottleSize(size);
    const matched = findBottleOption(size, selectedBottleId);
    setSelectedBottleId(matched.id);
  };

  // Save current formula
  const handleSaveFormula = () => {
    // 1. Check Sales Man selection (REQUIRED)
    if (!selectedSalesManId) {
      setSalesManError('Please select the Sales Man who performed this mixing operation before saving.');
      setIsSalesManDropdownOpen(true);
      return;
    }

    const currentSalesMan = salesmen.find((s) => s.id === selectedSalesManId);
    if (!currentSalesMan) {
      setSalesManError('Selected Sales Man is invalid. Please pick a Sales Man from the list.');
      setIsSalesManDropdownOpen(true);
      return;
    }

    setSalesManError('');

    if (!isAllocationValid) return;
    if (activeSelectedPerfumes.some((p) => !p)) return;

    const mode: MixingMode = numberOfOils === 1 ? 'single' : numberOfOils === 2 ? 'dual' : 'multi';
    const primaryPerfume = activeSelectedPerfumes[0]!;

    const formulaOils = multiCalcResult.oils.map((o, idx) => ({
      perfumeId: activeSelectedPerfumes[idx]?.id || o.perfumeId || `oil-${idx + 1}`,
      perfumeCode: activeSelectedPerfumes[idx]?.code || o.perfumeCode || `CODE-${idx + 1}`,
      perfumeName: activeSelectedPerfumes[idx]?.name || o.perfumeName || `Oil ${idx + 1}`,
      allocationPercent: o.allocationPercent,
      oilMl: o.oilMl,
      oilGrams: o.oilGrams,
      category: activeOilCategories[idx] || 'A',
    }));

    const formulaSummaryName =
      numberOfOils === 1
        ? primaryPerfume.name
        : `${numberOfOils} Oils Blend: ${formulaOils.map((o) => `${o.perfumeName} (${o.allocationPercent}%)`).join(' + ')}`;

    const formulaSummaryCode =
      numberOfOils === 1
        ? primaryPerfume.code
        : formulaOils.map((o) => o.perfumeCode).join('+');

    onSaveFormula({
      salesManId: currentSalesMan.id,
      salesManName: currentSalesMan.name,
      mode,
      numberOfOils,
      perfumeId: formulaSummaryCode,
      perfumeCode: formulaSummaryCode,
      perfumeName: formulaSummaryName,
      oils: formulaOils,
      oil1: formulaOils[0],
      oil2: formulaOils[1],
      oil3: formulaOils[2],
      oil4: formulaOils[3],
      highestCategory: activeCategory,
      bottleSize: multiCalcResult.bottleSize,
      concentration: multiCalcResult.totalConcentration,
      oilMl: multiCalcResult.totalOilMl,
      oilGrams: multiCalcResult.totalOilGrams,
      alcoholMl: multiCalcResult.alcoholMl,
      alcoholGrams: multiCalcResult.alcoholGrams,
      oilDensity: multiCalcResult.oilDensity,
      alcoholDensity: multiCalcResult.alcoholDensity,
      totalVolume: multiCalcResult.totalVolume,
      price: priceResult.price,
      priceCategory: activeCategory,
      bottleType: priceResult.bottleOption.label,
      customerName: customerName.trim() || undefined,
      batchNumber: batchNumber.trim() || `BATCH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
      notes: formulationNotes.trim() || undefined,
    });

    setSavedSuccessMessage(
      numberOfOils === 1
        ? `Formula for ${primaryPerfume.name} saved under Sales Man "${currentSalesMan.name}" (${priceResult.price} ${currencySymbol}).`
        : `${numberOfOils}-Oil Blend saved under Sales Man "${currentSalesMan.name}" with Highest Category ${activeCategory} (${priceResult.price} ${currencySymbol}).`
    );

    setTimeout(() => setSavedSuccessMessage(''), 7000);
  };

  // Export PDF Formulation Worksheet
  const handleExportPdf = () => {
    if (!isAllocationValid) return;
    if (activeSelectedPerfumes.some((p) => !p)) return;

    const currentSalesMan = salesmen.find((s) => s.id === selectedSalesManId);
    const formulatorTitle = currentSalesMan ? `Sales Man / Formulator: ${currentSalesMan.name}` : undefined;

    if (numberOfOils === 1) {
      const singleCalc: CalculationResult = {
        bottleSize: multiCalcResult.bottleSize,
        concentration: multiCalcResult.totalConcentration,
        oilMl: multiCalcResult.totalOilMl,
        oilGrams: multiCalcResult.totalOilGrams,
        alcoholMl: multiCalcResult.alcoholMl,
        alcoholGrams: multiCalcResult.alcoholGrams,
        totalVolume: multiCalcResult.totalVolume,
        oilPercentage: multiCalcResult.totalConcentration,
        alcoholPercentage: multiCalcResult.alcoholPercentage,
        oilDensity: multiCalcResult.oilDensity,
        alcoholDensity: multiCalcResult.alcoholDensity,
      };

      exportFormulaToPdf(activeSelectedPerfumes[0]!, singleCalc, {
        customerName: customerName.trim(),
        batchNumber: batchNumber.trim() || `BATCH-${Date.now().toString().slice(-6)}`,
        notes: formulationNotes.trim() ? `${formulationNotes.trim()} [${formulatorTitle || ''}]` : formulatorTitle,
        price: priceResult.price,
        priceCategory: activeCategory,
        bottleType: priceResult.bottleOption.label,
        currencySymbol,
      });
    } else {
      const oilsData = multiCalcResult.oils.map((o, idx) => ({
        perfume: activeSelectedPerfumes[idx]!,
        allocationPercent: o.allocationPercent,
        oilMl: o.oilMl,
        oilGrams: o.oilGrams,
        category: activeOilCategories[idx] || 'A',
      }));

      exportMultiFormulaToPdf(oilsData, multiCalcResult, {
        highestCategory: activeCategory,
        customerName: customerName.trim(),
        batchNumber: batchNumber.trim() || `BATCH-${Date.now().toString().slice(-6)}`,
        notes: formulationNotes.trim() ? `${formulationNotes.trim()} [${formulatorTitle || ''}]` : formulatorTitle,
        price: priceResult.price,
        bottleType: priceResult.bottleOption.label,
        currencySymbol,
      });
    }
  };

  // Reset to standard defaults
  const handleReset = () => {
    setNumberOfOils(1);
    setOilSlots([
      { perfumeId: perfumes[0]?.id || '', allocationPercent: 100 },
      { perfumeId: perfumes[1]?.id || perfumes[0]?.id || '', allocationPercent: 50 },
      { perfumeId: perfumes[2]?.id || perfumes[0]?.id || '', allocationPercent: 33.33 },
      { perfumeId: perfumes[3]?.id || perfumes[0]?.id || '', allocationPercent: 25 },
    ]);
    setSelectedBottleId('36ml_standard');
    setBottleSize(36);
    setConcentration(30);
    setManualCategoryOverride(null);
    setCustomerName('');
    setBatchNumber('');
    setFormulationNotes('');
    setSavedSuccessMessage('');
  };

  // Helper to filter perfumes per slot query
  const getFilteredPerfumesForSlot = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return perfumes;
    return perfumes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.fragrance?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
              Perfume Mixing & Pricing Calculator
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Compound formulas with 1, 2, 3, or 4 fragrance oils. Instant allocation splitting, exact bottle capacities, and automatic highest-category pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Quick Price Chart Modal Trigger */}
          <button
            id="view-price-chart-btn"
            onClick={() => setIsPriceChartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold border border-emerald-300 shadow-2xs transition-colors"
            title="View complete Kprime Staff Quick Price Matrix"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            Full Price Chart
          </button>

          <button
            id="calc-reset-btn"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 text-xs border border-stone-300 shadow-2xs transition-colors"
            title="Reset calculator values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            id="calc-view-history-btn"
            onClick={onNavigateToHistory}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors"
          >
            Mixing History
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccessMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center justify-between gap-3 text-emerald-950 text-xs shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{savedSuccessMessage}</span>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="underline font-bold text-emerald-800 hover:text-emerald-950"
          >
            View in History →
          </button>
        </div>
      )}

      {/* REQUIRED SALES MAN SELECTION SECTION */}
      <div
        className={`rounded-2xl bg-white border p-4 shadow-xs transition-all ${
          salesManError
            ? 'border-red-400 bg-red-50/30 ring-2 ring-red-300'
            : 'border-stone-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Sales Man <span className="text-red-500 font-bold">*</span>
              <span className="text-[11px] font-normal text-stone-500 lowercase">
                (required to save mix & track daily reports)
              </span>
            </label>
            {salesManError && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{salesManError}</span>
              </div>
            )}
          </div>

          {onNavigateToSalesTeam && (
            <button
              type="button"
              onClick={onNavigateToSalesTeam}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 self-start sm:self-auto"
            >
              <Users className="w-3 h-3" />
              Manage Sales Team
            </button>
          )}
        </div>

        {/* Searchable Combobox */}
        <div className="mt-3 relative" ref={salesManDropdownRef}>
          {(() => {
            const activeSalesMan = salesmen.find((s) => s.id === selectedSalesManId);
            const filteredSalesMen = salesmen.filter((s) => {
              const q = salesManSearchQuery.toLowerCase().trim();
              if (!q) return true;
              return (
                s.name.toLowerCase().includes(q) ||
                (s.code && s.code.toLowerCase().includes(q)) ||
                (s.phone && s.phone.toLowerCase().includes(q))
              );
            });

            return (
              <>
                <button
                  type="button"
                  id="calc-salesman-select-btn"
                  onClick={() => {
                    setIsSalesManDropdownOpen(!isSalesManDropdownOpen);
                    setSalesManError('');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
                    selectedSalesManId
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400/30'
                      : 'bg-stone-50 border-stone-300 text-stone-600 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {activeSalesMan ? activeSalesMan.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-left truncate">
                      {activeSalesMan ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-950">{activeSalesMan.name}</span>
                          {activeSalesMan.code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                              {activeSalesMan.code}
                            </span>
                          )}
                          {!activeSalesMan.isActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                              (Inactive)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 font-normal">-- Select Sales Man who formulated this mix --</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${isSalesManDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isSalesManDropdownOpen && (
                  <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-stone-300 shadow-xl overflow-hidden animate-fade-in max-h-64 flex flex-col">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-stone-200 bg-stone-50 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search Sales Man by name or code..."
                        value={salesManSearchQuery}
                        onChange={(e) => setSalesManSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none"
                      />
                      {salesManSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSalesManSearchQuery('')}
                          className="text-[10px] text-stone-400 hover:text-stone-700 px-1 font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Sales Men List */}
                    <div className="overflow-y-auto divide-y divide-stone-100 flex-1">
                      {filteredSalesMen.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-500">
                          {salesmen.length === 0 ? (
                            <div className="space-y-2">
                              <p>No Sales Men configured yet.</p>
                              {onNavigateToSalesTeam && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSalesManDropdownOpen(false);
                                    onNavigateToSalesTeam();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add First Sales Man
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>No Sales Man matches &ldquo;{salesManSearchQuery}&rdquo;</p>
                          )}
                        </div>
                      ) : (
                        filteredSalesMen.map((s) => {
                          const isSelected = selectedSalesManId === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedSalesManId(s.id);
                                setIsSalesManDropdownOpen(false);
                                setSalesManError('');
                              }}
                              className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-emerald-50 ${
                                isSelected ? 'bg-emerald-50 font-bold text-emerald-950' : 'text-stone-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'
                                }`}>
                                  {s.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{s.name}</span>
                                    {s.code && (
                                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-stone-100 text-stone-600">
                                        {s.code}
                                      </span>
                                    )}
                                  </div>
                                  {s.phone && (
                                    <div className="text-[10px] text-stone-400">{s.phone}</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {s.isActive ? (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-medium">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                                    Inactive
                                  </span>
                                )}
                                {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* NUMBER OF OILS SELECTOR (1, 2, 3, 4 Oils) */}
      <div className="rounded-2xl bg-white border border-stone-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-700 font-medium">
          <Layers className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span className="font-bold text-stone-900">Number of Oils:</span>
          <span className="text-stone-500">Choose how many oils to blend in the formula</span>
        </div>

        {/* 1 Oil | 2 Oils | 3 Oils | 4 Oils Selector */}
        <div className="grid grid-cols-4 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 w-full sm:w-auto">
          {([1, 2, 3, 4] as NumberOfOilsCount[]).map((count) => {
            const isActive = numberOfOils === count;
            return (
              <button
                key={count}
                type="button"
                id={`mode-${count}-oil-btn`}
                onClick={() => handleSelectNumberOfOils(count)}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {count === 1 ? <Droplet className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{count} Oil{count > 1 ? 's' : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Formulator Grid: Left Controls, Right Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Inputs & Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. BOTTLE SIZE & TOTAL OIL CONCENTRATION */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-emerald-700" />
                1. Bottle Size & Total Oil Concentration
              </label>
              <button
                onClick={() => setIsPriceChartOpen(true)}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                Price Matrix
              </button>
            </div>

            {/* 8 Official Bottle Buttons from Kprime Catalog */}
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-2">
                Official Bottle Catalog Models:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BOTTLE_OPTIONS.map((bottle) => {
                  const isActive = selectedBottleId === bottle.id;
                  const currentPrice = calculateSellingPrice(bottle.id, activeCategory, concentration).price;

                  return (
                    <button
                      key={bottle.id}
                      type="button"
                      onClick={() => handleSelectBottleOption(bottle)}
                      className={`p-2.5 rounded-xl text-left transition-all border ${
                        isActive
                          ? 'bg-emerald-100/70 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'bg-stone-50 border-stone-200 hover:border-emerald-300 text-stone-800 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono">{bottle.volumeMl} ml</span>
                        <span className="text-[10px] font-bold text-emerald-950 bg-white px-1.5 py-0.2 rounded border border-stone-200">
                          {currentPrice} {currencySymbol}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-stone-600 mt-1 truncate">
                        {bottle.finish}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom volume input if needed */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-stone-600 font-medium">Bottle Volume:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="500"
                  step="0.1"
                  value={bottleSize}
                  onChange={(e) => handleCustomBottleSize(Number(e.target.value))}
                  className="w-24 py-1 px-2 rounded-lg bg-stone-50 border border-stone-300 text-right font-mono font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="font-bold text-stone-700">ml</span>
              </div>
            </div>

            {/* Total Oil Concentration Input (%) */}
            <div className="pt-3 border-t border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="oil-concentration-input"
                  className="text-xs font-bold text-stone-800 flex items-center gap-1.5"
                >
                  <Percent className="w-3.5 h-3.5 text-emerald-700" />
                  Total Oil Concentration (% in bottle)
                </label>
                <span className="text-[11px] text-stone-500 font-medium font-mono">
                  {multiCalcResult.totalOilMl.toFixed(2)} ml oil ({multiCalcResult.alcoholMl.toFixed(2)} ml alcohol)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="relative">
                  <input
                    id="oil-concentration-input"
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    value={concentration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setConcentration(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                    }}
                    className="w-full py-2 pl-3 pr-8 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-mono text-base font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                    %
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-stone-500 font-medium mb-1">
                    <span>Tuning Slider:</span>
                    <span className="font-mono font-bold text-emerald-900">{concentration}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="1"
                    value={concentration}
                    onChange={(e) => setConcentration(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-200 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Concentration Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {CONCENTRATION_TIERS.map((tier) => {
                  const isActive = concentration === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setConcentration(tier)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all border ${
                        isActive
                          ? 'bg-emerald-700 border-emerald-700 text-white font-black shadow-xs scale-105'
                          : 'bg-stone-50 border-stone-200 hover:border-emerald-300 text-stone-800 font-bold'
                      }`}
                    >
                      <div className="text-xs font-mono">{tier}%</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. OIL SELECTION & ALLOCATION SECTION (1, 2, 3, or 4 Oils) */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                2. Select Fragrance Oils ({numberOfOils} Oil{numberOfOils > 1 ? 's' : ''})
              </label>

              {/* Quick Allocation Balance Helpers if > 1 oil */}
              {numberOfOils > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSplitEvenly}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 transition-colors"
                    title="Split allocation equally across oils"
                  >
                    <Equal className="w-3 h-3" />
                    Split Evenly
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-[11px] font-bold border border-emerald-300 transition-colors"
                    title="Scale existing allocations to sum to 100%"
                  >
                    <Scale className="w-3 h-3 text-emerald-700" />
                    Auto-Balance (100%)
                  </button>
                </div>
              )}
            </div>

            {/* Allocation Status Indicator Bar (For 2, 3, 4 Oils) */}
            {numberOfOils > 1 && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  isAllocationValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isAllocationValid ? (
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className="font-semibold">
                    {isAllocationValid
                      ? `Allocations sum to 100.0% of total oil (${multiCalcResult.totalOilMl.toFixed(2)} ml)`
                      : `Oil allocations total ${allocationSum}% (must equal exactly 100%)`}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                  {allocationSum}% / 100%
                </span>
              </div>
            )}

            {/* DYNAMIC OIL CARDS (1 to 4) */}
            <div className="space-y-4">
              {Array.from({ length: numberOfOils }).map((_, index) => {
                const selectedPerfume = activeSelectedPerfumes[index];
                const currentAllocation = oilSlots[index]?.allocationPercent ?? 100;
                const autoCategory = activeOilCategories[index] || 'A';
                const calculatedOil = multiCalcResult.oils[index];
                const isDropdownOpen = openDropdownIndex === index;
                const query = searchQueries[index] || '';
                const filteredPerfumes = getFilteredPerfumesForSlot(query);

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3.5"
                  >
                    {/* Header: Oil Index, Category badge & Computed Volume */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                          Oil {index + 1} Fragrance
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-mono font-black px-2 py-0.5 rounded border shadow-2xs ${
                            autoCategory === 'D'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : autoCategory === 'C'
                              ? 'bg-orange-100 text-orange-900 border-orange-300'
                              : autoCategory === 'B'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          }`}
                        >
                          Category {autoCategory}
                        </span>
                      </div>
                    </div>

                    {/* Searchable Combobox for this Oil */}
                    <div
                      className="relative"
                      ref={(el) => {
                        dropdownContainersRef.current[index] = el;
                      }}
                    >
                      <button
                        type="button"
                        id={`perfume-combobox-trigger-${index + 1}`}
                        onClick={() => setOpenDropdownIndex(isDropdownOpen ? null : index)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-stone-300 hover:border-emerald-600 text-left transition-colors focus:outline-none focus:border-emerald-600 shadow-2xs"
                      >
                        {selectedPerfume ? (
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold">
                              {selectedPerfume.code}
                            </span>
                            <span className="font-bold text-stone-900 text-sm truncate">
                              {selectedPerfume.name}
                            </span>
                            {selectedPerfume.brand && (
                              <span className="text-xs text-stone-500 hidden sm:inline">
                                • {selectedPerfume.brand}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">Select fragrance oil...</span>
                        )}
                        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-stone-300 rounded-xl shadow-xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
                          <div className="p-2 border-b border-stone-200 bg-stone-50">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                              <input
                                type="text"
                                placeholder={`Search ${perfumes.length} perfumes (e.g. A006, Sauvage, Oud)...`}
                                value={query}
                                onChange={(e) =>
                                  setSearchQueries((prev) => {
                                    const next = [...prev];
                                    next[index] = e.target.value;
                                    return next;
                                  })
                                }
                                autoFocus
                                className="w-full py-1.5 pl-8 pr-3 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto divide-y divide-stone-100 flex-1">
                            {filteredPerfumes.length === 0 ? (
                              <div className="p-4 text-center text-xs text-stone-500">
                                No matching fragrances found.
                              </div>
                            ) : (
                              filteredPerfumes.map((p) => {
                                const isSelected = selectedPerfume?.id === p.id;
                                const pCat = detectCategoryFromCode(p.code);
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectPerfumeForSlot(index, p.id)}
                                    className={`w-full p-2.5 text-left flex items-center justify-between text-xs hover:bg-emerald-50 transition-colors ${
                                      isSelected ? 'bg-emerald-50 font-bold text-emerald-950' : 'text-stone-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-800 font-bold">
                                        {p.code}
                                      </span>
                                      <span className="truncate">{p.name}</span>
                                      {p.brand && (
                                        <span className="text-[10px] text-stone-400 truncate">
                                          ({p.brand})
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                      <span className="font-mono text-[10px] font-bold text-emerald-900 bg-emerald-100/80 px-1 py-0.2 rounded">
                                        Cat {pCat}
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Perfume notes / fragrance summary */}
                    {selectedPerfume?.notes && (
                      <div className="text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-stone-200/80">
                        <span className="font-semibold text-stone-700">Notes:</span> {selectedPerfume.notes}
                      </div>
                    )}

                    {/* Allocation Slider & Direct Decimal Input (When > 1 oil) */}
                    {numberOfOils > 1 && (
                      <div className="space-y-2 pt-1 border-t border-stone-200">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-stone-700 flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                            Oil {index + 1} Allocation (% of total oil):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentAllocation}
                              onChange={(e) => handleUpdateAllocation(index, parseFloat(e.target.value))}
                              className="w-16 py-1 px-1.5 rounded-lg bg-white border border-stone-300 text-right font-mono font-bold text-emerald-950 text-xs focus:outline-none focus:border-emerald-600"
                            />
                            <span className="font-bold text-stone-600 text-xs">%</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={currentAllocation}
                          onChange={(e) => handleUpdateAllocation(index, parseFloat(e.target.value))}
                          className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                        />

                        {/* Direct Volume & Mass for this oil */}
                        {calculatedOil && (
                          <div className="flex items-center justify-between text-[11px] font-mono text-stone-600 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                            <span>
                              Oil Volume: <b className="text-emerald-900">{calculatedOil.oilMl.toFixed(2)} ml</b>
                            </span>
                            <span>
                              Weigh Mass: <b className="text-emerald-950 font-bold">{calculatedOil.oilGrams.toFixed(2)} g</b>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Batch & Customer Tracking */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-stone-400" />
              Client & Compounding Notes (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Customer / Order Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Batch Ref (e.g. BATCH-2408)"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Special compounding notes (e.g. maceration time, pipette tips)"
                value={formulationNotes}
                onChange={(e) => setFormulationNotes(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Calculation Results, Highest Category Rule & Dispensing Protocol */}
        <div className="lg:col-span-6 space-y-5">
          {/* SELLING PRICE & HIGHEST CATEGORY EVALUATION CARD */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-950 text-white p-6 shadow-xl border border-emerald-900/60 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Kprime Selling Price Matrix
                </div>
                <div className="text-3xl sm:text-4xl font-serif-luxury font-black text-emerald-400 mt-1 flex items-baseline gap-2">
                  <span>{priceResult.price}</span>
                  <span className="text-base font-normal text-stone-300">{currencySymbol}</span>
                </div>
              </div>

              {/* Price Category Badge */}
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                  Pricing Tier
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-sm shadow-2xs">
                  Category {activeCategory}
                </div>
              </div>
            </div>

            {/* HIGHEST CATEGORY EXPLANATION BOX */}
            <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Formula Pricing Category Rule:
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  {priceResult.bottleOption.label} • {concentration}% Oil
                </span>
              </div>

              {numberOfOils > 1 ? (
                <div className="space-y-1.5 pt-1 border-t border-stone-700">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-stone-400">Oils in Blend:</span>
                    {activeOilCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="font-mono px-1.5 py-0.2 rounded bg-stone-700 text-stone-200 font-bold"
                      >
                        Oil {idx + 1}: Cat {cat}
                      </span>
                    ))}
                    <span className="text-emerald-400 font-bold">
                      → Price based on Highest Tier: Category {activeCategory}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    Kprime pricing rule determines the retail price by the most premium (highest rank) oil in the bottle (A &lt; B &lt; C &lt; D).
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-stone-400">
                  Single oil formula priced directly based on fragrance code prefix ({activeSelectedPerfumes[0]?.code || 'Code'}).
                </div>
              )}
            </div>

            {/* Manual Override Category selector (if formulator wishes to adjust) */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Manual Tier Override:</span>
              <div className="flex items-center gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setManualCategoryOverride(manualCategoryOverride === cat ? null : cat)
                    }
                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-colors ${
                      activeCategory === cat && manualCategoryOverride === cat
                        ? 'bg-emerald-500 text-stone-950 ring-2 ring-emerald-300'
                        : activeCategory === cat
                        ? 'bg-emerald-700/50 text-emerald-200 border border-emerald-500/50'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {manualCategoryOverride && (
                  <button
                    type="button"
                    onClick={() => setManualCategoryOverride(null)}
                    className="text-[10px] text-stone-400 hover:text-stone-200 underline ml-1"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LAB DISPENSING PROTOCOL (Sequential Steps) */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Scale className="w-4 h-4" />
                </span>
                <h3 className="font-serif-luxury font-bold text-base text-stone-900">
                  Sequential Lab Dispensing Protocol
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-stone-500">
                Density: {settings.oilDensity} g/ml
              </span>
            </div>

            {/* Dynamic Sequential Step Cards for Oils */}
            <div className="space-y-3">
              <div className={`grid grid-cols-1 ${numberOfOils > 1 ? 'sm:grid-cols-2' : ''} gap-3`}>
                {multiCalcResult.oils.map((item, idx) => {
                  const perf = activeSelectedPerfumes[idx];
                  const stepBg =
                    idx === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : idx === 1
                      ? 'bg-teal-50 border-teal-200 text-teal-950'
                      : idx === 2
                      ? 'bg-stone-50 border-stone-200 text-stone-900'
                      : 'bg-emerald-100/50 border-emerald-300 text-emerald-950';

                  const badgeBg =
                    idx === 0
                      ? 'bg-emerald-700'
                      : idx === 1
                      ? 'bg-teal-700'
                      : idx === 2
                      ? 'bg-stone-700'
                      : 'bg-emerald-800';

                  return (
                    <div key={idx} className={`rounded-2xl border p-4 space-y-2 ${stepBg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                          <span
                            className={`w-4 h-4 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 ${badgeBg}`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">
                            Oil {idx + 1}: {perf?.name || `Fragrance ${idx + 1}`}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded border border-stone-200">
                          {item.allocationPercent}%
                        </span>
                      </div>

                      <div className="text-2xl font-black font-mono">
                        {formatGrams(item.oilGrams)}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Step {idx + 1} Target Mass (Weigh)
                      </div>

                      <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-xs font-mono">
                        <span className="opacity-70">Volume:</span>
                        <span className="font-bold">{formatMl(item.oilMl)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final Step: Perfumers Alcohol */}
              <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-950">
                    <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {numberOfOils + 1}
                    </span>
                    Step {numberOfOils + 1}: Perfumers Alcohol (Ethanol 96%)
                  </div>
                  <div className="text-xs text-teal-900 mt-0.5">
                    Top up bottle to target volume ({multiCalcResult.alcoholPercentage}% of bottle)
                  </div>
                </div>

                <div className="flex items-baseline gap-4 font-mono">
                  <div className="text-right">
                    <span className="text-2xl font-black text-teal-950">
                      {formatGrams(multiCalcResult.alcoholGrams)}
                    </span>
                    <span className="text-xs text-teal-800 ml-1">target mass</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    ({formatMl(multiCalcResult.alcoholMl)})
                  </div>
                </div>
              </div>
            </div>

            {/* Total Batch Summary */}
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Total Compounded Volume:</span>
                <span className="font-mono text-emerald-950 text-sm">
                  {multiCalcResult.totalVolume} ml ({multiCalcResult.totalOilMl.toFixed(2)} ml oil + {multiCalcResult.alcoholMl.toFixed(2)} ml alcohol)
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600 font-mono font-medium">
                <span>Combined Batch Net Weight:</span>
                <span className="font-bold text-stone-900">
                  {(multiCalcResult.totalOilGrams + multiCalcResult.alcoholGrams).toFixed(2)} g Total
                </span>
              </div>
            </div>

            {/* Transparent Math Breakdown */}
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2 text-[11px] font-mono text-stone-600">
              <div className="text-stone-800 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700" />
                Transparent Formula Derivation
              </div>
              <div className="space-y-1 pl-1">
                <div>
                  • Total Oil Volume = {bottleSize} ml × ({concentration}% ÷ 100) ={' '}
                  <span className="text-stone-900 font-bold">{multiCalcResult.totalOilMl.toFixed(2)} ml</span>
                </div>
                {multiCalcResult.oils.map((o, idx) => (
                  <div key={idx}>
                    • Oil {idx + 1} ({activeSelectedPerfumes[idx]?.name || `Oil ${idx + 1}`}) = {multiCalcResult.totalOilMl.toFixed(2)} ml × ({o.allocationPercent}% ÷ 100) ={' '}
                    <span className="text-emerald-800 font-bold">{o.oilMl.toFixed(2)} ml</span> ({o.oilGrams.toFixed(2)} g)
                  </div>
                ))}
                <div>
                  • Alcohol Volume = {bottleSize} ml − {multiCalcResult.totalOilMl.toFixed(2)} ml ={' '}
                  <span className="text-teal-900 font-bold">{multiCalcResult.alcoholMl.toFixed(2)} ml</span> ({multiCalcResult.alcoholGrams.toFixed(2)} g)
                </div>
              </div>
            </div>

            {/* Actions: Save to History & Print PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                id="save-formula-btn"
                onClick={handleSaveFormula}
                disabled={!isAllocationValid}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="w-4 h-4" />
                Save Formula
              </button>

              <button
                id="print-formula-pdf-btn"
                onClick={handleExportPdf}
                disabled={!isAllocationValid}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm border border-stone-300 shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                Print PDF Sheet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Price Chart Modal */}
      <PriceChartModal
        isOpen={isPriceChartOpen}
        onClose={() => setIsPriceChartOpen(false)}
        currentCategory={activeCategory}
        currentBottleId={selectedBottleId}
        currentConcentration={concentration}
        currencySymbol={currencySymbol}
        onSelectOption={(bId, cat, conc) => {
          setSelectedBottleId(bId);
          const bOpt = BOTTLE_OPTIONS.find((b) => b.id === bId);
          if (bOpt) setBottleSize(bOpt.volumeMl);
          setManualCategoryOverride(cat);
          setConcentration(conc);
        }}
      />
    </div>
  );
};
