import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AppUser } from '../db/models/wallpaperModel/AppUser';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const client = new OAuth2Client(CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET!;

interface GoogleAuthRequest extends Request {
  body: { idToken: string };
}

export const googleAuth = async (req: GoogleAuthRequest, res: Response): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'ID Token required' });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;
    let user = await AppUser.findOne({ googleId });

    if (!user) {
      user = new AppUser({ googleId, email, name, picture: picture || '' });
      await user.save();
    } else {
      user.picture = picture || user.picture;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id.toString(), email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user._id, email, name, picture },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out' });
};