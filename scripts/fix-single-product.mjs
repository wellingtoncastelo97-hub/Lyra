import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://cpveybfypwiqaefcvqoo.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, KEY);
const CSV_URL = 'https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_55_125_2_206b68c6599e190d0042493122d3fb63_csv_plain.csv';

const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url, dreamlove_product_id')
    .like('dreamlove_product_id', 'DL-%');

if (error) { console.error('Erro:', error.message); process.exit(1); }

console.log(`${products.length} produtos manuais (DL-xxx) encontrados.\n`);

const searchTerms = {
    'oleo de massagem': ['aceite masaje', 'massage oil', 'oil massage'],
    'chocolate': ['chocolate'],
    'vela de massagem': ['vela masaje', 'massage candle', 'candle massage'],
    'baunilha': ['vainilla', 'vanilla'],
    'gel estimulante': ['gel estimulante', 'stimulating gel', 'gel efecto calor', 'warming'],
    'efeito calor': ['efecto calor', 'warming', 'hot effect'],
    'kit romance': ['kit romance', 'romantic kit', 'kit romantico'],
    'lubrificante': ['lubricante', 'lubricant'],
    'base agua': ['base agua', 'water based'],
    'bruma corporal': ['bruma corporal', 'body mist', 'spray corporal'],
    'petalas': ['petalos', 'petals', 'rosa'],
    'preservativo': ['preservativo', 'condon'],
    'ultra fino': ['ultra fino', 'ultrathin', 'ultra thin'],
    'lavanda': ['lavanda', 'lavender'],
    'set petalas': ['set petalos', 'petals set', 'petalos rosa'],
    'gel de banho': ['gel baño', 'gel ducha', 'shower gel', 'bath gel'],
    'afrodisiaco': ['afrodisiaco', 'aphrodisiac'],
    'vibrador': ['vibrador', 'vibrator'],
    'elegance': ['elegance', 'elegant'],
    'espuma': ['espuma', 'foam'],
    'tropical': ['tropical'],
    'anel vibrat': ['anillo vibr', 'vibrating ring', 'cock ring'],
    'kit massagem': ['kit masaje', 'massage kit', 'kit massage'],
    'silicone': ['silicona', 'silicone'],
    'longa duracao': ['larga duracion', 'long lasting'],
    'balsamo labial': ['balsamo labial', 'lip balm'],
    'mel': ['miel', 'honey'],
    'mascara': ['antifaz', 'mascara', 'mask'],
    'seda': ['seda', 'silk', 'satinado'],
    'gel intimo': ['gel intimo', 'intimate gel'],
    'aloe vera': ['aloe vera', 'aloe'],
    'ylang': ['ylang'],
    'espuma de banho': ['espuma baño', 'bath foam'],
    'romantica': ['romantica', 'romantic'],
};

function normalize(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ').trim();
}

function scoreMatch(productName, csvName) {
    const pNorm = normalize(productName);
    const cNorm = normalize(csvName);
    let score = 0;
    for (const [ptKey, esTerms] of Object.entries(searchTerms)) {
        if (pNorm.includes(ptKey.replace(/ /g, ' '))) {
            for (const esTerm of esTerms) {
                if (cNorm.includes(esTerm)) {
                    score += 2;
                }
            }
        }
    }
    const pWords = pNorm.split(' ').filter(w => w.length > 3);
    for (const w of pWords) {
        if (cNorm.includes(w)) score += 1;
    }
    return score;
}

function parseCSVLine(line) {
    const r = []; let c = '', q = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') q = !q;
        else if ((ch === ';' || ch === ',') && !q) { r.push(c.trim().replace(/^"|"$/g, '')); c = ''; }
        else c += ch;
    }
    r.push(c.trim().replace(/^"|"$/g, ''));
    return r;
}

function fetchUrl(url, max = 5) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        proto.get(url, (res) => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && max > 0)
                fetchUrl(res.headers.location, max - 1).then(resolve).catch(reject);
            else resolve(res);
        }).on('error', reject);
    });
}

console.log('A descarregar CSV da Dreamlove...');
const res = await fetchUrl(CSV_URL);

let buf = '', headers = null, idCol = -1, imgCol = -1, nameCol = -1;
const csvProducts = [];

await new Promise((resolve, reject) => {
    res.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
            const line = buf.substring(0, idx).trim();
            buf = buf.substring(idx + 1);
            if (!line) continue;
            if (!headers) {
                headers = parseCSVLine(line).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                idCol = headers.findIndex(h => h.includes('product_id') || h.includes('id_product'));
                imgCol = headers.findIndex(h => h.includes('image') && !h.includes('image2') && !h.includes('image3'));
                nameCol = headers.findIndex(h => h.includes('nombre') || h.includes('name') || h.includes('titulo'));
                if (nameCol === -1) nameCol = headers.findIndex(h => h.includes('product_name') || h.includes('nombre_product'));
                if (nameCol === -1) nameCol = 1;
                console.log(`CSV: ${headers.length} colunas, id=${idCol}, name=${nameCol}, img=${imgCol}`);
                console.log('Headers:', headers.slice(0, 10).join(', '));
                continue;
            }
            try {
                const cols = parseCSVLine(line);
                const pid = cols[idCol]?.trim();
                const name = cols[nameCol]?.trim();
                const img = cols[imgCol]?.trim();
                if (pid && name && img && img.startsWith('http')) {
                    csvProducts.push({ pid, name, img });
                }
            } catch {}
        }
    });
    res.on('end', resolve);
    res.on('error', reject);
});

console.log(`\nCSV carregado: ${csvProducts.length} produtos com imagem.\n`);

console.log('=== A procurar correspondencias ===\n');

const matches = [];
for (const product of products) {
    let bestMatch = null;
    let bestScore = 0;
    for (const csvP of csvProducts) {
        const score = scoreMatch(product.name, csvP.name);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = csvP;
        }
    }
    if (bestMatch && bestScore >= 3) {
        matches.push({ product, csvMatch: bestMatch, score: bestScore });
        console.log(`MATCH (score=${bestScore}): "${product.name}" -> "${bestMatch.name}"`);
        console.log(`  Imagem: ${bestMatch.img}\n`);
    } else {
        console.log(`SEM MATCH: "${product.name}" (melhor score: ${bestScore})`);
        if (bestMatch) console.log(`  Melhor candidato: "${bestMatch.name}"\n`);
    }
}

console.log(`\n=== ${matches.length} de ${products.length} correspondencias encontradas ===\n`);

if (matches.length > 0) {
    console.log('A atualizar imagens...');
    for (const m of matches) {
        const { error } = await supabase
            .from('products')
            .update({ image_url: m.csvMatch.img })
            .eq('id', m.product.id);
        if (error) console.log(`ERRO ${m.product.id}:`, error.message);
        else console.log(`OK: ID ${m.product.id} "${m.product.name}" atualizado`);
    }
}

console.log('\nConcluido!');
