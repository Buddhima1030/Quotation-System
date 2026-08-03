import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CreateQuotations from "./pages/CreateQuotations";
import Quotations from "./pages/Quotations";
import ViewQuotations from "./pages/ViewQuotations";
import OutstandingCustomers from "./pages/OutstandingCustomers";
import CreateOutstanding from "./pages/CreateOutstanding";
import ViewOutstanding from "./pages/ViewOutstanding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/create-quotation" element={<CreateQuotations />} />
        <Route path="/edit-quotation/:id" element={<CreateQuotations />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotation/:id" element={<ViewQuotations />} />
        <Route path="/outstanding-customers" element={<OutstandingCustomers />}/>
        <Route path="/outstanding/add/:id" element={<CreateOutstanding />}/>
        <Route path="/view-outstanding/:id" element={<ViewOutstanding />}/>
        <Route path="/edit-outstanding/:id" element={<CreateOutstanding />}/>
        <Route path="/outstanding/:id" element={<ViewOutstanding />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;