const express = require("express");
const { history } = require("../models");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const CryptoJS = require("crypto-js");
const db = require("../models");
// db.sequelize.sync({ force: true });
db.sequelize.sync();

const History = db.history;

exports.findAll = async (req, res) => {
  try {
    const data = await History.findAll({
      order: [["id", "Asc"]],
    });
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users.",
    });
  }
};

exports.balance = async (req, res) => {
  try {
    const api_key = "62a0906fa5b3460001924a99"; // "62a0643e7b57eb000169d9de"; //
    const api_secret = "71741d7f-e302-44d7-8fdf-a174d3022a99"; // "3d9aad71-55f4-4f2c-a00c-7adce001040a";
    const api_passphrase = "thisisthepassphrase"; // "chocolatechip@bloodles.com"; //

    // luna/usdt
    const api = "/api/v1/account-overview"; // ?symbol=XBTUSDTM&&active=done"; //"/api/v1/orders?symbol=XBTUSDTM";
    const url = "https://api-futures.kucoin.com" + api;
    const now = Date.now();
    const str_to_sign = now + "GET" + api;

    const signaturehash = CryptoJS.HmacSHA256(str_to_sign, api_secret);
    const passphrasehash = CryptoJS.HmacSHA256(api_passphrase, api_secret);
    const signature = CryptoJS.enc.Base64.stringify(signaturehash);
    const passphrase = CryptoJS.enc.Base64.stringify(passphrasehash);
    const headers = {
      "KC-API-SIGN": signature,
      "KC-API-TIMESTAMP": now,
      "KC-API-KEY": api_key,
      "KC-API-PASSPHRASE": passphrase,
      "KC-API-KEY-VERSION": "2",
    };
    var requestOptions = { method: "GET", headers, redirect: "follow" };
    const data = await fetch(url, requestOptions).then((response) =>
      response.json()
    );

    res.send(`${data.data.availableBalance}`);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users.",
    });
  }
};

exports.update = async (req, res) => {
  const symbols = ["LUNAUSDTM"];

  try {
    for (let symbol of symbols) {
      const data = await History.findOne({
        where: { contracts: symbol },
        order: [["position", "DESC"]],
      });

      const startTime = data.position;
      let currentFilled = data.remain;
      let volume;
      let direction;
      let position;
      if (currentFilled !== 0) {
        volume = data.PNL;
        direction = data.type === "long" ? "buy" : "sell";
        position = data.position;
        await data.destroy();
      }

      const api_key = "62a0906fa5b3460001924a99"; // "62a0643e7b57eb000169d9de"; //
      const api_secret = "71741d7f-e302-44d7-8fdf-a174d3022a99"; // "3d9aad71-55f4-4f2c-a00c-7adce001040a";
      const api_passphrase = "thisisthepassphrase"; // "chocolatechip@bloodles.com"; //

      // luna/usdt
      const api = `/api/v1/orders/?active=done&&symbol=${symbol}`; // ?symbol=XBTUSDTM&&active=done"; //"/api/v1/orders?symbol=XBTUSDTM";
      const url = "https://api-futures.kucoin.com" + api;
      const now = Date.now();
      const str_to_sign = now + "GET" + api;

      const signaturehash = CryptoJS.HmacSHA256(str_to_sign, api_secret);
      const passphrasehash = CryptoJS.HmacSHA256(api_passphrase, api_secret);
      const signature = CryptoJS.enc.Base64.stringify(signaturehash);
      const passphrase = CryptoJS.enc.Base64.stringify(passphrasehash);
      const headers = {
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": now,
        "KC-API-KEY": api_key,
        "KC-API-PASSPHRASE": passphrase,
        "KC-API-KEY-VERSION": "2",
      };
      var requestOptions = { method: "GET", headers, redirect: "follow" };
      fetch(url, requestOptions)
        .then((response) => response.json())

        .then(async (e) => {
          const result = e.data.items
            .filter((e) => e.remark === null && e.endAt > startTime)
            .map((e) => ({
              side: e.side,
              leverage: e.leverage,
              filledSize: e.filledSize,
              filledValue: e.filledValue,
              endAt: e.endAt,
            }))
            .sort(function (a, b) {
              return a.endAt - b.endAt;
            });
          console.log(result);

          for (let el of result) {
            if (!direction) direction = el.side;
            position = el.endAt;
            if (el.side === direction) {
              volume += Number(el.filledValue);
              currentFilled += el.filledSize;
            } else {
              volume -= Number(el.filledValue);
              currentFilled -= el.filledSize;
            }
            if (currentFilled === 0) {
              await History.create({
                contracts: symbol,
                type: direction === "buy" ? "long" : "short",
                PNL: volume,
                position,
                remain: currentFilled,
              });
              direction = undefined;
              volume = 0;
            }
          }

          if (currentFilled !== 0)
            await History.create({
              contracts: symbol,
              type: direction === "buy" ? "long" : "short",
              PNL: volume,
              position,
              remain: currentFilled,
            });
        })
        .catch(console.error);
    }
    res && res.send("success");
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users.",
    });
  }
};
