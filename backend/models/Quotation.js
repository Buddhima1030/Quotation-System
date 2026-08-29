const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: String,

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    date: Date,

    items: [
      {
        itemName: String,
        quantity: Number,
        price: Number,
        amount: Number,
        warranty: String,
      },
    ],

    totalAmount: Number,
    notes: String,
    subject: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", quotationSchema);