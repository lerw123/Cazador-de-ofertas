// index.js
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
const PORT = process.env.PORT || 3000;

// Función ejemplo: busca en StockX un término y devuelve los primeros resultados
async function fetchStockX(term) {
  const url = `https://stockx.com/api/browse?_search=${encodeURIComponent(term)}`;
  const { data } = await axios.get(url, {
    headers: { 'Accept': 'application/json' }
  });
  // Simplificamos: devolvemos nombre y precio del primer artículo
  return data.Products.slice(0, 5).map(p => ({
    name: p.title,
    price: p.market.price
  }));
}

// Función ejemplo: raspa una tienda HTML (p.ej. Pop Mart)
async function fetchPopMart(term) {
  const url = `https://www.popmart.com/search?q=${encodeURIComponent(term)}`;
  const resp = await axios.get(url);
  const $ = cheerio.load(resp.data);
  const results = [];
  $('.product-card').slice(0,5).each((i, el) => {
    results.push({
      name: $(el).find('.product-title').text().trim(),
      price: $(el).find('.product-price').text().trim()
    });
  });
  return results;
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/offers')) {
    const urlParams = new URL(req.url, `http://localhost:${PORT}`);
    const term = urlParams.searchParams.get('q') || 'Nike';
    try {
      const [stockx, popmart] = await Promise.all([
        fetchStockX(term),
        fetchPopMart(term)
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ stockx, popmart }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Cazador de Ofertas is running' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
