import { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { inr, waHref } from "@/lib/format";
import type { Product } from "@/lib/queries";
import {
  parseGrocerySlipWithGemini,
  type MatchedRationItem,
} from "@/lib/gemini";
import { broadcastNewOrder } from "@/lib/realtime-sync";

interface AdminAiOrderCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderCreated: () => void;
}

export function AdminAiOrderCreator({
  isOpen,
  onClose,
  products,
  onOrderCreated,
}: AdminAiOrderCreatorProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Input states
  const [activeTab, setActiveTab] = useState<"whatsapp" | "slip">("whatsapp");
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");

  // Customer Form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("रामनगर चौराहा, महराजगंज");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");

  // Parsing & Processing State
  const [isParsing, setIsParsing] = useState(false);
  const [items, setItems] = useState<MatchedRationItem[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<{
    orderNo: string;
    waUrl: string;
    total: number;
  } | null>(null);

  function resetAll() {
    setInputText("");
    setImagePreview(null);
    setItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("रामनगर चौराहा, महराजगंज");
    setDeliveryType("delivery");
    setPaymentStatus("pending");
    setIsParsing(false);
    setIsPlacing(false);
    setCreatedOrderSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleClose() {
    if (isPlacing || isParsing) return;
    resetAll();
    onClose();
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("कृपया कोई फोटो (JPG, PNG) चुनें।");
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Parse Slip or WhatsApp Message with Gemini
  async function handleParseSlip() {
    if (!imagePreview && !inputText.trim()) {
      toast.error("कृपया ग्राहक का WhatsApp मैसेज पेस्ट करें या पर्चे की फोटो अपलोड करें।");
      return;
    }

    setIsParsing(true);
    try {
      const res = await parseGrocerySlipWithGemini({
        text: inputText,
        imageBase64: imagePreview || undefined,
        mimeType: imageMime,
        availableProducts: products,
      });

      if (res.success && res.items.length > 0) {
        setItems(res.items);
        toast.success(`AI ने ${res.items.length} सामान दुकान की सूची से मिला लिए!`);
      } else {
        toast.error(res.error || "AI पर्चा पढ़ने में असमर्थ रहा। कृपया टेक्स्ट जांचें।");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI पार्सिंग में समस्या आई।");
    } finally {
      setIsParsing(false);
    }
  }

  // Row update handlers
  function updateItemQty(index: number, qty: number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, quantity: Math.max(1, qty) };
      return next;
    });
  }

  function updateItemPrice(index: number, price: number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, unit_price: Math.max(0, price) };
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const deliveryFee = deliveryType === "delivery" && subtotal < 500 ? 30 : 0;
  const grandTotal = subtotal + deliveryFee;

  // Place Order into Database
  async function handleCreateOrder() {
    if (!customerName.trim()) {
      toast.error("कृपया ग्राहक का नाम भरें।");
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("कृपया 10 अंकों का मान्य मोबाइल नंबर भरें।");
      return;
    }
    if (items.length === 0) {
      toast.error("ऑर्डर में कम से कम 1 सामान होना चाहिए।");
      return;
    }

    setIsPlacing(true);

    try {
      const orderNo = `AGT-${Date.now().toString().slice(-6)}`;

      const orderPayload = {
        order_no: orderNo,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        address:
          deliveryType === "delivery"
            ? {
                name: customerName.trim(),
                phone: cleanPhone,
                line1: customerAddress.trim() || "रामनगर चौराहा, महराजगंज",
                city: "Maharajganj",
                state: "UP",
                pincode: "273303",
              }
            : { note: "Store Pickup at Ramnagar, Adda Bazar Road, Maharajganj" },
        subtotal,
        discount: 0,
        delivery_fee: deliveryFee,
        total: grandTotal,
        payment_method: paymentStatus === "paid" ? "pay_at_store" : "cod",
        payment_status: paymentStatus,
        status: "confirmed",
        notes: `AI Order created by Admin from WhatsApp/Slip.`,
      };

      // 1. Insert order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload as never)
        .select("id, order_no")
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "ऑर्डर सेव करने में विफलता आई।");
      }

      // 2. Insert items
      const itemsPayload = items.map((it) => ({
        order_id: orderData.id,
        product_id: it.product_id,
        variant_id: it.variant_id,
        name: it.product_name,
        name_en: it.product_name,
        name_hi: it.product_name_hi || null,
        variant_label: it.variant_label,
        variant_label_en: it.variant_label,
        variant_label_hi: null,
        price: it.unit_price,
        mrp: it.mrp || it.unit_price,
        qty: it.quantity,
        image_url: it.image_url,
      }));

      await supabase.from("order_items").insert(itemsPayload as never);

      // 3. Decrement stock
      for (const it of items) {
        if (!it.variant_id) continue;
        try {
          const { data: vData } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", it.variant_id)
            .maybeSingle();

          if (vData && typeof vData.stock === "number") {
            const updatedStock = Math.max(0, vData.stock - it.quantity);
            await supabase
              .from("product_variants")
              .update({ stock: updatedStock } as never)
              .eq("id", it.variant_id);
          }
        } catch {
          // Non-blocking
        }
      }

      // Realtime broadcast
      broadcastNewOrder({
        orderId: orderData.id,
        orderNo: orderData.order_no,
        total: grandTotal,
        customerName: customerName.trim(),
        createdAt: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      // Generate WhatsApp confirmation message link for customer
      const itemsText = items
        .map(
          (it, idx) =>
            `${idx + 1}. ${it.product_name_hi || it.product_name} (${it.variant_label}) × ${it.quantity} = ₹${it.unit_price * it.quantity}`
        )
        .join("\n");

      const waMessage = `नमस्ते ${customerName.trim()} जी! 🙏
अरुण गोपाल ट्रेडर्स (रामनगर चौराहा, महराजगंज) से आपका ऑर्डर दर्ज कर लिया गया है।

📋 *ऑर्डर नंबर*: #${orderNo}
*सामान की सूची*:
${itemsText}

💰 *कुल राशि*: ₹${grandTotal}
🚚 *डिलीवरी प्रकार*: ${deliveryType === "delivery" ? "होम डिलीवरी" : "दुकान से उठाएंगे"}
💳 *भुगतान*: ${paymentStatus === "paid" ? "प्राप्त हो गया (Paid)" : "डिलीवरी पर नकद (COD)"}

सामान जल्द तैयार किया जा रहा है। धन्यवाद! 🛍️`;

      const waLink = waHref(cleanPhone, waMessage);

      setCreatedOrderSummary({
        orderNo,
        waUrl: waLink,
        total: grandTotal,
      });

      toast.success(`🎉 ऑर्डर #${orderNo} सफलतापूर्वक बन गया!`);
      onOrderCreated();
    } catch (err: unknown) {
      console.error("Order creation failed:", err);
      toast.error(err instanceof Error ? err.message : "ऑर्डर बनाने में समस्या आई।");
    } finally {
      setIsPlacing(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[96vw] sm:max-w-4xl max-h-[94vh] flex flex-col p-0 rounded-3xl border-[#E8E4DA] bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E8E4DA] bg-gradient-to-r from-[#FAF8F2] via-white to-[#F0F5F2] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
                <span className="size-8 rounded-xl bg-[#145A45] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="size-4.5" />
                </span>
                WhatsApp / पर्चे से ऑर्डर बनाएं (AI Order Creator)
              </DialogTitle>
              <p className="text-xs text-[#5A655F] mt-1">
                ग्राहक का WhatsApp मैसेज पेस्ट करें या पर्चे की फोटो अपलोड करें — AI तुरंत ऑर्डर बना देगा।
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-[#E8E4DA]/50 p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "whatsapp"
                    ? "bg-[#145A45] text-white shadow-xs"
                    : "text-[#5A655F] hover:text-[#1F2924]"
                }`}
              >
                <MessageSquare className="size-3.5" /> WhatsApp मैसेज
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("slip")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "slip"
                    ? "bg-[#145A45] text-white shadow-xs"
                    : "text-[#5A655F] hover:text-[#1F2924]"
                }`}
              >
                <Camera className="size-3.5" /> पर्चे की फोटो
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* If order just created: Success state with WhatsApp Link */}
          {createdOrderSummary ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-4">
              <div className="size-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-emerald-950">
                  ऑर्डर #{createdOrderSummary.orderNo} सफलतापूर्वक दर्ज हुआ!
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  कुल राशि: <strong>{inr(createdOrderSummary.total)}</strong> • इन्वेंट्री अपडेट हो गई है।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={createdOrderSummary.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs h-11 px-6 shadow-xs"
                >
                  <MessageSquare className="size-4" /> ग्राहक को WhatsApp पर बिल रसीद भेजें
                </a>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAll}
                  className="w-full sm:w-auto rounded-xl border-[#E8E4DA] text-xs h-11 font-bold"
                >
                  एक और नया ऑर्डर बनाएं
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Input Section */}
              <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-4 space-y-3">
                {activeTab === "whatsapp" && (
                  <Textarea
                    placeholder="ग्राहक का WhatsApp मैसेज यहाँ पेस्ट करें (जैसे: भैया 5 किलो आशीर्वाद आटा, 1L तेल, 2 पैकेट टाटा नमक घर भेज दो)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white text-xs min-h-[90px] resize-none"
                  />
                )}

                {activeTab === "slip" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-xl border-[#145A45]/30 text-[#145A45] font-bold text-xs h-10 gap-2"
                      >
                        <Camera className="size-4" /> 📷 कैमरे से फोटो खींचें
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-[#E8E4DA] text-[#1F2924] font-bold text-xs h-10 gap-2"
                      >
                        <Upload className="size-4" /> 🖼️ गैलरी से फोटो चुनें
                      </Button>

                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f);
                        }}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f);
                        }}
                      />

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="text-xs text-red-600 hover:underline font-semibold ml-auto"
                        >
                          फोटो हटाएं
                        </button>
                      )}
                    </div>

                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Slip preview"
                        className="max-h-40 max-w-xs object-contain rounded-xl border border-[#E8E4DA]"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#6B746F]">
                    AI दुकान की लाइव इन्वेंट्री से सामान और रेट मिलाएगा।
                  </span>
                  <Button
                    type="button"
                    disabled={isParsing || (!imagePreview && !inputText.trim())}
                    onClick={handleParseSlip}
                    className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-9 px-4 gap-1.5 shadow-xs"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> AI मिला रहा है...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" /> AI से सामान निकालें
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Matched Items Table */}
              {items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#145A45] flex items-center gap-2">
                    <ShoppingBag className="size-4" /> ऑर्डर की सामग्री ({items.length} सामान)
                  </h4>

                  <div className="border border-[#E8E4DA] rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF8F2] border-b border-[#E8E4DA] text-[#5A655F] font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">सामान (Item)</th>
                          <th className="py-2.5 px-3">पैक (Pack)</th>
                          <th className="py-2.5 px-3">मात्रा (Qty)</th>
                          <th className="py-2.5 px-3">दर (Price)</th>
                          <th className="py-2.5 px-3 text-right">कुल (Total)</th>
                          <th className="py-2.5 px-2 text-center">हटाएं</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E4DA]/60">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F2]/50">
                            <td className="py-2.5 px-3 font-semibold text-[#1F2924]">
                              <p className="leading-snug">{it.product_name_hi || it.product_name}</p>
                              {it.notes && (
                                <span className="text-[10px] text-amber-700">{it.notes}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#6B746F]">{it.variant_label}</td>
                            <td className="py-2.5 px-3">
                              <Input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => updateItemQty(idx, parseInt(e.target.value, 10) || 1)}
                                className="w-16 h-7 text-xs rounded-md"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-0.5">
                                <span>₹</span>
                                <Input
                                  type="number"
                                  value={it.unit_price}
                                  onChange={(e) =>
                                    updateItemPrice(idx, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-18 h-7 text-xs rounded-md font-bold text-[#145A45]"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#145A45]">
                              {inr(it.unit_price * it.quantity)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-stone-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Customer Information Form */}
                  <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/40 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#1F2924] flex items-center gap-1.5">
                      <User className="size-4 text-[#145A45]" /> ग्राहक विवरण (Customer Info)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                          ग्राहक का नाम *
                        </label>
                        <Input
                          placeholder="रमेश कुमार"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="h-8.5 text-xs rounded-xl bg-white mt-0.5"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                          मोबाइल नंबर (10 अंक) *
                        </label>
                        <Input
                          placeholder="9876543210"
                          maxLength={10}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="h-8.5 text-xs rounded-xl bg-white mt-0.5"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                          डिलीवरी प्रकार
                        </label>
                        <Select
                          value={deliveryType}
                          onValueChange={(v: "delivery" | "pickup") => setDeliveryType(v)}
                        >
                          <SelectTrigger className="h-8.5 text-xs rounded-xl bg-white mt-0.5 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delivery" className="text-xs">
                              🚚 होम डिलीवरी (Home Delivery)
                            </SelectItem>
                            <SelectItem value="pickup" className="text-xs">
                              🏬 दुकान से उठाएंगे (Store Pickup)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                          भुगतान की स्थिति
                        </label>
                        <Select
                          value={paymentStatus}
                          onValueChange={(v: "pending" | "paid") => setPaymentStatus(v)}
                        >
                          <SelectTrigger className="h-8.5 text-xs rounded-xl bg-white mt-0.5 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" className="text-xs">
                              ⏳ नकद बाकी (COD / Pending)
                            </SelectItem>
                            <SelectItem value="paid" className="text-xs">
                              ✓ प्राप्त हो गया (Paid / Online)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {deliveryType === "delivery" && (
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                            डिलीवरी पता
                          </label>
                          <Input
                            placeholder="घर का पता / मोहल्ला / लैंडमार्क"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="h-8.5 text-xs rounded-xl bg-white mt-0.5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Total Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DA] font-bold text-xs">
                      <span className="text-[#5A655F]">
                        सबटोटल: {inr(subtotal)} {deliveryFee > 0 && `+ डिलीवरी: ₹${deliveryFee}`}
                      </span>
                      <span className="text-sm font-extrabold text-[#145A45]">
                        कुल देय राशि: {inr(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DA] bg-[#FAF8F2]/80 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPlacing}
            className="rounded-xl text-xs font-semibold text-[#5A655F]"
          >
            बंद करें (Cancel)
          </Button>

          {!createdOrderSummary && items.length > 0 && (
            <Button
              type="button"
              disabled={isPlacing || !customerName.trim() || customerPhone.length < 10}
              onClick={handleCreateOrder}
              className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-6 shadow-xs gap-1.5"
            >
              {isPlacing ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> ऑर्डर बन रहा है...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> ✓ ऑर्डर कन्फर्म करें ({inr(grandTotal)})
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
