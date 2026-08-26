const express = require("express");
const router = express.Router();
const Quotation = require("../models/Quotation");

const formatQuotationNo = (no) => {
  if (!no) return "";
  if (/^QT-26-/i.test(no)) return no;
  if (/^QT-/i.test(no)) return no.replace(/^QT-/i, "QT-26-");
  return `QT-26-${no}`;
};

const getNextQuotationNo = async () => {
  const quotations = await Quotation.find({}, { quotationNo: 1 });
  let maxNum = 0;
  for (const q of quotations) {
    if (q.quotationNo) {
      const match = q.quotationNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return "QT-26-" + String(maxNum + 1).padStart(4, "0");
};

router.get("/", async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("customer")
      .sort({ createdAt: -1 });

    const formattedQuotations = await Promise.all(
      quotations.map(async (q) => {
        const formatted = formatQuotationNo(q.quotationNo);
        if (q.quotationNo !== formatted) {
          q.quotationNo = formatted;
          await Quotation.findByIdAndUpdate(q._id, { quotationNo: formatted });
        }
        return q;
      })
    );

    res.json(formattedQuotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate("customer");
    if (quotation) {
      const formatted = formatQuotationNo(quotation.quotationNo);
      if (quotation.quotationNo !== formatted) {
        quotation.quotationNo = formatted;
        await Quotation.findByIdAndUpdate(quotation._id, { quotationNo: formatted });
      }
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const quotationNo = await getNextQuotationNo();

    const quotation = await Quotation.create({
      quotationNo,
      customer: req.body.customer,
      date: req.body.date || new Date(),
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      notes: req.body.notes,
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/copy", async (req, res) => {
  try {
    const original = await Quotation.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const quotationNo = await getNextQuotationNo();

    const quotation = await Quotation.create({
      quotationNo,
      customer: original.customer,
      date: new Date(),
      items: original.items,
      totalAmount: original.totalAmount,
      notes: original.notes,
    });

    const populated = await Quotation.findById(quotation._id).populate("customer");
    res.status(201).json(populated);
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