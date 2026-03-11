import { Op } from 'sequelize';
import { Site, User, sequelize } from '../models';

class SiteRepository {
    async findAll(orgId: string, skip: number, limit: number, filters: any): Promise<{ rows: any[]; count: number }> {
        return Site.findAndCountAll({
            where: { org_id: orgId, ...filters },
            include: [
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            offset: skip,
            limit,
            order: [['created_at', 'DESC']]
        });
    }

    async findById(siteId: string, orgId: string): Promise<any | null> {
        return Site.findOne({
            where: { id: siteId, org_id: orgId },
            include: [
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: User,
                    as: 'technicians',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ]
        });
    }

    async findByName(name: string, orgId: string): Promise<any | null> {
        return Site.findOne({
            where: { name, org_id: orgId }
        });
    }

    async findByManagerId(managerId: string, orgId: string): Promise<any | null> {
        return Site.findOne({
            where: { manager_id: managerId, org_id: orgId }
        });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Site.create(data);
    }

    async update(siteId: string, data: Record<string, any>, orgId: string): Promise<[number]> {
        return Site.update(data, {
            where: { id: siteId, org_id: orgId }
        });
    }

    async delete(siteId: string, orgId: string, force: boolean = false): Promise<number> {
        return Site.destroy({
            where: { id: siteId, org_id: orgId },
            force
        });
    }

    async assignTechnician(siteId: string, userId: string, orgId: string): Promise<[number]> {
        return User.update(
            { site_id: siteId },
            { where: { id: userId, org_id: orgId } }
        );
    }

    async removeTechnician(userId: string, orgId: string): Promise<[number]> {
        return User.update(
            { site_id: null },
            { where: { id: userId, org_id: orgId } }
        );
    }
}

export const siteRepository = new SiteRepository();
