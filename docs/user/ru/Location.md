# Location

Модуль отвечающий за создание локаций где размещены зарядные станции

## Структуры данных

Включает в себя типы из [DataTypes](./DataTypes.md)

#### struct GeoLocationString
---
Структура, используемая при добавлении станции. Особенность ее в том, что она
использует тип string - это нужно для алгоритма поиска в контакте [LocationSearch](./LocationSearch.md)

```
    struct GeoLocationString {
        string latitude;
        string longtitude;
    }
```

#### struct Add
---
Структура используемая для добавления локации

```
    struct Add {
        string name;
        string _address;
        bytes32 city;
        bytes32 postal_code;
        bytes32 state;
        bytes32 country;
        GeoLocationString coordinates;
        ParkingType parking_type;
        Facility[] facilities;
        string time_zone;
        bool charging_when_closed;
        bool publish;
    }
```

#### struct outLocation
---
Структура используемая для вывода информации о локации

```
    struct outLocation {
        Location location;
        AdditionalGeoLocation[] related_locations;
        Image[] images;
        Hours opening_times;
        DisplayText[] directions;
        IEVSE.outEVSE[] evses;
    }
```

## События

#### AddLocation(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id )
---
Вызывается при добавлении новой локации

## Методы

#### getVersion() returns(string memory)
---
Получить текущую версию 

#### addLocation(bytes32 _token, Add memory add)
---
Добавить новую локацию.


#### getLocation(uint256 id) view returns (outLocation memory)
---
Получить информацию о локации по id

#### exist(uint256 location_id) returns(bool)
---
Узнать существует ли локация


#### addRelatedLocation(bytes32 _token, uint256 location_id, AdditionalGeoLocation calldata add )
---
Добавить дополнительную локацию

#### removeRelatedLocation(bytes32 _token, uint256 location_id, uint loc_id)
---
Удалить дополнительную локацию

#### addImage(bytes32 _token, uint256 location_id, Image calldata add )
---
Добавить изображение для локации

#### removeImage(bytes32 _token, uint256 location_id, uint image_id)
---
Удалить изображение для локации

#### addDirection( bytes32 _token, uint256 location_id, DisplayText calldata add )
---
Добавить описание на конкретном языке

#### removeDirection( bytes32 _token, uint256 location_id, uint direction_id)
---
Удалить описание на конкретном языке

#### setOpeningTimes( bytes32 _token, uint256 location_id, Hours calldata add )
---
Установить режим работы локации

#### addEVSE( bytes32 _token, uint256 location_id, uint256 add )
---
Привязать зарядную станцию к локации

#### removeEVSE(bytes32 _token, uint256 location_id, uint evse)
---
Отвязать зарядную станцию от локации
