import React,
import useReportData from '../hooks/useReportData';
 { useState, useEffect, useMemo } from 'react';
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

export default function EmailReport() {
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
    getMonthKey,
    getYearKey,
    getMonths,
    getYears,
    fetchData
  } = useReportData(id, 'email');

  const calculateReportData = () => {
    const periods = viewMode === 'month' ? getMonths() : getYears();
    const data = {};

    periods.forEach(period => {
      data[period] = {
        emailsSent: 0,
        noReply: 0,
        notInterested: 0,
        outOfOffice: 0,
        meetingProposed: 0,
        meetingScheduled: 0,
        interested: 0,
        wrongPerson: 0,
        bounce: 0,
        optOut: 0,
        meetingCompleted: 0,
        totalResponses: 0,
        responseRate: 0,
        openRate: 0,
        clickRate: 0
      };
    });

    // Calculate emails sent (total email activities)
    activities.forEach(activity => {
      if (activity.createdAt) {
        const period = viewMode === 'month' 
          ? getMonthKey(activity.createdAt) 
          : getYearKey(activity.createdAt);
        if (data[period]) {
          data[period].emailsSent++;
        }
      }
    });

    // Calculate metrics by status
    activities.forEach(activity => {
      if (activity.createdAt && activity.status) {
        const period = viewMode === 'month' 
          ? getMonthKey(activity.createdAt) 
          : getYearKey(activity.createdAt);
        if (!data[period]) return;

        switch (activity.status) {
          case 'No Reply':
            data[period].noReply++;
            break;
          case 'Not Interested':
            data[period].notInterested++;
            data[period].totalResponses++;
            break;
          case 'Out of Office':
            data[period].outOfOffice++;
            data[period].totalResponses++;
            break;
          case 'Meeting Proposed':
            data[period].meetingProposed++;
            data[period].totalResponses++;
            break;
          case 'Meeting Scheduled':
            data[period].meetingScheduled++;
            data[period].totalResponses++;
            break;
          case 'Interested':
            data[period].interested++;
            data[period].totalResponses++;
            break;
          case 'Wrong Person':
            data[period].wrongPerson++;
            data[period].totalResponses++;
            break;
          case 'Bounce':
            data[period].bounce++;
            break;
          case 'Opt-Out':
            data[period].optOut++;
            data[period].totalResponses++;
            break;
          case 'Meeting Completed':
            data[period].meetingCompleted++;
            data[period].totalResponses++;
            break;
        }
      }
    });

    // Calculate response rate and other metrics
    periods.forEach(period => {
      if (data[period].emailsSent > 0) {
        data[period].responseRate = ((data[period].totalResponses / data[period].emailsSent) * 100).toFixed(1);
      }
    });

    setReportData(data);
  };

  const metrics = [
    { key: 'emailsSent', label: 'Emails Sent', section: 'Email Activity', bold: true },
    { key: 'noReply', label: 'No Reply', section: 'Email Activity', bold: false },
    { key: 'notInterested', label: 'Not Interested', section: 'Email Activity', bold: false },
    { key: 'outOfOffice', label: 'Out of Office', section: 'Email Activity', bold: false },
    { key: 'meetingProposed', label: 'Meeting Proposed', section: 'Email Activity', bold: true, highlight: true },
    { key: 'meetingScheduled', label: 'Meeting Scheduled', section: 'Email Activity', bold: true, highlight: true },
    { key: 'interested', label: 'Interested', section: 'Email Activity', bold: true, highlight: true },
    { key: 'wrongPerson', label: 'Wrong Person', section: 'Email Activity', bold: false },
    { key: 'bounce', label: 'Bounce', section: 'Email Activity', bold: false },
    { key: 'optOut', label: 'Opt-Out', section: 'Email Activity', bold: false },
    { key: 'meetingCompleted', label: 'Meeting Completed', section: 'Email Activity', bold: true, highlight: true, highlightDark: true },
    { key: 'totalResponses', label: 'Total Responses', section: 'Email Activity', bold: true },
    { key: 'responseRate', label: 'Response Rate (%)', section: 'Email Activity', bold: true, isPercentage: true }
  ];

  const periods = viewMode === 'month' ? getMonths() : getYears();

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = periods;
    
    return {
      emailFunnel: {
        labels,
        datasets: [
          {
            label: 'Emails Sent',
            data: labels.map(period => reportData[period]?.emailsSent || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Total Responses',
            data: labels.map(period => reportData[period]?.totalResponses || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      responseBreakdown: {
        labels,
        datasets: [
          {
            label: 'No Reply',
            data: labels.map(period => reportData[period]?.noReply || 0),
            backgroundColor: 'rgba(156, 163, 175, 0.8)',
          },
          {
            label: 'Not Interested',
            data: labels.map(period => reportData[period]?.notInterested || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          },
          {
            label: 'Interested',
            data: labels.map(period => reportData[period]?.interested || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
          {
            label: 'Meeting Proposed',
            data: labels.map(period => reportData[period]?.meetingProposed || 0),
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
          },
          {
            label: 'Meeting Scheduled',
            data: labels.map(period => reportData[period]?.meetingScheduled || 0),
            backgroundColor: 'rgba(6, 182, 212, 0.8)',
          }
        ]
      },
      meetingPipeline: {
        labels,
        datasets: [
          {
            label: 'Meeting Proposed',
            data: labels.map(period => reportData[period]?.meetingProposed || 0),
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
          },
          {
            label: 'Meeting Scheduled',
            data: labels.map(period => reportData[period]?.meetingScheduled || 0),
            backgroundColor: 'rgba(6, 182, 212, 0.8)',
          },
          {
            label: 'Meeting Completed',
            data: labels.map(period => reportData[period]?.meetingCompleted || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          }
        ]
      },
      responseRate: {
        labels,
        datasets: [
          {
            label: 'Response Rate (%)',
            data: labels.map(period => Number.parseFloat(reportData[period]?.responseRate || 0)),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.4,
            fill: true,
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
    { id: 'funnel', type: 'line', title: 'Email Funnel', data: chartData.emailFunnel },
    { id: 'breakdown', type: 'bar', title: 'Response Breakdown', data: chartData.responseBreakdown, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Response Rate', data: chartData.responseRate }
  ];

  return (
    <ReportLayout 
      loading={loading}
      title="Email Report"
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
      emptyMessage="No email activities found for this project."
    />
  );
}
