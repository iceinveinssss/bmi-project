# Этап 1: Проектирование требований

**Проект:** ИМТ Калькулятор  
**Недели:** 3–4

---

## 1. Use Case диаграмма

### Акторы

| Актор | Описание |
|---|---|
| `Пользователь` | Зарегистрированный пользователь мобильного приложения (роль `USER`) |
| `Администратор` | Пользователь с ролью `ADMIN`; доступ к `/api/admin/**` проверяется через `SecurityConfig` |

![Use Case диаграмма](docs/images/use_case.png)

*Рисунок 1 — Use Case диаграмма*

### Варианты использования

```
Пользователь:
  ├── UC-01  Регистрация аккаунта
  ├── UC-02  Вход в систему
  ├── UC-03  Расчёт ИМТ
  │     └── <<include>> UC-04 Сохранение BmiRecord на сервере
  ├── UC-05  Просмотр истории измерений
  │     └── <<extend>>  UC-06 Фильтрация по категории
  ├── UC-07  Просмотр и редактирование записи (RecordDetailScreen)
  ├── UC-08  Удаление записи
  ├── UC-09  Просмотр статистики (min / max / avg ИМТ)
  ├── UC-10  Просмотр профиля
  ├── UC-11  Редактирование профиля (EditProfileScreen)
  ├── UC-12  Изменение настроек (тема, единицы измерения)
  └── UC-13  Работа в оффлайн-режиме (AsyncStorage)

Администратор (расширяет Пользователя):
  └── UC-14  Просмотр списка всех пользователей
```

---

## 2. Спецификация вариантов использования

### UC-03 / UC-04: Диаграмма последовательности: расчёт ИМТ

![Диаграмма последовательности: расчёт ИМТ](docs/images/UC_1.png)

*Рисунок 2 — Use Case диаграма*

### UC-02: Диаграмма последовательности: просмотр истории

![Диаграмма последовательности: просмотр истории](docs/images/UC_2.png)

*Рисунок 3 — Use Case диаграма*

---

## 3. Domain Model (концептуальная модель классов)

![Domain Model](docs/images/domain_model.png)

*Рисунок 4 — Domain Model*

### Бизнес-правила

| ID | Правило |
|---|---|
| BR-01 | ИМТ = weight / (height/100)². Округление: `Math.round(value * 10.0) / 10.0` |
| BR-02 | 7 категорий ВОЗ; границы: 16.0 / 18.5 / 25.0 / 30.0 / 35.0 / 40.0 |
| BR-03 | Пользователь видит только свои записи: `findByIdAndUserId(id, userId)` |
| BR-04 | При регистрации дубликат email → `existsByEmail()` → `RuntimeException` |
| BR-05 | Пароль хранится только как BCrypt-хеш (`@JsonIgnore`) |
| BR-06 | JWT обязателен для всех запросов кроме `/api/auth/**` и Swagger |
| BR-07 | `/api/admin/**` требует роли `ADMIN`; `USER` получает 403 |
| BR-08 | Данные хранятся в метрических единицах; конвертация — на клиенте (`units.js`) |

---

## 4. Расширенный глоссарий (дополнительно к Этапу 0)

| Термин | Определение |
|---|---|
| `AuthContext` | React Context: хранит `user` (`{userId, name, email, role}`) и методы `login` / `logout` |
| `SettingsContext` | React Context: хранит настройки `{theme, units}` (тема и единицы измерения) |
| `AppNavigator` | Корневой компонент навигации: `AuthStack` (Login, Register) или `MainStack` (MainTabs + RecordDetails + EditProfile) |
| `MainTabs` | `BottomTabNavigator` с 4 вкладками: Калькулятор, История, Профиль, Настройки |
| `authStorage` | Модуль `storage/authStorage.js`: `SecureStore` на iOS/Android, `AsyncStorage` на web |
| `cacheKeys.js` | Константы: `HISTORY_CACHE_KEY = 'bmi_history_cache_v1'`, `STATS_CACHE_KEY = 'bmi_stats_cache_v1'` |
| `units.js` | Утилиты конвертации: `kgToLb`, `lbToKg`, `cmToIn`, `inToCm`, `toMetricWeight`, `toMetricHeight`, `round1` |
| `BmiRequest` | DTO запроса: `{weight: Double, height: Double}` (всегда в метрических единицах) |
| `BmiStatsResponse` | DTO статистики: `{totalMeasurements, averageBmi, minBmi, maxBmi, currentCategory}` |
| `AuthResponse` | DTO аутентификации: `{token, userId, name, email, role}` |
| `RegisterRequest` | DTO регистрации: `{name, email, password, birthYear?}` |
| `UpdateProfileRequest` | DTO обновления профиля: `{name?, birthYear?}` |
| `JwtUtil` | Компонент генерации и парсинга JWT (jjwt 0.11.5, HMAC-SHA, ключ из `jwt.secret`) |
| `JwtFilter` | `OncePerRequestFilter`: парсит `Authorization: Bearer <token>`, устанавливает `SecurityContext` |
| `SecurityConfig` | `@Configuration`: stateless, `/api/auth/**` — permitAll, `/api/admin/**` — hasRole("ADMIN") |

---

## 5. Таблица трассировки требований

| Бизнес-требование | Системный UC | Эндпоинт API | Экран |
|---|---|---|---|
| BUC-01 Управление аккаунтом | UC-01, UC-02, UC-10, UC-11 | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me` | `LoginScreen`, `RegisterScreen`, `ProfileScreen`, `EditProfileScreen` |
| BUC-02 Расчёт и сохранение | UC-03, UC-04 | `POST /api/bmi/calculate` | `CalculatorScreen` |
| BUC-03 Мониторинг динамики | UC-05, UC-06, UC-09 | `GET /api/bmi/history`, `GET /api/bmi/search`, `GET /api/bmi/stats` | `HistoryScreen` |
| BUC-04 Управление данными | UC-07, UC-08 | `GET /api/bmi/{id}`, `PUT /api/bmi/{id}`, `DELETE /api/bmi/{id}` | `RecordDetailScreen`, `HistoryScreen` |
| BUC-05 Оффлайн-режим | UC-13 | — (AsyncStorage) | `SettingsScreen` (статус кэша) |
| BUC-06 Настройки | UC-12 | — (локально) | `SettingsScreen` |
| BUC-07 Администрирование | UC-14 | `GET /api/admin/users` | — (только API) |
