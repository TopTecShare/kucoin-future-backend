const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const apiRoute = require("./routes/api");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(apiRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5000, () => {
  console.log("Server listening on port 5000!");
});


