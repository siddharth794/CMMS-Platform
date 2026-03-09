import { groupRepository } from '../repositories/group.repository';
import { roleRepository } from '../repositories/role.repository';
import { NotFoundError, ForbiddenError } from '../errors/AppError';

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

    async updateRoles(groupId: string, orgId: string, roleIds: number[], requestorRoleName: string): Promise<any> {
        const group = await groupRepository.findById(groupId, orgId);
        if (!group) throw new NotFoundError('Group');

        for (const roleId of roleIds) {
            const role = await roleRepository.findById(roleId, orgId);
            if (role) {
                if (['org_admin', 'admin'].includes(requestorRoleName) &&
                    ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
                    throw new ForbiddenError('You cannot assign Super Admin or Org Admin roles');
                }
            }
        }

        await group.setRoles(roleIds);
        return groupRepository.findById(groupId, orgId);
    }
}

export const groupService = new GroupService();
