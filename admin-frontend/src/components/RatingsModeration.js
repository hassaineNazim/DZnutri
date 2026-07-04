import { Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../api/auth';
import { useToast } from './Toast';

const Stars = ({ value }) => (
  <span className="inline-flex">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
      />
    ))}
  </span>
);

const RatingsModeration = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsOnly, setCommentsOnly] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/admin/ratings?with_comments_only=${commentsOnly}`);
      setRatings(resp.data.ratings || []);
    } catch (e) {
      setError('Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [commentsOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return;
    try {
      await api.delete(`/api/admin/ratings/${id}`);
      setRatings((prev) => prev.filter((r) => r.id !== id));
      toast.success('Avis supprimé');
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Avis des utilisateurs</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={commentsOnly}
            onChange={(e) => setCommentsOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Avec commentaire uniquement
        </label>
      </div>

      {ratings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          Aucun avis à modérer 🎉
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {ratings.map((r) => (
            <div key={r.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900">{r.username}</span>
                  <Stars value={r.rating} />
                  <span className="text-xs text-gray-400 font-mono">{r.barcode}</span>
                  {r.created_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-1 break-words">{r.comment}</p>
                )}
              </div>
              <button
                onClick={() => remove(r.id)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 flex-shrink-0"
                title="Supprimer cet avis"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingsModeration;
