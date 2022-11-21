import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { Button, Badge, ProgressBar } from "react-bootstrap";
import { ArrowLeft, Save, Info } from "react-feather";
import useWebSocket, { ReadyState } from "react-use-websocket";

// mock callable from dev console
window.putt = (value = null) => {
  const s = value !== null ? value : Math.random() * 3.14;
  return `Sending fake signal: ${s}`;
};

const NavPanel = ({ title, left, right, ...props }) => {
  return (
    <Row className="mt-3 justify-content-between">
      <Col className="col-3 p-1 text-start">{left}</Col>
      <Col className="text-center align-self-center">{title}</Col>
      <Col className="col-3 p-1 text-end">{right}</Col>
    </Row>
  );
};

const StatusPanel = ({ value = 0, onReset = () => {}, ...props }) => {
  // 0: init, 1: connected, 2: reading
  const [status, setStatus] = useState(value);

  const handleReset = () => {
    console.log(`handling reset`);
    onReset();
  };

  const table = {
    0: { bg: "dark", text: "⚪️ Not Connected" },
    1: { bg: "success", text: "🟢 Sensor Ready" },
    2: { bg: "warning", text: "🟡 Sensor Capturing" },
  };

  const { bg, text } = table[status];

  return (
    <Container className="mt-2 text-center">
      <Row>
        <Col>
          <Badge className="glow" pill bg={bg} onClick={handleReset}>
            {text}
          </Badge>
        </Col>
      </Row>
    </Container>
  );
};

