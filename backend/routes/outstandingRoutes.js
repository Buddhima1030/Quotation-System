const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
    res.send("Outstanding route works");
});

const Outstanding = require("../models/Outstanding");

// Get all
router.get("/", async (req, res) => {
  try {
    const records = await Outstanding.find()
      .populate("customer")
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one
router.get("/:id", async (req, res) => {
  try {
    const record = await Outstanding.findById(req.params.id).populate("customer");

    if (!record) {
      return res.status(404).json({
        message: "Outstanding record not found",
      });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create
router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const invNum = req.body.invoiceNumber ? req.body.invoiceNumber.trim() : "";
    if (invNum) {
      const existing = await Outstanding.findOne({
        invoiceNumber: {
          $regex: new RegExp(
            "^" + invNum.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
            "i"
          ),
        },
      });
      if (existing) {
        return res.status(400).json({
          error: `Invoice number "${invNum}" already exists. Invoice numbers must be unique across all customers.`,
        });
      }
    }

    const outstanding = new Outstanding(req.body);

    await outstanding.save();

    const saved = await Outstanding.findById(outstanding._id).populate(
      "customer"
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);

    res.status(400).json({
      error: err.message,
      errors: err.errors,
    });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const invNum = req.body.invoiceNumber ? req.body.invoiceNumber.trim() : "";
    if (invNum) {
      const existing = await Outstanding.findOne({
        _id: { $ne: req.params.id },
        invoiceNumber: {
          $regex: new RegExp(
            "^" + invNum.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
            "i"
          ),
        },
      });
      if (existing) {
        return res.status(400).json({
          error: `Invoice number "${invNum}" already exists on another outstanding record.`,
        });
      }
    }

    const updated = await Outstanding.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("customer");

    res.json(updated);
  } catch (err) {
    res.status(400).json({
      message: err.message,
      error: err.message,
    });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    await Outstanding.findByIdAndDelete(req.params.id);

    res.json({
      message: "Outstanding deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;