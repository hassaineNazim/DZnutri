import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Package,
  RefreshCw,
  ScanLine,
  Server,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { monitoringAPI } from '../api/monitoring';

const REFRESH_MS = 10000;

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

const Monitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

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
  const slowest = runtime.slowest_endpoints || [];
  const topEndpoints = runtime.top_endpoints || [];
  const recentErrors = runtime.recent_errors || [];
  const submissions = totals.submissions_by_status || {};

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="h-7 w-7 text-blue-600 mr-2" />
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
          icon={ScanLine}
          label="Scans (24 h)"
          value={totals.scans_last_24h ?? 0}
          accent="blue"
          sub={`${totals.products ?? 0} produits en base`}
        />
        <StatCard
          icon={Server}
          label="Requêtes traitées"
          value={runtime.requests_total ?? 0}
          accent="indigo"
          sub={`Taux d'erreur ${pct(runtime.error_rate)}`}
        />
        <StatCard
          icon={Clock}
          label="Uptime serveur"
          value={formatUptime(runtime.uptime_seconds)}
          accent="gray"
          sub={`${runtime.errors_total ?? 0} erreurs serveur`}
        />
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

      {/* Endpoints + Soumissions */}
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Soumissions par statut</h2>
          <div className="space-y-3">
            {['pending', 'approved', 'rejected'].map((status) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-600">{status}</span>
                <span className="text-lg font-bold text-gray-900">
                  {submissions[status] ?? 0}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Dernières erreurs serveur
            </h3>
            {recentErrors.length === 0 ? (
              <p className="text-sm text-green-600">Aucune erreur récente. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {recentErrors.slice(0, 5).map((e, i) => (
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
    </div>
  );
};

export default Monitoring;
