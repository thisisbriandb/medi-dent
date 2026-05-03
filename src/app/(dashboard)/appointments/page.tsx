'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import RdvService from '@/app/services/RdvService';
import RdvFormDialog from '@/app/components/rdv/RdvFormDialog';
import { useAuth } from '@/contexts/AuthContext';
import type { RendezVous, StatutRdv } from '@/types/rdv.types';

// ─── Helpers ───

type ViewMode = 'semaine' | 'jour';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h → 19h

const STATUT_COLORS: Record<StatutRdv, string> = {
  planifie: 'bg-blue-100 border-blue-300 text-blue-800',
  confirme: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  en_cours: 'bg-amber-100 border-amber-300 text-amber-800',
  termine: 'bg-gray-100 border-gray-300 text-gray-600',
  annule: 'bg-gray-100 border-gray-200 text-gray-400 line-through',
  absent: 'bg-red-100 border-red-300 text-red-700',
};

const STATUT_LABELS: Record<StatutRdv, string> = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
  absent: 'Absent',
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

// ─── Main Component ───

export default function AppointmentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [view, setView] = useState<ViewMode>('semaine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');
  const [defaultHeure, setDefaultHeure] = useState<string>('');

  const monday = useMemo(() => getMonday(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  const dateFrom = useMemo(() => {
    if (view === 'semaine') return monday.toISOString();
    const d = new Date(currentDate); d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [view, monday, currentDate]);

  const dateTo = useMemo(() => {
    if (view === 'semaine') return addDays(monday, 7).toISOString();
    const d = new Date(currentDate); d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [view, monday, currentDate]);

  const fetchRdvs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await RdvService.getByDateRange(dateFrom, dateTo);
      setRdvs(data);
    } catch (err) {
      console.error('Erreur chargement RDV:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchRdvs();
  }, [authLoading, isAuthenticated, fetchRdvs]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(addDays(currentDate, view === 'semaine' ? -7 : -1));
  const goNext = () => setCurrentDate(addDays(currentDate, view === 'semaine' ? 7 : 1));

  // Open new RDV dialog
  const handleSlotClick = (date: Date, hour: number) => {
    setEditingRdv(null);
    setDefaultDate(formatDateISO(date));
    setDefaultHeure(`${String(hour).padStart(2, '0')}:00`);
    setDialogOpen(true);
  };

  const handleRdvClick = (rdv: RendezVous, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRdv(rdv);
    setDefaultDate('');
    setDefaultHeure('');
    setDialogOpen(true);
  };

  const handleNewRdv = () => {
    setEditingRdv(null);
    setDefaultDate(formatDateISO(currentDate));
    setDefaultHeure('09:00');
    setDialogOpen(true);
  };

  // Get RDVs for a specific day
  const getRdvsForDay = (day: Date) => {
    return rdvs.filter((r) => {
      const rd = new Date(r.date_heure);
      return isSameDay(rd, day);
    });
  };

  // Position a RDV card in the grid (h-16 = 4rem = 64px per hour)
  const getRdvStyle = (rdv: RendezVous) => {
    const dt = new Date(rdv.date_heure);
    const startHour = dt.getHours() + dt.getMinutes() / 60;
    const topPx = (startHour - HOURS[0]) * 64;
    const heightPx = (rdv.duree_minutes / 60) * 64;
    return {
      top: `${topPx}px`,
      height: `${Math.max(heightPx, 28)}px`,
    };
  };

  // Header label
  const headerLabel = useMemo(() => {
    if (view === 'jour') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const end = addDays(monday, 6);
    if (monday.getMonth() === end.getMonth()) {
      return `${monday.getDate()} – ${end.getDate()} ${monday.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    }
    return `${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [view, currentDate, monday]);

  const todayRdvCount = rdvs.filter((r) => isSameDay(new Date(r.date_heure), new Date())).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">
            {todayRdvCount} rendez-vous aujourd'hui
          </p>
        </div>
        <button
          onClick={handleNewRdv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau RDV
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={goNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-800 ml-2 capitalize">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('jour')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'jour' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Jour
          </button>
          <button
            onClick={() => setView('semaine')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'semaine' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : view === 'semaine' ? (
          <WeekView
            days={weekDays}
            rdvs={rdvs}
            getRdvsForDay={getRdvsForDay}
            getRdvStyle={getRdvStyle}
            onSlotClick={handleSlotClick}
            onRdvClick={handleRdvClick}
          />
        ) : (
          <DayView
            day={currentDate}
            rdvs={getRdvsForDay(currentDate)}
            getRdvStyle={getRdvStyle}
            onSlotClick={handleSlotClick}
            onRdvClick={handleRdvClick}
          />
        )}
      </div>

      {/* Dialog */}
      <RdvFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingRdv(null); }}
        onSaved={fetchRdvs}
        rdv={editingRdv}
        defaultDate={defaultDate}
        defaultHeure={defaultHeure}
      />
    </div>
  );
}

// ─── Week View ───

function WeekView({
  days,
  rdvs,
  getRdvsForDay,
  getRdvStyle,
  onSlotClick,
  onRdvClick,
}: {
  days: Date[];
  rdvs: RendezVous[];
  getRdvsForDay: (d: Date) => RendezVous[];
  getRdvStyle: (r: RendezVous) => { top: string; height: string };
  onSlotClick: (d: Date, h: number) => void;
  onRdvClick: (r: RendezVous, e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex">
      {/* Time column */}
      <div className="w-18 flex-shrink-0 border-r border-gray-100">
        <div className="h-12 border-b border-gray-100" />
        {HOURS.map((h) => (
          <div key={h} className="h-16 border-b border-gray-50 flex items-start justify-end pr-2 -mt-2">
            <span className="text-[11px] font-medium text-gray-400">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex-1 grid grid-cols-7">
        {days.map((day, idx) => {
          const dayRdvs = getRdvsForDay(day);
          const today = isToday(day);
          return (
            <div key={idx} className={`border-r border-gray-50 last:border-r-0 ${today ? 'bg-blue-50/30' : ''}`}>
              {/* Day header */}
              <div className={`h-12 flex flex-col items-center justify-center border-b border-gray-100 ${today ? 'bg-blue-50' : ''}`}>
                <span className={`text-xs uppercase ${today ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <span className={`text-sm font-medium ${today ? 'text-blue-600' : 'text-gray-800'}`}>
                  {day.getDate()}
                </span>
              </div>

              {/* Time slots */}
              <div className="relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    onClick={() => onSlotClick(day, h)}
                    className="h-16 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  />
                ))}

                {/* RDV cards */}
                {dayRdvs.map((rdv) => {
                  const style = getRdvStyle(rdv);
                  const colors = STATUT_COLORS[rdv.statut] || STATUT_COLORS.planifie;
                  return (
                    <div
                      key={rdv.id}
                      onClick={(e) => onRdvClick(rdv, e)}
                      className={`absolute left-0.5 right-0.5 z-10 rounded-md border px-1.5 py-1 cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${colors}`}
                      style={style}
                    >
                      <p className="text-[9px] font-semibold truncate leading-tight">
                        {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' '}{rdv.patient?.prenom} {rdv.patient?.nom}
                      </p>
                      {rdv.motif && (
                        <p className="text-[10px] opacity-70 truncate leading-tight mt-0.5">{rdv.motif}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ───

function DayView({
  day,
  rdvs,
  getRdvStyle,
  onSlotClick,
  onRdvClick,
}: {
  day: Date;
  rdvs: RendezVous[];
  getRdvStyle: (r: RendezVous) => { top: string; height: string };
  onSlotClick: (d: Date, h: number) => void;
  onRdvClick: (r: RendezVous, e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border border-gray-100">
        {HOURS.map((h) => (
          <div key={h} className="h-25 border-b border-gray-50 flex items-start justify-end pr-3 pt-1">
            <span className="text-xs text-gray-400">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 relative">
        {HOURS.map((h) => (
          <div
            key={h}
            onClick={() => onSlotClick(day, h)}
            className="h-20 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
          />
        ))}

        {/* RDV cards */}
        {rdvs.map((rdv) => {
          const dt = new Date(rdv.date_heure);
          const startHour = dt.getHours() + dt.getMinutes() / 60;
          const topPx = (startHour - HOURS[0]) * 80; // 80px per hour (h-20 = 5rem = 80px)
          const heightPx = (rdv.duree_minutes / 60) * 80;
          const colors = STATUT_COLORS[rdv.statut] || STATUT_COLORS.planifie;

          return (
            <div
              key={rdv.id}
              onClick={(e) => onRdvClick(rdv, e)}
              className={`absolute left-2 right-2 rounded-lg border px-3 py-2 cursor-pointer transition-shadow hover:shadow-md ${colors}`}
              style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 32)}px` }}
            >
              <p className="text-sm truncate leading-tight">
                <span className="font-semibold">{rdv.patient?.prenom} {rdv.patient?.nom}</span>
                {rdv.motif && (
                  <span className="ml-2 font-normal opacity-60">— {rdv.motif}</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
