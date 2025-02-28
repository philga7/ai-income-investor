export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          initial_investment_limit: number
          sell_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          initial_investment_limit?: number
          sell_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          initial_investment_limit?: number
          sell_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      holdings: {
        Row: {
          id: string
          portfolio_id: string
          symbol: string
          shares: number
          average_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          symbol: string
          shares: number
          average_cost: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          symbol?: string
          shares?: number
          average_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          portfolio_id: string
          symbol: string
          transaction_type: 'buy' | 'sell'
          shares: number
          price: number
          total_amount: number
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          symbol: string
          transaction_type: 'buy' | 'sell'
          shares: number
          price: number
          total_amount: number
          transaction_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          symbol?: string
          transaction_type?: 'buy' | 'sell'
          shares?: number
          price?: number
          total_amount?: number
          transaction_date?: string
          created_at?: string
        }
      }
      dividends: {
        Row: {
          id: string
          portfolio_id: string
          symbol: string
          amount_per_share: number
          payment_date: string
          ex_dividend_date: string
          is_special: boolean
          shares_held: number
          total_amount: number
          status: 'pending' | 'paid' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          symbol: string
          amount_per_share: number
          payment_date: string
          ex_dividend_date: string
          is_special?: boolean
          shares_held: number
          total_amount: number
          status: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          symbol?: string
          amount_per_share?: number
          payment_date?: string
          ex_dividend_date?: string
          is_special?: boolean
          shares_held?: number
          total_amount?: number
          status?: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          symbol: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}