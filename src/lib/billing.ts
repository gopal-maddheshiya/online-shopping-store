/**
 * Authoritative Billing & Invoicing Engine for Arun Gopal Traders
 * Handles: Financial precision math, GST/Tax breakdown, Retail Receipts, Immutable Snapshots
 */

export interface InvoiceItem {
  product_id?: string | null;
  variant_id?: string | null;
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
  variant_label?: string;
  variant_label_en?: string | null;
  variant_label_hi?: string | null;
  mrp: number;
  price: number;
  qty: number;
  line_total: number;
  line_discount?: number;
  image_url?: string | null;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  order_id: string;
  order_no: string;
  user_id?: string | null;

  // Customer snapshot
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  billing_address: {
    house?: string;
    area?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    [key: string]: unknown;
  };
  delivery_address: {
    house?: string;
    area?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    [key: string]: unknown;
  };

  // Store snapshot
  store_name: string;
  store_legal_name?: string | null;
  store_phone: string;
  store_email?: string | null;
  store_address: string;
  store_gstin?: string | null;
  store_state: string;
  store_state_code: string;
  store_upi_vpa?: string | null;

  // Frozen line items
  items_snapshot: InvoiceItem[];

  // Financial figures
  subtotal: number;
  item_discount: number;
  coupon_code?: string | null;
  coupon_discount: number;
  delivery_fee: number;

  // Tax breakdown
  tax_enabled: boolean;
  tax_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;

  // Settlement
  round_off: number;
  grand_total: number;

  // Payment
  payment_method: string;
  payment_status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | string;
  amount_paid: number;
  amount_due: number;
  paid_at?: string | null;
  transaction_id?: string | null;

  // Refund
  refund_status: "none" | "partial" | "full" | string;
  refund_amount: number;
  refund_reason?: string | null;
  refunded_at?: string | null;

  // Metadata
  invoice_type: "retail_invoice" | "tax_invoice" | "bill_of_supply" | string;
  notes?: string | null;
  footer_note?: string | null;
  terms?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingAuditLog {
  id: string;
  invoice_id?: string | null;
  order_id?: string | null;
  event_type: string;
  previous_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
  changed_by: string;
  note?: string | null;
  created_at: string;
}

export interface BillingCalculationInput {
  items: Array<{
    price: number;
    mrp?: number;
    qty: number;
    name?: string;
    variant_label?: string;
  }>;
  deliveryFee?: number;
  couponDiscount?: number;
  taxEnabled?: boolean;
  taxRate?: number;
  customerState?: string;
  storeState?: string;
}

export interface BillingCalculationResult {
  subtotal: number;
  itemDiscount: number;
  taxableAmount: number;
  taxEnabled: boolean;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  deliveryFee: number;
  couponDiscount: number;
  calculatedGrandTotal: number;
  roundOff: number;
  grandTotal: number;
  isInterState: boolean;
}

/**
 * Pure, deterministic calculation of billing metrics with zero floating-point drift.
 */
export function calculateOrderBilling(input: BillingCalculationInput): BillingCalculationResult {
  const deliveryFee = Math.max(Number(input.deliveryFee ?? 0), 0);
  const couponDiscount = Math.max(Number(input.couponDiscount ?? 0), 0);
  const taxEnabled = Boolean(input.taxEnabled);
  const taxRate = Math.max(Number(input.taxRate ?? 0), 0);

  let subtotal = 0;
  let itemDiscount = 0;

  for (const it of input.items) {
    const qty = Math.max(Number(it.qty ?? 1), 1);
    const price = Math.max(Number(it.price ?? 0), 0);
    const mrp = Math.max(Number(it.mrp ?? price), price);

    const lineTotal = roundToTwo(price * qty);
    const lineDiscount = roundToTwo((mrp - price) * qty);

    subtotal = roundToTwo(subtotal + lineTotal);
    itemDiscount = roundToTwo(itemDiscount + lineDiscount);
  }

  const taxableAmount = Math.max(roundToTwo(subtotal - couponDiscount), 0);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalTax = 0;
  let isInterState = false;

  if (taxEnabled && taxRate > 0) {
    const custState = (input.customerState || "Uttar Pradesh").trim().toLowerCase();
    const storeState = (input.storeState || "Uttar Pradesh").trim().toLowerCase();

    isInterState = custState !== "" && storeState !== "" && custState !== storeState;

    if (isInterState) {
      igst = roundToTwo((taxableAmount * taxRate) / 100);
      totalTax = igst;
    } else {
      cgst = roundToTwo((taxableAmount * (taxRate / 2)) / 100);
      sgst = roundToTwo((taxableAmount * (taxRate / 2)) / 100);
      totalTax = roundToTwo(cgst + sgst);
    }
  }

  const calculatedGrandTotal = roundToTwo(taxableAmount + totalTax + deliveryFee);
  const roundedGrandTotal = Math.round(calculatedGrandTotal);
  const roundOff = roundToTwo(roundedGrandTotal - calculatedGrandTotal);

  return {
    subtotal,
    itemDiscount,
    taxableAmount,
    taxEnabled,
    taxRate,
    cgst,
    sgst,
    igst,
    totalTax,
    deliveryFee,
    couponDiscount,
    calculatedGrandTotal,
    roundOff,
    grandTotal: roundedGrandTotal,
    isInterState,
  };
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatInr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
