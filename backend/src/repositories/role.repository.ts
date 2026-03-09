import { Op } from 'sequelize';
import { Role, Access, sequelize } from '../models';

class RoleRepository {
    async findByOrgId(orgId: string, requestorRole?: string): Promise<any[]> {
        const whereClause: any = { 
            [Op.or]: [
                { org_id: orgId },
                { is_system_role: true }
            ],
            is_active: true 
        };

        if (requestorRole && requestorRole !== 'super_admin') {
            whereClause.name = {
                [Op.notIn]: ['super_admin', 'org_admin']
            };
        }

        return Role.findAll({ 
            where: whereClause,
            include: [{ model: Access }]
        });
    }

    async findById(roleId: number, orgId: string): Promise<any | null> {
        return Role.findOne({ 
            where: { 
                id: roleId,
                [Op.or]: [
                    { org_id: orgId },
                    { is_system_role: true }
                ]
            },
            include: [{ model: Access }]
        });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Role.create(data);
    }

    async update(id: number, data: Record<string, any>): Promise<any> {
        const role = await Role.findByPk(id);
        if (!role) return null;
        return role.update(data);
    }

    async delete(id: number): Promise<boolean> {
        const role = await Role.findByPk(id);
        if (!role) return false;
        await role.destroy();
        return true;
    }

    async bulkCreateWithTransaction(orgId: string, roles: Record<string, any>[], transaction: any): Promise<void> {
        for (const roleData of roles) {
            await Role.create({ org_id: orgId, ...roleData }, { transaction });
        }
    }
}

export const roleRepository = new RoleRepository();
