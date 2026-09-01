import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

const extractMetadata = (record) => {
  let invoiceDate = null;
  let remark = record.remark || record.description || "";
  let paymentMethod = record.paymentMethod || "N/A";

  if (record.invoiceDate) {
    invoiceDate =
      typeof record.invoiceDate === "string"
        ? record.invoiceDate.split("T")[0]
        : new Date(record.invoiceDate).toISOString().split("T")[0];
  }

  if (record.notes) {
    if (!invoiceDate && record.notes.includes("[invoiceDate:")) {
      const match = record.notes.match(/\[invoiceDate:\s*([^\]]+)\]/);
      if (match && match[1]) invoiceDate = match[1].trim();
    }
    if (!remark && record.notes.includes("[remark:")) {
      const match = record.notes.match(/\[remark:\s*([^\]]+)\]/);
      if (match && match[1]) remark = match[1].trim();
    }
    if (
      (!paymentMethod || paymentMethod === "N/A") &&
      record.notes.includes("[paymentMethod:")
    ) {
      const match = record.notes.match(/\[paymentMethod:\s*([^\]]+)\]/);
      if (match && match[1]) paymentMethod = match[1].trim();
    }
  }

  return {
    invoiceDate,
    remark,
    paymentMethod: paymentMethod || "N/A",
  };
};

const cleanNotes = (notesStr) => {
  if (!notesStr) return "";
  return notesStr
    .replace(/\[invoiceDate:[^\]]+\]/g, "")
    .replace(/\[remark:[^\]]+\]/g, "")
    .replace(/\[paymentMethod:[^\]]+\]/g, "")
    .trim();
};

const packNotes = (notesStr, invoiceDateStr, remarkStr, paymentMethodStr) => {
  const clean = cleanNotes(notesStr);
  const tags = [];
  if (invoiceDateStr) tags.push(`[invoiceDate:${invoiceDateStr}]`);
  if (remarkStr && remarkStr.trim()) tags.push(`[remark:${remarkStr.trim()}]`);
  if (paymentMethodStr && paymentMethodStr !== "N/A") {
    tags.push(`[paymentMethod:${paymentMethodStr}]`);
  }
  const joinedTags = tags.join(" ");
  if (!joinedTags) return clean;
  return clean ? `${clean} ${joinedTags}` : joinedTags;
};

