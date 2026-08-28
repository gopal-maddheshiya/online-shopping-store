export type Language = "en" | "hi";

export type Translations = {
  // Top Alert Bar
  topAlert: string;
  callNow: string;
  storeTimings: string;
  openUntil: string;
  closedOpensAt: string;
  closedToday: string;

  // Header & Brand
  storeName: string;
  searchPlaceholder: string;
  searchSuggestions: string[];
  searchBtn: string;
  login: string;
  myAccount: string;
  wishlist: string;
  cart: string;
  callStore: string;
  home: string;
  allGroceries: string;
  trackOrder: string;
  helpCenter: string;
  adminPortal: string;

  // Hero & Banners
  heroTitle: string;
  heroSubtitle: string;
  shopNow: string;
  orderOnWhatsapp: string;
  orderOnPhone: string;
  flashSaleTag: string;
  flashSaleTitle: string;
  flashSaleSubtitle: string;
  welcomeOfferTitle: string;
  welcomeOfferSub: string;

  // Quick Actions
  quickShop: string;
  quickOrders: string;
  quickBuyAgain: string;
  quickCall: string;
  quickLocation: string;

  // Category Strip
  browseCategories: string;
  viewAll: string;

  // Sections
  dealsOfDay: string;
  dealsOfDaySub: string;
  featuredStaples: string;
  featuredStaplesSub: string;
  popularMaharajganj: string;
  popularMaharajganjSub: string;

  // Product Card
  add: string;
  added: string;
  save: string;
  inStock: string;
  outOfStock: string;
  onlyLeft: string;
  off: string;

  // Trust Badges
  freeDeliveryTitle: string;
  freeDeliverySub: string;
  storePickupTitle: string;
  storePickupSub: string;
  genuineBrandsTitle: string;
  genuineBrandsSub: string;
  purityTagline: string;
  puritySub: string;

  // Cart & Checkout
  yourCart: string;
  emptyCartTitle: string;
  emptyCartSub: string;
  proceedToCheckout: string;
  itemSubtotal: string;
  deliveryFee: string;
  free: string;
  totalAmount: string;
  savings: string;

  // Contact & Support
  needHelp: string;
  weAreHereToHelp: string;
  contactSub: string;
  submitInquiry: string;
  name: string;
  phone: string;
  message: string;

  // Store Address & Info
  storeAddress: string;
  storeAddressShort: string;
  storeLocationLabel: string;
  storeHoursLabel: string;
  storeHoursValue: string;

  // Quick Order Modal
  quickOrderTitle: string;
  quickOrderDesc: string;
  callStoreDirectly: string;
  instantChatList: string;
  sendList: string;
  currentBasketLabel: string;
  cartAutoFormatNote: string;
};

