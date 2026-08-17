# 多阶段构建：deps → builder → runner
# 使用 node:20-alpine 作为基础镜像，体积小

FROM node:20-alpine AS base

# ---- deps 阶段：安装依赖 ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder 阶段：构建 standalone 产物 ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner 阶段：极简运行时镜像 ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 创建非 root 用户运行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 产物（不含完整 node_modules，体积小）
# standalone 模式下 server.js 会自动加载内联的最小依赖
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# 内存存储：容器重启数据重置为种子状态（教学靶场预期行为）
CMD ["node", "server.js"]
