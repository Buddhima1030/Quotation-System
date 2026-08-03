import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function ViewOutstanding() {
  const { id } = useParams();

  const [records, setRecords] = useState([]);

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

  const daysBetween = (date) => {
    const invoice = new Date(date);
    const today = new Date();

    return Math.floor((today - invoice) / (1000 * 60 * 60 * 24));
  };

  const grandTotal = records
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + Number(r.totalAmount), 0);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Outstanding Invoices</h1>

        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="text-xl font-semibold">
              {records[0].customer.name}
            </h2>

            <p>{records[0].customer.phone}</p>

            <p>{records[0].customer.address}</p>
          </div>
        )}

        <table className="w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3 text-left">Invoice No</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Days</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record._id} className="border-t">
                <td className="p-3 font-semibold">{record.invoiceNumber}</td>

                <td className="p-3">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {new Date(record.date).toLocaleDateString()}
                </td>

                <td className="p-3">{record.description}</td>

                <td className="p-3">
                  Rs. {Number(record.totalAmount).toLocaleString()}
                </td>

                <td className="p-3">{daysBetween(record.date)} Days</td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded text-white ${
                      record.status === "Pending"
                        ? "bg-red-600"
                        : "bg-green-600"
                    }`}
                  >
                    {record.status}
                  </span>
                </td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => changeStatus(record)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                  >
                    {record.status === "Pending" ? "Mark Paid" : "Mark Pending"}
                  </button>

                  <button
                    onClick={() => deleteRecord(record._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            <tr className="bg-slate-800 text-white font-bold">
<td colSpan="3" className="p-3">                Grand Total Pending
              </td>

              <td className="p-3">Rs. {grandTotal.toLocaleString()}</td>

              <td colSpan="4"></td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default ViewOutstanding;
