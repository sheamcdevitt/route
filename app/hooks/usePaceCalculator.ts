'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  calculatePace,
  calculateTime,
  formatPace,
  formatTime,
} from '../utils/routeCalculations';

type UsePaceCalculatorProps = {
  distance: number;
};

type UsePaceCalculatorReturn = {
  time: number;
  pace: number;
  setTime: (time: number) => void;
  setPace: (pace: number) => void;
  formattedTime: string;
  formattedPace: string;
  calculateTimeFromPace: () => void;
  calculatePaceFromTime: () => void;
};

export const usePaceCalculator = ({
  distance,
}: UsePaceCalculatorProps): UsePaceCalculatorReturn => {
  const [time, setTime] = useState<number>(0); // time in seconds
  const [pace, setPace] = useState<number>(0); // pace in minutes per kilometer
  const [formattedTime, setFormattedTime] = useState<string>('00:00:00');
  const [formattedPace, setFormattedPace] = useState<string>('0:00/km');

  // Update formatted time whenever time changes
  useEffect(() => {
    setFormattedTime(formatTime(time));
  }, [time]);

  // Update formatted pace whenever pace changes
  useEffect(() => {
    setFormattedPace(formatPace(pace));
  }, [pace]);

  // Calculate time based on pace and distance
  const calculateTimeFromPace = useCallback(() => {
    if (distance > 0 && pace > 0) {
      const calculatedTime = calculateTime(pace, distance);
      setTime(calculatedTime);
    }
  }, [distance, pace]);

  // Calculate pace based on time and distance
  const calculatePaceFromTime = useCallback(() => {
    if (distance > 0 && time > 0) {
      const calculatedPace = calculatePace(time, distance);
      setPace(calculatedPace);
    }
  }, [distance, time]);

  return {
    time,
    pace,
    setTime,
    setPace,
    formattedTime,
    formattedPace,
    calculateTimeFromPace,
    calculatePaceFromTime,
  };
};
