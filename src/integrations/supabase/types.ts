export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          area: string | null;
          city: string;
          created_at: string;
          house: string | null;
          id: string;
          is_default: boolean;
          label: string | null;
          landmark: string | null;
          name: string;
          phone: string;
          pincode: string | null;
          user_id: string;
        };
        Insert: {
          area?: string | null;
          city?: string;
          created_at?: string;
          house?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          landmark?: string | null;
          name: string;
          phone: string;
          pincode?: string | null;
          user_id: string;
        };
        Update: {
          area?: string | null;
          city?: string;
          created_at?: string;
          house?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          landmark?: string | null;
          name?: string;
          phone?: string;
          pincode?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          discount_type: string;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          max_discount: number | null;
          min_order: number;
          starts_at: string | null;
          usage_limit: number | null;
          used_count: number;
          value: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_discount?: number | null;
          min_order?: number;
          starts_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          value: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_discount?: number | null;
          min_order?: number;
          starts_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          value?: number;
        };
        Relationships: [];
      };
      help_requests: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          name: string;
          order_no: string | null;
          phone: string;
          problem_type: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          name: string;
          order_no?: string | null;
          phone: string;
          problem_type: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          name?: string;
          order_no?: string | null;
          phone?: string;
          problem_type?: string;
          status?: string;
        };
        Relationships: [];
      };
      order_events: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          image_url: string | null;
          mrp: number;
          name: string;
          order_id: string;
          price: number;
          product_id: string | null;
          qty: number;
          variant_id: string | null;
          variant_label: string | null;
        };
        Insert: {
          id?: string;
          image_url?: string | null;
          mrp?: number;
          name: string;
          order_id: string;
          price: number;
          product_id?: string | null;
          qty: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Update: {
          id?: string;
          image_url?: string | null;
          mrp?: number;
          name?: string;
          order_id?: string;
          price?: number;
          product_id?: string | null;
          qty?: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: Json;
          coupon_code: string | null;
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_fee: number;
          discount: number;
          id: string;
          notes: string | null;
          order_no: string;
          order_type: string;
          payment_method: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address?: Json;
          coupon_code?: string | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_fee?: number;
          discount?: number;
          id?: string;
          notes?: string | null;
          order_no?: string;
          order_type?: string;
          payment_method?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: Json;
          coupon_code?: string | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string;
          delivery_fee?: number;
          discount?: number;
          id?: string;
          notes?: string | null;
          order_no?: string;
          order_type?: string;
          payment_method?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          barcode: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          low_stock_threshold: number;
          mrp: number;
          price: number;
          product_id: string;
          sku: string | null;
          sort_order: number;
          stock: number;
          unit: string | null;
        };
        Insert: {
          barcode?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          low_stock_threshold?: number;
          mrp: number;
          price: number;
          product_id: string;
          sku?: string | null;
          sort_order?: number;
          stock?: number;
          unit?: string | null;
        };
        Update: {
          barcode?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          low_stock_threshold?: number;
          mrp?: number;
          price?: number;
          product_id?: string;
          sku?: string | null;
          sort_order?: number;
          stock?: number;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          images: string[];
          is_active: boolean;
          is_featured: boolean;
          is_popular: boolean;
          name: string;
          slug: string;
          sold_count: number;
          subcategory_id: string | null;
          tags: string[];
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          is_popular?: boolean;
          name: string;
          slug: string;
          sold_count?: number;
          subcategory_id?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          is_popular?: boolean;
          name?: string;
          slug?: string;
          sold_count?: number;
          subcategory_id?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          address: string;
          announcement: string | null;
          business_hours: Json;
          delivery_fee: number;
          email: string;
          free_delivery_threshold: number;
          hero_subtitle: string | null;
          hero_title: string | null;
          id: number;
          maps_link: string;
          min_order_value: number;
          payment_methods: string[];
          phone: string;
          social: Json;
          store_name: string;
          tagline: string;
          updated_at: string;
          whatsapp: string;
        };
        Insert: {
          address?: string;
          announcement?: string | null;
          business_hours?: Json;
          delivery_fee?: number;
          email?: string;
          free_delivery_threshold?: number;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: number;
          maps_link?: string;
          min_order_value?: number;
          payment_methods?: string[];
          phone?: string;
          social?: Json;
          store_name?: string;
          tagline?: string;
          updated_at?: string;
          whatsapp?: string;
        };
        Update: {
          address?: string;
          announcement?: string | null;
          business_hours?: Json;
          delivery_fee?: number;
          email?: string;
          free_delivery_threshold?: number;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: number;
          maps_link?: string;
          min_order_value?: number;
          payment_methods?: string[];
          phone?: string;
          social?: Json;
          store_name?: string;
          tagline?: string;
          updated_at?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wishlist: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_customers: {
        Args: never;
        Returns: {
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          last_order: string;
          orders_count: number;
          total_spent: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      lookup_order: {
        Args: { _order_no: string; _phone: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      order_status:
        | "placed"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "rejected"
        | "returned";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: [
        "placed",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "rejected",
        "returned",
      ],
    },
  },
} as const;
