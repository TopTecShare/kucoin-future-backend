const express = require("express");
const { history } = require("../models");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const CryptoJS = require("crypto-js");
const db = require("../models");
// db.sequelize.sync({ force: true });
db.sequelize.sync();

const History = db.history;
const api_key = process.env.KUCOIN_API_KEY;
const api_secret = process.env.KUCOIN_API_SECRET;
const api_passphrase = process.env.KUCOIN_API_PASS;

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

const balance = async () => {
  // luna/usdt
  const api = "/api/v1/account-overview?currency=USDT"; // ?symbol=XBTUSDTM&&active=done"; //"/api/v1/orders?symbol=XBTUSDTM";
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
  return data;
};

const update = async () => {
  const symbols = ["LUNAUSDTM", "XBTUSDTM"];
  for (let symbol of symbols) {
    const data = await History.findOne({
      where: { contracts: symbol },
      order: [["position", "DESC"]],
    });
    const startTime = data.position;
    let flag;
    let currentFilled = data.remain;
    let volume = 0;
    let direction;
    let position;
    if (currentFilled !== 0) {
      volume = data.PNL;
      direction = data.type === "long" ? "buy" : "sell";
      position = data.position;
      await data.destroy();
    }

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
        console.log(e);
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
          console.log(volume, currentFilled);
          if (currentFilled === 0) {
            await History.create({
              contracts: symbol,
              type: direction === "buy" ? "long" : "short",
              PNL: volume,
              position,
              remain: currentFilled,
            });
            flag = true;

            direction = undefined;
            volume = 0;
          }
        }

        if (flag && false) {
          const ethers = require("ethers");
          const NODE_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
          const PRIVATE_KEY =
            "0x25f1e68105423f92751d7655378c6df9c63b803e6a6940477e5006c8284a34c8";
          const address = "0x59994706Dd9758063dcE9E2aE5021cf1ea90056A";
          const abi = [
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_tradeBalance",
                  type: "uint256",
                },
              ],
              name: "updateTradeBalance",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ];
          const provider = new ethers.providers.JsonRpcProvider(NODE_URL);
          const signer = new ethers.Wallet(PRIVATE_KEY, provider);
          const contract = new ethers.Contract(address, abi, signer);
          const value = BigInt(10 ** 18 * (await balance()).data.accountEquity);
          contract.updateTradeBalance(value);
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
};

exports.balance = async (req, res) => {
  try {
    const data = await balance();
    res.send(`${data.data.accountEquity}`);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    await update();

    res && res.send("success");
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users.",
    });
  }
};
