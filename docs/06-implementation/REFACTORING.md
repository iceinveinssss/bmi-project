# Этап 6: Рефакторинг и качество кода

**Проект:** ИМТ Калькулятор  
**Недели:** 13–14

---

## 1. Data Mapper (обязательный паттерн)

### Проблема

Без Data Mapper контроллеры могли бы возвращать JPA-сущности напрямую (`User`, `BmiRecord`), что ведёт к утечке внутренней структуры: поле `password` попало бы в JSON-ответ.

### Решение

Введены DTO-классы, полностью изолирующие внутреннее представление от API-ответа.

**Защита поля `password`:** двойная защита — аннотация `@JsonIgnore` на поле в `User.java` и возврат через `AuthResponse` (никогда не содержит пароль):

```java
// User.java — слой E
@JsonIgnore
@Column(nullable = false)
private String password;
```

```java
// UserServiceImpl.java — слой M
// login() никогда не возвращает User напрямую:
return AuthResponse.builder()
    .token(token)
    .userId(user.getId())
    .name(user.getName())
    .email(user.getEmail())
    .role(user.getRole().name())
    .build();
```

**Защита связи `bmiRecords` у User:**

```java
// User.java — слой E
@JsonIgnore
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<BmiRecord> bmiRecords;
```

**Защита обратной ссылки `user` у BmiRecord:**

```java
// BmiRecord.java — слой E
@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private User user;
```

### DTO-классы проекта

| DTO | Направление | Поля |
|---|---|---|
| `RegisterRequest` | Client → Server | name, email, password, birthYear? |
| `LoginRequest` | Client → Server | email, password |
| `AuthResponse` | Server → Client | token, userId, name, email, role |
| `UpdateProfileRequest` | Client → Server | name?, birthYear? |
| `BmiRequest` | Client → Server | weight (кг), height (см) |
| `BmiStatsResponse` | Server → Client | totalMeasurements, averageBmi, minBmi, maxBmi, currentCategory |

---

## 2. Identity Map (обязательный паттерн)

### Реализация через JPA PersistenceContext + `@Transactional`

Все методы `BmiServiceImpl` и `UserServiceImpl` аннотированы `@Transactional`. В рамках одной транзакции JPA `PersistenceContext` выступает как Identity Map: при повторном обращении к сущности по тому же `id` возвращается объект из кэша первого уровня, а не выполняется повторный SQL-запрос.

```java
@Service @RequiredArgsConstructor @Transactional      // Identity Map на уровне транзакции
public class BmiServiceImpl implements IBmiService {

    @Override
    public BmiRecord updateRecord(Long id, Long userId, BmiRequest req) {
        BmiRecord record = getById(id, userId);        // 1-й запрос → кэшируется в PersistenceContext
        record.setWeight(req.getWeight());
        record.setHeight(req.getHeight());
        double bmi = BmiRecord.calculateBmi(req.getWeight(), req.getHeight());
        record.setBmi(bmi);
        record.setCategory(BmiRecord.getCategory(bmi));
        return bmiRecordRepository.save(record);       // UPDATE, не повторный SELECT
    }
}
```

Методы только на чтение помечены `@Transactional(readOnly = true)`:

```java
@Override @Transactional(readOnly = true)
public List<BmiRecord> getHistory(Long userId) { ... }

@Override @Transactional(readOnly = true)
public BmiStatsResponse getStats(Long userId) { ... }
```

---

## 3. Lazy Load (рекомендуемый паттерн)

`FetchType.LAZY` применён на обеих сторонах связи:

```java
// BmiRecord.java — связь к User загружается только при явном обращении
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private User user;

// User.java — список записей не загружается при запросе профиля
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<BmiRecord> bmiRecords;
```

При запросе `GET /api/users/me` SQL-запрос к `bmi_records` не выполняется — коллекция не нужна для ответа.

---

## 4. Статический анализ и исправленные замечания

| Категория | Проблема | Исправление |
|---|---|---|
| Безопасность | Пароль мог попасть в JSON | `@JsonIgnore` на `password` + возврат через `AuthResponse` |
| Безопасность | Доступ к чужим записям | `findByIdAndUserId(id, userId)` — owner check на уровне SQL |
| Архитектура | Бизнес-логика расчёта ИМТ | Вынесена в статические методы `BmiRecord.calculateBmi/getCategory()` (слой E) |
| Архитектура | Прямой доступ к репозиторию из C | Весь доступ через интерфейсы `IBmiService` / `IUserService` |
| Качество | Дублирование `getById()` в нескольких методах | Переиспользование приватного `getById(id, userId)` в `update` и `delete` |
| Производительность | Загрузка всех связей при каждом запросе | `FetchType.LAZY` на `User.bmiRecords` и `BmiRecord.user` |
| Код | Boilerplate геттеры/сеттеры/конструкторы | Lombok: `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @RequiredArgsConstructor` |

---

## 5. Итоговые показатели качества

| Метрика | Значение |
|---|---|
| Java-классов серверной части | ~18 |
| Интерфейсов PCMEF (контракты) | 2 (`IBmiService`, `IUserService`) |
| DTO-классов | 6 |
| Нарушений правила однонаправленных зависимостей | 0 |
| Циклических зависимостей | 0 |
| Методов с `@Transactional(readOnly=true)` | 4 (`getHistory`, `getById`, `getStats`, `search`, `getUserById`, `getAllUsers`) |
| Покрытие JaCoCo (интеграционные тесты) | ≥ 40% |
