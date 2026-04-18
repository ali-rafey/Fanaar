export type AppRole = "admin" | "moderator" | "user";

export interface CategoryRow {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
}

export interface ArticleRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_aed: number;
  price_usd: number | null;
  price_pkr: number | null;
  hero_image_url: string | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface FabricSpecRow {
  id: string;
  article_id: string;
  gsm: number;
  tear_strength: string;
  tensile_strength: string;
  dye_class: string;
  thread_count: string;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface SiteSettingRow {
  id: string;
  key: string;
  value: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogRow {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  tag: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: ArticleRow;
        Insert: Omit<ArticleRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ArticleRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      blogs: {
        Row: BlogRow;
        Insert: Omit<BlogRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BlogRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CategoryRow, "id" | "created_at">>;
        Relationships: [];
      };
      fabric_specs: {
        Row: FabricSpecRow;
        Insert: Omit<FabricSpecRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<FabricSpecRow, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "fabric_specs_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: SiteSettingRow;
        Insert: Omit<SiteSettingRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SiteSettingRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Omit<UserRoleRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserRoleRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
