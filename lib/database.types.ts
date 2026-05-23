export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type JobStatusValue = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      jobs: {
        Row: {
          applied_date: string;
          company: string;
          created_at: string;
          id: string;
          notes: string;
          role: string;
          status: JobStatusValue;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          applied_date: string;
          company: string;
          created_at?: string;
          id?: string;
          notes?: string;
          role: string;
          status?: JobStatusValue;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          applied_date?: string;
          company?: string;
          created_at?: string;
          id?: string;
          notes?: string;
          role?: string;
          status?: JobStatusValue;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
