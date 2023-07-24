let update = (ticker) => {
  fetch(`https://thingproxy.freeboard.io/fetch/https://query2.finance.yahoo.com/v7/finance/options/${ticker}`)
  // fetch(`http://localhost:3000/${ticker}`) //[*]
  // fetch(`https://query2.finance.yahoo.com/v7/finance/options/${ticker}`)
  .then(response => response.json())
  .then(data => {
    data = data['optionChain']['result'][0]['quote']

    // Extract the stock price from the API response
    const curr_price = data['regularMarketPrice']
    const open = data['regularMarketPreviousClose']
    const change = data['regularMarketChange']
    const change_percent = change / open * 100

    // Display the stock price
    document.getElementById(`${ticker}-open`).innerText = parseFloat(open).toFixed(2)
    document.getElementById(`${ticker}-last`).innerText = parseFloat(curr_price).toFixed(2)
    document.getElementById(`${ticker}-pnlpct`).innerText = change_percent.toFixed(2) + '%'
    document.getElementById(`${ticker}-pnldol`).innerText = (change * parseFloat(document.getElementById(`${ticker}-quant`).innerText)).toFixed(2)
    if (change > 0){
      document.getElementById(`${ticker}-pnlpct`).style = 'color:green'
      document.getElementById(`${ticker}-pnldol`).style = 'color:green'
    } else if (change < 0){
      document.getElementById(`${ticker}-pnlpct`).style = 'color:red'
      document.getElementById(`${ticker}-pnldol`).style = 'color:red'
    } else {
      document.getElementById(`${ticker}-pnlpct`).style = ''
      document.getElementById(`${ticker}-pnldol`).style = ''
    }

    let pnls = document.getElementsByClassName('pnl')
    let quants = document.getElementsByClassName('quantity')
    let opens = document.getElementsByClassName('open')
    let closes = document.getElementsByClassName('last')
    let totalPNL = 0
    let old_portfolio = 0
    let new_portfolio = 0
    for(let j = 0; j < pnls.length; j++){
      totalPNL += parseFloat(pnls[j].innerText)
      old_portfolio += parseFloat(quants[j].innerText) * parseFloat(opens[j].innerText)
      new_portfolio += parseFloat(quants[j].innerText) * parseFloat(closes[j].innerText)
    }
    document.getElementById('dollarPNL').innerText = totalPNL.toFixed(2)
    document.getElementById('percentPNL').innerText = (100 * (new_portfolio / old_portfolio - 1)).toFixed(2) + '%'
    document.getElementById('portfolio').innerText = new_portfolio.toFixed(2)
    if (totalPNL > 0){
      document.getElementById('dollarPNL').style = "font-size:16px; color:green"
      document.getElementById('percentPNL').style = "font-size:16px; color:green"
    } else if (totalPNL < 0){
      document.getElementById('dollarPNL').style = "font-size:16px; color:red"
      document.getElementById('percentPNL').style = "font-size:16px; color:red"
    } else {
      document.getElementById('dollarPNL').style = "font-size:16px;"
      document.getElementById('percentPNL').style = "font-size:16px;"
    }
  })
  .catch(error => {
    console.log('Error fetching stock price:', error);
  });
}

let sleep = (s) => {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function market_listener (tickers) {
  let time = new Date()
  for(let k = 0; k < tickers.length; k++){
    update(tickers[k])
  }
  await sleep(10)

  while ((time.getUTCDay() >= 1 && time.getUTCDay() <= 5) && ((time.getUTCHours() >= 14 || time.getUTCHours() <= 19 || (time.getUTCHours() == 13 && time.getUTCMinutes() >= 30)))){
    for(let k = 0; k < tickers.length; k++){
      update(tickers[k])
    }
    await sleep(10)
    console.log('execute')
    time = new Date()
  }
  console.log('Market Closed!')
}

window.addEventListener('load', () => {
  const sheetId = '1jlBuNxfJ05eSUIUqbdWNEpjInP1Ec0cskCtFH55dgSE';
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
  const sheetName = 'Investments';
  const query = encodeURIComponent('Select *')
  const url = `${base}&sheet=${sheetName}&tq=${query}`
  const data = []
  const init = new Promise((resolve, reject) => {
      fetch(url)
      .then(res => res.text())
      .then(rep => {
          const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
          const rowNum = jsonData.table.rows.length;
          for(let i = 0; i < rowNum; i++)
          {
              data.push(jsonData.table.rows[i])
          }
          resolve(data);
      }
      )
  })
  init.then(() => {
    let table = document.getElementById('tbody')
    let tickers = []
    for(let i = 0; i < data.length; i++){
      let row = document.createElement('tr')
      row.style = 'border-top: 1em solid transparent;'

      let tick = data[i].c[0].v
      tickers.push(tick)

      let ticker = document.createElement('td')
      let inner = document.createElement('strong')
      inner.innerText = tick
      ticker.appendChild(inner)

      let quant = document.createElement('td')
      quant.className = 'text-right quantity'
      quant.id = `${tick}-quant`
      quant.innerText = data[i].c[1].v

      let open = document.createElement('td')
      open.className = 'text-right open'
      open.id = `${tick}-open`
      open.innerText = '0'

      let last = document.createElement('td')
      last.className = 'text-right last'
      last.id = `${tick}-last`
      last.innerText = '0'

      let pnlpct = document.createElement('td')
      pnlpct.className = 'text-right'
      pnlpct.id = `${tick}-pnlpct`
      pnlpct.innerText = '0'

      let pnldol = document.createElement('td')
      pnldol.className = 'text-right pnl'
      pnldol.id = `${tick}-pnldol`
      pnldol.innerText = '0'

      row.appendChild(ticker)
      row.appendChild(quant)
      row.appendChild(open)
      row.appendChild(last)
      row.appendChild(pnlpct)
      row.appendChild(pnldol)

      table.appendChild(row)
    }

    market_listener(tickers)
  })

})