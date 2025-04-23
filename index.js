// index.js
const http = require('http');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

// Tu clave desde Render
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function fetchStockX(term) {
  if (!RAPIDAPI_KEY) return [];
  try {
    // Llamamos al endpoint de "Search" y al host exacto de RapidAPI
    const response = await axios.get(
      'https://stockx1.p.rapidapi.com/search',
      {
        params: { query: term, limit: '5' },
        headers: {
          'X-RapidAPI-Host': 'stockx1.p.rapidapi.com',
          'X-RapidAPI-Key': RAPIDAPI_KEY
        }
      }
    );
    const data = response.data;
    // Ajusta según la forma real del JSON, aquí asumimos data.Products
    return (data.Products || []).map(p => ({
      name: p.title,
      price: p.market?.price
    }));
  } catch (err) {
    console.error('Error RapidAPI StockX:', err.response?.status, err.message);
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/offers')) {
    const term = new URL(req.url, `http://localhost`).searchParams.get('q') || '';
    const stockx = await fetchStockX(term);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ stockx }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Cazador de Ofertas is running' }));
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