export const translations: Record<Language, Translations> = {
  en: {
    topAlert: "Free home delivery in Maharajganj on orders above ₹499",
    callNow: "Call",
    storeTimings: "Daily 7:00 AM - 9:00 PM",
    openUntil: "Open today until {time}",
    closedOpensAt: "Closed • Opens at {time}",
    closedToday: "Closed today",
    storeName: "Arun Gopal Traders",
    searchPlaceholder: "Search atta, basmati rice, mustard oil, spices...",
    searchSuggestions: [
      "Search flour...",
      "Search milk...",
      "Search chocolate...",
      "Search basmati rice...",
      "Search mustard oil...",
      "Search spices & masala...",
      "Search tea & coffee...",
      "Search dry fruits...",
      "Search biscuits & cookies...",
      "Search pulses & dal...",
    ],
    searchBtn: "Search",
    login: "Login / Account",
    myAccount: "My Account",
    wishlist: "Wishlist",
    cart: "Cart",
    callStore: "Call Store",
    home: "Home",
    allGroceries: "All Groceries",
    trackOrder: "Track Order",
    helpCenter: "Help Center",
    adminPortal: "Owner / Admin Portal",
    heroTitle: "Fresh Groceries & Daily Staples",
    heroSubtitle: "Quality products • Genuine MRP • Fast doorstep delivery in Maharajganj",
    shopNow: "Shop Groceries",
    orderOnWhatsapp: "Order on WhatsApp",
    orderOnPhone: "Order by Phone",
    flashSaleTag: "SUPER SAVER BAZAAR",
    flashSaleTitle: "Mega Savings on Chakki Atta & Mustard Oil",
    flashSaleSubtitle: "Top branded grocery staples at guaranteed lowest rates in Maharajganj.",
    welcomeOfferTitle: "Flat ₹50 OFF with code WELCOME50",
    welcomeOfferSub: "Applicable on your online grocery order above ₹300.",
    quickShop: "Shop Groceries",
    quickOrders: "My Orders",
    quickBuyAgain: "Buy Again",
    quickCall: "Call Store",
    quickLocation: "Store Location",
    browseCategories: "Shop by Category",
    viewAll: "View All",
    dealsOfDay: "Today's Super Deals",
    dealsOfDaySub: "Special discounted prices on daily kitchen staples",
    featuredStaples: "Featured Staples & Dal Varieties",
    featuredStaplesSub: "Pure, fresh, and handpicked daily essentials",
    popularMaharajganj: "Most Popular in Maharajganj",
    popularMaharajganjSub: "Top ordered grocery items by local families",
    add: "Add",
    added: "Added",
    save: "Save",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    onlyLeft: "Only {count} left",
    off: "OFF",
    freeDeliveryTitle: "Free Local Delivery",
    freeDeliverySub: "On orders above ₹499 in Maharajganj",
    storePickupTitle: "Store Pickup Available",
    storePickupSub: "Ramnagar, Adda Bazar Road",
    genuineBrandsTitle: "100% Genuine Brands",
    genuineBrandsSub: "Fortune, Tata, Aashirvaad, Amul, MDH",
    purityTagline: "शुद्धता हमारी पहचान",
    puritySub: "आपका विश्वास",
    yourCart: "Your Shopping Cart",
    emptyCartTitle: "Your cart is empty",
    emptyCartSub: "Add some fresh daily essentials to get started.",
    proceedToCheckout: "Proceed to Checkout",
    itemSubtotal: "Item Subtotal",
    deliveryFee: "Delivery Fee",
    free: "FREE",
    totalAmount: "Total Amount",
    savings: "Your Total Savings",
    needHelp: "Need Help? Call Us",
    weAreHereToHelp: "We're here to help.",
    contactSub: "Having trouble finding an item or placing an order? Talk to us.",
    name: "Full Name",
    phone: "Mobile Number",
    message: "Your Message / Item List",
    storeAddress: "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh",
    storeAddressShort: "Ramnagar, Adda Bazar Road, Maharajganj, UP",
    storeLocationLabel: "Store Location",
    storeHoursLabel: "Hours",
    storeHoursValue: "Open 7:00 AM - 9:00 PM Daily (Sunday 8:00 AM - 2:00 PM)",
    quickOrderTitle: "Quick Order via Call or WhatsApp",
    quickOrderDesc: "Prefer not to order online? You can place your grocery order directly by speaking with our Maharajganj store team.",
    callStoreDirectly: "Call Store Directly",
    instantChatList: "Instant chat & grocery list",
    submitInquiry: "Submit Inquiry",
    sendList: "Send List",

    currentBasketLabel: "Current Basket",
    cartAutoFormatNote: "Your cart items will be automatically formatted and sent in the WhatsApp message.",
  },
  hi: {
    topAlert: "महाराजगंज में ₹499 से अधिक के ऑर्डर पर फ्री होम डिलीवरी",
    callNow: "कॉल करें",
    storeTimings: "प्रतिदिन सुबह 7:00 से रात 9:00 बजे तक",
    openUntil: "आज रात {time} तक खुली है",
    closedOpensAt: "दुकान बंद है • सुबह {time} खुलेगी",
    closedToday: "आज दुकान बंद है",
    storeName: "अरुण गोपाल ट्रेडर्स",
    searchPlaceholder: "आटा, बासमती चावल, सरसों तेल, मसाले खोजें...",
    searchSuggestions: [
      "आटा खोजें...",
      "दूध खोजें...",
      "चॉकलेट खोजें...",
      "बासमती चावल खोजें...",
      "सरसों तेल खोजें...",
      "मसाले खोजें...",
      "चाय और कॉफी खोजें...",
      "काजू बादाम खोजें...",
      "बिस्कुट खोजें...",
      "दालें खोजें...",
    ],
    searchBtn: "खोजें",
    login: "लॉगिन / खाता",
    myAccount: "मेरा खाता",
    wishlist: "पसंदीदा सूची",
    cart: "कार्ट",
    callStore: "दुकान पर कॉल करें",
    home: "मुख्य पृष्ठ",
    allGroceries: "सभी किराना सामान",
    trackOrder: "ऑर्डर ट्रैक करें",
    helpCenter: "सहायता केंद्र",
    adminPortal: "दुकानदार / एडमिन पोर्टल",
    heroTitle: "ताज़ा किराना एवं दैनिक राशन सामग्री",
    heroSubtitle: "शुद्ध सामग्री • उचित मूल्य • महाराजगंज में तेज़ होम डिलीवरी",
    shopNow: "सामान खरीदें",
    orderOnWhatsapp: "व्हाट्सएप पर ऑर्डर करें",
    orderOnPhone: "फोन पर ऑर्डर करें",
    flashSaleTag: "महा बचत किराना बाजार",
    flashSaleTitle: "चक्की आटा और सरसों तेल पर भारी छूट",
    flashSaleSubtitle: "महाराजगंज में सबसे भरोसेमंद ब्रांड्स और गारंटीड उचित मूल्य।",
    welcomeOfferTitle: "WELCOME50 कोड के साथ पाएं ₹50 की सीधी छूट",
    welcomeOfferSub: "₹300 से अधिक के ऑनलाइन किराना ऑर्डर पर मान्य।",
    quickShop: "किराना खरीदें",
    quickOrders: "मेरे ऑर्डर",
    quickBuyAgain: "पुनः ऑर्डर करें",
    quickCall: "दुकान पर कॉल",
    quickLocation: "दुकान का पता",
    browseCategories: "कैटेगरी अनुसार देखें",
    viewAll: "सभी देखें",
    dealsOfDay: "आज के सुपर ऑफर्स",
    dealsOfDaySub: "रसोई के दैनिक सामानों पर विशेष छूट",
    featuredStaples: "खास अनाज एवं दालें",
    featuredStaplesSub: "शुद्ध, ताज़ा एवं चुनिंदा दैनिक राशन",
    popularMaharajganj: "महाराजगंज में सबसे लोकप्रिय",
    popularMaharajganjSub: "स्थानीय परिवारों द्वारा सबसे अधिक पसंद किए गए उत्पाद",
    add: "जोड़ें",
    added: "जोड़ा गया",
    save: "बचत",
    inStock: "उपलब्ध है",
    outOfStock: "स्टॉक समाप्त",
    onlyLeft: "केवल {count} शेष",
    off: "छूट",
    freeDeliveryTitle: "फ्री लोकल डिलीवरी",
    freeDeliverySub: "महाराजगंज में ₹499 से ऊपर के ऑर्डर पर",
    storePickupTitle: "दुकान से पिकअप उपलब्ध",
    storePickupSub: "रामनगर, अड्डा बाजार रोड",
    genuineBrandsTitle: "100% असली ब्रांड्स",
    genuineBrandsSub: "फॉर्च्यून, टाटा, आशीर्वाद, अमूल, एमडीएच",
    purityTagline: "शुद्धता हमारी पहचान",
    puritySub: "आपका विश्वास",
    yourCart: "आपकी शॉपिंग कार्ट",
    emptyCartTitle: "आपकी कार्ट खाली है",
    emptyCartSub: "शॉपिंग शुरू करने के लिए कुछ दैनिक सामान जोड़ें।",
    proceedToCheckout: "चेकआउट के लिए आगे बढ़ें",
    itemSubtotal: "सामान का कुल मूल्य",
    deliveryFee: "डिलीवरी शुल्क",
    free: "मुफ्त",
    totalAmount: "कुल देय राशि",
    savings: "आपकी कुल बचत",
    needHelp: "सहायता चाहिए? कॉल करें",
    weAreHereToHelp: "हम आपकी सेवा में तत्पर हैं।",
    contactSub: "कोई सामान नहीं मिल रहा या ऑर्डर करने में परेशानी है? हमसे संपर्क करें।",
    submitInquiry: "पूछताछ भेजें",
    name: "पूरा नाम",
    phone: "मोबाइल नंबर",
    message: "सामान की सूची / संदेश",
    storeAddress: "रामनगर, अड्डा बाजार रोड, महाराजगंज, उत्तर प्रदेश",
    storeAddressShort: "रामनगर, अड्डा बाजार रोड, महाराजगंज, उ.प्र.",
    storeLocationLabel: "दुकान का पता",
    storeHoursLabel: "समय",
    storeHoursValue: "प्रतिदिन सुबह 7:00 से रात 9:00 बजे (रविवार सुबह 8:00 से दोपहर 2:00 बजे)",
    quickOrderTitle: "कॉल या व्हाट्सएप से तुरंत ऑर्डर करें",
    quickOrderDesc: "ऑनलाइन ऑर्डर नहीं करना चाहते? आप सीधे हमारी महाराजगंज दुकान से बात करके किराने का सामान ऑर्डर कर सकते हैं।",
    callStoreDirectly: "दुकान पर सीधे कॉल करें",
    instantChatList: "तुरंत चैट व सामान की लिस्ट भेजें",
    sendList: "लिस्ट भेजें",
    currentBasketLabel: "वर्तमान कार्ट",
    cartAutoFormatNote: "आपके कार्ट का सामान अपने आप व्यवस्थित होकर व्हाट्सएप संदेश में जुड़ जाएगा।",
  },
};

