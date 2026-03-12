Fix: Remove Server Actions dependency, use Express API only

- Create products-api.ts client for all product operations
- Update ProductsPage to use API client
- Update ProductModal to use API client
- Remove Prisma dependency from client side
- Fix DATABASE_URL not required on client
