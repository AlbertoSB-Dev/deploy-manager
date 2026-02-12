import { Router } from 'express';
import Plan from '../models/Plan';

const router = Router();

// Listar planos ativos (público - sem autenticação)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ pricePerServer: 1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
