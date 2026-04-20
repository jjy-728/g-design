import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import PrivateRoute from '@/components/PrivateRoute'
import Login from '@/pages/Login'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import NotFound from '@/pages/NotFound'
import Forbidden from '@/pages/Forbidden'
import AIQuestionGenerator from '@/pages/teacher/AIQuestionGenerator'
import QuestionBank from '@/pages/teacher/QuestionBank'
import ExamGenerator from '@/pages/teacher/ExamGenerator'
import GradingList from '@/pages/teacher/GradingList'
import GradingDetail from '@/pages/teacher/GradingDetail'
import ExamList from '@/pages/student/ExamList'
import ExamNotice from '@/pages/student/ExamNotice'
import TakeExam from '@/pages/student/TakeExam'
import ExamResult from '@/pages/student/ExamResult'
import ExamHistory from '@/pages/student/ExamHistory'
import UserManagement from '@/pages/admin/UserManagement'
import ClassManagement from '@/pages/admin/ClassManagement'

const AppRoutes = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="teacher">
              <Route 
                path="ai-generate" 
                element={
                  <PrivateRoute requiredRole="teacher">
                    <AIQuestionGenerator />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="question-bank" 
                element={
                  <PrivateRoute requiredRole="teacher">
                    <QuestionBank />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="exam-generator" 
                element={
                  <PrivateRoute requiredRole="teacher">
                    <ExamGenerator />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="grading" 
                element={
                  <PrivateRoute requiredRole="teacher">
                    <GradingList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="grading/:recordId" 
                element={
                  <PrivateRoute requiredRole="teacher">
                    <GradingDetail />
                  </PrivateRoute>
                } 
              />
            </Route>
            
            <Route path="student">
              <Route 
                path="exams" 
                element={
                  <PrivateRoute requiredRole="student">
                    <ExamList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="exam-notice/:examId" 
                element={
                  <PrivateRoute requiredRole="student">
                    <ExamNotice />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="take-exam/:recordId" 
                element={
                  <PrivateRoute requiredRole="student">
                    <TakeExam />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="exam-result/:recordId" 
                element={
                  <PrivateRoute requiredRole="student">
                    <ExamResult />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="history" 
                element={
                  <PrivateRoute requiredRole="student">
                    <ExamHistory />
                  </PrivateRoute>
                } 
              />
            </Route>
            
            <Route path="admin">
              <Route 
                path="users" 
                element={
                  <PrivateRoute requiredRole="admin">
                    <UserManagement />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="classes" 
                element={
                  <PrivateRoute requiredRole="admin">
                    <ClassManagement />
                  </PrivateRoute>
                } 
              />
            </Route>
          </Route>
          
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  )
}

export default AppRoutes
