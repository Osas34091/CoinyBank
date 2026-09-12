const https = require('https');

const API_KEY = "00ed185d8b6558c89abf223529499d50";
const URL = `http://api.nessieisreal.com/customers?key=${API_KEY}`;

const http = require('http'); // nessie uses http based on the url

http.get(URL, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log("NESSIE API: SUCCESS");
      const customers = JSON.parse(data);
      console.log(`Found ${customers.length} customers.`);
    } else {
      console.log(`NESSIE API: FAILED with status ${res.statusCode}`);
      console.log(data);
    }
  });
}).on("error", (err) => {
  console.log("NESSIE API: ERROR", err.message);
});
