import { Router } from 'express';
import ProjectGroup from '../models/ProjectGroup';

const router = Router();

// Listar todos os grupos
router.get('/', async (req, res) => {
  try {
    const groups = await ProjectGroup.find().sort({ name: 1 });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo grupo
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const group = new ProjectGroup({
      name,
      description,
      icon: icon || '📁',
      color: color || '#3B82F6'
    });

    await group.save();
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar grupo
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    const group = await ProjectGroup.findByIdAndUpdate(
      req.params.id,
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
router.delete('/:id', async (req, res) => {
  try {
    const group = await ProjectGroup.findByIdAndDelete(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
