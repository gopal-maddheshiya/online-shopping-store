import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatInr, type Invoice } from "@/lib/billing";
import { formatDate } from "@/lib/format";

interface InvoiceViewProps {
  invoice: Invoice | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "hi";
}

export function InvoiceView({
  invoice,
  isOpen,
  onClose,
  lang = "hi",
}: InvoiceViewProps) {
  const [layoutMode, setLayoutMode] = useState<"a4" | "pos">("a4");
  const [currentLang, setCurrentLang] = useState<"en" | "hi">(lang);

  if (!invoice) return null;

  const isTaxInvoice = invoice.tax_enabled && Boolean(invoice.store_gstin);
  const invoiceTypeTitle = isTaxInvoice
    ? currentLang === "hi"
      ? "जीएसटी कर इनवॉइस (TAX INVOICE)"
      : "GST TAX INVOICE"
    : currentLang === "hi"
      ? "खुदरा बिक्री बिल / कैश मेमो (RETAIL INVOICE)"
      : "RETAIL INVOICE / CASH MEMO";

  const isPaid = invoice.payment_status === "paid";
  const isRefunded = invoice.refund_status === "full" || invoice.refund_status === "partial";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-3 sm:p-6 bg-[#FAF8F2] border-[#E8E4DA] rounded-3xl">
        <DialogHeader className="no-print pb-2 border-b border-[#E8E4DA] flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-sans text-base sm:text-lg font-black text-[#16201A] flex items-center gap-2">
              <Receipt className="size-5 text-[#145A45]" />
              <span>{currentLang === "hi" ? "ऑर्डर इनवॉइस व रसीद" : "Official Order Invoice"}</span>
              <span className="text-xs font-mono font-bold text-[#145A45] bg-[#E6EFE8] px-2 py-0.5 rounded-md">
                {invoice.invoice_no}
              </span>
            </DialogTitle>
            <p className="text-xs text-[#5A655F] mt-0.5">
              {currentLang === "hi"
                ? "यह एक कानूनी व डिजिटल रूप से सत्यापित बिल है।"
                : "Digitally generated verified billing receipt."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center bg-white border border-[#E8E4DA] rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLayoutMode("a4")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  layoutMode === "a4"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <FileText className="size-3.5" /> A4 Invoice
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("pos")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  layoutMode === "pos"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <Receipt className="size-3.5" /> 80mm POS
              </button>
            </div>

            {/* Lang Toggle */}
            <button
              type="button"
              onClick={() => setCurrentLang(currentLang === "hi" ? "en" : "hi")}
              className="rounded-xl border border-[#E8E4DA] bg-white px-2.5 py-1 text-xs font-bold text-[#145A45] hover:bg-[#E6EFE8] transition-all"
            >
              {currentLang === "hi" ? "English" : "हिन्दी"}
            </button>

            {/* Print Trigger */}
            <Button
              onClick={handlePrint}
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs"
            >
              <Printer className="size-3.5" />
              <span>{currentLang === "hi" ? "प्रिंट / PDF" : "Print / PDF"}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* ================================================================ */}
        {/* PRINTABLE CONTAINER (TARGETED BY PRINT CSS) */}
        {/* ================================================================ */}
        <div className="printable-invoice-container mt-2">
          {layoutMode === "a4" ? (
            /* ========================================================== */
            /* 1. STANDARD A4 OFFICIAL TAX/RETAIL INVOICE */
            /* ========================================================== */
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 sm:p-8 text-[#16201A] shadow-xs font-sans">
              {/* Top Bar / Category Tag */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#145A45] pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#145A45] text-white font-black text-xl shadow-xs">
                    AGT
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#145A45] tracking-tight">
                      {invoice.store_name}
                    </h1>
                    <p className="text-xs font-semibold text-[#5A655F]">
                      {invoice.store_legal_name || "Arun Gopal Traders"} • महाराजगंज
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-md bg-[#145A45] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                    {invoiceTypeTitle}
                  </span>
                  <p className="text-xs font-mono font-bold text-[#145A45] mt-1">
                    #{invoice.invoice_no}
                  </p>
                  <p className="text-[11px] text-[#5A655F]">
                    {currentLang === "hi" ? "दिनांक:" : "Date:"} {formatDate(invoice.created_at)}
                  </p>
                </div>
              </div>

              {/* 2-Column Info Grid: Store Details & Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-[#E5E0D5] text-xs">
                {/* Store Meta */}
                <div className="space-y-1 bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E4DA]">
                  <p className="font-bold text-[#145A45] uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Building2 className="size-3 text-[#145A45]" />
                    {currentLang === "hi" ? "दुकान विवरण (Billed By)" : "Store Information"}
                  </p>
                  <p className="font-bold text-[#16201A]">{invoice.store_name}</p>
                  <p className="text-[#5A655F] flex items-start gap-1">
                    <MapPin className="size-3 text-[#145A45] shrink-0 mt-0.5" />
                    <span>{invoice.store_address}</span>
                  </p>
                  <p className="text-[#5A655F] flex items-center gap-1">
                    <Phone className="size-3 text-[#145A45] shrink-0" />
                    <span>{invoice.store_phone}</span>
                  </p>
                  {invoice.store_gstin && (
                    <p className="font-semibold text-[#145A45]">
                      GSTIN: <span className="font-mono">{invoice.store_gstin}</span> (State: {invoice.store_state_code} - {invoice.store_state})
                    </p>
                  )}
                </div>

                {/* Customer Meta */}
                <div className="space-y-1 bg-[#FAF8F2] p-3 rounded-xl border border-[#E8E4DA]">
                  <p className="font-bold text-[#145A45] uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <ShieldCheck className="size-3 text-[#145A45]" />
                    {currentLang === "hi" ? "ग्राहक विवरण (Billed To)" : "Customer Information"}
                  </p>
                  <p className="font-bold text-[#16201A]">{invoice.customer_name}</p>
                  <p className="text-[#5A655F] flex items-center gap-1">
                    <Phone className="size-3 text-[#145A45] shrink-0" />
                    <span>+91 {invoice.customer_phone}</span>
                  </p>
                  {invoice.customer_email && (
                    <p className="text-[#5A655F] flex items-center gap-1">
                      <Mail className="size-3 text-[#145A45] shrink-0" />
                      <span>{invoice.customer_email}</span>
                    </p>
                  )}
                  <p className="text-[#5A655F] flex items-start gap-1">
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
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-[#E6EFE8]/60 rounded-xl my-3 text-xs">
                <div className="flex items-center gap-4">
                  <span>
                    <strong>{currentLang === "hi" ? "ऑर्डर नं:" : "Order No:"}</strong>{" "}
                    <span className="font-mono font-bold text-[#145A45]">#{invoice.order_no}</span>
                  </span>
                  <span>
                    <strong>{currentLang === "hi" ? "भुगतान विधि:" : "Payment Mode:"}</strong>{" "}
                    <span className="uppercase font-semibold">{invoice.payment_method}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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

              {/* Line Items Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#145A45] bg-[#FAF8F2] text-[#145A45] font-bold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">{currentLang === "hi" ? "सामग्री विवरण (Item Description)" : "Item Description"}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === "hi" ? "पैकिंग" : "Variant"}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === "hi" ? "मात्रा" : "Qty"}</th>
                      <th className="py-2.5 px-3 text-right">MRP</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === "hi" ? "दर (Rate)" : "Rate"}</th>
                      <th className="py-2.5 px-3 text-right">{currentLang === "hi" ? "छूट" : "Disc."}</th>
                      <th className="py-2.5 px-3 text-right font-black">{currentLang === "hi" ? "कुल राशि (Amount)" : "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]">
                    {invoice.items_snapshot.map((item, idx) => {
                      const lineMrp = (item.mrp || item.price) * item.qty;
                      const lineTotal = item.line_total || item.price * item.qty;
                      const lineDiscount = lineMrp - lineTotal;

                      return (
                        <tr key={idx} className="invoice-item-row hover:bg-[#FAF8F2]/50">
                          <td className="py-2.5 px-3 text-center text-[#5A655F]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#16201A]">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#5A655F]">
                            {item.variant_label || "Standard"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16201A]">
                            {item.qty}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#5A655F] line-through">
                            {formatInr(item.mrp || item.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#16201A]">
                            {formatInr(item.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#15803D] font-semibold">
                            {lineDiscount > 0 ? `-${formatInr(lineDiscount)}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#145A45]">
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
                      <strong>{currentLang === "hi" ? "निर्देश:" : "Instructions:"}</strong> {invoice.notes}
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
                  <div className="flex justify-between items-center bg-[#145A45] text-white p-2.5 rounded-xl font-bold text-sm sm:text-base mt-2 shadow-2xs">
                    <span>{currentLang === "hi" ? "कुल देय राशि (Grand Total):" : "Grand Total:"}</span>
                    <span className="text-lg font-black">{formatInr(invoice.grand_total)}</span>
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
              <div className="mt-6 pt-4 border-t border-[#E5E0D5] text-[10px] text-[#5A655F] flex flex-wrap items-end justify-between gap-4">
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

                <div className="text-right space-y-3 shrink-0">
                  <div className="h-10"></div>
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
            <div className="mx-auto max-w-[340px] rounded-xl border border-[#E5E0D5] bg-white p-4 font-mono text-xs text-[#16201A] shadow-xs">
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
                <div className="space-y-1 pt-1.5 text-[11px]">
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
      </DialogContent>
    </Dialog>
  );
}
