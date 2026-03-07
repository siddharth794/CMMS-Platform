import { Op } from 'sequelize';
import { Role, Organization, sequelize } from '../models';

class RoleRepository {
    async findByOrgId(orgId: string): Promise<any[]> {
        return Role.findAll({ where: { org_id: orgId, is_active: true } });
    }

    async findById(roleId: number, orgId: string): Promise<any | null> {
        return Role.findOne({ where: { id: roleId, org_id: orgId } });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Role.create(data);
    }

    async bulkCreateWithTransaction(orgId: string, roles: Record<string, any>[], transaction: any): Promise<void> {
        for (const roleData of roles) {
            await Role.create({ org_id: orgId, ...roleData }, { transaction });
        }
    }
}

export const roleRepository = new RoleRepository();
