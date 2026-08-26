const mongoose = require("mongoose");
const Quotation = require("./models/Quotation");

const updatePastQuotations = async () => {
  try {
    const quotations = await Quotation.find({
      quotationNo: { $not: /^QT-26-/i },
    });

    for (const q of quotations) {
      if (q.quotationNo) {
        const newNo = q.quotationNo.replace(/^QT-/i, "QT-26-");
        const finalNo = /^QT-26-/i.test(newNo) ? newNo : `QT-26-${q.quotationNo}`;
        await Quotation.findByIdAndUpdate(q._id, { quotationNo: finalNo });
      }
    }
  } catch (err) {
    console.error("Migration error updating past quotation numbers:", err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    await updatePastQuotations();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;