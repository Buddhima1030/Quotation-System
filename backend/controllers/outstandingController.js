import Outstanding from "../models/Outstanding.js";

export const getOutstanding = async (req, res) => {
  try {
    const records = await Outstanding.find()
      .populate("customer")
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getOutstandingById = async (req, res) => {
  try {
    const record = await Outstanding.findById(req.params.id).populate(
      "customer"
    );

    if (!record) {
      return res.status(404).json({
        message: "Outstanding record not found",
      });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const createOutstanding = async (req, res) => {
  try {
    const record = await Outstanding.create(req.body);

    const populated = await Outstanding.findById(record._id).populate(
      "customer"
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json(err);
  }
};

export const updateOutstanding = async (req, res) => {
  try {
    const record = await Outstanding.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    ).populate("customer");

    res.json(record);
  } catch (err) {
    res.status(400).json(err);
  }
};

export const deleteOutstanding = async (req, res) => {
  try {
    await Outstanding.findByIdAndDelete(req.params.id);

    res.json({
      message: "Outstanding deleted successfully",
    });
  } catch (err) {
    res.status(500).json(err);
  }
};