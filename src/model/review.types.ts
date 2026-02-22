import { Database } from "@/database.types";

export type Review = Database['public']['Tables']['reviews']['Row'];

export type ReviewWithAuthor = Review & {
    author_name: string;
}

