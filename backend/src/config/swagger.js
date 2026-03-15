const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ShopQA E-Commerce API",
      version: "1.0.0",
      description: `
# ShopQA - E-Commerce API for QA Automation Practice

A complete e-commerce REST API designed specifically for QA engineers to practice:
- **API Automation** (REST, auth flows, CRUD operations)
- **Integration Testing** (end-to-end workflows)
- **Performance Testing** (pagination, filtering, search)
- **Security Testing** (authentication, authorization, rate limiting)

## Authentication
Use the \`/api/auth/login\` endpoint to get a JWT token, then include it in the \`Authorization: Bearer <token>\` header.

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopqa.com | Password123! |
| Customer | john@test.com | Password123! |
| Customer | jane@test.com | Password123! |

## Test Cards (Payment Simulation)
| Card Number | Outcome |
|-------------|---------|
| 4111111111111111 | Success |
| 4000000000000002 | Declined (insufficient funds) |
| 4000000000000069 | Declined (expired) |
| 4000000000009995 | Declined (do not honor) |

## Special Test Scenarios
- **Account lockout**: Fail login 5 times to trigger lockout
- **Token expiration**: Use \`/api/qa/users/:id/expire-tokens\` 
- **Out of stock**: Use \`/api/qa/products/:id/stock\` with \`{"stock": 0}\`
      `,
      contact: { name: "ShopQA Support", email: "qa@shopqa.com" },
      license: { name: "MIT" },
    },
    servers: [
      {
        url: "https://shopqa-backend.onrender.com",
        description: "Production",
      },
      {
        url: "http://localhost:5000",
        description: "Development",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string" },
            details: { type: "array", items: { type: "object" } },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            comparePrice: { type: "number" },
            stock: { type: "integer" },
            categoryName: { type: "string" },
            brand: { type: "string" },
            avgRating: { type: "number" },
            reviewCount: { type: "integer" },
            images: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean" },
            isFeatured: { type: "boolean" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderNumber: { type: "string", example: "ORD-LJZ2K8-AB12" },
            status: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "refunded",
              ],
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            total: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string", enum: ["customer", "admin"] },
            status: {
              type: "string",
              enum: ["active", "locked", "pending_verification", "banned"],
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication & authorization" },
      { name: "Products", description: "Product catalog management" },
      { name: "Cart", description: "Shopping cart operations" },
      { name: "Orders", description: "Order management" },
      { name: "Reviews", description: "Product reviews & ratings" },
      { name: "Users", description: "User profile & addresses" },
      { name: "Admin", description: "Admin panel operations" },
      { name: "QA Helpers", description: "Test automation helper endpoints" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
