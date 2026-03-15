import { Op } from 'sequelize';
import { Site, User, sequelize, Organization } from '../models';

class SiteRepository {
    async findAll(orgId: string | null, skip: number, limit: number, filters: any, paranoid: boolean = true): Promise<{ rows: any[]; count: number }> {
        const where: any = { ...filters };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.findAndCountAll({
            where,
            paranoid,
            include: [
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Organization,
                    attributes: ['id', 'name']
                }
            ],
            offset: skip,
            limit,
            order: [['created_at', 'DESC']]
        });
    }

    async findById(siteId: string, orgId: string | null, paranoid: boolean = true): Promise<any | null> {
        const where: any = { id: siteId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.findOne({
            where,
            paranoid,
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
                },
                {
                    model: Organization,
                    attributes: ['id', 'name']
                }
            ]
        });
    }

    async findByName(name: string, orgId: string | null): Promise<any | null> {
        const where: any = { name };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.findOne({ where });
    }

    async findByManagerId(managerId: string, orgId: string | null): Promise<any | null> {
        const where: any = { manager_id: managerId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.findOne({ where });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Site.create(data);
    }

    async update(siteId: string, data: Record<string, any>, orgId: string | null): Promise<[number]> {
        const where: any = { id: siteId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.update(data, { where });
    }

    async delete(siteId: string, orgId: string | null, force: boolean = false): Promise<number> {
        const where: any = { id: siteId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Site.destroy({ where, force });
    }

    async assignTechnician(siteId: string, userId: string, orgId: string | null): Promise<[number]> {
        const where: any = { id: userId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return User.update({ site_id: siteId }, { where });
    }

    async removeTechnician(userId: string, orgId: string | null): Promise<[number]> {
        const where: any = { id: userId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return User.update({ site_id: null }, { where });
    }
}

export const siteRepository = new SiteRepository();
