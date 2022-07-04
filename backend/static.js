const express = require("express");
export default const app = express();
app.use(express.static("frontend"));
