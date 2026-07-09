import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Flag,
  Gauge,
  Package,
  RefreshCw,
  ScanLine,
  Server,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { monitoringAPI } from '../api/monitoring';
import { useToast } from './Toast';

const REFRESH_MS = 10000;
const RESCORE_POLL_MS = 2000;

const formatUptime = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const pct = (rate) => (rate == null ? '—' : `${(rate * 100).toFixed(1)}%`);

// Classes Tailwind statiques : indispensable car le JIT purge les noms de
// classes construits dynamiquement (`bg-${accent}-100` ne serait pas généré).
const ACCENTS = {
  blue: 'bg-blue-100 text-blue-500',
  green: 'bg-green-100 text-green-500',
  indigo: 'bg-indigo-100 text-indigo-500',
  gray: 'bg-gray-100 text-gray-500',
  emerald: 'bg-emerald-100 text-emerald-600',
};

const StatCard = ({ icon: Icon, label, value, accent = 'blue', sub }) => {
  const [bg, text] = (ACCENTS[accent] || ACCENTS.blue).split(' ');
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bg} rounded-md p-3`}>
          <Icon className={`h-6 w-6 ${text}`} />
        </div>
        <div className="ml-4 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
          <dd className="text-2xl font-bold text-gray-900">{value}</dd>
          {sub != null && <dd className="text-xs text-gray-400 mt-0.5">{sub}</dd>}
        </div>
      </div>
    </div>
  );
};

const alertStyles = {
  ok: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

// --- Mini graphique en barres (série journalière), sans dépendance externe ---
const DailyBarChart = ({ series = [], color = 'bg-emerald-500' }) => {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="flex items-end gap-1 h-28">
      {series.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center group relative">
          <div className="absolute -top-7 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
            {d.date.slice(5)} · {d.count}
          </div>
          <div
            className={`w-full rounded-t ${d.count > 0 ? color : 'bg-gray-100'}`}
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
};

// --- Distribution des scores (bandes Yuka, barres horizontales colorées) ---
const SCORE_BANDS = [
  ['excellent', 'Excellent (75-100)', 'bg-emerald-500'],
  ['bon', 'Bon (50-74)', 'bg-lime-500'],
  ['mediocre', 'Médiocre (25-49)', 'bg-orange-400'],
  ['mauvais', 'Mauvais (0-24)', 'bg-red-500'],
  ['sans_score', 'Sans score', 'bg-gray-300'],
];

const ScoreDistribution = ({ distribution = {} }) => {
  const total = Math.max(1, Object.values(distribution).reduce((a, b) => a + b, 0));
  return (
    <div className="space-y-2">
      {SCORE_BANDS.map(([key, label, color]) => {
        const count = distribution[key] ?? 0;
        return (
          <div key={key} className="flex items-center text-sm">
            <span className="w-40 text-gray-600 flex-shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className={`${color} h-4`} style={{ width: `${(count / total) * 100}%` }} />
            </div>
            <span className="w-12 text-right font-semibold text-gray-800">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const GRADE_COLORS = {
  a: 'bg-emerald-500', b: 'bg-lime-500', c: 'bg-yellow-400', d: 'bg-orange-500', e: 'bg-red-500',
};

const NutriScoreBar = ({ distribution = {} }) => (
  <div className="flex items-center gap-3">
    {['a', 'b', 'c', 'd', 'e'].map((g) => (
      <div key={g} className="flex-1 text-center">
        <div className={`${GRADE_COLORS[g]} text-white rounded-md py-2 font-bold uppercase`}>{g}</div>
        <div className="text-sm font-semibold text-gray-700 mt-1">{distribution[g] ?? 0}</div>
      </div>
    ))}
  </div>
);

// --- Panneau de rescoring global -------------------------------------------
const RescorePanel = ({ toast }) => {
  const [status, setStatus] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      const s = await monitoringAPI.getRescoreStatus();
      setStatus(s);
      if (!s.running && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return s;
    } catch {
      return null;
    }
  }, []);

  // Au montage : si un rescoring tourne déjà (autre onglet…), on reprend le suivi.
  useEffect(() => {
    poll().then((s) => {
      if (s?.running && !pollRef.current) {
        pollRef.current = setInterval(poll, RESCORE_POLL_MS);
      }
    });
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [poll]);

  const start = async () => {
    setConfirming(false);
    setStarting(true);
    try {
      await monitoringAPI.startRescore();
      toast.info('Rescoring lancé — la progression s’affiche ci-dessous.');
      if (!pollRef.current) pollRef.current = setInterval(poll, RESCORE_POLL_MS);
      await poll();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('Un rescoring est déjà en cours.');
        if (!pollRef.current) pollRef.current = setInterval(poll, RESCORE_POLL_MS);
      } else {
        toast.error('Impossible de lancer le rescoring.');
      }
    } finally {
      setStarting(false);
    }
  };

  const running = status?.running;
  const progress = status?.total ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Wand2 className="h-5 w-5 text-emerald-600 mr-2" />
            Rescoring de la base
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recalcule le score de tous les produits avec l’algorithme actuel.
            À lancer après chaque modification de l’algorithme de scoring.
          </p>
        </div>
        <button
          onClick={() => setConfirming(true)}
          disabled={running || starting}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Rescoring en cours…' : 'Rescorer tous les produits'}
        </button>
      </div>

      {(running || status?.finished_at) && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {status.done ?? 0} / {status.total ?? '…'} produits
              {status.errors > 0 && ` · ${status.errors} erreur(s)`}
            </span>
            <span>{running ? `${progress}%` : 'Terminé'}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${running ? 'bg-emerald-500' : 'bg-emerald-600'}`}
              style={{ width: `${running ? progress : 100}%` }}
            />
          </div>
          {!running && status?.finished_at && (
            <p className="text-xs text-gray-400 mt-1">
              Dernier rescoring terminé le {new Date(status.finished_at).toLocaleString()}
              {status.error_message && (
                <span className="text-red-500"> — {status.error_message}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Rescorer toute la base ?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Tous les scores et lettres Nutri-Score seront recalculés avec
              l’algorithme actuel, puis le cache produit sera purgé. L’opération
              tourne en arrière-plan et peut prendre plusieurs minutes.
            </p>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-md text-sm text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={start}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Lancer le rescoring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Monitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);
  const toast = useToast();

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const result = await monitoringAPI.getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Impossible de charger les métriques. Le backend est-il accessible ?");
      console.error('Monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(true), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Chargement des métriques…</p>
      </div>
    );
  }

  const totals = data?.totals || {};
  const runtime = data?.runtime || {};
  const latency = runtime.latency_ms || {};
  const ocrRuntime = runtime.ocr_runtime || {};
  const ocrHistory = data?.ocr_history || {};
  const alerts = runtime.alerts || [];
  const topScanned = data?.top_scanned_products || [];
  const topScannedCosmetics = data?.top_scanned_cosmetics || [];
  const slowest = runtime.slowest_endpoints || [];
  const topEndpoints = runtime.top_endpoints || [];
  const recentErrors = runtime.recent_errors || [];
  const submissions = totals.submissions_by_status || {};
  const cosmeticSubmissions = totals.cosmetic_submissions_by_status || {};

  const analytics = data?.analytics || {};
  const usersAnalytics = analytics.users || {};
  const productsAnalytics = analytics.products || {};
  const cosmeticsAnalytics = analytics.cosmetics || {};
  const scansPerDay = analytics.scans_per_day || [];
  const contributors = analytics.top_contributors || [];
  const reportsSummary = analytics.reports || {};
  const worstProducts = productsAnalytics.worst_products || [];
  const worstCosmetics = cosmeticsAnalytics.worst_cosmetics || [];
  const topCategories = productsAnalytics.top_categories || [];

  const reportRows = Object.entries(reportsSummary).map(([type, byStatus]) => ({
    type,
    pending: byStatus.pending ?? 0,
    resolved: byStatus.resolved ?? 0,
    ignored: byStatus.ignored ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="h-7 w-7 text-emerald-600 mr-2" />
            Statistiques &amp; Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Actualisation automatique toutes les {REFRESH_MS / 1000}s
            {lastUpdated && ` · dernière mise à jour ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Rafraîchir</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Rescoring global */}
      <RescorePanel toast={toast} />

      {/* Alertes de performance */}
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center border rounded-md px-4 py-3 text-sm ${
              alertStyles[alert.level] || alertStyles.warning
            }`}
          >
            {alert.level === 'ok' ? (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            {alert.message}
          </div>
        ))}
      </div>

      {/* Cartes de stats temps réel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Utilisateurs actifs (5 min)"
          value={runtime.active_users ?? 0}
          accent="green"
          sub={`${totals.users ?? 0} comptes au total`}
        />
        <StatCard
          icon={UserPlus}
          label="Nouveaux inscrits (7 j)"
          value={usersAnalytics.new_last_7d ?? 0}
          accent="emerald"
          sub="via l'application mobile"
        />
        <StatCard
          icon={ScanLine}
          label="Scans (24 h)"
          value={totals.scans_last_24h ?? 0}
          accent="blue"
          sub={`${totals.products ?? 0} aliments · ${totals.cosmetics ?? 0} cosmétiques en base`}
        />
        <StatCard
          icon={Clock}
          label="Uptime serveur"
          value={formatUptime(runtime.uptime_seconds)}
          accent="gray"
          sub={`${runtime.errors_total ?? 0} erreurs · ${runtime.requests_total ?? 0} requêtes (taux d'erreur ${pct(runtime.error_rate)})`}
        />
      </div>

      {/* Activité : scans, inscriptions & ajouts par jour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <ScanLine className="h-5 w-5 text-blue-500 mr-2" />
            Scans par jour (14 j)
          </h2>
          <DailyBarChart series={scansPerDay} color="bg-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <UserPlus className="h-5 w-5 text-emerald-600 mr-2" />
            Inscriptions par jour (14 j)
          </h2>
          <DailyBarChart series={usersAnalytics.signups_per_day || []} color="bg-emerald-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Package className="h-5 w-5 text-lime-600 mr-2" />
            Produits alimentaires ajoutés / jour (14 j)
          </h2>
          <DailyBarChart series={productsAnalytics.added_per_day || []} color="bg-lime-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-pink-500 mr-2" />
            Cosmétiques ajoutés / jour (14 j)
          </h2>
          <DailyBarChart series={cosmeticsAnalytics.added_per_day || []} color="bg-pink-500" />
        </div>
      </div>

      {/* Produits : distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-emerald-600 mr-2" />
            Qualité des produits en base
          </h2>
          <ScoreDistribution distribution={productsAnalytics.score_distribution} />
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-3">
              Répartition Nutri-Score
            </h3>
            <NutriScoreBar distribution={productsAnalytics.nutriscore_distribution} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            Catégories les plus fournies
          </h2>
          {topCategories.length === 0 ? (
            <p className="text-sm text-gray-400">Pas encore de données.</p>
          ) : (
            <ul className="space-y-2">
              {topCategories.map((c) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate mr-3">{c.category}</span>
                  <span className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-gray-400">{c.count} produits</span>
                    {c.avg_score != null && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.avg_score >= 50
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        moy. {c.avg_score}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Pires produits (score le plus bas)
            </h3>
            <ul className="space-y-1.5">
              {worstProducts.map((p) => (
                <li key={p.barcode} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-3">{p.product_name || p.barcode}</span>
                  <span className="font-semibold text-red-600 flex-shrink-0">
                    {p.custom_score}/100 · {(p.nutri_score || '?').toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cosmétiques : qualité + soumissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-pink-500 mr-2" />
            Qualité des cosmétiques en base
          </h2>
          <ScoreDistribution distribution={cosmeticsAnalytics.score_distribution} />
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Pires cosmétiques (score le plus bas)
            </h3>
            {worstCosmetics.length === 0 ? (
              <p className="text-sm text-gray-400">Pas encore de données.</p>
            ) : (
              <ul className="space-y-1.5">
                {worstCosmetics.map((p) => (
                  <li key={p.barcode} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate mr-3">{p.product_name || p.barcode}</span>
                    <span className="font-semibold text-red-600 flex-shrink-0">
                      {p.cosmetic_score}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Package className="h-5 w-5 text-pink-500 mr-2" />
            Soumissions cosmétiques par statut
          </h2>
          <div className="flex space-x-6">
            {['pending', 'approved', 'rejected'].map((status) => (
              <div key={status}>
                <div className="text-lg font-bold text-gray-900">{cosmeticSubmissions[status] ?? 0}</div>
                <div className="text-xs capitalize text-gray-500">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contributeurs + Signalements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            Meilleurs contributeurs
          </h2>
          {contributors.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune soumission pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {contributors.map((c, i) => (
                <li key={c.username} className="flex items-center text-sm">
                  <span className="w-6 font-semibold text-gray-400">{i + 1}</span>
                  <span className="flex-1 text-gray-700 truncate">{c.username}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {c.submissions} produit(s) soumis
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Soumissions par statut
            </h3>
            <div className="flex space-x-6">
              {['pending', 'approved', 'rejected'].map((status) => (
                <div key={status}>
                  <div className="text-lg font-bold text-gray-900">{submissions[status] ?? 0}</div>
                  <div className="text-xs capitalize text-gray-500">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Flag className="h-5 w-5 text-red-500 mr-2" />
            Signalements
          </h2>
          {reportRows.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun signalement.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 text-left">
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">En attente</th>
                  <th className="pb-2 text-right">Résolus</th>
                  <th className="pb-2 text-right">Ignorés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportRows.map((r) => (
                  <tr key={r.type}>
                    <td className="py-2 text-gray-600">{r.type}</td>
                    <td className={`py-2 text-right font-semibold ${r.pending > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {r.pending}
                    </td>
                    <td className="py-2 text-right text-emerald-600">{r.resolved}</td>
                    <td className="py-2 text-right text-gray-400">{r.ignored}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Latence + OCR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Gauge className="h-5 w-5 text-blue-500 mr-2" />
            Latence des réponses
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              ['Moyenne', latency.avg],
              ['p95', latency.p95],
              ['p99', latency.p99],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-md py-4">
                <div className="text-2xl font-bold text-gray-900">{value ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">{label} (ms)</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Échantillon : {latency.sample_size ?? 0} requêtes récentes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Taux de succès OCR
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-md py-4 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {pct(ocrRuntime.success_rate)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Live · {ocrRuntime.success ?? 0}✓ / {ocrRuntime.failure ?? 0}✗
              </div>
            </div>
            <div className="bg-gray-50 rounded-md py-4 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {pct(ocrHistory.success_rate)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Historique · {ocrHistory.attempted ?? 0} soumissions
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Durée OCR moyenne (live) : {ocrRuntime.avg_ms ?? 0} ms
          </p>
        </div>
      </div>

      {/* Top produits scannés */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            Top produits scannés (30 jours)
          </h2>
        </div>
        {topScanned.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">
            Aucun scan enregistré sur la période.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {topScanned.map((p, i) => (
              <li key={p.barcode} className="flex items-center px-6 py-3">
                <span className="w-6 text-sm font-semibold text-gray-400">{i + 1}</span>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-10 w-10 rounded object-cover bg-gray-100 mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                    <Package className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.product_name || 'Sans nom'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.brand || '—'} · {p.barcode}
                  </p>
                </div>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {p.scan_count} scans
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top cosmétiques scannés */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Sparkles className="h-5 w-5 text-pink-500 mr-2" />
            Top cosmétiques scannés (30 jours)
          </h2>
        </div>
        {topScannedCosmetics.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">
            Aucun scan enregistré sur la période.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {topScannedCosmetics.map((p, i) => (
              <li key={p.barcode} className="flex items-center px-6 py-3">
                <span className="w-6 text-sm font-semibold text-gray-400">{i + 1}</span>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-10 w-10 rounded object-cover bg-gray-100 mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                    <Sparkles className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.product_name || 'Sans nom'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.brand || '—'} · {p.barcode}
                  </p>
                </div>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  {p.scan_count} scans
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Endpoints + erreurs serveur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Endpoints les plus lents</h2>
          {slowest.length === 0 ? (
            <p className="text-sm text-gray-400">Pas encore de données.</p>
          ) : (
            <ul className="space-y-2">
              {slowest.map((e) => (
                <li key={e.path} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-600 truncate mr-3">{e.path}</span>
                  <span
                    className={`font-semibold ${
                      e.avg_ms > 1000 ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    {e.avg_ms} ms
                  </span>
                </li>
              ))}
            </ul>
          )}
          {topEndpoints.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Endpoints les plus appelés
              </h3>
              <ul className="space-y-1">
                {topEndpoints.map((e) => (
                  <li key={e.path} className="flex justify-between text-sm text-gray-600">
                    <span className="font-mono truncate mr-3">{e.path}</span>
                    <span className="text-gray-400">{e.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Server className="h-5 w-5 text-gray-500 mr-2" />
            Dernières erreurs serveur
          </h2>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-green-600">Aucune erreur récente. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {recentErrors.slice(0, 8).map((e, i) => (
                <li key={i} className="text-xs">
                  <span className="font-mono text-red-600">{e.path}</span>
                  <span className="text-gray-500"> — {e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
