import { Router } from 'express';
import upload from '../../middleware/upload';
import { getWallpapers, addWallpaper, incrementViews, incrementLikes, incrementDownloads } from '../../controllers/wallpaperController';
import { authMiddleware } from 'server/middleware/dreamWalls/auth';

const router = Router();

router.get('/', getWallpapers);
router.post('/', upload.single('image'), addWallpaper);
router.post('/:id/view', authMiddleware, incrementViews);
router.post('/:id/like', authMiddleware, incrementLikes);
router.post('/:id/download', authMiddleware, incrementDownloads);

export default router;
