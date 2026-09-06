# MORI 森集电商

基于 `电商.md` 分批开发的前后端分离电商项目。六批功能现已全部完成：账户、商品、购物车、订单、评价、收藏、浏览历史与管理后台。

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus、Axios、SCSS/CSS Modules
- 后端：Node.js 18+、Express、TypeScript、MySQL、Prisma、JWT、bcryptjs、Joi、Nodemailer

## 目录

```text
client/   Vue 3 前端
server/   Express API 与 Prisma Schema
```

## 本地启动

1. 准备 Node.js 18+ 和 MySQL 8，创建数据库：

```sql
CREATE DATABASE mori_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 安装依赖并创建环境变量：

```bash
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Windows PowerShell 可使用：

```powershell
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

编辑 `server/.env` 中的 `DATABASE_URL`、`JWT_SECRET` 与 SMTP 配置。开发环境可不填 SMTP，验证码会打印在 API 终端并随发送接口的 `devCode` 返回。

3. 生成客户端、迁移数据库、写入种子管理员：

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

4. 启动前后端：

```bash
npm run dev
```

- 前端：http://localhost:5173
- API：http://localhost:3000/api
- 健康检查：http://localhost:3000/api/health
- 种子账号：`admin@mori.test` / `Admin123!`（仅供本地开发，生产前请删除或改密）
- 管理后台：http://localhost:5173/admin

## 第一批 API

所有响应统一为 `{ code, data, message }`。受保护接口使用 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 | 登录 |
| --- | --- | --- | --- |
| POST | `/api/auth/send-code` | 发送注册验证码 | 否 |
| POST | `/api/auth/register` | 邮箱、验证码、密码注册 | 否 |
| POST | `/api/auth/login` | 登录，签发 7 天 JWT | 否 |
| GET | `/api/users/me` | 获取个人资料 | 是 |
| PATCH | `/api/users/me` | 修改昵称、头像、手机号 | 是 |
| GET | `/api/users/addresses` | 地址列表 | 是 |
| POST | `/api/users/addresses` | 新增地址（最多 10 个） | 是 |
| PUT | `/api/users/addresses/:id` | 修改本人地址 | 是 |
| DELETE | `/api/users/addresses/:id` | 删除本人地址 | 是 |
| PATCH | `/api/users/addresses/:id/default` | 设置默认地址 | 是 |

## 第二批 API

| 方法 | 路径 | 说明 | 登录 |
| --- | --- | --- | --- |
| GET | `/api/catalog/categories` | 获取两级分类树 | 否 |
| GET | `/api/catalog/products` | 商品分页、搜索、筛选与排序 | 否 |
| GET | `/api/catalog/products/:id` | 商品详情、图片与 SKU | 否 |

商品列表参数：`page`、`pageSize`（默认 20）、`keyword`、`categoryId`、`minPrice`、`maxPrice`、`sort`。排序支持 `default`、`price_asc`、`price_desc`、`sales`。

## 第三批 API

购物车接口均需要 JWT。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/cart` | 获取当前用户购物车 |
| POST | `/api/cart/items` | 添加商品规格，已有条目自动合并数量 |
| PATCH | `/api/cart/items/:id` | 修改数量并校验库存 |
| DELETE | `/api/cart/items/:id` | 删除单个条目 |
| DELETE | `/api/cart` | 清空购物车 |
| POST | `/api/cart/sync` | 登录后合并游客购物车 |

游客购物车由 Pinia 持久化到 `localStorage`；登录或注册成功后自动同步到服务端，失效商品不会阻塞其他有效条目的合并。

## 第四批 API

订单接口均需要 JWT。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/orders` | 从选中购物车条目创建订单 |
| GET | `/api/orders` | 分页获取订单，可按状态筛选 |
| GET | `/api/orders/:id` | 获取本人订单详情 |
| POST | `/api/orders/:id/pay` | 模拟付款，订单转为待发货 |
| POST | `/api/orders/:id/cancel` | 取消待付款订单并恢复库存 |
| POST | `/api/orders/:id/confirm-receipt` | 对已发货订单确认收货 |

订单创建会校验地址归属、商品状态、SKU 归属及库存，并在 Serializable 事务中扣减库存、生成订单快照和移除已结算购物车条目。地址和商品后续发生变化不会影响历史订单展示。

## 第五批 API

| 方法 | 路径 | 说明 | 登录 |
| --- | --- | --- | --- |
| GET | `/api/catalog/products/:id/reviews` | 商品评价、平均分与分页 | 否 |
| POST | `/api/reviews` | 评价本人已完成订单中的商品 | 是 |
| POST | `/api/uploads/reviews` | 上传最多 5 张评价图片 | 是 |
| GET | `/api/favorites` | 收藏列表 | 是 |
| GET | `/api/favorites/:productId/status` | 查询收藏状态 | 是 |
| POST | `/api/favorites/:productId` | 收藏商品 | 是 |
| DELETE | `/api/favorites/:productId` | 取消收藏 | 是 |
| GET | `/api/history` | 最近 50 条浏览历史 | 是 |
| POST | `/api/history/:productId` | 写入或刷新浏览记录 | 是 |
| DELETE | `/api/history/:productId` | 删除单条记录 | 是 |
| DELETE | `/api/history` | 清空浏览历史 | 是 |

评价图片支持 JPG、PNG 和 WebP，单张最大 5MB。开发环境上传到 `server/uploads/reviews`；生产部署必须为该目录配置持久化磁盘，或改接对象存储，避免重新部署后图片丢失。

## 数据模型

Prisma Schema 位于 `server/prisma/schema.prisma`。第一批包含账户相关模型；第二批加入商品相关模型；第三批加入 `CartItem`；第四批加入订单相关模型；第五批加入 `Review`、`Favorite` 和 `BrowsingHistory`。第六批复用既有角色、用户状态、商品状态和订单状态字段，不需新增数据表。运行种子命令会创建两级分类、三件测试商品和对应 SKU。

## 第六批管理 API

以下接口均要求有效 JWT 且当前用户角色为 `ADMIN`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/stats` | 订单、成交额、用户、在售商品统计 |
| GET | `/api/admin/products` | 搜索、筛选与分页查看全部商品 |
| POST | `/api/admin/products` | 新增商品及 SKU |
| PUT | `/api/admin/products/:id` | 编辑商品及 SKU |
| PATCH | `/api/admin/products/:id/status` | 上架、下架或转为草稿 |
| GET | `/api/admin/orders` | 搜索、筛选与分页查看全站订单 |
| PATCH | `/api/admin/orders/:id/status` | 发货、完成或取消待付款订单 |
| GET | `/api/admin/users` | 搜索、筛选与分页查看普通用户 |
| PATCH | `/api/admin/users/:id/status` | 封禁或解除封禁用户 |

后台订单状态严格按业务顺序推进；取消待付款订单会在事务中恢复商品与 SKU 库存。用户被封禁后，已有 JWT 也会在下一次受保护请求时失效。

## 安全说明

- 密码使用 bcrypt 12 轮哈希，不返回密码字段。
- JWT 默认 7 天有效；生产环境必须使用至少 32 位随机密钥。
- 验证码仅保存哈希、10 分钟过期、60 秒发送冷却，并叠加 IP 限流。
- 地址接口按 JWT 用户 ID 做所有权校验。
- 管理接口同时校验数据库中的实时账户状态和管理员角色，不能只凭前端路由进入。
