import { Edit3, Image, Search, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cosmeticsAPI } from '../api/cosmetics';
import { getCosmeticCategoryLabel, optionsWithLegacyValue } from '../constants/cosmeticCategories';
import { PageHeader, StatePanel, StatusBadge } from './AdminUI';
import { useToast } from './Toast';

const CosmeticSubmissionCard = ({ submission, onDone }) => {
  const toast = useToast();
  const [name, setName] = useState(submission.product_name || '');
  const [brand, setBrand] = useState(submission.brand || '');
  const [category, setCategory] = useState(submission.category || '');
  const [ingredients, setIngredients] = useState(submission.ocr_ingredients_text || '');
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    if (!name.trim()) return toast.error('Le nom du produit est requis');
    setBusy(true);
    try {
      await cosmeticsAPI.approveSubmission(submission.id, {
        product_name: name.trim(), brand: brand.trim() || null,
        category: category.trim() || null, ingredients_text: ingredients.trim() || null,
      });
      toast.success('Cosmétique approuvé et publié');
      onDone(submission.id);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Erreur lors de l'approbation");
    } finally { setBusy(false); }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await cosmeticsAPI.rejectSubmission(submission.id);
      toast.info('Soumission rejetée');
      onDone(submission.id);
    } catch (error) {
      toast.error('Erreur lors du rejet');
    } finally { setBusy(false); }
  };

  return (
    <article className="cosmetic-card">
      <div className="report-topline">
        <StatusBadge tone="soft">Soumission #{submission.id}</StatusBadge>
        <span className="report-date">{submission.barcode}</span>
        {submission.submitted_at && <span className="report-date">{new Date(submission.submitted_at).toLocaleString('fr-FR')}</span>}
      </div>
      <div className="cosmetic-form-grid" style={{ marginTop: 18 }}>
        <div className="cosmetic-images">
          {[submission.image_front_url, submission.image_back_url].filter(Boolean).map((source, index) => (
            <img key={source} src={source} alt={index === 0 ? 'Produit vu de face' : 'Produit vu de dos'} />
          ))}
          {!submission.image_front_url && !submission.image_back_url && (
            <div className="cosmetic-image-placeholder"><Image size={26} /><span>Aucune photo</span></div>
          )}
        </div>
        <div className="admin-field-stack">
          <input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom du produit *" />
          <input className="admin-input" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Marque" />
          <select className="admin-input" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Catégorie">
            <option value="">Aucune catégorie</option>
            {optionsWithLegacyValue(category).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>
      <label className="admin-field-label" style={{ marginTop: 16 }}>Ingrédients (INCI) — corrigez le texte OCR si nécessaire</label>
      <textarea className="admin-textarea" rows={4} value={ingredients} onChange={(event) => setIngredients(event.target.value)} placeholder="Liste des ingrédients…" />
      <div className="admin-card-actions" style={{ marginTop: 16 }}>
        <button type="button" className="admin-danger-outline-button" disabled={busy} onClick={reject}>Rejeter</button>
        <button type="button" className="admin-success-button" disabled={busy} onClick={approve}>Approuver et publier</button>
      </div>
    </article>
  );
};

