import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function CreateQuotations() {
  const getToday = () => new Date().toISOString().split("T")[0];

  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    date: getToday(),
    notes: "",
    items: [{ itemName: "", quantity: 1, price: "0.00", warranty: "" }],
  });

  useEffect(() => {
    loadCustomers();

    if (id) {
      loadQuotation();
    }
  }, [id]);

  const loadCustomers = async () => {
    const res = await API.get("/customers");

    const sortedCustomers = res.data.sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    setCustomers(sortedCustomers);
  };

  const loadQuotation = async () => {
    const res = await API.get(`/quotations/${id}`);

    setForm({
      customerName: res.data.customer?.name || "",
      date: res.data.date?.split("T")[0] || getToday(),
      notes: res.data.notes || "",
      items: res.data.items?.map((item) => ({
        ...item,
        price: Number(item.price || 0).toFixed(2),
      })) || [{ itemName: "", quantity: 1, price: "0.00", warranty: "" }],
    });
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
        { itemName: "", quantity: 1, price: "0.00", warranty: "" },
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
        customer.name.toLowerCase() === form.customerName.trim().toLowerCase(),
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

    const quotationData = {
      customer: selectedCustomer._id,
      date: form.date,
      notes: form.notes,
      items: form.items,
      totalAmount,
    };

    if (isEdit) {
      await API.put(`/quotations/${id}`, quotationData);
      alert("Quotation updated successfully");
      navigate("/quotations");
      return;
    }

    await API.post("/quotations", quotationData);

    alert("Quotation saved successfully");

    setForm({
      customerName: "",
      date: getToday(),
      notes: "",
      items: [{ itemName: "", quantity: 1, price: "0.00", warranty: "" }],
    });

    loadCustomers();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          {isEdit ? "Edit Quotation" : "Create Quotation"}
        </h1>

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
                step="0.01"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
                onBlur={(e) =>
                  updateItem(
                    index,
                    "price",
                    Number(e.target.value || 0).toFixed(2),
                  )
                }
              />

              <input
                list={`warranty-list-${index}`}
                className="border p-3 rounded"
                placeholder="Select or type warranty"
                value={item.warranty}
                onChange={(e) => updateItem(index, "warranty", e.target.value)}
              />

              <datalist id={`warranty-list-${index}`}>
                <option value="NO WARRANTY" />
                <option value="3 MONTHS" />
                <option value="6 MONTHS" />
                <option value="1 YEAR" />
                <option value="2 YEAR" />
              </datalist>

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
            Total: Rs. {totalAmount.toFixed(2)}
          </h2>

          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-3 rounded"
          >
            {isEdit ? "Update Quotation" : "Save Quotation"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateQuotations;
