import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-10">
        KH Technologies
      </h1>

      <nav className="space-y-3">
  <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/"
  >
    Dashboard
  </Link>

  <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/customers"
  >
    Customers
  </Link>

  <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/create-quotation"
  >
    Create Quotation
  </Link>

  <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/quotations"
  >
    Past Quotations
  </Link>

  {/* <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/create-outstanding"
  >
    Create Outstanding
  </Link> */}

  <Link
    className="block p-3 rounded hover:bg-slate-700"
    to="/outstanding-customers"
  >
    Outstanding Customers
  </Link>
</nav>
    </div>
  );
}

export default Sidebar;