import React, { MouseEventHandler, useEffect, useState } from 'react';
import './Rewinder.css';
import Slider from '@mui/material/Slider';

interface RewinderProps {
  numberOfSnapshots: number;
  changeSnapshot: Function;
  clearSnapshotHistory: MouseEventHandler<HTMLButtonElement>;
}

export default function Rewinder({
  numberOfSnapshots,
  changeSnapshot,
  clearSnapshotHistory,
}: RewinderProps) {
  const [sliderValue, setSliderValue] = useState<number>(numberOfSnapshots);
  function handleChange(event: Event, value: number | Array<number>) {
    if (Array.isArray(value)) return;
    setSliderValue(value);
  }

  function handleChangeCommitted(
    event: React.SyntheticEvent | Event,
    value: number | Array<number>
  ) {
    if (Array.isArray(value)) return;
    changeSnapshot(value - 1);
  }

  function goBack() {
    if (sliderValue <= 1) return;
    changeSnapshot(sliderValue - 2);
    setSliderValue(sliderValue - 1);
  }

  function goForward() {
    if (sliderValue >= numberOfSnapshots) return;
    changeSnapshot(sliderValue);
    setSliderValue(sliderValue + 1);
  }

  useEffect(() => {
    setSliderValue(numberOfSnapshots);
  }, [numberOfSnapshots]);

  const disabled = numberOfSnapshots <= 1 ? true : false;
  return (
    <div id="rewinder">
      <button onClick={clearSnapshotHistory} id="clear-button">
        Clear
      </button>
      <div id="slider-container">
        <Slider
          aria-label="Temperature"
          value={sliderValue}
          valueLabelDisplay="auto"
          step={1}
          marks
          min={1}
          max={numberOfSnapshots}
          disabled={disabled}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
        />
      </div>
      <button onClick={goBack} id="back-button">
        &lt;&lt;
      </button>
      <button onClick={goForward} id="forward-button">
        &gt;&gt;
      </button>
    </div>
  );
}
