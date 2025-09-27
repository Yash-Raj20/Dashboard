import { Schema, model, models, Document } from "mongoose";

interface IWallpaper extends Document {
  title: string;
  imageUrl: string;
  category: 
    | "abstract"
    | "amoled"
    | "animal"
    | "anime"
    | "exclusive"
    | "games"
    | "gradient"
    | "minimal"
    | "nature"
    | "shapes"
    | "shows"
    | "space"
    | "sports"
    | "stock"
    | "superheroes";
  likes: number;
  views: number;
  downloads: number;
  isFeatured: boolean;
  createdAt: Date;
}

const wallpaperSchema = new Schema<IWallpaper>({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      "abstract",
      "amoled",
      "animal",
      "anime",
      "exclusive",
      "games",
      "gradient",
      "minimal",
      "nature",
      "shapes",
      "shows",
      "space",
      "sports",
      "stock",
      "superheroes"
    ],
    required: true
  },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default models.Wallpaper || model<IWallpaper>("Wallpaper", wallpaperSchema);