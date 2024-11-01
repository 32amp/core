# Connector
Контракт коннектора зарядной станции

## Структуры данных

Включает в себя типы из [DataTypes](./DataTypes.md)

#### struct output
---
Структура вывода коннектора зарядной станции

```
    struct output {
        uint256 id;
        uint256 last_updated;
        Connector connector;
        ConnectorStatus status;
        ITariff.OutputLight[] tariffs;
    }
```
## События

#### AddConnector(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id )
---
Вызывается при успешном выполнении добавления коннектора зарядной станции
    
#### getVersion() returns(string)
---
Получить версию контракта

#### add(bytes32 _token, Connector connector, uint256 evse_id)
---
Добавить коннектора для зарядной станции

#### get(uint256 id) returns (output)
---
Получить данные по коннектору

#### exist(uint256 id) returns(bool)
---
Проверить существование коннектора

#### function setTariffs(bytes32 _token, uint256 id, uint256[] calldata _tariffs)
---
Установить тариф для конектора.  Для добавления тарифа смотри документацию [Tariff](./Tariff.md)
Если тариф не установлен, то будет использоваться тариф с id 1 который означает что зарядка будет бесплатной.