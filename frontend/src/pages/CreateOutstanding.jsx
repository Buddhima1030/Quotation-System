import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

const extractInvoiceDate = (record) => {
  if (!record) return null;
  if (record.invoiceDate) {
    return typeof record.invoiceDate === "string"
      ? record.invoiceDate.split("T")[0]
      : new Date(record.invoiceDate).toISOString().split("T")[0];
  }
  if (record.notes && record.notes.includes("[invoiceDate:")) {
    const match = record.notes.match(/\[invoiceDate:\s*([^\]]+)\]/);
    if (match && match[1]) return match[1].trim();
  }
  return null;
};

const cleanNotes = (notesStr) => {
  if (!notesStr) return "";
  return notesStr.replace(/\[invoiceDate:[^\]]+\]/g, "").trim();
};

const packNotes = (notesStr, invoiceDateStr) => {
  const clean = cleanNotes(notesStr);
  if (!invoiceDateStr) return clean;
  return clean ? `${clean} [invoiceDate:${invoiceDateStr}]` : `[invoiceDate:${invoiceDateStr}]`;
};

function CreateOutstanding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.startsWith("/edit-outstanding");

  const getToday = () => new Date().toISOString().split("T")[0];

  const [customer, setCustomer] = useState(null);

  const [form, setForm] = useState({
    invoiceNumber: "",
    date: getToday(),
    invoiceDate: getToday(),
    status: "Pending",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (isEdit) {
      loadOutstandingRecord();
    } else {
      loadCustomer();
    }
  }, [id, isEdit]);

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
        const parsedInvoiceDate =
          extractInvoiceDate(res.data) ||
          (res.data.date ? res.data.date.split("T")[0] : getToday());

        setForm({
          invoiceNumber: res.data.invoiceNumber || "",
          date: res.data.date ? res.data.date.split("T")[0] : getToday(),
          invoiceDate: parsedInvoiceDate,
          status: res.data.status || "Pending",
          amount:
            res.data.amount !== undefined &&
            res.data.amount !== null &&
            res.data.amount !== 0
              ? res.data.amount
              : res.data.totalAmount !== undefined &&
                res.data.totalAmount !== null
              ? res.data.totalAmount
              : "",
          notes: cleanNotes(res.data.notes || res.data.description || ""),
        });
      }
    } catch (err) {
      console.log("Failed to load outstanding record:", err);
    }
  };

  const saveOutstanding = async (e) => {
    e.preventDefault();

    const numericAmount = Number(form.amount || 0);
    const customerId = customer?._id || id;
    const packedNotes = packNotes(form.notes, form.invoiceDate);

    const payload = {
      customer: customerId,
      invoiceNumber: form.invoiceNumber,
      date: form.date,
      invoiceDate: form.invoiceDate,
      amount: numericAmount,
      totalAmount: numericAmount,
      status: form.status,
      notes: packedNotes,
    };

    try {
      if (isEdit) {
        await API.put(`/outstanding/${id}`, payload);
        alert("Outstanding record updated successfully.");
        navigate(`/outstanding/${customerId}`);
      } else {
        await API.post("/outstanding", payload);
        alert("Outstanding record created successfully.");
        navigate(`/outstanding/${customerId}`);
      }
    } catch (err) {
      console.log(err);
      alert(`Failed to ${isEdit ? "update" : "save"} outstanding.`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">
          {isEdit ? "Edit Outstanding" : "Create Outstanding"}
        </h1>

        {customer && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="text-xl font-semibold">{customer.name}</h2>

            <p>{customer.phone}</p>

            <p>{customer.address}</p>
          </div>
        )}

        <form
          onSubmit={saveOutstanding}
          className="bg-white rounded-xl shadow p-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-medium">Invoice Number</label>

              <input
                type="text"
                className="border rounded w-full p-3 mt-1"
                placeholder="INV-001"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoiceNumber: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="font-medium">Date</label>

              <input
                type="date"
                className="border rounded w-full p-3 mt-1"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="font-medium">Status</label>

              <select
                className="border rounded w-full p-3 mt-1"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
              >
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Invoice Date</label>

              <input
                type="date"
                className="border rounded w-full p-3 mt-1"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoiceDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="font-medium">Amount</label>

              <input
                type="number"
                step="0.01"
                className="border rounded w-full p-3 mt-1"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="font-medium">Notes</label>

            <textarea
              rows="3"
              className="border rounded w-full p-3 mt-1"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-6 text-right">
            <h2 className="text-2xl font-bold">
              Grand Total : Rs. {Number(form.amount || 0).toLocaleString()}
            </h2>
          </div>

          <button
            type="submit"
            className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg"
          >
            {isEdit ? "Update Outstanding" : "Save Outstanding"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateOutstanding;
