# User

Контракт для работы с пользователями. Это абстракция создана для того чтобы отделить всех пользователей от EOA аккаунтов. т.е. пользователь может иметь сколько угодно EOA аккаунтов, но в используя этот контракт всегда попадать в свой аккаунт. Это нужно для того чтобы пользователь не сталкивался с созданием классического EOA аккаунта, а работал с привычными системами аутентификации, такие как: аутентификация по паролю, емаилу, номеру телефона, телеграм аутентификация. 

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
        string name;
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

#### enum TokenType
---

Тип токена авторизации

```
    enum TokenType {
        None,
        AD_HOC_USER, // одноразовый токен
        APP_USER, // токен полученный при регистрации в пользовательском приложении
        OTHER, // просто зарезервирован
        RFID // для авторизации на станциях с помощью RFID
    }
```

#### struct AuthToken
---
Структура токена авторизации который выдается для любого метода авторизации
```
    struct AuthToken {
        uint256 user_id;
        bytes32 uid;
        TokenType _type;
        uint visual_number; // используется для отображения на экранах ЭЗС 
        bytes32 issuer;
        string group_id; // Токен может принадлежать целой группе
        uint256 date_start; 
        uint256 date_expire;
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

#### struct WebAppUserData
---
Используется для аутентификации через Telegram

```
    struct WebAppUserData{
        uint64 id;
        bytes32 first_name;
        bytes32 last_name;
        bytes32 language_code;
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

## События

#### CreateAuthToken(uint256 user_id, uint token_id)
---
Выполняется во время создания токена аутентификации, нужно для того чтобы полностью пройти процесс авторизации

## Методы

#### initialize(uint256 _partner_id, address _hubAddress, bytes32 sudoUsername, bytes sudopassword, bytes  _tg_bot_token )
---
Инициализация контракта модуля, вызывается один раз. Создается первый пользователь с максимальными правами, а так же добавляется ключ авторизации для телеграм аутентификации

#### setTestUserByPhone(bytes32 phone_number, bytes32 code)
---
Установить тестовый номер телефона с тестовым кодом авторизации. Нужно для тестирования 


#### setTestUserByEmail(bytes32 email, bytes32 code)
---

Установить тестовую почту с тестовым кодом авторизации. Нужно для тестирования

#### registerByPassword(bytes32 username, bytes password)
---
Регистрация по логину и паролю без привязки к какому либо подтверждению. Генерируется в результате событие  CreateAuthToken, где нужно получить token_id и с помощью метода getAuthTokenByPassword уже получить готовый токен который можно будет использовать в других методах для получения доступа

#### authByPassword(bytes32 username, bytes pass)
---

Авторизация по логину и паролю. Генерируется в результате событие  CreateAuthToken, где нужно получить token_id и с помощью метода getAuthTokenByPassword уже получить готовый токен который можно будет использовать в других методах для получения доступа

#### getAuthTokenByPassword(bytes32 username, bytes pass, uint token_id) returns(AuthToken, bytes32)
---

Метод для получения токена авторизации если аутентификация была через пароль который используется для доступа в других методах


#### getAuthTokenBySMS(bytes32 phone_number, bytes32 code,uint token_id) returns (AuthToken, bytes32)
--- 

Метод для получения токена авторизации если аутентификация была через смс который используется для доступа в других методах

#### function getAuthTokenByEmail(bytes32 email, bytes32 code,uint token_id) returns (AuthToken, bytes32)
---

Метод для получения токена авторизации если аутентификация была через email который используется для доступа в других методах

#### function getAuthTokenByTG(bytes payload, bytes32 _hash, WebAppUserData user_data, uint token_id) returns (AuthToken, bytes32)

Метод для получения токена авторизации если аутентификация была через телеграм который используется для доступа в других методах

#### isLogin(bytes32 _token) returns (uint256)
---

Проверяет валидность токена и в случае успеха, возвращает id пользователя.

#### whoami(bytes32 _token) returns (User)
---

Получение данных профиля по токену авторизации

#### getUser(bytes32 _token, uint256 _user_id) returns (User)
---
Получение данных любого профиля по id если у пользователя который запрашивает ифнормацию есть доступ к модулю User

#### sendSmsForAuth(bytes32 recipient)
---

Отправка смс с кодом на номер

#### authBySmsCode(bytes32 phone_number, bytes32 code)
---

Подтверждение отправленного кода, если успешно, то генерируется событие CreateAuthToken, взяв значение token_id из этого события дальше можно через метод getAuthTokenBySMS получить токен авторизации

#### sendEmailForAuth(bytes32 recipient)
---
Отправка письма на email с кодом авторизации

#### authByEmailCode(bytes32 email, bytes32 code)
---

Подтверждение отправленного кода, если успешно, то генерируется событие CreateAuthToken, взяв значение token_id из этого события дальше можно через метод getAuthTokenByEmail получить токен авторизации

#### authByTg(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data )
---

Авторизация через телеграм API, если успешно, то генерируется событие CreateAuthToken, взяв значение token_id из этого события дальше можно через метод getAuthTokenByTG получить токен авторизации

Более подробно по использованию этого метода в примерах по использованию.


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
