const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const customer = await Customer.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
      },
      { new: true }
    );

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;