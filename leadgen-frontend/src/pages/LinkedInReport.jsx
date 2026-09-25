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

export default function LinkedInReport() {
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
  } = useReportData(id, 'linkedin');
const calculateReportData = () => {
    const periods = viewMode === 'month' ? getMonths() : getYears();
    const data = {};

    periods.forEach(period => {
      data[period] = {
        dataResearch: 0,
        connectionRequestSent: 0,
        connectionAccepted: 0,
        firstMessageSent: 0,
        followupMessagesSent: 0,
        existingConnection: 0,
        conversationsInProgress: 0,
        meetingProposed: 0,
        meetingScheduled: 0,
        meetingCompleted: 0
      };
    });

    // Calculate Data Research manually (contacts added in that period)
    contacts.forEach(contact => {
      if (contact.createdAt) {
        const period = viewMode === 'month' ? getMonthKey(contact.createdAt) : getYearKey(contact.createdAt);
        if (data[period]) {
          data[period].dataResearch++;
        }
      }
    });

    // Group activities by contact
    const contactActivities = {};
    activities.forEach(activity => {
      if (!activity.createdAt) return;
      const contactId = activity.contactId?.toString() || 'unknown';

      if (!contactActivities[contactId]) {
        contactActivities[contactId] = [];
      }
      contactActivities[contactId].push(activity);
    });

    // Calculate metrics per period
    activities.forEach(activity => {
      // Use activity-specific date (linkedinDate) if available, otherwise use createdAt
      const activityDate = activity.linkedinDate ? new Date(activity.linkedinDate) : 
                          (activity.createdAt ? new Date(activity.createdAt) : null);
      if (!activityDate) return;
      
      const period = viewMode === 'month' ? getMonthKey(activityDate) : getYearKey(activityDate);
      if (!data[period]) return;

      // Connection Request Sent
      // Include activities with lnRequestSent === 'Yes' OR introduction-message template
      const template = activity.template?.trim() || '';
      if (activity.lnRequestSent === 'Yes' || template === 'introduction-message') {
        data[period].connectionRequestSent++;
      }

      // Existing Connection
      if (activity.lnRequestSent === 'Existing Connect') {
        data[period].existingConnection++;
      }

      // Connection Accepted
      if (activity.connected === 'Yes') {
        data[period].connectionAccepted++;
      }

      // Status-based metrics (count activities with these statuses)
      if (activity.status === 'CIP') {
        data[period].conversationsInProgress++;
      } else if (activity.status === 'Meeting Proposed') {
        data[period].meetingProposed++;
      } else if (activity.status === 'Meeting Scheduled') {
        data[period].meetingScheduled++;
      } else if (activity.status === 'Meeting Completed') {
        data[period].meetingCompleted++;
      }
    });

    // Calculate First Message Sent and Followup Messages based on template
    // Count unique prospects (contacts) per period, not total activities
    const firstMessageSentByPeriod = {};
    const followupMessagesSentByPeriod = {};
    
    activities.forEach(activity => {
      // Use activity-specific date (linkedinDate) if available, otherwise use createdAt
      const activityDate = activity.linkedinDate ? new Date(activity.linkedinDate) : 
                          (activity.createdAt ? new Date(activity.createdAt) : null);
      if (!activityDate) return;
      
      const period = viewMode === 'month' ? getMonthKey(activityDate) : getYearKey(activityDate);
      if (!data[period]) return;

      // Initialize Sets for this period if not exists
      if (!firstMessageSentByPeriod[period]) {
        firstMessageSentByPeriod[period] = new Set();
      }
      if (!followupMessagesSentByPeriod[period]) {
        followupMessagesSentByPeriod[period] = new Set();
      }

      // Get contactId for unique prospect counting
      const contactId = activity.contactId?.toString() || 'unknown';
      
      // First Message Sent - count unique prospects with introduction-message template
      // Check template field (handle empty string, null, undefined)
      const template = activity.template?.trim() || '';
      if (template === 'introduction-message') {
        firstMessageSentByPeriod[period].add(contactId);
      }
      
      // Followup Messages Sent - count unique prospects with follow-up-message template
      if (template === 'follow-up-message') {
        followupMessagesSentByPeriod[period].add(contactId);
      }
    });
    
    // Update data with unique prospect counts
    Object.keys(data).forEach(period => {
      if (firstMessageSentByPeriod[period]) {
        data[period].firstMessageSent = firstMessageSentByPeriod[period].size;
      }
      if (followupMessagesSentByPeriod[period]) {
        data[period].followupMessagesSent = followupMessagesSentByPeriod[period].size;
      }
    });

    setReportData(data);
  };

  const metrics = [
    { key: 'dataResearch', label: 'Data Research manually', section: 'DRA' },
    { key: 'connectionRequestSent', label: 'Connection Request Sent', section: 'DRA' },
    { key: 'connectionAccepted', label: 'Connection Accepted', section: 'DRA' },
    { key: 'firstMessageSent', label: 'First Message Sent', section: 'DRA' },
    { key: 'followupMessagesSent', label: 'Followup Messages sent', section: 'DRA' },
    { key: 'existingConnection', label: 'Existing Connection', section: 'Linked IN' },
    { key: 'conversationsInProgress', label: 'Conversations in Progress', section: 'Linked IN', highlight: true },
    { key: 'meetingProposed', label: 'Meeting Proposed', section: 'Linked IN', highlight: true },
    { key: 'meetingScheduled', label: 'Meeting Scheduled', section: 'Linked IN', highlight: true },
    { key: 'meetingCompleted', label: 'Meeting Completed', section: 'Linked IN', highlight: true }
  ];

  const periods = viewMode === 'month' ? getMonths() : getYears();

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = periods;
    
    return {
      connectionFunnel: {
        labels,
        datasets: [
          {
            label: 'Connection Request Sent',
            data: labels.map(period => reportData[period]?.connectionRequestSent || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Connection Accepted',
            data: labels.map(period => reportData[period]?.connectionAccepted || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      messageActivity: {
        labels,
        datasets: [
          {
            label: 'First Message Sent',
            data: labels.map(period => reportData[period]?.firstMessageSent || 0),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Followup Messages',
            data: labels.map(period => reportData[period]?.followupMessagesSent || 0),
            borderColor: 'rgb(236, 72, 153)',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.4,
            fill: true,
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
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: 'Meeting Completed',
            data: labels.map(period => reportData[period]?.meetingCompleted || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          }
        ]
      },
      conversationsStatus: {
        labels,
        datasets: [
          {
            label: 'Conversations in Progress',
            data: labels.map(period => reportData[period]?.conversationsInProgress || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
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
    { id: 'funnel', type: 'line', title: 'LinkedIn Funnel', data: chartData.linkedInFunnel },
    { id: 'breakdown', type: 'bar', title: 'Response Breakdown', data: chartData.responseBreakdown, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Response Rate', data: chartData.responseRate }
  ];

  return (
    <ReportLayout 
      loading={loading}
      title="LinkedIn Report"
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
      emptyMessage="No linkedin activities found for this project."
    />
  );
}