// Complete Parent & Subcategory Translation Map by Slug
export const CATEGORY_NAMES_HI: Record<string, string> = {
  // Parent categories
  "atta-flour": "आटा और मैदा",
  "flour-atta": "आटा और मैदा",
  rice: "चावल और अनाज",
  "rice-grains": "चावल और अनाज",
  "pulses-dal": "दालें और दलहन",
  "oil-ghee": "सरसों तेल और घी",
  "spices-masala": "खड़े और पिसे मसाले",
  "salt-sugar": "चीनी, गुड़ और नमक",
  "sugar-salt": "चीनी, गुड़ और नमक",
  "dry-fruits": "सूखे मेवे (काजू, बादाम)",
  "tea-coffee": "चाय और कॉफी",
  biscuits: "बिस्कुट और कुकीज",
  "namkeen-snacks": "नमकीन और स्नैक्स",
  "snacks-namkeen": "नमकीन और स्नैक्स",
  chocolates: "चॉकलेट और टॉफी",
  "noodles-pasta": "नूडल्स और पास्ता",
  "sauces-spreads": "सॉस और अचार",
  dairy: "दूध और डेयरी उत्पाद",
  beverages: "कोल्ड ड्रिंक्स और जूस",
  "packaged-foods": "पैकेटबंद खाद्य सामग्री",
  breakfast: "नाश्ता और कॉर्नफ्लेक्स",
  "baby-products": "शिशु देखभाल (बेबी केयर)",
  "personal-care": "साबुन, शैम्पू व तेल",
  "hair-care": "हेयर ऑयल व शैम्पू",
  "skin-care": "त्वचा देखभाल व क्रीम",
  "oral-care": "टूथपेस्ट व ब्रश",
  "household-cleaning": "घरेलू सफाई का सामान",
  cleaning: "घरेलू सफाई का सामान",
  laundry: "डिटर्जेंट और कपड़े धोने का साबुन",
  "kitchen-essentials": "रसोई की आवश्यक वस्तुएं",
  "pooja-items": "पूजा सामग्री",
  "pooja-needs": "पूजा सामग्री",
  stationery: "स्टेशनरी, कॉपी व पेन",
  "pet-supplies": "पालतू पशु आहार",
  other: "अन्य किराना सामान",

  "utensils-cookware": "बर्तन और रसोई उपकरण",
  "cooking-utensils": "खाना पकाने के बर्तन",
  "misc-items": "विविध घरेलू सामान",
  miscellaneous: "विविध घरेलू सामान",

  // Subcategories
  "atta-flour-wheat-atta": "गेहूं का चक्की आटा",
  "atta-flour-multigrain-atta": "मल्टीग्रेन आटा",
  "atta-flour-maida": "रिफाइंड मैदा",
  "atta-flour-besan": "बारीक चना बेसन",
  "atta-flour-suji-rava": "दानेदार सूजी / रवा",
  "atta-flour-rice-flour": "चावल का आटा",
  "atta-flour-corn-flour": "कॉर्न फ्लोर",
  "pulses-dal-millets": "मोटा अनाज (बाजरा / ज्वार)",
  "pulses-dal-whole-lentils": "साबुत दालें",
  "spices-masala-exotic": "साबुत खड़े मसाले",
  "oil-ghee-specialty": "विशेष कुकिंग तेल",
  "dairy-paneer-cheese": "पनीर और चीज़",
  "dairy-yogurt-dahi": "दही और छाछ",
  "beverages-traditional": "पारंपरिक पेय और लस्सी",
  "utensils-pots-pans": "कुकर, कढ़ाई और तवा",
  "utensils-containers": "स्टील और प्लास्टिक डिब्बे",
  "utensils-kitchen-tools": "चाकू, छलनी व उपकरण",
  "misc-electrical": "बैटरी व बल्ब",
  "misc-household": "पूजा व विविध सामान",
};

