// index.js
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');

const PORT = process.env.PORT || 3000;

// Tu clave de RapidAPI desde Render
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'stockx1.p.rapidapi.com';

// Función para buscar en StockX vía RapidAPI
async function fetchStockX(term) {
  if (!RAPIDAPI_KEY) return [];
  try {
    const response = await axios.get(
      'https://stockx1.p.rapidapi.com/search',
      {
        params: { query: term, limit: '5' },
        headers: {
          'X-RapidAPI-Host': RAPIDAPI_HOST,
          'X-RapidAPI-Key': RAPIDAPI_KEY,
        },
      }
    );
    const data = response.data;
    // Mapear al formato { name, price }
    return (data.Products || []).map(p => ({
      name: p.title,
      price: p.market?.price,
    }));
  } catch (err) {
    console.error('Error RapidAPI StockX:', err.response?.status, err.message);
    return [];
  }
}

// Función para buscar en PopMart (scraping con Cheerio)
async function fetchPopMart(term) {
  try {
    const url = `https://www.popmart.com/search?q=${encodeURIComponent(term)}`;
    const resp = await axios.get(url);
    const $ = cheerio.load(resp.data);
    const results = [];
    $('.product-card').slice(0, 5).each((_, el) => {
      results.push({
        name: $(el).find('.product-title').text().trim(),
        price: $(el).find('.price-amount').text().trim(),
      });
    });
    return results;
  } catch (err) {
    console.error('Error PopMart:', err.response?.status, err.message);
    return [];
  }
}

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/offers')) {
    const term = new URL(req.url, `http://localhost`).searchParams.get('q') || '';
    const [stockx, popmart] = await Promise.all([
      fetchStockX(term),
      fetchPopMart(term),
    ]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ stockx, popmart }));
  }

  // Ruta raíz de comprobación
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Cazador de Ofertas is running' }));
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
