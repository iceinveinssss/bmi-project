# 📱 IMT Калькулятор — Мобильное приложение

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)
![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📌 Общая информация

**Автор:** [Тугусова Мария Александровна]  
**Группа:** [ПИЖ-б-о-23-2]  
**Траектория:** Mobile  
**Дата начала:** [01.04.2026]  
**Дата сдачи:** [01.06.2026]

---

## 🧠 Описание проекта

IMT Калькулятор — это мобильное приложение для расчёта индекса массы тела (BMI/ИМТ).  
Пользователь вводит параметры тела, получает результат расчёта и категорию здоровья, а также может сохранять историю измерений.

Система состоит из мобильного клиента и серверной части с REST API и базой данных PostgreSQL.

---

## 📱 Траектория выполнения

- [ ] Веб-разработка (React + Spring Boot)  
- [ ] Десктоп  
- [x] Мобильная  
- [ ] Enterprise  

---

## 🧰 Технологический стек

### 📲 Мобильный клиент
- React Native 0.81.5
- Expo ~54.0.33

### 🖥 Бэкенд
- Java 17
- Spring Boot 3.2.0
- Spring Security (JWT + BCrypt)

### 🗄 База данных
- PostgreSQL (bmi_db)

### ⚙️ Дополнительно
- JPA / Hibernate
- REST API + OpenAPI (Swagger)
- JUnit 5 + MockMvc + H2
- JaCoCo (~48% coverage)

---

## 🏗 Архитектура (PCMEF)

- **P (Presentation)** — React Native экраны  
- **C (Control)** — REST контроллеры  
- **M (Mediator)** — бизнес-логика  
- **E (Entity)** — доменные сущности  
- **F (Foundation)** — репозитории  

---

## 📦 Структура проекта


backend/
├── control/
├── mediator/
├── mediator/impl/
├── entity/
├── foundation/
├── dto/
├── security/
└── config/

frontend/
├── screens/
├── api/
├── context/
├── navigation/
├── storage/
├── theme/
└── utils/


---

## 🔌 REST API

| Метод | Endpoint | Описание |
|------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/users/me` | Профиль |
| PUT | `/api/users/me` | Обновить профиль |
| POST | `/api/bmi/calculate` | Расчёт ИМТ |
| GET | `/api/bmi/history` | История |
| GET | `/api/bmi/stats` | Статистика |
| DELETE | `/api/bmi/{id}` | Удаление |

📘 Swagger UI: http://localhost:8082/swagger-ui.html  
📘 OpenAPI: http://localhost:8082/api-docs  

---

## 🚀 Быстрый старт

### 📌 База данных

```bash
psql -U postgres -c "CREATE DATABASE bmi_db;"
psql -U postgres -c "ALTER USER postgres PASSWORD '123';"
🖥 Бэкенд
cd backend
mvn spring-boot:run

📍 http://localhost:8082

📱 Мобильное приложение
cd frontend
npm install
npx expo start
🧪 Тесты
cd backend
mvn test

📊 JaCoCo: target/site/jacoco/index.html

📊 Статистика разработки
Метрика	Значение
Коммиты	[заполнить]
Период разработки	[даты]
Покрытие тестами	~48%
👤 Автор
ФИО: [ФИО]
Группа: [номер]
GitHub: [username]
Email: [email]
