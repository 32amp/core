# Auth

Контракт для аутентификации пользователей. Доступно 4 вида аутентификации: логин пароль, по емаилу, по телефону, через телеграм

## Структуры данных



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


## События

#### CreateAuthToken(uint256 user_id, uint token_id)

---

Выполняется во время создания токена аутентификации, нужно для того чтобы полностью пройти процесс авторизации

## Методы

#### initialize(uint256 _partner_id, address _hubAddress, bytes _tg_bot_token )

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

Регистрация по логину и паролю без привязки к какому либо подтверждению. Генерируется в результате событие CreateAuthToken, где нужно получить token_id и с помощью метода getAuthTokenByPassword уже получить готовый токен который можно будет использовать в других методах для получения доступа


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

Авторизация через телеграм API. Если успешно, генерируется событие CreateAuthToken, взяв значение token_id из этого события дальше можно через метод getAuthTokenByTG получить токен авторизации

Более подробно по использованию этого метода в примерах по использованию.
