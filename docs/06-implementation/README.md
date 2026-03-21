# Этап 5: Реализация ядра и тестирование

**Проект:** ИМТ Калькулятор  
**Недели:** 11–12

---

## 1. Структура реализованного кода

### Серверная часть

```
backend/src/main/java/com/bmi/
├── control/
│   ├── AuthController.java        # POST /api/auth/register, /login
│   ├── BmiController.java         # /api/bmi/** (7 эндпоинтов)
│   ├── UserController.java        # GET/PUT /api/users/me
│   └── AdminController.java       # GET /api/admin/users
├── mediator/
│   ├── IBmiService.java           # интерфейс контракта C→M
│   └── IUserService.java          # интерфейс контракта C→M
├── mediator/impl/
│   ├── BmiServiceImpl.java        # @Service @Transactional
│   └── UserServiceImpl.java       # @Service @Transactional
├── entity/
│   ├── User.java                  # @PrePersist, getAge(), @JsonIgnore
│   └── BmiRecord.java             # @PrePersist, calculateBmi(), getCategory()
├── foundation/
│   ├── UserRepository.java        # findByEmail, existsByEmail
│   └── BmiRecordRepository.java   # 4 кастомных метода
├── dto/
│   ├── BmiRequest.java
│   ├── BmiStatsResponse.java      # @Builder: total, avg, min, max, currentCategory
│   ├── AuthResponse.java          # @Builder: token, userId, name, email, role
│   ├── RegisterRequest.java
│   ├── LoginRequest.java
│   └── UpdateProfileRequest.java
├── security/
│   ├── JwtUtil.java               # generateToken, extractEmail/UserId/Role, isValid
│   └── JwtFilter.java             # OncePerRequestFilter
└── config/
    └── SecurityConfig.java        # stateless, JWT, CORS, CSRF off
```

### Мобильный клиент

```
frontend/src/
├── screens/                       # 8 экранов (требование: ≥5)
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── CalculatorScreen.js
│   ├── HistoryScreen.js
│   ├── ProfileScreen.js
│   ├── RecordDetailScreen.js
│   ├── EditProfileScreen.js
│   └── SettingsScreen.js
├── api/
│   ├── client.js                  # Axios instance + JWT-интерцептор
│   ├── auth.js                    # register, login, logout, getCurrentUser
│   ├── bmi.js                     # calculate, getHistory, getStats, getRecord, update, delete, search
│   └── user.js                    # getMe, updateMe
├── context/
│   ├── AuthContext.js             # user, login(), logout(), loading
│   └── SettingsContext.js         # settings: {theme, units}
├── navigation/
│   └── AppNavigator.js            # AuthStack / MainStack(MainTabs + RecordDetails + EditProfile)
├── storage/
│   ├── authStorage.js             # SecureStore (iOS/Android) / AsyncStorage (web)
│   └── cacheKeys.js               # HISTORY_CACHE_KEY, STATS_CACHE_KEY
├── theme/
│   ├── colors.js
│   └── useTheme.js
└── utils/
    └── units.js                   # конвертация кг↔lb, см↔in
```

---

## 2. Реализация слоёв E и F

### Entity: бизнес-методы в `BmiRecord.java`

```java
// Слой E — статические бизнес-методы принадлежат сущности
public static double calculateBmi(double weightKg, double heightCm) {
    double h = heightCm / 100.0;
    return Math.round((weightKg / (h * h)) * 10.0) / 10.0;
}

public static String getCategory(double bmi) {
    if (bmi < 16.0) return "Выраженный дефицит массы";
    if (bmi < 18.5) return "Недостаточная масса тела";
    if (bmi < 25.0) return "Норма";
    if (bmi < 30.0) return "Избыточная масса тела";
    if (bmi < 35.0) return "Ожирение I степени";
    if (bmi < 40.0) return "Ожирение II степени";
    return "Ожирение III степени";
}

@PrePersist
protected void onCreate() { measuredAt = LocalDateTime.now(); }
```

### Foundation: репозитории

```java
// BmiRecordRepository — слой F
List<BmiRecord> findByUserIdOrderByMeasuredAtDesc(Long userId);
Optional<BmiRecord> findByIdAndUserId(Long id, Long userId);  // owner check
List<BmiRecord> findByUserIdAndCategoryContainingIgnoreCaseOrderByMeasuredAtDesc(
    Long userId, String category);
long countByUserId(Long userId);

// UserRepository — слой F
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
```

---

## 3. Реализация слоя M

### `BmiServiceImpl.calculateAndSave()` — делегирование в Entity

```java
@Override
public BmiRecord calculateAndSave(Long userId, BmiRequest req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    // бизнес-методы вызываются из слоя Entity:
    double bmi = BmiRecord.calculateBmi(req.getWeight(), req.getHeight());
    String category = BmiRecord.getCategory(bmi);
    BmiRecord record = BmiRecord.builder()
        .user(user).weight(req.getWeight()).height(req.getHeight())
        .bmi(bmi).category(category).build();
    return bmiRecordRepository.save(record);
}
```

### `BmiServiceImpl.getStats()` — агрегация через Stream API

