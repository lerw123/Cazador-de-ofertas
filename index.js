// index.js
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
const PORT = process.env.PORT || 3000;

// Simula un navegador para evitar bloqueos
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'application/json, text/plain, */*'
};

async function fetchStockX(term) {
  try {
    const url = `https://stockx.com/api/browse?_search=${encodeURIComponent(term)}`;
    const { data } = await axios.get(url, { headers: COMMON_HEADERS });
    return data.Products.slice(0,5).map(p => ({
      name: p.title,
      price: p.market.price
    }));
  } catch (err) {
    console.error('Error StockX:', err.response?.status, err.message);
    return [];  // si falla, devolvemos array vacío
  }
}

async function fetchPopMart(term) {
  try {
    const url = `https://www.popmart.com/search?q=${encodeURIComponent(term)}`;
    const resp = await axios.get(url, { headers: COMMON_HEADERS });
    const $ = cheerio.load(resp.data);
    const results = [];
    $('.product-card').slice(0,5).each((i, el) => {
      results.push({
        name: $(el).find('.product-title').text().trim(),
        price: $(el).find('.product-price').text().trim()
      });
    });
    return results;
  } catch (err) {
    console.error('Error PopMart:', err.response?.status, err.message);
    return [];  // si falla, devolvemos array vacío
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/offers')) {
    const term = new URL(req.url, `http://localhost`).searchParams.get('q') || '';
    const [stockx, popmart] = await Promise.all([
      fetchStockX(term),
      fetchPopMart(term)
    ]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ stockx, popmart }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Cazador de Ofertas is running' }));
  }
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
