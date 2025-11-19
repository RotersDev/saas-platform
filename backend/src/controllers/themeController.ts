import { Response } from 'express';
import { Theme } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class ThemeController {
  static async get(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      let theme = await Theme.findOne({
        where: { store_id: req.store.id },
      });

      if (!theme) {
        theme = await Theme.create({
          store_id: req.store.id,
          primary_color: '#000000',
          secondary_color: '#ffffff',
          accent_color: '#007bff',
          homepage_components: {},
        });
      }

      res.json(theme);
    } catch (error: any) {
      console.error('Erro ao buscar tema:', error);
      res.status(500).json({
        error: 'Erro ao buscar tema',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      let theme = await Theme.findOne({
        where: { store_id: req.store.id },
      });

      const updateData: any = { ...req.body };

      // Processar upload de logo
      const files = (req as any).files;
      if (files) {
        if (files.logo && files.logo[0]) {
          updateData.logo_url = `/uploads/${files.logo[0].filename}`;
        }
        if (files.favicon && files.favicon[0]) {
          updateData.favicon_url = `/uploads/${files.favicon[0].filename}`;
        }
      }

      // Validar e limpar custom_js se presente
      if (updateData.custom_js !== undefined && updateData.custom_js !== null) {
        const customJs = String(updateData.custom_js).trim();

        // Validar JavaScript para evitar código minificado ou malicioso
        if (customJs) {
          // Verificar se o código está minificado (linhas muito longas, sem espaços)
          const lines = customJs.split('\n');
          const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;

          if (avgLineLength > 200 && lines.length < 5) {
            res.status(400).json({ error: 'Código JavaScript minificado não é permitido. Use código formatado e legível.' });
            return;
          }

          // Verificar padrões suspeitos
          const suspiciousPatterns = [
            /eval\s*\(/i,
            /Function\s*\(/i,
            /setTimeout\s*\(/i,
            /setInterval\s*\(/i,
            /document\.write/i,
            /innerHTML\s*=/i,
            /outerHTML\s*=/i,
            /new\s+Function/i,
            /atob\s*\(/i,
            /btoa\s*\(/i,
            /String\.fromCharCode/i,
          ];

          for (const pattern of suspiciousPatterns) {
            if (pattern.test(customJs)) {
              res.status(400).json({ error: 'Código JavaScript contém padrões não permitidos por segurança.' });
              return;
            }
          }

          // Verificar se há muito código comprimido (muitos caracteres sem espaços)
          const codeWithoutSpaces = customJs.replace(/\s/g, '');
          if (codeWithoutSpaces.length > customJs.length * 0.8) {
            res.status(400).json({ error: 'Código JavaScript parece estar minificado ou comprimido. Use código formatado.' });
            return;
          }
        }

        updateData.custom_js = customJs;
      }

      // Validar e limpar custom_css se presente
      if (updateData.custom_css !== undefined && updateData.custom_css !== null) {
        updateData.custom_css = String(updateData.custom_css).trim();
      }

      // Validar cores (devem ser hex válidos, mas permitir vazio para não atualizar)
      if (updateData.primary_color && updateData.primary_color !== '' && !/^#[0-9A-F]{6}$/i.test(updateData.primary_color)) {
        res.status(400).json({ error: 'Cor primária inválida. Use formato hexadecimal (#000000)' });
        return;
      }
      if (updateData.secondary_color && updateData.secondary_color !== '' && !/^#[0-9A-F]{6}$/i.test(updateData.secondary_color)) {
        res.status(400).json({ error: 'Cor secundária inválida. Use formato hexadecimal (#ffffff)' });
        return;
      }
      if (updateData.accent_color && updateData.accent_color !== '' && !/^#[0-9A-F]{6}$/i.test(updateData.accent_color)) {
        res.status(400).json({ error: 'Cor de destaque inválida. Use formato hexadecimal (#007bff)' });
        return;
      }

      // Remover campos undefined para evitar problemas
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      if (!theme) {
        theme = await Theme.create({
          store_id: req.store.id,
          primary_color: updateData.primary_color || '#000000',
          secondary_color: updateData.secondary_color || '#ffffff',
          accent_color: updateData.accent_color || '#007bff',
          homepage_components: {},
          ...updateData,
        });
      } else {
        await theme.update(updateData);
      }

      res.json(theme);
    } catch (error: any) {
      console.error('Erro ao atualizar tema:', error);
      res.status(400).json({ error: error.message || 'Erro ao atualizar tema' });
    }
  }
}


