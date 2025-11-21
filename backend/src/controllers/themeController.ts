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

      // Processar upload de logo e favicon - agora usando Cloudflare R2
      const files = (req as any).files;
      console.log('[ThemeController] Content-Type:', req.headers['content-type']);
      console.log('[ThemeController] Files recebidos:', files ? Object.keys(files) : 'nenhum arquivo');
      console.log('[ThemeController] Body keys:', Object.keys(req.body || {}));

      if (files) {
        const { uploadToR2 } = await import('../services/r2Service');

        if (files.logo && files.logo[0]) {
          console.log('[ThemeController] Processando upload de logo:', {
            originalname: files.logo[0].originalname,
            mimetype: files.logo[0].mimetype,
            size: files.logo[0].size,
            hasBuffer: !!files.logo[0].buffer,
          });
          try {
            const logoUrl = await uploadToR2({
              storeId: req.store.id,
              category: 'logos',
              buffer: files.logo[0].buffer,
              mimeType: files.logo[0].mimetype,
              originalName: files.logo[0].originalname,
            });
            const { cleanR2Url } = await import('../services/r2Service');
            const cleanUrl = cleanR2Url(logoUrl);
            console.log('[ThemeController] Logo uploadado com sucesso:', cleanUrl);
            updateData.logo_url = cleanUrl;
          } catch (error: any) {
            console.error('[ThemeController] Erro ao fazer upload do logo para R2:', error);
            res.status(500).json({ error: 'Erro ao fazer upload do logo', details: error.message });
            return;
          }
        }
        if (files.favicon && files.favicon[0]) {
          console.log('[ThemeController] Processando upload de favicon:', {
            originalname: files.favicon[0].originalname,
            mimetype: files.favicon[0].mimetype,
            size: files.favicon[0].size,
            hasBuffer: !!files.favicon[0].buffer,
          });
          try {
            const faviconUrl = await uploadToR2({
              storeId: req.store.id,
              category: 'favicons',
              buffer: files.favicon[0].buffer,
              mimeType: files.favicon[0].mimetype,
              originalName: files.favicon[0].originalname,
            });
            const { cleanR2Url } = await import('../services/r2Service');
            const cleanUrl = cleanR2Url(faviconUrl);
            console.log('[ThemeController] Favicon uploadado com sucesso:', cleanUrl);
            updateData.favicon_url = cleanUrl;
          } catch (error: any) {
            console.error('[ThemeController] Erro ao fazer upload do favicon para R2:', error);
            res.status(500).json({ error: 'Erro ao fazer upload do favicon', details: error.message });
            return;
          }
        }
      } else {
        console.log('[ThemeController] Nenhum arquivo recebido. Verificando se é JSON...');
      }

      // Processar remoção de logo/favicon (quando recebe string vazia ou null)
      // Só processar se não houve upload de arquivo novo
      if (!files || !files.logo || !files.logo[0]) {
        if (req.body.logo_url === '' || req.body.logo_url === null) {
          updateData.logo_url = null;
        } else if (req.body.logo_url !== undefined && req.body.logo_url !== '') {
          // Se foi enviado uma URL (não vazia), usar ela
          updateData.logo_url = req.body.logo_url;
        } else if (theme && theme.logo_url) {
          // Se não foi especificado nada, manter a URL existente
          updateData.logo_url = theme.logo_url;
        }
      }

      if (!files || !files.favicon || !files.favicon[0]) {
        if (req.body.favicon_url === '' || req.body.favicon_url === null) {
          updateData.favicon_url = null;
        } else if (req.body.favicon_url !== undefined && req.body.favicon_url !== '') {
          // Se foi enviado uma URL (não vazia), usar ela
          updateData.favicon_url = req.body.favicon_url;
        } else if (theme && theme.favicon_url) {
          // Se não foi especificado nada, manter a URL existente
          updateData.favicon_url = theme.favicon_url;
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
        // Recarregar para garantir que temos os dados atualizados
        await theme.reload();
      }

      console.log('[ThemeController] Tema atualizado, retornando:', {
        logo_url: theme.logo_url,
        favicon_url: theme.favicon_url,
      });

      res.json(theme);
    } catch (error: any) {
      console.error('[ThemeController] Erro ao atualizar tema:', error);
      console.error('[ThemeController] Stack:', error.stack);
      console.error('[ThemeController] Error details:', {
        message: error.message,
        name: error.name,
        code: error.code,
      });
      res.status(500).json({
        error: 'Erro ao atualizar tema',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}