// By Name Exact/Fuzzy Map in Hindi
export const CATEGORY_NAMES_BY_NAME_HI: Record<string, string> = {
  "atta & flour": "आटा और मैदा",
  atta: "आटा और मैदा",
  flour: "आटा और मैदा",
  rice: "चावल और अनाज",
  "pulses & dal": "दालें और दलहन",
  dal: "दालें और दलहन",
  "oil & ghee": "सरसों तेल और घी",
  "spices & masala": "खड़े और पिसे मसाले",
  "salt & sugar": "चीनी, गुड़ और नमक",
  "dry fruits": "सूखे मेवे (काजू, बादाम)",
  "tea & coffee": "चाय और कॉफी",
  biscuits: "बिस्कुट और कुकीज",
  "namkeen & snacks": "नमकीन और स्नैक्स",
  chocolates: "चॉकलेट",
  "noodles & pasta": "नूडल्स और पास्ता",
  "sauces & spreads": "सॉस और अचार",
  "dairy products": "दूध और डेयरी उत्पाद",
  dairy: "दूध और डेयरी उत्पाद",
  beverages: "कोल्ड ड्रिंक्स और जूस",
  "packaged foods": "पैकेटबंद खाद्य सामग्री",
  "breakfast items": "नाश्ता सामग्री",
  "baby products": "शिशु देखभाल",
  "personal care": "साबुन, शैम्पू व तेल",
  "hair care": "हेयर ऑयल व शैम्पू",
  "skin care": "क्रीम व त्वचा देखभाल",
  "oral care": "टूथपेस्ट व ब्रश",
  "household cleaning": "घरेलू सफाई का सामान",
  laundry: "डिटर्जेंट पाउडर व साबुन",
  "kitchen essentials": "रसोई सामग्री",
  "pooja items": "पूजा सामग्री",
  stationery: "स्टेशनरी व कॉपियां",
  "pet supplies": "पालतू पशु आहार",
  other: "अन्य किराना",
  "wheat atta": "गेहूं का आटा",
  besan: "शुद्ध बेसन",
  "suji / rava": "सूजी / रवा",
  maida: "मैदा",
  "basmati rice": "बासमती चावल",
  "non-basmati rice": "सादा चावल",
  "toor dal": "अरहर / तूर दाल",
  "moong dal": "मूंग दाल",
  "masoor dal": "मसूर दाल",
  rajma: "राजमा",
  "kabuli chana": "काबुली चना",
  "mustard oil": "सरसों का तेल",
  "sunflower oil": "सनफ्लावर तेल",
  "desi ghee": "शुद्ध देसी घी",
  turmeric: "हल्दी पाउडर",
  "red chilli": "लाल मिर्च पाउडर",
  "garam masala": "गरम मसाला",
  cumin: "साबुत जीरा",
  "coriander powder": "धनिया पाउडर",
  "iodized salt": "आयोडाइज्ड नमक",
  sugar: "सफेद चीनी",
  jaggery: "गुड़ की भेली",
  honey: "शुद्ध शहद",
  almonds: "कैलिफोर्निया बादाम",
  cashews: "साबुत काजू",
  raisins: "मीठी किशमिश",
  tea: "कड़क चायपत्ती",
  "instant coffee": "इंस्टेंट कॉफी",
  "glucose biscuits": "ग्लूकोज बिस्कुट",
  cookies: "कुकीज बिस्कुट",
  marie: "मेरी बिस्कुट",
  bhujia: "आलू भुजिया",
  chips: "पोटैटो चिप्स",
  noodles: "मैगी नूडल्स",
  pasta: "पास्ता",
  "tomato ketchup": "टोमैटो सॉस",
  pickles: "आम का अचार",
  milk: "ताज़ा दूध",
  butter: "मक्खन (बटर)",
  "mineral water": "मिनरल वाटर",
  "soft drinks": "कोल्ड ड्रिंक",
  juice: "फ्रूट जूस",
  cornflakes: "कॉर्नफ्लेक्स",
  poha: "मोटा पोहा",
  oats: "साबुत ओट्स",
  "baby powder": "बेबी पाउडर",
  diapers: "बेबी डायपर",
  soap: "नहाने का साबुन",
  "hand wash": "हैंडवॉश",
  "hair oil": "नारियल तेल",
  shampoo: "शैम्पू",
  moisturizer: "मॉइस्चराइजर क्रीम",
  toothpaste: "टूथपेस्ट",
  "floor cleaner": "फ्लोर क्लीनर",
  "toilet cleaner": "टॉयलेट क्लीनर",
  dishwash: "बर्तन धोने का साबुन",
  "detergent powder": "डिटर्जेंट पाउडर",
  "detergent bar": "कपड़े धोने का साबुन",
  "fabric conditioner": "फैब्रिक कंडीशनर",
  scrubbers: "स्क्रब पैड",
  "aluminium foil": "एल्युमिनियम फॉयल",
  agarbatti: "अगरबत्ती",
  camphor: "पूजा कपूर",
  notebooks: "नोटबुक / कॉपी",
  pens: "बॉल पेन",
  "pet food": "डॉग फूड",
};

