import { useState } from "react";
import { Search, Phone, Mail, ShoppingBag, Eye, Calendar, IndianRupee } from "lucide-react";
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
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers by name or 10-digit mobile number…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        <span className="text-xs font-semibold text-muted-foreground">
          {customerList.length} Registered / Ordering Customers
        </span>
      </div>

      {/* Customers List: Mobile Cards + Desktop Table */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          No customers found matching search.
        </div>
      ) : (
        <>
          {/* Mobile Customer Cards (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredCustomers.map((c) => (
              <div
                key={c.phone}
                className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-xs leading-snug">{c.name}</p>
                      <a
                        href={telHref(c.phone)}
                        className="flex items-center gap-1 font-mono text-[11px] text-primary font-bold hover:underline"
                      >
                        <Phone className="size-3" /> +91 {c.phone}
                      </a>
                    </div>
                  </div>
                  <span className="font-display font-extrabold text-foreground text-sm">
                    {inr(c.totalSpend)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {c.orders.length} orders placed
                  </span>
                  <Button
                    onClick={() => setSelectedPhone(c.phone)}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-semibold px-3"
                  >
                    <Eye className="mr-1 size-3.5" /> Order History
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Customer Table (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Customer Name</th>
                    <th className="py-3 px-4 font-semibold">Mobile Number</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Total Orders</th>
                    <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
                    <th className="py-3 px-4 font-semibold">Last Order Date</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((c) => (
                    <tr key={c.phone} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-foreground">{c.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <a
                          href={telHref(c.phone)}
                          className="flex items-center gap-1 font-mono text-primary hover:underline"
                        >
                          <Phone className="size-3" /> +91 {c.phone}
                        </a>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">{c.email || "—"}</td>

                      <td className="py-3 px-4">
                        <span className="rounded-md bg-muted px-2 py-0.5 font-bold">
                          {c.orders.length} orders
                        </span>
                      </td>

                      <td className="py-3 px-4 font-display font-bold text-foreground">
                        {inr(c.totalSpend)}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(c.lastOrderDate)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => setSelectedPhone(c.phone)}
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-xs font-semibold"
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
      {activeCustomer ? (
        <Dialog
          open={Boolean(activeCustomer)}
          onOpenChange={(open) => !open && setSelectedPhone(null)}
        >
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{activeCustomer.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                +91 {activeCustomer.phone} • {activeCustomer.orders.length} total orders • Lifetime
                spend: {inr(activeCustomer.totalSpend)}
              </p>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                All Orders Placed
              </h4>

              <div className="space-y-3">
                {activeCustomer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-card p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">{order.order_no}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="font-bold text-foreground font-display text-sm">
                        {inr(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {order.order_items?.length ?? 1} items ({order.order_type})
                      </span>
                      <Button
                        onClick={() => {
                          setSelectedPhone(null);
                          onSelectOrder(order);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-primary"
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
      ) : null}
    </div>
  );
}
