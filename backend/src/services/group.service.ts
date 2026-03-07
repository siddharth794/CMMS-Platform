import { groupRepository } from '../repositories/group.repository';
import { NotFoundError } from '../errors/AppError';

class GroupService {
    async getByOrgId(orgId: string): Promise<any[]> {
        return groupRepository.findByOrgId(orgId);
    }

    async create(orgId: string, dto: any): Promise<any> {
        return groupRepository.create({ org_id: orgId, ...dto });
    }

    async update(groupId: string, orgId: string, dto: any): Promise<any> {
        const group = await groupRepository.findById(groupId, orgId);
        if (!group) throw new NotFoundError('Group');

        return groupRepository.update(groupId, dto);
    }

    async delete(groupId: string, orgId: string): Promise<void> {
        const group = await groupRepository.findById(groupId, orgId);
        if (!group) throw new NotFoundError('Group');

        await groupRepository.delete(groupId);
    }

    async updateMembers(groupId: string, orgId: string, userIds: string[]): Promise<any> {
        const group = await groupRepository.findById(groupId, orgId);
        if (!group) throw new NotFoundError('Group');

        await group.setUsers(userIds);
        return groupRepository.findById(groupId, orgId);
    }

    async updateRoles(groupId: string, orgId: string, roleIds: number[]): Promise<any> {
        const group = await groupRepository.findById(groupId, orgId);
        if (!group) throw new NotFoundError('Group');

        await group.setRoles(roleIds);
        return groupRepository.findById(groupId, orgId);
    }
}

export const groupService = new GroupService();
