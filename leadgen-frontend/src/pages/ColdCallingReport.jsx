import React, { useState, useEffect, useMemo } from 'react';
import useReportData from '../hooks/useReportData';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { standardChartOptions as chartOptions } from '../utils/chartOptions';
import ReportLayout from '../components/reports/ReportLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ColdCallingReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    project,
    activities,
    contacts,
    loading,
    lastUpdated,
    viewMode,
    setViewMode,
    getDayKey,
    getMonthKey,
    getYearKey,
    getDays,
    getMonths,
    getYears,
    fetchData
  } = useReportData(id, 'call');
const calculateReportData = () => {
    const periods = viewMode === 'day' ? getDays() : getMonths();
    const data = {};

    periods.forEach(period => {
      data[period] = {
        // DRA Section
        dataAllocated: 0,
        interested: 0,
        notInterested: 0,
        ring: 0,
        busy: 0,
        hangUp: 0,
        callBack: 0,
        switchOff: 0,
        // Cold Calling Section
        detailsShared: 0,
        future: 0,
        invalid: 0,
        demoBooked: 0,
        followUps: 0,
        totalCalls: 0,
        freshCalls: 0
      };
    });

    // Calculate Data Allocated (contacts added in that period)
    contacts.forEach(contact => {
      if (contact.createdAt) {
        const period = viewMode === 'day' 
          ? getDayKey(new Date(contact.createdAt)) 
          : getMonthKey(new Date(contact.createdAt));
        if (data[period]) {
          data[period].dataAllocated++;
        }
      }
    });

    // Group activities by contact to track first calls vs follow-ups
    const contactFirstCalls = new Map();
    const contactActivitiesByPeriod = {};

    activities.forEach(activity => {
      const date = activity.callDate ? new Date(activity.callDate) : new Date(activity.createdAt);
      if (!date) return;

      const period = viewMode === 'day' ? getDayKey(date) : getMonthKey(date);
      if (!data[period]) return;

      const contactId = activity.contactId?.toString() || 'unknown';

      // Track first call per contact
      if (activity.callNumber === '1st call' && !contactFirstCalls.has(contactId)) {
        contactFirstCalls.set(contactId, period);
      }

      // Group activities by period and contact
      if (!contactActivitiesByPeriod[period]) {
        contactActivitiesByPeriod[period] = {};
      }
      if (!contactActivitiesByPeriod[period][contactId]) {
        contactActivitiesByPeriod[period][contactId] = [];
      }
      contactActivitiesByPeriod[period][contactId].push(activity);
    });

    // Calculate metrics per period
    activities.forEach(activity => {
      const date = activity.callDate ? new Date(activity.callDate) : new Date(activity.createdAt);
      if (!date) return;

      const period = viewMode === 'day' ? getDayKey(date) : getMonthKey(date);
      if (!data[period]) return;

      // Count by callStatus for DRA section
      if (activity.callStatus) {
        switch (activity.callStatus) {
          case 'Interested':
            data[period].interested++;
            break;
          case 'Not Interested':
            data[period].notInterested++;
            break;
          case 'Ring':
            data[period].ring++;
            break;
          case 'Busy':
            data[period].busy++;
            break;
          case 'Hang Up':
            data[period].hangUp++;
            break;
          case 'Call Back':
            data[period].callBack++;
            break;
          case 'Switch Off':
            data[period].switchOff++;
            break;
          case 'Details Shared':
            data[period].detailsShared++;
            break;
          case 'Future':
            data[period].future++;
            break;
          case 'Invalid':
            data[period].invalid++;
            break;
          case 'Demo Booked':
            data[period].demoBooked++;
            break;
        }
      }

      // Count total calls
      data[period].totalCalls++;
    });

    // Calculate Fresh Calls and Follow Ups
    Object.keys(contactActivitiesByPeriod).forEach(period => {
      const periodData = contactActivitiesByPeriod[period];
      let freshCalls = 0;
      let followUps = 0;

      Object.keys(periodData).forEach(contactId => {
        const contactActs = periodData[contactId];
        const firstCallPeriod = contactFirstCalls.get(contactId);

        contactActs.forEach(activity => {
          if (activity.callNumber === '1st call' || (firstCallPeriod === period && !activity.callNumber)) {
            freshCalls++;
          } else {
            followUps++;
          }
        });
      });

      if (data[period]) {
        data[period].freshCalls = freshCalls;
        data[period].followUps = followUps;
      }
    });

    setReportData(data);
  };

  const metrics = [
    // DRA Section
    { key: 'dataAllocated', label: 'Data Allocated', section: 'DRA', bold: false },
    { key: 'interested', label: 'Interested', section: 'DRA', bold: true },
    { key: 'notInterested', label: 'Not Interested', section: 'DRA', bold: true },
    { key: 'ring', label: 'Ring', section: 'DRA', bold: false },
    { key: 'busy', label: 'Busy', section: 'DRA', bold: false, highlight: true },
    { key: 'hangUp', label: 'Hang Up', section: 'DRA', bold: false },
    { key: 'callBack', label: 'Call Back', section: 'DRA', bold: false },
    { key: 'switchOff', label: 'Switch Off', section: 'DRA', bold: false },
    // Cold Calling Section
    { key: 'detailsShared', label: 'Detailed Shared', section: 'Cold Calling', bold: true, highlight: true },
    { key: 'future', label: 'Future', section: 'Cold Calling', bold: false },
    { key: 'invalid', label: 'Invalid', section: 'Cold Calling', bold: false },
    { key: 'demoBooked', label: 'Demo Booked', section: 'Cold Calling', bold: true, highlight: true, highlightDark: true },
    { key: 'followUps', label: 'Follow Ups', section: 'Cold Calling', bold: true },
    { key: 'totalCalls', label: 'Total Calls', section: 'Cold Calling', bold: true },
    { key: 'freshCalls', label: '(Fresh Calls + FollowUpS)', section: 'Cold Calling', bold: false, isFormula: true }
  ];

  const periods = viewMode === 'day' ? getDays() : getMonths();

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = periods;
    
    return {
      draMetrics: {
        labels,
        datasets: [
          {
            label: 'Interested',
            data: labels.map(period => reportData[period]?.interested || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Not Interested',
            data: labels.map(period => reportData[period]?.notInterested || 0),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      callStatusBreakdown: {
        labels,
        datasets: [
          {
            label: 'Ring',
            data: labels.map(period => reportData[period]?.ring || 0),
            backgroundColor: 'rgba(156, 163, 175, 0.8)',
          },
          {
            label: 'Busy',
            data: labels.map(period => reportData[period]?.busy || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: 'Call Back',
            data: labels.map(period => reportData[period]?.callBack || 0),
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
          }
        ]
      },
      coldCallingMetrics: {
        labels,
        datasets: [
          {
            label: 'Details Shared',
            data: labels.map(period => reportData[period]?.detailsShared || 0),
            borderColor: 'rgb(251, 191, 36)',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Demo Booked',
            data: labels.map(period => reportData[period]?.demoBooked || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      callVolume: {
        labels,
        datasets: [
          {
            label: 'Total Calls',
            data: labels.map(period => reportData[period]?.totalCalls || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
          {
            label: 'Fresh Calls',
            data: labels.map(period => reportData[period]?.freshCalls || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: 'Follow Ups',
            data: labels.map(period => reportData[period]?.followUps || 0),
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
          }
        ]
      }
    };
  }, [periods, reportData]);

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        stacked: true
      },
      y: {
        ...chartOptions.scales.y,
        stacked: true
      }
    }
  };

  const charts = [
    { id: 'funnel', type: 'line', title: 'Calling Funnel', data: chartData.callingFunnel },
    { id: 'outcomes', type: 'bar', title: 'Call Outcomes', data: chartData.callOutcomes, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Connection Rate', data: chartData.connectionRate }
  ];

  return (
    <ReportLayout 
      loading={loading}
      title="Cold Calling Report"
      project={project}
      navigate={navigate}
      backUrl={`/projects/${id}/funnel`}
      fetchData={fetchData}
      lastUpdated={lastUpdated}
      viewMode={viewMode}
      setViewMode={setViewMode}
      periods={periods}
      charts={charts}
      metrics={metrics}
      reportData={reportData}
      emptyMessage="No cold calling activities found for this project."
    />
  );
}
