@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM Create schema using multiple echo commands to avoid special character issues
echo generator client {> schema.prisma
echo   provider = "prisma-client-js">> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma
echo datasource db {>> schema.prisma
echo   provider = "postgresql">> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM User model
echo model User {>> schema.prisma
echo   id         String      @id @default(uuid())>> schema.prisma
echo   email      String      @unique>> schema.prisma
echo   password   String>> schema.prisma
echo   role       Role        @default(USER)>> schema.prisma
echo   createdAt  DateTime    @default(now())>> schema.prisma
echo   updatedAt  DateTime    @updatedAt>> schema.prisma
echo   logs       AdminLog[]>> schema.prisma
echo   orders     Order[]>> schema.prisma
echo   systemLogs SystemLog[]>> schema.prisma
echo   @@index([email])>> schema.prisma
echo   @@index([role])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM Category model
echo model Category {>> schema.prisma
echo   id          String     @id @default(uuid())>> schema.prisma
echo   name        String>> schema.prisma
echo   slug        String     @unique>> schema.prisma
echo   description String?>> schema.prisma
echo   parentId    String?>> schema.prisma
echo   parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])>> schema.prisma
echo   children    Category[] @relation("CategoryHierarchy")>> schema.prisma
echo   products    Product[]>> schema.prisma
echo   createdAt   DateTime   @default(now())>> schema.prisma
echo   updatedAt   DateTime   @updatedAt>> schema.prisma
echo   @@index([slug])>> schema.prisma
echo   @@index([parentId])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM Product model with categoryId and rating
echo model Product {>> schema.prisma
echo   id            String      @id @default(uuid())>> schema.prisma
echo   title         String>> schema.prisma
echo   description   String>> schema.prisma
echo   price         Decimal     @db.Decimal(10, 2)>> schema.prisma
echo   categoryId    String?>> schema.prisma
echo   category      Category?   @relation(fields: [categoryId], references: [id])>> schema.prisma
echo   rating        Decimal?    @db.Decimal(3, 2)>> schema.prisma
echo   originalPrice Decimal?    @db.Decimal(10, 2)>> schema.prisma
echo   discountPrice Decimal?    @db.Decimal(10, 2)>> schema.prisma
echo   isFeatured    Boolean     @default(false)>> schema.prisma
echo   isPopular     Boolean     @default(false)>> schema.prisma
echo   imageUrl      String?>> schema.prisma
echo   images        String[]>> schema.prisma
echo   stock         Int         @default(0)>> schema.prisma
echo   isActive      Boolean     @default(true)>> schema.prisma
echo   createdAt     DateTime    @default(now())>> schema.prisma
echo   updatedAt     DateTime    @updatedAt>> schema.prisma
echo   orderItems    OrderItem[]>> schema.prisma
echo   reviews       Review[]>> schema.prisma
echo   @@index([isActive])>> schema.prisma
echo   @@index([createdAt])>> schema.prisma
echo   @@index([title])>> schema.prisma
echo   @@index([isFeatured])>> schema.prisma
echo   @@index([isPopular])>> schema.prisma
echo   @@index([categoryId])>> schema.prisma
echo   @@index([rating])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM Review model
echo model Review {>> schema.prisma
echo   id        String   @id @default(uuid())>> schema.prisma
echo   productId String>> schema.prisma
echo   product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)>> schema.prisma
echo   name      String>> schema.prisma
echo   rating    Int>> schema.prisma
echo   comment   String?>> schema.prisma
echo   createdAt DateTime @default(now())>> schema.prisma
echo   @@index([productId])>> schema.prisma
echo   @@index([createdAt])>> schema.prisma
echo   @@index([rating])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM Order model
echo model Order {>> schema.prisma
echo   id         String      @id @default(uuid())>> schema.prisma
echo   userId     String?>> schema.prisma
echo   name       String>> schema.prisma
echo   phone      String>> schema.prisma
echo   email      String>> schema.prisma
echo   address    String>> schema.prisma
echo   totalPrice Decimal     @db.Decimal(10, 2)>> schema.prisma
echo   status     OrderStatus @default(NEW)>> schema.prisma
echo   comment    String?>> schema.prisma
echo   createdAt  DateTime    @default(now())>> schema.prisma
echo   updatedAt  DateTime    @updatedAt>> schema.prisma
echo   user       User?       @relation(fields: [userId], references: [id])>> schema.prisma
echo   items      OrderItem[]>> schema.prisma
echo   @@index([status])>> schema.prisma
echo   @@index([createdAt])>> schema.prisma
echo   @@index([email])>> schema.prisma
echo   @@index([userId])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM OrderItem model
echo model OrderItem {>> schema.prisma
echo   id        String  @id @default(uuid())>> schema.prisma
echo   orderId   String>> schema.prisma
echo   productId String>> schema.prisma
echo   quantity  Int>> schema.prisma
echo   price     Decimal @db.Decimal(10, 2)>> schema.prisma
echo   order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)>> schema.prisma
echo   product   Product @relation(fields: [productId], references: [id])>> schema.prisma
echo   @@index([orderId])>> schema.prisma
echo   @@index([productId])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM AdminLog model
echo model AdminLog {>> schema.prisma
echo   id        String     @id @default(uuid())>> schema.prisma
echo   adminId   String>> schema.prisma
echo   action    ActionType>> schema.prisma
echo   entity    String?>> schema.prisma
echo   entityId  String?>> schema.prisma
echo   details   String?>> schema.prisma
echo   ipAddress String?>> schema.prisma
echo   userAgent String?>> schema.prisma
echo   createdAt DateTime   @default(now())>> schema.prisma
echo   admin     User       @relation(fields: [adminId], references: [id], onDelete: Cascade)>> schema.prisma
echo   @@index([adminId])>> schema.prisma
echo   @@index([action])>> schema.prisma
echo   @@index([createdAt])>> schema.prisma
echo   @@index([entity])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM SystemLog model
echo model SystemLog {>> schema.prisma
echo   id        String    @id @default(uuid())>> schema.prisma
echo   timestamp DateTime  @default(now())>> schema.prisma
echo   level     LogLevel  @default(INFO)>> schema.prisma
echo   message   String>> schema.prisma
echo   userId    String?>> schema.prisma
echo   user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)>> schema.prisma
echo   ipAddress String?>> schema.prisma
echo   source    LogSource @default(SYSTEM)>> schema.prisma
echo   metadata  String?>> schema.prisma
echo   @@index([level])>> schema.prisma
echo   @@index([timestamp])>> schema.prisma
echo   @@index([source])>> schema.prisma
echo   @@index([userId])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM SiteSettings model
echo model SiteSettings {>> schema.prisma
echo   id          String   @id @default(uuid())>> schema.prisma
echo   key         String   @unique>> schema.prisma
echo   value       String>> schema.prisma
echo   description String?>> schema.prisma
echo   type        String   @default("text")>> schema.prisma
echo   createdAt   DateTime @default(now())>> schema.prisma
echo   updatedAt   DateTime @updatedAt>> schema.prisma
echo   @@index([key])>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

REM Enums
echo enum Role {>> schema.prisma
echo   USER>> schema.prisma
echo   ADMIN>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

echo enum OrderStatus {>> schema.prisma
echo   NEW>> schema.prisma
echo   PROCESSING>> schema.prisma
echo   SHIPPED>> schema.prisma
echo   DELIVERED>> schema.prisma
echo   CANCELLED>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

echo enum ActionType {>> schema.prisma
echo   CREATE>> schema.prisma
echo   UPDATE>> schema.prisma
echo   DELETE>> schema.prisma
echo   LOGIN>> schema.prisma
echo   LOGOUT>> schema.prisma
echo   PASSWORD_RESET>> schema.prisma
echo   SETTINGS_UPDATE>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

echo enum LogLevel {>> schema.prisma
echo   INFO>> schema.prisma
echo   WARNING>> schema.prisma
echo   ERROR>> schema.prisma
echo }>> schema.prisma
echo.>> schema.prisma

echo enum LogSource {>> schema.prisma
echo   ADMIN_PANEL>> schema.prisma
echo   API>> schema.prisma
echo   SYSTEM>> schema.prisma
echo }>> schema.prisma

echo Schema created successfully!
