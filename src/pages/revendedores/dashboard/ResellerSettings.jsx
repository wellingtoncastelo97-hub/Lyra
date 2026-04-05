import React, { useState } from 'react';
import { Save, Copy, ExternalLink, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useReseller } from '../../../context/ResellerContext';

const RESERVED_SLUGS = [
    'loja', 'admin', 'revendedores', 'checkout', 'sobre',
    'contacto', 'colecoes', 'politicas', 'produto', 'api',
    'explicacao', 'beneficios', 'pagamento', 'order-confirmation'
];

const ResellerSettings = () => {
    const { reseller, refetchProfile } = useReseller();

    const [form, setForm] = useState({
        full_name: reseller?.full_name || '',
        slug: reseller?.slug || '',
        whatsapp: reseller?.whatsapp || '',
        bio: reseller?.bio || '',
        catalog_title: reseller?.catalog_title || '',
        avatar_url: reseller?.avatar_url || '',
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [slugError, setSlugError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSaved(false);
        if (name === 'slug') setSlugError(null);
    };

    const validateSlug = (slug) => {
        if (!slug || slug.length < 3) return 'O slug deve ter pelo menos 3 caracteres.';
        if (!/^[a-z0-9-]+$/.test(slug)) return 'Use apenas letras minúsculas, números e hífens.';
        if (RESERVED_SLUGS.includes(slug)) return 'Este nome está reservado. Escolha outro.';
        return null;
    };

    const handleSlugChange = (e) => {
        const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
        setForm(prev => ({ ...prev, slug: raw }));
        setSlugError(null);
        setSaved(false);
    };

    const handleSave = async () => {
        setError(null);
        setSaved(false);

        const slugErr = validateSlug(form.slug);
        if (slugErr) {
            setSlugError(slugErr);
            return;
        }

        setSaving(true);

        // Check slug uniqueness
        if (form.slug !== reseller.slug) {
            const { data: existing } = await supabase
                .from('resellers')
                .select('id')
                .eq('slug', form.slug)
                .neq('id', reseller.id)
                .single();

            if (existing) {
                setSlugError('Este slug já está em uso. Escolha outro.');
                setSaving(false);
                return;
            }
        }

        const { error: updateError } = await supabase
            .from('resellers')
            .update({
                full_name: form.full_name,
                slug: form.slug,
                whatsapp: form.whatsapp,
                bio: form.bio,
                catalog_title: form.catalog_title,
                avatar_url: form.avatar_url,
            })
            .eq('id', reseller.id);

        if (updateError) {
            setError('Erro ao guardar. Tente novamente.');
        } else {
            setSaved(true);
            refetchProfile();
        }
        setSaving(false);
    };

    const catalogUrl = `${window.location.origin}/${form.slug || reseller?.slug || ''}`;

    return (
        <>
            <div className="reseller-topbar">
                <h1>Perfil e Catálogo</h1>
            </div>

            <div className="rs-settings-grid">
                {/* Profile Section */}
                <div className="rs-settings-card">
                    <h3>Dados Pessoais</h3>

                    <div className="rs-form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            name="full_name"
                            value={form.full_name}
                            onChange={handleChange}
                            placeholder="O seu nome"
                        />
                    </div>

                    <div className="rs-form-group">
                        <label>WhatsApp (com indicativo)</label>
                        <input
                            type="text"
                            name="whatsapp"
                            value={form.whatsapp}
                            onChange={handleChange}
                            placeholder="351912345678"
                        />
                        <span className="rs-form-hint">Os clientes usam este número para contactá-la pelo botão "Falar com Consultora".</span>
                    </div>

                    <div className="rs-form-group">
                        <label>URL do Avatar</label>
                        <input
                            type="url"
                            name="avatar_url"
                            value={form.avatar_url}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                        {form.avatar_url && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <img src={form.avatar_url} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                        )}
                    </div>

                    <div className="rs-form-group">
                        <label>Sobre mim (bio)</label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            placeholder="Uma breve descrição sobre si..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Catalog Section */}
                <div className="rs-settings-card">
                    <h3>Personalização do Catálogo</h3>

                    <div className="rs-form-group">
                        <label>Título do Catálogo</label>
                        <input
                            type="text"
                            name="catalog_title"
                            value={form.catalog_title}
                            onChange={handleChange}
                            placeholder={`${form.full_name || 'Seu Nome'} — Consultora LYRA`}
                        />
                        <span className="rs-form-hint">Aparece no topo do seu catálogo. Deixe vazio para usar o padrão.</span>
                    </div>

                    <div className="rs-form-group">
                        <label>Slug do Catálogo (URL)</label>
                        <div className="rs-slug-input">
                            <span className="rs-slug-prefix">{window.location.origin}/</span>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={handleSlugChange}
                                placeholder="seu-nome"
                            />
                        </div>
                        {slugError && (
                            <span className="rs-form-error"><AlertCircle size={14} /> {slugError}</span>
                        )}
                        <span className="rs-form-hint">Este é o link que partilha com os seus clientes.</span>
                    </div>

                    {/* Link Preview */}
                    <div className="rs-catalog-preview">
                        <h4>O seu link:</h4>
                        <div className="rs-catalog-link">
                            <code>{catalogUrl}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(catalogUrl);
                                    alert('Link copiado!');
                                }}
                                className="rs-btn-icon"
                                title="Copiar link"
                            >
                                <Copy size={16} />
                            </button>
                            <a
                                href={catalogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rs-btn-icon"
                                title="Abrir catálogo"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="rs-settings-actions">
                {error && <span className="rs-form-error">{error}</span>}
                {saved && <span className="rs-form-success">Alterações guardadas com sucesso!</span>}
                <button className="rp-btn rp-btn-primary" onClick={handleSave} disabled={saving}>
                    <Save size={16} /> {saving ? 'A guardar...' : 'Guardar Alterações'}
                </button>
            </div>
        </>
    );
};

export default ResellerSettings;
