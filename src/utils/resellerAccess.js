export const getResellerAccessMode = (reseller) => {
    if (!reseller) return 'none';

    if (typeof reseller.status === 'string' && reseller.status.length > 0) {
        if (reseller.status === 'active') return 'active';
        if (reseller.status === 'demo') return 'demo';
    }

    if (reseller.is_active === true) {
        return 'active';
    }

    return 'pending';
};

export const isResellerActive = (reseller) => getResellerAccessMode(reseller) === 'active';

export const isResellerDemo = (reseller) => getResellerAccessMode(reseller) === 'demo';

export const canAccessResellerArea = (reseller) => {
    const mode = getResellerAccessMode(reseller);
    return mode === 'active' || mode === 'demo';
};

export const getCatalogBasePath = (reseller) => {
    if (!reseller?.slug) return '';
    return isResellerDemo(reseller) ? `/demo/${reseller.slug}` : `/${reseller.slug}`;
};
