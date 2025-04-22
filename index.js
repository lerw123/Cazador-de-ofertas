// index.js
const http = require('http');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

// Lee tu clave desde la variable de entorno
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Función que llama al endpoint de StockX en RapidAPI
async function fetchStockX(term) {
  if (!RAPIDAPI_KEY) return [];
  try {
    const { data } = await axios.get(
      'https://stockx-11.p.rapidapi.com/products',
      {
        params: { query: term, limit: '5' },
        headers: {
          'X-RapidAPI-Host': 'stockx-11.p.rapidapi.com',
          'X-RapidAPI-Key': RAPIDAPI_KEY
        }
      }
    );
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
  // Ping raíz
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Cazador de Ofertas is running' }));
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
 