const DisplayPanel = (props) => {
  const { raw, feet, inches } = props;
  return (
    <Container className="h-100">
      <Row className="justify-content-center h-100">
        <Col className="text-center">
          <div style={{ marginTop: "50%" }}>
            {!feet && !inches && <span>Waiting for data...</span>}
            <span style={{ fontSize: "8rem" }}>
              {feet === undefined ? `` : feet === 0 ? `_` : `${feet}'`}
            </span>
            <span style={{ fontSize: "7rem" }}>
              {inches === undefined ? `` : feet === 0 ? `_` : `${inches}"`}
            </span>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

const RangePanel = ({
  left = ``,
  right = ``,
  title = ``,
  step = 1,
  min = 0,
  max = 100,
  defaultValue = 50,
  disabled = false,
  onChange = () => {},
  formatValue = (rawValue) => {
    return rawValue;
  },
  ...props
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {}, []);

  const handleChange = (newValue) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col className="col-2 p-0 text-end align-self-center">
          <small>{left}</small>
        </Col>
        <Col className="col-8 align-self-center">
          <ProgressBar variant="dark" now={value} min={min} max={max} />
        </Col>
        <Col className="col-2 p-0 text-start align-self-center">
          <small>{right}</small>
        </Col>
      </Row>
      <Row className=" mt-2 mb-2 justify-content-center">
        <Col className="col-3 p-0 text-end">
          <Button
            variant="dark"
            className="round glow"
            onClick={() => handleChange(Math.max(value - step, min))}
            disabled={disabled ? true : value - step < min}
          >
            -
          </Button>
        </Col>
        <Col className="col-2 p-0 text-center align-self-center">
          <span style={{ fontSize: "1.6rem" }}>{formatValue(value)}</span>
        </Col>
        <Col className="col-3 p-0 text-start">
          <Button
            variant="dark"
            className="round glow"
            onClick={() => handleChange(Math.min(value + step, max))}
            disabled={disabled ? true : value + step > max}
          >
            +
          </Button>
        </Col>
      </Row>
      <Row>
        <Col className="text-center">
          <small>{title}</small>
        </Col>
      </Row>
    </Container>
  );
};

const App = (props) => {
  const {
    defaultView = `home`,
    defaultSettings = {
      speed: 10,
      slope: 0,
      surface: 9,
      offset: 1.5,
      gateway: 0.5,
    },
    defaultStatus = 0,
  } = props;
  // home, play, settings
  const [thisView, setThisView] = useState(defaultView);
  const [thisSettings, setThisSettings] = useState(defaultSettings);
  const [thisStatus, setThisStatus] = useState(defaultStatus);

  // begin websockets
  const [socketUrl, setSocketUrl] = useState(`ws://echo.websocket.events/.ws`);
  const [messageHistory, setMessageHistory] = useState([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const handleClickSendMessage = useCallback(() => sendMessage(`hello`), []);
  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const handleClickChangeSocketUrl = useCallback(() => {}, []);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage, setMessageHistory]);
  // end websockets

  useEffect(() => {
    const value = getLocalStorage(`view`, defaultView);
    handleChangeView(value);
    // fetch settings from api
    handleLoadSettings();
  }, []);

  const getLocalStorage = (key, fallback = null) => {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return fallback;
    }
    return value;
  };

  const setLocalStorage = (key, value) => {
    window.localStorage.setItem(key, value);
    return value === getLocalStorage(key);
  };

  const handleChangeView = (value) => {
    if (value !== thisView) {
      setThisView(value);
      setLocalStorage(`view`, value);
    }
  };

  const handleChangeStatus = (value) => {
    console.log(`handing change status`);
    setThisSettings(value);
  };

  const handleLoadSettings = (defaults) => {
    const url = `http://${window.location.hostname}:8000/api/settings`;
    console.log(`fetching url: ${url}`);
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        setThisSettings(json);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSaveSettings = (payload) => {
    console.log(payload);
    const url = `http://${window.location.hostname}:8000/api/settings`;
    console.log(`posting url: ${url}`);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((json) => setThisSettings(json))
      .catch((error) => {
        console.error(error);
      });
  };

  const HomePage = ({ ...props }) => {
    const { title, navigate } = props;

    return (
      <Container className="h-100">
        <NavPanel title={title} left={<Info style={{ opacity: "0" }} />} />
        <hr />
        <blockquote className="mt-4 mb-4">
          For better viewing experience on mobile, tap the{" "}
          <kbd>
            <small>A</small>A
          </kbd>{" "}
          in the address bar and select <kbd>Hide Toolbar</kbd>
        </blockquote>
        <div className="d-grid gap-3">
          <Button
            variant="dark"
            className="glow"
            size="lg"
            onClick={() => {
              navigate(`practice`);
            }}
          >
            Practice Mode
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="glow"
            onClick={() => {
              navigate(`drill`);
            }}
            disabled
          >
            DECADE® Lag Drill
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="glow"
            onClick={() => {
              navigate(`settings`);
            }}
          >
            Settings
          </Button>
        </div>
      </Container>
    );
  };

  const PracticePage = ({ ...props }) => {
    const { title, navigate, status } = props;

    return (
      <Container className="h-100">
        <NavPanel
          title={title}
          left={<ArrowLeft onClick={() => navigate(`home`)} />}
        />
        <StatusPanel value={status} />
        <DisplayPanel />
      </Container>
    );
  };

  const SettingsPage = ({ ...props }) => {
    const { title, navigate, onSave = () => {}, defaultValues = {} } = props;

    const [state, setState] = useState(defaultValues);

    const handleSave = () => {
      console.log(`handle save`);
      onSave(state);
    };

    return (
      <Container>
        <NavPanel
          title={title}
          left={<ArrowLeft onClick={() => navigate(`home`)} />}
          right={<Save onClick={handleSave} />}
        />
        <hr />
        <RangePanel
          title={`Green Speed`}
          left={`SLOW`}
          right={`FAST`}
          min={8}
          max={12}
          step={1}
          defaultValue={state.speed}
          onChange={(val) => setState({ ...state, speed: val })}
        />
        <hr />
        <RangePanel
          disabled
          title={`Green Slope`}
          left={`DOWNHILL`}
          right={`UPHILL`}
          min={-4}
          max={4}
          step={1}
          defaultValue={state.slope}
          formatValue={(val) =>
            `${val === 0 ? `` : val > 0 ? `+` : `-`}${Math.abs(val)}º`
          }
          onChange={(val) => setState({ ...state, slope: val })}
        />
        <hr />
        <RangePanel
          title={`Surface Speed`}
          left={`SLOW`}
          right={`FAST`}
          min={8}
          max={12}
          step={1}
          defaultValue={state.surface}
          onChange={(val) => setState({ ...state, surface: val })}
        />
        <hr />
        <RangePanel
          title={`Offset Distance`}
          left={`NEAR`}
          right={`FAR`}
          min={0}
          max={3}
          step={0.25}
          defaultValue={state.offset}
          formatValue={(val) => {
            const feet = Math.floor(val);
            const inch = (val - feet) * 12;
            return `${feet}'${inch}"`;
          }}
          onChange={(val) => setState({ ...state, offset: val })}
        />
        <hr />
        <RangePanel
          disabled
          title={`Gateway Width`}
          left={`SHORT`}
          right={`LONG`}
          min={0}
          max={1}
          step={0.25}
          defaultValue={state.gateway}
          formatValue={(val) => {
            const feet = Math.floor(val);
            const inch = (val - feet) * 12;
            return `${feet}'${inch}"`;
          }}
          onChange={(val) => setState({ ...state, gateway: val })}
        />
      </Container>
    );
  };

  return (
    <Container className="h-100">
      <Row className="h-100 justify-content-center align-items-center">
        <Col
          className="view"
          xs={12} // mobile
          sm={10}
          md={8}
          lg={6}
          xl={4}
          style={{
            minHeight: "100%",
          }}
        >
          <div>
            <button onClick={handleClickChangeSocketUrl}>
              Click Me to change Socket Url
            </button>
            <button
              onClick={handleClickSendMessage}
              disabled={readyState !== ReadyState.OPEN}
            >
              Click Me to send 'Hello'
            </button>
            <span>The WebSocket is currently {connectionStatus}</span>
            {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
            <ul>
              {messageHistory.map((message, idx) => (
                <span key={idx}>{message ? message.data : null}</span>
              ))}
            </ul>
          </div>
          {thisView === `home` && (
            <HomePage
              title={`Home`}
              leftNav={null}
              navigate={handleChangeView}
            />
          )}
          {thisView === `practice` && (
            <PracticePage
              title={`Practice`}
              navigate={handleChangeView}
              status={thisStatus}
            />
          )}
          {thisView === `settings` && (
            <SettingsPage
              title={`Settings`}
              navigate={handleChangeView}
              onSave={handleSaveSettings}
              defaultValues={thisSettings}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
