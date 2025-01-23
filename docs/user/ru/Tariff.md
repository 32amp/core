# Tariff

Тарифы для коннектора зарядной станции. Каждому коннектору нужно устанавливать тариф по которому будет работать логика расчета стоимости зарядной сессии.

## Структуры данных

Включает в себя типы из [DataTypes](./DataTypes.md)

#### enum DayOfWeek
---
Дни недели при которых тариф будет действовать
```
    enum DayOfWeek {
        None,
        MONDAY,
        TUESDAY,
        WEDNESDAY,
        THURSDAY,
        FRIDAY,
        SATURDAY,
        SUNDAY
    }
```

#### enum TariffDimensionType
--- 
Тип компонента тарифа, это нужно для того чтобы явно указать за что будет взиматься плата. FLAT означает фиксированную оплату вне зависимости от того, на сколько ты зарядился
```
    enum TariffDimensionType {
        ENERGY,
        FLAT,
        PARKING_TIME,
        TIME
    }
```

#### enum ReservationRestrictionType
---
Используется в TariffRestrictions 

```
    enum ReservationRestrictionType {
        None,
        RESERVATION,
        RESERVATION_EXPIRES
    }
```

#### enum TariffType
---
Определяет тип тарифа. Это позволяет различать в случае заданных настроек тарификации. Если не указано, этот тариф действителен для всех сессий.


```
    enum TariffType {
        AD_HOC_PAYMENT,
        PROFILE_CHEAP,
        PROFILE_FAST,
        PROFILE_GREEN,
        REGULAR
    }
```

#### struct Output
---
Структура вывода тарифа зарядной станции

```
    struct Output {
        bytes2 country_code;
        bytes3 party_id;
        uint256 id;
        uint256 last_updated;
        Tariff tariff;
        Price min_price;
        Price max_price;
        uint256 start_date_time;
        uint256 end_date_time;
        EnergyMix energy_mix;
    }
```

#### struct OutputLight
---
Упрощенный вывод о тарифе

```
    struct OutputLight {
        uint256 id;
        Tariff tariff;
    }
```

#### struct Tariff
---
Основная структура тарифа

```
    struct Tariff {
        uint256 currency; // TODO, ADD currency
        TariffType _type;
        DisplayText[] tariff_alt_text;
        string tariff_alt_url;
        TariffElement[] elements;
    }
```

#### struct PriceComponent
---
Ценовой компонент определяет что за тип тарифа, его стоимость и шаг с которым будет происходить начисление
```
    struct PriceComponent {
        TariffDimensionType _type;
        uint256 price;
        uint8 vat;
        uint256 step_size;
    }
```

#### struct TariffRestrictions
---
Условия работы компонента конкретного тарифа

```
    struct TariffRestrictions {
        uint256 start_unixtime;
        uint256 end_unixtime;
        uint32 min_kwh;
        uint32 max_kwh;
        uint32 min_current;
        uint32 max_current;
        uint32 min_power;
        uint32 max_power;
        uint32 min_duration;
        uint32 max_duration;
        DayOfWeek[] day_of_week;
        ReservationRestrictionType reservation;
    }
```

#### struct TariffElement
---
Элемент тарифа
```
    struct TariffElement {
        PriceComponent[] price_components;
        TariffRestrictions restrictions;
    }
```

## События

#### AddTariff(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id )
---
Вызывается при добавлении тарифа

## Методы

#### getVersion() returns(string)
---
Получить версию контракта

#### exist(uint256 id) returns(bool)
---
Проверить существование тарифа

#### add(bytes32 _token, Tariff calldata tariff)
---
Добавить тариф

#### setMinPrice(bytes32 _token, uint256 id, Price calldata _min_price)
---
Установить минимальную цену на тариф

#### setMaxPrice(bytes32 _token, uint256 id, Price calldata _max_price)
---
Установить максимальную цену на тариф

#### setStartDateTime(bytes32 _token, uint256 id, uint256 _start_date_time)
---
Установить дату и время начала действия тарифа

#### setEndDateTime(bytes32 _token, uint256 id, uint256 _end_date_time)
---
Установить дату и время конца действия тарифа

#### setEnergyMix(bytes32 _token, uint256 id, EnergyMix calldata _energy_mix )
---
Установить данные о энергии которая используется

#### get(uint256 id) view returns(Output)
---
Получить полные данные о тарифе

#### getLight(uint256 id) view returns(OutputLight)
---
Получить упрощенную версию данных о тарифе
