# Этап 4: Детальное проектирование

**Проект:** ИМТ Калькулятор  
**Недели:** 9–10

---

## 1. Диаграммы последовательности

### Сценарий 1: Вход в систему (UC-02)

```
Пользователь  LoginScreen  authApi    apiClient   AuthController  UserServiceImpl  UserRepository  JwtUtil  authStorage
     │             │           │           │              │               │               │           │          │
     │──Ввод──────►│           │           │              │               │               │           │          │
     │  email+pass │           │           │              │               │               │           │          │
     │──Войти─────►│           │           │              │               │               │           │          │
     │             │──login()─►│           │              │               │               │           │          │
     │             │           │──POST /api/auth/login───►│               │               │           │          │
     │             │           │           │              │──login(req)──►│               │           │          │
     │             │           │           │              │               │──findByEmail()►│           │          │
     │             │           │           │              │               │◄──User─────────│           │          │
     │             │           │           │              │               │──matches()     │           │          │
     │             │           │           │              │               │──generateToken()──────────►│          │
     │             │           │           │              │               │◄──token────────────────────│          │
     │             │           │           │              │◄─AuthResponse─│               │           │          │
     │             │           │◄─{token,userId,name,role}│              │               │           │          │
     │             │           │──setToken()──────────────────────────────────────────────────────────────────►│
     │             │           │──setUser()───────────────────────────────────────────────────────────────────►│
     │             │◄──data────│           │              │               │               │           │          │
     │◄─MainTabs──►│           │           │              │               │               │           │          │
```

---

### Сценарий 2: Расчёт ИМТ и сохранение (UC-03, UC-04)

```
Пользователь  CalculatorScreen  units.js   bmiApi     BmiController  BmiServiceImpl  BmiRecord  BmiRecordRepository
     │               │              │          │             │               │             │             │
     │──Ввод вес,───►│              │          │             │               │             │             │
     │   рост(любые) │              │          │             │               │             │             │
     │──Рассчитать──►│              │          │             │               │             │             │
     │               │──toMetricWeight()──────►│             │               │             │             │
     │               │──toMetricHeight()──────►│             │               │             │             │
     │               │◄─metricW, metricH───────│             │               │             │             │
     │               │──calculate(w,h)─────────►            │               │             │             │
     │               │              │──POST /api/bmi/calculate (Bearer)─────►│             │             │
     │               │              │          │             │──calculateAndSave()─────────►             │
     │               │              │          │             │               │──calculateBmi(w,h)────────►│
     │               │              │          │             │               │◄─bmi value─────────────────│
     │               │              │          │             │               │──getCategory(bmi)─────────►│
     │               │              │          │             │               │◄─category──────────────────│
     │               │              │          │             │               │──save(BmiRecord)────────────────────►│
     │               │              │          │             │               │◄─saved record───────────────────────│
     │               │              │          │             │◄─BmiRecord────│             │             │
     │               │◄─{id,bmi,category}──────│             │               │             │             │
     │◄─отображение──│              │          │             │               │             │             │
```

---

### Сценарий 3: Оффлайн-режим — загрузка истории (UC-13)

```
Пользователь  HistoryScreen   bmiApi     apiClient     Сервер    AsyncStorage
     │               │           │             │            │           │
     │──Открыть──────►           │             │            │           │
     │  History       │          │             │            │           │
     │               │──getHistory()──────────►│            │           │
     │               │           │──GET /api/bmi/history───►│           │
     │               │           │             │     [недоступен]       │
     │               │           │◄─Network Error──────────────         │
     │               │◄─throw────│             │            │           │
     │               │──getItem(HISTORY_CACHE_KEY)──────────────────────►│
     │               │◄─{data, cachedAt}───────────────────────────────│
     │◄─список (кэш)─│           │             │            │           │
     │  + дата кэша  │           │             │            │           │
```

---

## 2. Диаграмма классов проектирования

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CONTROL LAYER                                │
├──────────────────────┬───────────────────┬───────────────────────────┤
│   AuthController     │   BmiController   │  UserController           │
│ @RestController      │ @RestController   │ @RestController           │
├──────────────────────┼───────────────────┼───────────────────────────┤
│ +register(req)       │ +calculate(req)   │ +getMe(auth)              │
│ +login(req)          │ +getHistory(auth) │ +updateMe(req, auth)      │
│                      │ +getStats(auth)   │                           │
│                      │ +getById(id,auth) │  AdminController          │
│                      │ +update(id,req,a) │ +getAllUsers(auth)         │
│                      │ +delete(id, auth) │                           │
│                      │ +search(cat,auth) │                           │
└─────────┬────────────┴────────┬──────────┴──────────┬────────────────┘
          │ IUserService         │ IBmiService          │ IUserService
          ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         MEDIATOR LAYER (impl)                        │
