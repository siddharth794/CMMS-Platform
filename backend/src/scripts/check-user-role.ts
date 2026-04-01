import { User, Role, Access, sequelize } from '../models';

async function checkUserRole(email: string) {
    try {
        await sequelize.authenticate();
        
        const user: any = await User.findOne({ 
            where: { email },
            include: [
                { model: Role, as: 'roles' }
            ]
        });
        
        if (!user) {
            console.log(`User "${email}" not found.`);
            process.exit(1);
        }

        console.log(`\nUser: ${user.email}`);
        console.log(`Name: ${user.first_name} ${user.last_name}`);
        console.log(`Is Active: ${user.is_active}`);
        console.log(`\nRoles:`);
        
        const roles = user.roles || [];
        for (const role of roles) {
            console.log(`  - ${role.name} (ID: ${role.id})`);
            
            // Get accesses for this role
            const accesses = await (role as any).getAccesses();
            console.log(`    Permissions: ${accesses.map((a: any) => a.name).join(', ')}`);
        }

        // Also check effective accesses
        console.log(`\nEffective Permissions (from user.effectiveAccesses):`);
        if (user.effectiveAccesses) {
            console.log(`  ${user.effectiveAccesses.map((a: any) => a.name).join(', ')}`);
        } else {
            console.log('  Not loaded - need to refresh user session');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Check the user mentioned by the user
checkUserRole('bogebasuba@mailinator.com');
