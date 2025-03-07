'use client';

import { useState } from 'react';
import { usePaceCalculator } from '../hooks/usePaceCalculator';

type PaceCalculatorProps = {
  distance: number;
};

const PaceCalculator = ({ distance }: PaceCalculatorProps) => {
  const [calculationType, setCalculationType] = useState<'pace' | 'time'>(
    'pace'
  );

  const {
    setTime,
    setPace,
    formattedTime,
    formattedPace,
    calculateTimeFromPace,
    calculatePaceFromTime,
  } = usePaceCalculator({ distance });

  // Handle time input change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setTime(totalSeconds);
  };

  // Handle pace input change
  const handlePaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [minutes, secondsPart] = e.target.value.split(':');
    const seconds = secondsPart ? secondsPart.replace('/km', '') : '0';
    const totalMinutes = Number(minutes) + Number(seconds) / 60;
    setPace(totalMinutes);
  };

  // Handle calculation
  const handleCalculate = () => {
    if (calculationType === 'time') {
      calculateTimeFromPace();
    } else {
      calculatePaceFromTime();
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-4'>Pace Calculator</h2>

      {distance > 0 ? (
        <>
          <div className='mb-4'>
            <p className='text-lg font-medium'>
              Distance: {distance.toFixed(2)} km
            </p>
          </div>

          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Calculate:
            </label>
            <div className='flex gap-4'>
              <label className='inline-flex items-center'>
                <input
                  type='radio'
                  className='form-radio'
                  name='calculationType'
                  value='time'
                  checked={calculationType === 'time'}
                  onChange={() => setCalculationType('time')}
                />
                <span className='ml-2'>Time</span>
              </label>
              <label className='inline-flex items-center'>
                <input
                  type='radio'
                  className='form-radio'
                  name='calculationType'
                  value='pace'
                  checked={calculationType === 'pace'}
                  onChange={() => setCalculationType('pace')}
                />
                <span className='ml-2'>Pace</span>
              </label>
            </div>
          </div>

          {calculationType === 'time' ? (
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Pace (min:sec/km):
              </label>
              <input
                type='text'
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='5:30/km'
                value={formattedPace}
                onChange={handlePaceChange}
              />
            </div>
          ) : (
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Time (hh:mm:ss):
              </label>
              <input
                type='text'
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='00:30:00'
                value={formattedTime}
                onChange={handleTimeChange}
              />
            </div>
          )}

          <button
            onClick={handleCalculate}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium'
          >
            Calculate {calculationType === 'time' ? 'Time' : 'Pace'}
          </button>

          <div className='mt-4 p-4 bg-gray-100 rounded-md'>
            <h3 className='text-lg font-medium mb-2'>Results:</h3>
            <p>Time: {formattedTime}</p>
            <p>Pace: {formattedPace}</p>
          </div>
        </>
      ) : (
        <p className='text-gray-600'>
          Draw a route on the map to calculate pace and time.
        </p>
      )}
    </div>
  );
};

export default PaceCalculator;
