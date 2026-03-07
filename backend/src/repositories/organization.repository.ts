import { Op } from 'sequelize';
import { Organization, Role, sequelize } from '../models';

class OrganizationRepository {
    async findByName(name: string): Promise<any | null> {
        return Organization.findOne({ where: { name } });
    }

    async findById(id: string): Promise<any | null> {
        return Organization.findByPk(id);
    }

    async findAll(skip: number, limit: number): Promise<any[]> {
        return Organization.findAll({ offset: skip, limit });
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
