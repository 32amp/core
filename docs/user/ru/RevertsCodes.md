# RevertCodes

Модуль отвечает за регистрацию ошибок возвращаемых в контрактах. 

## Структуры данных


#### struct Output
---
Используется для вывода списка ошибок
```
    struct Output {
        string code;
        string message;
    }
```

#### struct UpdateLocales
---
Используется для обновления локалей для разных языков

```
    struct UpdateLocales {
        string lang;
        string code;
        string message;
    }
```

## Методы


#### getRevertMessages(string module, string lang) external view returns(Output[] output)
---
Используется для получения списка возможных ошибок у конкретного модуля

#### updateLocale(string module, UpdateLocales[] update_locales)
---
Используется для добавления локализации на другие языки

#### registerRevertCode(string module, string code, string message)
---
Используется другими контрактами для регистрации новых кодов ошибок

#### panic(string module,string code)
---
Используется другими модулями, вызывает конкретную ошибку