import { Phone, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/queries";
import { inr, telHref, waHref } from "@/lib/format";

type PhoneOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PhoneOrderModal({ open, onOpenChange }: PhoneOrderModalProps) {
  const { items, subtotal } = useCart();
  const { data: settings } = useQuery(settingsQuery);

  const phone = settings?.phone ?? "+916388354988";
  const whatsapp = settings?.whatsapp ?? "916388354988";

  let waMessage = `Namaste Arun Gopal Traders, I want to place a grocery order:`;
  if (items.length > 0) {
    waMessage += `\n\n*Cart Items:*`;
    items.forEach((item, idx) => {
      waMessage += `\n${idx + 1}. ${item.name} (${item.variantLabel}) - Qty: ${item.qty} (${inr(item.price * item.qty)})`;
    });
    waMessage += `\n\n*Estimated Subtotal:* ${inr(subtotal)}`;
    waMessage += `\n\nPlease confirm availability and delivery time for Maharajganj.`;
  } else {
    waMessage += `\n\nPlease share the latest grocery list or help me place an order for Maharajganj delivery/pickup.`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Quick Order via Call or WhatsApp
          </DialogTitle>
          <DialogDescription>
            Prefer not to order online? You can place your grocery order directly by speaking with
            our Maharajganj store team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {items.length > 0 ? (
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="size-4 text-primary" /> Current Basket ({items.length}{" "}
                  items)
                </span>
                <span>{inr(subtotal)}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Your cart items will be automatically formatted and sent in the WhatsApp message.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3">
            <a
              href={telHref(phone)}
              className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Call Store Directly</h4>
                  <p className="text-xs text-muted-foreground">{phone}</p>
                </div>
              </div>
              <Button size="sm">Call Now</Button>
            </a>

            <a
              href={waHref(whatsapp, waMessage)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 p-4 transition-colors hover:bg-success/10"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-success text-success-foreground">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Order on WhatsApp</h4>
                  <p className="text-xs text-muted-foreground">Instant chat &amp; grocery list</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-success/40 text-success hover:bg-success/10"
              >
                Send List
              </Button>
            </a>
          </div>

          <div className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
            📍 <strong>Store Location:</strong> Ramnagar, Adda Bazar Road, Maharajganj, UP
            <br />
            🕒 <strong>Hours:</strong> Open 7:00 AM - 9:00 PM Daily (Sunday 8:00 AM - 2:00 PM)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
