import { Op } from 'sequelize';
import { User, Role, sequelize, Site } from '../models';

class UserRepository {
    async findByEmail(email: string): Promise<any | null> {
        return User.findOne({
            where: { email },
            include: [{ model: Role }, { model: Site, as: 'site' }]
        });
    }

    async findByEmailWithOrg(email: string): Promise<any | null> {
        const { Organization } = require('../models');
        return User.findOne({
            where: { email },
            include: [{ model: Role }, { model: Organization }, { model: Site, as: 'site' }]
        });
    }

    async findById(userId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: userId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return User.findOne({
            where,
            include: [{ model: Role }, { model: Site, as: 'site' }]
        });
    }

    async findByPk(userId: string): Promise<any | null> {
        return User.findByPk(userId, { include: [{ model: Role }, { model: Site, as: 'site' }] });
    }

    async findAndCountAll(orgId: string | null, skip: number, limit: number, paranoid: boolean, where: any): Promise<{ rows: any[]; count: number }> {
        const queryWhere = { ...where };
        if (orgId !== null) {
            queryWhere.org_id = orgId;
        }

        return User.findAndCountAll({
            where: queryWhere,
            paranoid,
            include: [{ model: Role }, { model: Site, as: 'site' }],
            offset: skip,
            limit,
            distinct: true
        });
    }

    async findAll(orgId: string, skip: number, limit: number, paranoid: boolean, where: any): Promise<any[]> {
        return User.findAll({
            where: { org_id: orgId, ...where },
            paranoid,
            include: [{ model: Role }, { model: Site, as: 'site' }],
            offset: skip,
            limit
        });
    }

    async createWithTransaction(data: Record<string, any>): Promise<any> {
        return sequelize.transaction(async (t) => {
            const roleId = data.role_id;
            delete data.role_id; // Remove before create since the column is gone

            const user = await User.create(data, { transaction: t });
            
            if (roleId) {
                await (user as any).addRole(roleId, { transaction: t });
            }

            return user;
        });
    }

    async updateLastLogin(user: any): Promise<void> {
        user.last_login = new Date();
        await user.save();
    }

    async softDeleteWithTransaction(user: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            user.is_active = false;
            await user.save({ transaction: t });
            await user.destroy({ transaction: t });
        });
    }

    async hardDelete(user: any): Promise<void> {
        await user.destroy({ force: true });
    }

    async findByIdParanoid(userId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: userId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return User.findOne({
            where,
            paranoid: false
        });
    }

    async bulkSoftDelete(ids: string[], orgId: string): Promise<void> {
        await User.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: orgId } });
    }

    async bulkDelete(ids: string[], orgId: string, force: boolean): Promise<number> {
        return User.destroy({ where: { id: { [Op.in]: ids }, org_id: orgId }, force });
    }
}

export const userRepository = new UserRepository();