function CreateOutstanding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.startsWith("/edit-outstanding");

  const getToday = () => new Date().toISOString().split("T")[0];

  const emptyInvoice = () => ({
    invoiceNumber: "",
    date: getToday(),
    status: "Pending",
    invoiceDate: getToday(),
    amount: "",
    notes: "",
    remark: "",
    paymentMethod: "N/A",
  });

  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([emptyInvoice()]);
  const [allExistingInvoices, setAllExistingInvoices] = useState([]);

  useEffect(() => {
    loadExistingInvoices();
    if (isEdit) {
      loadOutstandingRecord();
    } else {
      loadCustomer();
    }
  }, [id, isEdit]);

  const loadExistingInvoices = async () => {
    try {
      const res = await API.get("/outstanding");
      setAllExistingInvoices(res.data || []);
    } catch (err) {
      console.log("Failed to load existing invoices:", err);
    }
  };

  const getDuplicateError = (index, invNum) => {
    const trimmed = (invNum || "").trim().toLowerCase();
    if (!trimmed) return null;

    // Check duplicate in other rows of the current form
    for (let i = 0; i < invoices.length; i++) {
      if (
        i !== index &&
        (invoices[i].invoiceNumber || "").trim().toLowerCase() === trimmed
      ) {
        return `Duplicate with Invoice #${i + 1} in this form`;
      }
    }

    // Check duplicate in database
    const found = allExistingInvoices.find((record) => {
      if (isEdit && record._id === id) return false;
      return (record.invoiceNumber || "").trim().toLowerCase() === trimmed;
    });

    if (found) {
      const custName = found.customer?.name
        ? ` (${found.customer.name})`
        : "";
      return `Already exists in database${custName}`;
    }

    return null;
  };

  const loadCustomer = async () => {
    try {
      const res = await API.get("/customers");
      const selected = res.data.find((c) => c._id === id);
      setCustomer(selected);
    } catch (err) {
      console.log(err);
    }
  };

  const loadOutstandingRecord = async () => {
    try {
      const res = await API.get(`/outstanding/${id}`);
      if (res.data) {
        if (res.data.customer) {
          setCustomer(res.data.customer);
        }
        const meta = extractMetadata(res.data);
        const parsedInvoiceDate =
          meta.invoiceDate ||
          (res.data.date ? res.data.date.split("T")[0] : getToday());

        setInvoices([
          {
            invoiceNumber: res.data.invoiceNumber || "",
            date: res.data.date ? res.data.date.split("T")[0] : getToday(),
            status: res.data.status || "Pending",
            invoiceDate: parsedInvoiceDate,
            amount:
              res.data.amount !== undefined &&
              res.data.amount !== null &&
              res.data.amount !== 0
                ? res.data.amount
                : res.data.totalAmount !== undefined &&
                  res.data.totalAmount !== null
                ? res.data.totalAmount
                : "",
            notes: cleanNotes(res.data.notes || ""),
            remark: meta.remark || "",
            paymentMethod: meta.paymentMethod || "N/A",
          },
        ]);
      }
    } catch (err) {
      console.log("Failed to load outstanding record:", err);
    }
  };

  const addInvoice = () => {
    setInvoices([...invoices, emptyInvoice()]);
  };

  const removeInvoice = (index) => {
    if (invoices.length === 1) return;
    setInvoices(invoices.filter((_, i) => i !== index));
  };

  const updateInvoice = (index, field, value) => {
    const updated = [...invoices];
    updated[index][field] = value;
    setInvoices(updated);
  };

  const totalAmount = invoices.reduce(
    (sum, inv) => sum + Number(inv.amount || 0),
    0
  );

  const saveOutstanding = async (e) => {
    e.preventDefault();

    const customerId = customer?._id || id;

    // Validate that invoice numbers and amounts are present
    for (let i = 0; i < invoices.length; i++) {
      if (!invoices[i].invoiceNumber.trim()) {
        alert(`Please enter an Invoice Number for invoice #${i + 1}`);
        return;
      }
      if (invoices[i].amount === "" || isNaN(Number(invoices[i].amount))) {
        alert(`Please enter a valid Amount for invoice #${i + 1}`);
        return;
      }
    }

    // Check duplicate invoice numbers within current form entries
    const seenInForm = new Set();
    for (let i = 0; i < invoices.length; i++) {
      const invTrimmed = invoices[i].invoiceNumber.trim().toLowerCase();
      if (seenInForm.has(invTrimmed)) {
        alert(
          `Duplicate invoice number "${invoices[i].invoiceNumber.trim()}" in invoice #${
            i + 1
          }. Each invoice number must be unique.`
        );
        return;
      }
      seenInForm.add(invTrimmed);
    }

    // Validate against existing invoices in database (across same or different customers)
    try {
      const existingRes = await API.get("/outstanding");
      const allExisting = existingRes.data || [];

      for (let i = 0; i < invoices.length; i++) {
        const invTrimmed = invoices[i].invoiceNumber.trim().toLowerCase();
        const duplicate = allExisting.find((record) => {
          if (isEdit && record._id === id) return false;
          return (record.invoiceNumber || "").trim().toLowerCase() === invTrimmed;
        });

        if (duplicate) {
          const custName = duplicate.customer?.name
            ? ` (Customer: ${duplicate.customer.name})`
            : "";
          alert(
            `Invoice number "${invoices[i].invoiceNumber.trim()}" already exists${custName}. Invoice numbers cannot be duplicated for the same or different customers.`
          );
          return;
        }
      }
    } catch (err) {
      console.log("Could not check duplicate invoices:", err);
    }

    try {
      if (isEdit) {
        const inv = invoices[0];
        const numericAmount = Number(inv.amount || 0);
        const packedNotes = packNotes(
          inv.notes,
          inv.invoiceDate,
          inv.remark,
          inv.paymentMethod
        );

        await API.put(`/outstanding/${id}`, {
          customer: customerId,
          invoiceNumber: inv.invoiceNumber.trim(),
          date: inv.date,
          invoiceDate: inv.invoiceDate,
          amount: numericAmount,
          totalAmount: numericAmount,
          status: inv.status,
          remark: inv.remark || "",
          description: inv.remark || "",
          paymentMethod: inv.paymentMethod || "N/A",
          notes: packedNotes,
        });

        alert("Outstanding record updated successfully.");
        navigate(`/outstanding/${customerId}`);
      } else {
        const promises = invoices.map((inv) => {
          const numericAmount = Number(inv.amount || 0);
          const packedNotes = packNotes(
            inv.notes,
            inv.invoiceDate,
            inv.remark,
            inv.paymentMethod
          );

          return API.post("/outstanding", {
            customer: customerId,
            invoiceNumber: inv.invoiceNumber.trim(),
            date: inv.date,
            invoiceDate: inv.invoiceDate,
            amount: numericAmount,
            totalAmount: numericAmount,
            status: inv.status,
            remark: inv.remark || "",
            description: inv.remark || "",
            paymentMethod: inv.paymentMethod || "N/A",
            notes: packedNotes,
          });
        });

        await Promise.all(promises);

        alert(
          `${invoices.length} Outstanding invoice${
            invoices.length > 1 ? "s" : ""
          } created successfully.`
        );
        navigate(`/outstanding/${customerId}`);
      }
    } catch (err) {
      console.log(err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "save"} outstanding.`;
      alert(errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Outstanding" : "Create Outstanding"}
          </h1>

          <button
            onClick={() => window.history.back()}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            ← Back
          </button>
        </div>

        {customer && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <p className="text-slate-600 mt-1">{customer.phone}</p>
            <p className="text-slate-600">{customer.address}</p>
          </div>
        )}

        <form
          onSubmit={saveOutstanding}
          className="bg-white rounded-xl shadow p-6"
        >
          <div className="space-y-6">
            {invoices.map((inv, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border ${
                  invoices.length > 1
                    ? "border-slate-300 bg-slate-50/50"
                    : "border-slate-200"
                }`}
              >
                {invoices.length > 1 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Invoice #{index + 1}
                    </span>
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => removeInvoice(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold transition"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                )}

                {/* First Row: Invoice Number, Date, Status, Invoice Date, Amount */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      className={`border rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 ${
                        getDuplicateError(index, inv.invoiceNumber)
                          ? "border-red-500 bg-red-50/50 text-red-900 focus:ring-red-500"
                          : "border-slate-300 focus:ring-blue-500"
                      }`}
                      placeholder="INV-001"
                      value={inv.invoiceNumber}
                      onChange={(e) =>
                        updateInvoice(index, "invoiceNumber", e.target.value)
                      }
                      required
                    />
                    {getDuplicateError(index, inv.invoiceNumber) && (
                      <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                        ⚠️ {getDuplicateError(index, inv.invoiceNumber)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inv.date}
                      onChange={(e) =>
                        updateInvoice(index, "date", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Status
                    </label>
                    <select
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inv.status}
                      onChange={(e) =>
                        updateInvoice(index, "status", e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inv.invoiceDate}
                      onChange={(e) =>
                        updateInvoice(index, "invoiceDate", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      value={inv.amount}
                      onChange={(e) =>
                        updateInvoice(index, "amount", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Second Row: Notes, Remark, Payment Method */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes (optional)"
                      value={inv.notes}
                      onChange={(e) =>
                        updateInvoice(index, "notes", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Remark
                    </label>
                    <input
                      type="text"
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Remark (optional)"
                      value={inv.remark}
                      onChange={(e) =>
                        updateInvoice(index, "remark", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Payment Method
                    </label>
                    <select
                      className="border border-slate-300 rounded-lg w-full p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inv.paymentMethod}
                      onChange={(e) =>
                        updateInvoice(index, "paymentMethod", e.target.value)
                      }
                    >
                      <option value="N/A">N/A</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Under notes row add "add" button to add another outstanding for the same customer */}
          {!isEdit && (
            <div className="mt-5">
              <button
                type="button"
                onClick={addInvoice}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
              >
                + Add Another Invoice
              </button>
            </div>
          )}

          {/* Grand Total and Save Button */}
          <div className="mt-8 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow transition"
            >
              {isEdit
                ? "Update Outstanding"
                : `Save ${invoices.length > 1 ? "All Outstandings" : "Outstanding"}`}
            </button>

            <div className="text-right">
              {invoices.length > 1 && (
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  {invoices.length} Invoices
                </span>
              )}
              <h2 className="text-2xl font-bold text-slate-900">
                Grand Total : Rs.{" "}
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateOutstanding;
