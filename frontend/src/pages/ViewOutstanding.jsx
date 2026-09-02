import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

const KH_LOGO = "/brands/logo.jpg";

function ViewOutstanding() {
  const { id } = useParams();

  const [records, setRecords] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await API.get("/outstanding");

      const filtered = res.data
        .filter((r) => r.customer && r.customer._id === id)
        .sort((a, b) => {
          const invA = String(a.invoiceNumber || "").trim();
          const invB = String(b.invoiceNumber || "").trim();
          return invA.localeCompare(invB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

      setRecords(filtered);
      if (filtered.length > 0 && filtered[0].customer) {
        setCustomer(filtered[0].customer);
      } else {
        try {
          const custRes = await API.get("/customers");
          const found = custRes.data.find((c) => c._id === id);
          if (found) setCustomer(found);
        } catch (e) {
          console.log(e);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const changeStatus = async (record) => {
    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        status: record.status === "Pending" ? "Paid" : "Pending",
      });

      loadRecords();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this outstanding record?")) return;

    try {
      await API.delete(`/outstanding/${id}`);
      loadRecords();
    } catch (err) {
      console.log(err);
    }
  };

  const extractPaidAmount = (record) => {
    if (!record) return 0;
    if (
      record.paidAmount !== undefined &&
      record.paidAmount !== null &&
      record.paidAmount !== ""
    ) {
      return Number(record.paidAmount) || 0;
    }
    if (record.notes && record.notes.includes("[paidAmount:")) {
      const match = record.notes.match(/\[paidAmount:\s*([^\]]+)\]/);
      if (match && match[1]) return Number(match[1]) || 0;
    }
    return 0;
  };

  const extractOutstandingAmount = (record) => {
    if (!record) return 0;
    if (
      record.outstandingAmount !== undefined &&
      record.outstandingAmount !== null &&
      record.outstandingAmount !== ""
    ) {
      return Number(record.outstandingAmount);
    }
    if (record.notes && record.notes.includes("[outstandingAmount:")) {
      const match = record.notes.match(/\[outstandingAmount:\s*([^\]]+)\]/);
      if (match && match[1]) return Number(match[1]);
    }
    const invAmt = Number(record.totalAmount || record.amount || 0);
    const paid = extractPaidAmount(record);
    return Math.max(0, invAmt - paid);
  };

  const extractDueDate = (record) => {
    if (!record) return null;
    if (record.dueDate) {
      return typeof record.dueDate === "string"
        ? record.dueDate.split("T")[0]
        : new Date(record.dueDate).toISOString().split("T")[0];
    }
    if (record.notes && record.notes.includes("[dueDate:")) {
      const match = record.notes.match(/\[dueDate:\s*([^\]]+)\]/);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  };

  const cleanNotes = (notesStr) => {
    if (!notesStr) return "-";
    const cleaned = notesStr
      .replace(/\[invoiceDate:[^\]]+\]/g, "")
      .replace(/\[remark:[^\]]+\]/g, "")
      .replace(/\[paymentMethod:[^\]]+\]/g, "")
      .replace(/\[paidAmount:[^\]]+\]/g, "")
      .replace(/\[outstandingAmount:[^\]]+\]/g, "")
      .replace(/\[dueDate:[^\]]+\]/g, "")
      .trim();
    return cleaned || "-";
  };

  const packNotes = (
    notesStr,
    invoiceDateStr,
    remarkStr,
    paymentMethodStr,
    paidAmountVal,
    outstandingAmountVal,
    dueDateStr,
  ) => {
    const clean = cleanNotes(notesStr);
    const tags = [];
    if (invoiceDateStr) tags.push(`[invoiceDate:${invoiceDateStr}]`);
    if (remarkStr && remarkStr.trim() && remarkStr !== "-") {
      tags.push(`[remark:${remarkStr.trim()}]`);
    }
    if (
      paymentMethodStr &&
      paymentMethodStr !== "N/A" &&
      paymentMethodStr !== "-"
    ) {
      tags.push(`[paymentMethod:${paymentMethodStr}]`);
    }
    if (
      paidAmountVal !== undefined &&
      paidAmountVal !== null &&
      paidAmountVal !== ""
    ) {
      tags.push(`[paidAmount:${paidAmountVal}]`);
    }
    if (
      outstandingAmountVal !== undefined &&
      outstandingAmountVal !== null &&
      outstandingAmountVal !== ""
    ) {
      tags.push(`[outstandingAmount:${outstandingAmountVal}]`);
    }
    if (dueDateStr) tags.push(`[dueDate:${dueDateStr}]`);

    const joinedTags = tags.join(" ");
    if (!joinedTags) return clean === "-" ? "" : clean;
    return clean && clean !== "-" ? `${clean} ${joinedTags}` : joinedTags;
  };

  const updateRemark = async (record, newRemark) => {
    const invDate = extractInvoiceDate(record);
    const payMethod = extractPaymentMethod(record);
    const paid = extractPaidAmount(record);
    const outstanding = extractOutstandingAmount(record);
    const dueDate = extractDueDate(record);
    const packed = packNotes(
      record.notes,
      invDate,
      newRemark,
      payMethod,
      paid,
      outstanding,
      dueDate,
    );

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? {
              ...r,
              remark: newRemark,
              description: newRemark,
              notes: packed,
            }
          : r,
      ),
    );

    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        remark: newRemark,
        description: newRemark,
        notes: packed,
      });
    } catch (err) {
      console.log("Failed to update remark:", err);
    }
  };

  const updatePaymentMethod = async (record, newPaymentMethod) => {
    const invDate = extractInvoiceDate(record);
    const currentRemark = extractRemark(record);
    const paid = extractPaidAmount(record);
    const outstanding = extractOutstandingAmount(record);
    const dueDate = extractDueDate(record);
    const packed = packNotes(
      record.notes,
      invDate,
      currentRemark === "-" ? "" : currentRemark,
      newPaymentMethod,
      paid,
      outstanding,
      dueDate,
    );

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? {
              ...r,
              paymentMethod: newPaymentMethod,
              notes: packed,
            }
          : r,
      ),
    );

    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        paymentMethod: newPaymentMethod,
        notes: packed,
      });
    } catch (err) {
      console.log("Failed to update payment method:", err);
    }
  };

  const updatePaidAmount = async (record, newPaid) => {
    const paidNum = Number(newPaid) || 0;
    const invAmt = Number(record.totalAmount || record.amount || 0);
    const newOutstanding = Math.max(0, invAmt - paidNum);
    const invDate = extractInvoiceDate(record);
    const currentRemark = extractRemark(record);
    const payMethod = extractPaymentMethod(record);
    const currentDueDate = extractDueDate(record);

    const autoStatus =
      paidNum >= invAmt && invAmt > 0
        ? "Paid"
        : paidNum === 0 && record.status === "Paid"
        ? "Pending"
        : record.status;

    const packed = packNotes(
      record.notes,
      invDate,
      currentRemark === "-" ? "" : currentRemark,
      payMethod,
      paidNum,
      newOutstanding,
      currentDueDate,
    );

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? {
              ...r,
              paidAmount: paidNum,
              outstandingAmount: newOutstanding,
              status: autoStatus,
              notes: packed,
            }
          : r,
      ),
    );

    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        paidAmount: paidNum,
        outstandingAmount: newOutstanding,
        status: autoStatus,
        notes: packed,
      });
    } catch (err) {
      console.log("Failed to update paid amount:", err);
    }
  };

  const updateOutstandingAmount = async (record, newOutstanding) => {
    const outstandingNum = Number(newOutstanding) || 0;
    const invDate = extractInvoiceDate(record);
    const currentRemark = extractRemark(record);
    const payMethod = extractPaymentMethod(record);
    const currentPaid = extractPaidAmount(record);
    const currentDueDate = extractDueDate(record);

    const packed = packNotes(
      record.notes,
      invDate,
      currentRemark === "-" ? "" : currentRemark,
      payMethod,
      currentPaid,
      outstandingNum,
      currentDueDate,
    );

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? {
              ...r,
              outstandingAmount: outstandingNum,
              notes: packed,
            }
          : r,
      ),
    );

    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        outstandingAmount: outstandingNum,
        notes: packed,
      });
    } catch (err) {
      console.log("Failed to update outstanding amount:", err);
    }
  };

  const updateDueDate = async (record, newDueDate) => {
    const invDate = extractInvoiceDate(record);
    const currentRemark = extractRemark(record);
    const payMethod = extractPaymentMethod(record);
    const currentPaid = extractPaidAmount(record);
    const currentOutstanding = extractOutstandingAmount(record);

    const packed = packNotes(
      record.notes,
      invDate,
      currentRemark === "-" ? "" : currentRemark,
      payMethod,
      currentPaid,
      currentOutstanding,
      newDueDate,
    );

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? {
              ...r,
              dueDate: newDueDate,
              notes: packed,
            }
          : r,
      ),
    );

    try {
      await API.put(`/outstanding/${record._id}`, {
        ...record,
        dueDate: newDueDate,
        notes: packed,
      });
    } catch (err) {
      console.log("Failed to update due date:", err);
    }
  };

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

  const extractRemark = (record) => {
    if (!record) return "-";
    if (record.remark && record.remark.trim()) return record.remark.trim();
    if (record.description && record.description.trim())
      return record.description.trim();
    if (record.notes && record.notes.includes("[remark:")) {
      const match = record.notes.match(/\[remark:\s*([^\]]+)\]/);
      if (match && match[1]) return match[1].trim();
    }
    return "-";
  };

  const extractPaymentMethod = (record) => {
    if (!record) return "-";
    if (record.paymentMethod && record.paymentMethod !== "N/A") {
      return record.paymentMethod;
    }
    if (record.notes && record.notes.includes("[paymentMethod:")) {
      const match = record.notes.match(/\[paymentMethod:\s*([^\]]+)\]/);
      if (match && match[1]) return match[1].trim();
    }
    return record.paymentMethod || "-";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    if (typeof dateValue === "string" && dateValue.includes("-")) {
      const datePart = dateValue.split("T")[0];
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        return `${Number(day)}/${Number(month)}/${year}`;
      }
    }
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
  };

  const daysBetween = (record) => {
    const invDateStr =
      extractInvoiceDate(record) ||
      (record.date
        ? typeof record.date === "string"
          ? record.date.split("T")[0]
          : record.date
        : null);

    if (!invDateStr) return 0;
    let invoiceDate;
    if (typeof invDateStr === "string" && invDateStr.includes("-")) {
      const [y, m, d] = invDateStr.split("-").map(Number);
      invoiceDate = new Date(y, m - 1, d);
    } else {
      invoiceDate = new Date(invDateStr);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    invoiceDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - invoiceDate.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const filteredRecords = records
    .filter((record) => {
      if (
        statusFilter &&
        statusFilter !== "All" &&
        record.status !== statusFilter
      ) {
        return false;
      }

      const rawDate =
        extractInvoiceDate(record) ||
        (record.date
          ? typeof record.date === "string"
            ? record.date.split("T")[0]
            : new Date(record.date).toISOString().split("T")[0]
          : "");

      if (!rawDate) return true;

      if (fromDate && rawDate < fromDate) {
        return false;
      }
      if (toDate && rawDate > toDate) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const invA = String(a.invoiceNumber || "").trim();
      const invB = String(b.invoiceNumber || "").trim();
      return invA.localeCompare(invB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const grandTotal = filteredRecords
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + extractOutstandingAmount(r), 0);

  const displayCustomer =
    customer || (records.length > 0 ? records[0].customer : null);

  const formattedToday = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Screen Action Bar */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-3xl font-bold">Outstanding Invoices</h1>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print / Save PDF
            </button>

            <Link
              to={`/outstanding/add/${id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              + Create Outstanding
            </Link>

            <button
              onClick={() => window.history.back()}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Screen Interactive Controls */}
        <div className="print:hidden">
          {displayCustomer && (
            <div className="bg-white rounded-xl shadow p-5 mb-6">
              <h2 className="text-xl font-semibold">{displayCustomer.name}</h2>
              <p className="text-slate-600 mt-1">{displayCustomer.phone}</p>
              <p className="text-slate-600">{displayCustomer.address}</p>
            </div>
          )}

          {/* Filters under Customer Details */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {(fromDate || toDate || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setStatusFilter("All");
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition"
              >
                Reset Filter
              </button>
            )}

            <div className="ml-auto text-sm text-slate-600 self-center">
              Showing <strong>{filteredRecords.length}</strong> of{" "}
              <strong>{records.length}</strong> invoices
            </div>
          </div>
          {/* Screen Interactive Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow mb-8">
            <table className="w-full text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
                <tr className="whitespace-nowrap">
                  <th className="px-3 py-2.5 text-left">Invoice No</th>
                  <th className="px-3 py-2.5 text-left">Date</th>
                  <th className="px-3 py-2.5 text-left">Invoice Date</th>
                  <th className="px-3 py-2.5 text-left">Remarks</th>
                  <th className="px-3 py-2.5 text-center">Payment Method</th>
                  <th className="px-3 py-2.5 text-right">INV Amount</th>
                  <th className="px-3 py-2.5 text-right">Paid Amount</th>
                  <th className="px-3 py-2.5 text-right">Outstanding Amount</th>
                  <th className="px-3 py-2.5 text-center">Due Date</th>
                  <th className="px-3 py-2.5 text-center">Days</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const currentRemark = extractRemark(record);
                  const currentPayment = extractPaymentMethod(record);
                  const currentPaid = extractPaidAmount(record);
                  const currentOutstanding = extractOutstandingAmount(record);
                  const currentDueDate = extractDueDate(record);

                  return (
                    <tr
                      key={record._id}
                      className="border-t border-slate-100 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {record.invoiceNumber}
                      </td>

                      <td className="px-3 py-2 text-slate-600">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-3 py-2 text-slate-600">
                        {formatDate(extractInvoiceDate(record) || record.date)}
                      </td>

                      {/* Editable Remark in Grid */}
                      <td className="px-2 py-1.5 min-w-[130px] max-w-[180px]">
                        <input
                          type="text"
                          defaultValue={
                            currentRemark === "-" ? "" : currentRemark
                          }
                          key={record._id + "_rem_" + currentRemark}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (
                              val !==
                              (currentRemark === "-" ? "" : currentRemark)
                            ) {
                              updateRemark(record, val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.target.blur();
                            }
                          }}
                          placeholder="Add remark..."
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none transition shadow-sm"
                          title="Click to edit remark"
                        />
                      </td>

                      {/* Editable Payment Method in Grid */}
                      <td className="px-2 py-1.5 text-center min-w-[120px]">
                        <select
                          value={
                            currentPayment === "-" ? "N/A" : currentPayment
                          }
                          onChange={(e) =>
                            updatePaymentMethod(record, e.target.value)
                          }
                          className="bg-white border border-slate-200 hover:border-slate-400 focus:border-blue-500 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer transition shadow-sm"
                          title="Change payment method"
                        >
                          <option value="N/A">N/A</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </td>

                      {/* INV Amount */}
                      <td className="px-3 py-2 text-right font-medium text-slate-900 whitespace-nowrap">
                        Rs.{" "}
                        {Number(
                          record.totalAmount || record.amount || 0,
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Editable Paid Amount in Grid */}
                      <td className="px-2 py-1.5 min-w-[110px] max-w-[130px]">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                            Rs.
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={currentPaid || ""}
                            key={record._id + "_paid_" + currentPaid}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (Number(val) !== currentPaid) {
                                updatePaidAmount(record, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.target.blur();
                            }}
                            placeholder="0.00"
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded pl-7 pr-2 py-1 text-xs text-right text-slate-800 focus:outline-none transition shadow-sm font-medium"
                            title="Click to edit paid amount"
                          />
                        </div>
                      </td>

                      {/* Editable Outstanding Amount in Grid */}
                      <td className="px-2 py-1.5 min-w-[110px] max-w-[130px]">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                            Rs.
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={currentOutstanding || ""}
                            key={record._id + "_out_" + currentOutstanding}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (Number(val) !== currentOutstanding) {
                                updateOutstandingAmount(record, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.target.blur();
                            }}
                            placeholder="0.00"
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded pl-7 pr-2 py-1 text-xs text-right text-slate-900 focus:outline-none transition shadow-sm font-bold"
                            title="Click to edit outstanding amount"
                          />
                        </div>
                      </td>

                      {/* Editable Due Date in Grid */}
                      <td className="px-2 py-1.5 min-w-[125px]">
                        <input
                          type="date"
                          defaultValue={currentDueDate || ""}
                          key={record._id + "_due_" + (currentDueDate || "")}
                          onChange={(e) =>
                            updateDueDate(record, e.target.value)
                          }
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none transition shadow-sm cursor-pointer"
                          title="Click to change due date"
                        />
                      </td>

                      <td className="px-3 py-2 text-center text-slate-600">
                        {daysBetween(record)} Days
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-white text-[11px] font-semibold ${
                            record.status === "Pending"
                              ? "bg-red-600"
                              : "bg-green-600"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Link
                            to={`/edit-outstanding/${record._id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => changeStatus(record)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            {record.status === "Pending"
                              ? "Mark Paid"
                              : "Mark Pending"}
                          </button>

                          <button
                            onClick={() => deleteRecord(record._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center py-6 text-slate-500">
                      {records.length === 0
                        ? "No outstanding invoices found for this customer."
                        : "No invoices match the selected date range."}
                    </td>
                  </tr>
                )}

                {filteredRecords.length > 0 && (
                  <tr className="bg-slate-800 text-white font-bold whitespace-nowrap">
                    <td colSpan="7" className="px-3 py-2.5 text-sm">
                      Grand Total Pending
                    </td>

                    <td className="px-3 py-2.5 text-right text-sm font-bold">
                      Rs.{" "}
                      {grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td colSpan="4"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Professional Printable PDF Statement Area */}
        <div
          id="print-area"
          className="relative mx-auto overflow-hidden rounded-lg bg-white font-sans shadow-2xl"
          style={{ width: "210mm", minHeight: "297mm", paddingTop: "22mm" }}
        >
          {/* Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <img src={KH_LOGO} alt="" className="w-80 object-contain" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="statement-header bg-slate-900 px-7 py-4 text-white">
              <div className="relative flex items-center justify-center">
                {/* Logo */}
                <div className="absolute left-0 flex items-center">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
                    <img
                      src={KH_LOGO}
                      alt="KH Technologies"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                {/* Center Heading */}
                <div className="text-center">
                  <h1 className="text-4xl font-extrabold tracking-wider text-white">
                    KH TECHNOLOGIES
                  </h1>

                  <p className="mt-1 text-s font-medium tracking-wide text-slate-300">
                    Total Computer Solutions
                  </p>
                </div>

                {/* Right Side */}
                <div className="absolute right-0 text-right">
                  <p className="text-lg font-bold tracking-[0.2em] text-white">
                    STATEMENT
                  </p>

                  <p className="mt-1 text-[11px] text-slate-300">
                    Outstanding Invoices Summary
                  </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="px-7 pt-6 pb-6">
              {/* Customer Details Box */}
              <div className="mb-5 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs">
                <p className="mb-1.5 font-bold uppercase tracking-wide text-slate-700">
                  Customer Details
                </p>

                <p className="text-slate-800 text-sm">
                  <strong>Dear Sir/Madam:</strong>{" "}
                  {displayCustomer?.name || "N/A"}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-6 text-slate-600">
                  <p>
                    <strong>Phone:</strong> {displayCustomer?.phone || "-"}
                  </p>
                  <p>
                    <strong>Address:</strong> {displayCustomer?.address || "-"}
                  </p>
                  {(fromDate || toDate) && (
                    <p>
                      <strong>Period:</strong>{" "}
                      {`${fromDate ? formatDate(fromDate) : "Start"} - ${
                        toDate ? formatDate(toDate) : "Present"
                      }`}
                    </p>
                  )}
                  {statusFilter !== "All" && (
                    <p>
                      <strong>Status:</strong> {statusFilter}
                    </p>
                  )}
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="table-head bg-slate-800 text-white whitespace-nowrap text-[10px]">
                    <th className="w-[12%] border border-slate-700 px-1.5 py-1.5 text-left font-bold text-white whitespace-nowrap">
                      INVOICE NO
                    </th>
                    <th className="w-[10%] border border-slate-700 px-1.5 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      INV DATE
                    </th>
                    <th className="w-[12%] border border-slate-700 px-1.5 py-1.5 text-left font-bold text-white whitespace-nowrap">
                      REMARKS
                    </th>
                    <th className="w-[11%] border border-slate-700 px-1.5 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      METHOD
                    </th>
                    <th className="w-[12%] border border-slate-700 px-1.5 py-1.5 text-right font-bold text-white whitespace-nowrap">
                      INV AMOUNT
                    </th>
                    <th className="w-[11%] border border-slate-700 px-1.5 py-1.5 text-right font-bold text-white whitespace-nowrap">
                      PAID AMOUNT
                    </th>
                    <th className="w-[13%] border border-slate-700 px-1.5 py-1.5 text-right font-bold text-white whitespace-nowrap">
                      OUTSTANDING
                    </th>
                    <th className="w-[10%] border border-slate-700 px-1.5 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      DUE DATE
                    </th>
                    <th className="w-[7%] border border-slate-700 px-1.5 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      DAYS
                    </th>
                    <th className="w-[8%] border border-slate-700 px-1.5 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      STATUS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-slate-200 hover:bg-slate-50 whitespace-nowrap text-[10.5px]"
                    >
                      <td className="border border-slate-300 px-1.5 py-1.5 font-semibold text-slate-900 whitespace-nowrap">
                        {record.invoiceNumber}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700 whitespace-nowrap">
                        {formatDate(extractInvoiceDate(record) || record.date)}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-left text-slate-700 whitespace-nowrap max-w-[90px] truncate" title={extractRemark(record)}>
                        {extractRemark(record)}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700 font-medium whitespace-nowrap">
                        {extractPaymentMethod(record)}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium text-slate-900 whitespace-nowrap">
                        Rs.{" "}
                        {Number(
                          record.totalAmount || record.amount || 0,
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-right text-slate-700 whitespace-nowrap">
                        Rs.{" "}
                        {Number(extractPaidAmount(record)).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rs.{" "}
                        {Number(
                          extractOutstandingAmount(record),
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700 whitespace-nowrap">
                        {extractDueDate(record)
                          ? formatDate(extractDueDate(record))
                          : "-"}
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700 whitespace-nowrap">
                        {daysBetween(record)} Days
                      </td>

                      <td className="border border-slate-300 px-1.5 py-1.5 text-center font-semibold whitespace-nowrap">
                        <span
                          className={
                            record.status === "Pending"
                              ? "text-red-700 font-bold"
                              : "text-green-700 font-bold"
                          }
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-slate-300 px-3 py-6 text-center text-slate-500 whitespace-nowrap"
                      >
                        No outstanding records found for the selected period.
                      </td>
                    </tr>
                  )}

                  {/* Grand Total Row */}
                  <tr className="grand-total-row bg-slate-900 text-white font-bold whitespace-nowrap">
                    <td
                      colSpan={6}
                      className="border border-slate-900 px-2 py-2 text-xs font-bold tracking-wide text-white whitespace-nowrap"
                    >
                      GRAND TOTAL PENDING
                    </td>

                    <td className="border border-slate-900 px-2 py-2 text-right text-xs font-bold text-white whitespace-nowrap">
                      Rs.{" "}
                      {grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      colSpan={3}
                      className="border border-slate-900 px-2 py-2 text-center text-[10.5px] text-slate-300 whitespace-nowrap"
                    >
                      {filteredRecords.filter((r) => r.status === "Pending")
                        .length}{" "}
                      Pending / {filteredRecords.length} Total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          #print-area,
          #print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }

          @media print {
            @page {
              size: A4;
              margin: 15mm 10mm 10mm 10mm;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: hidden !important;
            }

            body * {
              visibility: hidden;
            }

            #print-area,
            #print-area * {
              visibility: visible;
            }

            #print-area {
              position: absolute !important;
              top: 15mm !important;
              left: 0 !important;
              width: 210mm !important;
              min-height: 282mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
            }

            .statement-header {
              background: #0f172a !important;
              color: #ffffff !important;
              padding-top: 14px !important;
              padding-bottom: 14px !important;
            }

            .statement-header h1,
            .statement-header p {
              color: inherit !important;
            }

            .service-strip {
              background: #f1f5f9 !important;
            }

            .table-head {
              background: #1e293b !important;
              color: #ffffff !important;
            }

            .table-head th {
              background: #1e293b !important;
              color: #ffffff !important;
              border-color: #334155 !important;
            }

            .grand-total-row {
              background: #0f172a !important;
              color: #ffffff !important;
            }

            .grand-total-row td {
              background: #0f172a !important;
              color: #ffffff !important;
              border-color: #0f172a !important;
            }

            table {
              page-break-inside: avoid !important;
            }

            tr {
              page-break-inside: avoid !important;
            }

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

export default ViewOutstanding;

