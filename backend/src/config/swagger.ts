import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CMMS Platform API',
            version: '1.0.0',
            description: 'Comprehensive Computerized Maintenance Management System (CMMS) API',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:{port}/api',
                description: 'Local development server',
                variables: {
                    port: {
                        default: '8000',
                    },
                },
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        detail: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                    required: ['detail'],
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        detail: {
                            type: 'string',
                            example: 'Validation failed',
                        },
                        errors: {
                            type: 'object',
                            additionalProperties: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            example: {
                                email: ['Invalid email format'],
                                password: ['Password is required'],
                            },
                        },
                    },
                    required: ['detail', 'errors'],
                },
                PaginationParams: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            minimum: 1,
                            default: 1,
                            description: 'Page number',
                        },
                        limit: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 100,
                            default: 20,
                            description: 'Items per page',
                        },
                        search: {
                            type: 'string',
                            description: 'Search term',
                        },
                        sort_by: {
                            type: 'string',
                            description: 'Field to sort by',
                        },
                        sort_order: {
                            type: 'string',
                            enum: ['asc', 'desc'],
                            default: 'desc',
                            description: 'Sort direction',
                        },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalPages: { type: 'integer' },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {},
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        is_active: { type: 'boolean' },
                        org_id: { type: 'string', format: 'uuid', nullable: true },
                        site_id: { type: 'string', format: 'uuid', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            minLength: 1,
                            description: 'User password',
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'JWT authentication token',
                        },
                        user: {
                            $ref: '#/components/schemas/UserResponse',
                        },
                    },
                },
                WorkOrderPriority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'Work order priority level',
                },
                WorkOrderStatus: {
                    type: 'string',
                    enum: ['new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled'],
                    description: 'Work order status',
                },
                AssetStatus: {
                    type: 'string',
                    enum: ['operational', 'under_repair', 'out_of_service', 'decommissioned'],
                    description: 'Asset status',
                },
                RoleName: {
                    type: 'string',
                    enum: ['super_admin', 'org_admin', 'facility_manager', 'technician', 'requestor'],
                    description: 'User role',
                },
                Permission: {
                    type: 'string',
                    enum: [
                        'users:read', 'users:write', 'users:delete',
                        'assets:read', 'assets:write', 'assets:delete',
                        'work_orders:read', 'work_orders:write', 'work_orders:delete', 'work_orders:assign',
                        'inventory:read', 'inventory:write', 'inventory:delete',
                        'pm_schedules:read', 'pm_schedules:write', 'pm_schedules:delete',
                        'analytics:read', 'organizations:read', 'organizations:write', 'organizations:delete',
                        'sites:read', 'sites:write', 'sites:delete',
                        'roles:read', 'roles:write', 'roles:delete',
                        'groups:read', 'groups:write', 'groups:delete',
                        'accesses:read', 'accesses:write', 'accesses:delete',
                    ],
                    description: 'Permission name',
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Authentication required or invalid token',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { detail: 'Authentication required' },
                        },
                    },
                },
                Forbidden: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { detail: 'You do not have permission to perform this action' },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { detail: 'Resource not found' },
                        },
                    },
                },
                BadRequest: {
                    description: 'Invalid request data',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ValidationError' },
                        },
                    },
                },
            },
        },

        tags: [
            { name: 'Authentication', description: 'User authentication endpoints' },
            { name: 'Users', description: 'User management endpoints' },
            { name: 'Organizations', description: 'Organization management endpoints' },
            { name: 'Sites', description: 'Site management endpoints' },
            { name: 'Assets', description: 'Asset management endpoints' },
            { name: 'Work Orders', description: 'Work order management endpoints' },
            { name: 'PM Schedules', description: 'Preventive Maintenance schedule endpoints' },
            { name: 'Inventory', description: 'Inventory management endpoints' },
            { name: 'Roles', description: 'Role management endpoints' },
            { name: 'Accesses', description: 'Access/Permission management endpoints' },
            { name: 'Groups', description: 'User group management endpoints' },
            { name: 'Analytics', description: 'Analytics and reporting endpoints' },
            { name: 'AI Agent', description: 'AI-powered endpoints' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
