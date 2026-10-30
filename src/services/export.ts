import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Perfume,
  MixingFormula,
  CalculationResult,
  DualOilCalculationResult,
  MultiOilCalculationResult,
  AppSettings,
} from '../types';

/**
 * Export perfume catalog to CSV
 */
export function exportPerfumesToCsv(perfumes: Perfume[]): void {
  const headers = ['Code', 'Name', 'Brand', 'Fragrance / Family', 'Category', 'Notes', 'Description'];
  const rows = perfumes.map(p => [
    `"${(p.code || '').replace(/"/g, '""')}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.brand || '').replace(/"/g, '""')}"`,
    `"${(p.fragrance || '').replace(/"/g, '""')}"`,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `kprime-perfume-database-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Mixing History to CSV
 */
export function exportHistoryToCsv(history: MixingFormula[]): void {
  const headers = [
    'Date',
    'Time',
    'Sales Man',
    'Number of Oils',
    'Formula Summary',
    'Oil 1 (Code - Name - % - ml - g - Cat)',
    'Oil 2 (Code - Name - % - ml - g - Cat)',
    'Oil 3 (Code - Name - % - ml - g - Cat)',
    'Oil 4 (Code - Name - % - ml - g - Cat)',
    'Highest Category',
    'Bottle Size (ml)',
    'Bottle Finish',
    'Total Oil Concentration (%)',
    'Kprime Selling Price',
    'Total Oil (ml)',
    'Total Oil (g)',
    'Alcohol (ml)',
    'Alcohol (g)',
    'Total Volume (ml)',
    'Oil Density (g/ml)',
    'Alcohol Density (g/ml)',
    'Customer / Batch',
  ];

  const rows = history.map(h => {
    const d = new Date(h.createdAt);
    const numOils = h.numberOfOils || (h.oils ? h.oils.length : (h.mode === 'dual' ? 2 : 1));
    const oilsList = h.oils && h.oils.length > 0
      ? h.oils
      : [
          h.oil1 || {
            perfumeId: h.perfumeId,
            perfumeCode: h.perfumeCode,
            perfumeName: h.perfumeName,
            category: h.priceCategory,
            allocationPercent: 100,
            oilMl: h.oilMl,
            oilGrams: h.oilGrams,
          },
          ...(h.oil2 ? [h.oil2] : []),
          ...(h.oil3 ? [h.oil3] : []),
          ...(h.oil4 ? [h.oil4] : []),
        ];

    const getOilStr = (idx: number) => {
      const o = oilsList[idx];
      if (!o) return '-';
      return `${o.perfumeCode} ${o.perfumeName} (${o.allocationPercent}% - ${o.oilMl.toFixed(2)}ml - ${o.oilGrams.toFixed(2)}g - Cat ${o.category || 'A'})`;
    };

    const perfumeSummary = numOils > 1
      ? `${numOils} Oils Blend: ${oilsList.map(o => `${o.perfumeName} (${o.allocationPercent}%)`).join(' + ')}`
      : `${h.perfumeCode} - ${h.perfumeName}`;

    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      `"${(h.salesManName || 'Unknown / Not Assigned').replace(/"/g, '""')}"`,
      `${numOils} Oil${numOils > 1 ? 's' : ''}`,
      `"${perfumeSummary.replace(/"/g, '""')}"`,
      `"${getOilStr(0).replace(/"/g, '""')}"`,
      `"${getOilStr(1).replace(/"/g, '""')}"`,
      `"${getOilStr(2).replace(/"/g, '""')}"`,
      `"${getOilStr(3).replace(/"/g, '""')}"`,
      `"${h.highestCategory || h.priceCategory || '-'}"`,
      h.bottleSize,
      `"${h.bottleType || '-'}"`,
      `${h.concentration}%`,
      h.price !== undefined ? `${h.price}` : '-',
      h.oilMl.toFixed(2),
      h.oilGrams.toFixed(2),
      h.alcoholMl.toFixed(2),
      h.alcoholGrams.toFixed(2),
      h.totalVolume.toFixed(2),
      h.oilDensity,
      h.alcoholDensity,
      `"${(h.customerName || h.batchNumber || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `kprime-mixing-history-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Generate a PDF Formulation Compounding Sheet for a Single Oil formula
 */
export function exportFormulaToPdf(
  perfume: Perfume,
  calc: CalculationResult,
  extra?: {
    customerName?: string;
    batchNumber?: string;
    notes?: string;
    price?: number;
    priceCategory?: string;
    bottleType?: string;
    currencySymbol?: string;
  }
): void {
  const doc = new jsPDF();

  // Header Royal Green Styling
  doc.setFillColor(6, 44, 34); // Deep Royal Emerald Green
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(52, 211, 153); // Emerald Mint
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KPRIME COMPOUNDING FORMULA SHEET', 14, 18);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Kprime Single Oil Mixing Formula | Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);

  // Perfume Overview Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Target Fragrance Specification', 14, 50);

  const currency = extra?.currencySymbol || 'DH';
  const priceDisplay = extra?.price !== undefined ? `${extra.price} ${currency} (Cat ${extra.priceCategory || 'A'})` : 'N/A';

  autoTable(doc, {
    startY: 54,
    head: [['Attribute', 'Details']],
    body: [
      ['Perfume Code', perfume.code],
      ['Perfume Name', perfume.name],
      ['Price Category (from code)', `Category ${extra?.priceCategory || perfume.code?.charAt(0)?.toUpperCase() || 'A'}`],
      ['Kprime Selling Price', priceDisplay],
      ['Brand / House', perfume.brand || 'Kprime Collection'],
      ['Fragrance Family', perfume.fragrance || 'General'],
      ['Category', perfume.category || 'Unisex'],
      ['Olfactory Notes', perfume.notes || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // Mixing Quantities Section
  const tableEndPos = (doc as any).lastAutoTable?.finalY || 100;
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Exact Mixing Quantities & Lab Weighing', 14, tableEndPos + 12);

  autoTable(doc, {
    startY: tableEndPos + 16,
    head: [['Component', 'Ratio / %', 'Volume (ml)', 'Density (g/ml)', 'Target Mass (Grams)']],
    body: [
      [
        'Perfume Oil Concentrated Essences',
        `${calc.oilPercentage.toFixed(1)}%`,
        `${calc.oilMl.toFixed(2)} ml`,
        `${calc.oilDensity.toFixed(3)} g/ml`,
        `${calc.oilGrams.toFixed(2)} g (WEIGH FIRST)`,
      ],
      [
        'Perfumers Alcohol (Ethanol)',
        `${calc.alcoholPercentage.toFixed(1)}%`,
        `${calc.alcoholMl.toFixed(2)} ml`,
        `${calc.alcoholDensity.toFixed(3)} g/ml`,
        `${calc.alcoholGrams.toFixed(2)} g (TOP UP)`,
      ],
      [
        'TOTAL BOTTLE BATCH',
        '100.0%',
        `${calc.totalVolume.toFixed(2)} ml`,
        '-',
        `${(calc.oilGrams + calc.alcoholGrams).toFixed(2)} g Total Weight`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [236, 253, 245] },
  });

  // Batch Metadata
  const table2EndPos = (doc as any).lastAutoTable?.finalY || 170;

  autoTable(doc, {
    startY: table2EndPos + 10,
    head: [['Field', 'Value']],
    body: [
      ['Bottle Target Volume', `${calc.bottleSize} ml ${extra?.bottleType ? `(${extra.bottleType})` : ''}`],
      ['Oil Concentration Target', `${calc.concentration}%`],
      ['Kprime Selling Price', priceDisplay],
      ['Batch / Reference No.', extra?.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`],
      ['Customer / Order Name', extra?.customerName || 'Kprime Atelier Compounding'],
      ['Compounding Notes', extra?.notes || 'Stir gently, let macerate in amber vial.'],
    ],
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
  });

  // Footer Sign-off
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, finalY + 15, 90, finalY + 15);
  doc.line(120, finalY + 15, 196, finalY + 15);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Formulator / Perfumer Signature', 14, finalY + 20);
  doc.text('Quality Control & Verification Date', 120, finalY + 20);

  doc.save(`Kprime-Formula-${perfume.code.replace(/[^a-zA-Z0-9]/g, '_')}-${calc.bottleSize}ml-${calc.concentration}pct.pdf`);
}

/**
 * Generate a PDF Formulation Compounding Sheet for a Multi-Oil Blend (1, 2, 3, or 4 Oils)
 */
export function exportMultiFormulaToPdf(
  oilsData: {
    perfume: Perfume;
    allocationPercent: number;
    oilMl: number;
    oilGrams: number;
    category: string;
  }[],
  calc: MultiOilCalculationResult,
  extra?: {
    highestCategory?: string;
    customerName?: string;
    batchNumber?: string;
    notes?: string;
    price?: number;
    bottleType?: string;
    currencySymbol?: string;
  }
): void {
  const doc = new jsPDF();
  const numOils = oilsData.length;

  // Header Royal Green Styling
  doc.setFillColor(6, 44, 34); // Deep Royal Emerald Green
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(52, 211, 153); // Emerald Mint
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`KPRIME — MIX ${numOils} OIL${numOils > 1 ? 'S' : ''} FORMULATION SHEET`, 14, 18);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Official Kprime ${numOils}-Oil Compounding Protocol | Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    14,
    28
  );

  // 1. Selected Perfume Oils Table
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Selected Perfume Oils & Pricing Category Breakdown', 14, 48);

  const currency = extra?.currencySymbol || 'DH';
  const highestCat = extra?.highestCategory || 'A';
  const priceDisplay =
    extra?.price !== undefined
      ? `${extra.price} ${currency} (Based on Highest Category ${highestCat})`
      : 'N/A';

  const oilsBody = oilsData.map((item, idx) => [
    `Oil ${idx + 1}`,
    item.perfume.code || '-',
    item.perfume.name,
    `Category ${item.category || 'A'}`,
    `${item.allocationPercent}% of oil`,
    `${item.oilMl.toFixed(2)} ml`,
    `${item.oilGrams.toFixed(2)} g`,
  ]);

  oilsBody.push([
    'TOTAL OIL',
    'COMBINED',
    `${numOils}-Oil Harmony Blend`,
    `Highest: Cat ${highestCat}`,
    `100% (${calc.totalConcentration}% in bottle)`,
    `${calc.totalOilMl.toFixed(2)} ml`,
    `${calc.totalOilGrams.toFixed(2)} g`,
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Role', 'Code', 'Perfume Name', 'Category', 'Allocation %', 'Volume (ml)', 'Mass (Grams)']],
    body: oilsBody,
    theme: 'grid',
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.8 },
  });

  // 2. Sequential Lab Dispensing Protocol Table
  const tableEndPos = (doc as any).lastAutoTable?.finalY || 105;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Sequential Lab Dispensing Protocol', 14, tableEndPos + 9);

  const dispensingSteps = oilsData.map((item, idx) => [
    `Step ${idx + 1}`,
    `Oil ${idx + 1}: ${item.perfume.name} (${item.perfume.code})`,
    `${item.allocationPercent}% of oil`,
    `${item.oilMl.toFixed(2)} ml`,
    `${calc.oilDensity.toFixed(3)} g/ml`,
    `${item.oilGrams.toFixed(2)} g (WEIGH STEP ${idx + 1})`,
  ]);

  dispensingSteps.push([
    `Step ${numOils + 1}`,
    'Perfumers Alcohol (Ethanol 96%)',
    `${calc.alcoholPercentage.toFixed(1)}% of bottle`,
    `${calc.alcoholMl.toFixed(2)} ml`,
    `${calc.alcoholDensity.toFixed(3)} g/ml`,
    `${calc.alcoholGrams.toFixed(2)} g (TOP UP TO FINAL)`,
  ]);

  dispensingSteps.push([
    'Final Batch',
    'COMPLETED FORMULA BATCH',
    '100.0%',
    `${calc.totalVolume.toFixed(2)} ml`,
    '-',
    `${(calc.totalOilGrams + calc.alcoholGrams).toFixed(2)} g Total Weight`,
  ]);

  autoTable(doc, {
    startY: tableEndPos + 13,
    head: [['Dispensing Step', 'Component', 'Ratio / %', 'Volume (ml)', 'Density', 'Target Mass to Weigh']],
    body: dispensingSteps,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.8 },
    alternateRowStyles: { fillColor: [236, 253, 245] },
  });

  // 3. Batch Metadata
  const table2EndPos = (doc as any).lastAutoTable?.finalY || 175;

  const oilCatBreakdown = oilsData.map((o, idx) => `Oil ${idx + 1}: Cat ${o.category}`).join(', ');

  autoTable(doc, {
    startY: table2EndPos + 8,
    head: [['Field', 'Specification & Notes']],
    body: [
      ['Bottle Size & Finish', `${calc.bottleSize} ml ${extra?.bottleType ? `(${extra.bottleType})` : ''}`],
      ['Total Oil Concentration', `${calc.totalConcentration}% in bottle volume (${calc.totalOilMl.toFixed(2)} ml total oil)`],
      ['Highest Category Rule', `Highest Category: Cat ${highestCat} (${oilCatBreakdown})`],
      ['Kprime Selling Price', priceDisplay],
      ['Batch / Reference No.', extra?.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`],
      ['Customer / Order Name', extra?.customerName || `Custom ${numOils}-Oil Blend`],
      ['Compounding Notes', extra?.notes || 'Invert gently 5 times to homogenize before sealing.'],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.8 },
  });

  // Footer Sign-off
  const finalY = (doc as any).lastAutoTable?.finalY || 245;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, finalY + 10, 90, finalY + 10);
  doc.line(120, finalY + 10, 196, finalY + 10);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Formulator / Perfumer Signature', 14, finalY + 15);
  doc.text('Quality Control & Verification Date', 120, finalY + 15);

  const codesStr = oilsData.map(o => o.perfume.code.replace(/[^a-zA-Z0-9]/g, '')).join('_');
  doc.save(`Kprime-Formula-${numOils}Oils-${codesStr}-${calc.bottleSize}ml-${calc.totalConcentration}pct.pdf`);
}

/**
 * Backward-compatible helper for 2 Oils
 */
export function exportDualFormulaToPdf(
  oil1Perfume: Perfume,
  oil2Perfume: Perfume,
  calc: DualOilCalculationResult,
  extra?: {
    oil1Category?: string;
    oil2Category?: string;
    highestCategory?: string;
    customerName?: string;
    batchNumber?: string;
    notes?: string;
    price?: number;
    bottleType?: string;
    currencySymbol?: string;
  }
): void {
  const multiCalc: MultiOilCalculationResult = {
    bottleSize: calc.bottleSize,
    totalConcentration: calc.totalConcentration,
    totalOilMl: calc.totalOilMl,
    totalOilGrams: calc.totalOilGrams,
    alcoholMl: calc.alcoholMl,
    alcoholGrams: calc.alcoholGrams,
    totalVolume: calc.totalVolume,
    alcoholPercentage: calc.alcoholPercentage,
    numberOfOils: 2,
    oils: [
      {
        index: 1,
        perfumeId: oil1Perfume.id,
        perfumeCode: oil1Perfume.code,
        perfumeName: oil1Perfume.name,
        category: extra?.oil1Category as any,
        allocationPercent: calc.oil1.allocationPercent,
        oilMl: calc.oil1.oilMl,
        oilGrams: calc.oil1.oilGrams,
      },
      {
        index: 2,
        perfumeId: oil2Perfume.id,
        perfumeCode: oil2Perfume.code,
        perfumeName: oil2Perfume.name,
        category: extra?.oil2Category as any,
        allocationPercent: calc.oil2.allocationPercent,
        oilMl: calc.oil2.oilMl,
        oilGrams: calc.oil2.oilGrams,
      },
    ],
    oilDensity: calc.oilDensity,
    alcoholDensity: calc.alcoholDensity,
    isValidAllocation: calc.isValidAllocation,
    allocationSum: 100,
  };

  exportMultiFormulaToPdf(
    [
      {
        perfume: oil1Perfume,
        allocationPercent: calc.oil1.allocationPercent,
        oilMl: calc.oil1.oilMl,
        oilGrams: calc.oil1.oilGrams,
        category: extra?.oil1Category || 'A',
      },
      {
        perfume: oil2Perfume,
        allocationPercent: calc.oil2.allocationPercent,
        oilMl: calc.oil2.oilMl,
        oilGrams: calc.oil2.oilGrams,
        category: extra?.oil2Category || 'A',
      },
    ],
    multiCalc,
    extra
  );
}

/**
 * Generate a luxury Sample Perfume Catalog PDF for testing PDF imports
 */
export function generateSamplePerfumePdf(): void {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(6, 44, 34);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KPRIME MASTER PERFUME CATALOG', 14, 18);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Kprime Fragrance & Category Database (Sample PDF for Import)', 14, 27);

  const sampleRows = [
    ['B014', 'Sauvage Elixir', 'Aromatic Fougere', 'Men', 'Bergamot, Nutmeg, Cardamom, Lavender, Amber, Licorice', 'Dior'],
    ['B002', 'Baccarat Rouge 540', 'Amber Floral', 'Unisex', 'Jasmine, Saffron, Amberwood, Ambergris, Fir Resin, Cedar', 'MFK'],
    ['A001', 'Aventus Royal', 'Chypre Fruity', 'Men', 'Pineapple, Bergamot, Black Currant, Birch, Patchouli, Oakmoss', 'Creed'],
    ['C003', 'Tobacco Vanille', 'Amber Spicy', 'Unisex', 'Tobacco Leaf, Spices, Tonka Bean, Vanilla, Cacao, Dried Fruits', 'Tom Ford'],
    ['D001', 'Delina Exclusif', 'Floral Fruity', 'Women', 'Lychee, Pear, Bergamot, Turkish Rose, Oud, Incense, Vanilla', 'Parfums de Marly'],
    ['C005', 'Oud Wood Intense', 'Amber Woody', 'Unisex', 'Agarwood (Oud), Brazilian Rosewood, Cardamom, Sandalwood', 'Tom Ford'],
    ['B008', 'Bleu de Parfum', 'Woody Aromatic', 'Men', 'Grapefruit, Lemon, Mint, Pink Pepper, Ginger, Nutmeg, Cedar', 'Chanel'],
    ['A010', 'Santal 33', 'Woody Aromatic', 'Unisex', 'Cardamom, Iris, Violet, Australian Sandalwood, Papyrus, Leather', 'Le Labo'],
  ];

  autoTable(doc, {
    startY: 44,
    head: [['Perfume Code', 'Perfume Name', 'Fragrance Family', 'Category', 'Olfactory Notes', 'Brand']],
    body: sampleRows,
    theme: 'striped',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  doc.save('kprime_sample_perfume_catalog.pdf');
}

/**
 * Export Sales Man Daily Report to PDF
 */
export function exportSalesManDailyReportPdf(data: {
  salesManName: string;
  selectedDate: string;
  mixes: MixingFormula[];
  summary: {
    totalMixes: number;
    totalBottles: number;
    totalOilMl: number;
    totalOilGrams: number;
    totalAlcoholMl: number;
    totalAlcoholGrams: number;
    totalRevenue: number;
    avgMixValue: number;
    highestCategory: string;
  };
  bottleBreakdown: {
    size: number;
    count: number;
    oilMl: number;
    revenue: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    revenue: number;
  }[];
  currencySymbol?: string;
}): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const currency = data.currencySymbol || 'DH';

  // Royal Emerald Header
  doc.setFillColor(6, 44, 34);
  doc.rect(0, 0, 297, 34, 'F');

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KPRIME PARFUMERIE — SALES MAN DAILY PERFORMANCE REPORT', 14, 15);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sales Man: ${data.salesManName}  |  Report Date: ${data.selectedDate}  |  Generated: ${new Date().toLocaleTimeString()}`, 14, 25);

  // Summary Metrics Table (Top bar)
  autoTable(doc, {
    startY: 38,
    head: [['Total Mixes', 'Total Bottles', 'Total Oil (ml / g)', 'Total Alcohol (ml / g)', 'Total Revenue', 'Avg Value / Mix', 'Peak Category']],
    body: [
      [
        data.summary.totalMixes.toString(),
        data.summary.totalBottles.toString(),
        `${data.summary.totalOilMl.toFixed(2)} ml (${data.summary.totalOilGrams.toFixed(2)} g)`,
        `${data.summary.totalAlcoholMl.toFixed(2)} ml (${data.summary.totalAlcoholGrams.toFixed(2)} g)`,
        `${data.summary.totalRevenue.toLocaleString()} ${currency}`,
        `${data.summary.avgMixValue.toFixed(2)} ${currency}`,
        `Category ${data.summary.highestCategory}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 3, fontStyle: 'bold' },
  });

  const summaryEndPos = (doc as any).lastAutoTable?.finalY || 55;

  // Detailed Mixing List Table
  const tableRows = data.mixes.map((m) => {
    const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const oilsList = m.oils && m.oils.length > 0 ? m.oils : [m.oil1 || {
      perfumeCode: m.perfumeCode,
      perfumeName: m.perfumeName,
      allocationPercent: 100,
      oilMl: m.oilMl,
      oilGrams: m.oilGrams,
      category: m.priceCategory || 'A'
    }];

    const getOilCell = (idx: number) => {
      const o = oilsList[idx];
      if (!o) return '-';
      return `${o.perfumeCode} ${o.perfumeName} (${o.allocationPercent}%)`;
    };

    const numOils = m.numberOfOils || oilsList.length || 1;

    return [
      timeStr,
      `${m.bottleSize} ml`,
      `${m.concentration}%`,
      `${numOils} Oil${numOils > 1 ? 's' : ''}`,
      getOilCell(0),
      getOilCell(1),
      getOilCell(2),
      getOilCell(3),
      `Cat ${m.highestCategory || m.priceCategory || 'A'}`,
      `${m.oilMl.toFixed(2)} ml`,
      `${m.alcoholMl.toFixed(2)} ml`,
      `${m.price || 0} ${currency}`,
    ];
  });

  autoTable(doc, {
    startY: summaryEndPos + 6,
    head: [['Time', 'Bottle', 'Conc.', 'Oils', 'Oil 1', 'Oil 2', 'Oil 3', 'Oil 4', 'Category', 'Oil Qty', 'Alcohol', 'Price']],
    body: tableRows.length > 0 ? tableRows : [['-', 'No mixing records for this date', '', '', '', '', '', '', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  const detailEndPos = (doc as any).lastAutoTable?.finalY || 140;

  // Breakdown by Bottle Size & Categories side-by-side if room, or sequentially
  const bottleRows = data.bottleBreakdown.map((b) => [
    `${b.size} ml`,
    b.count.toString(),
    `${b.oilMl.toFixed(2)} ml`,
    `${b.revenue.toLocaleString()} ${currency}`,
  ]);

  const catRows = data.categoryBreakdown.map((c) => [
    `Category ${c.category}`,
    c.count.toString(),
    `${c.revenue.toLocaleString()} ${currency}`,
  ]);

  autoTable(doc, {
    startY: detailEndPos + 6,
    head: [['Bottle Size', 'Mixes Count', 'Total Oil Used', 'Revenue Generated']],
    body: bottleRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { right: 150 },
  });

  autoTable(doc, {
    startY: detailEndPos + 6,
    head: [['Category', 'Mixes Count', 'Revenue Generated']],
    body: catRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 155 },
  });

  const cleanName = data.salesManName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Kprime_Daily_Report_${cleanName}_${data.selectedDate}.pdf`);
}

/**
 * Export Team Daily Report to PDF
 */
export function exportTeamDailyReportPdf(data: {
  selectedDate: string;
  summary: {
    totalMixes: number;
    totalBottles: number;
    totalOilMl: number;
    totalOilGrams: number;
    totalAlcoholMl: number;
    totalAlcoholGrams: number;
    totalRevenue: number;
    avgMixValue: number;
    activeSalesMenCount: number;
  };
  salesMenPerformance: {
    salesManName: string;
    mixes: number;
    bottles: number;
    oilMl: number;
    alcoholMl: number;
    revenue: number;
    avgMixValue: number;
    sharePercent: number;
  }[];
  comparison?: {
    todayRevenue: number;
    yesterdayRevenue: number;
    revenueDiff: number;
    revenuePct: number;
    todayMixes: number;
    yesterdayMixes: number;
    mixesDiff: number;
    mixesPct: number;
  };
  currencySymbol?: string;
}): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const currency = data.currencySymbol || 'DH';

  // Royal Emerald Header
  doc.setFillColor(6, 44, 34);
  doc.rect(0, 0, 297, 34, 'F');

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KPRIME PARFUMERIE — TEAM DAILY PERFORMANCE & AUDIT REPORT', 14, 15);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Team Performance Date: ${data.selectedDate}  |  Active Staff: ${data.summary.activeSalesMenCount}  |  Generated: ${new Date().toLocaleTimeString()}`, 14, 25);

  // Summary Metrics
  autoTable(doc, {
    startY: 38,
    head: [['Total Team Mixes', 'Total Bottles', 'Total Oil Used', 'Total Alcohol Used', 'Total Team Revenue', 'Avg Value / Mix', 'Active Sales Team']],
    body: [
      [
        data.summary.totalMixes.toString(),
        data.summary.totalBottles.toString(),
        `${data.summary.totalOilMl.toFixed(2)} ml (${data.summary.totalOilGrams.toFixed(2)} g)`,
        `${data.summary.totalAlcoholMl.toFixed(2)} ml (${data.summary.totalAlcoholGrams.toFixed(2)} g)`,
        `${data.summary.totalRevenue.toLocaleString()} ${currency}`,
        `${data.summary.avgMixValue.toFixed(2)} ${currency}`,
        `${data.summary.activeSalesMenCount} Sales Men`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 3, fontStyle: 'bold' },
  });

  const summaryEnd = (doc as any).lastAutoTable?.finalY || 55;

  // Performance by Sales Man Table
  const rows = data.salesMenPerformance.map((s, idx) => [
    `#${idx + 1} ${s.salesManName}`,
    s.mixes.toString(),
    s.bottles.toString(),
    `${s.oilMl.toFixed(2)} ml`,
    `${s.alcoholMl.toFixed(2)} ml`,
    `${s.revenue.toLocaleString()} ${currency}`,
    `${s.avgMixValue.toFixed(2)} ${currency}`,
    `${s.sharePercent.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: summaryEnd + 6,
    head: [['Sales Man', 'Mixes Done', 'Bottles Done', 'Oil Used (ml)', 'Alcohol (ml)', 'Revenue Generated', 'Avg Mix Value', 'Team Share %']],
    body: rows.length > 0 ? rows : [['-', 'No mixing activity for this date', '', '', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  doc.save(`Kprime_Team_Daily_Report_${data.selectedDate}.pdf`);
}

/**
 * Export Sales Man Daily Report to CSV
 */
export function exportSalesManDailyReportCsv(data: {
  salesManName: string;
  selectedDate: string;
  mixes: MixingFormula[];
  currencySymbol?: string;
}): void {
  const headers = [
    'Date',
    'Time',
    'Sales Man',
    'Bottle Size',
    'Total Concentration (%)',
    'Number of Oils',
    'Oil 1',
    'Oil 2',
    'Oil 3',
    'Oil 4',
    'Highest Category',
    'Oil Volume (ml)',
    'Oil Weight (g)',
    'Alcohol Volume (ml)',
    'Alcohol Weight (g)',
    'Final Price (DH)',
  ];

  const rows = data.mixes.map((m) => {
    const d = new Date(m.createdAt);
    const oilsList = m.oils && m.oils.length > 0 ? m.oils : [m.oil1 || {
      perfumeCode: m.perfumeCode,
      perfumeName: m.perfumeName,
      allocationPercent: 100,
      oilMl: m.oilMl,
      oilGrams: m.oilGrams,
      category: m.priceCategory || 'A'
    }];

    const getOilStr = (idx: number) => {
      const o = oilsList[idx];
      if (!o) return '';
      return `${o.perfumeCode} ${o.perfumeName} (${o.allocationPercent}% - ${o.oilMl.toFixed(2)}ml)`;
    };

    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      `"${(m.salesManName || data.salesManName).replace(/"/g, '""')}"`,
      m.bottleSize,
      m.concentration,
      m.numberOfOils || oilsList.length || 1,
      `"${getOilStr(0).replace(/"/g, '""')}"`,
      `"${getOilStr(1).replace(/"/g, '""')}"`,
      `"${getOilStr(2).replace(/"/g, '""')}"`,
      `"${getOilStr(3).replace(/"/g, '""')}"`,
      m.highestCategory || m.priceCategory || 'A',
      m.oilMl.toFixed(2),
      m.oilGrams.toFixed(2),
      m.alcoholMl.toFixed(2),
      m.alcoholGrams.toFixed(2),
      m.price || 0,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const cleanName = data.salesManName.replace(/[^a-zA-Z0-9]/g, '_');
  downloadFile(csvContent, `kprime_salesman_report_${cleanName}_${data.selectedDate}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Team Report to CSV
 */
export function exportTeamDailyReportCsv(data: {
  selectedDate: string;
  salesMenPerformance: {
    salesManName: string;
    mixes: number;
    bottles: number;
    oilMl: number;
    alcoholMl: number;
    revenue: number;
    avgMixValue: number;
    sharePercent: number;
  }[];
}): void {
  const headers = [
    'Sales Man',
    'Date',
    'Mixes Count',
    'Bottles Count',
    'Total Oil Used (ml)',
    'Total Alcohol Used (ml)',
    'Revenue Generated',
    'Average Mix Value',
    'Share of Team Revenue (%)',
  ];

  const rows = data.salesMenPerformance.map((s) => [
    `"${s.salesManName.replace(/"/g, '""')}"`,
    data.selectedDate,
    s.mixes,
    s.bottles,
    s.oilMl.toFixed(2),
    s.alcoholMl.toFixed(2),
    s.revenue,
    s.avgMixValue.toFixed(2),
    s.sharePercent.toFixed(1),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, `kprime_team_daily_report_${data.selectedDate}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Multi-Day Comparison to CSV
 */
export function exportTeamMultiDayComparisonCsv(comparisonRows: {
  date: string;
  mixes: number;
  bottles: number;
  oilMl: number;
  alcoholMl: number;
  revenue: number;
}[]): void {
  const headers = ['Date', 'Total Mixes', 'Total Bottles', 'Total Oil (ml)', 'Total Alcohol (ml)', 'Revenue Generated (DH)'];
  const rows = comparisonRows.map((r) => [
    r.date,
    r.mixes,
    r.bottles,
    r.oilMl.toFixed(2),
    r.alcoholMl.toFixed(2),
    r.revenue,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, `kprime_team_multi_day_comparison_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
