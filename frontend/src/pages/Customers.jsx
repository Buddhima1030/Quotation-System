import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const res = await API.get("/customers");

    const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));

    setCustomers(sorted);
  };

  const deleteCustomer = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmDelete) return;

    await API.delete(`/customers/${id}`);

    loadCustomers();
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    let valid = true;

    const newErrors = {
      name: "",
      phone: "",
    };

    if (!form.name.trim()) {
      newErrors.name = "Customer name is required";
      valid = false;
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";

      valid = false;
    } else {
      const phoneRegex = /^0\d{9}$/;

      if (!phoneRegex.test(form.phone)) {
        newErrors.phone =
          "Phone must start with 0 and contain exactly 10 digits";

        valid = false;
      }
    }

    setErrors(newErrors);

    return valid;
  };

  const saveCustomer = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await API.post("/customers", form);

      alert("Customer saved successfully");

      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      setErrors({
        name: "",
        phone: "",
      });

      loadCustomers();
    } catch (error) {
      alert("Error saving customer");

      console.log(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Customers</h1>

        <form
          onSubmit={saveCustomer}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <input
              className={`border p-3 rounded w-full ${
                errors.name ? "border-red-500" : ""
              }`}
              name="name"
              placeholder="Customer Name *"
              value={form.name}
              onChange={handleChange}
            />

            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <input
              className={`border p-3 rounded w-full ${
                errors.phone ? "border-red-500" : ""
              }`}
              name="phone"
              placeholder="Phone Number *"
              value={form.phone}
              onChange={handleChange}
            />

            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <input
            className="border p-3 rounded"
            name="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className="border p-3 rounded"
            name="address"
            placeholder="Address (optional)"
            value={form.address}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white p-3 rounded col-span-2"
          >
            Save Customer
          </button>
        </form>

        <table className="w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} className="border-t">
                <td className="p-3">{customer.name}</td>
                <td className="p-3">{customer.phone}</td>
                <td className="p-3">{customer.email}</td>
                <td className="p-3">{customer.address}</td>

                <td className="p-3">
                  <button
                    onClick={() => deleteCustomer(customer._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Customers;
