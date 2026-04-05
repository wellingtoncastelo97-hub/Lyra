import https from 'https';

const url = 'https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_55_125_2_206b68c6599e190d0042493122d3fb63_csv_plain.csv';

https.get(url, (res) => {
    let buffer = '';
    res.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        let lines = buffer.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i].includes('23277')) {
                console.log('FOUND P:', lines[i]);
                process.exit(0);
            }
        }
        buffer = lines[lines.length - 1];
    });
});
