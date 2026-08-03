const mongoose = require("mongoose");

const outstandingItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    default: 1,
  },

  price: {
    type: Number,
    required: true,
    default: 0,
  },
});

const outstandingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    invoiceNumber: {
  type: String,
  required: true,
  trim: true,
},

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    items: [outstandingItemSchema],

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Outstanding", outstandingSchema);