import { Op } from 'sequelize';
import { Organization, Role, sequelize } from '../models';

class OrganizationRepository {
    async findByName(name: string): Promise<any | null> {
        return Organization.findOne({ where: { name } });
    }

    async findById(id: string): Promise<any | null> {
        return Organization.findByPk(id);
    }

    async findAll(skip: number, limit: number, filters: any = {}): Promise<{ rows: any[], count: number }> {
        const where: any = {};
        
        if (filters.name) {
            where.name = { [Op.like]: `%${filters.name}%` };
        }
        
        if (filters.record_status === 'active') {
            where.is_active = true;
        } else if (filters.record_status === 'inactive') {
            where.is_active = false;
        }

        return Organization.findAndCountAll({ 
            where,
            offset: skip, 
            limit,
            order: [['created_at', 'DESC']]
        });
    }

    async update(id: string, data: Record<string, any>): Promise<any | null> {
        const org = await Organization.findByPk(id);
        if (!org) return null;
        return org.update(data);
    }

    async delete(id: string, force: boolean = false): Promise<boolean> {
        const org = await Organization.findByPk(id);
        if (!org) return false;
        await org.destroy({ force });
        return true;
    }

    async createWithRoles(orgData: Record<string, any>, defaultRoles: Record<string, any>[]): Promise<any> {
        return sequelize.transaction(async (t) => {
            const org = await Organization.create(orgData, { transaction: t });
            for (const roleData of defaultRoles) {
                await Role.create({ org_id: (org as any).id, ...roleData }, { transaction: t });
            }
            return org;
        });
    }
}

export const organizationRepository = new OrganizationRepository();
