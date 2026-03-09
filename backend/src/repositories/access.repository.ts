import { Op } from 'sequelize';
import { Access } from '../models';

class AccessRepository {
    async findByOrgId(orgId: string): Promise<any[]> {
        return Access.findAll({
            where: {
                [Op.or]: [
                    { org_id: orgId },
                    { is_system: true }
                ]
            }
        });
    }

    async findById(accessId: string, orgId: string): Promise<any | null> {
        return Access.findOne({
            where: {
                id: accessId,
                [Op.or]: [
                    { org_id: orgId },
                    { is_system: true }
                ]
            }
        });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Access.create(data);
    }

    async update(id: string, data: Record<string, any>): Promise<any | null> {
        const access = await Access.findByPk(id);
        if (!access) return null;
        return access.update(data);
    }

    async delete(id: string): Promise<boolean> {
        const access = await Access.findByPk(id);
        if (!access) return false;
        await access.destroy();
        return true;
    }
}

export const accessRepository = new AccessRepository();
