import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://cpveybfypwiqaefcvqoo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DREAMLOVE_CSV_URL = 'https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_55_125_2_206b68c6599e190d0042493122d3fb63_csv_plain.csv';

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Defina a variável SUPABASE_SERVICE_ROLE_KEY antes de correr o script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if ((char === ';' || char === ',') && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

function findCol(headers, names) {
    for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx !== -1) return idx;
    }
    return -1;
}

function fetchWithRedirect(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && maxRedirects > 0) {
                fetchWithRedirect(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
            } else {
                resolve(res);
            }
        }).on('error', reject);
    });
}

async function syncMissingImages() {
    console.log('🚀 Iniciando recuperação das imagens em falta (correção de multilines)...');

    // 1. Fetch missing dreamlove_product_ids
    const { data: missingProducts, error } = await supabase
        .from('products')
        .select('dreamlove_product_id')
        .is('image_url', null)
        .not('dreamlove_product_id', 'is', null)
        .not('dreamlove_product_id', 'ilike', 'DL-%');

    if (error) throw error;

    const missingIds = new Set(missingProducts.map(p => p.dreamlove_product_id));
    console.log(`🎯 Encontrados ${missingIds.size} produtos da Dreamlove sem imagem no site.`);
    if (missingIds.size === 0) return console.log('Tudo OK!');

    const res = await fetchWithRedirect(DREAMLOVE_CSV_URL);

    let headers = null;
    let colMap = {};
    let lineBuffer = '';
    let inQuotes = false;

    let updates = [];
    let processedFiles = 0;

    res.on('data', async (chunk) => {
        lineBuffer += chunk.toString('utf8');

        while (true) {
            let newlineIdx = -1;
            inQuotes = false;

            for (let i = 0; i < lineBuffer.length; i++) {
                if (lineBuffer[i] === '"') inQuotes = !inQuotes;
                if (lineBuffer[i] === '\n' && !inQuotes) {
                    newlineIdx = i;
                    break;
                }
            }

            if (newlineIdx === -1) break; // Incomplete line, wait for more chunks

            const line = lineBuffer.substring(0, newlineIdx).trim();
            lineBuffer = lineBuffer.substring(newlineIdx + 1);

            if (!line) continue;

            if (!headers) {
                headers = parseCSVLine(line).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                colMap = {
                    id: findCol(headers, ['product_id', 'id_product', 'ref', 'referencia']),
                    img: findCol(headers, ['image', 'imagen', 'img', 'photo', 'picture'])
                };
                continue;
            }

            try {
                const cols = parseCSVLine(line);
                const productId = cols[colMap.id];
                const img = cols[colMap.img];

                if (productId && img && missingIds.has(productId)) {
                    updates.push({
                        dreamlove_product_id: productId,
                        image_url: img
                    });

                    if (updates.length >= 50) {
                        res.pause();
                        const batch = [...updates];
                        updates = [];

                        // Because we only want to UPDATE, we can't use upsert blindly without overwriting other fields
                        // UNLESS we just upsert the specific array of objects.
                        // Actually, upsert in Supabase with missing fields will set them to default/null UNLESS we do an explicit UPDATE.
                        // So let's update them one by one, or use a RPC. 
                        // Faster: just Promise.all updates
                        await Promise.all(batch.map(u =>
                            supabase.from('products')
                                .update({ image_url: u.image_url })
                                .eq('dreamlove_product_id', u.dreamlove_product_id)
                        ));

                        processedFiles += batch.length;
                        process.stdout.write(`\r   ✅ ${processedFiles} imagens recuperadas...`);
                        res.resume();
                    }
                }
            } catch (e) {
                // Ignore parsing errors for individual lines
            }
        }
    });

    await new Promise((resolve, reject) => {
        res.on('end', resolve);
        res.on('error', reject);
    });

    if (updates.length > 0) {
        await Promise.all(updates.map(u =>
            supabase.from('products')
                .update({ image_url: u.image_url })
                .eq('dreamlove_product_id', u.dreamlove_product_id)
        ));
        processedFiles += updates.length;
    }

    console.log(`\n\n🎉 Feito! ${processedFiles} imagens de produtos em falta foram fixadas na base de dados!`);
}

syncMissingImages().catch(console.error);
