-- Migration: Add Complete Grocery Catalog (Grains, Pulses, Spices, Oils, Dairy, Snacks, Beverages, Breakfast, Personal Care, Cleaning, Utensils, Misc)

-- 1. Insert new/missing categories
INSERT INTO public.categories (name, slug, icon, image_url, sort_order)
VALUES
  ('Cooking Utensils & Containers', 'utensils-cookware', '🍳', '/images/household.jpg', 25),
  ('Miscellaneous & Home Needs', 'misc-items', '📦', '/images/packaged.jpg', 26)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Subcategories
INSERT INTO public.categories (parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.so
FROM (VALUES
  ('pulses-dal', 'Millets (Bajra / Jowar)', 'pulses-dal-millets', 10),
  ('pulses-dal', 'Whole Lentils', 'pulses-dal-whole-lentils', 11),
  ('spices-masala', 'Whole Exotic Spices', 'spices-masala-exotic', 18),
  ('oil-ghee', 'Specialty Cooking Oils', 'oil-ghee-specialty', 9),
  ('dairy', 'Paneer & Cheese', 'dairy-paneer-cheese', 8),
  ('dairy', 'Yogurt & Dahi', 'dairy-yogurt-dahi', 9),
  ('beverages', 'Traditional Drinks & Lassi', 'beverages-traditional', 7),
  ('utensils-cookware', 'Pots, Pans & Cookers', 'utensils-pots-pans', 0),
  ('utensils-cookware', 'Steel & Plastic Containers', 'utensils-containers', 1),
  ('utensils-cookware', 'Kitchen Tools & Cutlery', 'utensils-kitchen-tools', 2),
  ('misc-items', 'Electrical & Batteries', 'misc-electrical', 0),
  ('misc-items', 'Pooja & Household Misc', 'misc-household', 1)
) AS v(pslug, name, slug, so)
JOIN public.categories c ON c.slug = v.pslug
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Products
INSERT INTO public.products (name, slug, brand, category_id, subcategory_id, description, image_url, tags, is_featured, is_popular)
SELECT v.name, v.slug, v.brand, c.id, sc.id, v.descr, v.img, v.tags, v.feat, v.pop
FROM (VALUES
  -- Grains & Pulses
  ('Chana Dal (Bengal Gram)', 'chana-dal', 'Local Mill', 'pulses-dal', 'Chana Dal', 'Protein-rich yellow split Bengal gram.', '/images/products/moong-dal.svg', ARRAY['chana dal','pulses','dal'], false, true),
  ('Urad Dal Dhuli (White)', 'urad-dal-dhuli', 'Local Mill', 'pulses-dal', 'Urad Dal', 'Washed white urad dal for dal makhani, idli and dosa.', '/images/products/moong-dal.svg', ARRAY['urad dal','dal'], false, true),
  ('Pearl Millet (Desi Bajra)', 'pearl-millet-bajra', 'Local Farm', 'pulses-dal', 'Millets (Bajra / Jowar)', 'Nutritious whole grain pearl millet bajra.', '/images/products/aashirvaad-atta.jpg', ARRAY['bajra','millet','grain'], false, false),
  ('Sorghum (Desi Jowar)', 'sorghum-jowar', 'Local Farm', 'pulses-dal', 'Millets (Bajra / Jowar)', 'High fiber gluten-free whole jowar grains.', '/images/products/aashirvaad-atta.jpg', ARRAY['jowar','sorghum','grain'], false, false),
  ('Black Chickpeas (Kala Chana)', 'black-chickpeas-kala-chana', 'Local Farm', 'pulses-dal', 'Black Chana', 'Organic black chickpeas kala chana.', '/images/products/kabuli-chana.svg', ARRAY['kala chana','chana','pulses'], false, true),
  ('Whole Red Lentils (Sabut Masoor)', 'whole-red-lentils-sabut-masoor', 'Local Farm', 'pulses-dal', 'Whole Lentils', 'Unpolished whole brown-red masoor lentils.', '/images/products/masoor-dal.svg', ARRAY['sabut masoor','masoor','dal'], false, false),
  ('Green Gram Whole (Sabut Moong)', 'green-gram-sabut-moong', 'Local Farm', 'pulses-dal', 'Whole Lentils', 'Whole green moong beans for sprouts and cooking.', '/images/products/moong-dal.svg', ARRAY['sabut moong','green gram','dal'], false, true),
  ('Black Lentils (Urad Sabut Kali Dal)', 'black-lentils-urad-sabut', 'Local Farm', 'pulses-dal', 'Whole Lentils', 'Whole black gram for authentic Dal Makhani.', '/images/products/rajma-chitra.svg', ARRAY['kali dal','urad sabut','dal'], false, true),

  -- Spices
  ('Catch Hing (Asafoetida)', 'catch-hing-asafoetida', 'Catch', 'spices-masala', 'Hing', 'Strong aromatic compound asafoetida powder.', '/images/products/catch-jeera.svg', ARRAY['hing','asafoetida','spice'], false, true),
  ('Green Cardamom (Choti Elaichi)', 'green-cardamom-choti-elaichi', 'Royal Spices', 'spices-masala', 'Cardamom', 'Aromatic bold green cardamom pods.', '/images/products/catch-jeera.svg', ARRAY['elaichi','cardamom','spice'], false, true),
  ('Cinnamon Sticks (Dalchini)', 'cinnamon-sticks-dalchini', 'Royal Spices', 'spices-masala', 'Cinnamon', 'Pure rolled bark cinnamon dalchini.', '/images/products/catch-jeera.svg', ARRAY['dalchini','cinnamon','spice'], false, false),
  ('Whole Cloves (Laung)', 'whole-cloves-laung', 'Royal Spices', 'spices-masala', 'Cloves', 'Aromatic spicy whole cloves laung.', '/images/products/catch-jeera.svg', ARRAY['laung','cloves','spice'], false, false),
  ('Black Pepper (Kali Mirch Whole)', 'black-pepper-kali-mirch', 'Royal Spices', 'spices-masala', 'Black Pepper', 'Whole bold black peppercorns.', '/images/products/catch-jeera.svg', ARRAY['kali mirch','black pepper','spice'], false, true),
  ('Fennel Seeds (Moti Saunf)', 'fennel-seeds-saunf', 'Royal Spices', 'spices-masala', 'Fennel', 'Sweet aromatic green fennel seeds.', '/images/products/catch-jeera.svg', ARRAY['saunf','fennel','spice'], false, false),
  ('Fenugreek Seeds (Methi Dana)', 'fenugreek-seeds-methi', 'Royal Spices', 'spices-masala', 'Methi', 'Clean bitter aromatic methi seeds.', '/images/products/catch-jeera.svg', ARRAY['methi','fenugreek','spice'], false, false),
  ('Dry Mango Powder (Amchur)', 'dry-mango-powder-amchur', 'Everest', 'spices-masala', 'Garam Masala', 'Tangy dried green mango powder.', '/images/products/everest-turmeric.jpg', ARRAY['amchur','mango powder','spice'], false, false),
  ('Bay Leaves (Tej Patta)', 'bay-leaves-tej-patta', 'Royal Spices', 'spices-masala', 'Bay Leaf', 'Aromatic dried bay leaves for biryani & curries.', '/images/products/everest-dhaniya.svg', ARRAY['tej patta','bay leaf','spice'], false, false),
  ('Pure Kashmiri Saffron (Kesar)', 'pure-kashmiri-saffron-kesar', 'Baby Brand', 'spices-masala', 'Whole Exotic Spices', '100% pure organic Mongra Kashmiri kesar.', '/images/products/everest-turmeric.jpg', ARRAY['kesar','saffron','spice'], true, false),
  ('Carom Seeds (Desi Ajwain)', 'carom-seeds-ajwain', 'Royal Spices', 'spices-masala', 'Ajwain', 'Digestive fragrant carom seeds ajwain.', '/images/products/catch-jeera.svg', ARRAY['ajwain','carom','spice'], false, true),
  ('Whole Nutmeg (Jaiphal)', 'whole-nutmeg-jaiphal', 'Royal Spices', 'spices-masala', 'Whole Exotic Spices', 'Whole aromatic nutmeg nuts jaiphal.', '/images/products/catch-jeera.svg', ARRAY['jaiphal','nutmeg','spice'], false, false),
  ('Star Anise (Chakra Phool)', 'star-anise-chakra-phool', 'Royal Spices', 'spices-masala', 'Whole Exotic Spices', 'Whole star anise for biryani & garam masala.', '/images/products/catch-jeera.svg', ARRAY['chakra phool','star anise','spice'], false, false),

  -- Cooking Oils
  ('Fortune Soyabean Oil', 'fortune-soyabean-oil', 'Fortune', 'oil-ghee', 'Soybean Oil', 'Light and healthy refined soybean cooking oil.', '/images/products/fortune-sunflower-oil.svg', ARRAY['soyabean oil','cooking oil'], false, true),
  ('Dhara Refined Peanut Oil', 'dhara-peanut-oil', 'Dhara', 'oil-ghee', 'Groundnut Oil', 'Filtered pure groundnut peanut cooking oil.', '/images/products/fortune-sunflower-oil.svg', ARRAY['peanut oil','groundnut oil'], false, false),
  ('Figaro Pure Olive Oil', 'figaro-pure-olive-oil', 'Figaro', 'oil-ghee', 'Olive Oil', 'Imported pure Spanish olive oil for cooking.', '/images/products/patanjali-mustard-oil.svg', ARRAY['olive oil','figaro'], false, false),
  ('Tilsona Pure Sesame Oil (Til Tel)', 'tilsona-sesame-oil', 'Tilsona', 'oil-ghee', 'Specialty Cooking Oils', 'Pure cold pressed sesame gingelly oil.', '/images/products/patanjali-mustard-oil.svg', ARRAY['sesame oil','til tel'], false, false),
  ('Fortune Rice Bran Health Oil', 'fortune-rice-bran-oil', 'Fortune', 'oil-ghee', 'Rice Bran Oil', 'Physically refined rice bran oil with Gamma Oryzanol.', '/images/products/fortune-sunflower-oil.svg', ARRAY['rice bran oil','cooking oil'], false, true),
  ('Dalda Vanaspati Ghee', 'dalda-vanaspati-ghee', 'Dalda', 'oil-ghee', 'Vanaspati', 'Traditional hydrogenated vegetable ghee for puris & sweets.', '/images/products/amul-desi-ghee.jpg', ARRAY['dalda','vanaspati'], false, false),

  -- Dairy Products
  ('Amul Masti Dahi (Curd)', 'amul-masti-dahi', 'Amul', 'dairy', 'Curd', 'Thick, creamy and delicious pasteurised curd.', '/images/products/amul-milk.svg', ARRAY['dahi','curd','dairy'], false, true),
  ('Amul Fresh Malai Paneer', 'amul-fresh-malai-paneer', 'Amul', 'dairy', 'Paneer', 'Soft, rich cottage cheese cubes.', '/images/products/amul-butter.svg', ARRAY['paneer','cottage cheese','dairy'], true, true),
  ('Amul Fresh Cream', 'amul-fresh-cream', 'Amul', 'dairy', 'Cream', 'Sterilised low fat dairy cooking cream.', '/images/products/amul-milk.svg', ARRAY['cream','malai','dairy'], false, false),
  ('Amul Spiced Buttermilk (Chhaachh)', 'amul-spiced-buttermilk', 'Amul', 'dairy', 'Lassi', 'Refreshing spiced buttermilk pouch.', '/images/products/amul-milk.svg', ARRAY['chhaachh','buttermilk','dairy'], false, true),
  ('Nestle Everyday Dairy Whitener Milk Powder', 'nestle-everyday-milk-powder', 'Nestle', 'dairy', 'Milk', 'Rich dairy whitener powder for thick tea.', '/images/products/amul-milk.svg', ARRAY['milk powder','dairy whitener'], false, true),
  ('Nestle Milkmaid Sweetened Condensed Milk', 'nestle-milkmaid-condensed-milk', 'Nestle', 'dairy', 'Milk', 'Sweetened condensed milk for kheer and desserts.', '/images/products/amul-desi-ghee.jpg', ARRAY['condensed milk','milkmaid'], false, true),
  ('Amul Cheese Slices', 'amul-cheese-slices', 'Amul', 'dairy', 'Cheese', 'Processed cheese slices for sandwiches and burgers.', '/images/products/amul-butter.svg', ARRAY['cheese','cheese slices'], false, true),

  -- Snacks & Sweets
  ('Haldiram Rasgulla Tin', 'haldiram-rasgulla-tin', 'Haldirams', 'chocolates', 'Chocolates', 'Spongy, syrupy traditional cottage cheese sweet.', '/images/products/amul-desi-ghee.jpg', ARRAY['rasgulla','sweets','mithai'], false, true),
  ('Haldiram Gulab Jamun Tin', 'haldiram-gulab-jamun-tin', 'Haldirams', 'chocolates', 'Chocolates', 'Soft melt-in-mouth gulab jamuns in sugar syrup.', '/images/products/amul-desi-ghee.jpg', ARRAY['gulab jamun','sweets','mithai'], false, true),
  ('MTR 3-Minute Breakfast Khatta Meetha Poha', 'mtr-breakfast-poha', 'MTR', 'packaged-foods', 'Poha', 'Instant ready to eat traditional spiced poha.', '/images/products/aashirvaad-poha.svg', ARRAY['poha','breakfast','mtr'], false, false),
  ('MTR Instant Rava Upma Mix', 'mtr-instant-rava-upma', 'MTR', 'packaged-foods', 'Ready Meals', 'Instant savoury semolina upma breakfast mix.', '/images/products/bansi-suji.svg', ARRAY['upma','rava upma','mtr'], false, false),

  -- Beverages
  ('Lipton Green Tea Honey Lemon', 'lipton-green-tea-honey-lemon', 'Lipton', 'tea-coffee', 'Green Tea', 'Pure antioxidant-rich green tea bags.', '/images/products/tata-tea-premium.svg', ARRAY['green tea','lipton'], false, true),
  ('Red Bull Energy Drink', 'red-bull-energy-drink', 'Red Bull', 'beverages', 'Energy Drinks', 'Vitalizes body and mind energy drink can.', '/images/products/coca-cola.svg', ARRAY['red bull','energy drink'], false, false),
  ('Amul Kool Cafe Flavoured Milk', 'amul-kool-cafe', 'Amul', 'beverages', 'Flavoured Milk', 'Chilled coffee flavoured milk can.', '/images/products/coca-cola.svg', ARRAY['amul kool','flavoured milk'], false, false),
  ('Real Coconut Water (100% Tender)', 'real-tender-coconut-water', 'Real', 'beverages', 'Juice', 'Natural refreshing tender coconut water.', '/images/products/real-fruit-juice.svg', ARRAY['coconut water','nariyal pani'], false, true),

  -- Breakfast
  ('Britannia 100% Whole Wheat Bread', 'britannia-whole-wheat-bread', 'Britannia', 'breakfast', 'Bread', 'Freshly baked whole wheat brown sandwich bread.', '/images/products/parle-g.jpg', ARRAY['bread','wheat bread'], false, true),
  ('Fresh Farm White Eggs (Pack of 6)', 'fresh-farm-white-eggs-6pcs', 'Poultry Fresh', 'breakfast', 'Bread', 'Freshly farm-harvested protein eggs.', '/images/products/parle-g.jpg', ARRAY['eggs','farm eggs'], false, true),
  ('Kissan Mixed Fruit Jam', 'kissan-mixed-fruit-jam', 'Kissan', 'sauces-spreads', 'Jam', 'Sweet tangy spread made with 8 real fruits.', '/images/products/mothers-pickle.svg', ARRAY['jam','fruit jam'], false, true),
  ('Pintola All Natural Peanut Butter', 'pintola-peanut-butter-crunchy', 'Pintola', 'sauces-spreads', 'Peanut Butter', 'High protein crunchy roasted peanut spread.', '/images/products/mothers-pickle.svg', ARRAY['peanut butter','pintola'], false, true),
  ('Kellogg Muesli Fruit Nut & Seeds', 'kellogg-muesli-fruit-nut', 'Kelloggs', 'packaged-foods', 'Breakfast Cereals', 'Crunchy grains with cranberries, raisins & almonds.', '/images/products/kelloggs-cornflakes.svg', ARRAY['muesli','cereal'], false, false),
  ('Nutella Hazelnut Cocoa Spread', 'nutella-hazelnut-spread', 'Ferrero', 'sauces-spreads', 'Jam', 'Creamy hazelnut and chocolate breakfast spread.', '/images/products/cadbury-dairy-milk.jpg', ARRAY['nutella','hazelnut spread'], false, true),

  -- Personal Care
  ('Dettol Original Bathing Soap', 'dettol-original-soap', 'Dettol', 'personal-care', 'Soap', 'Trusted antiseptic germ protection bathing bar.', '/images/products/lifebuoy-soap.svg', ARRAY['dettol soap','soap'], false, true),
  ('Head & Shoulders Cool Menthol Shampoo', 'head-shoulders-cool-menthol', 'Head & Shoulders', 'hair-care', 'Shampoo', 'Anti-dandruff cool menthol refreshing shampoo.', '/images/products/clinic-plus-shampoo.svg', ARRAY['shampoo','head shoulders'], false, true),
  ('Oral-B Shiny Clean Toothbrush (Medium)', 'oral-b-toothbrush-shiny-clean', 'Oral-B', 'oral-care', 'Toothbrush', 'Cross action plaque remover bristles.', '/images/products/colgate-toothpaste.svg', ARRAY['toothbrush','oral b'], false, true),
  ('Gillette Foamy Lemon Lime Shaving Foam', 'gillette-foamy-shaving-foam', 'Gillette', 'personal-care', 'Talcum Powder', 'Thick extra rich creamy lather for smooth shave.', '/images/products/johnsons-powder.svg', ARRAY['shaving foam','gillette'], false, false),
  ('Nivea Body Lotion Nourishing Deep Moisture', 'nivea-body-lotion-deep-moisture', 'Nivea', 'personal-care', 'Body Lotion', '48h intensive moisture care body lotion.', '/images/products/nivea-soft.svg', ARRAY['body lotion','nivea'], false, true),
  ('Fogg Scent Master Deodorant for Men', 'fogg-scent-deodorant', 'Fogg', 'personal-care', 'Deodorant', 'No gas long lasting body spray perfume.', '/images/products/johnsons-powder.svg', ARRAY['deodorant','fogg'], false, true),
  ('Garnier Men Acno Fight Face Wash', 'garnier-men-acno-fight-facewash', 'Garnier', 'personal-care', 'Face Wash', 'Anti-pimple charcoal clarifying face wash.', '/images/products/colgate-toothpaste.svg', ARRAY['facewash','garnier'], false, true),

  -- Cleaning & Household
  ('Colin Glass and Household Cleaner Spray', 'colin-glass-cleaner-spray', 'Colin', 'household-cleaning', 'Glass Cleaner', 'Shine booster streak-free glass cleaner spray.', '/images/products/lizol-cleaner.svg', ARRAY['colin','glass cleaner'], false, true),
  ('Pril Kraft Dishwash Gel Liquid', 'pril-dishwash-gel-liquid', 'Pril', 'household-cleaning', 'Dishwash', 'Active power drops grease remover liquid.', '/images/products/vim-bar.svg', ARRAY['dishwash liquid','pril'], false, true),
  ('Trishul White Phenyl Floor Disinfectant', 'trishul-white-phenyl', 'Trishul', 'household-cleaning', 'Phenyl', 'Pine scented white floor cleaning disinfectant.', '/images/products/lizol-cleaner.svg', ARRAY['phenyl','floor cleaner'], false, true),
  ('Odonil Room Air Freshener Lavender Block', 'odonil-air-freshener-lavender', 'Odonil', 'household-cleaning', 'Disinfectant', 'Long lasting natural fragrance block for rooms.', '/images/products/lifebuoy-soap.svg', ARRAY['air freshener','odonil'], false, true),
  ('Shalimar Premium Oxo-Biodegradable Garbage Bags', 'shalimar-garbage-bags-medium', 'Shalimar', 'kitchen-essentials', 'Garbage Bags', 'Tear resistant medium dustbin trash bags 30 pcs.', '/images/products/homefoil-foil.svg', ARRAY['garbage bags','trash bags'], false, true),
  ('Gala King Kong Grass Broom (Jhaadu)', 'gala-king-kong-grass-broom', 'Gala', 'household-cleaning', 'Floor Cleaner', 'Heavy duty fine Meghalaya grass dust broom.', '/images/products/homefoil-foil.svg', ARRAY['jhaadu','broom','gala'], false, true),
  ('Scotch-Brite Cotton Floor Mop (Pocha)', 'scotch-brite-cotton-floor-mop', 'Scotch-Brite', 'household-cleaning', 'Floor Cleaner', 'Loop end absorbent wet cotton floor cleaning mop.', '/images/products/scotch-brite.svg', ARRAY['mop','pocha'], false, true),
  ('Plastic Heavy Duty Water Bucket (Balti 18L)', 'plastic-water-bucket-18l', 'Milton', 'household-cleaning', 'Floor Cleaner', 'Sturdy plastic bathroom and utility washing bucket.', '/images/products/homefoil-foil.svg', ARRAY['bucket','balti'], false, false),

  -- Cookware & Utensils
  ('Hawkins Classic Aluminium Pressure Cooker (3L)', 'hawkins-pressure-cooker-3l', 'Hawkins', 'utensils-cookware', 'Pots, Pans & Cookers', 'Inner lid energy efficient pressure cooker.', '/images/products/homefoil-foil.svg', ARRAY['cooker','pressure cooker','hawkins'], true, true),
  ('Prestige Induction Base Non-Stick Dosa Tawa', 'prestige-nonstick-dosa-tawa', 'Prestige', 'utensils-cookware', 'Pots, Pans & Cookers', 'Durable scratch resistant flat pan for rotis & dosas.', '/images/products/homefoil-foil.svg', ARRAY['tawa','dosa tawa','prestige'], false, true),
  ('Prestige Heavy Hard Anodised Kadhai with Lid (2.5L)', 'prestige-anodised-kadhai', 'Prestige', 'utensils-cookware', 'Pots, Pans & Cookers', 'Deep frying wok kadhai for curries and vegetables.', '/images/products/homefoil-foil.svg', ARRAY['kadhai','wok','prestige'], false, true),
  ('Bajaj Classic 500W Mixer Grinder with 3 Jars', 'bajaj-mixer-grinder-500w', 'Bajaj', 'utensils-cookware', 'Kitchen Tools & Cutlery', 'Heavy duty motor for dry and wet spice grinding.', '/images/products/homefoil-foil.svg', ARRAY['mixer grinder','bajaj'], true, false),
  ('Wooden Chakla Belan Set for Rotis', 'wooden-chakla-belan-set', 'Kitchen Craft', 'utensils-cookware', 'Kitchen Tools & Cutlery', 'Heavy pure Sheesham wood rolling pin & board.', '/images/products/homefoil-foil.svg', ARRAY['chakla belan','rolling pin'], false, true),
  ('Stainless Steel Kitchen Knife & Peeler Set', 'steel-knife-peeler-set', 'Kitchen Craft', 'utensils-cookware', 'Kitchen Tools & Cutlery', 'Sharp stainless steel vegetable cutting knife & peeler.', '/images/products/homefoil-foil.svg', ARRAY['knife','peeler'], false, true),
  ('Stainless Steel Airtight Kitchen Storage Jars (Pack of 4)', 'steel-storage-jars-4pcs', 'Kitchen Craft', 'utensils-cookware', 'Steel & Plastic Containers', 'Rust-proof see-through window grocery storage containers.', '/images/products/homefoil-foil.svg', ARRAY['storage jars','dabba'], false, true),
  ('Stainless Steel Mesh Tea & Flour Colander (Chhalni)', 'steel-colander-chhalni', 'Kitchen Craft', 'utensils-cookware', 'Kitchen Tools & Cutlery', 'Fine wire mesh strainer for atta and tea.', '/images/products/homefoil-foil.svg', ARRAY['chhalni','strainer'], false, false),

  -- Miscellaneous & Home Needs
  ('Duracell Ultra AA Alkaline Batteries (Pack of 4)', 'duracell-aa-batteries-4pcs', 'Duracell', 'misc-items', 'Electrical & Batteries', 'Long lasting 100% power alkaline AA battery cells.', '/images/products/classmate-notebook.svg', ARRAY['batteries','duracell','aa'], false, true),
  ('Wipro Garnet 9W LED Bulb (Cool Day White)', 'wipro-9w-led-bulb', 'Wipro', 'misc-items', 'Electrical & Batteries', 'Energy saving high lumen B22 base LED bulb.', '/images/products/classmate-notebook.svg', ARRAY['led bulb','wipro','bulb'], false, true),
  ('Wax Safety Household Candles (Pack of 12)', 'household-white-candles-12pcs', 'Bright Home', 'misc-items', 'Pooja & Household Misc', 'Smokeless white emergency lighting candles.', '/images/products/mangaldeep-kapoor.svg', ARRAY['candles','mombatti'], false, true),
  ('Ship Safety Matchboxes (Bundle of 10 Boxes)', 'ship-safety-matchboxes-10pk', 'Ship', 'kitchen-essentials', 'Matchbox', 'Carbonized safety matchsticks for kitchen and pooja.', '/images/products/mangaldeep-kapoor.svg', ARRAY['matchbox','maachis'], false, true),
  ('Fevicol MR Squeezy Bottle Adhesive Glue (100g)', 'fevicol-mr-glue-100g', 'Fevicol', 'stationery', 'Glue', 'Non-staining synthetic craft and paper glue.', '/images/products/cello-pen.svg', ARRAY['fevicol','glue'], false, true),
  ('Multi-Purpose Kitchen & Craft Scissors', 'craft-kitchen-scissors', 'Kitchen Craft', 'misc-items', 'Pooja & Household Misc', 'Heavy duty sharp stainless steel grip scissors.', '/images/products/cello-pen.svg', ARRAY['scissors','kainchi'], false, false),
  ('Home Emergency Tailoring & Sewing Needle Kit', 'emergency-sewing-needle-kit', 'Stitch Craft', 'misc-items', 'Pooja & Household Misc', 'Assorted thread spools, needles, buttons and safety pins.', '/images/products/classmate-notebook.svg', ARRAY['sewing kit','needle'], false, false),
  ('Chef Gas Stove Spark Lighter for Kitchen', 'chef-gas-stove-lighter', 'Kitchen Craft', 'kitchen-essentials', 'Lighters', 'Durable stainless steel electronic kitchen gas lighter.', '/images/products/homefoil-foil.svg', ARRAY['gas lighter','lighter'], false, true)
) AS v(name, slug, brand, pslug, scname, descr, img, tags, feat, pop)
JOIN public.categories c ON c.slug = v.pslug
LEFT JOIN public.categories sc ON sc.slug = (c.slug || '-' || lower(regexp_replace(v.scname, '[^a-zA-Z0-9]+', '-', 'g')))
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Variants for New Products
INSERT INTO public.product_variants (product_id, label, mrp, price, stock, sku, sort_order)
SELECT p.id, v.label, v.mrp, v.price, v.stock, v.sku, v.so
FROM (VALUES
  -- Pulses & Grains
  ('chana-dal', '500 g', 50, 44, 40, 'CHANADAL-500G', 0),
  ('chana-dal', '1 kg', 95, 84, 50, 'CHANADAL-1KG', 1),
  ('urad-dal-dhuli', '500 g', 68, 59, 30, 'URADDAL-500G', 0),
  ('urad-dal-dhuli', '1 kg', 130, 116, 40, 'URADDAL-1KG', 1),
  ('pearl-millet-bajra', '1 kg', 45, 38, 50, 'BAJRA-1KG', 0),
  ('pearl-millet-bajra', '5 kg', 210, 180, 20, 'BAJRA-5KG', 1),
  ('sorghum-jowar', '1 kg', 60, 52, 40, 'JOWAR-1KG', 0),
  ('black-chickpeas-kala-chana', '500 g', 48, 42, 40, 'KALACHANA-500G', 0),
  ('black-chickpeas-kala-chana', '1 kg', 90, 79, 50, 'KALACHANA-1KG', 1),
  ('whole-red-lentils-sabut-masoor', '1 kg', 98, 86, 35, 'SABUTMASOOR-1KG', 0),
  ('green-gram-sabut-moong', '500 g', 65, 56, 35, 'SABUTMOONG-500G', 0),
  ('green-gram-sabut-moong', '1 kg', 125, 109, 40, 'SABUTMOONG-1KG', 1),
  ('black-lentils-urad-sabut', '1 kg', 135, 119, 30, 'URADSABUT-1KG', 0),

  -- Spices
  ('catch-hing-asafoetida', '50 g', 85, 78, 40, 'HING-50G', 0),
  ('green-cardamom-choti-elaichi', '50 g', 180, 160, 30, 'ELAICHI-50G', 0),
  ('green-cardamom-choti-elaichi', '100 g', 340, 299, 20, 'ELAICHI-100G', 1),
  ('cinnamon-sticks-dalchini', '100 g', 75, 65, 30, 'DALCHINI-100G', 0),
  ('whole-cloves-laung', '50 g', 60, 52, 35, 'LAUNG-50G', 0),
  ('whole-cloves-laung', '100 g', 115, 99, 25, 'LAUNG-100G', 1),
  ('black-pepper-kali-mirch', '100 g', 110, 95, 30, 'KALIMIRCH-100G', 0),
  ('fennel-seeds-saunf', '100 g', 55, 48, 40, 'SAUNF-100G', 0),
  ('fenugreek-seeds-methi', '100 g', 30, 25, 50, 'METHI-100G', 0),
  ('dry-mango-powder-amchur', '100 g', 60, 52, 40, 'AMCHUR-100G', 0),
  ('bay-leaves-tej-patta', '50 g', 35, 28, 50, 'TEJPATTA-50G', 0),
  ('pure-kashmiri-saffron-kesar', '1 g box', 240, 210, 20, 'KESAR-1G', 0),
  ('carom-seeds-ajwain', '100 g', 45, 38, 50, 'AJWAIN-100G', 0),
  ('whole-nutmeg-jaiphal', '50 g', 75, 65, 25, 'JAIPHAL-50G', 0),
  ('star-anise-chakra-phool', '50 g', 60, 52, 25, 'STARISE-50G', 0),

  -- Oils
  ('fortune-soyabean-oil', '1 L Pouch', 135, 118, 50, 'SOYAOIL-1L', 0),
  ('dhara-peanut-oil', '1 L Bottle', 185, 168, 30, 'PEANUT-1L', 0),
  ('figaro-pure-olive-oil', '500 ml', 390, 349, 15, 'FIGARO-500ML', 0),
  ('figaro-pure-olive-oil', '1 L Tin', 750, 680, 10, 'FIGARO-1L', 1),
  ('tilsona-sesame-oil', '500 ml', 140, 125, 25, 'TIL-500ML', 0),
  ('fortune-rice-bran-oil', '1 L Pouch', 140, 124, 40, 'RICEBRAN-1L', 0),
  ('dalda-vanaspati-ghee', '1 L Pouch', 115, 99, 40, 'DALDA-1L', 0),

  -- Dairy
  ('amul-masti-dahi', '200 g Cup', 25, 24, 50, 'AMULDAHI-200G', 0),
  ('amul-masti-dahi', '400 g Pouch', 35, 33, 40, 'AMULDAHI-400G', 1),
  ('amul-fresh-malai-paneer', '200 g Pack', 90, 85, 40, 'AMULPANEER-200G', 0),
  ('amul-fresh-cream', '250 ml', 70, 66, 30, 'AMULCREAM-250ML', 0),
  ('amul-spiced-buttermilk', '200 ml', 15, 14, 60, 'AMULCHHAACH-200', 0),
  ('nestle-everyday-milk-powder', '200 g', 110, 99, 30, 'NESTLEMP-200G', 0),
  ('nestle-everyday-milk-powder', '400 g', 210, 189, 20, 'NESTLEMP-400G', 1),
  ('nestle-milkmaid-condensed-milk', '380 g Tin', 145, 134, 30, 'MILKMAID-380G', 0),
  ('amul-cheese-slices', '10 Slices (200g)', 145, 135, 30, 'AMULCHEESE-200G', 0),

  -- Sweets & Breakfast
  ('haldiram-rasgulla-tin', '1 kg Tin', 240, 215, 25, 'RASGULLA-1KG', 0),
  ('haldiram-gulab-jamun-tin', '1 kg Tin', 250, 225, 25, 'GULABJAMUN-1KG', 0),
  ('mtr-breakfast-poha', '60 g Cup', 45, 40, 40, 'MTRPOHA-60G', 0),
  ('mtr-instant-rava-upma', '500 g Pack', 95, 84, 30, 'MTRUPMA-500G', 0),
  ('lipton-green-tea-honey-lemon', '25 Tea Bags', 190, 168, 30, 'LIPTONGT-25', 0),
  ('red-bull-energy-drink', '250 ml Can', 125, 115, 40, 'REDBULL-250ML', 0),
  ('amul-kool-cafe', '200 ml Can', 35, 32, 40, 'AMULCAFE-200ML', 0),
  ('real-tender-coconut-water', '200 ml Tetra', 50, 45, 50, 'COCO-200ML', 0),
  ('britannia-whole-wheat-bread', '400 g Loaf', 45, 40, 30, 'BRITBREAD-400G', 0),
  ('fresh-farm-white-eggs-6pcs', 'Pack of 6', 42, 38, 50, 'EGGS-6PCS', 0),
  ('kissan-mixed-fruit-jam', '500 g Jar', 170, 149, 30, 'KISSANJAM-500G', 0),
  ('pintola-peanut-butter-crunchy', '350 g', 175, 155, 25, 'PINTOLA-350G', 0),
  ('kellogg-muesli-fruit-nut', '500 g Pack', 340, 299, 15, 'MUESLI-500G', 0),
  ('nutella-hazelnut-spread', '350 g Jar', 390, 349, 20, 'NUTELLA-350G', 0),

  -- Personal Care
  ('dettol-original-soap', 'Pack of 4 (125g each)', 175, 152, 40, 'DETTOLSOAP-4', 0),
  ('head-shoulders-cool-menthol', '180 ml', 190, 169, 30, 'HNS-180ML', 0),
  ('oral-b-toothbrush-shiny-clean', 'Buy 2 Get 1 Free', 60, 50, 50, 'ORALB-3PK', 0),
  ('gillette-foamy-shaving-foam', '196 g Can', 160, 142, 25, 'GILLETTE-FOAM', 0),
  ('nivea-body-lotion-deep-moisture', '200 ml', 225, 195, 25, 'NIVEALOTION-200', 0),
  ('fogg-scent-deodorant', '120 ml', 250, 199, 30, 'FOGG-120ML', 0),
  ('garnier-men-acno-fight-facewash', '100 g', 199, 175, 30, 'GARNIER-100G', 0),

  -- Cleaning & Household
  ('colin-glass-cleaner-spray', '500 ml Spray', 110, 98, 40, 'COLIN-500ML', 0),
  ('pril-dishwash-gel-liquid', '425 ml Bottle', 115, 99, 40, 'PRIL-425ML', 0),
  ('trishul-white-phenyl', '1 L Bottle', 80, 68, 50, 'PHENYL-1L', 0),
  ('odonil-air-freshener-lavender', '50 g Block', 55, 48, 50, 'ODONIL-50G', 0),
  ('shalimar-garbage-bags-medium', 'Pack of 30 Bags', 95, 79, 40, 'GARBAGE-30', 0),
  ('gala-king-kong-grass-broom', '1 Pc', 150, 129, 30, 'GALA-BROOM', 0),
  ('scotch-brite-cotton-floor-mop', '1 Pc with Handle', 280, 245, 20, 'SCOTCH-MOP', 0),
  ('plastic-water-bucket-18l', '18 Litre Heavy', 180, 149, 25, 'BUCKET-18L', 0),

  -- Cookware & Utensils
  ('hawkins-pressure-cooker-3l', '3 Litre Inner Lid', 1450, 1299, 10, 'HAWKINS-3L', 0),
  ('prestige-nonstick-dosa-tawa', '28 cm Flat', 750, 599, 15, 'PRESTIGE-TAWA', 0),
  ('prestige-anodised-kadhai', '2.5 L with Glass Lid', 990, 799, 12, 'PRESTIGE-KADHAI', 0),
  ('bajaj-mixer-grinder-500w', '500W with 3 SS Jars', 2800, 2299, 8, 'BAJAJ-MIXER', 0),
  ('wooden-chakla-belan-set', 'Pure Sheesham Wood', 350, 279, 20, 'CHAKLA-BELAN', 0),
  ('steel-knife-peeler-set', 'Knife + Peeler Set', 120, 89, 40, 'KNIFE-SET', 0),
  ('steel-storage-jars-4pcs', 'Set of 4 Containers', 550, 429, 15, 'STEEL-JARS-4', 0),
  ('steel-colander-chhalni', 'Stainless Steel Mesh', 90, 69, 40, 'CHHALNI-MESH', 0),

  -- Misc
  ('duracell-aa-batteries-4pcs', 'Pack of 4', 160, 140, 40, 'DURACELL-AA4', 0),
  ('wipro-9w-led-bulb', '9W Cool White (B22)', 140, 99, 60, 'WIPRO-9W', 0),
  ('household-white-candles-12pcs', 'Pack of 12', 60, 48, 50, 'CANDLE-12', 0),
  ('ship-safety-matchboxes-10pk', 'Bundle of 10 Boxes', 20, 18, 100, 'MATCH-10PK', 0),
  ('fevicol-mr-glue-100g', '100 g Squeezy', 35, 30, 60, 'FEVICOL-100G', 0),
  ('craft-kitchen-scissors', '8-inch Stainless Steel', 120, 89, 30, 'SCISSORS-8IN', 0),
  ('emergency-sewing-needle-kit', 'Compact Travel Kit', 80, 59, 40, 'SEWING-KIT', 0),
  ('chef-gas-stove-lighter', 'Electronic Steel Lighter', 75, 55, 50, 'GAS-LIGHTER', 0)
) AS v(pslug, label, mrp, price, stock, sku, so)
JOIN public.products p ON p.slug = v.pslug
ON CONFLICT DO NOTHING;
