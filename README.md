# Dự Đoán Lô Tô XSMB - AI Powered

## 🚀 Chạy trên VPS với Docker

### 1. Clone hoặc copy thư mục lên VPS

```bash
scp -r lottery-prediction user@your-vps:/home/user/
```

### 2. Chạy với Docker Compose

```bash
cd lottery-prediction

# Build và chạy
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

### 3. Truy cập

```
http://your-vps-ip:3001
```

## 📋 Cấu hình

Chỉnh sửa trong `docker-compose.yml`:

```yaml
environment:
  - VPS_AI_BASE_URL=http://194.233.66.68:8317/v1
  - VPS_AI_API_KEY=candat
  - DEFAULT_AI_MODEL=gemini-claude-opus-4-5-thinking
```

## ⏰ Tự động cập nhật

- **18:35** hàng ngày (giờ VN): Tự động crawl kết quả XSMB mới
- **18:45**: Backup nếu lần đầu thất bại

## 🤖 AI Models có sẵn

| Model | Mô tả |
|-------|-------|
| claude-opus | Claude Opus 4.5 - Mạnh nhất |
| claude-sonnet | Claude Sonnet 4.5 - Nhanh |
| gemini | Gemini 3 Pro |
| gpt-codex-max | GPT 5.1 Codex Max |
| gpt-codex | GPT 5.2 Codex |
| glm | GLM 4.7 |
| minimax | MiniMax M2.1 |

## 📊 API Endpoints

| Endpoint | Mô tả |
|----------|-------|
| GET /api/lottery/latest | Kết quả mới nhất |
| POST /api/lottery/update | Cập nhật kết quả |
| GET /api/lottery/statistics | Thống kê |
| GET /api/lottery/ai-analysis?provider=claude-opus | AI dự đoán |

## ⚠️ Lưu ý

Đây chỉ là công cụ phân tích thống kê, không đảm bảo kết quả. Chơi có trách nhiệm!
