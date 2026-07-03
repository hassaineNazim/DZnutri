import { useCallback, useEffect, useState } from 'react';
import { cosmeticsAPI } from '../api/cosmetics';
import { useToast } from './Toast';

const CosmeticSubmissionCard = ({ submission, onDone }) => {
  const toast = useToast();
  const [name, setName] = useState(submission.product_name || '');
  const [brand, setBrand] = useState(submission.brand || '');
  const [category, setCategory] = useState(submission.category || '');
  const [ingredients, setIngredients] = useState(submission.ocr_ingredients_text || '');
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    if (!name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }
    setBusy(true);
    try {
      await cosmeticsAPI.approveSubmission(submission.id, {
        product_name: name.trim(),
        brand: brand.trim() || null,
        category: category.trim() || null,
        ingredients_text: ingredients.trim() || null,
      });
      toast.success('Cosmétique approuvé et publié');
      onDone(submission.id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'approbation");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await cosmeticsAPI.rejectSubmission(submission.id);
      toast.info('Soumission rejetée');
      onDone(submission.id);
    } catch (e) {
      toast.error('Erreur lors du rejet');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-400 font-mono">
            #{submission.id} · {submission.barcode}
          </p>
          {submission.submitted_at && (
            <p className="text-xs text-gray-400">
              {new Date(submission.submitted_at).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-3">
          {submission.image_front_url && (
            <img
              src={submission.image_front_url}
              alt="avant"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          )}
          {submission.image_back_url && (
            <img
              src={submission.image_back_url}
              alt="dos"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>

        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du produit *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-400 outline-none"
          />
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Marque"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-400 outline-none"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Catégorie (ex: soin visage)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-400 outline-none"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold text-gray-500">
          Ingrédients (INCI) — lus par OCR, corrigez si besoin (le score en dépend)
        </label>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-pink-400 outline-none"
          placeholder="Liste des ingrédients..."
        />
      </div>

      <div className="flex gap-3 mt-4 justify-end">
        <button
          disabled={busy}
          onClick={reject}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50"
        >
          Rejeter
        </button>
        <button
          disabled={busy}
          onClick={approve}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-sm font-medium disabled:opacity-50"
        >
          Approuver &amp; publier
        </button>
      </div>
    </div>
  );
};

const CosmeticSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cosmeticsAPI.getSubmissions('pending');
      setSubmissions(data.submissions || []);
    } catch (e) {
      setError('Impossible de charger les soumissions cosmétiques.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDone = (id) => setSubmissions((prev) => prev.filter((s) => s.id !== id));

  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Soumissions cosmétiques</h1>
        <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {submissions.length} en attente
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          Aucune soumission cosmétique en attente 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <CosmeticSubmissionCard key={s.id} submission={s} onDone={handleDone} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CosmeticSubmissions;
