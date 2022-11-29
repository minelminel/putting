import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  Button,
  Badge,
  ProgressBar,
  Spinner,
  ButtonGroup,
  Alert,
} from "react-bootstrap";
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
  TRAINING: `TRAINING`,
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

const round = (number, precision) => {
  const f = 10 ** precision;
  return Math.round(number * f) / f;
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

const DisplayPanel = ({ raw, feet, inch, onClear = () => {} }) => {
  const hide = raw === undefined || feet === undefined || inch === undefined;
  return (
    <Container className="h-100">
      <Row className="justify-content-center h-100">
        <Col className="text-center">
          {/* TODO: toggle decimal & feet/inch */}
          <div style={{ marginTop: "50%" }} onClick={onClear}>
            {hide ? (
              <span>Waiting for data...</span>
            ) : (
              <>
                <span style={{ fontSize: "8rem" }}>
                  {feet === undefined ? `` : `${feet}'`}
                </span>
                <span style={{ fontSize: "7rem" }}>
                  {inch === undefined ? `` : `${inch}"`}
                </span>
              </>
            )}
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

  // TODO: preferences

  const [thisMeasurement, setThisMeasurement] = useState({});

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

  const handleResetMeasurement = () => {
    setThisMeasurement({});
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
              navigate(VIEWS.TRAINING);
            }}
          >
            Training Mode
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

  const TrainingPage = ({ measurement }) => {
    // TODO: implement undo
    const gameStates = [
      { target: 5, min: 5, max: 5 + 1 },
      { target: 15, min: 15, max: 15 + 2 },
      { target: 6, min: 6, max: 6 + 1 },
      { target: 14, min: 14, max: 14 + 2 },
      { target: 7, min: 7, max: 7 + 1 },
      { target: 13, min: 13, max: 13 + 2 },
      { target: 8, min: 8, max: 8 + 1 },
      { target: 12, min: 12, max: 12 + 2 },
      { target: 9, min: 9, max: 9 + 1 },
      { target: 11, min: 11, max: 11 + 2 },
      { target: 10, min: 10, max: 10 + 1 },
      { target: 10, min: 10, max: 10 + 1 },
      { target: 11, min: 11, max: 11 + 2 },
      { target: 9, min: 9, max: 9 + 1 },
      { target: 12, min: 12, max: 12 + 2 },
      { target: 8, min: 8, max: 8 + 1 },
      { target: 13, min: 13, max: 13 + 2 },
      { target: 7, min: 7, max: 7 + 1 },
      { target: 14, min: 14, max: 14 + 2 },
      { target: 6, min: 6, max: 6 + 1 },
      { target: 15, min: 15, max: 15 + 2 },
      { target: 5, min: 5, max: 5 + 1 },
    ].slice(0, 4); // TODO: remove slice

    const [gameIndex, setGameIndex] = useState(0);
    const [gameIsDone, setGameIsDone] = useState(false);
    const [gameScore, setGameScore] = useState(0);
    const [gameReward, setGameReward] = useState(100 / gameStates.length);
    const [gameMeasurement, setGameMeasurement] = useState(measurement);

    /** big TODO's:
     * implement display reset
     * add display unit toggle
     * add info banner to display
     * auto-clear reset with preference enable/disable
     * lift state to main app */
    useEffect(() => {
      console.log(`receive measurement`);
      handleAction(measurement);
    }, gameMeasurement);

    const reset = () => {
      // init, reset
      setGameIsDone(false);
      setGameReward(100 / gameStates.length);
      setGameIndex(0);
      setGameScore(0);
      // reset sensor reading
    };

    const evaluate = (state, action) => {
      const { min, max } = state;
      const ok = min <= action && action <= max;
      return ok;
    };

    const handleNext = () => {
      const nextIndex = gameIndex + 1;
      if (nextIndex === gameStates.length) {
        setGameIsDone(true);
      } else {
        setGameIndex(nextIndex);
        setGameReward(100 / gameStates.length);
      }
    };

    const handleAction = (value) => {
      // TODO: value should be object
      const { raw } = value;
      console.log(`handle action: ${raw}`);
      const advance = evaluate(gameStates[gameIndex], raw);
      if (advance) {
        setGameScore(gameScore + gameReward);
        handleNext();
      } else {
        // halve potential reward, allow retry
        setGameReward(gameReward / 2);
      }
    };

    const gameState = gameStates[gameIndex];
    const gameProgress = gameIsDone
      ? 100
      : (gameIndex / gameStates.length) * 100;

    return (
      <Container>
        <Row>
          <Col>
            <ProgressBar
              className="mt-2"
              striped
              variant="dark"
              now={gameProgress}
              label={`${round(gameProgress, 0)}%`}
            />
            <Row className="text-center my-3">
              <Col>
                <ButtonGroup size="med">
                  <Button disabled={true} variant="dark">
                    Undo
                  </Button>
                  <Button
                    disabled={false}
                    variant="warning"
                    onClick={() => handleAction({ raw: gameState.min - 1 })}
                  >{`< ${gameState.min}'`}</Button>
                  <Button
                    disabled={false}
                    variant="success"
                    onClick={() => handleAction({ raw: gameState.target })}
                  >
                    <strong>{`${gameState.target}'`}</strong>
                  </Button>
                  <Button
                    disabled={false}
                    variant="danger"
                    onClick={() => handleAction({ raw: gameState.max + 1 })}
                  >{`> ${gameState.max}'`}</Button>
                  <Button variant="dark" onClick={reset}>
                    Reset
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>
            {gameIsDone ? (
              <span>{`Your Score: ${round(gameScore, 1)}%`}</span>
            ) : (
              <DisplayPanel
                {...{ ...measurement, onClear: handleResetMeasurement }}
              />
            )}
            {/* <pre>
              {JSON.stringify(
                {
                  turn: `${gameIndex + 1}/${gameStates.length}`,
                  gameIndex,
                  gameIsDone,
                  gameScore,
                  gameReward,
                  currentValue: gameStates[gameIndex],
                },
                null,
                2
              )}
            </pre> */}
          </Col>
        </Row>
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
    [VIEWS.TRAINING]: (
      <>
        <NavPanel
          title={`Training`}
          left={
            <ArrowLeft
              style={{ cursor: `pointer` }}
              onClick={() => navigate(VIEWS.HOME)}
            />
          }
        />
        <TrainingPage measurement={thisMeasurement} />
      </>
    ),
    [VIEWS.SETTINGS]: (
      <>
        <NavPanel
          title={`Settings`}
          left={
            <ArrowLeft
              style={{ cursor: `pointer` }}
              onClick={() => navigate(VIEWS.HOME)}
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
        </Col>
      </Row>
    </Container>
  );
};

export default App;
