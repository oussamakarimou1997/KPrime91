import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  Compass,
  ArrowRight,
  FlaskConical,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  HelpCircle,
  Eye,
  ShieldCheck,
  RefreshCw,
  Globe,
  Tag,
  ChevronRight,
} from 'lucide-react';
import {
  Perfume,
  SearchedPerfumeProfile,
  SimilarMatchResult,
  SimilarSearchHistoryItem,
  PageId,
} from '../types';
import {
  findTopSimilarPerfumes,
  checkIfExistsInKprime,
} from '../services/similarity';
import {
  getSimilarHistory,
  addSimilarHistory,
  deleteSimilarHistoryItem,
  clearSimilarHistory,
} from '../services/storage';

interface SimilarPerfumeProps {
  perfumes: Perfume[];
  onSelectPerfumeToMix: (perfume: Perfume) => void;
  onViewPerfumeDetail: (perfume: Perfume) => void;
  onNavigate: (page: PageId) => void;
}

const POPULAR_SUGGESTIONS = [
  'Dior Sauvage',
  'Bleu de Chanel',
  'Baccarat Rouge 540',
  'La Vie Est Belle',
  'Creed Aventus',
  'Acqua di Giò',
  'Tom Ford Oud Wood',
  'Parfums de Marly Layton',
];

