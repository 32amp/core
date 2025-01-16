# EVSE

## Структуры данных
Включает в себя типы из [DataTypes](./DataTypes.md)

#### struct EVSEMeta
---
Используется для добавления расширенных данных для зарядной станции
```
    struct EVSEMeta {
        StatusSchedule[] status_schedule;
        Capabilities[] capabilities;
        GeoLocation coordinates;
        ParkingRestriction[] parking_restrictions;
        int8 floor_level;
    }
```

#### struct outEVSE
---
Структура вывода зарядной станции
```
    struct outEVSE {
        EVSE evse;
        EVSEMeta meta;
        EVSEStatus evses_status;
        uint256 location_id;
        uint256 last_updated;
        Image[] images;
        IConnector.output[] connectors;
    }
```


## События

#### AddEVSE(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id )
---
Вызывается при добавлении зарядной станции


## Методы
#### getVersion() returns(string memory)
---
Получение версии контракта

#### exist(uint256 id) view returns(bool)
---
Проверка существования зарядной станции

#### add(bytes32 _token, EVSE calldata evse, uint256 location_id)
---
Добавить зарядную станцию

#### setMeta(bytes32 _token, uint256 id, EVSEMeta calldata meta)
---
Установить метаданные для зарядной станции

#### addImage(bytes32 _token, uint256 id, Image calldata image )
---
Добавить изображение зарядной станции

#### removeImage(bytes32 _token, uint256 id, uint image_id)
---
Удалить изображение у зарядной станции

#### setStatus(bytes32 _token, uint256 id, EVSEStatus status)
---
Установить статус зарядной станции

#### addConnector(bytes32 _token, uint256 evse_id,  uint256 connector_id )
---
Добавить коннектор к зарядной станции

#### removeConnector(bytes32 _token, uint256 evse_id, uint connector_id)
---
Удалить коннектор от зарядной станции

#### get(uint256 id) view returns(outEVSE memory)
---
Получить данные по зарядной станции 