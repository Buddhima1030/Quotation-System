import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CreateQuotations from "./pages/CreateQuotations";
import Quotations from "./pages/Quotations";
import ViewQuotations from "./pages/ViewQuotations";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;