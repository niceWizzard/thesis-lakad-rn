import { Database } from "@/database.types";

export type Review = Database['public']['Tables']['landmark_reviews']['Row'];

export type ReviewWithAuthor = Review & {
    author_name: string;
}

