# ИМТ Калькулятор — Мобильное приложение

**Курсовой проект по дисциплине «Программная инженерия»**  
Траектория В: Мобильная разработка  
Архитектура: PCMEF (Presentation–Control–Mediator–Entity–Foundation)

---

## Стек технологий

| Компонент | Технология |
|---|---|
| Мобильный клиент | React Native 0.81.5 + Expo ~54.0.33 |
| Бэкенд | Java 17 + Spring Boot 3.2.0 |
| База данных | PostgreSQL (bmi_db, порт 5432) |
| ORM | Spring Data JPA + Hibernate |
| Безопасность | JWT (jjwt 0.11.5) + BCrypt |
| API документация | OpenAPI 3 / Swagger UI (springdoc 2.3.0) |
| Тесты | JUnit 5 + MockMvc + H2 in-memory |
| Покрытие | JaCoCo 0.8.11 (48 %) |

---

## Структура проекта (PCMEF)

```
backend/
└── src/main/java/com/bmi/
    ├── control/         # Слой C — REST-контроллеры
    │   ├── AuthController.java
    │   ├── BmiController.java
    │   ├── UserController.java
    │   └── AdminController.java
    ├── mediator/        # Слой M — интерфейсы (контракты C→M)
    │   ├── IBmiService.java
    │   └── IUserService.java
    ├── mediator/impl/   # Слой M — реализации бизнес-логики
    │   ├── BmiServiceImpl.java
    │   └── UserServiceImpl.java
    ├── entity/          # Слой E — JPA-сущности + бизнес-методы
    │   ├── User.java
    │   └── BmiRecord.java        # calculateBmi(), getCategory()
    ├── foundation/      # Слой F — репозитории
    │   ├── UserRepository.java
    │   └── BmiRecordRepository.java
    ├── dto/             # DTO объекты
    ├── security/        # JwtUtil, JwtFilter
    └── config/          # SecurityConfig

frontend/
└── src/
    ├── screens/         # Слой P — 8 экранов приложения
    ├── api/             # HTTP-клиент Axios (auth.js, bmi.js, user.js, client.js)
    ├── context/         # AuthContext, SettingsContext
    ├── navigation/      # AppNavigator (AuthStack + MainStack)
    ├── storage/         # authStorage.js, cacheKeys.js (оффлайн-кэш)
    ├── theme/           # useTheme.js, colors.js
    └── utils/           # units.js (конвертация кг↔lb, см↔in)
```

---

## REST API — 12 эндпоинтов

| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/users/me` | Профиль пользователя |
| PUT | `/api/users/me` | Обновить профиль |
| GET | `/api/admin/users` | (ADMIN) Список пользователей |
| POST | `/api/bmi/calculate` | Рассчитать и сохранить ИМТ |
| GET | `/api/bmi/history` | История измерений |
| GET | `/api/bmi/stats` | Статистика (min/max/avg) |
| GET | `/api/bmi/{id}` | Запись по ID |
| PUT | `/api/bmi/{id}` | Обновить запись |
| DELETE | `/api/bmi/{id}` | Удалить запись |
| GET | `/api/bmi/search` | Поиск с фильтрацией по категории |

**Swagger UI:** `http://localhost:8082/swagger-ui.html`  
**OpenAPI JSON:** `http://localhost:8082/api-docs`

Авторизация в Swagger UI:
1. Выполните `POST /api/auth/login`, скопируйте поле `token`
2. Нажмите **Authorize** → вставьте `Bearer <token>`

---

## Быстрый старт

### 1. База данных
```bash
psql -U postgres -c "CREATE DATABASE bmi_db;"
psql -U postgres -d bmi_db -f backend/src/main/resources/init.sql
```

Учётная запись администратора (создаётся `init.sql`):
- email: `admin@bmi.ru`
- пароль: `admin123`

Назначить роль ADMIN существующему пользователю:
```sql
UPDATE users SET role='ADMIN' WHERE email='ваш@email';
-- Перелогиньтесь, чтобы получить новый JWT с ролью ADMIN
```

### 2. Бэкенд
```bash
cd backend
mvn spring-boot:run
# Сервер: http://localhost:8082
```

### 3. Мобильное приложение
```bash
cd frontend
npm install
npx expo start
# Отсканируйте QR-код приложением Expo Go на телефоне
```

### 4. Тесты и покрытие
```bash
cd backend
mvn test
# JaCoCo отчёт: target/site/jacoco/index.html
```

---

## Документация (по этапам)

| Этап | Файл |
|---|---|
| Этап 0 — бизнес-анализ | `docs/01-business-model/README.md` |
| Этап 1 — требования | `docs/02-requirements/README.md` |
| Этап 2 — архитектура | `docs/03-architecture/README.md` |
| Этап 3 — база данных | `docs/04-database/README.md` |
| Этап 4 — детальное проектирование | `docs/05-design/README.md` |
| Этап 5 — реализация и тесты | `docs/06-implementation/README.md` |
| Этап 6 — рефакторинг | `docs/06-implementation/REFACTORING.md` |
| Покрытие тестами (JaCoCo) | `docs/06-implementation/COVERAGE.md` |
| Этап 7 — UI (траектория В) | `docs/07-ui/README.md` |
| Этап 8 — финальный пакет | `docs/08-final/README.md` |

---

## Статистика разработки

### Метрики Git

- Всего коммитов: *(заполнить перед сдачей)*
- Период: *(дата первого коммита)* — *(дата последнего коммита)*
- Средняя частота: *(X)* коммита/неделю

### График активности
![Активность коммитов](docs/images/git-stats-commit-activity.png)

### Тепловая карта
![Распределение по времени](docs/images/git-stats-punch-card.png)