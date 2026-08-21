import { AlertCircle, Eye, EyeOff, Leaf } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.login(username, password);
      const user = authAPI.getUser();
      if (!user?.is_admin) {
        authAPI.logout();
        setError('Accès refusé : un compte administrateur est requis.');
        return;
      }
      navigate('/');
    } catch (requestError) {
      if (requestError.response?.status === 401) setError('Identifiant ou mot de passe incorrect.');
      else if (requestError.response?.status === 403) setError('Accès refusé : un compte administrateur est requis.');
      else setError(requestError.response?.data?.detail || 'Connexion impossible. Réessayez dans un instant.');
    } finally { setLoading(false); }
  };

  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark"><Leaf size={26} /></span>
          <span><span className="admin-brand-name">Remo Scan</span><span className="admin-brand-subtitle" style={{ display: 'block' }}>ADMIN</span></span>
        </div>
        <h1 className="admin-login-title">Espace administrateur</h1>
        <p className="admin-login-subtitle">Connectez-vous pour modérer les produits et suivre la plateforme.</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label><span className="admin-field-label">Identifiant</span><input className="admin-input" required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Votre identifiant" /></label>
          <label><span className="admin-field-label">Mot de passe</span><span className="admin-login-password"><input className="admin-input" required autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
          {error && <div className="admin-error-panel admin-login-error"><AlertCircle size={19} /> <span>{error}</span></div>}
          <button className="admin-primary-button admin-login-submit" type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        </form>
      </section>
    </main>
  );
};

export default Login;
