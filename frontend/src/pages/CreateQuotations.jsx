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
    subject: "",
    date: getToday(),
    notes: "",
    items: [{ itemName: "", quantity: 1, price: "", amount: "", warranty: "" }],
  });

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
      subject: res.data.subject || "",
      date: res.data.date?.split("T")[0] || getToday(),
      notes: res.data.notes || "",
      items: res.data.items?.map((item) => {
        const hasUnitPrice =
          item.price !== undefined &&
          item.price !== null &&
          item.price !== 0 &&
          item.price !== "";
        const hasAmount =
          item.amount !== undefined &&
          item.amount !== null &&
          item.amount !== 0 &&
          item.amount !== "";

        const priceStr = hasUnitPrice ? Number(item.price).toFixed(2) : "";
        const amountStr = hasAmount
          ? Number(item.amount).toFixed(2)
          : hasUnitPrice
            ? (Number(item.quantity || 1) * Number(item.price)).toFixed(2)
            : "";

        return {
          itemName: item.itemName || "",
          quantity: item.quantity ?? 1,
          price: priceStr,
          amount: amountStr,
          warranty: item.warranty || "",
        };
      }) || [{ itemName: "", quantity: 1, price: "", amount: "", warranty: "" }],
    });
  };

  useEffect(() => {
    loadCustomers();

    if (id) {
      loadQuotation();
    }
  }, [id]);

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    const currentItem = { ...newItems[index], [field]: value };

    if (field === "quantity") {
      const qty = Number(value);
      const pr = Number(currentItem.price);
      if (currentItem.price !== "" && !isNaN(pr) && !isNaN(qty)) {
        currentItem.amount = (qty * pr).toFixed(2);
      }
    } else if (field === "price") {
      const pr = Number(value);
      const qty = Number(currentItem.quantity || 1);
      if (value !== "" && !isNaN(pr) && !isNaN(qty)) {
        currentItem.amount = (qty * pr).toFixed(2);
      }
    }

    newItems[index] = currentItem;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { itemName: "", quantity: 1, price: "", amount: "", warranty: "" },
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
    const itemAmount =
      item.amount !== "" &&
      item.amount !== undefined &&
      item.amount !== null &&
      !isNaN(Number(item.amount))
        ? Number(item.amount)
        : Number(item.quantity || 0) * Number(item.price || 0);
    return total + (isNaN(itemAmount) ? 0 : itemAmount);
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
      subject: form.subject || "",
      date: form.date,
      notes: form.notes,
      items: form.items.map((item) => {
        const unitPrice =
          item.price !== "" &&
          item.price !== undefined &&
          item.price !== null &&
          !isNaN(Number(item.price))
            ? Number(item.price)
            : null;
        const itemAmount =
          item.amount !== "" &&
          item.amount !== undefined &&
          item.amount !== null &&
          !isNaN(Number(item.amount))
            ? Number(item.amount)
            : unitPrice !== null
              ? (Number(item.quantity) || 1) * unitPrice
              : 0;

        return {
          itemName: item.itemName,
          quantity: Number(item.quantity) || 1,
          price: unitPrice,
          amount: itemAmount,
          warranty: item.warranty,
        };
      }),
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
      subject: "",
      date: getToday(),
      notes: "",
      items: [{ itemName: "", quantity: 1, price: "", amount: "", warranty: "" }],
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

          <input
            className="border p-3 rounded w-full"
            placeholder="Subject (Optional - e.g. Supply of Computer Accessories)"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />

          <textarea
            className="border p-3 rounded w-full"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <h2 className="text-xl font-bold">Items</h2>

          <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-600 uppercase px-1">
            <span className="col-span-4">Item Name</span>
            <span className="col-span-1">Qty</span>
            <span className="col-span-2">Unit Price</span>
            <span className="col-span-2">Amount</span>
            <span className="col-span-2">Warranty</span>
            <span className="col-span-1">Action</span>
          </div>

          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3">
              <input
                className="col-span-4 border p-3 rounded"
                placeholder="Item name"
                value={item.itemName}
                onChange={(e) => updateItem(index, "itemName", e.target.value)}
              />

              <input
                className="col-span-1 border p-3 rounded"
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
              />

              <input
                className="col-span-2 border p-3 rounded"
                type="number"
                step="0.01"
                placeholder="Unit Price"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== "" && !isNaN(Number(val))) {
                    updateItem(
                      index,
                      "price",
                      Number(val).toFixed(2),
                    );
                  }
                }}
              />

              <input
                className="col-span-2 border p-3 rounded"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => updateItem(index, "amount", e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== "" && !isNaN(Number(val))) {
                    updateItem(
                      index,
                      "amount",
                      Number(val).toFixed(2),
                    );
                  }
                }}
              />

              <input
                list={`warranty-list-${index}`}
                className="col-span-2 border p-3 rounded"
                placeholder="Warranty"
                value={item.warranty}
                onChange={(e) => updateItem(index, "warranty", e.target.value)}
              />

              <datalist id={`warranty-list-${index}`}>
                <option value="NO WARRANTY" />
                <option value="FREE" />
                <option value="1 MONTH" />
                <option value="2 MONTHS" />
                <option value="3 MONTHS" />
                <option value="6 MONTHS" />
                <option value="1 YEAR" />
                <option value="2 YEARS" />
                <option value="3 YEARS" />
              </datalist>

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="col-span-1 bg-red-600 hover:bg-red-700 text-white rounded p-3"
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
            Total: Rs. {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
