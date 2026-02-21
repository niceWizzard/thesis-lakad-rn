import { Database } from "@/database.types";

export type Review = Database['public']['Tables']['landmark_reviews']['Row'];

export interface ReviewWithAuthor extends Review {
    author_name: string;
}
