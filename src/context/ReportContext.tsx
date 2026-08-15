import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Report } from '../types';
import { generateReportContent, type GeneratedReportContent } from '../lib/reportGenerator';
import { userStorageGet, userStorageSet, getActiveUserId } from '../lib/userStorage';

interface ReportContextType {
  reports: Report[];
  addReport: (report: Report, content: GeneratedReportContent) => void;
  getReport: (id: string) => Report | undefined;
  getReportContent: (id: string) => GeneratedReportContent;
  deleteReport: (id: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Base keys — actual localStorage keys are: baseKey + "::" + userId
const KEY_REPORTS = 'insightai_user_reports_metadata';
const KEY_DETAILS = 'insightai_user_reports_details';

/** Load reports for the currently active user */
function loadForUser() {
  const reports = userStorageGet<Report[]>(KEY_REPORTS) ?? [];
  const reportDetails = userStorageGet<Record<string, GeneratedReportContent>>(KEY_DETAILS) ?? {};
  return { reports, reportDetails };
}

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(() => getActiveUserId());
  const [reports, setReports] = useState<Report[]>([]);
  const [reportDetails, setReportDetails] = useState<Record<string, GeneratedReportContent>>({});

  /** Reload all report data for the current user */
  const reloadForUser = useCallback(() => {
    const { reports: r, reportDetails: d } = loadForUser();
    setReports(r);
    setReportDetails(d);
  }, []);

  // Initial load
  useEffect(() => {
    reloadForUser();
  }, [reloadForUser]);

  // Re-load when the logged-in user changes (login / logout / switch account)
  useEffect(() => {
    const handleUserChange = () => {
      const newUserId = getActiveUserId();
      if (newUserId !== userId) {
        setUserId(newUserId);
        const { reports: r, reportDetails: d } = loadForUser();
        setReports(r);
        setReportDetails(d);
      }
    };

    window.addEventListener('insightai_user_updated', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    return () => {
      window.removeEventListener('insightai_user_updated', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, [userId]);

  // Persist reports metadata — scoped to the current user
  useEffect(() => {
    userStorageSet(KEY_REPORTS, reports);
  }, [reports]);

  // Persist report details — scoped to the current user
  useEffect(() => {
    userStorageSet(KEY_DETAILS, reportDetails);
  }, [reportDetails]);

  const addReport = (newReport: Report, content: GeneratedReportContent) => {
    setReports((prev) => [newReport, ...prev]);
    setReportDetails((prev) => ({
      ...prev,
      [newReport.id]: content,
    }));
  };

  const getReport = (id: string): Report | undefined => {
    return reports.find((r) => r.id === id);
  };

  const getReportContent = (id: string): GeneratedReportContent => {
    if (reportDetails[id]) {
      return reportDetails[id];
    }
    return {
      executiveSummary: ['No detailed summary available for this report.'],
      metrics: [],
      sections: [],
      recommendations: [],
    };
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    setReportDetails((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        addReport,
        getReport,
        getReportContent,
        deleteReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
