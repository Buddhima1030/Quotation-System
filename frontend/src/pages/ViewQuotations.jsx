import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import Sidebar from "../components/Sidebar";

const BRANDS = [
  "/brands/intel.png",
  "/brands/hp.png",
  "/brands/dell.png",
  "/brands/acer.png",
  "/brands/asus.png",
  "/brands/verbatim.jpg",
  "/brands/prolink.png",
  "/brands/msi.jpg",
  "/brands/canon.png",
];

const KH_LOGO = "/brands/logo.jpg";

function ViewQuotations() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    loadQuotation();
  }, []);

  const loadQuotation = async () => {
    try {
      const res = await API.get(`/quotations/${id}`);
      if (res.data) {
        setQuotation(res.data);
      } else {
        const allRes = await API.get("/quotations");
        const selected = allRes.data.find((q) => q._id === id);
        setQuotation(selected);
      }
    } catch (error) {
      try {
        const allRes = await API.get("/quotations");
        const selected = allRes.data.find((q) => q._id === id);
        setQuotation(selected);
      } catch (err) {
        console.error("Failed to load quotation:", err);
      }
    }
  };

  if (!quotation) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="font-medium text-slate-500">Loading quotation...</div>
        </main>
      </div>
    );
  }

  const formattedDate = new Date(quotation.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fillerRows = Math.max(0, 5 - quotation.items.length);

  const formatQuotationNo = (no) => {
    if (!no) return "";
    if (/^QT-26-/i.test(no)) return no;
    if (/^QT-/i.test(no)) return no.replace(/^QT-/i, "QT-26-");
    return `QT-26-${no}`;
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getItemAmount = (item) => {
    if (
      item.amount !== undefined &&
      item.amount !== null &&
      item.amount !== "" &&
      Number(item.amount) !== 0
    ) {
      return Number(item.amount);
    }
    if (
      item.price !== undefined &&
      item.price !== null &&
      item.price !== "" &&
      Number(item.price) !== 0
    ) {
      return Number(item.quantity || 1) * Number(item.price);
    }
    if (quotation?.totalAmount && quotation.items?.length > 0) {
      const itemsWithKnownAmount = quotation.items.filter(
        (i) =>
          (i.amount && Number(i.amount) > 0) ||
          (i.price && Number(i.price) > 0),
      );
      if (itemsWithKnownAmount.length === 0) {
        return Number(quotation.totalAmount) / quotation.items.length;
      }
    }
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-5 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800"
          >
            Print / Save PDF
          </button>

          <button
            onClick={() => window.history.back()}
            className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>

        <div
          id="print-area"
          className="relative mx-auto overflow-hidden rounded-lg bg-white font-sans shadow-2xl"
          style={{ width: "210mm", minHeight: "297mm", paddingTop: "22mm" }}
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <img src={KH_LOGO} alt="" className="w-80 object-contain" />
          </div>

          <div className="relative z-10">
            <div className="quotation-header bg-slate-900 px-7 py-4 text-white">
              <div className="relative flex items-center justify-center">
                {/* Logo */}
                <div className="absolute left-0 flex items-center">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
                    <img
                      src={KH_LOGO}
                      alt="KH Technologies"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                {/* Center Heading */}
                <div className="text-center">
                  <h1 className="text-4xl font-extrabold tracking-wider text-white">
                    KH TECHNOLOGIES
                  </h1>

                  <p className="mt-1 text-s font-medium tracking-wide text-slate-300">
                    Total Computer Solutions
                  </p>
                </div>

                {/* Right Side */}
                <div className="absolute right-0 text-right">
                  <p className="text-lg font-bold tracking-[0.25em] text-white">
                    QUOTATION
                  </p>

                  <p className="mt-1 text-[11px] text-slate-300">
                    Professional IT Sales & Services
                  </p>
                </div>
              </div>
            </div>

            <div className="service-strip border-b border-slate-200 bg-slate-100 px-7 py-2">
              <p className="text-[14px] font-semibold text-slate-700">
                Suppliers of Brand New Computers | Laptops & Accessories |
                Printers | UPS | LED Monitors
              </p>

              <p className="mt-0.5 text-[14px] text-slate-600 font-bold">
                Desktop Computers | Laptops & Macbooks| LED Monitors | Computer
                Accessories & Maintenance
              </p>



              <p className="mt-0.5 text-[14px] text-slate-600 font-bold">
                Laptop Desktop Repairs | Monitor Repairs | Printer Repairs | Smart TV Repairs | CCTV Camera Systems
              </p>
            </div>

            <div className="px-7 pt-4 pb-4">
              <div className="mb-4 grid grid-cols-2 gap-6 text-[12px] leading-relaxed text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">
                    KH Technologies
                  </p>
                  <p>Registered No - WH6104 (as a Company Since 2006)</p>
                  <p># 27, Holy Emmanuel Church Road, Idama, Moratuwa</p>
                  <p>Direct: 011-2644185 | 071 4497548 | 0712190976</p>
                  <p>E-mail: khtechnologies123@gmail.com</p>
                </div>

                <div className="flex justify-end">
                  <div className="min-w-[220px] rounded-lg border border-slate-300 bg-white p-3">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-700">Date</span>

                      <span className="text-right text-slate-900">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between gap-4">
                      <span className="font-semibold text-slate-700">
                        Quotation No
                      </span>

                      <span className="text-right font-semibold text-slate-900">
                        {formatQuotationNo(quotation.quotationNo)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs">
                <p className="mb-1.5 font-bold uppercase tracking-wide text-slate-700">
                  Customer Details
                </p>

                <p className="text-slate-800">
                  <strong>Dear Sir/Madam</strong> {quotation.customer?.name || "N/A"}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-x-6 text-slate-800">
                  <p>
                    <strong>Phone:</strong> {quotation.customer?.phone || "N/A"}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {quotation.customer?.address || "N/A"}
                  </p>
                </div>

                {quotation.subject && quotation.subject.trim() && (
                  <p className="mt-1 text-slate-800">
                    <strong>Subject:</strong> {quotation.subject}
                  </p>
                )}
              </div>

              <table className="quotation-table w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="table-head bg-slate-800 text-white">
                    <th className="w-[48%] border border-slate-700 px-2 py-1.5 text-left font-bold text-white">
                      DESCRIPTION
                    </th>

                    <th className="w-[18%] border border-slate-700 px-2 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      WARRANTY
                    </th>

                    <th className="w-[14%] border border-slate-700 px-2 py-1.5 text-right font-bold text-white whitespace-nowrap">
                      UNIT PRICE
                    </th>

                    <th className="w-[6%] border border-slate-700 px-2 py-1.5 text-center font-bold text-white whitespace-nowrap">
                      QTY
                    </th>

                    <th className="w-[14%] border border-slate-700 px-2 py-1.5 text-right font-bold text-white whitespace-nowrap">
                      AMOUNT - LKR
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-300 px-2 py-1.5 font-medium text-slate-800">
                        {item.itemName}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-700 whitespace-nowrap">
                        {item.warranty}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-right text-slate-700 whitespace-nowrap">
                        {item.price !== null &&
                        item.price !== undefined &&
                        item.price !== "" &&
                        Number(item.price) > 0
                          ? formatCurrency(item.price)
                          : ""}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-700 whitespace-nowrap">
                        {String(item.quantity || 0).padStart(2, "0")}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {getItemAmount(item) > 0
                          ? formatCurrency(getItemAmount(item))
                          : ""}
                      </td>
                    </tr>
                  ))}

                  {Array.from({ length: fillerRows }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                      <td className="border border-slate-300 px-2 py-1.5">
                        &nbsp;
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5"></td>
                      <td className="border border-slate-300 px-2 py-1.5"></td>
                      <td className="border border-slate-300 px-2 py-1.5"></td>
                      <td className="border border-slate-300 px-2 py-1.5"></td>
                    </tr>
                  ))}

                  <tr className="grand-total-row bg-slate-900 text-white">
                    <td
                      colSpan={4}
                      className="border border-slate-900 px-3 py-2 text-sm font-bold tracking-wide text-white"
                    >
                      GRAND TOTAL
                    </td>

                    <td className="border border-slate-900 px-3 py-2 text-right text-sm font-bold text-white">
                      LKR {formatCurrency(quotation.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {quotation.notes && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Note:</span>{" "}
                  {quotation.notes}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                <p>
                  <strong>Quotation Validity:</strong> 14 Days
                </p>

                <p className="mt-1">
                  <strong>Delivery:</strong> Subject to stock availability
                </p>

                <p className="mt-1">
                  <strong>Payment:</strong> Cash / Bank Transfer
                </p>

                <p className="mt-1 text-red-700 font-bold">
                NO WARRANTY CLAIMS WILL BE ACCEPTED FOR BURN MARKS, PHYSICAL DAMAGES AND CORROSION.
                </p>
              </div>

              <div className="mt-10 flex justify-between text-xs text-slate-700">
                <div>
                  <div className="w-52 border-t border-slate-900"></div>
                  <p className="mt-1.5 font-medium">Customer Signature</p>
                </div>

                <div>
                  <div className="w-52 border-t border-slate-900"></div>
                  <p className="mt-1.5 font-medium">Authorized Signature</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-7 pb-4 pt-3 text-center">
              <p className="mb-3 text-xs font-bold tracking-wide text-slate-800">
                THANK YOU FOR YOUR BUSINESS!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 px-4">
                {BRANDS.map((logo, index) => (
                  <img
                    key={index}
                    src={logo}
                    alt="brand logo"
                    className="h-9 max-w-[180px] object-contain"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          #print-area,
          #print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }

          @media print {
            @page {
              size: A4;
              margin: 15mm 10mm 10mm 10mm;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: hidden !important;
            }

            body * {
              visibility: hidden;
            }

            #print-area,
            #print-area * {
              visibility: visible;
            }

            #print-area {
              position: absolute !important;
              top: 15mm !important;
              left: 0 !important;
              width: 210mm !important;
              height: 282mm !important;
              min-height: 282mm !important;
              max-height: 282mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }

            .quotation-header {
              background: #0f172a !important;
              color: #ffffff !important;
              padding-top: 14px !important;
              padding-bottom: 14px !important;
            }

            .quotation-header h1,
            .quotation-header p {
              color: inherit !important;
            }

            .service-strip {
              background: #f1f5f9 !important;
            }

            .table-head {
              background: #1e293b !important;
              color: #ffffff !important;
            }

            .table-head th {
              background: #1e293b !important;
              color: #ffffff !important;
              border-color: #334155 !important;
            }

            .grand-total-row {
              background: #0f172a !important;
              color: #ffffff !important;
            }

            .grand-total-row td {
              background: #0f172a !important;
              color: #ffffff !important;
              border-color: #0f172a !important;
            }

            table {
              page-break-inside: avoid !important;
            }

            tr {
              page-break-inside: avoid !important;
            }

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

export default ViewQuotations;
