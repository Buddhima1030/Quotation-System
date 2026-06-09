require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const customerRoutes = require("./routes/customerRoutes");
const quotationRoutes = require("./routes/quotationRoutes");

const app = express();

connectDB();

app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options(/.*/, cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/quotations", quotationRoutes);

app.get("/", (req, res) => {
  res.send("Quotation API Running");
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;