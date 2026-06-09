import Sidebar from "../components/Sidebar";

function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl shadow">
            Total Customers
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            Total Quotations
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            Quotation Management
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;