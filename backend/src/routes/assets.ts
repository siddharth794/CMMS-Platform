import { Router } from 'express';
import { Op } from 'sequelize';
import { Asset, sequelize } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAssetSchema, UpdateAssetSchema, BulkDeleteSchema } from '../validators/asset.validator';
import { auditService } from '../services/audit.service';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

function generateAssetTag() {
    return 'AST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, search, asset_type, status, record_status } = req.query;
        let where: any = { org_id: req.user.org_id };

        let paranoid = true;
        if (record_status === 'inactive') {
            paranoid = false;
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { asset_tag: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }
        if (asset_type) where.asset_type = asset_type;
        if (status) where.status = status;

        const assets = await Asset.findAndCountAll({
            where,
            paranoid,
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json({
            data: assets.rows,
            total: assets.count,
            skip: Number(skip),
            limit: Number(limit)
        });
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(MANAGER_ROLES), validate(CreateAssetSchema), async (req: any, res, next) => {
    try {
        const assetData = { ...req.body, org_id: req.user.org_id };
        if (!assetData.asset_tag) assetData.asset_tag = generateAssetTag();

        const asset: any = await Asset.create(assetData);

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'Asset',
            entityId: asset.id,
            action: 'create',
            newValues: { name: asset.name }
        });

        res.status(201).json(asset);
    } catch (err) {
        next(err);
    }
});

router.post('/bulk', requireRole(MANAGER_ROLES), async (req: any, res, next) => {
    try {
        const assetsToCreate = req.body.assets || [];
        const createdAssets = await sequelize.transaction(async (t) => {
            const results = [];
            for (const assetData of assetsToCreate) {
                const data = { ...assetData, org_id: req.user.org_id };
                if (!data.asset_tag) data.asset_tag = generateAssetTag();
                const asset = await Asset.create(data, { transaction: t });
                results.push(asset);
            }
            return results;
        });

        res.status(201).json(createdAssets);
    } catch (err) {
        next(err);
    }
});

router.get('/:asset_id', async (req: any, res, next) => {
    try {
        const asset = await Asset.findOne({
            where: { id: req.params.asset_id, org_id: req.user.org_id }
        });
        if (!asset) {
            res.status(404).json({ detail: 'Asset not found' });
            return;
        }
        res.json(asset);
    } catch (err) {
        next(err);
    }
});

router.put('/:asset_id', requireRole(MANAGER_ROLES), validate(UpdateAssetSchema), async (req: any, res, next) => {
    try {
        const asset: any = await Asset.findOne({
            where: { id: req.params.asset_id, org_id: req.user.org_id }
        });
        if (!asset) {
            res.status(404).json({ detail: 'Asset not found' });
            return;
        }

        const oldValues = { name: asset.name, status: asset.status };
        await asset.update(req.body);

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'Asset',
            entityId: asset.id,
            action: 'update',
            oldValues,
            newValues: req.body
        });

        res.json(asset);
    } catch (err) {
        next(err);
    }
});

router.delete('/:asset_id', async (req: any, res, next) => {
    try {
        const asset: any = await Asset.findOne({
            where: { id: req.params.asset_id, org_id: req.user.org_id },
            paranoid: false
        });
        if (!asset) {
            res.status(404).json({ detail: 'Asset not found' });
            return;
        }

        if (asset.deleted_at === null && asset.is_active !== false) {
            await sequelize.transaction(async (t) => {
                asset.is_active = false;
                await asset.save({ transaction: t });
                await asset.destroy({ transaction: t });
            });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'Asset',
                entityId: asset.id,
                action: 'delete'
            });
            res.json({ message: 'Asset deactivated' });
        } else {
            await asset.destroy({ force: true });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'Asset',
                entityId: asset.id,
                action: 'hard_delete'
            });
            res.json({ message: 'Asset permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;

        if (!force) {
            await Asset.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: req.user.org_id } });
        }
        const deletedCount = await Asset.destroy({
            where: {
                id: { [Op.in]: ids },
                org_id: req.user.org_id
            },
            force: force
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'Asset',
            entityId: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            newValues: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Assets successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

export default router;
