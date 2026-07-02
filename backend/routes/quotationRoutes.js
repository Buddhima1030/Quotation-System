const express = require("express");
const router = express.Router();
const Quotation = require("../models/Quotation");

router.get("/", async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("customer")
      .sort({ createdAt: -1 });

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate("customer");
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const count = await Quotation.countDocuments();
    const quotationNo = "QT-" + String(count + 1).padStart(4, "0");

    const quotation = await Quotation.create({
      quotationNo,
      customer: req.body.customer,
      date: req.body.date,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      notes: req.body.notes,
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        customer: req.body.customer,
        date: req.body.date,
        items: req.body.items,
        totalAmount: req.body.totalAmount,
        notes: req.body.notes,
      },
      { new: true }
    );

    res.json(updatedQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ message: "Quotation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;