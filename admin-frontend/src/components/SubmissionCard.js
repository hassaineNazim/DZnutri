import { Check, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';

const STATUS_LABELS = { pending: 'EN ATTENTE', approved: 'APPROUVÉ', rejected: 'REJETÉ' };

const validImageUrl = (path) => (typeof path === 'string' && /^https?:\/\//i.test(path) ? path : null);

const formatDate = (value) => {
  if (!value) return 'date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'date inconnue' : date.toLocaleDateString('fr-FR');
};

const SubmissionCard = ({ submission, onApprove, onReject, loading }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const frontImage = validImageUrl(submission.image_front_url);
  const category = submission.typeSpecifique || submission.typeProduct;

  const detailImage = (url, alt, emptyLabel) => (
    <div className="submission-detail-image">
      {validImageUrl(url) ? (
        <button onClick={() => setFullscreenImage(url)} aria-label={`Agrandir ${alt}`}>
          <img src={url} alt={alt} />
        </button>
      ) : (
        <span className="text-sm text-[#8B8073]">{emptyLabel}</span>
      )}
    </div>
  );

  return (
    <article className="submission-card">
      <div className="submission-card-main">
        {frontImage ? (
          <button onClick={() => setFullscreenImage(frontImage)} aria-label="Agrandir la photo du produit">
            <img src={frontImage} alt={submission.productName || 'Produit'} className="submission-thumb" />
          </button>
        ) : (
          <div className="submission-thumb submission-thumb-placeholder" aria-label="Image non disponible">
            <ImageIcon size={24} />
          </div>
        )}

        <div className="submission-content">
          <h2 className="submission-title">
            {submission.productName || 'Produit sans nom'}
            <span className="submission-status">{STATUS_LABELS[submission.status] || submission.status}</span>
          </h2>
          <div className="submission-meta">
            {submission.brand || 'Marque inconnue'} · soumis le {formatDate(submission.submitted_at)}
          </div>
          <div className="admin-chip-row">
            <span className="admin-chip mono">{submission.barcode || 'Sans code-barres'}</span>
            {category && <span className="admin-chip">{category}</span>}
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="submission-details">
          <label className="admin-field-label" htmlFor={`ocr-${submission.id}`}>Texte détecté par OCR</label>
          <textarea
            id={`ocr-${submission.id}`}
            readOnly
            rows={5}
            value={submission.ocr_ingredients_text || 'Aucun texte détecté.'}
          />
          <div className="submission-details-grid">
            <div>
              <span className="admin-field-label">Photo des ingrédients</span>
              {detailImage(submission.image_ingredients_url, 'Liste des ingrédients', 'Non fournie')}
            </div>
            <div>
              <span className="admin-field-label">Tableau nutritionnel</span>
              {detailImage(submission.image_nutrition_url, 'Tableau nutritionnel', 'Non fourni')}
            </div>
          </div>
        </div>
      )}

      <footer className="admin-card-footer">
        <button className="admin-details-button" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails}>
          {showDetails ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          {showDetails ? 'Moins de détails' : 'Plus de détails'}
        </button>

        {submission.status === 'pending' && (
          <div className="admin-card-actions">
            <button className="admin-success-button" onClick={() => onApprove(submission)} disabled={loading}>
              <Check size={17} /> Approuver
            </button>
            <button className="admin-danger-outline-button" onClick={() => onReject(submission.id)} disabled={loading}>
              <X size={17} /> Rejeter
            </button>
          </div>
        )}
      </footer>

      {fullscreenImage && (
        <button className="admin-image-lightbox" onClick={() => setFullscreenImage(null)} aria-label="Fermer l’image agrandie">
          <img src={fullscreenImage} alt="Agrandissement du produit" />
        </button>
      )}
    </article>
  );
};

export default SubmissionCard;
