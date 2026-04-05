import { createClient } from '@supabase/supabase-js';
import http from 'http';
import https from 'https';
import { deriveLyraResellerCost, roundMoney } from '../src/utils/finance.js';

const SUPABASE_URL = 'https://cpveybfypwiqaefcvqoo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_FALLBACK_KEY =
    process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n8jik7EPV5QVTahIyNIB0A_RgXtwEW1';
const SUPABASE_WRITE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_FALLBACK_KEY;

const DREAMLOVE_SOURCE_URL =
    process.env.DREAMLOVE_SOURCE_URL ||
    'https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_55_125_2_206b68c6599e190d0042493122d3fb63_csv.zip';
const DREAMLOVE_CSV_URL = normalizeDreamloveSourceUrl(DREAMLOVE_SOURCE_URL);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 200);

if (!SUPABASE_WRITE_KEY) {
    console.error('Missing a Supabase write key. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.');
    process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
    console.warn('Using the publishable Supabase key as fallback. Service role is still recommended for full syncs.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_WRITE_KEY);

const SEGMENT_TRANSLATIONS = {
    '100% waterproof': '100% Impermeaveis',
    accessories: 'Acessorios',
    'accessories for the penis': 'Acessorios para o Penis',
    'air stimulator without vibration': 'Estimuladores de Ar sem Vibracao',
    anal: 'Anal',
    'anal dildos': 'Dildos Anais',
    'anal with relaxant': 'Anal com Relaxante',
    'anal vibrators': 'Vibradores Anais',
    'assorted items': 'Itens Diversos',
    'balls, eggs and bullets': 'Balas e Ovos Vibratorios',
    board: 'Tabuleiro',
    'board games': 'Jogos de Tabuleiro',
    bondage: 'Bondage',
    bra: 'Sutia',
    'brazilian balls': 'Bolinhas Brasileiras',
    category: 'Categoria',
    condoms: 'Preservativos',
    costumes: 'Fantasia',
    'card games': 'Jogos de Cartas',
    'classic anal or vaginal vibrators': 'Vibradores Anais ou Vaginais Classicos',
    'dice game': 'Jogos de Dados',
    'dildos without vibration': 'Dildos sem Vibracao',
    'double penises': 'Dildos Duplos',
    'drinking bottles': 'Garrafas',
    'edible lingerie': 'Lingerie Comestivel',
    'erotic bookstore': 'Livraria Erotica',
    'fashion & lingerie': 'Moda e Lingerie',
    flavors: 'Sabores',
    foreplays: 'Preliminares',
    'for breasts': 'Para os Seios',
    'for massages': 'Massagem',
    'for the bathroom': 'Banho',
    'for women': 'Para Mulheres',
    'for your g-spot': 'Para o Ponto G',
    'fun items': 'Itens Divertidos',
    games: 'Jogos',
    'games for couples': 'Jogos para Casais',
    hands: 'Masturbacao Manual',
    'hi-tech vibrators': 'Vibradores High-Tech',
    'hot effect': 'Efeito Quente',
    'hygienic tampon': 'Tampao Higienico',
    incenses: 'Incensos',
    'inflatable dolls': 'Bonecas Insuflaveis',
    'kit sex toys': 'Kits Eroticos',
    'latex free': 'Sem Latex',
    'lay-on clitoral vibrators': 'Vibradores Clitorianos de Contato',
    lovetoys: 'Brinquedos Eroticos',
    lubes: 'Lubrificantes',
    'massage creams': 'Cremes de Massagem',
    'massage kits': 'Kits de Massagem',
    'menstrual cup': 'Copo Menstrual',
    'men’s underwear': 'Roupa Interior Masculina',
    "men's pheromone perfumes": 'Perfumes com Feromonas Masculinos',
    "men's t-shirts": 'T-Shirts Masculinas',
    mini: 'Mini',
    'mini vibrators': 'Mini Vibradores',
    monodose: 'Monodose',
    'organic bio': 'Organico e Bio',
    'orgasm intensifier': 'Intensificador de Orgasmo',
    'party games': 'Jogos de Festa',
    'penis enlarger pump': 'Bombas para Aumento Peniano',
    pheromone: 'Feromonas',
    'pheromone perfumes': 'Perfumes com Feromonas',
    plugs: 'Plugs',
    'prolonged pleasure range': 'Prazer Prolongado',
    'rabbit vibrators': 'Vibradores Rabbit',
    'realistic penises': 'Penises Realistas',
    'remote control': 'Controlo Remoto',
    'rotators and vibrators': 'Rotativos e Vibradores',
    sashes: 'Faixas',
    'sex drugstore': 'Cosmetica Intima',
    'sex toys for men': 'Brinquedos para Homens',
    'sexy dresses': 'Vestidos Sensuais',
    'sexy lingerie': 'Lingerie Sexy',
    'silicone-based': 'Base de Silicone',
    'single farewell games': 'Jogos para Despedida',
    socks: 'Meias',
    'sm & bondage': 'BDSM e Bondage',
    'spicy lingerie': 'Lingerie Ousada',
    'strap-on': 'Strap-On',
    stimulators: 'Estimuladores',
    'stimulants for women': 'Estimulantes para Mulheres',
    swings: 'Balancos',
    'toys for women': 'Brinquedos para Mulheres',
    'toys made of metal': 'Brinquedos em Metal',
    'transsexual penises': 'Penises Trans',
    'unflavored massage oils': 'Oleos de Massagem sem Sabor',
    'vaginal narrowing': 'Estreitante Vaginal',
    'vaginal lightener': 'Clareador Vaginal',
    'vaginal-anal dilator': 'Dilatadores Vaginais e Anais',
    'vaginas with vibration': 'Masturbadores com Vibracao',
    'various masturbators': 'Masturbadores Diversos',
    vibrators: 'Vibradores',
    'water-based': 'Base de Agua',
    'whole masks': 'Mascaras Inteiras',
    'with delicious flavors': 'Com Sabores',
    'women’s lingerie': 'Lingerie Feminina',
    "women's lingerie": 'Lingerie Feminina',
    "women's pheromone perfumes": 'Perfumes com Feromonas Femininos',
    'virgin vagina': 'Vagina Virgem',
    warming: 'Aquecedor',
    'warming effect': 'Efeito Aquecedor',
};

const HTML_ENTITY_MAP = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    bull: '•',
    hellip: '...',
    ndash: '-',
    mdash: '-',
    euro: 'EUR',
    copy: '(c)',
    reg: '(R)',
    trade: 'TM',
    aacute: 'a',
    agrave: 'a',
    acirc: 'a',
    atilde: 'a',
    auml: 'a',
    aring: 'a',
    aelig: 'ae',
    ccedil: 'c',
    eacute: 'e',
    egrave: 'e',
    ecirc: 'e',
    euml: 'e',
    iacute: 'i',
    igrave: 'i',
    icirc: 'i',
    iuml: 'i',
    ntilde: 'n',
    oacute: 'o',
    ograve: 'o',
    ocirc: 'o',
    otilde: 'o',
    ouml: 'o',
    oslash: 'o',
    uacute: 'u',
    ugrave: 'u',
    ucirc: 'u',
    uuml: 'u',
    yacute: 'y',
    yuml: 'y',
    Aacute: 'A',
    Agrave: 'A',
    Acirc: 'A',
    Atilde: 'A',
    Auml: 'A',
    Aring: 'A',
    AElig: 'AE',
    Ccedil: 'C',
    Eacute: 'E',
    Egrave: 'E',
    Ecirc: 'E',
    Euml: 'E',
    Iacute: 'I',
    Igrave: 'I',
    Icirc: 'I',
    Iuml: 'I',
    Ntilde: 'N',
    Oacute: 'O',
    Ograve: 'O',
    Ocirc: 'O',
    Otilde: 'O',
    Ouml: 'O',
    Oslash: 'O',
    Uacute: 'U',
    Ugrave: 'U',
    Ucirc: 'U',
    Uuml: 'U',
    Yacute: 'Y',
};

function normalizeDreamloveSourceUrl(url) {
    if (!url) return '';
    if (url.endsWith('_csv.zip')) return url.replace('_csv.zip', '_csv_plain.csv');
    return url;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ';' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result.map((value) => value.replace(/^"|"$/g, ''));
}

function findCol(headers, names) {
    for (const name of names) {
        const exactIdx = headers.findIndex((header) => header === name);
        if (exactIdx !== -1) return exactIdx;
    }

    for (const name of names) {
        const idx = headers.findIndex((header) => header.includes(name));
        if (idx !== -1) return idx;
    }
    return -1;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractXmlTranslation(xml, section, preferredLangs = ['pt-PT', 'pt-BR', 'pt', 'es-ES', 'en-UK']) {
    if (!xml) return '';

    const sectionMatch = xml.match(new RegExp(`<${section}>([\\s\\S]*?)</${section}>`, 'i'));
    if (!sectionMatch) return '';

    const sectionValue = sectionMatch[1];

    for (const lang of preferredLangs) {
        const langRegex = new RegExp(
            `<value\\s+lang="${escapeRegExp(lang)}"><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/value>`,
            'i',
        );
        const langMatch = sectionValue.match(langRegex);
        if (langMatch?.[1]) return langMatch[1].trim();
    }

    const fallbackMatch = sectionValue.match(/<value\s+lang="[^"]+"><!\[CDATA\[([\s\S]*?)\]\]><\/value>/i);
    return fallbackMatch?.[1]?.trim() || '';
}

function decodeHtmlEntities(value) {
    if (!value) return '';

    return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const isHex = entity[1]?.toLowerCase() === 'x';
            const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        return HTML_ENTITY_MAP[entity] ?? match;
    });
}

