fetch('https://api.razorpay.com/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Basic cnpwX3Rlc3RfcFhaZVhmN1ZsRDQ2WGg6dEw4Rjc5cUE4SmpMaDEzMzJReDNPNmtD'
  },
  body: JSON.stringify({
    amount: 10000,
    currency: 'INR',
    notes: {
      orgCode: "ERKT",
      couponCode: ""
    }
  })
}).then(res => res.json()).then(console.log);
