import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function CreateQuotations() {
  const getToday = () => new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    date: getToday(),
    notes: "",
    items: [{ itemName: "", quantity: 1, price: 0, warranty: "" }],
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const res = await API.get("/customers");

    const sortedCustomers = res.data.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setCustomers(sortedCustomers);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { itemName: "", quantity: 1, price: 0, warranty: "" },
      ],
    });
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const totalAmount = form.items.reduce((total, item) => {
    return total + Number(item.quantity) * Number(item.price);
  }, 0);

  const saveQuotation = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("Please select or type customer name");
      return;
    }

    let selectedCustomer = customers.find(
      (customer) =>
        customer.name.toLowerCase() === form.customerName.trim().toLowerCase()
    );

    if (!selectedCustomer) {
      const res = await API.post("/customers", {
        name: form.customerName.trim(),
        phone: "0000000000",
        email: "",
        address: "",
      });

      selectedCustomer = res.data;
    }

    await API.post("/quotations", {
      customer: selectedCustomer._id,
      date: form.date,
      notes: form.notes,
      items: form.items,
      totalAmount,
    });

    alert("Quotation saved successfully");

    setForm({
      customerName: "",
      date: getToday(),
      notes: "",
      items: [{ itemName: "", quantity: 1, price: 0, warranty: "" }],
    });

    loadCustomers();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Create Quotation</h1>

        <form
          onSubmit={saveQuotation}
          className="bg-white p-6 rounded-xl shadow space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border p-3 rounded"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
              >
                <option value="">Select saved customer</option>

                {customers.map((customer) => (
                  <option key={customer._id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <input
                className="border p-3 rounded"
                placeholder="Or type customer name"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
              />
            </div>

            <input
              className="border p-3 rounded"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <textarea
            className="border p-3 rounded w-full"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <h2 className="text-xl font-bold">Items</h2>

          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-3">
              <input
                className="border p-3 rounded"
                placeholder="Item name"
                value={item.itemName}
                onChange={(e) => updateItem(index, "itemName", e.target.value)}
              />

              <input
                className="border p-3 rounded"
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
              />

              <input
                className="border p-3 rounded"
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
              />

              <input
                className="border p-3 rounded"
                placeholder="Warranty"
                value={item.warranty}
                onChange={(e) => updateItem(index, "warranty", e.target.value)}
              />

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="bg-slate-700 text-white px-4 py-2 rounded"
          >
            + Add Item
          </button>

          <h2 className="text-2xl font-bold text-blue-700">
            Total: Rs. {totalAmount.toLocaleString()}
          </h2>

          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-3 rounded"
          >
            Save Quotation
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateQuotations;