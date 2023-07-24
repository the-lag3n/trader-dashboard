// THIS RUNS OUR OWN CORS-ANYWHERE SERVER
// Not in deployment
// Run using 'node test.js' in terminal and turn off commenting for [*]

const express = require('express');
const request = require('request');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/:ticker', (req, res) => {
  const ticker = req.params.ticker;
  request(
    { url: `https://query2.finance.yahoo.com/v7/finance/options/${ticker}` },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return res.status(500).json({ type: 'error', message: err.message });
      }
      res.json(JSON.parse(body));
    }
  )
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));