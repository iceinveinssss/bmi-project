# Этап 3: Проектирование базы данных

**Проект:** ИМТ Калькулятор  
**Недели:** 7–8

---

## 1. ER-диаграмма (логическая модель)

```
┌──────────────────────────────────┐         ┌───────────────────────────────────┐
│             users                │         │           bmi_records             │
├──────────────────────────────────┤         ├───────────────────────────────────┤
│ PK  id          BIGSERIAL        │         │ PK  id           BIGSERIAL        │
│     email       VARCHAR(100)     │         │ FK  user_id      BIGINT NOT NULL  │
│     password    VARCHAR(255)     │  1  *   │     weight       DOUBLE PRECISION │
│     name        VARCHAR(100)     │─────────│     height       DOUBLE PRECISION │
│     birth_year  INTEGER          │         │     bmi          DOUBLE PRECISION │
│     role        VARCHAR(10)      │         │     category     VARCHAR(50)      │
│     created_at  TIMESTAMP        │         │     measured_at  TIMESTAMP        │
└──────────────────────────────────┘         └───────────────────────────────────┘

Связь: users (1) ──── (*) bmi_records
  • Один пользователь имеет множество записей ИМТ.
  • ON DELETE CASCADE: при удалении пользователя удаляются все его записи.
  • Поле updated_at отсутствует: BmiRecord содержит только measured_at (@PrePersist).
```

---

## 2. Физическая модель данных

### Таблица `users`

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Авто-инкрементный идентификатор |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Email — логин пользователя |
| `password` | VARCHAR(255) | NOT NULL | BCrypt-хеш пароля (`@JsonIgnore`) |
| `name` | VARCHAR(100) | NOT NULL | Имя пользователя |
| `birth_year` | INTEGER | — | Год рождения (необязательно) |
| `role` | VARCHAR(10) | NOT NULL, DEFAULT 'USER' | Роль: `USER` или `ADMIN` |
| `created_at` | TIMESTAMP | NOT NULL | Дата регистрации (`@PrePersist`) |

**Индексы:**
- `PRIMARY KEY (id)`
- `UNIQUE (email)` — для `findByEmail()` и `existsByEmail()`

### Таблица `bmi_records`

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Авто-инкрементный идентификатор |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` | Владелец записи |
| `weight` | DOUBLE PRECISION | NOT NULL | Вес в кг (всегда метрические) |
| `height` | DOUBLE PRECISION | NOT NULL | Рост в см (всегда метрические) |
| `bmi` | DOUBLE PRECISION | NOT NULL | Значение ИМТ (округлено до 0.1) |
| `category` | VARCHAR(50) | NOT NULL | Категория из `BmiRecord.getCategory()` |
| `measured_at` | TIMESTAMP | NOT NULL | Дата измерения (`@PrePersist`) |

**Индексы:**
- `PRIMARY KEY (id)`
- `INDEX (user_id)` — для `findByUserIdOrderByMeasuredAtDesc()`
- `INDEX (user_id, category)` — для `findByUserIdAndCategoryContainingIgnoreCase...`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

---

## 3. DDL-скрипты (`init.sql`)

```sql
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(100) NOT NULL,
    birth_year INTEGER,
    role       VARCHAR(10)  NOT NULL DEFAULT 'USER'
                            CHECK (role IN ('USER','ADMIN')),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Таблица записей ИМТ
CREATE TABLE IF NOT EXISTS bmi_records (
    id          BIGSERIAL         PRIMARY KEY,
    user_id     BIGINT            NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
    weight      DOUBLE PRECISION  NOT NULL,
    height      DOUBLE PRECISION  NOT NULL,
    bmi         DOUBLE PRECISION  NOT NULL,
    category    VARCHAR(50)       NOT NULL,
    measured_at TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bmi_user_id
    ON bmi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_bmi_user_category
    ON bmi_records(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bmi_measured_at
    ON bmi_records(user_id, measured_at DESC);

-- Администратор по умолчанию (пароль: admin123)
INSERT INTO users (name, email, password, role)
VALUES (
    'Администратор',
    'admin@bmi.ru',
    '$2a$10$xCGBDkHoBuJwXijGv.OzEOMWe3sCYiUMBj9bPqrHc2HtXzlexqFVe',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;
```

---

## 4. Нормализация

**1НФ:** Все атрибуты атомарны, повторяющихся групп нет.

**2НФ:** Таблицы имеют простые первичные ключи (BIGSERIAL); частичных зависимостей нет.

**3НФ:** Транзитивных зависимостей нет. Поле `category` технически зависит от `bmi` (вычисляемое), однако хранится денормализованно намеренно: для производительности выборки и возможности фильтрации по индексу `(user_id, category)` без пересчёта.

---

## 5. Стратегия ORM (маппинг Entity → таблицы)

### `User.java` → таблица `users`

```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BmiRecord> bmiRecords;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public int getAge() {
        if (birthYear == null) return 0;
        return LocalDateTime.now().getYear() - birthYear;
    }
}
```

### `BmiRecord.java` → таблица `bmi_records`

```java
@Entity
@Table(name = "bmi_records")
public class BmiRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false) private Double weight;
    @Column(nullable = false) private Double height;
    @Column(nullable = false) private Double bmi;
    @Column(nullable = false, length = 50) private String category;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    @PrePersist
    protected void onCreate() { measuredAt = LocalDateTime.now(); }

    // Бизнес-методы в слое Entity:
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
}
```

**Стратегия загрузки:** `FetchType.LAZY` на обеих сторонах связи — данные загружаются только при явном обращении.

**`ddl-auto`:** Установлен `update` — Hibernate обновляет схему при запуске. Для продакшена рекомендуется `validate`.

---

## 6. Методы репозиториев и генерируемые запросы

| Метод | SQL-запрос |
|---|---|
| `findByUserIdOrderByMeasuredAtDesc(userId)` | `SELECT * FROM bmi_records WHERE user_id=? ORDER BY measured_at DESC` |
| `findByIdAndUserId(id, userId)` | `SELECT * FROM bmi_records WHERE id=? AND user_id=?` — защита от доступа к чужим записям |
| `findByUserIdAndCategoryContainingIgnoreCaseOrderByMeasuredAtDesc(userId, category)` | `SELECT * FROM bmi_records WHERE user_id=? AND LOWER(category) LIKE LOWER('%?%') ORDER BY measured_at DESC` |
| `countByUserId(userId)` | `SELECT COUNT(*) FROM bmi_records WHERE user_id=?` |
| `findByEmail(email)` | `SELECT * FROM users WHERE email=?` |
| `existsByEmail(email)` | `SELECT COUNT(*)>0 FROM users WHERE email=?` |
