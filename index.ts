export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  tags: string[];
  category: string;
  reading_time: number;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PostClap {
  id: string;
  post_id: string;
  user_id: string;
  count: number;
  created_at: string;
}

export type PostWithAuthor = Post & { author: Profile };
export type CommentWithAuthor = Comment & { author: Profile; replies?: CommentWithAuthor[] };

export type Theme = 'light' | 'dark';

export const CATEGORIES = [
  'Technology', 'Design', 'Science', 'Business',
  'Culture', 'Health', 'Travel', 'Programming', 'General',
] as const;

export const COVER_IMAGES = [
  'https://images.pexels.com/photos/5152692/pexels-photo-5152692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/346731/pexels-photo-346731.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/330771/pexels-photo-330771.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/249798/pexels-photo-249798.png?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6177592/pexels-photo-6177592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/97987/pexels-photo-97987.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8092408/pexels-photo-8092408.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Science: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Business: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Culture: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Health: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Travel: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  Programming: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  General: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
};
