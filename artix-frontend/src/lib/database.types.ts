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
      registrations: {
        Row: {
          id: string
          registration_id: string
          full_name: string
          email: string
          phone: string
          college_name: string
          year_of_study: string
          branch: string
          roll_number: string
          selected_events: Json
          event_type: string
          total_amount: number
          payment_screenshot_url: string | null
          entry_status: string
          entry_approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          full_name: string
          email: string
          phone: string
          college_name: string
          year_of_study: string
          branch: string
          roll_number: string
          selected_events?: Json
          event_type: string
          total_amount: number
          payment_screenshot_url?: string | null
          entry_status?: string
          entry_approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          full_name?: string
          email?: string
          phone?: string
          college_name?: string
          year_of_study?: string
          branch?: string
          roll_number?: string
          selected_events?: Json
          event_type?: string
          total_amount?: number
          payment_screenshot_url?: string | null
          entry_status?: string
          entry_approved_at?: string | null
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          registration_id: string | null
          member_name: string
          member_branch: string
          member_phone: string
          is_team_leader: boolean | null
          member_order: number
          created_at: string
        }
        Insert: {
          id?: string
          registration_id?: string | null
          member_name: string
          member_branch: string
          member_phone: string
          is_team_leader?: boolean | null
          member_order: number
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string | null
          member_name?: string
          member_branch?: string
          member_phone?: string
          is_team_leader?: boolean | null
          member_order?: number
          created_at?: string
        }
      }
    }
  }
}
