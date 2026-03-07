import { roleRepository } from '../repositories/role.repository';
import { CreateRoleDTO, UpdateRoleDTO } from '../types/dto';
import { NotFoundError, BadRequestError } from '../errors/AppError';

class RoleService {
    async getByOrgId(orgId: string): Promise<any[]> {
        return roleRepository.findByOrgId(orgId);
    }

    async create(orgId: string, dto: CreateRoleDTO): Promise<any> {
        return roleRepository.create({ org_id: orgId, ...dto });
    }

    async update(roleId: number, orgId: string, dto: UpdateRoleDTO): Promise<any> {
        const role = await roleRepository.findById(roleId, orgId);
        if (!role) throw new NotFoundError('Role');
        if (role.is_system_role) throw new BadRequestError('Cannot modify system roles');

        await role.update(dto);
        return role;
    }

    async delete(roleId: number, orgId: string): Promise<void> {
        const role = await roleRepository.findById(roleId, orgId);
        if (!role) throw new NotFoundError('Role');
        if (role.is_system_role) throw new BadRequestError('Cannot delete system roles');

        await roleRepository.delete(roleId);
    }

    async updateAccesses(roleId: number, orgId: string, accessIds: string[]): Promise<any> {
        const role = await roleRepository.findById(roleId, orgId);
        if (!role) throw new NotFoundError('Role');
        if (role.is_system_role) throw new BadRequestError('Cannot modify system role accesses');

        await role.setAccesses(accessIds);
        return roleRepository.findById(roleId, orgId);
    }
}

export const roleService = new RoleService();
