// Generated from the live `galmee` schema (Supabase generate_typescript_types).
// Regenerate after any migration; do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      sc_classes: {
        Row: {
          id: string
          tenant_id: string
          grade: string
          section: string
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          grade: string
          section?: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          grade?: string
          section?: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sc_guardians: {
        Row: {
          id: string
          tenant_id: string
          full_name: string
          phone: string
          relation: string
          telegram_chat_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          full_name: string
          phone: string
          relation?: string
          telegram_chat_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string
          phone?: string
          relation?: string
          telegram_chat_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sc_students: {
        Row: {
          id: string
          tenant_id: string
          full_name: string
          gender: string | null
          date_of_birth: string | null
          student_no: string | null
          photo_path: string | null
          guardian_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          full_name: string
          gender?: string | null
          date_of_birth?: string | null
          student_no?: string | null
          photo_path?: string | null
          guardian_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string
          gender?: string | null
          date_of_birth?: string | null
          student_no?: string | null
          photo_path?: string | null
          guardian_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      sc_enrollments: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          class_id: string
          academic_year: number
          roll_no: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          student_id: string
          class_id: string
          academic_year: number
          roll_no?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          student_id?: string
          class_id?: string
          academic_year?: number
          roll_no?: number | null
          created_at?: string
        }
        Relationships: []
      }
      sc_fee_plans: {
        Row: {
          id: string
          tenant_id: string
          name: string
          grade: string | null
          period: string
          amount: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          name: string
          grade?: string | null
          period?: string
          amount: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          grade?: string | null
          period?: string
          amount?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sc_fee_invoices: {
        Row: {
          id: string
          tenant_id: string
          enrollment_id: string
          fee_plan_id: string
          period_key: string
          description: string
          amount: number
          paid: number
          due_date: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          enrollment_id: string
          fee_plan_id: string
          period_key: string
          description: string
          amount: number
          paid?: number
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          enrollment_id?: string
          fee_plan_id?: string
          period_key?: string
          description?: string
          amount?: number
          paid?: number
          due_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sc_fee_receipts: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          payment_id: string
          receipt_no: number
          amount: number
          method: Database["public"]["Enums"]["pay_method"]
          client_ref: string | null
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          invoice_id: string
          payment_id: string
          receipt_no: number
          amount: number
          method: Database["public"]["Enums"]["pay_method"]
          client_ref?: string | null
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_id?: string
          payment_id?: string
          receipt_no?: number
          amount?: number
          method?: Database["public"]["Enums"]["pay_method"]
          client_ref?: string | null
          received_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sc_subjects: {
        Row: {
          id: string
          tenant_id: string
          name: string
          grade: string | null
          max_mark: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          name: string
          grade?: string | null
          max_mark?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          grade?: string | null
          max_mark?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      sc_grades: {
        Row: {
          id: string
          tenant_id: string
          enrollment_id: string
          subject_id: string
          term: number
          mark: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          enrollment_id: string
          subject_id: string
          term: number
          mark: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          enrollment_id?: string
          subject_id?: string
          term?: number
          mark?: number
          updated_at?: string
        }
        Relationships: []
      }
      sc_attendance: {
        Row: {
          id: string
          tenant_id: string
          enrollment_id: string
          day: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          enrollment_id: string
          day: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          enrollment_id?: string
          day?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          row_id: string | null
          table_name: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          row_id?: string | null
          table_name?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          row_id?: string | null
          table_name?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          customer_id: string | null
          ends_at: string
          id: string
          notes: string | null
          resource_id: string
          resource_type: string
          starts_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          resource_id: string
          resource_type: string
          starts_at: string
          status?: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          resource_id?: string
          resource_type?: string
          starts_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          tenant_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          note: string | null
          ref_id: string | null
          ref_table: string | null
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          note?: string | null
          ref_id?: string | null
          ref_table?: string | null
          tenant_id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          note?: string | null
          ref_id?: string | null
          ref_table?: string | null
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "credit_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          credit_limit: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          telegram_chat_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          credit_limit?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string
          credit_limit?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          active: boolean
          category: string | null
          cost: number
          created_at: string
          id: string
          name_am: string | null
          name_en: string
          name_om: string | null
          price: number
          reorder_level: number
          sku: string | null
          tenant_id: string
          tracks_expiry: boolean
          unit: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cost?: number
          created_at?: string
          id?: string
          name_am?: string | null
          name_en: string
          name_om?: string | null
          price?: number
          reorder_level?: number
          sku?: string | null
          tenant_id?: string
          tracks_expiry?: boolean
          unit?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cost?: number
          created_at?: string
          id?: string
          name_am?: string | null
          name_en?: string
          name_om?: string | null
          price?: number
          reorder_level?: number
          sku?: string | null
          tenant_id?: string
          tracks_expiry?: boolean
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          body: string
          channel: string
          created_at: string
          id: string
          sent_at: string | null
          status: string
          tenant_id: string
          to_addr: string
        }
        Insert: {
          attempts?: number
          body: string
          channel: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
          to_addr: string
        }
        Update: {
          attempts?: number
          body?: string
          channel?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
          to_addr?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          method: Database["public"]["Enums"]["pay_method"]
          ref_id: string | null
          ref_table: string | null
          reference: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["pay_method"]
          ref_id?: string | null
          ref_table?: string | null
          reference?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["pay_method"]
          ref_id?: string | null
          ref_table?: string | null
          reference?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_lines: {
        Row: {
          id: string
          item_id: string
          price: number
          qty: number
          sale_id: string
          tenant_id: string
        }
        Insert: {
          id?: string
          item_id: string
          price: number
          qty: number
          sale_id: string
          tenant_id?: string
        }
        Update: {
          id?: string
          item_id?: string
          price?: number
          qty?: number
          sale_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_stock"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "sale_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_ref: string | null
          created_at: string
          customer_id: string | null
          id: string
          method: Database["public"]["Enums"]["pay_method"] | null
          paid: number
          staff_id: string | null
          tenant_id: string
          total: number
        }
        Insert: {
          client_ref?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["pay_method"] | null
          paid?: number
          staff_id?: string | null
          tenant_id?: string
          total?: number
        }
        Update: {
          client_ref?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["pay_method"] | null
          paid?: number
          staff_id?: string | null
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_batches: {
        Row: {
          batch_no: string | null
          cost: number
          expiry_date: string | null
          id: string
          item_id: string
          qty: number
          received_at: string
          tenant_id: string
        }
        Insert: {
          batch_no?: string | null
          cost?: number
          expiry_date?: string | null
          id?: string
          item_id: string
          qty?: number
          received_at?: string
          tenant_id?: string
        }
        Update: {
          batch_no?: string | null
          cost?: number
          expiry_date?: string | null
          id?: string
          item_id?: string
          qty?: number
          received_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_stock"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "stock_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          item_id: string
          qty: number
          reason: string | null
          ref_id: string | null
          ref_table: string | null
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          qty: number
          reason?: string | null
          ref_id?: string | null
          ref_table?: string | null
          tenant_id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          qty?: number
          reason?: string | null
          ref_id?: string | null
          ref_table?: string | null
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_stock"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          monthly_fee: number | null
          paid_until: string | null
          plan: string
          setup_fee: number | null
          tenant_id: string
        }
        Insert: {
          monthly_fee?: number | null
          paid_until?: string | null
          plan?: string
          setup_fee?: number | null
          tenant_id: string
        }
        Update: {
          monthly_fee?: number | null
          paid_until?: string | null
          plan?: string
          setup_fee?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          default_lang: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          status: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          default_lang?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          status?: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Update: {
          address?: string | null
          created_at?: string
          default_lang?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: string
          vertical?: Database["public"]["Enums"]["vertical"]
        }
        Relationships: []
      }
    }
    Views: {
      sc_invoice_register: {
        Row: {
          tenant_id: string
          invoice_id: string
          period_key: string
          description: string
          amount: number
          paid: number
          remaining: number
          status: string
          due_date: string | null
          enrollment_id: string
          academic_year: number
          roll_no: number | null
          class_id: string
          grade: string
          section: string
          student_id: string
          full_name: string
          guardian_name: string | null
          guardian_phone: string | null
        }
        Relationships: []
      }
      sc_receipt_details: {
        Row: {
          tenant_id: string
          receipt_id: string
          receipt_no: number
          amount: number
          method: Database["public"]["Enums"]["pay_method"]
          created_at: string
          invoice_id: string
          period_key: string
          description: string
          invoice_amount: number
          remaining: number
          grade: string
          section: string
          full_name: string
          guardian_name: string | null
        }
        Relationships: []
      }
      sc_student_register: {
        Row: {
          tenant_id: string
          enrollment_id: string
          academic_year: number
          roll_no: number | null
          class_id: string
          grade: string
          section: string
          sort_order: number
          student_id: string
          full_name: string
          student_no: string | null
          gender: string | null
          status: string
          guardian_id: string | null
          guardian_name: string | null
          guardian_phone: string | null
          photo_path: string | null
        }
        Relationships: []
      }
      sc_unpaid_by_class: {
        Row: { tenant_id: string; class_id: string; grade: string; section: string; sort_order: number; period_key: string; students: number; unpaid_students: number; owed: number }
        Relationships: []
      }
      sc_class_term_ranks: {
        Row: { tenant_id: string; enrollment_id: string; class_id: string; academic_year: number; term: number; total: number; average: number; class_rank: number; class_size: number }
        Relationships: []
      }
      customer_balances: {
        Row: {
          balance: number | null
          credit_limit: number | null
          customer_id: string | null
          name: string | null
          oldest_debt_at: string | null
          phone: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      item_stock: {
        Row: {
          item_id: string | null
          name_am: string | null
          name_en: string | null
          name_om: string | null
          next_expiry: string | null
          qty_on_hand: number | null
          reorder_level: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      sc_add_student: {
        Args: {
          p_full_name: string
          p_gender: string | null
          p_student_no: string | null
          p_class: string
          p_year: number
          p_guardian_name: string
          p_guardian_phone: string
          p_relation?: string
        }
        Returns: string
      }
      sc_generate_invoices: {
        Args: { p_academic_year: number; p_period: string; p_period_key: string; p_due?: string }
        Returns: number
      }
      sc_set_student_photo: {
        Args: { p_student_id: string }
        Returns: string
      }
      sc_record_fee_payment: {
        Args: { p_invoice: string; p_amount: number; p_method?: Database["public"]["Enums"]["pay_method"]; p_reference?: string; p_client_ref?: string }
        Returns: Json
      }
      adjust_stock: {
        Args: { p_batch: string; p_new_qty: number; p_reason: string }
        Returns: undefined
      }
      create_tenant: {
        Args: {
          p_full_name: string
          p_lang?: string
          p_name: string
          p_phone: string
          p_vertical: Database["public"]["Enums"]["vertical"]
        }
        Returns: string
      }
      receive_stock: {
        Args: {
          p_batch?: string
          p_cost: number
          p_expiry?: string
          p_item: string
          p_qty: number
        }
        Returns: string
      }
      record_repayment: {
        Args: {
          p_amount: number
          p_customer: string
          p_method?: Database["public"]["Enums"]["pay_method"]
          p_reference?: string
        }
        Returns: string
      }
      record_sale: {
        Args: {
          p_client_ref?: string
          p_customer?: string
          p_due?: string
          p_lines: Json
          p_method?: Database["public"]["Enums"]["pay_method"]
          p_paid?: number
        }
        Returns: string
      }
    }
    Enums: {
      pay_method: "cash" | "telebirr" | "cbe_birr" | "chapa" | "bank" | "other"
      user_role: "owner" | "manager" | "staff"
      vertical:
        | "clinic"
        | "pharmacy"
        | "school"
        | "hotel"
        | "garage"
        | "wholesale"
        | "transport"
        | "coffee"
        | "driving"
        | "rentals"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      pay_method: ["cash", "telebirr", "cbe_birr", "chapa", "bank", "other"],
      user_role: ["owner", "manager", "staff"],
      vertical: [
        "clinic",
        "pharmacy",
        "school",
        "hotel",
        "garage",
        "wholesale",
        "transport",
        "coffee",
        "driving",
        "rentals",
      ],
    },
  },
} as const
