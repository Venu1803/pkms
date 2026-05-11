const axios = require("axios");

async function test() {
  const baseUrl = "http://localhost:5010/api";
  const endpoints = [
    "/projects",
    "/keyTypes",
    "/projects/some-invalid-id/keys",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(`${baseUrl}${endpoint}`);
      console.log(`GET ${endpoint}: ${res.status}`);
    } catch (err) {
      console.log(
        `GET ${endpoint}: ${err.response ? err.response.status : err.message}`,
      );
    }
  }
}

test();