export const SimilarPerfume: React.FC<SimilarPerfumeProps> = ({
  perfumes,
  onSelectPerfumeToMix,
  onViewPerfumeDetail,
  onNavigate,
}) => {
  // Search inputs & states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Results
  const [searchedProfile, setSearchedProfile] = useState<SearchedPerfumeProfile | null>(null);
  const [similarResults, setSimilarResults] = useState<SimilarMatchResult[]>([]);
  const [exactMatchInDb, setExactMatchInDb] = useState<Perfume | null>(null);

  // Search History
  const [history, setHistory] = useState<SimilarSearchHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Load history on mount & listen to changes
  useEffect(() => {
    setHistory(getSimilarHistory());

    const handleHistoryUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setHistory(e.detail);
      }
    };
    window.addEventListener('perfume_similar_history_updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('perfume_similar_history_updated', handleHistoryUpdate);
    };
  }, []);

  // Handle Search Submission
  const handleSearch = async (queryToUse?: string) => {
    const query = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!query) {
      setErrorMsg('Please enter a perfume name to search.');
      return;
    }

    if (queryToUse !== undefined) {
      setSearchQuery(queryToUse);
    }

    setErrorMsg(null);
    setIsSearching(true);
    setLoadingStep(1);
    setActiveHistoryId(null);
    // Explicitly reset prior search outputs so stale results never persist
    setSearchedProfile(null);
    setSimilarResults([]);
    setExactMatchInDb(null);

    // Progressive step animation
    const stepTimer1 = setTimeout(() => setLoadingStep(2), 700);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1400);

    try {
      // 1. Call server-side research endpoint (Encyclopedia + Gemini Live Search Grounding)
      const res = await fetch('/api/similar-perfume/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeName: query }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Could not identify external perfume "${query}". Please check the spelling or provide both the brand and perfume name (e.g., 'Dior Sauvage', 'Lancôme La Vie Est Belle', 'Armani Acqua di Gio').`);
      }

      const data = await res.json();
      if (!data || !data.profile) {
        throw new Error(`We couldn't confidently identify "${query}". Please verify the brand or specific edition.`);
      }

      setLoadingStep(4);

      const profile: SearchedPerfumeProfile = data.profile;
      setSearchedProfile(profile);

      // 2. Check if the searched perfume already exists in our Kprime database
      const existingCheck = checkIfExistsInKprime(profile.name || query, perfumes);
      setExactMatchInDb(existingCheck.exists && existingCheck.matchedPerfume ? existingCheck.matchedPerfume : null);

      // 3. Compare with Kprime database using strict similarity algorithm
      const top5 = findTopSimilarPerfumes(profile, perfumes);
      setSimilarResults(top5);

      // 4. Save to Persistent Search History
      const savedItem = addSimilarHistory({
        query: query,
        searchedPerfume: profile,
        matches: top5,
        existsInDatabase: existingCheck.exists,
        matchedDatabasePerfume: existingCheck.matchedPerfume
          ? {
              code: existingCheck.matchedPerfume.code,
              name: existingCheck.matchedPerfume.name,
              id: existingCheck.matchedPerfume.id,
            }
          : undefined,
      });
      setActiveHistoryId(savedItem.id);
    } catch (err: any) {
      console.error('Similar perfume search error:', err);
      setErrorMsg(err.message || 'Unable to retrieve perfume information. Please try again.');
      setSearchedProfile(null);
      setSimilarResults([]);
      setExactMatchInDb(null);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsSearching(false);
      setLoadingStep(0);
    }
  };

  // Restore previous search from history
  const handleRestoreHistory = (item: SimilarSearchHistoryItem) => {
    setSearchQuery(item.query);
    setSearchedProfile(item.searchedPerfume);
    setSimilarResults(item.matches);
    setActiveHistoryId(item.id);
    setErrorMsg(null);

    // Re-verify if exists in current database in case DB changed
    const existingCheck = checkIfExistsInKprime(item.searchedPerfume.name || item.query, perfumes);
    setExactMatchInDb(existingCheck.exists && existingCheck.matchedPerfume ? existingCheck.matchedPerfume : null);
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSimilarHistoryItem(id);
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all recent similar perfume searches?')) {
      clearSimilarHistory();
      setActiveHistoryId(null);
    }
  };

  return (
    <div id="similar-perfume-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Royal Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Olfactory Discovery</span>
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Find Similar Perfumes
            </h1>
            <p className="text-stone-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Enter any external perfume that is not in our collection. We research its verified notes from the web and find the <span className="text-emerald-300 font-semibold">Top 5 closest alternatives</span> available in your Kprime database.
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end gap-2 bg-emerald-950/60 backdrop-blur-md p-3.5 rounded-xl border border-emerald-700/30">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-200">Catalog Scope</span>
            </div>
            <p className="text-xs text-stone-300 font-medium">
              Comparing against <strong className="text-amber-400 font-bold">{perfumes.length}</strong> Kprime formulas
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-4">
        <label htmlFor="perfume-search-input" className="block text-sm font-semibold text-stone-800">
          Enter External Perfume Name
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <Search className="w-5 h-5 text-emerald-700" />
            </div>
            <input
              id="perfume-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Bleu de Chanel, Tom Ford Oud Wood, Layton..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition"
              disabled={isSearching}
            />
          </div>

          <button
            id="find-similar-btn"
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-medium text-base shadow-md shadow-emerald-800/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition flex-shrink-0"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-200" />
                <span>Searching Web...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Find Similar</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Try:</span>
          {POPULAR_SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSearch(item)}
              disabled={isSearching}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 hover:border-emerald-300 border border-stone-200 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Multi-Step Loading State (Requirement #13) */}
      {isSearching && (
        <div id="searching-progress-card" className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-200/80 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-inner">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-stone-900 font-serif-luxury">
              Olfactory Research in Progress
            </h3>
            <p className="text-sm text-stone-600">
              Gathering fragrance accords and matching against {perfumes.length} formulas in your atelier.
            </p>
          </div>

          {/* Stepper tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            {[
              { num: 1, text: 'Searching the web for perfume info' },
              { num: 2, text: 'Analyzing fragrance notes & accords' },
              { num: 3, text: 'Comparing with Kprime database' },
              { num: 4, text: 'Finding Top 5 closest matches' },
            ].map((step) => {
              const isDone = loadingStep > step.num;
              const isActive = loadingStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm'
                      : isDone
                      ? 'border-emerald-300 bg-emerald-50/30 text-emerald-800'
                      : 'border-stone-200 bg-stone-50/50 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-emerald-700 text-white animate-pulse' : 'bg-stone-300 text-stone-700'
                        }`}
                      >
                        {step.num}
                      </span>
                    )}
                    <span className="text-xs font-semibold">Step {step.num}</span>
                  </div>
                  <p className="text-[11px] leading-snug">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div id="search-error-banner" className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3.5 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Search Notice</h4>
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Notification if Perfume Already Exists in Database (Requirement #12) */}
      {exactMatchInDb && (
        <div id="already-in-db-banner" className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 text-amber-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-200/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                Already in Your Database
              </div>
              <h4 className="text-base font-bold text-stone-900">
                &ldquo;{exactMatchInDb.name}&rdquo; is already in your Kprime catalog!
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Catalog Code: <strong className="text-emerald-800 font-mono">{exactMatchInDb.code}</strong> • Category:{' '}
                <strong>{exactMatchInDb.category}</strong> • Oil Label: &ldquo;{exactMatchInDb.oilLabel || exactMatchInDb.name}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelectPerfumeToMix(exactMatchInDb)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
            >
              <FlaskConical className="w-4 h-4 text-emerald-200" />
              <span>Mix Now</span>
            </button>
            <button
              type="button"
              onClick={() => onViewPerfumeDetail(exactMatchInDb)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4 text-stone-600" />
              <span>View in Database</span>
            </button>
          </div>
        </div>
      )}

      {/* Searched Perfume External Profile Card (Requirement #4) */}
      {searchedProfile && !isSearching && (
        <div id="researched-profile-card" className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-stone-200 gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold">
                  {searchedProfile.brand || 'Designer Perfumery'}
                </span>
                {searchedProfile.concentration && (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {searchedProfile.concentration}
                  </span>
                )}
                {searchedProfile.genderTarget && (
                  <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs">
                    Target: {searchedProfile.genderTarget}
                  </span>
                )}
              </div>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900">
                {searchedProfile.name}
              </h2>
              <p className="text-sm text-stone-600 max-w-3xl">
                {searchedProfile.description}
              </p>
            </div>

            {/* External Verification Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs self-start sm:self-center">
              <Globe className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <div>
                <p className="font-bold">Web Verified Profile</p>
                <p className="text-[10px] text-emerald-700">Fragrance accords extracted from web</p>
              </div>
            </div>
          </div>

          {/* Fragrance Family & Accords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Olfactory Family
              </h4>
              <p className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                {searchedProfile.fragranceFamily}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Main Accords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {searchedProfile.accords.map((accord, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium"
                  >
                    {accord}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Pyramid (Top, Heart, Base) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Olfactory Notes Breakdown
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Notes */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                    Top Notes
                  </span>
                  <span className="text-[10px] text-stone-400">First 15 mins</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchedProfile.topNotes.length > 0 ? (
                    searchedProfile.topNotes.map((n, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-800 text-xs"
                      >
                        {n}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-400 italic">Fresh opening nuances</span>
                  )}
                </div>
              </div>

              {/* Heart Notes */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                    Heart Notes
                  </span>
                  <span className="text-[10px] text-stone-400">2 - 4 hours</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchedProfile.heartNotes.length > 0 ? (
                    searchedProfile.heartNotes.map((n, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-800 text-xs"
                      >
                        {n}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-400 italic">Core aromatic body</span>
                  )}
                </div>
              </div>

              {/* Base Notes */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-700">
                    Base Notes
                  </span>
                  <span className="text-[10px] text-stone-400">Drydown & sillage</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchedProfile.baseNotes.length > 0 ? (
                    searchedProfile.baseNotes.map((n, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-800 text-xs"
                      >
                        {n}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-400 italic">Woody / amber foundation</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Editions / Ambiguity Notice (Requirement #3) */}
          {searchedProfile.potentialAlternatives && searchedProfile.potentialAlternatives.length > 0 && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Other Flankers & Concentrations:</strong> Did you mean another version?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {searchedProfile.potentialAlternatives.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSearch(alt)}
                    className="underline text-emerald-800 hover:text-emerald-950 font-medium"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Web Citations & Grounding Sources */}
          {searchedProfile.sources && searchedProfile.sources.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500 border-t border-stone-100">
              <span className="font-semibold text-stone-600">Grounding Sources:</span>
              {searchedProfile.sources.slice(0, 3).map((src, idx) => (
                <a
                  key={idx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline"
                >
                  <span>{src.title || 'Fragrance Database'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top 5 Matches Section (Requirements #7 & #8) */}
      {searchedProfile && !isSearching && (
        <div id="top-5-results-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Kprime Database Comparison</span>
              </div>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-900">
                Top 5 Most Similar Perfumes in Our Atelier
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold self-start sm:self-center">
              Strictly filtered to in-stock Kprime catalog
            </span>
          </div>

          {similarResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-500 border border-stone-200">
              No matching perfumes found in the database. Please add more perfume formulas to your database.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {similarResults.map((match) => {
                const isTop1 = match.rank === 1;
                const score = match.similarityPercentage;
                const priceCat = match.perfume.code.charAt(0).toUpperCase();

                // Similarity badge color
                const badgeColor =
                  score >= 85
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/30'
                    : score >= 70
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-700 text-white';

                return (
                  <div
                    key={match.perfume.id}
                    id={`similar-match-rank-${match.rank}`}
                    className={`rounded-2xl p-5 sm:p-6 transition-all border ${
                      isTop1
                        ? 'bg-gradient-to-r from-emerald-50/50 via-white to-amber-50/20 border-emerald-400 shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left: Rank, Identity, Details */}
                      <div className="flex items-start gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-serif-luxury font-bold shadow-sm ${
                            isTop1
                              ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-amber-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-tighter opacity-80">Rank</span>
                          <span className="text-base leading-none">#{match.rank}</span>
                        </div>

                        {/* Perfume Identity */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {isTop1 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                Closest Olfactory Match
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-xs font-bold">
                              {match.perfume.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs">
                              {match.perfume.category}
                            </span>
                            {['A', 'B', 'C', 'D'].includes(priceCat) && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                                Cat {priceCat}
                              </span>
                            )}
                            {match.perfume.oilLabel && (
                              <span className="text-xs text-stone-400">
                                Label: &ldquo;{match.perfume.oilLabel}&rdquo;
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-luxury">
                            {match.perfume.name}
                          </h4>

                          <p className="text-xs sm:text-sm text-stone-600">
                            <strong>Family:</strong> {match.perfume.fragrance || match.perfume.scentGroup}
                            {match.perfume.reference && (
                              <span className="text-stone-400 block sm:inline sm:ml-2">
                                (Ref: {match.perfume.reference})
                              </span>
                            )}
                          </p>

                          {/* Why it is similar (Requirement #8) */}
                          <div className="mt-2 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 leading-relaxed">
                            <strong className="text-emerald-800 font-semibold">Why it is similar: </strong>
                            {match.similarityReason}
                          </div>

                          {/* Overlapping notes chips */}
                          {match.overlappingNotes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[11px] font-bold text-stone-500 uppercase">Shared Notes:</span>
                              {match.overlappingNotes.map((note, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Similarity Score Gauge & Quick Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 flex-shrink-0">
                        {/* Similarity Score */}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-semibold uppercase">Similarity</span>
                            <span className={`px-3 py-1 rounded-xl text-sm font-bold tracking-tight ${badgeColor}`}>
                              {score}%
                            </span>
                          </div>

                          {/* Mini visual bar */}
                          <div className="w-28 h-2 rounded-full bg-stone-200 overflow-hidden mt-1.5 ml-auto">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectPerfumeToMix(match.perfume)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
                            title="Open in Mixing Calculator"
                          >
                            <FlaskConical className="w-4 h-4 text-emerald-200" />
                            <span>Select to Mix</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewPerfumeDetail(match.perfume)}
                            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition"
                            title="View perfume database details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Searches Section (Requirement #15) */}
      <div id="recent-searches-section" className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-stone-900">
              Recent Similar Searches
            </h3>
            {history.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                {history.length} saved
              </span>
            )}
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs sm:text-sm text-stone-400 italic py-2">
            No recent searches yet. Search any perfume above to track recommendations.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.slice(0, 9).map((item) => {
              const isActive = activeHistoryId === item.id;
              const topMatch = item.matches && item.matches.length > 0 ? item.matches[0] : null;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleRestoreHistory(item)}
                  className={`group p-3.5 rounded-xl border text-left cursor-pointer transition relative ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1 pr-6">
                      <p className="text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition line-clamp-1">
                        {item.query}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {item.searchedPerfume?.fragranceFamily || 'Fragrance Profile'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      className="text-stone-300 hover:text-red-600 p-1 rounded transition opacity-0 group-hover:opacity-100"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {topMatch && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
                      <span className="text-[11px] truncate max-w-[140px]">
                        Top: <strong className="text-emerald-900">{topMatch.perfume.name}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {topMatch.similarityPercentage}% match
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400 mt-1">{formattedDate}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
