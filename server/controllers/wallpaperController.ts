import { Request, Response } from "express";
import Wallpaper from "../db/models/wallpaperModel/Wallpaper";
import cloudinary from "../cloudinary/cloudinary";

export const getWallpapers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = req.query.category as string;
    const query = category ? { category } : {};
    const wallpapers = await Wallpaper.find(query).sort({ createdAt: -1 });
    res.json(wallpapers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const addWallpaper = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, category } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "dreamwalls" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    const newWallpaper = new Wallpaper({
      title,
      imageUrl: uploadResult.secure_url,
      category,
      likes: 0,
      views: 0,
      isFeatured: req.body.isFeatured === "true",
    });

    await newWallpaper.save();
    res.status(201).json(newWallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const incrementViews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }
    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const incrementLikes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true },
    );
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }
    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const incrementDownloads = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true },
    );
    if (!wallpaper) {
      res.status(404).json({ message: "Wallpaper not found" });
      return;
    }
    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