const ProductEditor = ({ product, onClose, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState(product);
  const [saving, setSaving] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await cosmeticsAPI.updateProduct(product.barcode, {
        product_name: form.product_name?.trim() || null,
        brand: form.brand?.trim() || null,
        category: form.category?.trim() || null,
        image_url: form.image_url?.trim() || null,
        ingredients_text: form.ingredients_text?.trim() || null,
      });
      toast.success('Cosmétique mis à jour et score recalculé');
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Impossible de mettre à jour le cosmétique');
    } finally { setSaving(false); }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="admin-modal-card" onSubmit={save}>
        <div className="admin-modal-heading">
          <div><div className="admin-eyebrow">Catalogue</div><h2>Modifier le cosmétique</h2></div>
          <button type="button" className="admin-outline-button" onClick={onClose}>Fermer</button>
        </div>
        <div className="admin-field-stack">
          <label><span className="admin-field-label">Nom</span><input className="admin-input" value={form.product_name || ''} onChange={update('product_name')} /></label>
          <label><span className="admin-field-label">Marque</span><input className="admin-input" value={form.brand || ''} onChange={update('brand')} /></label>
          <label><span className="admin-field-label">Catégorie</span><select className="admin-input" value={form.category || ''} onChange={update('category')}>
            <option value="">Aucune catégorie</option>
            {optionsWithLegacyValue(form.category).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
          <label><span className="admin-field-label">URL de l’image</span><input className="admin-input" value={form.image_url || ''} onChange={update('image_url')} /></label>
          <label><span className="admin-field-label">Ingrédients (INCI)</span><textarea className="admin-textarea" rows={6} value={form.ingredients_text || ''} onChange={update('ingredients_text')} /></label>
        </div>
        <div className="admin-card-actions" style={{ marginTop: 18 }}>
          <button type="button" className="admin-outline-button" onClick={onClose}>Annuler</button>
          <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
};

const CosmeticSubmissions = () => {
  const toast = useToast();
  const [view, setView] = useState('catalog');
  const [products, setProducts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalog, pending] = await Promise.all([
        cosmeticsAPI.getProducts(query), cosmeticsAPI.getSubmissions('pending'),
      ]);
      setProducts(catalog || []);
      setSubmissions(pending.submissions || []);
    } catch (requestError) {
      setError('Impossible de charger les données cosmétiques.');
    } finally { setLoading(false); }
  }, [query]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  const editProduct = async (product) => {
    setEditorLoading(true);
    try { setEditing(await cosmeticsAPI.getProduct(product.barcode)); }
    catch (error) { toast.error('Impossible de charger la fiche cosmétique'); }
    finally { setEditorLoading(false); }
  };

  const onSaved = (saved) => {
    setProducts((current) => current.map((item) => item.barcode === saved.barcode ? { ...item, ...saved } : item));
    setEditing(null);
  };

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Base de données"
        title="Produits"
        accent="cosmétiques"
        aside={(
          <>
            <div className="admin-segmented" role="group" aria-label="Vue cosmétiques">
              <button className={view === 'catalog' ? 'active' : ''} onClick={() => setView('catalog')}>Catalogue</button>
              <button className={view === 'pending' ? 'active' : ''} onClick={() => setView('pending')}>Soumissions</button>
            </div>
            <StatusBadge tone={view === 'pending' ? 'yellow' : 'burgundy'}>{view === 'pending' ? `${submissions.length} en attente` : `${products.length} produits`}</StatusBadge>
          </>
        )}
      />

      {view === 'catalog' && (
        <label className="admin-search-field">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom, marque ou code-barres…" />
        </label>
      )}

      {loading ? <StatePanel loading>Chargement des cosmétiques…</StatePanel> : error ? (
        <div className="admin-error-panel">{error}</div>
      ) : view === 'pending' ? (
        submissions.length === 0 ? <StatePanel>Aucune soumission cosmétique en attente.</StatePanel> : (
          <div className="submission-list">{submissions.map((submission) => (
            <CosmeticSubmissionCard key={submission.id} submission={submission} onDone={(id) => setSubmissions((current) => current.filter((item) => item.id !== id))} />
          ))}</div>
        )
      ) : products.length === 0 ? <StatePanel>Aucun cosmétique trouvé.</StatePanel> : (
        <div className="admin-table-shell">
          <table className="admin-table cosmetic-table">
            <thead><tr><th>Produit</th><th>Marque</th><th>Catégorie</th><th>Score</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product.barcode}>
                <td><div className="cosmetic-product-cell">
                  {product.image_url ? <img src={product.image_url} alt="" /> : <span className="cosmetic-table-placeholder"><Sparkles size={18} /></span>}
                  <div><strong>{product.product_name || 'Sans nom'}</strong><small>{product.barcode}</small></div>
                </div></td>
                <td>{product.brand || '—'}</td><td>{getCosmeticCategoryLabel(product.category) || '—'}</td>
                <td><StatusBadge tone={product.cosmetic_score >= 50 ? 'soft' : 'red'}>{product.cosmetic_score ?? '—'}/100</StatusBadge></td>
                <td style={{ textAlign: 'right' }}><button className="admin-table-action" disabled={editorLoading} onClick={() => editProduct(product)}><Edit3 size={15} /> Modifier</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </div>
  );
};

export default CosmeticSubmissions;
