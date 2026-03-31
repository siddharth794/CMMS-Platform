import { User, Role, Access, sequelize } from '../models';

async function verifyUserRole(email: string) {
    try {
        await sequelize.authenticate();
        
        const user: any = await User.findOne({ 
            where: { email },
            include: [
                { model: Role, include: [{ model: Access }] }
            ]
        });
        
        if (!user) {
            console.log(`User "${email}" not found.`);
            process.exit(1);
        }

        const userJSON = user.toJSON();
        
        console.log(`\n=== User Info ===`);
        console.log(`Email: ${userJSON.email}`);
        console.log(`Name: ${userJSON.first_name} ${userJSON.last_name}`);
        console.log(`Is Active: ${userJSON.is_active}`);
        console.log(`\n=== Assigned Roles ===`);
        
        const roles = userJSON.Roles || [];
        if (roles.length === 0) {
            console.log('NO ROLES ASSIGNED - This is the problem!');
            console.log('\nThe user needs to be assigned a role with checklist:manage permission.');
        }
        
        for (const role of roles) {
            console.log(`\nRole: ${role.name}`);
            console.log(`  Permissions:`);
            const accesses = role.Accesses || [];
            for (const access of accesses) {
                console.log(`    - ${access.name}`);
            }
            
            const hasChecklistManage = accesses.some((a: any) => a.name === 'checklist:manage');
            console.log(`  Has checklist:manage? ${hasChecklistManage ? 'YES' : 'NO'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyUserRole('bogebasuba@mailinator.com');
