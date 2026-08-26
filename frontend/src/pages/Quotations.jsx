import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function Quotations() {
  const navigate = useNavigate();
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

  const copyQuotation = async (id) => {
    try {
      // 1. Try server-side copy endpoint first
      try {
        const copyRes = await API.post(`/quotations/${id}/copy`);
        if (copyRes.data && copyRes.data._id) {
          alert(
            `Quotation copied as ${formatQuotationNo(copyRes.data.quotationNo)}. You can now edit the customer name.`
          );
          navigate(`/edit-quotation/${copyRes.data._id}`);
          return;
        }
      } catch (err) {
        console.warn("Dedicated copy endpoint not available, falling back to standard create:", err.message);
      }

      // 2. Fallback: fetch original quotation and create new copy via standard POST /quotations
      const res = await API.get(`/quotations/${id}`);
      const original = res.data;
      if (!original) {
        alert("Failed to copy: Original quotation not found.");
        return;
      }

      const customerId = original.customer?._id || original.customer;

      const quotationData = {
        customer: customerId,
        date: new Date().toISOString().split("T")[0],
        notes: original.notes || "",
        items: (original.items || []).map((item) => ({
          itemName: item.itemName || "",
          quantity: Number(item.quantity) || 1,
          price:
            item.price !== undefined && item.price !== null && item.price !== ""
              ? Number(item.price)
              : null,
          amount:
            item.amount !== undefined && item.amount !== null && item.amount !== ""
              ? Number(item.amount)
              : 0,
          warranty: item.warranty || "",
        })),
        totalAmount: Number(original.totalAmount) || 0,
      };

      const createRes = await API.post("/quotations", quotationData);
      alert(
        `Quotation copied as ${formatQuotationNo(createRes.data.quotationNo)}. You can now edit the customer name.`
      );
      navigate(`/edit-quotation/${createRes.data._id}`);
    } catch (error) {
      console.error("Failed to copy quotation:", error);
      alert(
        "Failed to copy quotation: " +
          (error.response?.data?.message || error.message || "Unknown error")
      );
    }
  };

  const formatQuotationNo = (no) => {
    if (!no) return "";
    if (/^QT-26-/i.test(no)) return no;
    if (/^QT-/i.test(no)) return no.replace(/^QT-/i, "QT-26-");
    return `QT-26-${no}`;
  };

  const filtered = quotations.filter((q) => {
    const formattedNo = formatQuotationNo(q.quotationNo);
    return (
      q.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNo?.toLowerCase().includes(search.toLowerCase()) ||
      formattedNo.toLowerCase().includes(search.toLowerCase())
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
                  <td className="p-4">{formatQuotationNo(q.quotationNo)}</td>
                  <td>{q.customer?.name}</td>
                  <td>{new Date(q.date).toLocaleDateString()}</td>
                  <td>
                    Rs.{" "}
                    {Number(q.totalAmount || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="space-x-2">
                    <Link to={`/quotation/${q._id}`}>
                      <button className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded">
                        View
                      </button>
                    </Link>

                    <Link to={`/edit-quotation/${q._id}`}>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded">
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() => copyQuotation(q._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded"
                    >
                      Copy
                    </button>

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