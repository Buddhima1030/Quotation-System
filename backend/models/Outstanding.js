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

    invoiceDate: {
      type: Date,
    },

    items: [outstandingItemSchema],

    amount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    outstandingAmount: {
      type: Number,
      default: 0,
    },

    dueDate: {
      type: Date,
    },

    notes: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    remark: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["N/A", "Cash", "Bank Transfer", "Cheque"],
      default: "N/A",
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