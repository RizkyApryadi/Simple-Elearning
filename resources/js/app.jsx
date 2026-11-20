import "../css/app.css";
import "./bootstrap";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import { AdminLayout, RequireRole, StudentLayout } from "./components/layouts";
import Catalog from "./pages/student/Catalog";
import CourseDetail from "./pages/student/CourseDetail";
import LessonPlayer from "./pages/student/LessonPlayer";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminCourseList from "./pages/admin/CourseList";
import AdminCourseDetail from "./pages/admin/CourseDetail";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <ToastProvider>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        element={
                            <RequireRole role="admin" layout={AdminLayout} />
                        }
                    >
                        <Route
                            path="/admin"
                            element={<Navigate to="/admin/courses" replace />}
                        />
                        <Route
                            path="/admin/courses"
                            element={<AdminCourseList />}
                        />
                        <Route
                            path="/admin/courses/:courseId"
                            element={<AdminCourseDetail />}
                        />
                    </Route>

                    <Route
                        element={
                            <RequireRole
                                role="student"
                                layout={StudentLayout}
                            />
                        }
                    >
                        <Route path="/courses" element={<Catalog />} />
                        <Route
                            path="/courses/:courseId"
                            element={<CourseDetail />}
                        />
                        <Route
                            path="/courses/:courseId/lessons/:lessonId"
                            element={<LessonPlayer />}
                        />
                    </Route>

                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </ToastProvider>
    </BrowserRouter>,
);
