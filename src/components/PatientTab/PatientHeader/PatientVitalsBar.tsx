import React, { memo } from 'react';
import { Activity, Heart, Thermometer, Weight, Gauge } from 'lucide-react';
import type { PatientVitals } from '../../../types/patient';

interface PatientVitalsBarProps {
  vitals: PatientVitals | null;
  isLoading: boolean;
}

const PatientVitalsBar: React.FC<PatientVitalsBarProps> = memo(({ vitals, isLoading }) => {
  if (isLoading) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
        <div className="animate-pulse flex space-x-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1">
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-24 mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-6 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const vitalItems = [
    {
      icon: Activity,
      label: 'Blood Pressure',
      value: vitals?.blood_pressure || '--/--',
      unit: 'mmHg',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Heart,
      label: 'Heart Rate',
      value: vitals?.heart_rate || '--',
      unit: 'bpm',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      icon: Thermometer,
      label: 'Temperature',
      value: vitals?.temperature ? vitals.temperature.toFixed(1) : '--',
      unit: '°F',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      icon: Weight,
      label: 'Weight',
      value: vitals?.weight ? vitals.weight.toFixed(1) : '--',
      unit: 'kg',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Gauge,
      label: 'BMI',
      value: vitals?.bmi ? vitals.bmi.toFixed(1) : '--',
      unit: '',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
      <div className="grid grid-cols-5 gap-6">
        {vitalItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="text-lg font-bold text-[#0A2647] dark:text-gray-100">
                  {item.value}
                  {item.value !== '--' && item.unit && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                      {item.unit}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {vitals && vitals.recorded_date && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
          Last recorded: {new Date(vitals.recorded_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
});

PatientVitalsBar.displayName = 'PatientVitalsBar';

export default PatientVitalsBar;
