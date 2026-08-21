import { Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../api/auth';
import { initialsFor, PageHeader, StatePanel, StatusBadge } from './AdminUI';
import { useToast } from './Toast';

const Stars = ({ value }) => (
  <span className="rating-stars" aria-label={`${value} étoiles sur 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} size={17} fill={star <= value ? '#f2c22e' : 'transparent'} color={star <= value ? '#f2c22e' : '#d7c8af'} />
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
      const response = await api.get(`/api/admin/ratings?with_comments_only=${commentsOnly}`);
      setRatings(response.data.ratings || []);
    } catch (requestError) {
      setError('Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [commentsOnly]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return;
    try {
      await api.delete(`/api/admin/ratings/${id}`);
      setRatings((previous) => previous.filter((rating) => rating.id !== id));
      toast.success('Avis supprimé');
    } catch (requestError) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Retours de la communauté"
        title="Avis"
        accent="utilisateurs"
        aside={(
          <>
            <label className="admin-checkbox">
              <input type="checkbox" checked={commentsOnly} onChange={(event) => setCommentsOnly(event.target.checked)} />
              Avec commentaire uniquement
            </label>
            <StatusBadge>{ratings.length} avis</StatusBadge>
          </>
        )}
      />

      {loading ? <StatePanel loading>Chargement des avis…</StatePanel> : error ? (
        <div className="admin-error-panel">{error}</div>
      ) : ratings.length === 0 ? (
        <StatePanel>Aucun avis à modérer.</StatePanel>
      ) : (
        <div className="rating-list">
          {ratings.map((rating) => (
            <article key={rating.id} className="rating-card">
              <div className="rating-avatar">{initialsFor(rating.username || 'Utilisateur')}</div>
              <div className="rating-content">
                <div className="rating-topline">
                  <span className="rating-user">{rating.username || 'Utilisateur'}</span>
                  <Stars value={rating.rating} />
                  <span className="report-date">{rating.barcode}</span>
                  {rating.created_at && <span className="report-date">{new Date(rating.created_at).toLocaleString('fr-FR')}</span>}
                </div>
                {rating.comment && <p className="rating-comment">{rating.comment}</p>}
              </div>
              <button type="button" onClick={() => remove(rating.id)} className="rating-delete" title="Supprimer cet avis">
                <Trash2 size={19} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingsModeration;
