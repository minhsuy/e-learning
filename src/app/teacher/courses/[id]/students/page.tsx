'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { TeacherCourseItem } from '@/types/course';
import { CourseStudentItem } from '@/types/enrollment';
import { courseService } from '@/services/course.service';
import { enrollmentService } from '@/services/enrollment.service';
import { StudentsHeader } from '@/components/teacher/students/students-header';
import { StudentTable } from '@/components/teacher/students/student-table';
import { StudentDetailModal } from '@/components/teacher/students/student-detail-modal';
import { StudentRemoveModal } from '@/components/teacher/students/student-remove-modal';
import { AppApiError } from '@/types/api';

export default function TeacherCourseStudentsPage() {
  const params = useParams();
  const courseId = (params?.id as string) || '';

  // Data states
  const [course, setCourse] = useState<TeacherCourseItem | null>(null);
  const [students, setStudents] = useState<CourseStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCourseLoading, setIsCourseLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal states
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    student: CourseStudentItem | null;
  }>({
    isOpen: false,
    student: null,
  });

  const [removeModalState, setRemoveModalState] = useState<{
    isOpen: boolean;
    student: CourseStudentItem | null;
  }>({
    isOpen: false,
    student: null,
  });

  // Debounce search input (400ms) - only trigger when searchTerm differs from debouncedSearch
  useEffect(() => {
    if (searchTerm === debouncedSearch) return;

    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search term
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  // 1. Fetch Course details independently (does not block student roster table)
  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchCourseDetails = async () => {
      setIsCourseLoading(true);
      try {
        const courseData = await courseService.getTeacherCourseById(courseId, { signal: controller.signal });
        if (isMounted && courseData) {
          setCourse(courseData);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.warn('Failed to load course details for student roster:', err);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsCourseLoading(false);
        }
      }
    };

    fetchCourseDetails();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [courseId, reloadKey]);

  // 2. Fetch Students roster (runs immediately on mount and updates on page / debouncedSearch change)
  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await enrollmentService.getCourseStudents(
          courseId,
          {
            page,
            limit: 10,
            search: debouncedSearch.trim() || undefined,
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;

        if (res?.data) {
          const list = res.data.students || [];
          setStudents(list);
          setIsError(false);
          setErrorMessage('');

          if (res.data.pagination) {
            setPagination({
              page: res.data.pagination.page || page,
              limit: res.data.pagination.limit || 10,
              total: res.data.pagination.total ?? list.length,
              totalPages: res.data.pagination.totalPages || 1,
            });
          } else {
            setPagination({
              page,
              limit: 10,
              total: list.length,
              totalPages: 1,
            });
          }
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setIsError(true);
        if (err instanceof AppApiError) {
          if (err.statusCode === 403) {
            setErrorMessage('Bạn không có quyền quản lý danh sách học viên của khóa học này.');
          } else if (err.statusCode === 404) {
            setErrorMessage('Không tìm thấy khóa học yêu cầu.');
          } else {
            setErrorMessage(err.message);
          }
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải danh sách học viên.');
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [courseId, page, debouncedSearch, reloadKey]);

  // Calculate average progress
  const averageProgress = useMemo(() => {
    if (!students || students.length === 0) return 0;
    const totalProgress = students.reduce((sum, s) => sum + (s.progress || 0), 0);
    return Math.round(totalProgress / students.length);
  }, [students]);

  // Handlers
  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  };

  const handleViewDetail = (student: CourseStudentItem) => {
    setDetailModalState({ isOpen: true, student });
  };

  const handleRequestRemove = (student: CourseStudentItem) => {
    setRemoveModalState({ isOpen: true, student });
  };

  const handleRemoveSuccess = (removedUserId: string) => {
    // 1. Remove from local list immediately
    setStudents((prev) => prev.filter((s) => (s.userId || s.user?.id || s.user?._id) !== removedUserId));

    // 2. Decrement pagination total
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));

    // 3. Decrement course sold count locally
    setCourse((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sold: Math.max(0, (prev.sold || 0) - 1),
      };
    });

    // 4. Trigger reload
    setReloadKey((prev) => prev + 1);
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <StudentsHeader
        course={course}
        courseId={courseId}
        totalStudents={pagination.total}
        averageProgress={averageProgress}
        isLoading={isCourseLoading}
        onRefresh={handleRefresh}
      />

      {/* Main Students Table & Toolbar */}
      <StudentTable
        students={students}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        onViewDetail={handleViewDetail}
        onRemoveStudent={handleRequestRemove}
      />

      {/* Student Enrollment Detail Modal */}
      <StudentDetailModal
        isOpen={detailModalState.isOpen}
        student={detailModalState.student}
        courseId={courseId}
        courseTitle={course?.title}
        onClose={() => setDetailModalState({ isOpen: false, student: null })}
        onRequestRemove={handleRequestRemove}
      />

      {/* Remove Student Confirmation Modal */}
      <StudentRemoveModal
        isOpen={removeModalState.isOpen}
        student={removeModalState.student}
        courseId={courseId}
        courseTitle={course?.title}
        onClose={() => setRemoveModalState({ isOpen: false, student: null })}
        onSuccess={handleRemoveSuccess}
      />
    </div>
  );
}
