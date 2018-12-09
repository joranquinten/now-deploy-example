if (!process.env.now) require("dotenv").config();

const express = require("express");
const app = express();
const fetch = require("node-fetch");

const port = process.env.now ? 8080 : 4000;

async function getWeather() {
  const config = {
    secret: process.env.darksky_secret,
    location: "52.238,5.5346",
    lang: "en",
    units: "si",
    exclude: "minutely,hourly,daily,alerts,flags"
  };

  const weatherAPI = `https://api.darksky.net/forecast/${config.secret}/${
    config.location
  }?lang=${config.lang}&units=${config.units}&exclude=${config.exclude}`;

  const response = await fetch(weatherAPI);
  return response.json();
}

app.get("/", (req, res) => {
  getWeather().then(weatherReport => {
    res.json(weatherReport);
  });
});

app.listen(port);