// Comprehensive Hindi product name translations map
export const PRODUCT_NAMES_HI: Record<string, string> = {
  "fortune-chakki-fresh-atta": "फॉर्च्यून चक्की फ्रेश शुद्ध आटा",
  "aashirvaad-shudh-chakki-atta": "आशीर्वाद शुद्ध चक्की आटा",
  "rajdhani-besan": "राजधानी शुद्ध बारीक बेसन",
  "bansi-suji-rava": "बंसी दानेदार सूजी / रवा",
  "shakti-bhog-maida": "शक्ति भोग रिफाइंड मैदा",
  "india-gate-classic-basmati-rice": "इंडिया गेट क्लासिक बासमती चावल",
  "daawat-rozana-gold-basmati": "दावत रोज़ाना गोल्ड बासमती चावल",
  "sona-masoori-rice-local": "सोना मसूरी चावल (लोकल मिल)",
  "tata-sampann-toor-dal": "टाटा सम्पन्न अनपॉलिश्ड तूर दाल (अरहर)",
  "moong-dal-dhuli": "मूंग दाल धुली (बिना छिलका)",
  "masoor-dal": "मसूर दाल (लाल दाल)",
  "rajma-chitra": "चित्रा राजमा (प्रीमियम)",
  "kabuli-chana": "काबुली चना (बड़ा सफेद छोला)",
  "fortune-kachi-ghani-mustard-oil": "फॉर्च्यून कच्ची घानी शुद्ध सरसों का तेल",
  "patanjali-kachi-ghani-sarson-tel": "पतंजलि कच्ची घानी सरसों का तेल",
  "fortune-sunlite-refined-sunflower-oil": "फॉर्च्यून सनलाइट रिफाइंड तेल",
  "amul-pure-desi-ghee": "अमुल शुद्ध गाय का देसी घी",
  "everest-turmeric-powder-haldi": "एवरेस्ट शुद्ध हल्दी पाउडर",
  "mdh-deggi-mirch": "एमडीएच देगी मिर्च पाउडर",
  "everest-garam-masala": "एवरेस्ट शाही गरम मसाला",
  "catch-jeera-whole": "कैच खड़ा साबुत जीरा",
  "everest-dhaniya-powder": "एवरेस्ट धनिया पाउडर",
  "tata-salt-iodised": "टाटा वैक्यूम इवैपोरेटेड नमक",
  "madhur-pure-sugar": "मधुर शुद्ध सल्फर-फ्री चीनी",
  "organic-gud-jaggery-block": "देसी गुड़ की भेली (बिना केमिकल)",
  "dabur-honey": "डाबर 100% शुद्ध शहद",
  "california-almonds-badam": "कैलिफोर्निया बादाम गिरी",
  "whole-cashew-w320-kaju": "काजू साबुत (प्रीमियम W320)",
  "kishmish-raisins": "किशमिश (मीठी दाख)",
  "tata-tea-premium": "टाटा टी प्रीमियम कड़क चायपत्ती",
  "red-label-natural-care-tea": "रेड लेबल नेचुरल केयर चायपत्ती",
  "nescafe-classic-instant-coffee": "नेस्कैफे क्लासिक इंस्टेंट कॉफी",
  "parle-g-original-glucose-biscuits": "पारले-जी ग्लूकोज बिस्कुट",
  "britannia-good-day-cashew-cookies": "ब्रिटानिया गुड डे काजू बिस्कुट",
  "sunfeast-marie-light": "सनफीस्ट मेरी लाइट बिस्कुट",
  "haldiram-s-aloo-bhujia": "हल्दीराम चटपटी आलू भुजिया",
  "bikaji-bikaneri-bhujia": "बीकाजी बीकानेरी भुजिया नमकीन",
  "lay-s-india-s-magic-masala": "लेज़ मैजिक मसाला पोटैटो चिप्स",
  "cadbury-dairy-milk": "कैडबरी डेयरी मिल्क चॉकलेट",
  "maggi-2-minute-masala-noodles": "मैगी 2-मिनट मसाला नूडल्स",
  "sunfeast-yippee-pasta-masala": "सनफीस्ट यिप्पी पास्ता मसाला",
  "kissan-fresh-tomato-ketchup": "किसान फ्रेश टोमैटो केचप सॉस",
  "mother-s-recipe-mango-pickle": "मदर्स रेसिपी आम का पारंपरिक अचार",
  "amul-taaza-toned-milk": "अमुल ताज़ा टोंड दूध (टेट्रा पैक)",
  "amul-butter": "अमुल मक्खन (बटर)",
  "bisleri-mineral-water": "बिसलेरी पैकेज्ड मिनरल वाटर",
  "coca-cola-soft-drink": "कोका-कोला कोल्ड ड्रिंक",
  "real-mixed-fruit-juice": "रियल मिक्स्ड फ्रूट जूस",
  "kellogg-s-corn-flakes": "केलॉग्स कॉर्नफ्लेक्स (नाश्ता)",
  "aashirvaad-poha": "आशीर्वाद मोटा पोहा (चूड़ा)",
  "saffola-oats": "सफोला 100% साबुत ओट्स",
  "johnson-s-baby-powder": "जॉनसन बेबी पाउडर",
  "pampers-baby-dry-pants": "पैम्पर्स बेबी ड्राई पैंट्स डायपर",
  "lifebuoy-total-10-soap": "लाइफबॉय टोटल 10 साबुन",
  "dettol-handwash-refill": "डेटॉल हैंडवॉश रीफिल पैक",
  "parachute-coconut-hair-oil": "पैराशूट शुद्ध नारियल तेल",
  "clinic-plus-strong-long-shampoo": "क्लीनिक प्लस स्ट्रॉन्ग शैम्पू",
  "nivea-soft-light-moisturiser": "निविया सॉफ्ट लाइट क्रीम",
  "colgate-strong-teeth-toothpaste": "कोलगेट स्ट्रॉन्ग टीथ टूथपेस्ट",
  "lizol-disinfectant-floor-cleaner": "लाइज़ोल कीटाणुनाशक फ्लोर क्लीनर",
  "harpic-power-plus-toilet-cleaner": "हार्पिक पावर प्लस टॉयलेट क्लीनर",
  "vim-dishwash-bar": "विम बर्तन धोने का साबुन",
  "surf-excel-easy-wash-detergent-powder": "सर्फ एक्सेल इजी वॉश डिटर्जेंट",
  "rin-detergent-bar": "रिन डिटर्जेंट साबुन",
  "comfort-fabric-conditioner": "कंफर्ट फैब्रिक कंडीशनर",
  "scotch-brite-scrub-pad": "स्कॉच ब्राइट स्क्रब पैड",
  "homefoil-aluminium-foil": "होमफॉइल एल्युमिनियम फॉयल",
  "cycle-pure-agarbatti-three-in-one": "साइकिल प्योर अगरबत्ती (3-इन-1)",
  "mangaldeep-camphor-kapoor": "मंगलदीप पूजा कपूर की टिकिया",
  "classmate-notebook-172-pages": "क्लासमेट नोटबुक / कॉपी (172 पेज)",
  "cello-butterflow-ball-pen": "सेलो बटरफ्लो बॉल पेन",
  "pedigree-adult-dog-food-chicken": "पेडिग्री डॉग फूड (चिकन व सब्जियां)",

  // Grains & Pulses
  "chana-dal": "शुद्ध चना दाल (दाल तड़का)",
  "urad-dal-dhuli": "उड़द दाल धुली (सफेद)",
  "pearl-millet-bajra": "देसी बाजरा (खड़ा अनाज)",
  "sorghum-jowar": "देसी ज्वार (खड़ा अनाज)",
  "black-chickpeas-kala-chana": "काले देसी चने",
  "whole-red-lentils-sabut-masoor": "साबुत मसूर (काली मसूर)",
  "green-gram-sabut-moong": "साबुत हरा मूंग (खड़ा)",
  "black-lentils-urad-sabut": "काली दाल (उड़द साबुत)",

  // Spices
  "catch-hing-asafoetida": "कैच हींग पाउडर (कंपाउंड)",
  "green-cardamom-choti-elaichi": "हरी छोटी इलायची",
  "cinnamon-sticks-dalchini": "शुद्ध दालचीनी (खड़ी)",
  "whole-cloves-laung": "साबुत लौंग (प्रीमियम)",
  "black-pepper-kali-mirch": "काली मिर्च (साबुत गोल)",
  "fennel-seeds-saunf": "मोटी हरी सौंफ",
  "fenugreek-seeds-methi": "दाना मेथी (साबुत)",
  "dry-mango-powder-amchur": "एवरेस्ट आमचूर पाउडर",
  "bay-leaves-tej-patta": "सुगंधित तेज पत्ता",
  "pure-kashmiri-saffron-kesar": "शुद्ध कश्मीरी केसर",
  "carom-seeds-ajwain": "देसी अजवाइन (खड़ी)",
  "whole-nutmeg-jaiphal": "साबुत जायफल",
  "star-anise-chakra-phool": "चक्र फूल (स्टार ऐनीस)",

  // Oils
  "fortune-soyabean-oil": "फॉर्च्यून सोयाबीन तेल",
  "dhara-peanut-oil": "धारा शुद्ध मूंगफली तेल",
  "figaro-pure-olive-oil": "फिगारो शुद्ध जैतून तेल",
  "tilsona-sesame-oil": "तिलसोना शुद्ध तिल का तेल",
  "fortune-rice-bran-oil": "फॉर्च्यून राइस ब्रान तेल",
  "dalda-vanaspati-ghee": "डालडा शुद्ध वनस्पति घी",

  // Dairy
  "amul-masti-dahi": "अमुल मस्ती ताज़ा दही",
  "amul-fresh-malai-paneer": "अमुल फ्रेश मलाई पनीर",
  "amul-fresh-cream": "अमुल ताज़ा मलाई (क्रीम)",
  "amul-spiced-buttermilk": "अमुल मसाला छाछ",
  "nestle-everyday-milk-powder": "नेस्ले एवरीडे दूध पाउडर",
  "nestle-milkmaid-condensed-milk": "मिल्कमेड गाढ़ा मीठा दूध",
  "amul-cheese-slices": "अमुल चीज़ स्लाइस",

  // Sweets & Breakfast
  "haldiram-rasgulla-tin": "हल्दीराम रसगुल्ला टिन",
  "haldiram-gulab-jamun-tin": "हल्दीराम गुलाब जामुन टिन",
  "mtr-breakfast-poha": "एमटीआर झटपट पोहा",
  "mtr-instant-rava-upma": "एमटीआर रवा उपमा मिक्स",
  "lipton-green-tea-honey-lemon": "लिप्टन ग्रीन टी (हनी लेमन)",
  "red-bull-energy-drink": "रेड बुल एनर्जी ड्रिंक",
  "amul-kool-cafe": "अमुल कूल कैफे (मिल्क)",
  "real-tender-coconut-water": "रियल ताज़ा नारियल पानी",
  "britannia-whole-wheat-bread": "ब्रिटानिया ब्राउन ब्रेड",
  "fresh-farm-white-eggs-6pcs": "ताज़ा फार्म अंडे (6 पीस)",
  "kissan-mixed-fruit-jam": "किसान मिक्स्ड फ्रूट जैम",
  "pintola-peanut-butter-crunchy": "पिंटोला पीनट बटर (मूंगफली)",
  "kellogg-muesli-fruit-nut": "केलॉग्स म्यूसली (मेवे और बीज)",
  "nutella-hazelnut-spread": "नुटेला हेज़लनट कोको स्प्रेड",

  // Personal Care
  "dettol-original-soap": "डेटॉल ओरिजिनल साबुन",
  "head-shoulders-cool-menthol": "हेड एंड शोल्डर शैम्पू",
  "oral-b-toothbrush-shiny-clean": "ओरल-बी टूथब्रश (3 पीस)",
  "gillette-foamy-shaving-foam": "जिलेट शेविंग फोम",
  "nivea-body-lotion-deep-moisture": "निविया बॉडी लोशन",
  "fogg-scent-deodorant": "फॉग डियोड्रेंट बॉडी स्प्रे",
  "garnier-men-acno-fight-facewash": "गार्नियर मेन फेस वॉश",

  // Cleaning & Household
  "colin-glass-cleaner-spray": "कोलिन ग्लास क्लीनर स्प्रे",
  "pril-dishwash-gel-liquid": "प्रिल लिक्विड डिशवॉश",
  "trishul-white-phenyl": "त्रिशूल सफेद फिनाइल",
  "odonil-air-freshener-lavender": "ओडोनिल एयर फ्रेशनर",
  "shalimar-garbage-bags-medium": "शालीमार डस्टबिन कचरा बैग",
  "gala-king-kong-grass-broom": "गाला घास वाली झाड़ू",
  "scotch-brite-cotton-floor-mop": "स्कॉच-ब्राइट कॉटन पोछा (मॉप)",
  "plastic-water-bucket-18l": "मिल्टन मजबूत प्लास्टिक बाल्टी",

  // Cookware & Utensils
  "hawkins-pressure-cooker-3l": "हॉकिन्स 3L प्रेशर कुकर",
  "prestige-nonstick-dosa-tawa": "प्रेस्टीज नॉन-स्टिक तवा (28cm)",
  "prestige-anodised-kadhai": "प्रेस्टीज हार्ड एनोडाइज्ड कढ़ाई",
  "bajaj-mixer-grinder-500w": "बजाज 500W मिक्सर ग्राइंडर",
  "wooden-chakla-belan-set": "शीशम की लकड़ी का चकला-बेलन",
  "steel-knife-peeler-set": "किचन चाकू और छीलनी सेट",
  "steel-storage-jars-4pcs": "स्टेनलेस स्टील स्टोरेज डिब्बे",
  "steel-colander-chhalni": "स्टील छलनी (आटा और चाय)",

  // Misc
  "duracell-aa-batteries-4pcs": "ड्यूरासेल AA बैटरी (4 पीस)",
  "wipro-9w-led-bulb": "विप्रो 9W एलईडी बल्ब (सफेद)",
  "household-white-candles-12pcs": "सफेद मोमबत्तियां (12 पीस)",
  "ship-safety-matchboxes-10pk": "माचिस की डिब्बियां (10 का बंडल)",
  "fevicol-mr-glue-100g": "फेविकोल एमआर गोंद (100g)",
  "craft-kitchen-scissors": "स्टील किचन कैंची",
  "emergency-sewing-needle-kit": "सिलाई किट (सुई, धागा, बटन)",
  "chef-gas-stove-lighter": "गैस चूल्हा लाइटर (स्टील)",
};