├─────────────────────────────┬────────────────────────────────────────┤
│   UserServiceImpl           │   BmiServiceImpl                       │
│   @Service @Transactional   │   @Service @Transactional              │
├─────────────────────────────┼────────────────────────────────────────┤
│ +register(req)              │ +calculateAndSave(userId, req)         │
│   existsByEmail() check     │   → BmiRecord.calculateBmi()           │
│   BCrypt.encode()           │   → BmiRecord.getCategory()            │
│   JwtUtil.generateToken()   │ +getHistory(userId)                    │
│ +login(req)                 │ +getById(id, userId)                   │
│   findByEmail()             │   → findByIdAndUserId() (owner check)  │
│   BCrypt.matches()          │ +updateRecord(id, userId, req)         │
│   JwtUtil.generateToken()   │   → BmiRecord.calculateBmi/getCategory │
│ +getUserById(id)            │ +deleteRecord(id, userId)              │
│ +updateProfile(id, req)     │ +getStats(userId)                      │
│ +getAllUsers()               │   → min/max/avg через Stream API       │
│                             │ +search(userId, category)              │
└────────┬────────────────────┴────────────────┬───────────────────────┘
         │ UserRepository                        │ BmiRecordRepository
         ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FOUNDATION LAYER                             │
├──────────────────────────────┬───────────────────────────────────────┤
│   UserRepository             │   BmiRecordRepository                 │
│   JpaRepository<User,Long>   │   JpaRepository<BmiRecord,Long>       │
├──────────────────────────────┼───────────────────────────────────────┤
│ +findByEmail(email)          │ +findByUserIdOrderByMeasuredAtDesc()  │
│ +existsByEmail(email)        │ +findByIdAndUserId(id, userId)        │
│ (inherited CRUD)             │ +findByUserIdAndCategory...()         │
│                              │ +countByUserId(userId)                │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Применение паттернов проектирования (GoF)

### Repository (Data Access Object)

`UserRepository` и `BmiRecordRepository` реализуют паттерн Repository: бизнес-логика (M) работает только с интерфейсами Spring Data JPA, конкретная реализация может быть заменена без изменения вышестоящих слоёв. Метод `findByIdAndUserId()` встраивает проверку владельца прямо в запрос.

### Template Method (`JwtFilter`)

`JwtFilter extends OncePerRequestFilter` — шаблонный метод Spring Security. Переопределяется `doFilterInternal()`: извлекает токен из заголовка `Authorization: Bearer <token>`, вызывает `JwtUtil.isValid()`, затем `extractEmail()` / `extractUserId()` / `extractRole()` и устанавливает `SecurityContextHolder`.

### Facade (`BmiServiceImpl`)

`BmiServiceImpl` — фасад, скрывающий за интерфейсом `IBmiService` сложность: расчёт через `BmiRecord.calculateBmi()`, определение категории через `BmiRecord.getCategory()`, работу с репозиторием и формирование ответа.

### Strategy (расчёт категории ИМТ)

Метод `BmiRecord.getCategory(double bmi)` реализует стратегию классификации: 7 последовательных условий по граничным значениям ВОЗ (16.0, 18.5, 25.0, 30.0, 35.0, 40.0).

---

## 4. Спецификация ключевых методов

### `BmiServiceImpl.calculateAndSave()`

```
Вход: userId: Long, req: BmiRequest {weight: Double (кг), height: Double (см)}

1. userRepository.findById(userId) → User (или RuntimeException)
2. bmi = BmiRecord.calculateBmi(req.weight, req.height)
     = Math.round((weight / (height/100)^2) * 10.0) / 10.0
3. category = BmiRecord.getCategory(bmi)  [7 градаций ВОЗ]
4. BmiRecord.builder()...build()
5. bmiRecordRepository.save(record) → @PrePersist устанавливает measuredAt
6. return сохранённая запись

Выход: BmiRecord (id, weight, height, bmi, category, measuredAt)
Исключения: RuntimeException("Пользователь не найден") → 500
```

### `UserServiceImpl.login()`

```
Вход: req: LoginRequest {email: String, password: String}

1. userRepository.findByEmail(req.email) → User
   или RuntimeException("Пользователь не найден")
2. passwordEncoder.matches(req.password, user.password)
   если false → RuntimeException("Неверный пароль")
3. jwtUtil.generateToken(email, userId, role.name())
   = HMAC-SHA подпись, claims: sub=email, userId, role, iat, exp
4. AuthResponse.builder().token(token).userId(id).name(name)
   .email(email).role(role.name()).build()

Выход: AuthResponse
Исключения: RuntimeException → 500 (обрабатывается глобально)
```

### `BmiServiceImpl.getStats()`

```
Вход: userId: Long

1. records = findByUserIdOrderByMeasuredAtDesc(userId)
2. Если пусто → BmiStatsResponse {totalMeasurements=0}
3. avg = Stream.mapToDouble(getBmi).average()
4. min = Stream.mapToDouble(getBmi).min()
5. max = Stream.mapToDouble(getBmi).max()
6. averageBmi = Math.round(avg * 10.0) / 10.0
7. currentCategory = records.get(0).getCategory()  [последнее измерение]

Выход: BmiStatsResponse {totalMeasurements, averageBmi, minBmi, maxBmi, currentCategory}
```

---

## 5. Схема обработки ошибок

| Ситуация | HTTP-статус | Причина |
|---|---|---|
| Неверный пароль / email не найден | 500 → рекомендуется 400/401 | `RuntimeException` без `@ExceptionHandler` |
| Отсутствует / недействительный JWT | 403 Forbidden | `JwtFilter` не устанавливает `SecurityContext` |
| Запрос к `/api/admin/**` с ролью USER | 403 Forbidden | `SecurityConfig.hasRole("ADMIN")` |
| Запись не найдена или чужая | 500 → рекомендуется 404 | `RuntimeException("Запись не найдена")` |
| Email уже зарегистрирован | 500 → рекомендуется 409 | `RuntimeException("Email уже зарегистрирован")` |
