# User

 
Контракт для работы с пользователями, работает совместно с контрактом Auth. Это абстракция создана для того чтобы отделить всех пользователей от EOA аккаунтов. т.е. пользователь может иметь сколько угодно EOA аккаунтов, но в используя этот контракт всегда попадать в свой аккаунт. Это нужно для того чтобы пользователь не сталкивался с созданием классического EOA аккаунта, а работал с привычными системами аутентификации, такие как: аутентификация по паролю, емаилу, номеру телефона, телеграм аутентификация.

## Структуры данных

#### enum TypeUser

---

Аккаунты разделяются на обычные и аккаунты компании

```
    enum TypeUser {
        DEFAULT, 
        COMPANY
    }
```

#### struct User

---

Структура всего объекта пользователя, содержит все основные данные по пользователю.

```
    struct User {
        uint256 id;
        bytes32 phone;
        bytes32 email;
        bytes32 username;
        bytes32 first_name;
        bytes32 last_name;
        uint256 tg_id; // Telegram ID
        bytes32 language_code;
        TypeUser user_type;
        bool enable; 
        uint256 last_updated;
    }
```

#### struct Company

---

Стандартные обязательные поля для идентификации организации

```
    struct Company {
        string name;
        string description;
        uint256 inn;
        uint256 kpp;
        uint256 ogrn;
        uint256 bank_account;
        string bank_name;
        uint256 bank_bik;
        uint256 bank_corr_account;
        uint256 bank_inn;
        uint256 bank_kpp_account;
    }
```


#### struct CarData

---

Структура для данных по автомобилям которые добавляет пользователь в пользовательском приложении.

```
    struct CarData {
        string brand;
        string model;
        uint8[] connectors;
    }
```

## Методы

#### initialize(uint256 _partner_id, address _hubAddress )

---

Инициализация контракта модуля, вызывается один раз


#### whoami(bytes32 _token) returns (User)

---

Получение данных профиля по токену авторизации


#### getUser(bytes32 _token, uint256 _user_id) returns (User)

---

Получение данных любого профиля по id если у пользователя который запрашивает ифнормацию есть доступ к модулю User


#### updateBaseData(bytes32 _token, uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code)

---

Метод по обновлению собственных данных профиля


#### addCar(bytes32 _token, uint256 user_id, CarData memory car_data)

---

Добавление машины в профиль пользователя. Если user_id == 0, то добавляться будет к пользователю который вызывает метод, иначе проверяется доступ к модулю User.


#### removeCar(bytes32 _token, uint256 user_id, uint _index)

---

Удаление машины из профиля пользователя. Если user_id == 0, то удаляться будет у пользователя который вызывает метод, иначе проверяется доступ к модулю User.


#### getCars(bytes32 _token, uint256 user_id) returns(CarData[] memory)

---

Получение списка автомобилей у пользователя. Если user_id == 0, то возвращяется список автомобилей пользователя который вызывает метод, иначе проверяется доступ к модулю User.


#### updateCompanyInfo(bytes32 _token, uint256 user_id, Company memory company_data)

---

Обновление данных о компании в профиле пользователя. Если user_id == 0, то обновляются данные пользователя который вызывает метод, иначе проверяется доступ к модулю User.

Если до этого пользователь был с типом DEFAULT, то после вызова метода тип пользователя меняется на COMPANY


#### getCompanyInfo(bytes32 _token, uint256 user_id) returns(Company memory)

---

Получение данных о компании в профиле пользователя. Если user_id == 0, то возвращаются данные пользователя который вызывает метод, иначе проверяется доступ к модулю User.
