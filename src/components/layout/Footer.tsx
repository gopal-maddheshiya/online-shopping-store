import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { telHref, waHref } from "@/lib/format";

const DAYS: [string, string][] = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export function Footer() {
  const { data: s } = useQuery(settingsQuery);

  const phone = s?.phone ?? "+91 6388354988";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = s?.whatsapp ?? "916388354988";
  const email = s?.email ?? "gopalmaddheshiya138@gmail.com";
  const address = s?.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh";

  return (
    <footer className="mt-16 border-t border-[#E5E0D5] bg-white text-[#16201A]">
      {/* Top Value Proposition Bar */}
      <div className="border-b border-[#E5E0D5] bg-[#FAF8F2] py-6">
        <div className="container-page grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#E6EFE8] text-[#0F4A38]">
              <Truck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#16201A]">Fast Local Delivery</p>
              <p className="text-[11px] text-[#5A655F]">
                Free above ₹{s?.free_delivery_threshold ?? 499}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#E6EFE8] text-[#0F4A38]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#16201A]">100% Genuine Items</p>
              <p className="text-[11px] text-[#5A655F]">Original branded staples</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#E6EFE8] text-[#0F4A38]">
              <Phone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#16201A]">Phone &amp; WhatsApp</p>
              <p className="text-[11px] text-[#5A655F]">Easy ordering on call</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#E6EFE8] text-[#0F4A38]">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#16201A]">Store Pickup</p>
              <p className="text-[11px] text-[#5A655F]">Ramnagar shop counter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        {/* Brand & Tagline */}
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-sans text-xl font-bold tracking-tight text-[#0F4A38]"
          >
            <span>🌾</span> Arun Gopal Traders
          </Link>
          <p className="text-xs leading-relaxed text-[#5A655F]">
            {s?.tagline ??
              "Your Trusted Local Grocery Store in Maharajganj. Fresh staples, honest rates, and reliable doorstep delivery."}
          </p>
          <div className="space-y-1.5 text-xs text-[#5A655F] pt-2">
            <a
              href={
                s?.maps_link ??
                "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-[#145A45] transition-colors"
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#145A45]" />
              <span>{address}</span>
            </a>
            <a
              href={telHref(cleanPhone)}
              className="flex items-center gap-2 font-semibold text-[#16201A] hover:text-[#145A45] transition-colors"
            >
              <Phone className="size-3.5 text-[#145A45]" /> {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 hover:text-[#145A45] transition-colors"
            >
              <Mail className="size-3.5 text-[#145A45]" /> {email}
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#16201A]">
            Shop Categories
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-[#5A655F]">
            <li>
              <Link to="/shop" search={{ category: "flour-atta" }} className="hover:text-[#145A45]">
                Atta &amp; Flours
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "rice-grains" }}
                className="hover:text-[#145A45]"
              >
                Basmati Rice &amp; Grains
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "pulses-dal" }} className="hover:text-[#145A45]">
                Pulses &amp; Dal
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "oil-ghee" }} className="hover:text-[#145A45]">
                Mustard Oil &amp; Ghee
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "spices-masala" }}
                className="hover:text-[#145A45]"
              >
                Spices &amp; Whole Masalas
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-[#145A45] font-semibold">
                View All Groceries →
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#16201A]">
            Customer Care
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-[#5A655F]">
            <li>
              <Link to="/track" className="hover:text-[#145A45]">
                Track Order Status
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-[#145A45]">
                My Account &amp; Orders
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-[#145A45]">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#145A45]">
                Help &amp; Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Store Timings */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#16201A]">
            Store Timings
          </h4>
          <div className="mt-3 space-y-1 text-xs">
            {DAYS.map(([key, label]) => {
              const h = s?.business_hours?.[key] ?? {
                open: "07:00",
                close: "21:00",
                closed: false,
              };
              return (
                <div key={key} className="flex justify-between text-[#5A655F]">
                  <span>{label}:</span>
                  <span className="font-medium text-[#16201A]">
                    {h.closed ? "Closed" : `${h.open} - ${h.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-[#E5E0D5] py-4 pb-24 lg:pb-4 bg-[#FAF8F2]">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-[#5A655F] sm:flex-row">
          <p>© {new Date().getFullYear()} Arun Gopal Traders. Ramnagar, Maharajganj, UP.</p>
          <p className="flex items-center gap-1 font-medium">
            <span>आपकी अपनी लोकल किराना दुकान • 100% शुद्धता</span>
          </p>
        </div>
      </div>

      {/* Desktop Floating WhatsApp Quick Order Button */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:flex">
        <a
          href={waHref(whatsapp, "Namaste! I want to order grocery items from Arun Gopal Traders.")}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-full bg-[#145A45] px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-[#0A3628] transition-all hover:scale-105 active:scale-95 border border-white/20"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle className="size-4.5 fill-white text-[#145A45]" />
          <span>WhatsApp Quick Order</span>
        </a>
      </div>
    </footer>
  );
}
