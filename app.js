const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "pages")));

// Serve o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
