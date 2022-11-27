# putting

## Frontend

- http fixture
  - fetch settings
  - update settings
- websocket fixture
  - receive messages, dispatch to component(s)
  - push messages to server
- storage fixture
  - session history
  - preferences

## Backend

- serve frontend content
- settings: get, post

```bash
# kill process(es) by port
lsof -t -i tcp:3000 | xargs kill
```

---

# UI

**State**

- page.view
- sensor.connected
- sensor.capturing
- sensor.measurement
- preferences.units
- preferences.erase
- settings.stimp
- settings.surface
- settings.slope
- settings.offset
- settings.gateway

**Action**

- handleChangePageView
- handleSensorConnected
- handleSensorCapturing
- handleSensorMeasurement
- handlePreferences
- reset sensor
- reset measurement
