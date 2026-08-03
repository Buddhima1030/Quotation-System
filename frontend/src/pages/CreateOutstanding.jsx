import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function CreateOutstanding() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);

  const [form, setForm] = useState({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
    notes: "",
    items: [
      {
        itemName: "",
        quantity: 1,
        price: 0,
      },
    ],
  });

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const res = await API.get("/customers");

      const selected = res.data.find((c) => c._id === id);

      setCustomer(selected);
    } catch (err) {
      console.log(err);
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...form.items];

    updated[index][field] = value;

    setForm({
      ...form,
      items: updated,
    });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          itemName: "",
          quantity: 1,
          price: 0,
        },
      ],
    });
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;

    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const totalAmount = form.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );

  const saveOutstanding = async (e) => {
    e.preventDefault();

    try {
      await API.post("/outstanding", {
        customer: id,
        invoiceNumber: form.invoiceNumber,
        date: form.date,
        items: form.items,
        notes: form.notes,
        totalAmount,
        status: form.status,
      });

      alert("Outstanding record created successfully.");

      navigate(`/outstanding/${id}`);
    } catch (err) {
      console.log(err);
      alert("Failed to save outstanding.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">Create Outstanding</h1>

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
            <div className="mb-5">
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
          </div>

          <table className="w-full border">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-2">Description</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit Price</th>
                <th className="p-2">Amount</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {form.items.map((item, index) => (
                <tr key={index}>
                  <td className="p-2">
                    <input
                      className="border rounded w-full p-2"
                      value={item.itemName}
                      onChange={(e) =>
                        updateItem(index, "itemName", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      className="border rounded w-full p-2"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      className="border rounded w-full p-2"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-2 font-semibold">
                    Rs.{" "}
                    {(
                      Number(item.quantity || 0) * Number(item.price || 0)
                    ).toLocaleString()}
                  </td>

                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
          >
            + Add Item
          </button>

          <div className="mt-6">
            <label className="font-medium">Notes</label>

            <textarea
              rows="3"
              className="border rounded w-full p-3 mt-1"
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
              Grand Total : Rs. {totalAmount.toLocaleString()}
            </h2>
          </div>

          <button
            type="submit"
            className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg"
          >
            Save Outstanding
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateOutstanding;
