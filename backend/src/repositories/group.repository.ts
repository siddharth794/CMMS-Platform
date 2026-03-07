import { Group, User, Role } from '../models';

class GroupRepository {
    async findByOrgId(orgId: string): Promise<any[]> {
        return Group.findAll({ 
            where: { org_id: orgId },
            include: [{ model: User }, { model: Role }]
        });
    }

    async findById(groupId: string, orgId: string): Promise<any | null> {
        return Group.findOne({ 
            where: { id: groupId, org_id: orgId },
            include: [{ model: User }, { model: Role }]
        });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Group.create(data);
    }

    async update(id: string, data: Record<string, any>): Promise<any | null> {
        const group = await Group.findByPk(id);
        if (!group) return null;
        return group.update(data);
    }

    async delete(id: string): Promise<boolean> {
        const group = await Group.findByPk(id);
        if (!group) return false;
        await group.destroy();
        return true;
    }
}

export const groupRepository = new GroupRepository();
