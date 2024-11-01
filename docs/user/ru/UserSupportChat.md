# UserSupportChat

Контракт для создания чатов для техподдержки.


## Структуры

#### enum TopicRating
---
Используется для оценки закрытого топика в методе setRating

```
    enum TopicRating {
        None,
        OneStar,
        TwoStar,
        ThreeStar,
        FourStar,
        FiveStar
    }
```
#### enum TopicTheme
---

Используется для понимания о чем речь в топике, какая проблема. Используется при создании топика в методе createTopic

```
    enum TopicTheme {
        None,
        ChargingSession,
        App,
        Payment,
        Contact
    }
```

#### struct InputMessage
---
Тело сообщения которое отправляется пользователем. Используется в методе sendMessage

```
    struct InputMessage {
        string text;
        bytes image;
        uint256 reply_to;
    }
```

#### struct UserMessage
---
Тело сообщения которое хранится в контракте, добавляются сервисные поля. Более расширенная версия InputMessage. Используется в методах getMessages и getMessage

```
    struct UserMessage {
        string text;
        bytes image;
        uint256 reply_to;
        uint256 create_at;
        bool readed;
        uint256 user_id;
    }
```

#### struct Topic
---
Структура обращений, эту структуру возвращает метод getTopic

```
    struct Topic {
        uint256 create_at;
        uint256 update_at;
        uint256 create_user_id;
        uint256 message_counter;
        TopicTheme theme;
        bool closed;
        TopicRating user_rating;
    }
```

## События

#### Message(uint256 indexed topic_id, uint256 indexed message_id )
---
Вызывается при успешном вызове метода sendMessage

#### CreateTopic(uint256 indexed topic_id, TopicTheme indexed theme)
---
Вызывается при успешном вызове метода createTopic

#### UpdateTopic(uint256 indexed topic_id, TopicTheme indexed theme, uint256 indexed update_at)
---
Вызывается при успешном вызове метода sendMessage

#### CloseTopic(uint256 indexed topic_id, uint256 indexed user_id)
---
Вызывается при успешном вызове метода closeTopic

## Методы


#### getVersion() returns(string memory)
---
Получение версии контракта

#### createTopic(bytes32 _token, string _text_message, TopicTheme theme)
---
Создание нового обращения


#### sendMessage(bytes32 _token, uint256 topic_id, InputMessage message)
---
Отправление сообщения в конкретном обращении


#### setRating(bytes32 _token, uint256 topic_id, TopicRating rating)
---
Оценить результат работы конкретного обращения

#### closeTopic(bytes32 _token, uint256 topic_id)
---
Закрыть обращение


#### setReadedMessages(bytes32 _token, uint256 topic_id, uint256[] message_ids)
---
Пометить конкретные сообщения как прочитанные 

#### getMyTopics(bytes32 _token, uint256 offset) external view returns(Topic[] memory);
---
Получить список обращений который пользователь открывал или система для него открывала автоматически


#### getTopic(bytes32 _token, uint256 topic_id) external returns(Topic memory);
---
Получить информацию по конкретному обращению

#### getMessages(bytes32 _token, uint256 topic_id, uint256 offset) external view returns (UserMessage[] memory);
---
Получить список сообщений по конкретному обращению

#### getMessage(bytes32 _token, uint256 topic_id, uint256 message_id) external view returns(UserMessage memory);
---

Получить конкретное обращение