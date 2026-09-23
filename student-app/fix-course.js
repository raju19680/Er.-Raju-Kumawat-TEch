const fs = require('fs');

let content = fs.readFileSync('src/components/student-portal/course/course-components.tsx', 'utf8');

// Fix interfaces
content = content.replace('export interface  {\r\n  id: string\r\n  title: string\r\n  type: string', 'export interface Lesson {\r\n  id: string\r\n  title: string\r\n  type: string');
content = content.replace('export interface  {\n  id: string\n  title: string\n  type: string', 'export interface Lesson {\n  id: string\n  title: string\n  type: string');

content = content.replace('export interface  {\r\n  id: string\r\n  title: string\r\n  description: string | null\r\n  sortOrder: number\r\n  lessons: Lesson[]', 'export interface Module {\r\n  id: string\r\n  title: string\r\n  description: string | null\r\n  sortOrder: number\r\n  lessons: Lesson[]');
content = content.replace('export interface  {\n  id: string\n  title: string\n  description: string | null\n  sortOrder: number\n  lessons: Lesson[]', 'export interface Module {\n  id: string\n  title: string\n  description: string | null\n  sortOrder: number\n  lessons: Lesson[]');

content = content.replace('export interface  {\r\n  id: string\r\n  title: string\r\n  description: string | null\r\n  thumbnail: string | null\r\n  demoVideo: string | null', 'export interface CourseData {\r\n  id: string\r\n  title: string\r\n  description: string | null\r\n  thumbnail: string | null\r\n  demoVideo: string | null');
content = content.replace('export interface  {\n  id: string\n  title: string\n  description: string | null\n  thumbnail: string | null\n  demoVideo: string | null', 'export interface CourseData {\n  id: string\n  title: string\n  description: string | null\n  thumbnail: string | null\n  demoVideo: string | null');

content = content.replace('export interface  {\r\n  totalLessons: number\r\n  completedLessons: number', 'export interface CourseStats {\r\n  totalLessons: number\r\n  completedLessons: number');
content = content.replace('export interface  {\n  totalLessons: number\n  completedLessons: number', 'export interface CourseStats {\n  totalLessons: number\n  completedLessons: number');

content = content.replace('export interface  {\r\n  status: string\r\n  completedAt: string | null', 'export interface ProgressEntry {\r\n  status: string\r\n  completedAt: string | null');
content = content.replace('export interface  {\n  status: string\n  completedAt: string | null', 'export interface ProgressEntry {\n  status: string\n  completedAt: string | null');

// Fix functions
content = content.replace('export function ({', 'export function LessonContent({');
content = content.replace('export function (duration: number)', 'export function formatDuration(duration: number)');
content = content.replace('export function (type: string)', 'export function getLessonIcon(type: string)');
content = content.replace('export function (type: string)', 'export function getLessonTypeLabel(type: string)');

fs.writeFileSync('src/components/student-portal/course/course-components.tsx', content);
console.log('Fixed course-components');
