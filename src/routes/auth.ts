import { Router, Request, Response } from 'express';
import { vincentService } from '../services/vincentService';

const router = Router();

router.post('/auth-url', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'User address required' });
    }

    const authUrl = await vincentService.generateAuthUrl(userAddress);
    res.json({ authUrl, appId: process.env.VINCENT_APP_ID });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      return res.status(400).json({ error: 'JWT required' });
    }

    const isValid = await vincentService.validateDelegation(jwt);
    res.json({ valid: isValid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
