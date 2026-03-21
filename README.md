# ИМТ Калькулятор — Мобильное приложение

**Курсовой проект по дисциплине «Программная инженерия»**  
Траектория В: Мобильная разработка  
Архитектура: PCMEF (Presentation–Control–Mediator–Entity–Foundation)

## Стек технологий

| Компонент | Технология |
|---|---|
| Мобильный клиент | React Native + Expo |
| Бэкенд | Java 17 + Spring Boot 3 |
| База данных | PostgreSQL |
| ORM | Spring Data JPA |
| Безопасность | JWT + BCrypt |
| API документация | OpenAPI 3 / Swagger UI |
| Тесты | JUnit 5 + Mockito |

## Структура проекта (PCMEF)

```
backend/
└── src/main/java/com/bmi/
    ├── entity/          # Слой E — бизнес-сущности (User, BmiRecord)
    ├── foundation/      # Слой F — репозитории (UserRepository, BmiRecordRepository)
    ├── mediator/        # Слой M — бизнес-логика (IUserService, IBmiService + impl)
    ├── control/         # Слой C — REST контроллеры (AuthController, BmiController, UserController)
    ├── security/        # JWT фильтр и утилиты
    └── config/          # SecurityConfig

frontend/
└── src/
    ├── screens/         # Слой P — экраны приложения (5+ экранов, включая «Настройки»)
    ├── api/             # HTTP-клиент (Axios)
    ├── navigation/      # Навигация (React Navigation)
    └── context/         # AuthContext (управление состоянием)
```

## REST API — эндпоинты (8+)

| Метод | URL | Описание |
|---|---|---|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/users/me | Профиль пользователя |
| PUT | /api/users/me | Обновить профиль |
| GET | /api/admin/users | (ADMIN) Список пользователей |
| POST | /api/bmi/calculate | Рассчитать и сохранить ИМТ |
| GET | /api/bmi/history | История измерений |
| GET | /api/bmi/stats | Статистика |
| GET | /api/bmi/{id} | Запись по ID |
| PUT | /api/bmi/{id} | Обновить запись |
| DELETE | /api/bmi/{id} | Удалить запись |
| GET | /api/bmi/search | Поиск с фильтрацией |

Документация API: http://localhost:8082/swagger-ui.html

## Быстрый старт

### 1. База данных
```bash
psql -U postgres -c "CREATE DATABASE bmi_db;"
psql -U postgres -d bmi_db -f backend/src/main/resources/init.sql
```

### 2. Бэкенд
```bash
cd backend
mvn spring-boot:run
```

### 3. Мобильное приложение
```bash
cd frontend
npm install
npx expo start
# Отсканируйте QR-код приложением Expo Go на телефоне
```

## Документация (по этапам)

- Этап 0 — бизнес-анализ: `docs/01-business-model/README.md`
- Этап 1 — требования: `docs/02-requirements/README.md`
- Этап 2 — архитектура: `docs/03-architecture/README.md`
- Этап 3 — БД: `docs/04-database/README.md`
- Этап 4 — дизайн/проектирование: `docs/05-design/README.md`
- Этап 5 — реализация/тесты: `docs/06-implementation/README.md`
- UI (траектория В): `docs/07-ui/README.md`
- Финальный пакет: `docs/08-final/README.md`

## Статистика разработки

- Всего коммитов: —
- Период: — (дата первого и последнего коммита)
- Средняя частота: — коммита/неделю

### График активности
![Активность коммитов](docs/images/git-stats-commit-activity.png)

### Тепловая карта
![Распределение по времени](docs/images/git-stats-punch-card.png)
