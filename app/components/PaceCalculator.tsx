'use client';

import { useState } from 'react';
import { usePaceCalculator } from '../hooks/usePaceCalculator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';

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
    <Card>
      <CardHeader>
        <CardTitle>Pace Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        {distance > 0 ? (
          <>
            <div className='mb-4'>
              <p className='text-lg font-medium'>
                Distance: {distance.toFixed(2)} km
              </p>
            </div>

            <div className='mb-4'>
              <Label className='block text-sm font-medium mb-1'>
                Calculate:
              </Label>
              <RadioGroup
                defaultValue={calculationType}
                onValueChange={(value) =>
                  setCalculationType(value as 'time' | 'pace')
                }
                className='flex gap-4'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='time' id='time' />
                  <Label htmlFor='time'>Time</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='pace' id='pace' />
                  <Label htmlFor='pace'>Pace</Label>
                </div>
              </RadioGroup>
            </div>

            {calculationType === 'time' ? (
              <div className='mb-4'>
                <Label
                  htmlFor='pace-input'
                  className='block text-sm font-medium mb-1'
                >
                  Pace (min:sec/km):
                </Label>
                <Input
                  id='pace-input'
                  type='text'
                  className='w-full'
                  placeholder='5:30/km'
                  value={formattedPace}
                  onChange={handlePaceChange}
                />
              </div>
            ) : (
              <div className='mb-4'>
                <Label
                  htmlFor='time-input'
                  className='block text-sm font-medium mb-1'
                >
                  Time (hh:mm:ss):
                </Label>
                <Input
                  id='time-input'
                  type='text'
                  className='w-full'
                  placeholder='00:30:00'
                  value={formattedTime}
                  onChange={handleTimeChange}
                />
              </div>
            )}

            <Button onClick={handleCalculate} className='w-full'>
              Calculate {calculationType === 'time' ? 'Time' : 'Pace'}
            </Button>

            <div className='mt-4 p-4 bg-muted rounded-md'>
              <h3 className='text-lg font-medium mb-2'>Results:</h3>
              <p>Time: {formattedTime}</p>
              <p>Pace: {formattedPace}</p>
            </div>
          </>
        ) : (
          <p className='text-muted-foreground'>
            Draw a route on the map to calculate pace and time.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaceCalculator;
