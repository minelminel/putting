import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Button, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { ArrowLeft, Save, Info } from "react-feather";
import { ToastContainer, toast } from "react-toastify";
import io from "socket.io-client";

// import circleLoadingGif from "./static/circle-loading-gif.gif";

// const UI_ROOT = `http://192.168.1.114:4000`;
const API_ROOT = `http://192.168.1.16:8000/api`;
const WS_ROOT = `ws://192.168.1.16:8000`;

const socket = io(WS_ROOT);

const VIEWS = {
  HOME: `HOME`,
  PRACTICE: `PRACTICE`,
  SETTINGS: `SETTINGS`,
};

/** utils */
const convertRawMeasurement = (raw) => {
  let feet, inch;
  feet = Math.floor(raw);
  inch = Math.round((raw - feet) * 12);
  if (inch === 12) {
    feet += 1;
    inch = 0;
  }
  return { raw, feet, inch };
};

/** components */
const NavPanel = ({ title, left, right, ...props }) => {
  return (
    <Row className="mt-3 justify-content-between">
      <Col className="col-3 p-1 text-start">{left}</Col>
      <Col className="text-center align-self-center">{title}</Col>
      <Col className="col-3 p-1 text-end">{right}</Col>
    </Row>
  );
};

const StatusPanel = ({
  isConnected,
  isMeasuring,
  onReset = () => {},
  ...props
}) => {
  // isConnected: true || false
  // isMeasuring: true || false

  const handleReset = () => {
    // TODO: only allow reset if both connected and measuring
    console.log(`handling reset`);
    onReset();
  };

  const { bg, text } = !isConnected
    ? { bg: `dark`, text: `Not Connected` }
    : !isMeasuring
    ? { bg: `success`, text: `Connected` }
    : { bg: `warning`, text: `Measuring` };

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

const DisplayPanel = ({ raw, feet, inch }) => {
  return (
    <Container className="h-100">
      <Row className="justify-content-center h-100">
        <Col
          className="text-center"
          onClick={() => {
            console.log(`clear`);
          }}
        >
          {/* TODO: toggle decimal & feet/inch */}
          <div style={{ marginTop: "50%" }}>
            {!feet && !inch && <span>Waiting for data...</span>}
            <span style={{ fontSize: "8rem" }}>
              {feet === undefined ? `` : `${feet}'`}
            </span>
            <span style={{ fontSize: "7rem" }}>
              {inch === undefined ? `` : `${inch}"`}
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

/** main app */
const App = (props) => {
  const [thisView, setThisView] = useState(VIEWS.HOME);

  const [thisSettings, setThisSettings] = useState({});
  const [thisSettingsIsLoading, setThisSettingsIsLoading] = useState(true);

  const [thisMeasurement, setThisMeasurement] = useState({});

  // begin websocket
  const [isConnected, setIsConnected] = useState(socket.connected);

  const handleUpdateSettings = (keyValuePair) => {
    setThisSettings({ ...thisSettings, ...keyValuePair });
  };

  const handleLoadSettings = () => {
    setThisSettingsIsLoading(true);
    const url = `${API_ROOT}/settings`;
    fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        setThisSettings(json);
      })
      .catch((error) => {
        notify(error);
        console.error(error);
      })
      .then(() => {
        // setThisSettingsIsLoading(false);
      });
  };

  const handleSaveSettings = () => {
    setThisSettingsIsLoading(true);
    const url = `${API_ROOT}/settings`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(thisSettings),
    })
      .then((response) => response.json())
      .then((json) => {
        notify(`Saved settings`);
        setThisSettings(json);
      })
      .catch((error) => {
        notify(error);
        console.error(error);
      })
      .then(() => {
        // setThisSettingsIsLoading(false);
      });
  };

  /** websocket */
  useEffect(() => {
    socket.on("connect", () => {
      console.debug(`socketio: connect`);
      setIsConnected(true);
    });

    socket.on(`disconnect`, () => {
      console.debug(`socketio: disconnect`);
      setIsConnected(false);
    });

    socket.on(`pong`, () => {
      console.debug(`socketio: pong`);
    });

    socket.on(`measurement`, (json) => {
      console.log(`socketio: measurement`);
      const payload = JSON.parse(json);
      setThisMeasurement(payload);
    });

    return () => {
      socket.off(`connect`);
      socket.off(`disconnect`);
      socket.off(`pong`);
      socket.off(`measurement`);
    };
  }, []);

  const sendPing = () => {
    socket.emit(`ping`);
  };

  const sendReset = () => {
    socket.emit(`reset`);
  };

  // mock callable from dev console
  window.putt = (value = null) => {
    const raw = value !== null ? value : Math.random() * 3.14;
    const payload = convertRawMeasurement(raw);
    setThisMeasurement(payload);
    return payload;
  };

  // keep socket refreshed for more responsive display
  useEffect(() => {
    const interval = setInterval(() => {
      sendPing();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);
  // end websocket

  useEffect(() => {
    let view = getLocalStorage(`view`, thisView);
    if (!VIEWS.hasOwnProperty(view)) {
      view = thisView;
    }
    handleChangeView(view);
  }, []);

  useEffect(() => {
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

  /** convenience functions */
  const notify = (text, type = `info`) => {
    return toast[type](text);
  };

  const navigate = (view) => {
    if (!VIEWS.hasOwnProperty(view)) {
      notify(`Invalid view: ${view}`);
    }
    handleChangeView(view);
  };

  /** molecules */
  const HomePage = ({ ...props }) => {
    const { navigate } = props;

    return (
      <Container className="h-100">
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
              navigate(VIEWS.PRACTICE);
            }}
          >
            Practice Mode
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="glow"
            onClick={() => {
              navigate(VIEWS.DRILL);
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
              navigate(VIEWS.SESSIONS);
            }}
            disabled
          >
            My Data
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="glow"
            onClick={() => {
              navigate(VIEWS.SETTINGS);
            }}
          >
            Settings
          </Button>
        </div>
      </Container>
    );
  };

  const PracticePage = ({ measurement }) => {
    return (
      <Container className="h-100">
        <DisplayPanel {...measurement} />
      </Container>
    );
  };

  const SettingsPage = ({ ...props }) => {
    const { isLoading, onChange = () => {}, settings = {} } = props;

    const { stimp, slope, surface, offset, gateway } = settings;

    return (
      <Container>
        {isLoading ? (
          <Row className="mt-4">
            <Col className="text-center">
              <Spinner animation="border" role="status" />
            </Col>
          </Row>
        ) : (
          <>
            <RangePanel
              title={`Green Speed`}
              left={`SLOW`}
              right={`FAST`}
              min={8}
              max={12}
              step={1}
              defaultValue={stimp}
              onChange={(val) => onChange({ stimp: val })}
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
              defaultValue={slope}
              formatValue={(val) =>
                `${val === 0 ? `` : val > 0 ? `+` : `-`}${Math.abs(val)}º`
              }
              onChange={(val) => onChange({ slope: val })}
            />
            <hr />
            <RangePanel
              title={`Surface Speed`}
              left={`SLOW`}
              right={`FAST`}
              min={8}
              max={12}
              step={1}
              defaultValue={surface}
              onChange={(val) => onChange({ surface: val })}
            />
            <hr />
            <RangePanel
              title={`Offset Distance`}
              left={`NEAR`}
              right={`FAR`}
              min={0}
              max={3}
              step={0.25}
              defaultValue={offset}
              formatValue={(val) => {
                const { feet, inch } = convertRawMeasurement(val);
                return `${feet}'${inch}"`;
              }}
              onChange={(val) => onChange({ offset: val })}
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
              defaultValue={gateway}
              formatValue={(val) => {
                const { feet, inch } = convertRawMeasurement(val);
                return `${feet}'${inch}"`;
              }}
              onChange={(val) => onChange({ gateway: val })}
            />
          </>
        )}
      </Container>
    );
  };

  /** presentations */
  const page = {
    [VIEWS.HOME]: (
      <>
        <NavPanel title={`Home`} left={<Info style={{ opacity: "0" }} />} />
        <HomePage navigate={navigate} />
      </>
    ),
    [VIEWS.PRACTICE]: (
      <>
        <NavPanel
          title={`Practice`}
          left={
            <ArrowLeft
              style={{ cursor: `pointer` }}
              onClick={() => navigate(VIEWS.HOME)}
            />
          }
        />
        <PracticePage measurement={thisMeasurement} />
      </>
    ),
    [VIEWS.SETTINGS]: (
      <>
        <NavPanel
          title={`Settings`}
          left={
            <ArrowLeft
              style={{ cursor: `pointer` }}
              onClick={() => handleChangeView(VIEWS.HOME)}
            />
          }
          right={
            <Save style={{ cursor: `pointer` }} onClick={handleSaveSettings} />
          }
        />
        <SettingsPage
          isLoading={thisSettingsIsLoading}
          onChange={handleUpdateSettings}
          settings={thisSettings}
        />
      </>
    ),
  };

  /** renderer */
  return (
    <Container className="h-100">
      <Row className="h-100 justify-content-center align-items-center">
        <Col
          className="view"
          xs={12} // mobile
          sm={12}
          md={12} // tablet
          lg={6}
          xl={6} // desktop
          style={{
            minHeight: "100%",
          }}
        >
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <StatusPanel isConnected={isConnected} onReset={sendReset} />
          {page[thisView]}
          <pre>{JSON.stringify({ thisMeasurement }, null, 2)}</pre>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
