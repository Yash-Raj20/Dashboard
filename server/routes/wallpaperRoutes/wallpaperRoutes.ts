import { Router } from 'express';
import upload from '../../middleware/upload';
import { getWallpapers, addWallpaper, incrementViews, incrementLikes, incrementDownloads } from '../../controllers/wallpaperController';

const router = Router();

router.get('/', getWallpapers);
router.post('/', upload.single('image'), addWallpaper);
router.patch('/views/:id', incrementViews);
router.patch('/likes/:id', incrementLikes);
router.post("/:id/download", incrementDownloads);

export default router;
