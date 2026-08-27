import { useState } from "react";
import { Search, Phone, Mail, ShoppingBag, Eye, Calendar, IndianRupee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr, formatDate, telHref, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/queries";

type AdminCustomersProps = {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
};

export function AdminCustomers({ orders, onSelectOrder }: AdminCustomersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Group orders by customer phone number
  const customersMap = new Map<
    string,
    {
      phone: string;
      name: string;
      email: string | null;
      orders: Order[];
      totalSpend: number;
      lastOrderDate: string;
    }
  >();

  orders.forEach((o) => {
    const cleanPhone = o.customer_phone.replace(/\D/g, "").slice(-10);
    const existing = customersMap.get(cleanPhone);
    if (existing) {
      existing.orders.push(o);
      existing.totalSpend += Number(o.total || 0);
      if (new Date(o.created_at) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.created_at;
        existing.name = o.customer_name;
        if (o.customer_email) existing.email = o.customer_email;
      }
    } else {
      customersMap.set(cleanPhone, {
        phone: cleanPhone,
        name: o.customer_name,
        email: o.customer_email,
        orders: [o],
        totalSpend: Number(o.total || 0),
        lastOrderDate: o.created_at,
      });
    }
  });

  const customerList = Array.from(customersMap.values());

  const filteredCustomers = customerList.filter((c) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCustomer = selectedPhone ? customersMap.get(selectedPhone) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6B746F]" />
          <Input
            placeholder="Search customers by name or 10-digit mobile number…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9.5 rounded-xl text-xs border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
          />
        </div>

        <span className="text-xs font-semibold text-[#6B746F] shrink-0">
          {customerList.length} Customer{customerList.length === 1 ? "" : "s"} Directory
        </span>
      </div>

      {/* Customers List: Mobile Cards + Desktop Table */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <Users className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">No customers found matching search</p>
          <p className="text-[11px] text-[#6B746F] mt-1">Customers who place orders will appear here automatically.</p>
        </div>
      ) : (
        <>
          {/* Mobile Customer Cards (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredCustomers.map((c) => (
              <div
                key={c.phone}
                className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#145A45]/10 text-xs font-bold text-[#145A45]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1F2924] text-xs leading-snug truncate">{c.name}</p>
                      <a
                        href={telHref(c.phone)}
                        className="inline-flex items-center gap-1 font-mono text-xs text-[#145A45] font-bold py-0.5 hover:underline"
                      >
                        <Phone className="size-3.5" /> +91 {c.phone}
                      </a>
                    </div>
                  </div>
                  <span className="font-sans font-extrabold text-[#145A45] text-sm shrink-0 ml-2">
                    {inr(c.totalSpend)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-xs text-[#6B746F]">
                    {c.orders.length} orders placed
                  </span>
                  <Button
                    onClick={() => setSelectedPhone(c.phone)}
                    variant="outline"
                    className="h-10 rounded-xl text-xs font-semibold px-3.5 border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2]"
                  >
                    <Eye className="mr-1 size-3.5" /> Order History
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Customer Table (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DA] bg-[#FAF8F2]/60 text-[#6B746F]">
                    <th className="py-3 px-4 font-semibold">Customer Name</th>
                    <th className="py-3 px-4 font-semibold">Mobile Number</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Total Orders</th>
                    <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
                    <th className="py-3 px-4 font-semibold">Last Order Date</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {filteredCustomers.map((c) => (
                    <tr key={c.phone} className="hover:bg-[#FAF8F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-full bg-[#145A45]/10 text-xs font-bold text-[#145A45]">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#1F2924]">{c.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <a
                          href={telHref(c.phone)}
                          className="flex items-center gap-1 font-mono text-[#145A45] hover:underline"
                        >
                          <Phone className="size-3" /> +91 {c.phone}
                        </a>
                      </td>

                      <td className="py-3 px-4 text-[#6B746F]">{c.email || "—"}</td>

                      <td className="py-3 px-4">
                        <span className="rounded-md bg-[#FAF8F2] border border-[#E8E4DA] px-2 py-0.5 font-bold text-[#1F2924]">
                          {c.orders.length} orders
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans font-bold text-[#145A45]">
                        {inr(c.totalSpend)}
                      </td>

                      <td className="py-3 px-4 text-[#6B746F]">
                        {formatDate(c.lastOrderDate)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => setSelectedPhone(c.phone)}
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-xs font-semibold border-[#E8E4DA] text-[#145A45] hover:bg-[#FAF8F2]"
                        >
                          <Eye className="mr-1 size-3.5" /> Order History
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customer Orders History Modal */}
      {activeCustomer && (
        <Dialog
          open={Boolean(activeCustomer)}
          onOpenChange={(open) => !open && setSelectedPhone(null)}
        >
          <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
            <DialogHeader className="border-b border-[#E8E4DA] pb-3">
              <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {activeCustomer.name}
              </DialogTitle>
              <p className="text-xs text-[#6B746F]">
                +91 {activeCustomer.phone} • {activeCustomer.orders.length} total orders • Lifetime
                spend: {inr(activeCustomer.totalSpend)}
              </p>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <h4 className="font-bold text-xs text-[#6B746F] uppercase tracking-wider">
                All Orders Placed
              </h4>

              <div className="space-y-2.5">
                {activeCustomer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-3.5 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1F2924]">{order.order_no}</span>
                      <span className="rounded-full bg-[#145A45]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#145A45]">
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B746F]">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="font-bold text-[#145A45] font-sans text-sm">
                        {inr(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E8E4DA] pt-2">
                      <span className="text-[11px] text-[#6B746F]">
                        {order.order_items?.length ?? 1} items ({order.order_type})
                      </span>
                      <Button
                        onClick={() => {
                          setSelectedPhone(null);
                          onSelectOrder(order);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-[#145A45] font-bold hover:bg-white p-1"
                      >
                        Inspect Order Details →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

