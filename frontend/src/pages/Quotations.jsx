import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    const res = await API.get("/quotations");
    setQuotations(res.data);
  };

  const deleteQuotation = async (id) => {
    const confirmDelete = confirm("Delete this quotation?");
    if (!confirmDelete) return;

    await API.delete(`/quotations/${id}`);
    loadQuotations();
  };

  const filtered = quotations.filter((q) => {
    return (
      q.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNo?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Past Quotations</h1>

        <input
          className="w-full p-3 border rounded mb-5"
          placeholder="Search customer or quotation no"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="bg-white rounded-xl shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-200">
                <th className="p-4">Quotation</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((q) => (
                <tr key={q._id} className="border-t">
                  <td className="p-4">{q.quotationNo}</td>
                  <td>{q.customer?.name}</td>
                  <td>{new Date(q.date).toLocaleDateString()}</td>
                  <td>Rs. {Number(q.totalAmount || 0).toFixed(2)}</td>

                  <td className="space-x-2">
                    <Link to={`/quotation/${q._id}`}>
                      <button className="bg-blue-700 text-white px-3 py-2 rounded">
                        View
                      </button>
                    </Link>

                    <Link to={`/edit-quotation/${q._id}`}>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded">
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() => deleteQuotation(q._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Quotations;