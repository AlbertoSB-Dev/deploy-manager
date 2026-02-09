import { Router } from 'express';
import ProjectGroup from '../models/ProjectGroup';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Listar todos os grupos do usuário
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const groups = await ProjectGroup.find({ userId: req.user?._id }).sort({ name: 1 });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo grupo
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const group = new ProjectGroup({
      name,
      description,
      icon: icon || '📁',
      color: color || '#3B82F6',
      userId: req.user?._id // Adicionar userId
    });

    await group.save();
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar grupo
router.put('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    const group = await ProjectGroup.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { name, description, icon, color },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar grupo
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const group = await ProjectGroup.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
