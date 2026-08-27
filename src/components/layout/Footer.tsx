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
  LayoutDashboard,
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

  const phone = s?.phone ?? "+91 9621617360";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = s?.whatsapp ?? "919621617360";
  const email = s?.email ?? "ashokmaddheshiya51@gmail.com";
  const address = s?.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh";

  return (
    <footer className="mt-16 border-t border-[#EAE6DF] bg-white text-[#191C1B]">
      {/* Top Value Proposition Bar */}
      <div className="border-b border-[#EAE6DF] bg-[#FAF8F5] py-6">
        <div className="container-page grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Truck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#191C1B]">Fast Local Delivery</p>
              <p className="text-[11px] text-[#676D68]">
                Free above ₹{s?.free_delivery_threshold ?? 499}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#191C1B]">100% Genuine Items</p>
              <p className="text-[11px] text-[#676D68]">Original branded staples</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Phone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#191C1B]">Phone &amp; WhatsApp</p>
              <p className="text-[11px] text-[#676D68]">Easy ordering on call</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-[#191C1B]">Store Pickup</p>
              <p className="text-[11px] text-[#676D68]">Ramnagar shop counter</p>
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
            className="inline-block font-sans text-xl font-bold tracking-tight text-[#18483B]"
          >
            Arun Gopal Traders
          </Link>
          <p className="text-xs leading-relaxed text-[#676D68]">
            {s?.tagline ??
              "Your Trusted Local Grocery Store in Maharajganj. Quality products, fair rates, and reliable doorstep delivery."}
          </p>
          <div className="space-y-1.5 text-xs text-[#676D68] pt-2">
            <a
              href={
                s?.maps_link ??
                "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-[#18483B] transition-colors"
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#18483B]" />
              <span>{address}</span>
            </a>
            <a
              href={telHref(cleanPhone)}
              className="flex items-center gap-2 font-semibold text-[#191C1B] hover:text-[#18483B] transition-colors"
            >
              <Phone className="size-3.5 text-[#18483B]" /> {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 hover:text-[#18483B] transition-colors"
            >
              <Mail className="size-3.5 text-[#18483B]" /> {email}
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1B]">
            Shop Categories
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-[#676D68]">
            <li>
              <Link to="/shop" search={{ category: "flour-atta" }} className="hover:text-[#18483B]">
                Atta &amp; Flours
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "rice-grains" }}
                className="hover:text-[#18483B]"
              >
                Basmati Rice &amp; Grains
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "pulses-dal" }} className="hover:text-[#18483B]">
                Pulses &amp; Dal
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "oil-ghee" }} className="hover:text-[#18483B]">
                Mustard Oil &amp; Ghee
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "spices-masala" }}
                className="hover:text-[#18483B]"
              >
                Spices &amp; Whole Masalas
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-[#18483B] font-semibold">
                View All Groceries →
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1B]">
            Customer Care
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-[#676D68]">
            <li>
              <Link to="/track" className="hover:text-[#18483B]">
                Track Order Status
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-[#18483B]">
                My Account &amp; Orders
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-[#18483B]">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#18483B]">
                Help &amp; Support
              </Link>
            </li>
            <li>
              <Link
                to="/admin"
                className="font-semibold text-[#18483B] hover:underline flex items-center gap-1 mt-2"
              >
                <LayoutDashboard className="size-3.5" /> Owner / Admin Portal →
              </Link>
            </li>
          </ul>
        </div>

        {/* Store Timings */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1B]">
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
                <div key={key} className="flex justify-between text-[#676D68]">
                  <span>{label}:</span>
                  <span className="font-medium text-[#191C1B]">
                    {h.closed ? "Closed" : `${h.open} - ${h.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar - with clearance for mobile bottom nav */}
      <div className="border-t border-[#EAE6DF] py-4 pb-24 lg:pb-4 bg-[#FAF8F5]">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-[#676D68] sm:flex-row">
          <p>© {new Date().getFullYear()} Arun Gopal Traders. Ramnagar, Maharajganj, UP.</p>
          <p className="flex items-center gap-1">
            <span>Made with ❤️ for Maharajganj</span>
          </p>
        </div>
      </div>

      {/* Desktop Floating WhatsApp Quick Order Button (Mobile uses MobileNav FAB) */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:flex">
        <a
          href={waHref(whatsapp, "Namaste! I want to order grocery items from Arun Gopal Traders.")}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-[#20ba59] transition-all hover:scale-105 active:scale-95 border border-white/30"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle className="size-4.5 fill-white text-[#25D366]" />
          <span>WhatsApp Quick Order</span>
        </a>
      </div>
    </footer>
  );
}
