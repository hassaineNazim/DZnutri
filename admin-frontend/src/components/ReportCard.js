import { AlertTriangle, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';
import { initialsFor } from './AdminUI';

const formatDate = (value) => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date inconnue'
    : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const ReportCard = ({ report, onResolve, onIgnore, loading, image, hideDetails = false, product }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isAuto = report.type === 'automatiqueReport';
  const isScoring = report.type === 'scoringReport';
  const userLabel = report.username?.trim()
    || (report.user_id ? `Utilisateur #${report.user_id}` : 'Utilisateur');
  const productTitle = product?.product_name
    ? `${product.product_name}${product.brand ? ` · ${product.brand}` : ''}`
    : report.barcode ? `Produit ${report.barcode}` : 'Produit inconnu';

  return (
    <article className="report-card">
      <div className="report-card-main">
        {!isAuto && <div className="report-user-avatar" aria-hidden="true">{initialsFor(userLabel)}</div>}

        <div className="report-copy">
          <div className="report-topline">
            {isAuto ? (
              <span className="report-auto-badge"><AlertTriangle size={13} /> AUTO</span>
            ) : (
              <>
                <strong>{userLabel}</strong>
                <span className="admin-status-badge admin-status-soft">{isScoring ? 'SCORE CONTESTÉ' : 'PROBLÈME SIGNALÉ'}</span>
              </>
            )}
            <span className="report-date">{formatDate(report.created_at)}</span>
          </div>

          <h2 className="report-title">{productTitle}</h2>
          <p className="report-description">
            {!isAuto ? '« ' : ''}{report.description || 'Aucune description fournie.'}{!isAuto ? ' »' : ''}
          </p>
          {isAuto && <div className="admin-chip-row"><span className="admin-chip mono">ID {report.id}</span></div>}
        </div>

        {isAuto && (image ? (
          <img src={image} alt={product?.product_name || 'Produit signalé'} className="report-thumb" />
        ) : (
          <div className="report-thumb report-thumb-placeholder">Image non disponible</div>
        ))}
      </div>

      {showDetails && !hideDetails && (
        <div className="report-details">
          <span className="admin-field-label">Code-barres</span>
          <span className="admin-chip mono">{report.barcode || 'Non renseigné'}</span>
          {report.image_url && (
            <div style={{ marginTop: 14 }}>
              <span className="admin-field-label">Pièce jointe</span>
              <img src={report.image_url} alt="Pièce jointe du signalement" className="report-thumb" />
            </div>
          )}
        </div>
      )}

      <footer className="admin-card-footer">
        {!hideDetails ? (
          <button className="admin-details-button" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails}>
            {showDetails ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            {showDetails ? 'Moins de détails' : 'Plus de détails'}
          </button>
        ) : <span />}

        {report.status === 'pending' && (
          <div className="admin-card-actions">
            <button className="admin-primary-button" onClick={() => onResolve(report)} disabled={loading}>
              <Check size={17} /> {isAuto ? 'Traiter' : 'Résoudre'}
            </button>
            <button className="admin-outline-button" onClick={() => onIgnore(report)} disabled={loading}>
              <X size={17} /> Ignorer
            </button>
          </div>
        )}
      </footer>
    </article>
  );
};

export default ReportCard;
