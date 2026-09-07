import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CampaignMap } from './modes/ops/CampaignMap'
import { OpsDesk } from './modes/ops/OpsDesk'
import { LibraryHome } from './modes/library/LibraryMode'
import { QuizHome, QuizPlay } from './modes/quiz/QuizMode'
import { AppShell } from './ui/AppShell'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<CampaignMap />} />
          <Route path="ops/:levelId" element={<OpsDesk />} />
          <Route path="quiz" element={<QuizHome />} />
          <Route path="quiz/:quizId" element={<QuizPlay />} />
          <Route path="library" element={<LibraryHome />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
