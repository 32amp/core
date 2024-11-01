# LocationSearch

Контракт для поиска локаций с зарядными станциями. 


## Структуры данных

#### 
---
Используется в методе inArea для поиска с фильтрацией локаций с зарядными станциями

```
    struct inAreaInput {
        string topRightLat;
        string topRightLong;
        string bottomLeftLat;
        string bottomLeftLong;
        uint64 offset;
        uint8[] connectors; 
        bool onlyFreeConnectors; 
        bool publish;
        uint256 max_payment_by_kwt;
        uint256 max_payment_buy_time;
        uint256[] favorite_evse;
    }
```

#### struct inAreaOutput
---
Вывод найденной координаты в результате запроса, используется дальше пользовательским интерфейсом для отрисовки точки на карте.

```
    struct inAreaOutput {
        uint256 id;
        GeoLocation coordinates;
    }
```

## Методы

#### getVersion() returns(string)
---
Получение версии контракта

#### inArea(inAreaInput input) external view returns (inAreaOutput[], uint256)
---
Поиск локаций в определенной области

#### addLocationToIndex(int16 lat, int16 lon, uint256 location_id)
---
Добавление локации в индекс поиска, вызывается контактом Location в момент добавления локации
