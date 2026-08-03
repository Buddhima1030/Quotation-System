import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

function OutstandingCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await API.get("/customers");

      const sorted = res.data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setCustomers(sorted);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-3xl font-bold">
              Outstanding Payments
            </h1>

            <p className="text-slate-600 mt-1">
              Search a customer and manage outstanding balances.
            </p>
          </div>

          <Link
            to="/customers"
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
          >
            + Add Customer
          </Link>

        </div>

        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg p-3 mb-6"
        />

        <table className="w-full bg-white rounded-xl shadow overflow-hidden">

          <thead className="bg-slate-200">

            <tr>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Action</th>
            </tr>

          </thead>

          <tbody>

            {filteredCustomers.map((customer) => (

              <tr
                key={customer._id}
                className="border-t hover:bg-slate-50"
              >

                <td className="p-3 font-medium">
                  {customer.name}
                </td>

                <td className="p-3">
                  {customer.phone}
                </td>

                <td className="p-3">
                  {customer.email || "-"}
                </td>

                <td className="p-3 flex gap-2">

                  <Link
                    to={`/outstanding/add/${customer._id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Create Outstanding
                  </Link>

                  <Link
                    to={`/outstanding/${customer._id}`}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded"
                  >
                    View
                  </Link>

                </td>

              </tr>

            ))}

            {filteredCustomers.length === 0 && (

              <tr>

                <td
                  colSpan="4"
                  className="text-center py-8 text-slate-500"
                >
                  No customers found.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </main>
    </div>
  );
}

export default OutstandingCustomers;