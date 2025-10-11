import { Request, Response } from "express";
import { Wallpaper } from "../db/models/wallpaperModel/Wallpaper";
import { AppUser } from "../db/models/wallpaperModel/AppUser";
import cloudinary from "../cloudinary/cloudinary";

interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export const getWallpapers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string;
    const query = category ? { category } : {};
    const wallpapers = await Wallpaper.find(query).sort({ createdAt: -1 }).limit(50);

    // Enrich with user likes if authenticated
    if (req.user?.userId) {
      const user = await AppUser.findById(req.user.userId).select('likes');
      const likedIds = user?.likes.map(id => id.toString()) || [];
      const enriched = wallpapers.map(w => ({
        ...w.toObject(),
        isLikedByUser: likedIds.includes(w._id.toString()),
      }));
      res.json(enriched);
      return;
    }

    res.json(wallpapers);
  } catch (error) {
    console.error('Get wallpapers error:', error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const addWallpaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "Image file required" });
      return;
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "dreamwalls" }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(file.buffer);
    });

    const newWallpaper = new Wallpaper({
      title,
      imageUrl: uploadResult.secure_url,
      category,
      likes: 0,
      views: 0,
      downloads: 0,
      isFeatured: req.body.isFeatured === "true",
    });

    await newWallpaper.save();
    res.status(201).json(newWallpaper);
  } catch (error) {
    console.error('Add wallpaper error:', error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const incrementViews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const wallpaper = await Wallpaper.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }
    res.json(wallpaper);
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const incrementLikes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const wallpaper = await Wallpaper.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }

    await AppUser.findByIdAndUpdate(userId, { $addToSet: { likes: id } }, { new: true });
    res.json({ ...wallpaper.toObject(), likes: wallpaper.likes + 1 });
  } catch (error) {
    console.error('Increment likes error:', error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const incrementDownloads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const wallpaper = await Wallpaper.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }

    await AppUser.findByIdAndUpdate(userId, { $addToSet: { downloads: id } }, { new: true });
    res.json({ ...wallpaper.toObject(), downloads: wallpaper.downloads + 1 });
  } catch (error) {
    console.error('Increment downloads error:', error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};