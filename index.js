require('dotenv').config()
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const apiController = require("./controllers/api");
const apiRoute = require("./routes/api");
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(apiRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server listening on port 5000!");
});

setInterval(apiController.update, 60000);

process.on("error", (e) => {
  console.log(e);
});