export const PRODUCT_NAMES_BY_NAME_HI: Record<string, string> = {
  "fortune chakki fresh atta": "फॉर्च्यून चक्की फ्रेश शुद्ध आटा",
  "aashirvaad shudh chakki atta": "आशीर्वाद शुद्ध चक्की आटा",
  "rajdhani besan": "राजधानी शुद्ध बारीक बेसन",
  "bansi suji / rava": "बंसी दानेदार सूजी / रवा",
  "shakti bhog maida": "शक्ति भोग रिफाइंड मैदा",
  "india gate classic basmati rice": "इंडिया गेट क्लासिक बासमती चावल",
  "daawat rozana gold basmati": "दावत रोज़ाना गोल्ड बासमती चावल",
  "sona masoori rice (local)": "सोना मसूरी चावल (लोकल मिल)",
  "tata sampann toor dal": "टाटा सम्पन्न अनपॉलिश्ड तूर दाल (अरहर)",
  "moong dal dhuli": "मूंग दाल धुली (बिना छिलका)",
  "masoor dal": "मसूर दाल (लाल दाल)",
  "rajma chitra": "चित्रा राजमा (प्रीमियम)",
  "kabuli chana": "काबुली चना (बड़ा सफेद छोला)",
  "fortune kachi ghani mustard oil": "फॉर्च्यून कच्ची घानी शुद्ध सरसों का तेल",
  "patanjali kachi ghani sarson tel": "पतंजलि कच्ची घानी सरसों का तेल",
  "fortune sunlite refined sunflower oil": "फॉर्च्यून सनलाइट रिफाइंड तेल",
  "amul pure desi ghee": "अमुल शुद्ध गाय का देसी घी",
  "everest turmeric powder (haldi)": "एवरेस्ट शुद्ध हल्दी पाउडर",
  "mdh deggi mirch": "एमडीएच देगी मिर्च पाउडर",
  "everest garam masala": "एवरेस्ट शाही गरम मसाला",
  "catch jeera whole": "कैच खड़ा साबुत जीरा",
  "everest dhaniya powder": "एवरेस्ट धनिया पाउडर",
  "tata salt iodised": "टाटा वैक्यूम इवैपोरेटेड नमक",
  "madhur pure sugar": "मधुर शुद्ध सल्फर-फ्री चीनी",
  "organic gud (jaggery) block": "देसी गुड़ की भेली (बिना केमिकल)",
  "dabur honey": "डाबर 100% शुद्ध शहद",
  "california almonds (badam)": "कैलिफोर्निया बादाम गिरी",
  "whole cashew w320 (kaju)": "काजू साबुत (प्रीमियम W320)",
  "kishmish (raisins)": "किशमिश (मीठी दाख)",
  "tata tea premium": "टाटा टी प्रीमियम कड़क चायपत्ती",
  "red label natural care tea": "रेड लेबल नेचुरल केयर चायपत्ती",
  "nescafe classic instant coffee": "नेस्कैफे क्लासिक इंस्टेंट कॉफी",
  "parle-g original glucose biscuits": "पारले-जी ग्लूकोज बिस्कुट",
  "britannia good day cashew cookies": "ब्रिटानिया गुड डे काजू बिस्कुट",
  "sunfeast marie light": "सनफीस्ट मेरी लाइट बिस्कुट",
  "haldiram's aloo bhujia": "हल्दीराम चटपटी आलू भुजिया",
  "bikaji bikaneri bhujia": "बीकाजी बीकानेरी भुजिया नमकीन",
  "lay's india's magic masala": "लेज़ मैजिक मसाला पोटैटो चिप्स",
  "cadbury dairy milk": "कैडबरी डेयरी मिल्क चॉकलेट",
  "maggi 2-minute masala noodles": "मैगी 2-मिनट मसाला नूडल्स",
  "sunfeast yippee pasta masala": "सनफीस्ट यिप्पी पास्ता मसाला",
  "kissan fresh tomato ketchup": "किसान फ्रेश टोमैटो केचप सॉस",
  "mother's recipe mango pickle": "मदर्स रेसिपी आम का पारंपरिक अचार",
  "amul taaza toned milk": "अमुल ताज़ा टोंड दूध (टेट्रा पैक)",
  "amul butter": "अमुल मक्खन (बटर)",
  "bisleri mineral water": "बिसलेरी पैकेज्ड मिनरल वाटर",
  "coca-cola soft drink": "कोका-कोला कोल्ड ड्रिंक",
  "real mixed fruit juice": "रियल मिक्स्ड फ्रूट जूस",
  "kellogg's corn flakes": "केलॉग्स कॉर्नफ्लेक्स (नाश्ता)",
  "aashirvaad poha": "आशीर्वाद मोटा पोहा (चूड़ा)",
  "saffola oats": "सफोला 100% साबुत ओट्स",
  "johnson's baby powder": "जॉनसन बेबी पाउडर",
  "pampers baby dry pants": "पैम्पर्स बेबी ड्राई पैंट्स डायपर",
  "lifebuoy total 10 soap": "लाइफबॉय टोटल 10 साबुन",
  "dettol handwash refill": "डेटॉल हैंडवॉश रीफिल पैक",
  "parachute coconut hair oil": "पैराशूट शुद्ध नारियल तेल",
  "clinic plus strong & long shampoo": "क्लीनिक प्लस स्ट्रॉन्ग शैम्पू",
  "nivea soft light moisturiser": "निविया सॉफ्ट लाइट क्रीम",
  "colgate strong teeth toothpaste": "कोलगेट स्ट्रॉन्ग टीथ टूथपेस्ट",
  "lizol disinfectant floor cleaner": "लाइज़ोल कीटाणुनाशक फ्लोर क्लीनर",
  "harpic power plus toilet cleaner": "हार्पिक पावर प्लस टॉयलेट क्लीनर",
  "vim dishwash bar": "विम बर्तन धोने का साबुन",
  "surf excel easy wash detergent powder": "सर्फ एक्सेल इजी वॉश डिटर्जेंट",
  "rin detergent bar": "रिन डिटर्जेंट साबुन",
  "comfort fabric conditioner": "कंफर्ट फैब्रिक कंडीशनर",
  "scotch-brite scrub pad": "स्कॉच ब्राइट स्क्रब पैड",
  "homefoil aluminium foil": "होमफॉइल एल्युमिनियम फॉयल",
  "cycle pure agarbatti three-in-one": "साइकिल प्योर अगरबत्ती (3-इन-1)",
  "mangaldeep camphor (kapoor)": "मंगलदीप पूजा कपूर की टिकिया",
  "classmate notebook 172 pages": "क्लासमेट नोटबुक / कॉपी (172 पेज)",
  "cello butterflow ball pen": "सेलो बटरफ्लो बॉल पेन",
  "pedigree adult dog food chicken": "पेडिग्री डॉग फूड (चिकन व सब्जियां)",
};

export function translateVariantLabel(label: string, lang: Language): string {
  if (lang !== "hi") return label;
  return label
    .replace(/kg/gi, "किलो")
    .replace(/gm|g\b/gi, "ग्राम")
    .replace(/ltr|l\b/gi, "लीटर")
    .replace(/ml\b/gi, "मिली")
    .replace(/pack of/gi, "का पैक")
    .replace(/pcs|pieces/gi, "पीस")
    .replace(/pack/gi, "पैकेट");
}

export function formatStoreStatusText(
  status: { open: boolean; text: string },
  lang: Language,
): string {
  if (!status.text) return lang === "hi" ? "प्रतिदिन 7:00 AM - 9:00 PM" : "Daily 7:00 AM - 9:00 PM";
  if (lang !== "hi") return status.text;

  if (status.text.includes("Open today until")) {
    const time = status.text.replace("Open today until", "").trim();
    return `आज रात ${time} तक खुली है`;
  }
  if (status.text.includes("Closed • Opens at")) {
    const time = status.text.replace("Closed • Opens at", "").trim();
    return `दुकान बंद है • सुबह ${time} खुलेगी`;
  }
  if (status.text.includes("Closed today")) {
    return "आज दुकान बंद है";
  }
  return status.text;
}
