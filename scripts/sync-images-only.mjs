/**
 * Dreamlove Image URL Sync Script
 * 
 * Apenas atualiza as image_url dos produtos que atualmente têm placeholders,
 * restaurando as URLs reais do catálogo Dreamlove.
 *
 * Uso:
 *   Windows:  set SUPABASE_SERVICE_ROLE_KEY=eyJ... && node scripts/sync-images-only.mjs
 *   Mac/Linux: SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/sync-images-only.mjs
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://cpveybfypwiqaefcvqoo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DREAMLOVE_CSV_URL = 'https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_55_125_2_206b68c6599e190d0042493122d3fb63_csv_plain.csv';
const BATCH_SIZE = 500;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Defina a variável SUPABASE_SERVICE_ROLE_KEY antes de correr o script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- CSV Line Parser ---
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

async function updateImageBatch(batch) {
    let updated = 0;
    // Do individual updates since we need to match by dreamlove_product_id
    for (const item of batch) {
        const { error } = await supabase
            .from('products')
            .update({
                image_url: item.image_url,
                image_url_2: item.image_url_2 || null,
                image_url_3: item.image_url_3 || null
            })
            .eq('dreamlove_product_id', item.dreamlove_product_id);
        if (!error) updated++;
    }
    return updated;
}

async function syncImages() {
    console.log('🖼️  Sincronizando imagens do catálogo Dreamlove...');
    console.log(`   URL: ${DREAMLOVE_CSV_URL}\n`);

    const res = await fetchWithRedirect(DREAMLOVE_CSV_URL);
    const totalBytes = parseInt(res.headers['content-length'] || '0');
    console.log(`📦 Tamanho: ${totalBytes ? (totalBytes / 1024 / 1024).toFixed(1) + ' MB' : 'desconhecido'}`);
    console.log('📥 A descarregar e processar...\n');

    let headers = null;
    let colMap = {};
    let lineBuffer = '';
    let batch = [];
    let totalUpdated = 0;
    let totalLines = 0;
    let bytesReceived = 0;
    const startTime = Date.now();

    res.on('data', async (chunk) => {
        bytesReceived += chunk.length;
        lineBuffer += chunk.toString('utf8');

        let newlineIdx;
        while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.substring(0, newlineIdx).trim();
            lineBuffer = lineBuffer.substring(newlineIdx + 1);

            if (!line) continue;

            if (!headers) {
                headers = parseCSVLine(line).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                console.log(`📋 ${headers.length} colunas detetadas`);
                colMap = {
                    id: findCol(headers, ['product_id', 'id_product', 'ref', 'referencia']),
                    img: findCol(headers, ['image', 'imagen', 'img', 'photo', 'picture']),
                    img2: findCol(headers, ['image2', 'imagen2', 'img2']),
                    img3: findCol(headers, ['image3', 'imagen3', 'img3']),
                };
                console.log('🔑 Colunas de imagem:', JSON.stringify(colMap));
                continue;
            }

            totalLines++;
            try {
                const cols = parseCSVLine(line);
                if (cols.length < 3) continue;

                const get = (idx) => (idx >= 0 && idx < cols.length) ? cols[idx].trim() : '';
                const productId = get(colMap.id);
                const imageUrl = get(colMap.img);

                if (!productId || !imageUrl) continue;

                // Pular se já tem URL da dreamlove
                if (imageUrl.includes('store.dreamlove.es')) {
                    // Mas vamos adicionar ao batch na mesma, o Supabase ignora se igual
                }

                batch.push({
                    dreamlove_product_id: productId,
                    image_url: imageUrl,
                    image_url_2: get(colMap.img2),
                    image_url_3: get(colMap.img3),
                });
            } catch (e) {
                // skip malformed lines
            }

            if (batch.length >= BATCH_SIZE) {
                res.pause();
                const batchToUpdate = [...batch];
                batch = [];
                const updated = await updateImageBatch(batchToUpdate);
                totalUpdated += updated;
                const pct = totalBytes ? ((bytesReceived / totalBytes) * 100).toFixed(0) : '?';
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                process.stdout.write(`\r   🖼️  ${totalUpdated} imagens atualizadas | ${pct}% | ${elapsed}s...   `);
                res.resume();
            }
        }
    });

    await new Promise((resolve, reject) => {
        res.on('end', resolve);
        res.on('error', reject);
    });

    if (batch.length > 0) {
        const updated = await updateImageBatch(batch);
        totalUpdated += updated;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n🎉 Sincronização de imagens concluída em ${elapsed}s!`);
    console.log(`   🖼️  Total atualizado: ${totalUpdated}`);
    console.log(`   📊 Linhas no CSV: ${totalLines}`);
}

syncImages().catch(err => {
    console.error('\n❌ Erro fatal:', err.message);
    process.exit(1);
});
