import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const isDev = import.meta.env.DEV;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || (isDev ? 'lyra2024' : '');

const AdminLogin = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!ADMIN_PASSWORD) {
            setError('A password de admin ainda nao foi configurada para este ambiente.');
            return;
        }

        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('lyra_admin_auth', 'true');
            localStorage.setItem('lyra_admin_secret', password);
            onLogin();
        } else {
            setError('Palavra-passe incorreta');
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <h1>LYRA</h1>
                <p>Painel de Administração</p>

                {error && <div className="admin-login-error">{error}</div>}
                {!ADMIN_PASSWORD && (
                    <div className="admin-login-error">
                        Defina <code>VITE_ADMIN_PASSWORD</code> antes de usar o admin em producao.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label>Palavra-passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="Introduza a palavra-passe"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary">
                        <Lock size={16} />
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
