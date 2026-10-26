# TMdemy Design Screen Registry

> Source of truth for Stitch MCP → Frontend implementation.
> Project: tmdemy
> Stitch Project ID: 4018234784417032182

---

## Screen Registry

| # | Canonical Name | Display Title | Route | Stitch Screen ID | Type |
|---|---|---|---|---|---|
| 1 | Dashboard | Tổng quan học tập | `/dashboard` | `4a6b385f44c243ba937bfc396c9b0912` | UI |
| 2 | CourseListing | Khám phá khóa học | `/courses` | `79651dd67a79478bacd965e246803bd0` | UI |
| 3 | CourseDetail | Chi tiết khóa học React & Next.js | `/courses/[slug]` | `6c8b2108257c49a1b863fbd490201d75` | UI |
| 4 | Classroom | Giao diện phòng học | `/learn/[slug]` | `9d741fb3bb414d2691c907601bfdcc5a` | UI |
| 5 | LearningRoadmap | Lộ trình học tập | `/roadmap` | `88545ce5d79944d38e9ff1b436ff3c94` | UI |
| 6 | Leaderboard | Bảng xếp hạng học tập | `/leaderboard` | `9808f99266bf46f89abb6879f7cdeb25` | UI |
| 7 | Messages | Tin nhắn trao đổi | `/messages` | `b0c87c1efcdc4d25b529ee127731e534` | UI |
| 8 | Certificates | Chứng chỉ & Thành tích | `/certificates` | `866e5a3899714a54adacdd60c7c451a9` | UI |
| 9 | Profile | Hồ sơ cá nhân | `/profile` | `1e0965a4f438477ab394df5d31dba081` | UI |
| 10 | Settings | Cài đặt tài khoản & Bảo mật | `/settings` | `6aa94b8fb5af49b5967be9e560649bd1` | UI |
| 11 | Login | Đăng nhập | `/login` | `e1ad747da114430bab07b56a782feb94` | UI |
| 12 | Register | Đăng ký tài khoản | `/register` | `f98b4b44bf334ff69a0dde29f7de923e` | UI |
| 13 | DesignHandoff | Design Handoff & Technical Specs | — | `7a87de545e134774934d85790535e48b` | DOC |
| 14 | DeveloperScreenRegistry | Stitch MCP Developer Screen Registry | — | `b6ea7ee802324b779fef7f9997bbb4dc` | DOC |
| 15 | MyCourses | Khóa học của tôi | `/my-courses` | `0e1bbe5527414aba9006c854092ebf25` | UI |

---

## Stitch Project

- Project name: `tmdemy`
- Project ID: `4018234784417032182`
- Design system: TMdemy
- Primary color: `#9564DD`

---

## Implementation Rules

### 1. Stitch is the UI source of truth

When implementing a screen:

1. Find the corresponding Stitch screen using its canonical name.
2. Retrieve the Stitch screen through MCP.
3. Analyze the existing project structure.
4. Reuse existing components whenever possible.
5. Implement the screen according to Stitch.
6. Do not redesign unrelated screens.

### 2. Canonical names

Always refer to screens using their canonical name:

- `Dashboard`
- `CourseListing`
- `CourseDetail`
- `Classroom`
- `LearningRoadmap`
- `Leaderboard`
- `Messages`
- `Certificates`
- `Profile`
- `Settings`
- `Login`
- `Register`
- `MyCourses`

Do not invent alternative names such as:

- `DashboardPage`
- `CoursePage`
- `CourseDetailPage`
- `MyDashboard`
- `UserProfilePage`

unless required by the existing codebase.

### 3. Implementation request format

Recommended prompt:

> Use Stitch MCP.
>
> Find the Stitch screen with canonical name `CourseDetail`.
>
> Implement it in the existing Next.js application.
>
> Route: `/courses/[slug]`
>
> Reuse existing components, API services, authentication and data models.
>
> Match the Stitch design closely.
>
> Do not modify unrelated screens.

---

## Screen → Route Mapping

```text
Dashboard          → /dashboard
CourseListing      → /courses
CourseDetail       → /courses/[slug]
Classroom          → /learn/[slug]
LearningRoadmap    → /roadmap
Leaderboard        → /leaderboard
Messages           → /messages
Certificates       → /certificates
Profile            → /profile
Settings           → /settings
Login              → /login
Register           → /register
MyCourses          → /my-courses