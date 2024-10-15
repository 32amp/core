# HUB

Точка входа всего сервиса, имеет следующие методы

#### initialize(addService[] memory _services) void
--- 
Вызывается после деплоя контракта, инициализирует весь контракт. Добавляет доступные сервисы.

#### getService(string name) returns(address)

---

Возвращает адрес контакта сервиса. Доступные сервисы: EmailService,SMSService,Currencies

#### registerPartner(bytes32 name, bytes2 country_code, bytes3 party_id) void
---

Добавляет нового партнера в систему, где:

> name - Имя партнера

> country_code - код страны, например RU для россии.

> party_id - уникальный идентификатор партнера внутри страны

При успешном выполнении происходит событие:

> AddPartner(uint256 id, bytes2 country_code, bytes3 party_id, address owner_address);

#### addModule(string memory name, address contractAddress) void
---

Добавляет модуль к партнеру. Доступные модули:

1) User
2) UserGroups
3) UserAccess
4) Tariff
5) Location
6) LocationSearch
7) EVSE
8) Connector

#### changeModuleAddress(string memory name, address contractAddress) void
---

Измение адреса модуля, нужно в случае если будет производится глобальное обновление модуля и надо будет изменить адрес.

#### getModule(string memory name, uint256 partner_id)  returns (address)
---
Метод для получения адреса модуля для конткретного партнера


#### function checkModuleExist(string memory name, uint256 partner_id) returns (address)
---
Проверяет реализован ли модуль у конкретного партнера

#### getPartnerModules(uint256 partner_id) returns (string[] memory)
--- 
Список реализованых модулей у каждого партнера

#### getPartners() returns(IHub.Member[] memory)
---
Список партнеров в хабе. Возвращает массив объекта Member:

```
    struct Member {
        uint256 id;
        bytes2 country_code;
        bytes3 party_id;
        bytes32 name;
        Roles[] role;
        ConnectionStatus status;
        address owner_address;
        uint256 last_updated;
    }
```

#### me() returns(IHub.Member memory)

Возвращает информацию о партнере в контексте msg.sender, т.е. профиль от того аккаунта, от которого приходит запрос

#### getPartnerByAddress(address partner_address) returns(IHub.Member memory)


## Объекты и перечисления

#### struct Member
---

Структура членов хаба, т.е. партнеров. 

```
    struct Member {
        uint256 id;
        bytes2 country_code;
        bytes3 party_id;
        bytes32 name;
        Roles[] role;
        ConnectionStatus status;
        address owner_address;
        uint256 last_updated;
    }
```

#### enum ConnectionStatus
---

Список статусов у члена хаба

```
    enum ConnectionStatus {
        None,
        CONNECTED,
        OFFLINE,
        PLANNED,
        SUSPENDED
    }
```

#### enum Roles
---
Список ролей которое может быть у члена. По этому списку мы можем понять что это за участник, допустим если у него только роль EMSP, то это означает что этот член хаба предоставляет услуги мобильного приложения для конечного клиента, но не является оператором.

```
    enum Roles {
        None,
        CPO,
        EMSP,
        HUB,
        NSP,
        SCSP
    }
```


#### struct addService
---

Используется для добавления сервисов при инициализации

```
    struct addService {
        string name;
        address contract_address;
    }
```