import { Router } from 'express';
import { Asset, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { Op } from 'sequelize';

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

router.post('/', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const assetData = { ...req.body, org_id: req.user.org_id };
        if (!assetData.asset_tag) assetData.asset_tag = generateAssetTag();

        const asset: any = await Asset.create(assetData);

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'Asset',
            entity_id: asset.id,
            action: 'create',
            new_values: { name: asset.name }
        });

        res.status(201).json(asset);
    } catch (err) {
        next(err);
    }
});

router.post('/bulk', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const assetsToCreate = req.body.assets || [];
        const createdAssets = [];

        for (const assetData of assetsToCreate) {
            const data = { ...assetData, org_id: req.user.org_id };
            if (!data.asset_tag) data.asset_tag = generateAssetTag();
            const asset = await Asset.create(data);
            createdAssets.push(asset);
        }

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

router.put('/:asset_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
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

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'Asset',
            entity_id: asset.id,
            action: 'update',
            old_values: oldValues,
            new_values: req.body
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
            asset.is_active = false;
            await asset.save();
            await asset.destroy(); // trigger Sequelize soft-delete
            
            await AuditLog.create({
                org_id: req.user.org_id,
                user_id: req.user.id,
                user_email: req.user.email,
                entity_type: 'Asset',
                entity_id: asset.id,
                action: 'delete'
            });
            res.json({ message: 'Asset deactivated' });
        } else {
            await asset.destroy({ force: true });
            
            await AuditLog.create({
                org_id: req.user.org_id,
                user_id: req.user.id,
                user_email: req.user.email,
                entity_type: 'Asset',
                entity_id: asset.id,
                action: 'hard_delete'
            });
            res.json({ message: 'Asset permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ detail: 'No Asset IDs provided for bulk delete.' });
            return;
        }

        // Keep is_active syncing for soft deletes
        if (!force) {
            await Asset.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: req.user.org_id } });
        }
        const deletedCount = await Asset.destroy({
            where: {
                id: { [Op.in]: ids },
                org_id: req.user.org_id
            },
            force: force // true = hard delete, false/undefined = soft delete
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'Asset',
            entity_id: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            new_values: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Assets successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

export default router;
