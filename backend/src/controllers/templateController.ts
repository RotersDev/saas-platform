import { Response } from 'express';
import { Template } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { Op } from 'sequelize';

export class TemplateController {
  // Listar todos os templates da loja
  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const templates = await Template.findAll({
        where: { store_id: req.store.id },
        order: [['created_at', 'DESC']],
      });

      res.json(templates);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao listar templates:', error);
      res.status(500).json({ error: 'Erro ao listar templates' });
    }
  }

  // Criar novo template
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { name, custom_css, custom_js } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Nome do template é obrigatório' });
        return;
      }

      // Verificar se já existe template com mesmo nome
      const existingTemplate = await Template.findOne({
        where: {
          store_id: req.store.id,
          name: name.trim(),
        },
      });

      if (existingTemplate) {
        res.status(400).json({ error: 'Já existe um template com este nome' });
        return;
      }

      // Buscar template padrão para copiar CSS/JS atualizado
      const defaultTemplate = await Template.findOne({
        where: {
          store_id: req.store.id,
          is_default: true,
        },
      });

      // Criar template copiando CSS/JS do template padrão (sempre atualizado)
      const template = await Template.create({
        store_id: req.store.id,
        name: name.trim(),
        is_default: false,
        is_active: false,
        custom_css: custom_css !== undefined ? custom_css : (defaultTemplate?.custom_css || ''),
        custom_js: custom_js !== undefined ? custom_js : (defaultTemplate?.custom_js || ''),
      });

      res.status(201).json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao criar template:', error);
      res.status(500).json({ error: 'Erro ao criar template' });
    }
  }

  // Criar template padrão (baseado no template padrão do sistema)
  static async createDefault(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      // Verificar se já existe template padrão
      const existingDefault = await Template.findOne({
        where: {
          store_id: req.store.id,
          is_default: true,
        },
      });

      if (existingDefault) {
        // Se já existe, atualizar para sempre estar vazio (padrão do sistema)
        await existingDefault.update({
          custom_css: '',
          custom_js: '',
        });
        res.json(existingDefault);
        return;
      }

      // Criar template padrão com nome da empresa (sempre vazio, padrão do sistema)
      const template = await Template.create({
        store_id: req.store.id,
        name: 'Nerix - Template Padrão',
        is_default: true,
        is_active: false,
        custom_css: '',
        custom_js: '',
      });

      res.status(201).json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao criar template padrão:', error);
      res.status(500).json({ error: 'Erro ao criar template padrão' });
    }
  }

  // Atualizar template
  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;
      const { name, custom_css, custom_js } = req.body;

      const template = await Template.findOne({
        where: {
          id: parseInt(id),
          store_id: req.store.id,
        },
      });

      if (!template) {
        res.status(404).json({ error: 'Template não encontrado' });
        return;
      }

      // Não permitir editar template padrão
      if (template.is_default) {
        res.status(400).json({ error: 'O template padrão não pode ser editado' });
        return;
      }

      // Se está mudando o nome, verificar se não existe outro com mesmo nome
      if (name && name.trim() !== template.name) {
        const existingTemplate = await Template.findOne({
          where: {
            store_id: req.store.id,
            name: name.trim(),
            id: { [Op.ne]: template.id },
          },
        });

        if (existingTemplate) {
          res.status(400).json({ error: 'Já existe um template com este nome' });
          return;
        }
      }

      // Atualizar template
      // Garantir que strings vazias sejam salvas como strings vazias, não null
      const updateData: any = {};
      if (name && name.trim() !== template.name) {
        updateData.name = name.trim();
      }
      if (custom_css !== undefined) {
        updateData.custom_css = custom_css || '';
      }
      if (custom_js !== undefined) {
        updateData.custom_js = custom_js || '';
      }

      await template.update(updateData);

      // Recarregar para garantir que temos os dados atualizados
      await template.reload();

      res.json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao atualizar template:', error);
      res.status(500).json({ error: 'Erro ao atualizar template' });
    }
  }

  // Ativar template (desativa todos os outros e ativa este)
  static async activate(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const template = await Template.findOne({
        where: {
          id: parseInt(id),
          store_id: req.store.id,
        },
      });

      if (!template) {
        res.status(404).json({ error: 'Template não encontrado' });
        return;
      }

      // Desativar todos os templates da loja
      await Template.update(
        { is_active: false },
        { where: { store_id: req.store.id } }
      );

      // Ativar este template
      await template.update({ is_active: true });

      res.json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao ativar template:', error);
      res.status(500).json({ error: 'Erro ao ativar template' });
    }
  }

  // Deletar template
  static async delete(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const template = await Template.findOne({
        where: {
          id: parseInt(id),
          store_id: req.store.id,
        },
      });

      if (!template) {
        res.status(404).json({ error: 'Template não encontrado' });
        return;
      }

      // Não permitir deletar template padrão
      if (template.is_default) {
        res.status(400).json({ error: 'Não é possível deletar o template padrão' });
        return;
      }

      // Se o template está ativo, desativar antes de deletar
      if (template.is_active) {
        // Ativar o template padrão se existir
        const defaultTemplate = await Template.findOne({
          where: {
            store_id: req.store.id,
            is_default: true,
          },
        });

        if (defaultTemplate) {
          await defaultTemplate.update({ is_active: true });
        } else {
          // Se não há template padrão, desativar todos
          await Template.update(
            { is_active: false },
            { where: { store_id: req.store.id } }
          );
        }
      }

      await template.destroy();

      res.json({ message: 'Template deletado com sucesso' });
    } catch (error: any) {
      console.error('[TemplateController] Erro ao deletar template:', error);
      res.status(500).json({ error: 'Erro ao deletar template' });
    }
  }

  // Buscar template específico
  static async get(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const template = await Template.findOne({
        where: {
          id: parseInt(id),
          store_id: req.store.id,
        },
      });

      if (!template) {
        res.status(404).json({ error: 'Template não encontrado' });
        return;
      }

      res.json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao buscar template:', error);
      res.status(500).json({ error: 'Erro ao buscar template' });
    }
  }

  // Buscar template ativo da loja
  static async getActive(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const template = await Template.findOne({
        where: {
          store_id: req.store.id,
          is_active: true,
        },
      });

      // Se não há template ativo, retornar template padrão ou vazio
      if (!template) {
        const defaultTemplate = await Template.findOne({
          where: {
            store_id: req.store.id,
            is_default: true,
          },
        });

        if (defaultTemplate) {
          res.json(defaultTemplate);
        } else {
          // Retornar template vazio (sem CSS/JS)
          res.json({
            id: null,
            store_id: req.store.id,
            name: 'Template Padrão',
            is_default: true,
            is_active: true,
            custom_css: '',
            custom_js: '',
          });
        }
        return;
      }

      res.json(template);
    } catch (error: any) {
      console.error('[TemplateController] Erro ao buscar template ativo:', error);
      res.status(500).json({ error: 'Erro ao buscar template ativo' });
    }
  }
}

