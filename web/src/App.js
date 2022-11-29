import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  Button,
  Badge,
  ProgressBar,
  Spinner,
  ButtonGroup,
  Form,
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

/** utils */
const convertRawMeasurement = (raw) => {
  const meter = raw * 0.3048;
  let feet, inch;
  feet = Math.floor(raw);
  inch = Math.round((raw - feet) * 12);
  if (inch === 12) {
    feet += 1;
    inch = 0;
  }
  return { raw, feet, inch, meter };
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

const DisplayPanel = ({ raw, units, onClear = () => {} }) => {
  const hide = raw === undefined;
  const { feet, inch, meter } = convertRawMeasurement(raw);

  return (
    <Container className="h-100">
      <Row className="justify-content-center h-100">
        <Col className="text-center">
          <div style={{ marginTop: "50%" }} onClick={onClear}>
            {hide ? (
              <span>Waiting for data...</span>
            ) : units === `imperial` ? (
              <>
                <span style={{ fontSize: "8rem" }}>
                  {feet === undefined ? `` : `${feet}'`}
                </span>
                <span style={{ fontSize: "7rem" }}>
                  {inch === undefined ? `` : `${inch}"`}
                </span>
              </>
            ) : units === `metric` ? (
              <span style={{ fontSize: "8rem" }}>
                {meter === undefined ? `` : `${round(meter, 2)}m`}
              </span>
            ) : (
              <span style={{ fontSize: "8rem" }}>
                {meter === undefined ? `` : `${round(raw, 1)}ft`}
              </span>
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
  const potentialReward = 100 / gameStates.length;

  const [thisView, setThisView] = useState(VIEWS.HOME);

  const [thisSettings, setThisSettings] = useState({});
  const [thisSettingsIsLoading, setThisSettingsIsLoading] = useState(true);

  const [trainingIndex, setTrainingIndex] = useState(0);
  const [trainingIsDone, setTrainingIsDone] = useState(false);
  const [trainingReward, setTrainingReward] = useState(potentialReward);
  const [trainingScore, setTrainingScore] = useState(0);

  const [thisMeasurement, setThisMeasurement] = useState(null);

  const [isConnected, setIsConnected] = useState(socket.connected);

  const handleMeasurement = (m) => {
    setThisMeasurement(m);
    if (!m) {
      return;
    }
    // do something with game...
    handleTraining(m);
  };

  const handleUpdateSettings = (keyValuePair) => {
    console.log(`handle update settings`);
    setThisSettings({ ...thisSettings, ...keyValuePair });
  };

  const handleLoadSettings = () => {
    console.log(`handle load settings`);
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
        setThisSettingsIsLoading(false);
      });
  };

  const handleSaveSettings = () => {
    console.log(`handle save settings`);
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
        setThisSettingsIsLoading(false);
      });
  };

  const handleTraining = (m) => {
    const { raw } = m;
    const { min, max } = gameStates[trainingIndex];
    if (min <= raw && raw <= max) {
      // advance to next turn
      console.log(`training attempt passed, advance turn`);
      setTrainingScore(trainingScore + trainingReward);
      const nextIndex = trainingIndex + 1;
      if (nextIndex === gameStates.length) {
        // finished
        setTrainingIsDone(true);
      } else {
        // more turns
        setTrainingIndex(nextIndex);
        setTrainingReward(potentialReward);
      }
    } else {
      // allow another attempt
      console.log(`training attempt failed, retry turn`);
      setTrainingReward(trainingReward / 2);
    }
  };

  const handleResetTraining = () => {
    handleResetMeasurement();
    setTrainingIndex(0);
    setTrainingIsDone(false);
    setTrainingReward(potentialReward);
    setTrainingScore(0);
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
      handleMeasurement(payload);
    });

    return () => {
      socket.off(`connect`);
      socket.off(`disconnect`);
      socket.off(`pong`);
      socket.off(`measurement`);
    };
  });

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
    handleMeasurement(payload);
    return payload;
  };

  // keep socket refreshed for more responsive display
  useEffect(() => {
    console.log(`useEffect: ping`);
    const interval = setInterval(() => {
      sendPing();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    console.log(`useEffect: view`);
    let view = getLocalStorage(`view`, thisView);
    if (!VIEWS.hasOwnProperty(view)) {
      view = thisView;
    }
    handleChangeView(view);
  });

  useEffect(() => {
    console.log(`useEffect: settings`);
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
    handleMeasurement(null);
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

  const PracticePage = ({ measurement, onClear }) => {
    return (
      <Container className="h-100">
        <DisplayPanel
          {...{ ...measurement, onClear, units: thisSettings.units }}
        />
      </Container>
    );
  };

  const TrainingPage = ({ ...props }) => {
    // TODO: implement undo
    const { index, done, score, measurement, onReset, onClear, onMeasurement } =
      props;

    const { min, max, target } = gameStates[index];
    const progress = done ? 100 : (index / gameStates.length) * 100;

    return (
      <Container>
        <Row>
          <Col>
            <ProgressBar
              className="mt-2"
              striped
              variant="dark"
              now={progress}
              label={`${round(progress, 0)}%`}
            />
            <Row className="text-center my-3">
              <Col>
                <Button disabled={true} variant="dark">
                  Undo
                </Button>
                <ButtonGroup size="med" className="mx-3">
                  <Button
                    disabled={false}
                    variant="warning"
                    onClick={() => onMeasurement({ raw: min - 1 })}
                  >{`< ${min}'`}</Button>
                  <Button
                    disabled={false}
                    variant="success"
                    onClick={() => onMeasurement({ raw: target })}
                  >
                    <strong>{`${target}'`}</strong>
                  </Button>
                  <Button
                    disabled={false}
                    variant="danger"
                    onClick={() => onMeasurement({ raw: max + 1 })}
                  >{`> ${max}'`}</Button>
                </ButtonGroup>
                <Button variant="dark" onClick={onReset}>
                  Reset
                </Button>
              </Col>
            </Row>
            {done ? (
              <span>{`Your Score: ${round(score, 1)}%`}</span>
            ) : (
              <DisplayPanel {...{ ...measurement, onClear }} />
            )}
          </Col>
        </Row>
      </Container>
    );
  };

  const SettingsPage = ({ ...props }) => {
    const { isLoading, onChange = () => {}, settings = {} } = props;

    const {
      stimp,
      slope,
      surface,
      offset,
      gateway,
      units,
      autoclear,
      duration,
    } = settings;

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
            <hr />
            <Form>
              <Form.Label>Display Units</Form.Label>
              <div key={`inline-radio`} className="mb-3">
                <Form.Check
                  defaultChecked={units === `decimal`}
                  inline
                  label="ft"
                  type="radio"
                  onChange={(e) => {
                    onChange({ units: `decimal` });
                  }}
                />
                <Form.Check
                  defaultChecked={units === `imperial`}
                  inline
                  label="ft/in"
                  type="radio"
                  onChange={(e) => {
                    onChange({ units: `imperial` });
                  }}
                />
                <Form.Check
                  defaultChecked={units === `metric`}
                  inline
                  label="m"
                  type="radio"
                  onChange={(e) => {
                    onChange({ units: `metric` });
                  }}
                />
              </div>
              <hr />
              <Form.Check
                defaultChecked={autoclear}
                type="switch"
                id="custom-switch"
                label="Automatically clear display"
                onChange={(e) => {
                  onChange({ autoclear: e.target.checked });
                }}
              />
              <hr />
              <>
                <Form.Label>Display Duration: {`${duration}s`}</Form.Label>
                <Form.Range
                  min={1}
                  max={10}
                  step={1}
                  value={duration}
                  onChange={(e) => {
                    onChange({ duration: parseInt(e.target.value) });
                  }}
                />
              </>
            </Form>
            <hr />
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
        <PracticePage
          measurement={thisMeasurement}
          onClear={handleResetMeasurement}
        />
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
        <TrainingPage
          index={trainingIndex}
          done={trainingIsDone}
          score={trainingScore}
          measurement={thisMeasurement}
          onMeasurement={handleMeasurement}
          onClear={handleResetMeasurement}
          onReset={handleResetTraining}
        />
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
          {/* <pre>{JSON.stringify({ thisMeasurement }, null, 2)}</pre> */}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
