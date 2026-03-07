import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { workOrderService } from '../services/workOrder.service';
import {
    CreateWorkOrderDTO, UpdateWorkOrderDTO, WorkOrderListQuery,
    StatusUpdateDTO, AssignDTO, CommentDTO, InventoryUsageDTO
} from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

// ─── Multer Setup ─────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/work-orders');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});

export const upload = multer({ storage, limits: { fileSize: 1024 * 1024, files: 3 } });

class WorkOrderController {
    private getAuditContext(req: Request): AuditContext {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roleName = req.user!.Role?.name?.toLowerCase() || '';
            const result = await workOrderService.getAll(req.user!.org_id, req.user!.id, roleName, req.query as unknown as WorkOrderListQuery);
            res.json(result);
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wo = await workOrderService.getById(req.params.wo_id as string, req.user!.org_id);
            res.json(wo);
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wo = await workOrderService.create(req.user!.org_id, req.user!.id, req.body as CreateWorkOrderDTO, this.getAuditContext(req));
            res.status(201).json(wo);
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wo = await workOrderService.update(req.params.wo_id as string, req.user!.org_id, req.body as UpdateWorkOrderDTO, this.getAuditContext(req));
            res.json(wo);
        } catch (err) { next(err); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wo = await workOrderService.updateStatus(req.params.wo_id as string, req.user!.org_id, req.body as StatusUpdateDTO, this.getAuditContext(req));
            res.json(wo);
        } catch (err) { next(err); }
    }

    async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const wo = await workOrderService.assign(req.params.wo_id as string, req.user!.org_id, req.body as AssignDTO, this.getAuditContext(req));
            res.json(wo);
        } catch (err) { next(err); }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await workOrderService.delete(req.params.wo_id as string, req.user!.org_id, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }

    async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await workOrderService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }

    // ─── Comments ─────────────────────────────────────────────────
    async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const comments = await workOrderService.getComments(req.params.wo_id as string, req.user!.org_id);
            res.json(comments);
        } catch (err) { next(err); }
    }

    async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const io = req.app.get('io');
            const comment = await workOrderService.addComment(req.params.wo_id as string, req.user!.org_id, req.body as CommentDTO, req.user!, io);
            res.status(201).json(comment);
        } catch (err) { next(err); }
    }

    // ─── Inventory Usage ──────────────────────────────────────────
    async getUsedParts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parts = await workOrderService.getUsedParts(req.params.wo_id as string);
            res.json(parts);
        } catch (err) { next(err); }
    }

    async addInventoryUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usage = await workOrderService.addInventoryUsage(req.params.wo_id as string, req.user!.org_id, req.body as InventoryUsageDTO);
            res.status(201).json(usage);
        } catch (err) { next(err); }
    }

    async removeInventoryUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await workOrderService.removeInventoryUsage(req.params.wo_id as string, req.params.usage_id as string);
            res.json(result);
        } catch (err) { next(err); }
    }

    // ─── Attachments ──────────────────────────────────────────────
    async addAttachments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const files = req.files as Express.Multer.File[];
            const filenames = (files || []).map(f => f.filename);
            const attachments = await workOrderService.addAttachments(req.params.wo_id as string, req.user!.org_id, filenames);
            res.status(201).json(attachments);
        } catch (err) {
            if (err instanceof multer.MulterError) {
                res.status(400).json({ detail: err.message });
            } else { next(err); }
        }
    }
}

export const workOrderController = new WorkOrderController();
