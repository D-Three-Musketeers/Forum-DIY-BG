
  export const DIYCategories = [
  "Woodworking",
  "Home Decor",
  "Gardening",
  "Upcycling",
  "Electronics",
  "Crafts",
  "Painting",
  "Plumbing",
  "Metalworking",
  "Sewing",
  "Cars",
  "Motorcycles",
  "Plumbing",
  "Welding",
  "General construction",
] as const;

// Then you can derive the type from the array if you prefer
export type DIYCategory = typeof DIYCategories[number];

export type Post = {
  id: string;
  title: string;
  content: any;
  userUID: string;
  userHandle: string;
  timestamp: string;
  category: DIYCategory; // Use the enum as type
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  comments: Record<string, any>;
};




