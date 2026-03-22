import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { workOrderService } from '../services/workOrder.service';
import { siteRepository } from '../repositories/site.repository';
import { assetRepository } from '../repositories/asset.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError';
import {
    CreateWorkOrderDTO, UpdateWorkOrderDTO, WorkOrderListQuery,
    StatusUpdateDTO, AssignDTO, CommentDTO, InventoryUsageDTO
} from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';
import { ROLES } from '../constants/roles';

// ─── Multer Setup ─────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/work-orders');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});

export const upload = multer({ storage, limits: { fileSize: 1024 * 1024, files: 3 } });

class WorkOrderController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = (roleName === ROLES.SUPER_ADMIN) 
            ? (req.query.org_id ? String(req.query.org_id) : null) 
            : req.user!.org_id;
        
        const siteIdRestriction = (roleName === ROLES.FACILITY_MANAGER) ? req.user!.site_id : undefined;
        
        const result = await workOrderService.getAll(targetOrgId, req.user!.id, roleName, req.query as unknown as WorkOrderListQuery, siteIdRestriction);
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const wo = await workOrderService.getById(req.params.wo_id as string, req.user!.org_id);
        res.json(wo);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const body = req.body as CreateWorkOrderDTO;
        const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';

        let targetOrgId = req.user!.org_id;
        let targetSiteId = body.site_id;

        if (roleName === 'super_admin') {
            if (!body.org_id) throw new BadRequestError('Super Admins must provide org_id');
            if (!body.site_id) throw new BadRequestError('Super Admins must provide site_id');
            targetOrgId = body.org_id;
            targetSiteId = body.site_id;
            
            const site = await siteRepository.findById(targetSiteId, targetOrgId);
            if (!site) throw new BadRequestError('The provided site_id does not belong to the provided org_id');
        } else if (roleName === 'org_admin') {
            if (!body.site_id) throw new BadRequestError('Org Admins must provide site_id');
            targetSiteId = body.site_id;
        } else if (roleName === 'facility_manager') {
            const assignedSiteId = req.user!.site_id;
            if (!assignedSiteId) throw new ForbiddenError('Facility Manager does not have an assigned site');
            targetSiteId = assignedSiteId;
        } else {
            if (!body.site_id) throw new BadRequestError('site_id is required');
            targetSiteId = body.site_id;
        }

        body.site_id = targetSiteId;
        body.org_id = targetOrgId;

        // Verify asset belongs to the site if provided
        if (body.asset_id) {
            const asset = await assetRepository.findById(body.asset_id, targetOrgId);
            if (!asset || asset.site_id !== targetSiteId) {
                throw new BadRequestError('The provided asset does not belong to the selected site');
            }
        }

        const wo = await workOrderService.create(targetOrgId, req.user!.id, body, this.getAuditContext(req));
        res.status(201).json(wo);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const woId = req.params.wo_id as string;
        const orgId = req.user!.org_id;
        const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
        const body = req.body as UpdateWorkOrderDTO;

        const existingWO = await workOrderService.getById(woId, orgId);
        if (!existingWO) throw new NotFoundError('Work order');

        // Enforce Read-only fields based on role
        if (roleName === 'super_admin') {
            // Super Admin: Org, Site, and Asset are read-only
            if (body.org_id && body.org_id !== existingWO.org_id) throw new BadRequestError('Organization is read-only');
            if (body.site_id && body.site_id !== existingWO.site_id) throw new BadRequestError('Site is read-only');
            if (body.asset_id && body.asset_id !== existingWO.asset_id) throw new BadRequestError('Asset is read-only');
            
            delete body.org_id;
            delete body.site_id;
            delete body.asset_id;
        } else if (roleName === 'org_admin') {
            // Org Admin: Site is read-only
            if (body.site_id && body.site_id !== existingWO.site_id) throw new BadRequestError('Site is read-only');
            
            delete (body as any).org_id; // Org is always fixed for Org Admin
            delete body.site_id;
        } else if (roleName === 'facility_manager') {
            // Facility Manager: Org and Site are fixed
            if (body.org_id && body.org_id !== existingWO.org_id) throw new BadRequestError('Organization is fixed');
            if (body.site_id && body.site_id !== existingWO.site_id) throw new BadRequestError('Site is fixed');
            
            delete (body as any).org_id;
            delete body.site_id;
        }

        // If asset_id is being updated, verify it belongs to the fixed site
        if (body.asset_id && body.asset_id !== existingWO.asset_id) {
            const asset = await assetRepository.findById(body.asset_id, existingWO.org_id);
            if (!asset || asset.site_id !== existingWO.site_id) {
                throw new BadRequestError('The provided asset does not belong to the work order\'s site');
            }
        }

        const updated = await workOrderService.update(woId, orgId, body, this.getAuditContext(req));
        res.json(updated);
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const wo = await workOrderService.updateStatus(req.params.wo_id as string, req.user!.org_id, req.body as StatusUpdateDTO, req.user!, this.getAuditContext(req));
        res.json(wo);
    }

    assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const wo = await workOrderService.assign(req.params.wo_id as string, req.user!.org_id, req.body as AssignDTO, this.getAuditContext(req));
        res.json(wo);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await workOrderService.delete(req.params.wo_id as string, req.user!.org_id, this.getAuditContext(req));
        res.json(result);
    }

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await workOrderService.restore(req.params.wo_id as string, req.user!.org_id, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await workOrderService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
        res.json(result);
    }

    // ─── Comments ─────────────────────────────────────────────────
    getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const comments = await workOrderService.getComments(req.params.wo_id as string, req.user!.org_id);
        res.json(comments);
    }

    addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const io = req.app.get('io');
        const comment = await workOrderService.addComment(req.params.wo_id as string, req.user!.org_id, req.body as CommentDTO, req.user!, io);
        res.status(201).json(comment);
    }

    // ─── Inventory Usage ──────────────────────────────────────────
    getUsedParts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const parts = await workOrderService.getUsedParts(req.params.wo_id as string);
        res.json(parts);
    }

    addInventoryUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const usage = await workOrderService.addInventoryUsage(req.params.wo_id as string, req.user!.org_id, req.body as InventoryUsageDTO);
        res.status(201).json(usage);
    }

    removeInventoryUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await workOrderService.removeInventoryUsage(req.params.wo_id as string, req.params.usage_id as string);
        res.json(result);
    }

    // ─── Attachments ──────────────────────────────────────────────
    addAttachments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
