import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  FlaskConical,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserX,
  UserCheck,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { SalesMan, MixingFormula } from '../types';

interface SalesTeamProps {
  salesmen: SalesMan[];
  history: MixingFormula[];
  currencySymbol?: string;
  onAddSalesMan: (salesman: Omit<SalesMan, 'id' | 'createdAt'>) => any;
  onUpdateSalesMan: (id: string, updates: Partial<SalesMan>) => any;
  onToggleStatus?: (id: string) => any;
  onDeleteSalesMan: (id: string) => any;
  onNavigateToMix?: (salesManId: string) => void;
  onNavigateToReport?: (salesManId: string) => void;
  onNavigateToCalculatorWithSalesMan?: (salesManId: string) => void;
  onNavigateToReportsWithSalesMan?: (salesManId: string) => void;
}

export const SalesTeam: React.FC<SalesTeamProps> = ({
  salesmen,
  history,
  currencySymbol = 'DH',
  onAddSalesMan,
  onUpdateSalesMan,
  onToggleStatus,
  onDeleteSalesMan,
  onNavigateToMix,
  onNavigateToReport,
  onNavigateToCalculatorWithSalesMan,
  onNavigateToReportsWithSalesMan,
}) => {
  const handleNavMix = onNavigateToCalculatorWithSalesMan || onNavigateToMix;
  const handleNavReport = onNavigateToReportsWithSalesMan || onNavigateToReport;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalesMan, setEditingSalesMan] = useState<SalesMan | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Dialog
  const [deletingSalesMan, setDeletingSalesMan] = useState<SalesMan | null>(null);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Compute statistics per Sales Man from Mixing History
  const statsBySalesMan = useMemo(() => {
    const map = new Map<
      string,
      {
        totalMixes: number;
        totalBottles: number;
        totalRevenue: number;
        totalOilMl: number;
        lastMixDate: string | null;
      }
    >();

    history.forEach((mix) => {
      const id = mix.salesManId || 'unassigned';
      const existing = map.get(id) || {
        totalMixes: 0,
        totalBottles: 0,
        totalRevenue: 0,
        totalOilMl: 0,
        lastMixDate: null,
      };

      existing.totalMixes += 1;
      existing.totalBottles += 1;
      existing.totalRevenue += mix.price || 0;
      existing.totalOilMl += mix.oilMl || 0;

      if (!existing.lastMixDate || new Date(mix.createdAt) > new Date(existing.lastMixDate)) {
        existing.lastMixDate = mix.createdAt;
      }

      map.set(id, existing);
    });

    return map;
  }, [history]);

  // Overall Team Statistics
  const teamMetrics = useMemo(() => {
    const totalCount = salesmen.length;
    const activeCount = salesmen.filter((s) => s.isActive).length;
    const totalMixes = history.length;
    const totalRevenue = history.reduce((sum, m) => sum + (m.price || 0), 0);

    return {
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
      totalMixes,
      totalRevenue,
    };
  }, [salesmen, history]);

  // Filtered list
  const filteredSalesMen = useMemo(() => {
    return salesmen.filter((s) => {
      // Status filter
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    });
  }, [salesmen, searchQuery, statusFilter]);

  // Open modal for new salesman
  const handleOpenAddModal = () => {
    const nextCodeNumber = salesmen.length + 1;
    const padded = nextCodeNumber < 10 ? `0${nextCodeNumber}` : `${nextCodeNumber}`;
    setEditingSalesMan(null);
    setFormName('');
    setFormCode(`SM-${padded}`);
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing salesman
  const handleOpenEditModal = (salesman: SalesMan) => {
    setEditingSalesMan(salesman);
    setFormName(salesman.name);
    setFormCode(salesman.code || '');
    setFormPhone(salesman.phone || '');
    setFormEmail(salesman.email || '');
    setFormIsActive(Boolean(salesman.isActive ?? (salesman.status === 'active')));
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Sales Man name is required.');
      return;
    }

    // Check code uniqueness among other salesmen
    const trimmedCode = formCode.trim().toUpperCase();
    if (trimmedCode) {
      const isDuplicate = salesmen.some(
        (s) => s.code?.toUpperCase() === trimmedCode && s.id !== editingSalesMan?.id
      );
      if (isDuplicate) {
        setFormError(`Sales Man code "${trimmedCode}" is already in use by another staff member.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingSalesMan) {
        await onUpdateSalesMan(editingSalesMan.id, {
          name: formName.trim(),
          code: trimmedCode || undefined,
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          status: formIsActive ? 'active' : 'inactive',
          isActive: formIsActive,
        });
        triggerSuccess(`Sales Man "${formName.trim()}" updated successfully.`);
      } else {
        await onAddSalesMan({
          name: formName.trim(),
          code: trimmedCode || `SM-${Date.now().toString().slice(-4)}`,
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          status: formIsActive ? 'active' : 'inactive',
          isActive: formIsActive,
        });
        triggerSuccess(`Sales Man "${formName.trim()}" registered successfully.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save Sales Man.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    if (onToggleStatus) {
      await onToggleStatus(id);
    } else {
      await onUpdateSalesMan(id, {
        isActive: !currentStatus,
        status: currentStatus ? 'inactive' : 'active',
      });
    }
    triggerSuccess(`Sales Man "${name}" set to ${currentStatus ? 'Inactive' : 'Active'}.`);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingSalesMan) return;
    const name = deletingSalesMan.name;
    await onDeleteSalesMan(deletingSalesMan.id);
    setDeletingSalesMan(null);
    triggerSuccess(`Sales Man "${name}" removed from the team.`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
              Sales Team Management
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Manage perfume boutique staff, track individual mixing throughput, and audit daily sales performance.
          </p>
        </div>

        <button
          id="add-salesman-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Sales Man
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-2.5 text-emerald-950 text-xs shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Team Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            Total Staff
          </div>
          <div className="text-2xl font-mono font-black text-stone-900 mt-1">
            {teamMetrics.totalCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            <span className="text-emerald-700 font-bold">{teamMetrics.activeCount} active</span> · {teamMetrics.inactiveCount} inactive
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            Active Sales Men
          </div>
          <div className="text-2xl font-mono font-black text-emerald-800 mt-1">
            {teamMetrics.activeCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Available for formula mixing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
            Total Team Mixes
          </div>
          <div className="text-2xl font-mono font-black text-stone-900 mt-1">
            {teamMetrics.totalMixes}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Historical formulations</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            Total Team Revenue
          </div>
          <div className="text-2xl font-mono font-black text-emerald-950 mt-1">
            {teamMetrics.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-stone-500">{currencySymbol}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">All-time sales value</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white border border-stone-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Toggle Filters */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 w-full sm:w-auto">
          {(['all', 'active', 'inactive'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            const labels = { all: 'All Staff', active: 'Active Only', inactive: 'Inactive' };
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sales Men Cards / Table */}
      {filteredSalesMen.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-base mb-1">
            {salesmen.length === 0 ? 'No Sales Men Added Yet' : 'No Sales Men Match Filter'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
            {salesmen.length === 0
              ? 'Register your sales team members to track who performed each perfume mix and generate accurate daily staff reports.'
              : 'Try changing your search query or filter to see more sales team members.'}
          </p>
          {salesmen.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Add First Sales Man
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalesMen.map((salesman) => {
            const stats = statsBySalesMan.get(salesman.id) || {
              totalMixes: 0,
              totalBottles: 0,
              totalRevenue: 0,
              totalOilMl: 0,
              lastMixDate: null,
            };

            const initials = salesman.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={salesman.id}
                className={`rounded-2xl bg-white border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  salesman.isActive
                    ? 'border-stone-200 hover:border-emerald-400 hover:shadow-sm'
                    : 'border-stone-200 bg-stone-50/60 opacity-85'
                }`}
              >
                <div>
                  {/* Top header row: Avatar + Status + Code */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-2xs ${
                          salesman.isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-300 text-stone-700'
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm leading-tight flex items-center gap-1.5">
                          {salesman.name}
                        </h3>
                        {salesman.code && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-bold border border-stone-200 inline-block mt-0.5">
                            {salesman.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(salesman.id, salesman.name, Boolean(salesman.isActive ?? (salesman.status === 'active')))}
                      title={`Click to ${(salesman.isActive ?? (salesman.status === 'active')) ? 'deactivate' : 'activate'}`}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        (salesman.isActive ?? (salesman.status === 'active'))
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {(salesman.isActive ?? (salesman.status === 'active')) ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contact Info (if available) */}
                  {(salesman.phone || salesman.email) && (
                    <div className="mt-3.5 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-600">
                      {salesman.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span className="font-mono text-[11px]">{salesman.phone}</span>
                        </div>
                      )}
                      {salesman.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span className="truncate text-[11px]">{salesman.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mixing & Revenue Metrics Box */}
                  <div className="mt-4 bg-stone-50 rounded-xl p-3 border border-stone-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Total Mixes</div>
                      <div className="font-mono font-black text-stone-800 text-base">
                        {stats.totalMixes}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Total Revenue</div>
                      <div className="font-mono font-black text-emerald-900 text-base">
                        {stats.totalRevenue.toLocaleString()} <span className="text-[10px] font-normal text-stone-500">{currencySymbol}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Total Oil Dispensed</div>
                      <div className="font-mono text-stone-700 text-xs">
                        {stats.totalOilMl.toFixed(1)} ml
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Last Activity</div>
                      <div className="font-mono text-stone-700 text-[10px] truncate">
                        {stats.lastMixDate ? new Date(stats.lastMixDate).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {onNavigateToCalculatorWithSalesMan && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCalculatorWithSalesMan(salesman.id)}
                        title="Open calculator with this Sales Man preselected"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Mix</span>
                      </button>
                    )}

                    {onNavigateToReportsWithSalesMan && (
                      <button
                        type="button"
                        onClick={() => onNavigateToReportsWithSalesMan(salesman.id)}
                        title="View Daily Report for this Sales Man"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold border border-stone-200 flex items-center gap-1"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-stone-500" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(salesman)}
                      title="Edit details"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSalesMan(salesman)}
                      title="Delete Sales Man"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {editingSalesMan ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  {editingSalesMan ? 'Edit Sales Man' : 'Add New Sales Man'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Youssef Alami"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 text-xs font-semibold"
                />
              </div>

              {/* Code & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Staff Code / Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SM-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="06 XX XX XX XX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="youssef@kprime.ma"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 text-xs"
                />
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <div>
                  <div className="font-bold text-stone-800">Account Status</div>
                  <div className="text-[11px] text-stone-500">
                    Active staff appear in the mixing calculator combobox
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    formIsActive
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  {formIsActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSalesMan ? 'Save Changes' : 'Register Sales Man'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSalesMan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-sm w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Delete Sales Man?</h3>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Are you sure you want to remove <b>{deletingSalesMan.name}</b>?
                </p>
              </div>
            </div>

            <p className="text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
              Note: Existing mixing records will keep their historical record attached to this name.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSalesMan(null)}
                className="px-3.5 py-1.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