function htmlToText(value) {
    if (!value) return '';

    return decodeHtmlEntities(value)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function slugify(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

function parseNumber(value) {
    if (!value) return null;
    const normalized = String(value).replace(',', '.').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
    if (!value) return 0;
    const parsed = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseBoolean(value) {
    const normalized = String(value || '')
        .trim()
        .toLowerCase();

    return ['1', 'true', 'yes', 'y', 'si', 'sim'].includes(normalized);
}

function parseWeight(value) {
    if (!value) return null;
    const xmlMatch = String(value).match(/>([\d.,]+)</);
    return parseNumber(xmlMatch?.[1] || value);
}

function parseDimensions(value) {
    if (!value) return '';

    const width = String(value).match(/<width>([\d.,]+)<\/width>/i)?.[1];
    const height = String(value).match(/<height>([\d.,]+)<\/height>/i)?.[1];
    const depth = String(value).match(/<depth>([\d.,]+)<\/depth>/i)?.[1];

    if (width || height || depth) {
        const parts = [width, height, depth].filter(Boolean);
        return `${parts.join(' x ')} mm`;
    }

    return htmlToText(String(value));
}

function parseNoveltyFlag(value) {
    if (!value) return false;
    const xmlMatch = String(value).match(/value="(\d+)"/i)?.[1];
    return parseBoolean(xmlMatch || value);
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function buildImageList(mainImage, imagesCsv, fallbackImages = []) {
    return unique([
        mainImage,
        ...String(imagesCsv || '')
            .split('|')
            .map((image) => image.trim()),
        ...fallbackImages,
    ]);
}

function toReadableSegment(segment) {
    return segment
        .replace(/[’']/g, "'")
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
            if (word === word.toUpperCase() && word.length <= 5) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function translateCategorySegment(segment) {
    const normalized = segment
        .trim()
        .replace(/[’]/g, "'")
        .replace(/\s+/g, ' ')
        .toLowerCase();

    return SEGMENT_TRANSLATIONS[normalized] || toReadableSegment(segment);
}

function translateCategoryPath(path) {
    if (!path) return '';
    return path
        .split('|')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map(translateCategorySegment)
        .join(' > ');
}

function buildCategoryMeta(rawPath) {
    const translatedPath = translateCategoryPath(rawPath);
    const segments = translatedPath.split(' > ').filter(Boolean);
    return {
        category: translatedPath,
        subcategory: segments.length > 1 ? segments.at(-1) : '',
    };
}

function buildDescription(row, colMap) {
    const translations = row[colMap.translations] || '';
    const translatedHtml = extractXmlTranslation(translations, 'html_description');
    const translatedDescription = extractXmlTranslation(translations, 'description');
    const rawHtml = row[colMap.htmlDescription] || '';
    const rawDescription = row[colMap.description] || '';

    const bestSource = translatedHtml || rawHtml || translatedDescription || rawDescription;
    return htmlToText(bestSource).slice(0, 5000);
}

function buildName(row, colMap) {
    const translations = row[colMap.translations] || '';
    return (
        extractXmlTranslation(translations, 'title') ||
        extractXmlTranslation(translations, 'description') ||
        row[colMap.name] ||
        ''
    ).trim();
}

function buildProductRecord(row, colMap) {
    const dreamloveId = row[colMap.id];
    const name = buildName(row, colMap);

    if (!dreamloveId || !name) return null;

    const retailPrice =
        parseNumber(row[colMap.recommendedSalePriceWithTaxes]) ??
        parseNumber(row[colMap.priceWithTaxes]) ??
        parseNumber(row[colMap.recommendedSalePrice]) ??
        parseNumber(row[colMap.price]);

    const costPrice = parseNumber(row[colMap.dealerPrice]) ?? parseNumber(row[colMap.costPrice]);
    const lyraResellerCost = deriveLyraResellerCost(costPrice, retailPrice);
    const stock = parseInteger(row[colMap.availableStock] || row[colMap.stock]);
    const available = stock > 0 || parseBoolean(row[colMap.thereIsStock]) || parseBoolean(row[colMap.availability]);
    const images = buildImageList(row[colMap.mainImage], row[colMap.imagesCsv], [
        row[colMap.image],
        row[colMap.image2],
        row[colMap.image3],
    ]);
    const categoryMeta = buildCategoryMeta(row[colMap.mainCategory] || row[colMap.category]);

    const baseSlug = slugify(name) || `produto-${dreamloveId}`;

    return {
        dreamlove_product_id: dreamloveId,
        sku: row[colMap.sku] || '',
        barcode: row[colMap.ean] || '',
        name: name.slice(0, 500),
        description: buildDescription(row, colMap),
        category: categoryMeta.category,
        subcategory: categoryMeta.subcategory,
        brand: row[colMap.brand] || '',
        price: roundMoney(retailPrice),
        suggested_price: roundMoney(lyraResellerCost),
        cost_price: costPrice,
        vat: parseNumber(row[colMap.vat]),
        available,
        stock,
        image_url: images[0] || '',
        image_url_2: images[1] || null,
        image_url_3: images[2] || null,
        size: parseDimensions(row[colMap.dimensions] || row[colMap.size]),
        color: row[colMap.color] || '',
        weight: parseWeight(row[colMap.weight]),
        is_new: parseNoveltyFlag(row[colMap.novelty] || row[colMap.isNew]),
        status: 'active',
        slug: `${baseSlug}-${dreamloveId}`.slice(0, 150),
        updated_at: new Date().toISOString(),
    };
}

async function insertBatch(batch) {
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'dreamlove_product_id' });

    if (error) {
        console.error(`\nBatch failed: ${error.message}`);
        return 0;
    }

    return batch.length;
}

function fetchWithRedirect(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol
            .get(url, (response) => {
                if (
                    [301, 302, 307, 308].includes(response.statusCode) &&
                    response.headers.location &&
                    maxRedirects > 0
                ) {
                    fetchWithRedirect(response.headers.location, maxRedirects - 1).then(resolve).catch(reject);
                    return;
                }

                resolve(response);
            })
            .on('error', reject);
    });
}

async function syncProducts() {
    console.log('Starting Dreamlove supplier sync...');
    console.log(`Source URL: ${DREAMLOVE_SOURCE_URL}`);
    console.log(`Processing URL: ${DREAMLOVE_CSV_URL}`);
    console.log(`Supabase mode: ${SUPABASE_SERVICE_KEY ? 'service-role' : 'publishable-fallback'}\n`);

    const response = await fetchWithRedirect(DREAMLOVE_CSV_URL);
    const totalBytes = Number.parseInt(response.headers['content-length'] || '0', 10);

    console.log(
        `File size: ${totalBytes ? `${(totalBytes / 1024 / 1024).toFixed(1)} MB` : 'unknown'} | Batch size: ${BATCH_SIZE}`,
    );

    let headers = null;
    let colMap = null;
    let lineBuffer = '';
    let batch = [];
    let totalInserted = 0;
    let totalRows = 0;
    let bytesReceived = 0;
    const startedAt = Date.now();

    response.on('data', async (chunk) => {
        bytesReceived += chunk.length;
        lineBuffer += chunk.toString('utf8');

        let newlineIndex;
        while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
            const rawLine = lineBuffer.slice(0, newlineIndex).replace(/\r$/, '');
            lineBuffer = lineBuffer.slice(newlineIndex + 1);

            if (!rawLine) continue;

            if (!headers) {
                headers = parseCSVLine(rawLine).map((header) =>
                    header.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
                );

                colMap = {
                    id: findCol(headers, ['product_id', 'id_product', 'ref']),
                    sku: findCol(headers, ['sku']),
                    name: findCol(headers, ['name', 'title']),
                    description: findCol(headers, ['description']),
                    htmlDescription: findCol(headers, ['html_description']),
                    translations: findCol(headers, ['translations_xml']),
                    mainCategory: findCol(headers, ['main_category']),
                    category: findCol(headers, ['category', 'categoria']),
                    brand: findCol(headers, ['brand', 'marca']),
                    dealerPrice: findCol(headers, ['dealer_price']),
                    costPrice: findCol(headers, ['cost_price', 'precio_tarifa', 'wholesale']),
                    price: findCol(headers, ['price', 'precio_venta', 'retail_price']),
                    priceWithTaxes: findCol(headers, ['price_with_taxes']),
                    recommendedSalePrice: findCol(headers, ['recommended_sale_price']),
                    recommendedSalePriceWithTaxes: findCol(headers, ['recommended_sale_price_with_taxes']),
                    vat: findCol(headers, ['vat_percentage', 'vat']),
                    availability: findCol(headers, ['availability']),
                    thereIsStock: findCol(headers, ['there_is_stock']),
                    availableStock: findCol(headers, ['available_stock']),
                    stock: findCol(headers, ['stock', 'qty', 'quantity']),
                    ean: findCol(headers, ['ean', 'barcode', 'gtin']),
                    mainImage: findCol(headers, ['main_image_url_big', 'main_image_url']),
                    image: findCol(headers, ['image', 'img']),
                    image2: findCol(headers, ['image2', 'img2']),
                    image3: findCol(headers, ['image3', 'img3']),
                    imagesCsv: findCol(headers, ['images_csv']),
                    weight: findCol(headers, ['weight_info_xml', 'weight', 'peso']),
                    dimensions: findCol(headers, ['dimensions_info_xml']),
                    size: findCol(headers, ['size', 'medida']),
                    color: findCol(headers, ['color', 'colour']),
                    novelty: findCol(headers, ['novelty_info_xml']),
                    isNew: findCol(headers, ['is_new', 'new']),
                };

                console.log('Detected Dreamlove columns:', JSON.stringify(colMap, null, 2));
                continue;
            }

            totalRows += 1;
            const row = parseCSVLine(rawLine);
            const product = buildProductRecord(row, colMap);
            if (!product) continue;

            batch.push(product);

            if (batch.length >= BATCH_SIZE) {
                response.pause();
                const currentBatch = [...batch];
                batch = [];
                const inserted = await insertBatch(currentBatch);
                totalInserted += inserted;

                const percent = totalBytes ? ((bytesReceived / totalBytes) * 100).toFixed(0) : '?';
                const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
                process.stdout.write(
                    `\rSynced ${totalInserted} products | ${percent}% downloaded | ${elapsed}s elapsed...   `,
                );

                response.resume();
            }
        }
    });

    await new Promise((resolve, reject) => {
        response.on('end', resolve);
        response.on('error', reject);
    });

    if (batch.length > 0) {
        totalInserted += await insertBatch(batch);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`\n\nDreamlove sync completed in ${elapsed}s.`);
    console.log(`Products inserted or updated: ${totalInserted}`);
    console.log(`CSV rows processed: ${totalRows}`);
    console.log(`Downloaded data: ${(bytesReceived / 1024 / 1024).toFixed(1)} MB`);
}

syncProducts().catch((error) => {
    console.error('\nFatal sync error:', error.message);
    process.exit(1);
});
