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
        const { skip = 0, limit = 100, search, asset_type, status } = req.query;
        let where: any = { org_id: req.user.org_id, is_active: true };

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { asset_tag: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }
        if (asset_type) where.asset_type = asset_type;
        if (status) where.status = status;

        const assets = await Asset.findAll({
            where,
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(assets);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req: any, res, next) => {
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

router.put('/:asset_id', async (req: any, res, next) => {
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
            where: { id: req.params.asset_id, org_id: req.user.org_id }
        });
        if (!asset) {
            res.status(404).json({ detail: 'Asset not found' });
            return;
        }

        asset.is_active = false;
        await asset.save();

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'Asset',
            entity_id: asset.id,
            action: 'delete'
        });

        res.json({ message: 'Asset deactivated' });
    } catch (err) {
        next(err);
    }
});

export default router;
