import { useState, useRef } from "react";
import {
  Printer,
  Receipt,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatInr, type Invoice } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { toast } from "sonner";

interface InvoiceViewProps {
  invoice: Invoice | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "hi";
}

/**
 * Builds a 100% self-contained, print-perfect HTML document.
 * This guarantees ZERO blank pages, no modal clipping, and flawless PDF saves across all browsers.
 */
function buildPrintableHtml(invoice: Invoice, lang: "en" | "hi", mode: "a4" | "pos"): string {
  const isTax = invoice.tax_enabled && Boolean(invoice.store_gstin);
  const title = isTax
    ? lang === "hi"
      ? "जीएसटी कर इनवॉइस (TAX INVOICE)"
      : "GST TAX INVOICE"
    : lang === "hi"
      ? "खुदरा बिक्री बिल / कैश मेमो"
      : "RETAIL INVOICE / CASH MEMO";

  const isPaid = invoice.payment_status === "paid";
  const statusLabel = isPaid
    ? lang === "hi"
      ? "भुगतान संपन्न (PAID)"
      : "PAID"
    : lang === "hi"
      ? "भुगतान बकाया (PENDING)"
      : "PENDING";

  const addressText = [
    invoice.delivery_address?.house,
    invoice.delivery_address?.area,
    invoice.delivery_address?.landmark,
    invoice.delivery_address?.city || "Maharajganj",
    invoice.delivery_address?.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Maharajganj, Uttar Pradesh";

  if (mode === "pos") {
    // 80mm Thermal Receipt HTML
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Receipt_${invoice.invoice_no}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: 78mm;
      margin: 0 auto;
      padding: 6mm 4mm;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.3;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin: 5px 0; }
    th { text-align: left; border-bottom: 1px solid #000; font-size: 10px; padding: 2px 0; }
    td { padding: 3px 0; font-size: 11px; }
    .total-row { font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
    @media print {
      body { width: 100%; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="text-center border-b">
    <div class="bold" style="font-size: 14px;">${invoice.store_name}</div>
    <div>${invoice.store_address}</div>
    <div class="bold">Ph: ${invoice.store_phone}</div>
    ${invoice.store_gstin ? `<div>GSTIN: ${invoice.store_gstin}</div>` : ""}
    <div style="margin-top: 4px; font-size: 10px;" class="bold">*** ${title} ***</div>
  </div>

  <div class="border-b">
    <div class="row"><span>INV NO:</span><span class="bold">${invoice.invoice_no}</span></div>
    <div class="row"><span>ORDER NO:</span><span class="bold">#${invoice.order_no}</span></div>
    <div class="row"><span>DATE:</span><span>${formatDate(invoice.created_at)}</span></div>
    <div class="row"><span>CUSTOMER:</span><span class="bold">${invoice.customer_name}</span></div>
    <div class="row"><span>PHONE:</span><span>+91 ${invoice.customer_phone}</span></div>
  </div>

  <div class="border-b">
    <table>
      <thead>
        <tr>
          <th>ITEM</th>
          <th class="text-right">QTY x RATE</th>
          <th class="text-right">AMT</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items_snapshot
          .map(
            (i) => {
              const nameText = lang === "hi" ? (i.name_hi || i.name) : (i.name_en || i.name);
              return `
          <tr>
            <td>${nameText}</td>
            <td class="text-right">${i.qty} x ${i.price}</td>
            <td class="text-right bold">${i.line_total || i.price * i.qty}</td>
          </tr>`;
            }
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="border-b">
    <div class="row"><span>Subtotal:</span><span>₹${invoice.subtotal}</span></div>
    ${invoice.item_discount > 0 ? `<div class="row"><span>Item Discount:</span><span>-₹${invoice.item_discount}</span></div>` : ""}
    ${invoice.coupon_discount > 0 ? `<div class="row"><span>Coupon Discount:</span><span>-₹${invoice.coupon_discount}</span></div>` : ""}
    ${invoice.total_tax > 0 ? `<div class="row"><span>Tax (GST):</span><span>+₹${invoice.total_tax}</span></div>` : ""}
    <div class="row"><span>Delivery Fee:</span><span>${invoice.delivery_fee === 0 ? "FREE" : "₹" + invoice.delivery_fee}</span></div>
    <div class="row total-row"><span>GRAND TOTAL:</span><span>₹${invoice.grand_total}</span></div>
  </div>

  <div class="border-b">
    <div class="row"><span>PAYMENT MODE:</span><span class="bold">${invoice.payment_method.toUpperCase()}</span></div>
    <div class="row"><span>STATUS:</span><span class="bold">${statusLabel}</span></div>
    <div class="row"><span>AMOUNT PAID:</span><span>₹${invoice.amount_paid}</span></div>
    ${invoice.amount_due > 0 ? `<div class="row bold"><span>AMOUNT DUE:</span><span>₹${invoice.amount_due}</span></div>` : ""}
  </div>

  <div class="text-center" style="margin-top: 8px;">
    <div class="bold">*** THANK YOU FOR SHOPPING ***</div>
    <div style="font-size: 9px;">Visit Again • Arun Gopal Traders</div>
  </div>
</body>
</html>`;
  }

  // Standard A4 Official Tax/Retail Invoice HTML
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Invoice_${invoice.invoice_no}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #16201A;
      background: #FFFFFF;
      font-size: 12px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #145A45;
      padding-bottom: 12px;
    }
    .store-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      background: #145A45;
      color: #FFF;
      font-weight: 900;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .store-title {
      font-size: 20px;
      font-weight: 900;
      color: #145A45;
      margin: 0;
    }
    .store-sub {
      font-size: 11px;
      color: #5A655F;
      margin: 2px 0 0 0;
      font-weight: 600;
    }
    .inv-badge {
      background: #145A45;
      color: #FFF;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      display: inline-block;
    }
    .inv-meta {
      text-align: right;
    }
    .grid-2 {
      display: flex;
      gap: 16px;
      margin: 12px 0;
    }
    .card {
      flex: 1;
      background: #FAF8F2;
      border: 1px solid #E8E4DA;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      color: #145A45;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .strip {
      background: #E6EFE8;
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th {
      background: #FAF8F2;
      border-bottom: 2px solid #145A45;
      padding: 8px 6px;
      text-align: left;
      font-size: 11px;
      font-weight: 800;
      color: #145A45;
    }
    td {
      padding: 8px 6px;
      border-bottom: 1px solid #E5E0D5;
      font-size: 11px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-grid {
      display: flex;
      gap: 20px;
      border-top: 2px solid #145A45;
      padding-top: 12px;
      margin-top: 8px;
    }
    .summary-left {
      flex: 1;
    }
    .summary-right {
      flex: 1;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
      color: #5A655F;
    }
    .sum-row span:last-child {
      color: #16201A;
      font-weight: 600;
    }
    .grand-total-banner {
      background: #145A45;
      color: #FFF;
      padding: 8px 12px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 800;
      margin-top: 8px;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #E5E0D5;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9px;
      color: #5A655F;
    }
    .sign-box {
      text-align: center;
      border-top: 1px solid #16201A;
      padding-top: 4px;
      min-width: 140px;
      color: #16201A;
      font-weight: 700;
    }
    @media print {
      body { padding: 0; }
      tr, .card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-brand">
      <div class="logo-badge">AGT</div>
      <div>
        <h1 class="store-title">${invoice.store_name}</h1>
        <p class="store-sub">${invoice.store_legal_name || "Arun Gopal Traders"} • महाराजगंज</p>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-badge">${title}</div>
      <div style="font-weight: 800; color: #145A45; margin-top: 4px; font-family: monospace; font-size: 13px;">#${invoice.invoice_no}</div>
      <div style="color: #5A655F; font-size: 10px;">${lang === "hi" ? "दिनांक:" : "Date:"} ${formatDate(invoice.created_at)}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">${lang === "hi" ? "दुकान विवरण (Billed By)" : "Store Details"}</div>
      <div style="font-weight: 700; font-size: 12px;">${invoice.store_name}</div>
      <div style="color: #5A655F;">${invoice.store_address}</div>
      <div style="color: #5A655F;">Ph: <strong>${invoice.store_phone}</strong></div>
      ${invoice.store_gstin ? `<div style="color: #145A45; font-weight: 700;">GSTIN: ${invoice.store_gstin} (${invoice.store_state})</div>` : ""}
    </div>

    <div class="card">
      <div class="card-title">${lang === "hi" ? "ग्राहक विवरण (Billed To)" : "Customer Details"}</div>
      <div style="font-weight: 700; font-size: 12px;">${invoice.customer_name}</div>
      <div style="color: #5A655F;">Phone: <strong>+91 ${invoice.customer_phone}</strong></div>
      <div style="color: #5A655F;">${addressText}</div>
    </div>
  </div>

  <div class="strip">
    <div><strong>${lang === "hi" ? "ऑर्डर नं:" : "Order No:"}</strong> <span style="font-family: monospace; font-weight: bold; color: #145A45;">#${invoice.order_no}</span></div>
    <div><strong>${lang === "hi" ? "भुगतान विधि:" : "Payment Mode:"}</strong> <span style="text-transform: uppercase; font-weight: bold;">${invoice.payment_method}</span></div>
    <div><strong>${lang === "hi" ? "स्थिति:" : "Status:"}</strong> <span style="font-weight: bold; color: ${isPaid ? "#15803D" : "#D97706"};">${statusLabel}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center" style="width: 30px;">#</th>
        <th>${lang === "hi" ? "सामग्री विवरण" : "Item Description"}</th>
        <th class="text-right">${lang === "hi" ? "पैकिंग" : "Variant"}</th>
        <th class="text-right">${lang === "hi" ? "मात्रा" : "Qty"}</th>
        <th class="text-right">MRP</th>
        <th class="text-right">${lang === "hi" ? "दर (Rate)" : "Rate"}</th>
        <th class="text-right font-black">${lang === "hi" ? "कुल राशि" : "Amount"}</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items_snapshot
        .map(
          (item, idx) => `
        <tr>
          <td class="text-center" style="color: #5A655F;">${idx + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td class="text-right" style="color: #5A655F;">${item.variant_label || "Standard"}</td>
          <td class="text-right"><strong>${item.qty}</strong></td>
          <td class="text-right" style="color: #5A655F; text-decoration: line-through;">₹${item.mrp || item.price}</td>
          <td class="text-right">₹${item.price}</td>
          <td class="text-right" style="font-weight: 800; color: #145A45;">₹${item.line_total || item.price * item.qty}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="summary-grid">
    <div class="summary-left">
      <div class="card" style="font-size: 10px;">
        <div class="card-title">${lang === "hi" ? "डिजिटल भुगतान व सहायता" : "Digital Payment & Support"}</div>
        <div>UPI ID: <strong>6388354988@upi</strong></div>
        <div>WhatsApp / Phone: <strong>+91 6388354988</strong></div>
      </div>
      ${invoice.notes ? `<div style="margin-top: 6px; font-size: 10px; color: #5A655F;"><em>Note: ${invoice.notes}</em></div>` : ""}
    </div>

    <div class="summary-right">
      <div class="sum-row"><span>${lang === "hi" ? "उप-कुल (Subtotal):" : "Subtotal:"}</span><span>₹${invoice.subtotal}</span></div>
      ${invoice.item_discount > 0 ? `<div class="sum-row" style="color: #15803D;"><span>${lang === "hi" ? "छूट (MRP Savings):" : "Discount:"}</span><span>-₹${invoice.item_discount}</span></div>` : ""}
      ${invoice.coupon_discount > 0 ? `<div class="sum-row" style="color: #15803D;"><span>${lang === "hi" ? "कूपन छूट:" : "Coupon:"} (${invoice.coupon_code})</span><span>-₹${invoice.coupon_discount}</span></div>` : ""}
      ${invoice.total_tax > 0 ? `<div class="sum-row"><span>Tax (GST):</span><span>+₹${invoice.total_tax}</span></div>` : ""}
      <div class="sum-row"><span>${lang === "hi" ? "डिलीवरी शुल्क:" : "Delivery Charges:"}</span><span>${invoice.delivery_fee === 0 ? "FREE" : "₹" + invoice.delivery_fee}</span></div>
      ${invoice.round_off !== 0 ? `<div class="sum-row"><span>Round Off:</span><span>₹${invoice.round_off}</span></div>` : ""}

      <div class="grand-total-banner">
        <span>${lang === "hi" ? "कुल देय राशि:" : "Grand Total:"}</span>
        <span>₹${invoice.grand_total}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-weight: bold;">
        <span>${lang === "hi" ? "प्राप्त राशि:" : "Paid:"} ₹${invoice.amount_paid}</span>
        <span style="color: ${invoice.amount_due > 0 ? "#D97706" : "#5A655F"};">${lang === "hi" ? "बकाया राशि:" : "Due:"} ₹${invoice.amount_due}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div style="max-width: 380px;">
      <div style="font-weight: bold; color: #16201A; text-transform: uppercase;">${lang === "hi" ? "नियम एवं शर्तें" : "Terms & Conditions"}:</div>
      <div>${invoice.terms || "1. Goods once sold can only be returned within 24 hours in original condition.\n2. Retain this invoice for verification."}</div>
      <div style="color: #145A45; font-style: italic; margin-top: 2px;">${invoice.footer_note || "Thank you for choosing Arun Gopal Traders!"}</div>
    </div>
    <div style="text-align: right;">
      <div style="height: 25px;"></div>
      <div class="sign-box">
        <div>For Arun Gopal Traders</div>
        <div style="font-size: 8px; font-weight: normal; color: #5A655F;">(Authorized Signatory)</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Direct print via dedicated hidden iframe.
 * Never clips, never shows modal background, works on every desktop & mobile browser!
 */
function printDocument(htmlContent: string) {
  try {
    let iframe = document.getElementById("agt-invoice-print-frame") as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "agt-invoice-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 250);
  } catch (e) {
    console.error("Iframe print error:", e);
    window.print();
  }
}

/**
 * 1-Click File Downloader: Downloads the complete, standalone offline Bill file.
 */
function downloadInvoiceFile(htmlContent: string, invoiceNo: string) {
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bill_${invoiceNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("बिल डाउनलोड हो गया! (Bill downloaded successfully)");
  } catch {
    toast.error("Download failed");
  }
}

export function InvoiceView({
  invoice,
  isOpen,
  onClose,
  lang: propLang,
}: InvoiceViewProps) {
  const { lang: siteLang, language = siteLang } = useLanguage();
  const currentLang: "en" | "hi" = propLang || (language as "en" | "hi") || "hi";

  const [layoutMode, setLayoutMode] = useState<"a4" | "pos">("a4");

  if (!invoice) return null;

  const isTaxInvoice = invoice.tax_enabled && Boolean(invoice.store_gstin);
  const invoiceTypeTitle = isTaxInvoice
    ? currentLang === "hi"
      ? "जीएसटी कर इनवॉइस (TAX INVOICE)"
      : "GST TAX INVOICE"
    : currentLang === "hi"
      ? "खुदरा बिक्री बिल / कैश मेमो"
      : "RETAIL INVOICE / CASH MEMO";

  const isPaid = invoice.payment_status === "paid";
  const isRefunded = invoice.refund_status === "full" || invoice.refund_status === "partial";

  const handlePrint = () => {
    const html = buildPrintableHtml(invoice, currentLang, layoutMode);
    printDocument(html);
  };

  const handleDownload = () => {
    const html = buildPrintableHtml(invoice, currentLang, layoutMode);
    downloadInvoiceFile(html, invoice.invoice_no);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[98vw] max-w-4xl max-h-[95vh] overflow-y-auto p-2 sm:p-6 bg-[#FAF8F2] border-[#E8E4DA] rounded-2xl sm:rounded-3xl shadow-2xl">
        {/* Modal Action Header (Hidden on Print) */}
        <DialogHeader className="no-print pb-2.5 border-b border-[#E8E4DA] flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <DialogTitle className="font-sans text-base sm:text-lg font-black text-[#16201A] flex flex-wrap items-center gap-2">
              <Receipt className="size-5 text-[#145A45]" />
              <span>{currentLang === "hi" ? "ऑर्डर इनवॉइस व रसीद" : "Order Invoice & Receipt"}</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-[#145A45] bg-[#E6EFE8] px-2 py-0.5 rounded-md">
                {invoice.invoice_no}
              </span>
            </DialogTitle>
            <p className="text-[11px] text-[#5A655F] mt-0.5">
              {currentLang === "hi"
                ? "डिजिटल रूप से सत्यापित बिल • अरुण गोपाल ट्रेडर्स महाराजगंज"
                : "Digitally verified bill • Arun Gopal Traders Maharajganj"}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
            {/* Format Toggle Pill */}
            <div className="flex items-center bg-white border border-[#E8E4DA] rounded-xl p-0.5 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setLayoutMode("a4")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                  layoutMode === "a4"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <FileText className="size-3.5" /> A4 Bill
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("pos")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                  layoutMode === "pos"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <Receipt className="size-3.5" /> POS Slip
              </button>
            </div>

            {/* Direct Download Button */}
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              title="Download Offline Bill File / बिल डाउनलोड करें"
              className="rounded-xl gap-1.5 text-xs font-bold border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2] h-8.5 px-2.5"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{currentLang === "hi" ? "डाउनलोड" : "Download"}</span>
            </Button>

            {/* Print Trigger Button */}
            <Button
              onClick={handlePrint}
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs h-8.5 px-3"
            >
              <Printer className="size-3.5" />
              <span>{currentLang === "hi" ? "प्रिंट / PDF" : "Print / PDF"}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* ================================================================ */}
        {/* INVOICE DISPLAY CARD */}
        {/* ================================================================ */}
        <div className="printable-invoice-container mt-1">
          {layoutMode === "a4" ? (
            /* ========================================================== */
            /* 1. STANDARD A4 OFFICIAL TAX/RETAIL INVOICE */
            /* ========================================================== */
            <div className="printable-invoice-card rounded-2xl border border-[#E5E0D5] bg-white p-3.5 sm:p-8 text-[#16201A] shadow-xs font-sans">
              {/* Top Bar / Store Branding */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#145A45] pb-3.5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="grid size-11 sm:size-13 place-items-center rounded-xl bg-[#145A45] text-white font-black text-lg sm:text-xl shadow-xs shrink-0">
                    AGT
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-black text-[#145A45] tracking-tight leading-tight">
                      {invoice.store_name}
                    </h1>
                    <p className="text-[11px] sm:text-xs font-semibold text-[#5A655F]">
                      {invoice.store_legal_name || "Arun Gopal Traders"} • महाराजगंज
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block rounded-md bg-[#145A45] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white">
                    {invoiceTypeTitle}
                  </span>
                  <p className="text-xs font-mono font-bold text-[#145A45] mt-1">
                    #{invoice.invoice_no}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F]">
                    {currentLang === "hi" ? "दिनांक:" : "Date:"} {formatDate(invoice.created_at)}
                  </p>
                </div>
              </div>

              {/* 2-Column Info Grid: Store Details & Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-3 border-b border-[#E5E0D5] text-xs">
                {/* Store Meta */}
                <div className="space-y-1 bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E4DA]">
                  <p className="font-bold text-[#145A45] uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Building2 className="size-3 text-[#145A45]" />
                    {currentLang === "hi" ? "दुकान विवरण (Billed By)" : "Store Information"}
                  </p>
                  <p className="font-bold text-[#16201A] text-xs sm:text-sm">{invoice.store_name}</p>
                  <p className="text-[#5A655F] flex items-start gap-1 text-[11px]">
                    <MapPin className="size-3 text-[#145A45] shrink-0 mt-0.5" />
                    <span>{invoice.store_address}</span>
                  </p>
                  <p className="text-[#5A655F] flex items-center gap-1 text-[11px]">
                    <Phone className="size-3 text-[#145A45] shrink-0" />
                    <a href={`tel:${invoice.store_phone}`} className="hover:underline font-semibold text-[#145A45]">
                      {invoice.store_phone}
                    </a>
                  </p>
                  {invoice.store_gstin && (
                    <p className="font-semibold text-[#145A45] text-[11px]">
                      GSTIN: <span className="font-mono">{invoice.store_gstin}</span> ({invoice.store_state})
                    </p>
                  )}
                </div>

                {/* Customer Meta */}
                <div className="space-y-1 bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E4DA]">
                  <p className="font-bold text-[#145A45] uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <ShieldCheck className="size-3 text-[#145A45]" />
                    {currentLang === "hi" ? "ग्राहक विवरण (Billed To)" : "Customer Information"}
                  </p>
                  <p className="font-bold text-[#16201A] text-xs sm:text-sm">{invoice.customer_name}</p>
                  <p className="text-[#5A655F] flex items-center gap-1 text-[11px]">
                    <Phone className="size-3 text-[#145A45] shrink-0" />
                    <a href={`tel:${invoice.customer_phone}`} className="hover:underline font-semibold text-[#145A45]">
                      +91 {invoice.customer_phone}
                    </a>
                  </p>
                  <p className="text-[#5A655F] flex items-start gap-1 text-[11px]">
                    <MapPin className="size-3 text-[#145A45] shrink-0 mt-0.5" />
                    <span>
                      {[
                        invoice.delivery_address?.house,
                        invoice.delivery_address?.area,
                        invoice.delivery_address?.landmark,
                        invoice.delivery_address?.city || "Maharajganj",
                        invoice.delivery_address?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Maharajganj, UP"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Reference Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-[#E6EFE8]/70 rounded-xl my-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs">
                  <span>
                    <strong>{currentLang === "hi" ? "ऑर्डर नं:" : "Order No:"}</strong>{" "}
                    <span className="font-mono font-bold text-[#145A45]">#{invoice.order_no}</span>
                  </span>
                  <span>
                    <strong>{currentLang === "hi" ? "भुगतान विधि:" : "Payment Mode:"}</strong>{" "}
                    <span className="uppercase font-bold text-[#16201A]">{invoice.payment_method}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                      isPaid
                        ? "bg-[#15803D] text-white"
                        : invoice.payment_status === "failed"
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-white"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="size-3" />
                    ) : (
                      <AlertCircle className="size-3" />
                    )}
                    <span className="uppercase">
                      {isPaid
                        ? currentLang === "hi"
                          ? "भुगतान संपन्न (PAID)"
                          : "PAID"
                        : currentLang === "hi"
                          ? "भुगतान बकाया (PENDING)"
                          : "PENDING"}
                    </span>
                  </span>

                  {isRefunded && (
                    <span className="bg-purple-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      Refunded: {formatInr(invoice.refund_amount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Line Items - Mobile Card View (sm:hidden) */}
              <div className="sm:hidden space-y-2 my-3">
                <p className="text-[11px] font-bold text-[#145A45] uppercase tracking-wider">
                  {currentLang === "hi" ? "ऑर्डर की गई सामग्री (Items)" : "Ordered Items"} ({invoice.items_snapshot.length})
                </p>
                <div className="divide-y divide-[#E5E0D5] rounded-xl border border-[#E5E0D5] bg-[#FAF8F2]/40 overflow-hidden">
                  {invoice.items_snapshot.map((item, idx) => {
                    const lineTotal = item.line_total || item.price * item.qty;
                    const itemThumb = getProductImage({
                      name: item.name,
                      image_url: item.image_url ?? null,
                    });

                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={itemThumb}
                            alt={item.name}
                            className="size-10 rounded-lg object-contain bg-white p-0.5 border border-[#E8E4DA] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#16201A] truncate">
                              {currentLang === "hi" ? (item.name_hi || item.name) : (item.name_en || item.name)}
                            </p>
                            <p className="text-[11px] text-[#5A655F]">
                              {(currentLang === "hi" ? (item.variant_label_hi || item.variant_label) : (item.variant_label_en || item.variant_label)) ? `${currentLang === "hi" ? (item.variant_label_hi || item.variant_label) : (item.variant_label_en || item.variant_label)} • ` : ""}
                              <span className="font-semibold">{item.qty} × {formatInr(item.price)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-xs text-[#145A45]">{formatInr(lineTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Line Items - Desktop Table View (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto my-3.5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#145A45] bg-[#FAF8F2] text-[#145A45] font-bold">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">{currentLang === "hi" ? "सामग्री विवरण (Item Description)" : "Item Description"}</th>
                      <th className="py-2 px-3 text-right">{currentLang === "hi" ? "पैकिंग" : "Variant"}</th>
                      <th className="py-2 px-3 text-right">{currentLang === "hi" ? "मात्रा" : "Qty"}</th>
                      <th className="py-2 px-3 text-right">MRP</th>
                      <th className="py-2 px-3 text-right">{currentLang === "hi" ? "दर (Rate)" : "Rate"}</th>
                      <th className="py-2 px-3 text-right font-black">{currentLang === "hi" ? "कुल राशि (Amount)" : "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]">
                    {invoice.items_snapshot.map((item, idx) => {
                      const lineTotal = item.line_total || item.price * item.qty;
                      const itemTitle = currentLang === "hi" ? (item.name_hi || item.name) : (item.name_en || item.name);
                      const itemVariant = currentLang === "hi" ? (item.variant_label_hi || item.variant_label) : (item.variant_label_en || item.variant_label);

                      return (
                        <tr key={idx} className="invoice-item-row hover:bg-[#FAF8F2]/50">
                          <td className="py-2 px-3 text-center text-[#5A655F]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-[#16201A]">
                            {itemTitle}
                          </td>
                          <td className="py-2 px-3 text-right text-[#5A655F]">
                            {itemVariant || "Standard"}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-[#16201A]">
                            {item.qty}
                          </td>
                          <td className="py-2 px-3 text-right text-[#5A655F] line-through">
                            {formatInr(item.mrp || item.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-[#16201A]">
                            {formatInr(item.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-[#145A45]">
                            {formatInr(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary & Tax Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2 border-[#145A45]">
                {/* Left Note / Bank / UPI info */}
                <div className="space-y-2 text-xs text-[#5A655F]">
                  <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3">
                    <p className="font-bold text-[#145A45] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <QrCode className="size-3.5 text-[#145A45]" />
                      {currentLang === "hi" ? "डिजिटल भुगतान व सहायता" : "Digital Payment & Support"}
                    </p>
                    <p className="text-[11px] mt-1">
                      UPI ID: <span className="font-mono font-bold text-[#16201A]">6388354988@upi</span>
                    </p>
                    <p className="text-[11px]">
                      WhatsApp / Phone: <span className="font-bold text-[#16201A]">+91 6388354988</span>
                    </p>
                  </div>

                  {invoice.notes && (
                    <div className="p-2 bg-[#FAF8F2] rounded-lg text-[11px]">
                      <strong>{currentLang === "hi" ? "ग्राहक नोट:" : "Customer Note:"}</strong> {invoice.notes}
                    </div>
                  )}
                </div>

                {/* Right Calculations Totals Table */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#5A655F]">
                    <span>{currentLang === "hi" ? "आइटम उप-कुल (Subtotal):" : "Items Subtotal:"}</span>
                    <span className="font-medium text-[#16201A]">{formatInr(invoice.subtotal)}</span>
                  </div>

                  {invoice.item_discount > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>{currentLang === "hi" ? "उत्पाद छूट (MRP Savings):" : "Product Discount:"}</span>
                      <span className="font-semibold">-{formatInr(invoice.item_discount)}</span>
                    </div>
                  )}

                  {invoice.coupon_discount > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>
                        {currentLang === "hi" ? "कूपन छूट:" : "Coupon Discount:"} ({invoice.coupon_code})
                      </span>
                      <span className="font-semibold">-{formatInr(invoice.coupon_discount)}</span>
                    </div>
                  )}

                  {invoice.tax_enabled && invoice.total_tax > 0 && (
                    <>
                      {invoice.cgst_amount > 0 && (
                        <div className="flex justify-between text-[#5A655F]">
                          <span>CGST ({(invoice.tax_rate / 2).toFixed(1)}%):</span>
                          <span>+{formatInr(invoice.cgst_amount)}</span>
                        </div>
                      )}
                      {invoice.sgst_amount > 0 && (
                        <div className="flex justify-between text-[#5A655F]">
                          <span>SGST ({(invoice.tax_rate / 2).toFixed(1)}%):</span>
                          <span>+{formatInr(invoice.sgst_amount)}</span>
                        </div>
                      )}
                      {invoice.igst_amount > 0 && (
                        <div className="flex justify-between text-[#5A655F]">
                          <span>IGST ({invoice.tax_rate}%):</span>
                          <span>+{formatInr(invoice.igst_amount)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between text-[#5A655F]">
                    <span>{currentLang === "hi" ? "डिलीवरी शुल्क:" : "Delivery Charges:"}</span>
                    <span className="font-medium text-[#16201A]">
                      {invoice.delivery_fee === 0 ? "FREE" : formatInr(invoice.delivery_fee)}
                    </span>
                  </div>

                  {invoice.round_off !== 0 && (
                    <div className="flex justify-between text-[#5A655F]">
                      <span>{currentLang === "hi" ? "राउंड ऑफ:" : "Round Off:"}</span>
                      <span>{formatInr(invoice.round_off)}</span>
                    </div>
                  )}

                  {/* Grand Total Highlight */}
                  <div className="flex justify-between items-center bg-[#145A45] text-white p-2.5 sm:p-3 rounded-xl font-bold text-sm sm:text-base mt-2 shadow-2xs">
                    <span>{currentLang === "hi" ? "कुल देय राशि (Grand Total):" : "Grand Total:"}</span>
                    <span className="text-base sm:text-lg font-black">{formatInr(invoice.grand_total)}</span>
                  </div>

                  {/* Amount Paid / Due */}
                  <div className="flex justify-between pt-2 border-t border-[#E5E0D5] text-[11px] font-semibold">
                    <span>
                      {currentLang === "hi" ? "प्राप्त राशि:" : "Amount Paid:"}{" "}
                      <span className="text-[#15803D] font-bold">{formatInr(invoice.amount_paid)}</span>
                    </span>
                    <span>
                      {currentLang === "hi" ? "बकाया राशि:" : "Amount Due:"}{" "}
                      <span className={invoice.amount_due > 0 ? "text-amber-700 font-bold" : "text-[#5A655F]"}>
                        {formatInr(invoice.amount_due)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Footer */}
              <div className="mt-5 pt-3 border-t border-[#E5E0D5] text-[10px] text-[#5A655F] flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-md space-y-1">
                  <p className="font-bold text-[#16201A] uppercase">
                    {currentLang === "hi" ? "नियम एवं शर्तें (Terms & Conditions):" : "Terms & Conditions:"}
                  </p>
                  <p className="whitespace-pre-line leading-relaxed">
                    {invoice.terms ||
                      "1. Goods once sold can only be returned within 24 hours in original packed condition.\n2. Retain this invoice for verification.\n3. Maharajganj jurisdiction only."}
                  </p>
                  <p className="italic text-[#145A45] pt-1">
                    {invoice.footer_note || "Thank you for choosing Arun Gopal Traders!"}
                  </p>
                </div>

                <div className="text-right space-y-2 shrink-0">
                  <div className="h-6"></div>
                  <div className="border-t border-[#16201A] pt-1 px-4 text-center">
                    <p className="font-bold text-[#16201A]">For Arun Gopal Traders</p>
                    <p className="text-[9px] text-[#5A655F]">(Authorized Signatory)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* 2. COMPACT 80MM THERMAL POS RECEIPT */
            /* ========================================================== */
            <div className="printable-invoice-card mx-auto max-w-[340px] rounded-xl border border-[#E5E0D5] bg-white p-4 font-mono text-xs text-[#16201A] shadow-xs">
              <div className="text-center space-y-0.5 border-b border-dashed border-[#16201A] pb-3">
                <h2 className="font-black text-base uppercase">{invoice.store_name}</h2>
                <p className="text-[11px] text-[#5A655F]">{invoice.store_address}</p>
                <p className="text-[11px] font-bold">Ph: {invoice.store_phone}</p>
                {invoice.store_gstin && <p className="text-[10px]">GSTIN: {invoice.store_gstin}</p>}
                <p className="text-[10px] uppercase font-bold tracking-wider pt-1">
                  *** {invoiceTypeTitle} ***
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-[#16201A] space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>INV NO:</span>
                  <span className="font-bold">{invoice.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>ORDER NO:</span>
                  <span className="font-bold">#{invoice.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold truncate max-w-[150px]">{invoice.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>+91 {invoice.customer_phone}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-[#16201A]">
                <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-[#E5E0D5]">
                  <span>ITEM</span>
                  <span>QTY × RATE</span>
                  <span>AMT</span>
                </div>
                <div className="space-y-1.5 pt-1.5 text-[11px]">
                  {invoice.items_snapshot.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-semibold truncate">{item.name}</p>
                      <div className="flex justify-between text-[#5A655F] text-[10px]">
                        <span>{item.variant_label || "Std"}</span>
                        <span>
                          {item.qty} × {formatInr(item.price)}
                        </span>
                        <span className="font-bold text-[#16201A]">{formatInr(item.line_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-[#16201A] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatInr(invoice.subtotal)}</span>
                </div>
                {invoice.item_discount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Discount:</span>
                    <span>-{formatInr(invoice.item_discount)}</span>
                  </div>
                )}
                {invoice.coupon_discount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Coupon:</span>
                    <span>-{formatInr(invoice.coupon_discount)}</span>
                  </div>
                )}
                {invoice.total_tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax (GST):</span>
                    <span>+{formatInr(invoice.total_tax)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{invoice.delivery_fee === 0 ? "FREE" : formatInr(invoice.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-[#16201A]">
                  <span>TOTAL:</span>
                  <span>{formatInr(invoice.grand_total)}</span>
                </div>
              </div>

              {/* Settlement */}
              <div className="py-2 border-b border-dashed border-[#16201A] text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>MODE:</span>
                  <span className="uppercase font-bold">{invoice.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="uppercase font-bold">{invoice.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAID:</span>
                  <span>{formatInr(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>DUE:</span>
                  <span className="font-bold">{formatInr(invoice.amount_due)}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] space-y-1">
                <p className="font-bold">*** THANK YOU ***</p>
                <p className="text-[9px] text-[#5A655F]">Visit Again • Arun Gopal Traders</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Bottom Actions Bar (sm:hidden, no-print) */}
        <div className="no-print sm:hidden sticky bottom-0 -mx-2 -mb-2 mt-4 bg-white/95 backdrop-blur-md border-t border-[#E8E4DA] p-2.5 flex items-center gap-2 rounded-b-2xl shadow-lg">
          <Button
            onClick={handlePrint}
            size="sm"
            className="flex-1 rounded-xl gap-1.5 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs h-9"
          >
            <Printer className="size-3.5" />
            <span>{currentLang === "hi" ? "प्रिंट / PDF" : "Print / PDF"}</span>
          </Button>
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold border-[#E8E4DA] text-[#145A45] bg-[#FAF8F2] h-9 px-3"
          >
            <Download className="size-3.5 mr-1" />
            <span>{currentLang === "hi" ? "डाउनलोड" : "Download"}</span>
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-semibold border-[#E8E4DA] text-[#5A655F] h-9 px-3"
          >
            <X className="size-3.5 mr-1" />
            <span>{currentLang === "hi" ? "बंद करें" : "Close"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
