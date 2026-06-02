# ИМТ Калькулятор — Мобильное приложение

**Автор:** [Тугусова Мария Александровна]  
**Группа:** [ПИЖ-б-о-23-2(1)]  
**Траектория:** Mobile  
**Дата начала:** [01.04.2026]  
**Дата сдачи:** [01.06.2026]

Курсовой проект по дисциплине «Программная инженерия». Архитектура: PCMEF.

---

## Описание проекта

Мобильное приложение для расчёта индекса массы тела (ИМТ) с сохранением истории измерений, ведением профиля и просмотром статистики. Поддерживает метрическую и имперскую системы единиц, работает офлайн с кэшированием.

---

## Траектория выполнения

- [ ] Веб-разработка
- [ ] Десктоп
- [x] **Мобильная** (React Native + Expo)
- [ ] Enterprise

---

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Мобильный клиент | React Native 0.81.5 + Expo ~54.0.33 |
| Бэкенд | Java 17 + Spring Boot 3.2.0 |
| База данных | PostgreSQL 15+ |
| ORM | Spring Data JPA + Hibernate |
| Безопасность | JWT + BCrypt |
| API документация | OpenAPI 3 / Swagger UI |
| Тесты | JUnit 5 + MockMvc + H2 |
| Покрытие | JaCoCo 0.8.11 (48%) |
| Сборка | Maven, Expo CLI |
| Инструменты | Git, Postman, SonarQube |

---

## Требования к окружению

| Требование | Версия |
|------------|--------|
| Java JDK | 17+ |
| Node.js | 18+ |
| PostgreSQL | 15+ |
| Maven | 3.8+ |
| Expo CLI | latest |

---

## Установка и запуск

### 1. Клонирование

```bash
git clone https://github.com/username/bmi-calculator.git
cd bmi-calculator

### 2.База данных
Linux:

bash
sudo -u postgres psql -c "CREATE DATABASE bmi_db;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '123';"
macOS / Windows:

bash
psql -U postgres -c "CREATE DATABASE bmi_db;"
psql -U postgres -c "ALTER USER postgres PASSWORD '123';"
Таблицы создаются автоматически при первом запуске бэкенда.

###3. Бэкенд
bash
cd backend
mvn spring-boot:run
Сервис	URL
Бэкенд	http://localhost:8082
Swagger UI	http://localhost:8082/swagger-ui.html
###4. Мобильное приложение
bash
cd frontend
npm install
npx expo start
Отсканируйте QR-код приложением Expo Go (доступно в App Store и Google Play).

###5. Тесты
bash
cd backend
mvn test
Отчёт о покрытии JaCoCo: target/site/jacoco/index.html

