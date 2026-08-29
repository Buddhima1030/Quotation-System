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

      const filtered = res.data.filter(
        (r) => r.customer && r.customer._id === id,
      );

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
    if (!notesStr) return "-";
    const cleaned = notesStr.replace(/\[invoiceDate:[^\]]+\]/g, "").trim();
    return cleaned || "-";
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

  const filteredRecords = records.filter((record) => {
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
  });

  const grandTotal = filteredRecords
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + Number(r.totalAmount || r.amount || 0), 0);

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
          <table className="w-full bg-white rounded-xl shadow overflow-hidden mb-8">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-3 text-left">Invoice No</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Invoice Date</th>
                <th className="p-3 text-left">Notes</th>
                <th className="p-3 text-left">Total Amount</th>
                <th className="p-3 text-left">Days</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record._id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-semibold">{record.invoiceNumber}</td>

                  <td className="p-3">{formatDate(record.date)}</td>
                  <td className="p-3">
                    {formatDate(extractInvoiceDate(record) || record.date)}
                  </td>

                  <td className="p-3">
                    {cleanNotes(record.notes || record.description)}
                  </td>

                  <td className="p-3 font-medium">
                    Rs.{" "}
                    {Number(
                      record.totalAmount || record.amount || 0,
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="p-3">{daysBetween(record)} Days</td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                        record.status === "Pending"
                          ? "bg-red-600"
                          : "bg-green-600"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">
                    <Link
                      to={`/edit-outstanding/${record._id}`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => changeStatus(record)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                    >
                      {record.status === "Pending"
                        ? "Mark Paid"
                        : "Mark Pending"}
                    </button>

                    <button
                      onClick={() => deleteRecord(record._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    {records.length === 0
                      ? "No outstanding invoices found for this customer."
                      : "No invoices match the selected date range."}
                  </td>
                </tr>
              )}

              {filteredRecords.length > 0 && (
                <tr className="bg-slate-800 text-white font-bold">
                  <td colSpan="4" className="p-3">
                    Grand Total Pending
                  </td>

                  <td className="p-3">
                    Rs.{" "}
                    {grandTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td colSpan="3"></td>
                </tr>
              )}
            </tbody>
          </table>
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

              {/* Requested 5-Column Printable Table */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="table-head bg-slate-800 text-white">
                    <th className="w-[28%] border border-slate-700 px-3 py-2 text-left font-bold text-white">
                      INVOICE NUMBER
                    </th>
                    <th className="w-[20%] border border-slate-700 px-3 py-2 text-center font-bold text-white">
                      INVOICE DATE
                    </th>
                    <th className="w-[24%] border border-slate-700 px-3 py-2 text-right font-bold text-white">
                      TOTAL AMOUNT
                    </th>
                    <th className="w-[14%] border border-slate-700 px-3 py-2 text-center font-bold text-white">
                      DAYS
                    </th>
                    <th className="w-[14%] border border-slate-700 px-3 py-2 text-center font-bold text-white">
                      STATUS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                        {record.invoiceNumber}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-center text-slate-700">
                        {formatDate(extractInvoiceDate(record) || record.date)}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-right font-medium text-slate-900">
                        Rs.{" "}
                        {Number(
                          record.totalAmount || record.amount || 0,
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-center text-slate-700">
                        {daysBetween(record)} Days
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-center font-semibold">
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
                        colSpan={5}
                        className="border border-slate-300 px-3 py-6 text-center text-slate-500"
                      >
                        No outstanding records found for the selected period.
                      </td>
                    </tr>
                  )}

                  {/* Grand Total Row */}
                  <tr className="grand-total-row bg-slate-900 text-white font-bold">
                    <td
                      colSpan={2}
                      className="border border-slate-900 px-3 py-2.5 text-sm font-bold tracking-wide text-white"
                    >
                      GRAND TOTAL PENDING
                    </td>

                    <td className="border border-slate-900 px-3 py-2.5 text-right text-sm font-bold text-white">
                      Rs.{" "}
                      {grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      colSpan={2}
                      className="border border-slate-900 px-3 py-2.5 text-center text-xs text-slate-300"
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

