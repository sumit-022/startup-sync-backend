async function getRates() {
  const res = await fetch("https://www.floatrates.com/daily/sgd.json");
  const data = await res.json();

  console.log(
    JSON.stringify(
      Object.keys(data).map((code) => {
        const d = data[code];
        return {
          code: code.toUpperCase(),
          rate: d.rate,
        };
      })
    )
  );
}

getRates();
