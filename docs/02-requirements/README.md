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

### UC-03 / UC-04: Расчёт ИМТ и сохранение результата

| Поле | Значение |
|---|---|
| **ID** | UC-03, UC-04 |
| **Название** | Расчёт ИМТ и сохранение результата |
| **Актор** | Пользователь |
| **Предусловие** | Пользователь аутентифицирован; JWT-токен действителен |
| **Основной сценарий** | 1. Пользователь открывает `CalculatorScreen`. 2. Вводит вес и рост (метрические или имперские единицы). 3. Нажимает «Рассчитать». 4. Клиент конвертирует значения в метрические через `toMetricWeight()` / `toMetricHeight()` из `units.js`. 5. Отправляет `POST /api/bmi/calculate` с Bearer-токеном. 6. Сервер: `BmiRecord.calculateBmi(weight, height)` → `BmiRecord.getCategory(bmi)` → `bmiRecordRepository.save()`. 7. Ответ отображается с цветовой индикацией категории. |
| **Альтернативный сценарий** | 3a. Вес < 30 или > 300 кг / рост < 50 или > 250 см — показана ошибка валидации. 5a. Сервер недоступен — локальный расчёт без сохранения. |
| **Постусловие** | Новая запись `BmiRecord` сохранена в таблице `bmi_records`; поле `measuredAt` установлено через `@PrePersist`. |

### UC-02: Вход в систему

| Поле | Значение |
|---|---|
| **ID** | UC-02 |
| **Название** | Вход в систему |
| **Актор** | Пользователь / Администратор |
| **Предусловие** | Пользователь зарегистрирован в системе |
| **Основной сценарий** | 1. Открывается `LoginScreen`. 2. Вводятся email и пароль. 3. `POST /api/auth/login`. 4. `UserServiceImpl.login()`: находит `User` по email через `userRepository.findByEmail()`, сверяет пароль через `passwordEncoder.matches()`. 5. `JwtUtil.generateToken(email, userId, role)` — токен с claims. 6. `authStorage.setToken()` — сохраняет токен в `SecureStore` (iOS/Android) или `AsyncStorage` (web). 7. `authStorage.setUser()` — сохраняет `{userId, name, email, role}`. 8. `AppNavigator` переключается на `MainTabs`. |
| **Альтернативный сценарий** | 4a. Email не найден или пароль не совпадает — `RuntimeException("Неверный пароль")` → 401. |
| **Постусловие** | Токен и данные пользователя сохранены локально; пользователь перенаправлен в `MainTabs`. |

### UC-13: Работа в оффлайн-режиме

| Поле | Значение |
|---|---|
| **ID** | UC-13 |
| **Название** | Работа в оффлайн-режиме |
| **Актор** | Пользователь |
| **Предусловие** | Сервер недоступен; ранее данные загружались и кэшировались |
| **Основной сценарий** | 1. `HistoryScreen` запрашивает `GET /api/bmi/history`. 2. Сетевая ошибка. 3. Данные загружаются из AsyncStorage по ключу `bmi_history_cache_v1`. 4. Аналогично для статистики — ключ `bmi_stats_cache_v1`. 5. Экран настроек отображает дату последнего обновления кэша. |
| **Постусловие** | Пользователь видит кэшированные данные с пометкой времени актуальности. |

---

## 3. Domain Model (концептуальная модель классов)

```
┌───────────────────────────────────┐
│             User                  │
├───────────────────────────────────┤
│ id: Long                          │
│ email: String (unique, not null)  │
│ password: String (@JsonIgnore)    │
│ name: String                      │
│ birthYear: Integer                │
│ role: Role (USER | ADMIN)         │
│ createdAt: LocalDateTime          │
│ bmiRecords: List<BmiRecord>       │
│   (@JsonIgnore, LAZY, CASCADE ALL)│
├───────────────────────────────────┤
│ + getAge(): int                   │
│   (2026 - birthYear)              │
└──────────────────┬────────────────┘
                   │ @OneToMany (1..*)
                   │ mappedBy="user"
                   │ ON DELETE CASCADE
┌──────────────────▼────────────────┐
│           BmiRecord               │
├───────────────────────────────────┤
│ id: Long                          │
│ user: User (@JsonIgnore, LAZY)    │
│ weight: Double (кг, not null)     │
│ height: Double (см, not null)     │
│ bmi: Double (not null)            │
│ category: String (not null)       │
│ measuredAt: LocalDateTime         │
│   (устанавливается @PrePersist)   │
├───────────────────────────────────┤
│ + calculateBmi(kg, cm): double    │
│   static, округление до 0.1      │
│ + getCategory(bmi): String        │
│   static, 7 категорий ВОЗ        │
└───────────────────────────────────┘
```

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
