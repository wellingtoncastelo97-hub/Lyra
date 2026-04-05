export const parseMoney = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const normalized = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : 0;
};

export const roundMoney = (value) => Math.round(parseMoney(value) * 100) / 100;

export const formatCurrency = (value) => `${roundMoney(value).toFixed(2).replace('.', ',')} €`;

export const getSupplierCost = (product = {}) => roundMoney(product.cost_price);

export const getRetailPrice = (product = {}) => {
    const retail = roundMoney(product.price);
    if (retail > 0) return retail;

    const lyraCost = getLyraResellerCost(product);
    if (lyraCost > 0) return roundMoney(lyraCost * 1.35);

    return 0;
};

export const deriveLyraResellerCost = (supplierCost, retailPrice) => {
    const supplier = roundMoney(supplierCost);
    const retail = roundMoney(retailPrice);

    if (retail <= 0 && supplier <= 0) return 0;
    if (retail <= 0) return roundMoney(supplier * 1.25);
    if (supplier <= 0) return roundMoney(retail * 0.6);
    if (retail <= supplier) return retail;

    return roundMoney(supplier + (retail - supplier) * 0.5);
};

export const getLyraResellerCost = (product = {}) => {
    const explicit = roundMoney(product.suggested_price);
    if (explicit > 0) return explicit;
    return deriveLyraResellerCost(getSupplierCost(product), getRetailPrice(product));
};

export const getSalePrice = (product = {}, resellerProduct = null) => {
    const custom = resellerProduct?.custom_price ?? product.custom_price;
    if (parseMoney(custom) > 0) return roundMoney(custom);
    return getRetailPrice(product);
};

export const calculateUnitMargins = ({
    supplierCost = 0,
    lyraCost = 0,
    salePrice = 0,
} = {}) => {
    const supplier = roundMoney(supplierCost);
    const lyra = roundMoney(lyraCost);
    const sale = roundMoney(salePrice);

    const lyraProfit = roundMoney(lyra - supplier);
    const resellerProfit = roundMoney(sale - lyra);
    const grossProfit = roundMoney(sale - supplier);

    return {
        supplierCost: supplier,
        lyraCost: lyra,
        salePrice: sale,
        lyraProfit,
        resellerProfit,
        grossProfit,
    };
};

export const calculateLineMargins = ({
    supplierCost = 0,
    lyraCost = 0,
    salePrice = 0,
    quantity = 1,
} = {}) => {
    const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const unit = calculateUnitMargins({ supplierCost, lyraCost, salePrice });

    return {
        quantity: qty,
        unit,
        supplierTotal: roundMoney(unit.supplierCost * qty),
        lyraTotal: roundMoney(unit.lyraCost * qty),
        saleTotal: roundMoney(unit.salePrice * qty),
        lyraProfitTotal: roundMoney(unit.lyraProfit * qty),
        resellerProfitTotal: roundMoney(unit.resellerProfit * qty),
        grossProfitTotal: roundMoney(unit.grossProfit * qty),
    };
};