```java
@Override
@Transactional(readOnly = true)
public BmiStatsResponse getStats(Long userId) {
    List<BmiRecord> records = bmiRecordRepository.findByUserIdOrderByMeasuredAtDesc(userId);
    if (records.isEmpty())
        return BmiStatsResponse.builder().totalMeasurements(0L).build();
    double avg = records.stream().mapToDouble(BmiRecord::getBmi).average().orElse(0);
    double min = records.stream().mapToDouble(BmiRecord::getBmi).min().orElse(0);
    double max = records.stream().mapToDouble(BmiRecord::getBmi).max().orElse(0);
    return BmiStatsResponse.builder()
        .totalMeasurements((long) records.size())
        .averageBmi(Math.round(avg * 10.0) / 10.0)
        .minBmi(min).maxBmi(max)
        .currentCategory(records.get(0).getCategory()).build();
}
```

---

## 4. REST API — полный список эндпоинтов

| Метод | URL | Контроллер | Сервис-метод | Описание |
|---|---|---|---|---|
| POST | `/api/auth/register` | AuthController | `IUserService.register()` | Регистрация |
| POST | `/api/auth/login` | AuthController | `IUserService.login()` | Вход |
| GET | `/api/users/me` | UserController | `IUserService.getUserById()` | Профиль |
| PUT | `/api/users/me` | UserController | `IUserService.updateProfile()` | Обновить профиль |
| GET | `/api/admin/users` | AdminController | `IUserService.getAllUsers()` | Список пользователей (ADMIN) |
| POST | `/api/bmi/calculate` | BmiController | `IBmiService.calculateAndSave()` | Расчёт и сохранение |
| GET | `/api/bmi/history` | BmiController | `IBmiService.getHistory()` | История |
| GET | `/api/bmi/stats` | BmiController | `IBmiService.getStats()` | Статистика |
| GET | `/api/bmi/{id}` | BmiController | `IBmiService.getById()` | Запись по ID |
| PUT | `/api/bmi/{id}` | BmiController | `IBmiService.updateRecord()` | Обновить запись |
| DELETE | `/api/bmi/{id}` | BmiController | `IBmiService.deleteRecord()` | Удалить запись |
| GET | `/api/bmi/search?category=` | BmiController | `IBmiService.search()` | Поиск по категории |

**Итого: 12 эндпоинтов** (требование методички для траектории В: ≥ 8)

**Swagger UI:** `http://localhost:8082/swagger-ui.html`  
**OpenAPI JSON:** `http://localhost:8082/api-docs`

---

## 5. Тестирование (ApiIntegrationTest.java)

### Конфигурация

- Аннотации: `@SpringBootTest`, `@AutoConfigureMockMvc`
- СУБД: H2 in-memory (подключается автоматически при `scope=test` в pom.xml)
- Инструменты: `MockMvc`, `ObjectMapper`, `UserRepository`, `PasswordEncoder`
- Покрытие: JaCoCo 0.8.11 (`mvn test` → `target/site/jacoco/index.html`)

### Тест 1: Полный CRUD-цикл

**Метод:** `register_login_profile_and_bmi_crud_flow()`

| Шаг | Запрос | Ожидаемый результат |
|---|---|---|
| 1 | `POST /api/auth/register` | 200 OK, `token` не пустой |
| 2 | `GET /api/users/me` (Bearer) | 200 OK, `email = "test@example.com"` |
| 3 | `POST /api/bmi/calculate` (вес 70, рост 175) | 200 OK, `id` и `bmi` заполнены |
| 4 | `GET /api/bmi/{id}` (Bearer) | 200 OK, `id` совпадает |
| 5 | `PUT /api/bmi/{id}` (вес 72) | 200 OK, `weight = 72.0` |
| 6 | `GET /api/bmi/history` | 200 OK, массив |
| 7 | `GET /api/bmi/search?category=Норма` | 200 OK, массив |
| 8 | `DELETE /api/bmi/{id}` | 204 No Content |

### Тест 2: Защита административных эндпоинтов

**Метод:** `admin_endpoints_require_admin_role()`

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Создать User с `role=ADMIN` в H2 через `userRepository.save()` | — |
| 2 | `POST /api/auth/login` (admin@bmi.ru) | 200 OK, admin-токен |
| 3 | `GET /api/admin/users` (admin-токен) | 200 OK, массив |
| 4 | `POST /api/auth/register` (обычный пользователь) | 200 OK, user-токен |
| 5 | `GET /api/admin/users` (user-токен) | **403 Forbidden** |

### Запуск тестов и просмотр покрытия

```bash
cd backend
mvn test
# Отчёт JaCoCo:
# target/site/jacoco/index.html
```

---

## 6. Соответствие требованиям методички

| Требование (траектория В) | Статус |
|---|---|
| Мобильное приложение ≥ 5 экранов | ✅ 8 экранов |
| Серверная часть Java + Spring Boot | ✅ Java 17 + Spring Boot 3.2.0 |
| REST API ≥ 8 эндпоинтов | ✅ 12 эндпоинтов |
| Документация OpenAPI (Swagger UI) | ✅ springdoc 2.3.0 |
| JWT-аутентификация | ✅ jjwt 0.11.5, `JwtUtil` + `JwtFilter` |
| Разграничение доступа (роли) | ✅ USER / ADMIN, `SecurityConfig` |
| Локальное кэширование (оффлайн) | ✅ `AsyncStorage`, ключи `v1` |
| Модульное тестирование ≥ 40% покрытия | ✅ JaCoCo 0.8.11, 2 интеграционных теста |
| Архитектура PCMEF | ✅ пакеты control/mediator/mediator.impl/entity/foundation |
