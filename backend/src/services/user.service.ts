import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { auditService } from './audit.service';
import { CreateUserDTO, UpdateUserDTO, UserListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../errors/AppError';

class UserService {
    async getAll(orgId: string | null, query: UserListQuery): Promise<any> {
        const { skip = 0, limit = 100, record_status } = query;
        let where: any = {};
        let paranoid = true;

        if (record_status === 'inactive') {
            paranoid = false;
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        const result = await userRepository.findAndCountAll(orgId, Number(skip), Number(limit), paranoid, where);
        return { data: result.rows, total: result.count };
    }

    async getById(userId: string, orgId: string | null): Promise<any> {
        const user = await userRepository.findById(userId, orgId);
        if (!user) throw new NotFoundError('User');
        return user;
    }

    async create(orgId: string, dto: CreateUserDTO, audit: AuditContext, requestorRoleName: string): Promise<any> {
        const existing = await userRepository.findByEmail(dto.email);
        if (existing) throw new ConflictError('Email already registered');

        const role = await roleRepository.findById(dto.role_id, orgId);
        if (!role) throw new BadRequestError('Invalid role');

        // Org admins cannot assign super_admin or org_admin roles
        if (['org_admin', 'admin'].includes(requestorRoleName) &&
            ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
            throw new ForbiddenError('You cannot assign Super Admin or Org Admin roles');
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(dto.password, salt);

        const newUser = await userRepository.createWithTransaction({
            org_id: orgId,
            role_id: dto.role_id, // userRepository handles this now
            email: dto.email,
            username: dto.username,
            first_name: dto.first_name,
            last_name: dto.last_name,
            phone: dto.phone,
            password_hash
        });

        const createdUser = await userRepository.findByPk(newUser.id);

        auditService.log({
            ...audit,
            entityType: 'User',
            entityId: newUser.id,
            action: 'create',
            newValues: { email: dto.email }
        });

        return createdUser;
    }

    async update(userId: string, orgId: string, dto: UpdateUserDTO, audit: AuditContext, requestorRoleName: string): Promise<any> {
        const user = await userRepository.findById(userId, orgId);
        if (!user) throw new NotFoundError('User');

        if (dto.role_id) {
            const role = await roleRepository.findById(dto.role_id, orgId);
            if (role) {
                if (['org_admin', 'admin'].includes(requestorRoleName) &&
                    ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
                    throw new ForbiddenError('You cannot assign Super Admin or Org Admin roles');
                }
            }
        }

        const updateData: any = { ...dto };
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(updateData.password, salt);
            delete updateData.password;
        }

        // Handle role_id separately
        if (updateData.role_id) {
            await user.setRoles([updateData.role_id]);
            delete updateData.role_id;
        }

        await user.update(updateData);
        await user.reload();
        return user;
    }

    async delete(userId: string, orgId: string, audit: AuditContext): Promise<{ message: string }> {
        const user = await userRepository.findByIdParanoid(userId, orgId);
        if (!user) throw new NotFoundError('User');

        if (user.deleted_at === null && user.is_active !== false) {
            await userRepository.softDeleteWithTransaction(user);
            auditService.log({ ...audit, entityType: 'User', entityId: userId, action: 'delete' });
            return { message: 'User deactivated' };
        } else {
            await userRepository.hardDelete(user);
            auditService.log({ ...audit, entityType: 'User', entityId: userId, action: 'hard_delete' });
            return { message: 'User permanently deleted' };
        }
    }

    async bulkDelete(orgId: string, dto: BulkDeleteDTO, audit: AuditContext, currentUserId: string): Promise<{ message: string }> {
        const ids = dto.ids.filter(id => id !== currentUserId);
        if (ids.length === 0) throw new BadRequestError('Cannot perform bulk delete exclusively on yourself.');

        if (!dto.force) {
            await userRepository.bulkSoftDelete(ids, orgId);
        }
        const deletedCount = await userRepository.bulkDelete(ids, orgId, !!dto.force);

        auditService.log({
            ...audit,
            entityType: 'User',
            entityId: ids[0],
            action: dto.force ? 'bulk_hard_delete' : 'bulk_delete',
            newValues: { deleted_ids: ids, count: deletedCount }
        });

        return { message: `${deletedCount} Users successfully ${dto.force ? 'permanently deleted' : 'deactivated'}.` };
    }

    async updateRoles(userId: string, orgId: string, roleIds: number[], requestorRoleName: string): Promise<any> {
        const user = await userRepository.findById(userId, orgId);
        if (!user) throw new NotFoundError('User');

        await user.setRoles(roleIds);
        return userRepository.findById(userId, orgId);
    }

    async updateProfile(userId: string, orgId: string, dto: any): Promise<any> {
        const user = await userRepository.findById(userId, orgId);
        if (!user) throw new NotFoundError('User');

        await user.update({
            first_name: dto.first_name,
            last_name: dto.last_name,
            phone: dto.phone,
            username: dto.username
        });
        return user;
    }

    async updatePassword(userId: string, orgId: string, dto: any): Promise<void> {
        const user = await userRepository.findById(userId, orgId);
        if (!user) throw new NotFoundError('User');

        const isMatch = await bcrypt.compare(dto.current_password, user.password_hash);
        if (!isMatch) throw new BadRequestError('Current password is incorrect');

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(dto.new_password, salt);
        await user.save();
    }
}

export const userService = new UserService();
